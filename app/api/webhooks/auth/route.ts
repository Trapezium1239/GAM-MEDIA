import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookPayload } from '@/lib/security/webhook';

export async function POST(req: Request) {
  try {
    // Verify Supabase webhook signature
    const payload = await verifyWebhookPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
    }

    const userId = payload?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ status: 'exists' });
    }

    const { data, error } = await supabase.from('profiles').insert({
      id: userId,
      full_name: payload.user.user_metadata?.full_name || payload.user.email?.split('@')[0] || 'New Member',
      phone: payload.user.user_metadata?.phone || null,
      role: 'member',
      church_group: 'general',
      lite_mode: false,
    }).select().single();

    if (error) return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    return NextResponse.json({ status: 'created', profile: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}