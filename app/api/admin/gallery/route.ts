import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GallerySchema } from '@/lib/validations/schemas';
import { secureApi, requireAdminRole } from '@/lib/security/api';

export const dynamic = 'force-static';

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const parsed = GallerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('gallery_items').insert({
    title: parsed.data.title || null,
    image_url: parsed.data.image_url,
    event_tag: parsed.data.event_tag || null,
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  return NextResponse.json({ status: 'created', item: data }, { status: 201 });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}