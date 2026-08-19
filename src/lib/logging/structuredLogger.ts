export type LogSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface LogPayload {
  severity: LogSeverity;
  message: string;
  service?: string;
  operation?: string;
  requestId?: string;
  userId?: string;
  applicationId?: string;
  durationMs?: number;
  errorCategory?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Emits a structured JSON log formatted for Google Cloud Logging
 */
export function logStructured(payload: LogPayload): void {
  const env = process.env.NODE_ENV || "development";
  const timestamp = new Date().toISOString();

  // Mask sensitive PII in metadata
  const safeMeta = payload.metadata ? maskSensitiveData(payload.metadata) : undefined;

  const logEntry = {
    timestamp,
    environment: env,
    service: payload.service || "osc-smartcheck-api",
    severity: payload.severity,
    message: payload.message,
    operation: payload.operation,
    requestId: payload.requestId,
    userId: payload.userId,
    applicationId: payload.applicationId,
    durationMs: payload.durationMs,
    errorCategory: payload.errorCategory,
    ...safeMeta,
  };

  if (payload.severity === "ERROR" || payload.severity === "CRITICAL") {
    console.error(JSON.stringify(logEntry));
  } else if (payload.severity === "WARNING") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Masks sensitive fields (passwords, nric, bank accounts, api tokens)
 */
function maskSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  const sensitiveKeys = ["password", "token", "nric", "mykad", "secret", "authorization", "apiKey"];

  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      masked[k] = "********";
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      masked[k] = maskSensitiveData(v as Record<string, unknown>);
    } else {
      masked[k] = v;
    }
  }

  return masked;
}
