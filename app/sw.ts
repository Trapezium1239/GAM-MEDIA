/// <reference lib="webworker" />
import { Serwist, type PrecacheEntry } from 'serwist'

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: (string | PrecacheEntry)[] }

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.hostname.includes('cloudinary.com'),
      // @ts-expect-error - Serwist handler type mismatch
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-media',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      matcher: ({ url }) =>
        url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
      // @ts-expect-error - Serwist handler type mismatch
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-storage',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      matcher: ({ url }) =>
        url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/'),
      // @ts-expect-error - Serwist handler type mismatch
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
  fallbackEntries: { document: '/offline' },
})

serwist.addEventListeners()