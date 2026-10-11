import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Suspense } from 'react';
import { PersistentPlayer } from '@/components/audio/persistent-player';
import { SmartInstallBanner } from '@/components/pwa/smart-install-banner';
import { BottomNav } from '@/components/nav/bottom-nav';
import { CommandPalette } from '@/components/search/command-palette';
import { ToastProvider } from '@/components/ui/toast';
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from '@sentry/nextjs';
import { ConnectivityIndicator, ConnectivityStatusIcon } from '@/components/ui/connectivity-indicator';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});

export const metadata: Metadata = {
  title: {
    default: 'GAM App',
    template: '%s | GAM App',
  },
  description: 'Community, Word, and Spiritual Growth — All in One Vault',
  manifest: '/manifest.json',
  icons: {
    apple: '/apple-touch-icon.png',
    icon: {
      url: '/icon.png',
      sizes: '192x192',
      type: 'image/png',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GAM App',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f0e8',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-dvh bg-cream-50 text-wine-900 antialiased selection:bg-wine-500/20 pb-28">
        <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-wine-500/5 via-transparent to-transparent pointer-events-none z-0" />
        <ToastProvider>
          <main className="max-w-md mx-auto min-h-dvh pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] px-4 relative z-10">
            <Suspense fallback={<div className="h-8 bg-cream-100 rounded-lg mb-4" />}>
              <SmartInstallBanner />
            </Suspense>
            {children}
          </main>
          <PersistentPlayer />
          <BottomNav />
          <CommandPalette />
          <ConnectivityIndicator />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}