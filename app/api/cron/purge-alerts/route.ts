import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { secureCompare } from '@/lib/security/api';

export const dynamic = 'force-static';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!secureCompare(authHeader || '', expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Delete alerts older than 30 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const { error, count } = await supabase
    .from('alerts')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    return NextResponse.json({ error: 'Failed to purge alerts' }, { status: 500 });
  }

  return NextResponse.json({ deleted: count || 0 });
}