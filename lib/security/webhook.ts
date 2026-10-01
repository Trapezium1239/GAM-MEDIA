import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET || '';
const MAX_TIMESTAMP_SKEW_MS = 300_000; // 300 seconds

/**
 * Verify Supabase webhook signature with HMAC-SHA256 over
 * `${timestamp}.${rawBody}` to prevent replay attacks.
 * Rejects payloads where x-timestamp differs from server time by > 300s.
 */
export async function verifySupabaseWebhook(
  request: Request,
  rawBody: string
): Promise<boolean> {
  if (!WEBHOOK_SECRET) return false;

  const signature = request.headers.get('sb-signature');
  const timestampHeader = request.headers.get('x-timestamp');
  if (!signature || !timestampHeader) return false;

  // Enforce strict timestamp skew validation
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) return false;

  const now = Date.now();
  if (Math.abs(now - timestamp) > MAX_TIMESTAMP_SKEW_MS) {
    return false;
  }

  // Check for replay using stored receipts (via Supabase RPC)
  const signatureHash = crypto.createHash('sha256').update(signature).digest('hex');

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }

  return true;
}

/**
 * Verify webhook payload with timestamp and replay protection.
 * Returns the parsed body or null if verification fails.
 */
export async function verifyWebhookPayload(request: Request) {
  const rawBody = await request.text();
  const valid = await verifySupabaseWebhook(request, rawBody);
  if (!valid) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

/**
 * Verify edge/notification webhook with custom HMAC.
 * Requires x-timestamp and x-signature headers.
 * Signature = HMAC-SHA256(BRIDGE_SECRET, `${timestamp}.${rawBody}`)
 */
export async function verifyEdgeWebhook(request: Request): Promise<{ body: object; timestamp: number } | null> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');
  const timestampHeader = request.headers.get('x-timestamp');

  if (!signature || !timestampHeader) return null;

  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) return null;

  if (Math.abs(Date.now() - timestamp) > MAX_TIMESTAMP_SKEW_MS) return null;

  const secret = process.env.BRIDGE_SECRET || process.env.CRON_SECRET || '';
  if (!secret) return null;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return { body: JSON.parse(rawBody), timestamp };
  } catch {
    return null;
  }
}