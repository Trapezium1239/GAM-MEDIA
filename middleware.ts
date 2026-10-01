import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { addSecurityHeaders } from '@/lib/security/headers';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon || !url.startsWith('http')) {
    return addSecurityHeaders(NextResponse.next({ request }));
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith('/admin') || path === '/dashboard' || path === '/profile';

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', path);
    const response = NextResponse.redirect(redirectUrl);
    return addSecurityHeaders(response);
  }

  if (user && path === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/app';
    const response = NextResponse.redirect(redirectUrl);
    return addSecurityHeaders(response);
  }

  return addSecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};