# Scripts Reference

## Data Ingestion

| Script | Purpose |
|--------|---------|
| `ingest-telegram.ts` | Parse Telegram HTML exports → Supabase + R2 + search index |
| `import-telegram-sermons.ts` | Import sermons from JSON/HTML exports (with R2 upload) |
| `parse-telegram-sermons.ts` | Parse Telegram export HTML → structured JSON |
| `incremental-ingest.ts` | Incremental Telegram ingestion (deduped) |
| `cleanup-sermons.ts` | Deduplicate/clean sermon data |

## Data Seeding

| Script | Purpose |
|--------|---------|
| `seed-music.ts` | Seed music tracks |
| `generate-365-devotionals.ts` | Generate 365 daily devotionals from Bible |
| `seed-music.ts` | Seed music tracks |

## Data Verification

| Script | Purpose |
|--------|---------|
| `verify-devotionals.ts` | Verify devotional data integrity |
| `count-data.ts` | Count records in tables |
| `check-data.ts` | General data validation |

## Search Index

| Script | Purpose |
|--------|---------|
| `regenerate-search-index.ts` | Rebuild `public/search-index.json` from Supabase (not consumed by the app — the vault now searches Postgres directly) |

## Bible Data

| Script | Purpose |
|--------|---------|
| `convert-ebible.js` | Convert eBible format → JSON (KJV order) |

## Audio

| Script | Purpose |
|--------|---------|
| `upload-audio.ts` | Upload audio files to R2 |
| `copy-audio-local.ts` | Copy local audio to R2 |

## Supabase

| Script | Purpose |
|--------|---------|
| `setup-r2-cors.ts` | Configure R2 CORS for audio uploads |

## Usage

```bash
# Full Telegram ingestion
npm run ingest:telegram

# Or directly
npx tsx scripts/ingest-telegram.ts

# Regenerate search index
npx tsx scripts/regenerate-search-index.ts

# Seed 365 devotionals
npx tsx scripts/generate-365-devotionals.ts

# Verify data
npx tsx scripts/verify-devotionals.ts
```