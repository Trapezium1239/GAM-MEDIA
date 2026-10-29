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

The proven pipeline (real files → Supabase Storage → DB rows):

| Script | Purpose |
|--------|---------|
| `build-audio-manifest.mjs` | Match DB sermons to real files on disk → `audio-manifest.json` (re-verifies each file's byte size) |
| `upload-real-audio.mjs` | Upload manifest entries to `church-media`, SHA-256-verify, wire `audio_url` (idempotent: key is `sermons/<id><ext>`) |

```bash
npm run audio:manifest
npm run audio:upload -- --limit 25 --verify 3   # batch + byte verification
npm run audio:upload -- --dry-run --limit 10    # preview without uploading
```

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