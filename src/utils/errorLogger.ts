/**
 * Centralized error logging.
 * In development the full error is printed for debugging.
 * In production only a generic, sanitized message is emitted so that
 * database schema names, stack traces or user data are never exposed
 * through the browser console.
 */
const SENSITIVE_PATTERNS: RegExp[] = [
  /relation "[^"]+"/gi,
  /table "[^"]+"/gi,
  /column "[^"]+"/gi,
  /https?:\/\/[^\s"']+/gi,
  /eyJ[A-Za-z0-9_-]{10,}/g,
];

function sanitize(message: string): string {
  return SENSITIVE_PATTERNS.reduce(
    (acc, re) => acc.replace(re, "[REDACTED]"),
    message,
  );
}

export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
    return;
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unexpected error";

  console.error(`[${context}] ${sanitize(raw)}`);
}
