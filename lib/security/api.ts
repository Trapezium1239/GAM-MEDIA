import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getCorsHeaders, isCorsRequest, corsResponse } from './cors';
import { rateLimit, getRateLimitHeaders } from './rate-limit';
import { sanitizeErrorMessage } from './headers';
import { checkIdempotency, saveIdempotency, getIdempotencyKey } from './idempotency';

/**
 * Extract the client's IP or identifier for rate limiting.
 */
function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIp || 'anonymous';
}

/**
 * Secure API handler wrapper with idempotency support.
 * - Adds CORS headers
 * - Applies rate limiting
 * - Checks idempotency key (if provided)
 * - Sanitizes all error messages
 * - Adds security/cache headers to responses
 */
export async function secureApi(
  request: Request,
  handler: (req: Request) => Promise<NextResponse>
): Promise<Response> {
  // Handle CORS preflight
  if (isCorsRequest(request)) {
    return corsResponse(request);
  }

  // Idempotency check for POST mutations
  if (request.method === 'POST') {
    const idempotentResponse = await checkIdempotency(request as unknown as NextRequest);
    if (idempotentResponse) return idempotentResponse;
  }

  // Rate limit by client IP
  const key = getClientKey(request);
  const rl = rateLimit(key);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rl.resetAt },
      { status: 429, headers: getRateLimitHeaders(key) }
    );
  }

  try {
    const response = await handler(request);
    // Add CORS + rate limit headers to successful responses
    const headers = getCorsHeaders(request);
    for (const [k, v] of Object.entries(headers)) {
      response.headers.set(k, v);
    }
    Object.entries(getRateLimitHeaders(key)).forEach(([k, v]) => {
      response.headers.set(k, v);
    });
    
    // Save idempotent response for POST
    if (request.method === 'POST') {
      const idempotencyKey = request.headers.get('idempotency-key') || getIdempotencyKey(request);
      saveIdempotency(idempotencyKey, response.status, await response.clone().json().catch(() => ({})));
    }
    
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err) },
      { status: 500 }
    );
  }
}

/**
 * Require admin or pastor role.
 * Returns { user, profile } on success, or a 401/403 NextResponse on failure.
 */
export async function requireAdminRole(request: Request) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'pastor'].includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, profile, error: null };
}

/**
 * Timing-safe string comparison for secrets.
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}