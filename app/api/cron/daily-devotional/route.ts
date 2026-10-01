import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchTodaysDevotional } from '@/lib/bible-api';
import { secureCompare } from '@/lib/security/api';
import { sendBulkPushNotifications, isPushConfigured } from '@/lib/push';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!secureCompare(token, process.env.CRON_SECRET || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if devotional already exists for today
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from('daily_devotionals')
      .select('id')
      .eq('date', todayStr)
      .single();

    if (existing) {
      return NextResponse.json({ status: 'exists', devotional_id: existing.id });
    }

    // Fetch today's devotional content from Bible API
    const devotionalContent = await fetchTodaysDevotional(new Date());

    // Insert into database
    const { data: devotional, error } = await supabase
      .from('daily_devotionals')
      .insert({
        date: todayStr,
        title: devotionalContent.title,
        scripture_reference: devotionalContent.scripture_reference,
        scripture_text: devotionalContent.scripture_text,
        reflection: devotionalContent.reflection,
        prayer: devotionalContent.prayer,
        application_question: devotionalContent.application_question,
        source: devotionalContent.source,
        external_id: devotionalContent.external_id,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[daily-devotional] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create devotional' }, { status: 500 });
    }

    // Send push notification if configured
    let pushResult = { sent: 0, failed: 0, expired: 0 };
    if (isPushConfigured()) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('active', true);

      if (subscriptions && subscriptions.length > 0) {
        const formatted = subscriptions.map((sub) => ({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }));

        const pushResultData = await sendBulkPushNotifications(formatted, {
          title: `📖 Daily Devotional — ${todayStr}`,
          body: `${devotionalContent.scripture_reference}: "${devotionalContent.scripture_text.slice(0, 100)}..."`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `devotional-${todayStr}`,
          requireInteraction: true,
          data: { devotional_id: devotional.id, url: `/devotional` },
        });

        pushResult = pushResultData;
      }
    }

    return NextResponse.json({
      status: 'created',
      devotional_id: devotional.id,
      push: pushResult,
    });
  } catch (err) {
    console.error('[daily-devotional-cron] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}