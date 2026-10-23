# Changelog

All notable changes to GAM Church App.

## [Unreleased]

### Added
- 365 daily devotionals auto-generated from Bible verses
- Telegram sermon import (3,273 sermons from chat exports)
- 5 Bible translations: KJV, WEB, Igbo, Yoruba, Hausa
- Native audio downloads via Capacitor Filesystem
- IndexedDB audio cache (200MB LRU eviction)
- Audio position persistence (localStorage, 7-day TTL)
- MiniSearch client-side search with server fallback
- Daily devotional RPCs (`get_todays_devotional`, etc.)
- Sermon search RPCs (`search_sermons`, `search_sermons_fuzzy`)
- Home vault bundle RPC (`get_home_vault_bundle`)
- Public-read RLS policies on all content tables
- Capacitor deep link auth (`gami://auth-callback`)

### Changed
- Migration to Next.js 16 with static export (`output: 'export'`)
- Removed ESV API dependency (now using keyless NET Bible)
- Bible reader uses bundled JSON (fully offline)
- Audio player prefers offline > native > remote URLs
- Landing page redesigned with feature grid
- Bottom nav uses BookMarked icon for Bible

### Fixed
- Hydration errors (localStorage/window guards)
- Static export dynamic routes (`generateStaticParams`)
- TypeScript strict mode compliance
- Middleware removed (incompatible with static export)

## [1.0.0] - 2026-10-20

### Initial Release
- Sermons, Music, Programs, Devotionals, Bible, Giving, Profile
- Admin dashboard (22 routes)
- PWA with Capacitor (Android/iOS)
- Supabase integration with RLS
- Audio player with Media Session API
- Command palette search (Cmd/Ctrl+K)
- Offline connectivity indicator