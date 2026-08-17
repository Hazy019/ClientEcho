/**
 * ClientEcho Structured Server-side Logger
 * 
 * Provides unified, structured JSON logging with error normalization,
 * request context, severity levels, and hooks for error telemetry.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level?: LogLevel;
  route?: string;
  userId?: string;
  error?: any;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export function logEvent({
  message,
  level = "info",
  route,
  userId,
  error,
  metadata,
}: LogPayload) {
  const timestamp = new Date().toISOString();

  let formattedError: any = undefined;
  if (error) {
    if (error instanceof Error) {
      formattedError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === "object") {
      formattedError = error;
    } else {
      formattedError = { raw: String(error) };
    }
  }

  const structuredLog = {
    timestamp,
    level,
    message,
    ...(route ? { route } : {}),
    ...(userId ? { userId } : {}),
    ...(metadata ? { metadata } : {}),
    ...(formattedError ? { error: formattedError } : {}),
  };

  const jsonString = JSON.stringify(structuredLog);

  switch (level) {
    case "error":
      console.error(jsonString);
      break;
    case "warn":
      console.warn(jsonString);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(jsonString);
      }
      break;
    case "info":
    default:
      console.log(jsonString);
      break;
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) =>
    logEvent({ message, level: "info", metadata: meta }),
  warn: (message: string, meta?: Record<string, any>) =>
    logEvent({ message, level: "warn", metadata: meta }),
  error: (message: string, error?: any, meta?: Record<string, any>, route?: string) =>
    logEvent({ message, level: "error", error, metadata: meta, route }),
  debug: (message: string, meta?: Record<string, any>) =>
    logEvent({ message, level: "debug", metadata: meta }),
};
