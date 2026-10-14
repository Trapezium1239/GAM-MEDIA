import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { secureApi, requireAdminRole } from '@/lib/security/api';

export const dynamic = 'force-static';

const AlertSchema = z.object({
  title: z.string().min(3).max(100),
  message: z.string().min(5).max(500),
  level: z.enum(['info', 'advisory', 'urgent']),
  target_group: z.enum(['general', 'choir', 'media', 'ushers', 'youth']),
});

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const parsed = AlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('alerts').insert({
    title: parsed.data.title,
    message: parsed.data.message,
    level: parsed.data.level,
    target_group: parsed.data.target_group,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });

  // Trigger Telegram/WhatsApp bridge relay asynchronously
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${origin}/api/webhooks/bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET || ''}`,
      },
      body: JSON.stringify({ type: 'alert', payload: data }),
    })
  } catch (e) {
    console.error('Bridge trigger failed:', e)
  }

  return NextResponse.json({ status: 'broadcasted', alert: data }, { status: 201 });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}