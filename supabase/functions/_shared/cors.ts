// Restricted CORS: only allow the app's own origins instead of "*".
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.dev$/i,
  /^http:\/\/localhost(:\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/i,
];

const EXTRA_ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (EXTRA_ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (isAllowedOrigin(origin)) {
    return { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin as string };
  }
  // Unknown origin: no ACAO header is returned, so browsers block the response.
  return { ...BASE_HEADERS };
}
