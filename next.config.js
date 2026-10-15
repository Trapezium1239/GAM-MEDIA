/** @type {import('next').NextConfig} */
const nextConfig = {
  // MOBILE-ONLY: pure static export bundled into the native shell.
  // No server, no middleware, no API routes — all data via Supabase client.
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 48, 96, 144, 192, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24,
  },
}

module.exports = nextConfig