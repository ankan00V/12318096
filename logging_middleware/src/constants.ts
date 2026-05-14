import dotenv from "dotenv";

dotenv.config();

console.log(process.env.BASE_URL);

export const BASE_URL = process.env.BASE_URL || "";
export const AUTH_TOKEN = process.env.AUTH_TOKEN || "";