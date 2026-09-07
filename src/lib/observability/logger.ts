export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface LogContext {
  service?: string;
  operation?: string;
  requestId?: string;
  userId?: string;
  userRole?: string;
  applicationId?: string;
  durationMs?: number;
  errorCategory?: string;
  [key: string]: unknown;
}

export interface StructuredLogEntry {
  timestamp: string;
  environment: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "nric",
  "mykad",
  "apikey",
  "api_key",
  "authorization",
  "privatekey",
  "private_key",
];

/**
 * Recursively masks sensitive fields in log payloads
 */
export function maskSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveFields);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      masked[key] = "********";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveFields(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * Emits structured JSON log entry formatted for Cloud Logging & Sentry ingestion
 */
export function logStructured(level: LogLevel, message: string, context?: LogContext): void {
  const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";
  const timestamp = new Date().toISOString();
  const safeContext = context ? (maskSensitiveFields(context) as Record<string, unknown>) : undefined;

  const entry: StructuredLogEntry = {
    timestamp,
    environment: env,
    level,
    message,
    context: safeContext,
  };

  const formatted = JSON.stringify(entry);

  switch (level) {
    case "CRITICAL":
    case "ERROR":
      console.error(formatted);
      break;
    case "WARN":
      console.warn(formatted);
      break;
    case "INFO":
      console.info(formatted);
      break;
    case "DEBUG":
    default:
      console.log(formatted);
      break;
  }
}

export function logInfo(message: string, context?: LogContext): void {
  logStructured("INFO", message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  logStructured("WARN", message, context);
}

export function logError(message: string, context?: LogContext): void {
  logStructured("ERROR", message, context);
}

export function logCritical(message: string, context?: LogContext): void {
  logStructured("CRITICAL", message, context);
}
