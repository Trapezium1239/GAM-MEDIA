import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeRedirectUrl } from '@/lib/security/headers';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const { searchParams } = new URL(req.url);
    const redirect = searchParams.get('redirect') || '/';

    // Prevent open redirect: only allow same-origin paths
    const safePath = isSafeRedirectUrl(redirect) ? redirect : '/';
    const loginUrl = new URL(safePath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    return NextResponse.redirect(loginUrl);
  } catch {
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}

export const dynamic = 'force-static';