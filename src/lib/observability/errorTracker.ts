import { logError, logWarn, type LogContext } from "./logger.ts";

export interface DiagnosticErrorReport {
  errorId: string;
  timestamp: string;
  category: "API_EXCEPTION" | "AI_EXTRACTION_FAILURE" | "GIS_FAILURE" | "CLIENT_REACT_ERROR" | "AUTH_FAILURE";
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userFacingMessage: string;
}

/**
 * Normalizes unknown error objects into clean diagnostic format
 */
export function normalizeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  if (typeof err === "string") {
    return { message: err };
  }
  return { message: String(err) };
}

/**
 * Handles API Route Exceptions and returns structured diagnostic summary
 */
export function captureApiException(err: unknown, reqContext?: LogContext): DiagnosticErrorReport {
  const { message, stack } = normalizeError(err);
  const errorId = `err-api-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  logError(`[API Exception] ${message}`, {
    errorId,
    errorCategory: "API_EXCEPTION",
    stack,
    ...reqContext,
  });

  return {
    errorId,
    timestamp: new Date().toISOString(),
    category: "API_EXCEPTION",
    message,
    stack,
    context: reqContext,
    userFacingMessage: "Ralat pada pelayan semasa memproses permintaan.",
  };
}

/**
 * Wraps AI & Document AI pipeline extraction failures safely
 */
export function captureAiPipelineError(
  err: unknown,
  documentId: string,
  applicationId: string
): DiagnosticErrorReport {
  const { message, stack } = normalizeError(err);
  const errorId = `err-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  logWarn(`[AI Pipeline Warn/Fallback] ${message}`, {
    errorId,
    errorCategory: "AI_EXTRACTION_FAILURE",
    documentId,
    applicationId,
    stack,
  });

  return {
    errorId,
    timestamp: new Date().toISOString(),
    category: "AI_EXTRACTION_FAILURE",
    message,
    stack,
    context: { documentId, applicationId },
    userFacingMessage: "Ekstraksi AI menggunakan pemproses pembangunan tempatan kerana perkhidmatan awan tidak tersedia.",
  };
}

/**
 * Captures React client-side rendering or runtime exceptions
 */
export function captureClientError(err: unknown, componentName: string): DiagnosticErrorReport {
  const { message, stack } = normalizeError(err);
  const errorId = `err-client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  logError(`[Client Error] ${componentName}: ${message}`, {
    errorId,
    errorCategory: "CLIENT_REACT_ERROR",
    componentName,
    stack,
  });

  return {
    errorId,
    timestamp: new Date().toISOString(),
    category: "CLIENT_REACT_ERROR",
    message,
    stack,
    context: { componentName },
    userFacingMessage: "Ralat paparan antaramuka. Sila muat semula halaman.",
  };
}
