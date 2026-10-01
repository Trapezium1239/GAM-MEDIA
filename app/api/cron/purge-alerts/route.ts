import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { secureApi, secureCompare } from '@/lib/security/api';

async function handler(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  // Timing-safe comparison to prevent timing attacks
  if (!authHeader || !secureCompare(authHeader, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('alerts').delete().lt('expires_at', new Date().toISOString());

  if (error) return NextResponse.json({ error: 'Failed to purge' }, { status: 500 });
  return NextResponse.json({ status: 'purged', timestamp: new Date().toISOString() });
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}