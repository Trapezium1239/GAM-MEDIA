import { NextRequest, NextResponse } from 'next/server';

const processedKeys = new Map<string, { status: number; body: unknown; timestamp: number }>();
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes
const MAX_AGE_MS = 600_000; // 10 minutes TTL

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, val] of processedKeys) {
    if (now - val.timestamp > MAX_AGE_MS) processedKeys.delete(key);
  }
}

/**
 * Check if a request has a cached idempotent response.
 * Returns a NextResponse if found, or null if not cached.
 */
export async function checkIdempotency(request: NextRequest): Promise<NextResponse | null> {
  if (request.method !== 'POST') return null;
  const key = request.headers.get('idempotency-key');
  if (!key) return null;

  cleanup();
  const cached = processedKeys.get(key);
  if (cached) {
    return NextResponse.json(cached.body, { status: cached.status });
  }
  return null;
}

/**
 * Save an idempotent response for future replay detection.
 */
export function saveIdempotency(key: string | null, status: number, body: unknown): void {
  if (!key) return;
  cleanup();
  processedKeys.set(key, { status, body, timestamp: Date.now() });
}

/**
 * Extract idempotency key from request, generate one if missing.
 */
export function getIdempotencyKey(request: Request): string {
  const header = request.headers.get('idempotency-key');
  if (header) return header;
  return crypto.randomUUID();
}