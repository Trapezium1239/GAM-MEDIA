import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DirectorySchema } from '@/lib/validations/schemas';
import { secureApi, requireAdminRole } from '@/lib/security/api';

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const body = await req.json();
  const parsed = DirectorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('church_directory').insert({
    category: parsed.data.category,
    title: parsed.data.title,
    detail_value: parsed.data.detail_value,
    extra_meta: parsed.data.extra_meta || null,
    display_order: parsed.data.display_order,
  }).select().single();

  if (error) return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  return NextResponse.json({ status: 'created', entry: data }, { status: 201 });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}

export async function DELETE(req: Request) {
  async function deleteHandler(request: Request) {
    const guard = await requireAdminRole(request);
    if (guard.error) return guard.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from('church_directory').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ status: 'deleted' });
  }
  return secureApi(req, deleteHandler);
}