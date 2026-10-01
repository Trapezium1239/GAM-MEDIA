import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MusicSchema } from '@/lib/validations/schemas';
import { secureApi, requireAdminRole } from '@/lib/security/api';

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const parsed = MusicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('church_music').insert({
    title: parsed.data.title,
    artist_choir: parsed.data.artist_choir,
    audio_url: parsed.data.audio_url,
    lyrics: parsed.data.lyrics || null,
    release_date: parsed.data.release_date || null,
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
  return NextResponse.json({ status: 'created', track: data }, { status: 201 });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}