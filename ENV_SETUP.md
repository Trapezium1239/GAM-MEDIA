# Environment Setup Guide

## Required Variables

All variables must be set in `.env.local` (copy from `.env.example`).

### Supabase (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server/admin) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx` |

### App Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL (used for redirects) | `http://localhost:3000` |
| `CRON_SECRET` | Secret for cron job auth | Random 32-char string |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for ingestion | `123456:ABC-DEF...` |
| `BRIDGE_SECRET` | Internal bridge auth | Random 32-char string |

### Cloudflare R2 (Optional - Audio Storage)

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | Bucket name (e.g., `gam-media`) |

### YouTube API (Optional - Music)

| Variable | Description |
|----------|-------------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `YOUTUBE_PLAYLIST_ID` | Playlist ID for music embeds |

### Push Notifications (Optional)

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | VAPID public key |
| `VAPID_PRIVATE_KEY` | VAPID private key |

### Sentry (Optional)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |

## Generating Secrets

```bash
# CRON_SECRET / BRIDGE_SECRET (32 chars)
openssl rand -hex 16

# VAPID keys
npx web-push generate-vapid-keys
```

## Local Development

```bash
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## Production (Vercel)

Add all variables in Vercel Dashboard → Settings → Environment Variables.

**Important**: `SUPABASE_SERVICE_ROLE_KEY` should only be in production, never in preview deployments.

## Supabase Dashboard

Run the migration in Supabase SQL Editor:
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/20261016_live_repair.sql`
3. Run

This creates:
- `daily_devotionals` table + RPCs
- RLS policies on all content tables
- `search_sermons`, `search_sermons_fuzzy` RPCs
- `get_home_vault_bundle` RPC
- Audio URL backfill from `r2_key`