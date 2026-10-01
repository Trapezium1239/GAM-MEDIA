import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SermonSchema } from '@/lib/validations/schemas';
import { secureApi, requireAdminRole } from '@/lib/security/api';

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const parsed = SermonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('sermons').insert({
    title: parsed.data.title,
    preacher: parsed.data.preacher,
    date: parsed.data.date,
    audio_url: parsed.data.audio_url || null,
    video_link: parsed.data.video_link || null,
    notes: parsed.data.notes || null,
    topic_id: parsed.data.topic_id || null,
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to create sermon' }, { status: 500 });
  return NextResponse.json({ status: 'created', sermon: data }, { status: 201 });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}