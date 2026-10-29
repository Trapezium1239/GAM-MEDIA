# Supabase setup — GAM App

Project: `lxkugbswxdrkdhuyorwf` · https://lxkugbswxdrkdhuyorwf.supabase.co

## The one thing that must be run first

`APPLY_NOW.sql` (in this folder) must be pasted into the Supabase SQL Editor:

<https://supabase.com/dashboard/project/lxkugbswxdrkdhuyorwf/sql/new>

**Why:** the tables and their RLS "public read" policies exist, but the
table-level `GRANT`s were never issued. RLS policies do not grant access by
themselves, so every request from `anon` (the app — no login) and from
`service_role` (seed scripts) failed with:

```
42501 permission denied for table <name>
```

Symptoms this causes:

| Symptom | Cause |
| --- | --- |
| `/sermons` shows "0 of 0 sermons" | `anon` cannot `SELECT` on `public.sermons` |
| music / gallery / programs / giving lists empty | same, per table |
| `/devotional` shows "No Devotional Today" | `get_todays_devotional()` has a `json`/`jsonb` type bug **and** `anon` cannot read the table |
| `generate-365-devotionals.ts` → "Inserted 0 / 365" | `service_role` cannot `INSERT` on `public.daily_devotionals` |

`APPLY_NOW.sql` is idempotent. It only adds privileges and replaces three
functions; it deletes no data.

## After running it

```bash
npx tsx scripts/generate-365-devotionals.ts   # expect: Done. Inserted 365 / 365
```

Then redeploy so the pre-rendered `/devotional/[date]` pages pick up the rows.

## Schema drift — still to be reconciled

The app contains code for features whose tables do not exist on the live
database yet. They are NOT created by `APPLY_NOW.sql` (deliberately — those
DDL changes need review because they touch `profiles`):

| Code expects | Live database |
| --- | --- |
| `roster_shifts` (`app/(app)/roster`, `app/actions/roster.ts`, `admin/roster`) | only `rosters` (`user_id, role, shift_date, status`) |
| `project_milestones` (`projects`, `admin/milestones`) | only `milestones` |
| `push_subscriptions` (`settings/notifications`, `native-push-bootstrap`) | missing |
| `bridge_channels` (`admin/bridge`) | missing |
| `first_timers.full_name / phone / is_first_time / prayer_request / interested_unit` | `first_timers` has `name, email, status` |
| `profiles.church_group`, `profiles.role` | missing on `profiles` |
| `church_music` audio at `audio_url` | 70 rows of `local://*.mp3` (desktop-only paths) |

Source DDL for the first four lives in `migrations/`:

- `20260924_roster_milestones.sql`
- `20260925_push_subscriptions.sql`
- `20260923_first_timers_and_bridge.sql`

## Media reality check

Audio is **not** in the repo and **not** in R2. This is what actually exists:

- **Real files** — 2 844 audio files, 17 GB, in the Telegram exports
  (`Downloads\Telegram Desktop\ChatExport_2026-10-11\{files,voice_messages}`).
  Each one is referenced by a message whose text names the service.
- **Storage** — the public Supabase bucket `church-media`, objects under
  `sermons/<sermon-id><ext>` (that key makes uploads idempotent, so a re-run
  resumes instead of duplicating). Per-object ceiling is ~50 MB — probed:
  49 MB accepted, 78 MB rejected. 2 841 of the 2 844 files fit under it.
- **Manifest** — `scripts/audio-manifest.json`: 2 180 sermon↔file pairs,
  matched by exact normalized title first, then same service date + Dice
  ≥ 0.55, and re-verified against disk byte sizes.
- **Database** — uploaded rows store the **full public URL** in both
  `audio_url` and `r2_key`, so `lib/audio-url.ts` needs no
  `NEXT_PUBLIC_R2_PUBLIC_URL` for them.
- `church_music`: still 70 rows of `local://*.mp3`, and only 4 of those
  filenames exist on this machine — so the Music page honestly reports
  "Audio not available" rather than pretending.

Rows that were never uploaded keep `audio/default-placeholder.mp3` and render
**"Audio not available"**; `lib/audio-url.ts` owns that decision.

```bash
npm run audio:manifest                  # rebuild pairs, re-verify every file
npm run audio:upload -- --dry-run       # show what would be uploaded
npm run audio:upload -- --limit 25 --verify 3
node scripts/fix-sermon-metadata.mjs    # date + duplicate-row repair
```

**Known gap:** the exports stop at 2024-03. 1 105 sermons dated 2024-04 or
later (including all 126 from 2025) have no file anywhere on this machine —
the `/sermons` "With audio" filter exists so those rows cannot bury the
recordings that do exist.

## Environment

`.env.local` (gitignored) needs:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # seed scripts + build-time SSG only
NEXT_PUBLIC_R2_PUBLIC_URL=...      # public base URL of the R2 bucket (currently empty)
```

`NEXT_PUBLIC_R2_PUBLIC_URL` is only needed for rows that store a **bare object
key** — none do today: uploaded rows hold a full Supabase Storage URL, and the
rest are placeholders. Without it, a bare key cannot be turned into a playable
URL and is therefore treated as unavailable.
