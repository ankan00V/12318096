import dotenv from 'dotenv';
import axios from 'axios';
import { Log } from '../../logging_middleware/src/logger';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://4.224.186.213';
const TOKEN = process.env.AUTH_TOKEN;

interface Depot {
  ID: number;
  MechanicHours: number;
}

interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

async function fetchDepots(): Promise<Depot[]> {
  const res = await axios.get(`${BASE_URL}/evaluation-service/depots`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return res.data.depots;
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await axios.get(`${BASE_URL}/evaluation-service/vehicles`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return res.data.vehicles;
}

async function runScheduler() {
  try {
    const depots = await fetchDepots();
    const vehicles = await fetchVehicles();

    // Sort vehicles by Impact/Duration ratio descending
    vehicles.sort((a, b) => (b.Impact / b.Duration) - (a.Impact / a.Duration));

    const schedule: Record<number, string[]> = {};
    const depotRemainingCapacity: Record<number, number> = {};

    for (const depot of depots) {
      schedule[depot.ID] = [];
      depotRemainingCapacity[depot.ID] = depot.MechanicHours;
    }

    let totalImpact = 0;

    // Greedy allocation
    for (const vehicle of vehicles) {
      for (const depot of depots) {
        if (depotRemainingCapacity[depot.ID] >= vehicle.Duration) {
          schedule[depot.ID].push(vehicle.TaskID);
          depotRemainingCapacity[depot.ID] -= vehicle.Duration;
          totalImpact += vehicle.Impact;
          break;
        }
      }
    }

    console.log('--- Schedule Output ---');
    console.log(JSON.stringify(schedule, null, 2));
    console.log(`Total Scheduled Impact: ${totalImpact}`);
    
    // Using the logging middleware
    await Log(
      'backend',
      'info',
      'service',
      `Scheduler completed. Total Impact: ${totalImpact}`
    );

  } catch (error: any) {
    console.error('Error running scheduler:', error.message);
    await Log(
      'backend',
      'error',
      'service',
      `Scheduler failed: ${error.message}`
    );
  }
}

runScheduler();
