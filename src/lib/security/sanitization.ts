/**
 * Sanitizes untrusted text by stripping dangerous HTML tags and script injections
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
}

/**
 * Escapes HTML special characters for safe browser rendering
 */
export function escapeHtml(input: string): string {
  if (!input) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return input.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validates input for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  if (!input) return false;
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s+['"\d\w]+\s*=\s*['"\d\w]+/i,
    /'\s*OR\s*'1'\s*=\s*'1'/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}
