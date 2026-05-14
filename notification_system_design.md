# Notification System Design

## Stage 1: Requirement Analysis
For the notification platform, we need to support real-time delivery and reliable storage for students to view their notifications upon login.

### Core Actions
1. **Send Notification**: Triggered by system events (Placement, Result, Event).
2. **Fetch Notifications**: Paginated retrieval for students.
3. **Mark as Read**: Update the status of a specific notification.
4. **Real-time Delivery**: Instant push to active users.

### API Endpoints
- `POST /notifications/send`: Sends a notification to one or more students.
- `GET /notifications`: Retrieves notifications for the authenticated student.
- `PATCH /notifications/:id/read`: Marks a notification as read.

### Real-time Mechanism
I suggest using **WebSockets (Socket.io)** for real-time delivery. When a notification is saved to the database, the server emits a message to the specific student's socket ID if they are currently connected. For users who are offline, the notification will be available via the `GET /notifications` API when they next log in.

---

## Stage 2: High Level Design
### Persistent Storage
I recommend using a **Relational Database (PostgreSQL)**. 
**Reasoning**: Notifications for students require strict consistency and relational integrity (linking notifications to student IDs). PostgreSQL handles structured data efficiently and supports indexing which is crucial for performance as the volume grows.

### Database Schema
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE
);

CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT REFERENCES students(id),
    type notification_type,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Challenges with Scale
As data volume increases:
1. **Slow Queries**: Fetching unread notifications for a student will slow down as the table grows to millions of rows.
2. **Write Bottlenecks**: "Notify All" actions create massive write spikes.
3. **Storage Costs**: Storing historical notifications for years is expensive.

**Solutions**: 
- **Partitioning**: Partition the `notifications` table by `created_at` (e.g., monthly partitions).
- **Indexing**: Add composite indexes on `(student_id, is_read, created_at)`.
- **Archiving**: Move notifications older than 6 months to a cold storage or a NoSQL database like MongoDB for archival.

---

## Stage 3: Tech Stack & Tools
### Query Analysis
Query: `SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;`

- **Accuracy**: The query is accurate for fetching unread notifications.
- **Why it is slow**: Without proper indexing, the DB performs a full table scan of 5,000,000 rows to find those matching `studentID`.
- **Recommended Change**: Create a composite index:
  `CREATE INDEX idx_student_unread ON notifications (studentID, isRead, createdAt DESC);`
- **Cost**: The index will increase disk usage and slightly slow down writes, but will reduce the read complexity from O(N) to O(log N).
- **Index on every column?**: No, this is bad advice. Over-indexing increases storage, slows down `INSERT/UPDATE` operations as every index must be updated, and the query optimizer might get confused.

### Placement Notifications Query (Last 7 Days)
```sql
SELECT s.name, n.message, n.created_at
FROM notifications n
JOIN students s ON n.student_id = s.id
WHERE n.type = 'Placement' 
AND n.created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4: Low Level Design
### Performance Optimization
To solve the "overwhelmed DB" on each page load:
1. **Caching (Redis)**: Store the count of unread notifications and the first few notifications in Redis. 
   - *Tradeoff*: Increases complexity; requires cache invalidation logic.
2. **Read Replicas**: Direct read queries to a replica database.
   - *Tradeoff*: Potential replication lag (slight delay in seeing a new notification).
3. **Polling to Push**: Switch from frequent polling to a push-based model (WebSockets/SSE).
   - *Tradeoff*: Keeps an open connection which consumes server memory.

---

## Stage 5: API Documentation (Notify All)
### Shortcomings
1. **Synchronous execution**: The loop blocks the request. 50,000 emails could take minutes, causing a timeout.
2. **Partial Failures**: If the script crashes midway, we don't know who received the notification and who didn't.
3. **DB Pressure**: 50,000 sequential inserts is inefficient.

### Reliable Redesign
Use a **Message Queue (RabbitMQ/Kafka)**.
1. `Notify All` API pushes a single "Broadcast" message to the queue.
2. A background worker picks it up and:
   - Uses a **Bulk Insert** for the database (`save_to_db` in one or few chunks).
   - Uses an asynchronous email service with retries for failed emails.
3. **Separation**: Saving to DB and sending emails should be decoupled. Saving to DB is critical for the app's state; sending emails is a delivery mechanism that can happen asynchronously.

### Revised Pseudocode
```javascript
async function notify_all(student_ids, message) {
    // 1. Bulk insert notifications to DB
    await db.notifications.bulkCreate(
        student_ids.map(id => ({ student_id: id, message, type: 'Placement' }))
    );

    // 2. Queue email tasks
    for (const student_id of student_ids) {
        await emailQueue.add({ student_id, message }, { attempts: 3 });
    }
    
    // 3. Emit real-time signal via WebSockets
    io.emit('new_broadcast', { message });
}
```

---

## Stage 6: Implementation (Priority Inbox)
*See code in notification_app_be/priority_inbox.ts*
