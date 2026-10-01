import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Suspense } from 'react';
import { PersistentPlayer } from '@/components/audio/persistent-player';
import { SmartInstallBanner } from '@/components/pwa/smart-install-banner';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Church',
  name: 'Glorious Assembly Ministries International',
  alternateName: 'GAMI',
  url: 'https://gam.church',
  logo: 'https://gam.church/icon-512.png',
  image: 'https://gam.church/icon-512.png',
  description: 'Community, Word, and Spiritual Growth — All in One Vault',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: 'NG',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '',
    contactType: 'customer service',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://facebook.com/gami',
    'https://youtube.com/@gami',
    'https://instagram.com/gami',
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '08:00',
      closes: '12:30',
      description: 'Celebration Services',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Wednesday',
      opens: '18:00',
      closes: '19:30',
      description: 'Midweek Bible Study',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Friday',
      opens: '19:00',
      closes: '21:00',
      description: 'Prayer Vigil',
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://gam.church'),
  title: {
    default: 'Glorious Assembly Ministries International',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Glorious Assembly Ministries International',
    title: 'Glorious Assembly Ministries International',
    description: 'Community, Word, and Spiritual Growth — All in One Vault',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'GAMI Church',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glorious Assembly Ministries International',
    description: 'Community, Word, and Spiritual Growth — All in One Vault',
    images: ['/icon-512.png'],
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'script:ld+json': JSON.stringify(structuredData),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500/20 pb-16">
        <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none z-0" />
        <main className="min-h-dvh pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-8 bg-zinc-900 rounded-lg mb-4" />}>
            <SmartInstallBanner />
          </Suspense>
          {children}
        </main>
        <PersistentPlayer />
      </body>
    </html>
  );
}