import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProgramSchema } from '@/lib/validations/schemas';
import { secureApi, requireAdminRole } from '@/lib/security/api';

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const parsed = ProgramSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('programs').insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    event_date: parsed.data.event_date,
    venue: parsed.data.venue,
    flyer_url: parsed.data.flyer_url || null,
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  return NextResponse.json({ status: 'created', program: data }, { status: 201 });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}