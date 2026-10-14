import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBulkPushNotifications, isPushConfigured } from '@/lib/push';

export const dynamic = 'force-static';

export async function POST(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { title, body: message } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('active', true);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active subscriptions' });
    }

    const formattedSubscriptions = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));

    const result = await sendBulkPushNotifications(formattedSubscriptions, {
      title,
      body: message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-notification',
      requireInteraction: false,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired,
    });
  } catch (err) {
    console.error('[push/test] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}