import webpush from 'web-push';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  
  if (!publicKey || !privateKey) {
    return false;
  }
  
  try {
    webpush.setVapidDetails(
      'mailto:admin@churchvault.app',
      publicKey,
      privateKey
    );
    vapidConfigured = true;
    return true;
  } catch {
    return false;
  }
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export function isPushConfigured(): boolean {
  return ensureVapidConfigured();
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!ensureVapidConfigured()) {
    return { success: false, error: 'VAPID keys not configured' };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      {
        TTL: 24 * 60 * 60,
        contentEncoding: 'aes128gcm',
      }
    );
    return { success: true };
  } catch (error) {
    if (error instanceof webpush.WebPushError && error.statusCode === 410) {
      return { success: false, error: 'subscription_expired' };
    }
    console.error('[push] Send failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'unknown' };
  }
}

export async function sendBulkPushNotifications(
  subscriptions: PushSubscriptionData[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: subscriptions.length, expired: 0 };
  }

  let sent = 0;
  let failed = 0;
  let expired = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);
      if (result.success) sent++;
      else if (result.error === 'subscription_expired') expired++;
      else failed++;
    })
  );

  return { sent, failed, expired };
}

export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}