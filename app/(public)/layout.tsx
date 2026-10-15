import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { PersistentPlayer } from '@/components/audio/persistent-player';
import { CommandPalette } from '@/components/search/command-palette';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: {
    default: 'GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL',
    template: '%s | GAM Church',
  },
  description: 'Community, Word, and Spiritual Growth — All in One Vault',
  icons: {
    icon: {
      url: '/icon.png',
      sizes: '192x192',
      type: 'image/png',
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f0e8',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500/20 pb-16">
        <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none z-0" />
        <ToastProvider>
          <main className="min-h-dvh pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <PersistentPlayer />
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}