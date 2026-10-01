import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { addSecurityHeaders, addPublicCachingHeaders } from '@/lib/security/headers';

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon || !url.startsWith('http')) {
    return addSecurityHeaders(NextResponse.next({ request }));
  }

  const path = request.nextUrl.pathname;
  
  // Public routes that don't need auth check - apply public caching
  const isPublicRoute = path === '/' || path.startsWith('/sermons') || path.startsWith('/music') || 
    path.startsWith('/programs') || path.startsWith('/giving') || path.startsWith('/gallery') ||
    path.startsWith('/welcome') || path.startsWith('/devotional') || path.startsWith('/pastor') ||
    path.startsWith('/roster') || path.startsWith('/projects') || path === '/login' ||
    path === '/manifest.json' || path === '/sw.js' || path.startsWith('/api/');
    
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

  // Only check auth for protected routes or when auth cookies exist
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'));
  const isProtected = path.startsWith('/admin') || path === '/dashboard' || path === '/profile' || path === '/app';
  
  let user = null;
  if (hasAuthCookie || isProtected) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

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

  // Apply public caching headers for public routes
  if (isPublicRoute) {
    return addPublicCachingHeaders(supabaseResponse);
  }

  return addSecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};