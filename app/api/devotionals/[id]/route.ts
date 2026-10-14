import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { secureApi, requireAdminRole } from '@/lib/security/api';

export async function generateStaticParams() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase.from('daily_devotionals').select('id').limit(100)
  if (data && data.length > 0) {
    return data.map(item => ({ id: item.id }))
  }
  // Return a dummy route to satisfy static export requirement
  return [{ id: 'placeholder' }]
}

async function getHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('daily_devotionals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: 'Devotional not found' }, { status: 404 });
  return NextResponse.json({ devotional: data });
}

async function patchHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const { id } = await params;
  const body = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('daily_devotionals')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update devotional' }, { status: 500 });
  return NextResponse.json({ devotional: data });
}

async function deleteHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('daily_devotionals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete devotional' }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return secureApi(req, (r) => getHandler(r, { params }));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return secureApi(req, (r) => patchHandler(r, { params }));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return secureApi(req, (r) => deleteHandler(r, { params }));
}