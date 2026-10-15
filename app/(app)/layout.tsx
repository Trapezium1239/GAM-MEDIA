import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Suspense } from 'react';
import { PersistentPlayer } from '@/components/audio/persistent-player';
import { NativeBootstrap } from '@/components/pwa/native-bootstrap';
import { NativePushBootstrap } from '@/components/pwa/native-push-bootstrap';
import { BottomNav } from '@/components/nav/bottom-nav';
import { CommandPalette } from '@/components/search/command-palette';
import { ToastProvider } from '@/components/ui/toast';
import { ConnectivityIndicator } from '@/components/ui/connectivity-indicator';

export const metadata: Metadata = {
  title: {
    default: 'GAM Church',
    template: '%s | GAM Church',
  },
  description: 'Community, Word, and Spiritual Growth — All in One Vault',
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
            {children}
          </main>
          <PersistentPlayer />
          <BottomNav />
          <CommandPalette />
          <ConnectivityIndicator />
          <NativeBootstrap />
          <NativePushBootstrap />
        </ToastProvider>
      </body>
    </html>
  );
}