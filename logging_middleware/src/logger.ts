import axios from "axios";
import { BASE_URL, AUTH_TOKEN } from "./constants";
import { LogPayload } from "./types";

export const Log = async (
  stack: "backend" | "frontend",
  level: "debug" | "info" | "warn" | "error" | "fatal",
  packageName: string,
  message: string
) => {
  try {
    const payload: LogPayload = {
      stack,
      level,
      package: packageName,
      message
    };

    const response = await axios.post(
      `${BASE_URL}/evaluation-service/logs`,
      payload,
      {
        headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(error.response?.data || error.message);
  }
};