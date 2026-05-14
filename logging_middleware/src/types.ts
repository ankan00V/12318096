export type Stack = "backend" | "frontend";

export type Level =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export interface LogPayload {
  stack: Stack;
  level: Level;
  package: string;
  message: string;
}