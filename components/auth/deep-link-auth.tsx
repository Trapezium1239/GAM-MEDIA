'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Native auth deep-link handler — completes the Supabase magic-link
 * round-trip inside the app via the custom `gami://` URL scheme.
 *
 * - Cold start: reads App.getLaunchUrl()
 * - Warm start: listens for `appUrlOpen`
 * Handles both implicit flow (tokens in the URL fragment) and
 * PKCE flow (`?code=` exchange).
 *
 * Web builds are unaffected: no native platform → this is a no-op and
 * Supabase completes the redirect in-page (detectSessionInUrl).
 */
export function DeepLinkAuth() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    const handleAuthUrl = async (rawUrl: string | null | undefined) => {
      if (!rawUrl) return;
      try {
        const url = new URL(rawUrl);
        if (url.protocol !== 'gami:') return;

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Implicit flow: Supabase appends tokens to the URL fragment.
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) router.replace('/app');
          return;
        }

        // PKCE flow: one-time authorization code in the query string.
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) router.replace('/app');
        }
      } catch {
        // Malformed callback URL — ignore, user stays where they are.
      }
    };

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');

        // Cold start: app was launched by the magic-link tap.
        const launch = await App.getLaunchUrl();
        if (!cancelled) await handleAuthUrl(launch?.url);

        // Warm start: app was already running when the link was tapped.
        const listener = await App.addListener('appUrlOpen', ({ url }) => {
          void handleAuthUrl(url);
        });
        if (cancelled) {
          listener.remove();
          return;
        }
        removeListener = () => listener.remove();
      } catch {
        // Web build or missing plugin — nothing to handle natively.
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [router]);

  return null;
}