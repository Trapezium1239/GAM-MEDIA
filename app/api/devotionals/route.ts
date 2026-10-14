import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { secureApi, requireAdminRole } from '@/lib/security/api';
import { fetchTodaysDevotional } from '@/lib/bible-api';

export const dynamic = 'force-static';

async function getHandler(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (start && end) {
    const { data, error } = await supabase.rpc('get_devotional_range', {
      p_start: start,
      p_end: end,
    });
    if (error) return NextResponse.json({ error: 'Failed to fetch devotionals' }, { status: 500 });
    return NextResponse.json({ devotionals: data || [] });
  }

  // Default: return today's devotional
  const { data, error } = await supabase.rpc('get_todays_devotional');
  if (error) return NextResponse.json({ error: 'Failed to fetch devotional' }, { status: 500 });
  return NextResponse.json({ devotional: data || null });
}

async function postHandler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_devotionals')
    .insert({
      date: body.date,
      title: body.title,
      scripture_reference: body.scripture_reference,
      scripture_text: body.scripture_text,
      reflection: body.reflection,
      prayer: body.prayer,
      application_question: body.application_question,
      source: body.source || 'manual',
      external_id: body.external_id,
      created_by: guard.user.id,
      published_at: body.published_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create devotional' }, { status: 500 });
  return NextResponse.json({ devotional: data }, { status: 201 });
}

export async function GET(req: Request) {
  return secureApi(req, getHandler);
}

export async function POST(req: Request) {
  return secureApi(req, postHandler);
}