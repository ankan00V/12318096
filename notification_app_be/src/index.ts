import dotenv from 'dotenv';
import axios from 'axios';
import { Log } from '../../logging_middleware/src/logger';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://4.224.186.213';
const TOKEN = process.env.AUTH_TOKEN;

interface Notification {
  ID: string;
  Type: 'Placement' | 'Result' | 'Event';
  Message: string;
  Timestamp: string;
}


const typeWeights = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

async function fetchNotifications(): Promise<Notification[]> {
  const res = await axios.get(`${BASE_URL}/evaluation-service/notifications`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return res.data.notifications;
}

async function getPriorityInbox() {
  try {
    const notifications = await fetchNotifications();

    // Sorting logic: Weight descending, then Timestamp descending
    const sorted = notifications.sort((a, b) => {
      const weightA = typeWeights[a.Type];
      const weightB = typeWeights[b.Type];

      if (weightA !== weightB) {
        return weightB - weightA;
      }

      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    });

    const top10 = sorted.slice(0, 10);

    console.log('--- Priority Inbox (Top 10) ---');
    console.table(top10);

    // Logging the successful retrieval
    await Log(
      'backend',
      'info',
      'service',
      `Retrieved Priority Inbox. Count: ${top10.length}`
    );

  } catch (error: any) {
    console.error('Error fetching priority inbox:', error.message);
    await Log(
      'backend',
      'error',
      'service',
      `Priority Inbox failed: ${error.message}`
    );
  }
}

getPriorityInbox();
