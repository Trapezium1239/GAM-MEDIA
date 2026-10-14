/** @type {import('next').NextConfig} */
const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const securityHeaders = [
  {
    source: '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2|woff|ttf|eot)$).*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: *.cloudinary.com *.supabase.co *.googleusercontent.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.cloudinary.com blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
      },
    ],
  },
  {
    source: '/',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=0, stale-while-revalidate=60, stale-if-error=300' }],
  },
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type, X-Request-ID, Idempotency-Key' },
      { key: 'Access-Control-Max-Age', value: '86400' },
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
    ],
  },
  {
    source: '/_next/static/:path*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ],
  },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,
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
  async headers() {
    return securityHeaders
  },
}

module.exports = withSerwist(nextConfig)