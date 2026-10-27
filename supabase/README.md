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

- `sermons`: **3 972 rows, all pointing at `audio/default-placeholder.mp3`**.
  There is no real sermon audio in the bucket or the database.
- `church_music`: **70 rows, all `local://<filename>.mp3`** — filenames from a
  desktop folder, not web URLs.

Until real files are uploaded (R2 or any HTTPS host) and `audio_url` /
`r2_key` are updated, the UI shows **"Audio not available"** instead of a
Play button that fails silently. `lib/audio-url.ts` owns that decision.

## Environment

`.env.local` (gitignored) needs:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # seed scripts + build-time SSG only
NEXT_PUBLIC_R2_PUBLIC_URL=...      # public base URL of the R2 bucket (currently empty)
```

Without `NEXT_PUBLIC_R2_PUBLIC_URL`, bare R2 keys cannot be turned into
playable URLs, so they are treated as unavailable.
