const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10);
const CLEANUP_INTERVAL_MS = 300_000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, val] of RATE_LIMIT_STORE) {
    if (val.resetAt < now) RATE_LIMIT_STORE.delete(key);
  }
}

export function rateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry || entry.resetAt < now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  entry.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  return { allowed: entry.count <= MAX_REQUESTS, remaining, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(
  key: string
): Record<string, string> {
  const rl = RATE_LIMIT_STORE.get(key);
  const remaining = rl ? Math.max(0, MAX_REQUESTS - rl.count) : MAX_REQUESTS;
  const resetAt = rl?.resetAt ?? Date.now() + WINDOW_MS;
  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
  };
}