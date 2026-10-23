# GAM Church App

Glorious Assembly Ministries International - Progressive Web App & Native Mobile App

## Overview

A full-featured church application built with Next.js 16, Capacitor, and Supabase. Features sermons, music, devotionals, Bible reading, giving, and more.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Static Export)
- **Database**: Supabase (PostgreSQL + RLS)
- **Mobile**: Capacitor (iOS/Android)
- **Styling**: Tailwind CSS (Cream/Wine palette)
- **State**: Zustand (audio), localStorage/IndexedDB (offline)
- **Search**: MiniSearch (client) + PostgreSQL tsvector (server)

## Quick Start

```bash
# Install dependencies
npm ci

# Development
npm run dev          # Turbopack (fast refresh)
npm run dev:webpack  # Webpack (production parity)

# Build
npm run build        # Static export (webpack)
npm run build:mobile # Build + Capacitor sync

# Database
npm run db:push      # Push migrations to Supabase
npm run db:reset     # Reset local DB

# Type checking
npm run typecheck

# Testing
npm run test:sanity
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages (landing, privacy)
│   └── (app)/             # Authenticated app pages
│       ├── (auth)/        # Login
│       ├── (dashboard)/   # Admin pages
│       ├── app/           # Home dashboard
│       ├── bible/         # Bible reader (5 translations)
│       ├── devotional/    # Daily devotionals
│       ├── giving/        # Giving page
│       ├── music/         # Music player
│       ├── programs/      # Events calendar
│       ├── sermons/       # Sermons + search
│       └── ...
├── components/            # React components
│   ├── admin/             # Admin components
│   ├── audio/             # Audio player + persistence
│   ├── auth/              # Auth components
│   ├── giving/            # Giving components
│   ├── nav/               # Navigation
│   ├── pwa/               # PWA bootstrap
│   ├── search/            # Search components
│   ├── ui/                # UI primitives
│   └── ...
├── lib/                    # Core libraries
│   ├── supabase/          # Supabase clients
│   ├── offline-storage.ts # IndexedDB cache
│   ├── audio-persistence.ts # Audio position memory
│   ├── bible-data.ts      # Bible translations loader
│   └── ...
├── scripts/               # Utility scripts
│   ├── ingest-telegram.ts # Telegram sermon import
│   ├── regenerate-search-index.ts
│   ├── seed-mock-data.ts
│   └── ...
├── supabase/
│   └── migrations/        # SQL migrations
├── public/
│   ├── bible/             # Bible translations (JSON)
│   └── search-index.json  # MiniSearch index
├── android/               # Capacitor Android
├── ios/                   # Capacitor iOS
└── store/                 # Zustand stores
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_WEBHOOK_SECRET=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=xxx

# Optional
TELEGRAM_BOT_TOKEN=xxx
BRIDGE_SECRET=xxx
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
YOUTUBE_API_KEY=xxx
YOUTUBE_PLAYLIST_ID=xxx
```

## Database Migrations

Apply migrations in Supabase SQL Editor:

```bash
# Or use Supabase CLI
supabase db push
```

Key migration: `supabase/migrations/20261016_live_repair.sql` - creates tables, RLS policies, and RPC functions.

## Mobile Builds

### Android
```bash
npx cap open android
# Android Studio → Build → Build APK(s)
```

### iOS (macOS only)
```bash
npx cap open ios
# Xcode → Product → Archive → TestFlight
```

## Offline Features

- **Audio**: IndexedDB blob cache (200MB LRU) + native filesystem
- **Bible**: Bundled JSON translations (KJV, WEB, Igbo, Yoruba, Hausa)
- **Search**: MiniSearch index cached in idb
- **Audio position**: localStorage with 7-day TTL

## Deployment

### Vercel (Web)
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### Native Stores
- Android: Build signed AAB in Android Studio → Play Console
- iOS: Archive in Xcode → TestFlight → App Store Connect

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run dev:webpack` | Dev server (Webpack) |
| `npm run build` | Production build (static export) |
| `npm run build:mobile` | Build + Capacitor sync |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:push` | Push migrations to Supabase |
| `npm run db:reset` | Reset local DB |
| `npm run ingest:telegram` | Import Telegram sermons |
| `npm run copy:audio` | Copy audio to R2 |
| `npm run seed:mock-data` | Seed dev data |
| `npm run test:sanity` | Search sanity check |

## Architecture Decisions

- **Static Export**: `output: 'export'` for Capacitor bundling
- **No Middleware**: Client-side auth + Supabase RLS
- **Service Role for Build**: Static generation uses service role client
- **Offline-First**: Audio/blobs cached in IndexedDB + native FS
- **RLS Everywhere**: Public read, authenticated write, admin via service role

## License

Proprietary - Glorious Assembly Ministries International