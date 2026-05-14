# Campus Hiring Evaluation - Backend Track

This repository contains the implementation of the Backend Track for the Campus Hiring Evaluation. The project consists of multiple microservices designed to handle vehicle maintenance scheduling and student notifications, all integrated with a centralized logging middleware.

## 📁 Repository Structure

- `logging_middleware/`: A reusable Node.js/TypeScript middleware for centralized logging.
- `vehicle_maintenance_scheduler/`: Microservice for optimizing vehicle maintenance tasks at depots using a greedy scheduling algorithm.
- `notification_app_be/`: Microservice for handling student notifications and the Priority Inbox feature.
- `notification_system_design.md`: Comprehensive system design documentation for the notification platform (Stages 1–5).
- `screenshots/`: Mandatory screenshots of API request/response cycles.

## 🚀 Microservices

### 1. Logging Middleware
The logging middleware is integrated into all backend services to provide real-time monitoring.
- **Endpoint**: `POST http://4.224.186.213/evaluation-service/logs`
- **Features**: Captures stack info, log levels, package context, and messages.

### 2. Vehicle Maintenance Scheduler
Solves the resource allocation problem to maximize operational impact.
- **Algorithm**: Greedy Heuristic for 0/1 Multiple Knapsack Problem.
- **Optimization**: Sorts tasks by Impact-to-Duration ratio for efficient depot utilization.

### 3. Campus Notifications & Priority Inbox
- **Priority Inbox**: Implements Stage 6 requirements by ranking notifications based on Type (`Placement` > `Result` > `Event`) and recency.
- **Design**: Detailed architecture in `notification_system_design.md` covering PostgreSQL schema, Redis caching, and RabbitMQ message queues.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Dependencies**: Axios, Dotenv, Express, ts-node-dev
- **Design Tools**: Mermaid.js (for diagrams)

## 📋 How to Run
1. Clone the repository.
2. Install dependencies in each folder: `npm install`.
3. Create a `.env` file in each microservice folder with your `AUTH_TOKEN`.
4. Run the services: `npm run dev`.

## 📸 Screenshots
Mandatory screenshots demonstrating the API functionality are located in the `/screenshots` directory.

---
*Note: This project was developed as part of a technical evaluation. All external API calls require a valid evaluation access token.*
