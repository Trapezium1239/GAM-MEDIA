import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-static';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_todays_devotional');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch devotional' }, { status: 500 });
  }

  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json({ devotional: null }, { status: 404 });
  }

  return NextResponse.json({ devotional: data });
}