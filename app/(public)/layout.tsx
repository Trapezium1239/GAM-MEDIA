import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { PersistentPlayer } from '@/components/audio/persistent-player'
import { CommandPalette } from '@/components/search/command-palette'
import { ToastProvider } from '@/components/ui/toast'
import LegalFooter from '@/components/ui/legal-footer'

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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f0e8',
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-dvh bg-cream-50 text-wine-900 antialiased selection:bg-wine-500/20 pb-16">
        <ToastProvider>
          <main className="max-w-md mx-auto min-h-dvh pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] relative z-10 w-full px-4">
            {children}
            <LegalFooter />
          </main>
          <PersistentPlayer />
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  )
}
