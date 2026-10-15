'use client';

import { useEffect } from 'react';

/**
 * Native shell bootstrap — StatusBar theme + SplashScreen lifecycle.
 * Web-safe: every Capacitor import is dynamic and guarded, so the PWA
 * build is unaffected. Splash stays visible until session hydration
 * resolves (first client effect + auth check settle).
 */
export function NativeBootstrap() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#f5f0e8' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch {
          // StatusBar optional — never block bootstrap
        }

        // Give the session hydration a beat to resolve, then hide splash.
        // The auth/session check runs in parallel; a short settled delay
        // avoids flashing an unauthenticated shell.
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (cancelled) return;

        try {
          const { SplashScreen } = await import('@capacitor/splash-screen');
          await SplashScreen.hide();
        } catch {
          // Splash optional on web builds
        }
      } catch {
        // Entirely web — no native shell to configure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
