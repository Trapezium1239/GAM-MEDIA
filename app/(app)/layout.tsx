import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Suspense } from 'react';
import { PersistentPlayer } from '@/components/audio/persistent-player';
import { SmartInstallBanner } from '@/components/pwa/smart-install-banner';
import { BottomNav } from '@/components/nav/bottom-nav';

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
  themeColor: '#09090b',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500/20 pb-28">
        <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none z-0" />
        <main className="max-w-md mx-auto min-h-dvh pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] px-4 relative z-10">
          <Suspense fallback={<div className="h-8 bg-zinc-900 rounded-lg mb-4" />}>
            <SmartInstallBanner />
          </Suspense>
          {children}
        </main>
        <PersistentPlayer />
        <BottomNav />
      </body>
    </html>
  );
}