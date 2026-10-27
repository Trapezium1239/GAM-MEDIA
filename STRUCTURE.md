# GAM Church App — Architecture & Structure

**Project:** GAM Church (GAM-MEDIA) — Church community app  
**Live URL:** https://gam-media.vercel.app/  
**Mobile:** Capacitor 8.5.x (Android/iOS)  
**Document last updated:** October 2026

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.3.8 |
| UI Library | React | 18.3.1 |
| Styling | Tailwind CSS | 3.4.14 |
| State Management | Zustand | 4.5.5 |
| Backend / Auth / DB | Supabase | @supabase/supabase-js 2.45.4, @supabase/ssr 0.5.1 |
| Mobile | Capacitor | 8.5.x |
| Icons | lucide-react | 0.447.0 |
| Date formatting | date-fns | 4.1.0 |
| Search | Minisearch | 7.2.0 |
| Deployment | Vercel (static export) | — |
| TypeScript | TypeScript | 5.6.3 |

---

## 2. Frontend Structure

### Route Architecture (Next.js App Router)

Route groups `(folder)` organize concerns without affecting URL paths:

```
app/
├── (app)/                    # Authenticated shell — main app (mobile-first)
│   ├── layout.tsx            # Shell: BottomNav, PersistentPlayer, DeepLinkAuth,
│   │                         # NativeBootstrap, NativePushBootstrap, ConnectivityIndicator
│   ├── page.tsx              # Dashboard home (sermons, programs, music)
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── app/page.tsx          # Home vault
│   ├── gallery/page.tsx      # Image gallery
│   ├── profile/page.tsx      # Account (auth-gated, redirects to /login)
│   ├── projects/page.tsx     # Project milestone tracker list
│   ├── projects/[id]/page.tsx| # Milestone detail view
│   ├── roster/page.tsx       # Shift swap marketplace
│   ├── music/page.tsx        # Audio player
│   ├── sermons/page.tsx      # Sermon archive
│   ├── sermons/topic/[slug]/page.tsx
│   ├── devotional/page.tsx   # Daily devotional
│   ├── devotional/[date]/page.tsx
│   ├── devotional/archive/page.tsx
│   ├── bible/page.tsx        # Bible reader (KJV, WEB, Hausa, Igbo, Yoruba)
│   ├── giving/page.tsx       # Giving/donations
│   ├── pastor/page.tsx       # Church directory
│   ├── programs/page.tsx     # Events/itinerary
│   ├── welcome/page.tsx      # First-timer welcome
│   └── (dashboard)/admin/    # Admin routes
│       ├── page.tsx          # Admin dashboard
│       ├── sermons/          # Sermon management
│       ├── music/            # Music management
│       ├── programs/         # Program management
│       ├── gallery/          # Gallery management
│       ├── roster/           # Roster management
│       ├── milestones/       # Project milestone management
│       ├── first-timers/     # First-timer management
│       ├── alerts/           # Alert management
│       ├── bridge/           # Notification bridge
│       └── settings/         # Admin settings
│   └── (auth)/login/page.tsx # Login
├── (public)/                 # Public-facing (no auth required)
│   ├── layout.tsx
│   ├── page.tsx              # Landing page
│   ├── privacy/page.tsx
│   └── terms/page.tsx
├── actions/                  # Server/client FormData actions
│   ├── roster.ts             # Shift swap server action
│   └── first-timer.ts
├── globals.css
└── icon.png
```

### Component Architecture

```
components/
├── audio/
│   ├── play-button.tsx       # PlaySermonButton, PlayMusicButton (Zustand audio)
│   └── persistent-player.tsx # Lock-screen / background media session player
├── nav/
│   └── bottom-nav.tsx        # Primary mobile navigation (7 icons)
├── ui/
│   ├── toast.tsx             # Toaster (X, CheckCircle, AlertCircle, Info, Loader2)
│   ├── page-status.tsx       # Loader2, RefreshCw status indicators
│   ├── empty-state.tsx       # Generic empty state component
│   ├── connectivity-indicator.tsx # Online/offline badge (Wifi, WifiOff, RefreshCw, AlertCircle)
│   ├── legal-footer.tsx
│   ├── official-bank-details.tsx
│   └── bank-details-section.tsx
├── auth/
│   └── deep-link-auth.tsx    # Capacitor deep link handling
├── pwa/
│   ├── native-bootstrap.tsx
│   └── native-push-bootstrap.tsx
├── search/
│   ├── command-palette.tsx   # Cmd+K search palette
│   ├── unified-search.tsx
│   └── instant-search.tsx
├── alerts/
│   ├── urgent-modal.tsx
│   └── alert-ticker.tsx
├── devotional/
│   └── devotional-actions.tsx
├── sermons/
│   ├── sermon-search.tsx
│   └── ...
├── giving/
│   └── bank-card.tsx
├── admin/
│   ├── bulk-sermon-import.tsx
│   └── ...
└── youtube/
    ├── youtube-playlist-embed.tsx
    ├── youtube-playlist-embed-new.tsx
    └── youtube-playlist-embed-backup.tsx
```

### State Management

| Store / Hook | Purpose | File |
|--------------|---------|------|
| Zustand `useAudioStore` | Audio playback state (currentTrack, isPlaying, currentTime, duration, offline URLs, Media Session API) | `store/use-audio-store.ts` |
| React `useState`/`useEffect` | Page-level data fetching (Supabase calls directly in components) | All page files |
| React `useTransition` | Optimistic UI for roster swap actions | `roster/page.tsx` |

### Styling

- **Tailwind CSS 3.4.14** with custom design tokens in `tailwind.config.ts`
- Color palette: `wine`, `cream`, `primary`, `zinc`
- Dark mode by default (`<html className="dark">`)
- Mobile-first: `max-w-md mx-auto` container, `pb-28` for bottom nav, safe-area insets
- Utility helpers: `clsx` + `tailwind-merge`

---

## 3. Mobile (Capacitor 8.5.x)

### Configuration (`capacitor.config.ts`)
- `appId`: `com.gam.app`
- `appName`: `GAM Church`
- `webDir`: `out` (Next.js static export)
- `server.url`: **none** — fully bundled native shell, never loads remote web content
- Android scheme: `https`

### Native Plugins
| Plugin | Purpose |
|--------|---------|
| SplashScreen | Launch screen |
| StatusBar | Status bar styling |
| Keyboard | Keyboard handling |
| PushNotifications | Push notifications |
| Camera | Photo capture |
| Filesystem | Local file storage |
| Haptics | Haptic feedback |
| Network | Connectivity monitoring |
| Share | Native sharing |
| App | App lifecycle |

### Native Libraries (`@/lib/native/`)
| Library | Purpose |
|---------|---------|
| `haptics.ts` | `triggerHaptic()` — haptic feedback |
| `audio-download.ts` | `downloadAudioToDevice()` — native audio download |
| `audio-persistence.ts` | `getNativeAudioUri()` — native file URI resolution |
| `offline-storage.ts` | IndexedDB cached audio |

### Build Scripts
```
npm run build          # Next.js static export (webpack)
npm run build:mobile   # Next.js build + npx cap sync
npm run cap:android    # Add/sync Android
npm run cap:ios        # Add/sync iOS
```

---

## 4. Backend Structure (Supabase)

### Database Schema (`supabase/schema.sql`)

Idempotent SQL with UUID extension and custom ENUM types:

#### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (id, full_name, phone, role, church_group, lite_mode) | Public read / self-update |
| `topics` | Sermon topic categories (id, name, slug) | Public read |
| `sermons` | Audio/video sermons (id, title, preacher, date, audio_url, video_link, notes, topic_id) | Public read / admin write |
| `programs` | Church events/itinerary (id, title, description, event_date, venue, flyer_url) | Public read / admin write |
| `gallery_items` | Photo gallery (id, title, image_url, event_tag, created_at) | Public read / admin write |
| `church_music` | Choir/audio tracks (id, title, artist_choir, audio_url, lyrics, release_date) | Public read / admin write |
| `church_directory` | Pastor contacts, bank accounts (id, category, title, detail_value, extra_meta, display_order) | Public read / admin write |
| `alerts` | Ephemeral targeted alerts (id, title, message, level, target_group, created_at, expires_at) | Public read (unexpired, group-targeted) / admin write |
| `project_milestones` | Church project funding tracker (id, title, description, category, target_amount, current_amount, target_date, status, display_order, created_at) | Used by projects page |
| `roster_shifts` | Shift swap marketplace (id, service_date, user_id, unit, status, swap_reason, covered_by, covered_at, created_at) | Used by roster page |

#### ENUM Types
| Enum | Values |
|------|--------|
| `user_role` | member, admin, pastor |
| `church_group` | general, choir, media, ushers, youth |
| `alert_level` | info, advisory, urgent |

#### Indexes
- `idx_sermons_date` — sermons(date DESC)
- `idx_sermons_topic` — sermons(topic_id)
- `idx_programs_date` — programs(event_date ASC)
- `idx_alerts_active` — alerts(expires_at, target_group)

### Row Level Security (RLS)

All tables have RLS enabled. Policies:

| Policy | Table | Access |
|--------|-------|--------|
| Public profile read | `profiles` | SELECT (true) |
| Self profile update | `profiles` | UPDATE (auth.uid() = id, WITH CHECK role = own_role()) |
| Read sermons | `sermons` | SELECT (true) |
| Read programs | `programs` | SELECT (true) |
| Read gallery | `gallery_items` | SELECT (true) |
| Read music | `church_music` | SELECT (true) |
| Read directory | `church_directory` | SELECT (true) |
| Read topics | `topics` | SELECT (true) |
| Read targeted unexpired alerts | `alerts` | SELECT (expires_at > NOW() AND group match) |
| Admin write sermons | `sermons` | FOR ALL (is_admin_or_pastor()) |
| Admin write programs | `programs` | FOR ALL (is_admin_or_pastor()) |
| Admin write gallery | `gallery_items` | FOR ALL (is_admin_or_pastor()) |
| Admin write music | `church_music` | FOR ALL (is_admin_or_pastor()) |
| Admin write directory | `church_directory` | FOR ALL (is_admin_or_pastor()) |
| Admin write alerts | `alerts` | FOR ALL (is_admin_or_pastor()) |
| Admin write topics | `topics` | FOR ALL (is_admin_or_pastor()) |

### Helper Functions (SECURITY DEFINER)

| Function | Purpose |
|----------|---------|
| `own_role()` | Returns caller's role without recursion (used in profile update policy) |
| `is_admin_or_pastor()` | Gate for admin write policies |
| `handle_new_user()` | Trigger: auto-creates profile row on new user signup |
| `handle_updated_at()` | Trigger: auto-updates `updated_at` timestamp on profile update |
| `purge_expired_alerts()` | Cron cleanup: deletes alerts where expires_at < NOW() |

### Supabase Client Setup (`lib/supabase/`)

| File | Purpose | Env Vars |
|------|---------|----------|
| `client.ts` | Browser client (`createBrowserClient` from `@supabase/ssr`) | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY |
| `server.ts` | Server-side client | — |
| `static.ts` | Static build client (service role) | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| `admin.ts` | Admin operations | — |

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   (for static builds / admin operations)
```

---

## 5. Frontend ↔ Backend Connection Pattern

All data flows directly from browser to Supabase (no Next.js API routes, no middleware — static export):

```
Browser Component
    ↓ (createClient() from @supabase/ssr)
Supabase JS Client (anon key)
    ↓ (RLS enforced at DB level)
PostgreSQL Database
```

### Data Fetching Pattern (used across all pages)

```tsx
'use client'
const supabase = createClient()
const { data } = await supabase
  .from('table_name')
  .select('*')
  .order('column', { ascending: true })
setData(data || [])
setLoading(false)
```

### Mutation Pattern (Roster shift swaps)

`app/actions/roster.ts` — FormData-based server action:
1. Validates input with Zod schema (`ShiftSwapRequestSchema`)
2. Checks ownership (`shift.user_id !== user.id` → "Not your shift")
3. Updates `roster_shifts` status via Supabase anon key + RLS
4. Status transitions: `assigned` → `swap_requested` → `covered` / `assigned` (cancel)

---

## 6. Key Architectural Characteristics

| Aspect | Implementation |
|--------|---------------|
| **Rendering** | Static export (`output: 'export'`) — no server, no middleware |
| **Auth** | Supabase Auth (anon key), client-side session, route protection in each page |
| **API Layer** | None — direct Supabase client calls from components |
| **State** | Zustand (audio) + React useState (page data) |
| **Mobile** | Capacitor web view, native plugins for haptics/audio/filesystem |
| **Images** | Next/Image with lazy loading, blur placeholders, Cloudinary/Supabase remote patterns |
| **Search** | Minisearch (client-side) + command palette |
| **Deployment** | Vercel static hosting |

---

## 7. Structural Weaknesses & Known Limitations

1. **No centralized API layer** — All Supabase calls are inline in components. Hard to reuse, test, or add business logic centrally.
2. **Direct anon-key writes** — Roster shifts are written via anon key with RLS; relies entirely on DB-level security.
3. **No global error boundary** — Each page handles loading/error independently.
4. **`next-env.d.ts`** — Must not reference gitignored `.next/` directories (fixed in latest commit).

---

## 8. Recent Fixes Applied (October 2026)

| Category | Fix | File |
|----------|-----|------|
| Build | Restored `DollarSign` import (was rendered but missing) | `app/(app)/projects/page.tsx` |
| Build | Removed gitignored `.next/dev/types` from `next-env.d.ts` | `next-env.d.ts` |
| Bug | Cancel-swap: `shift.user_id === currentUserId` (was self-comparison, always true) | `app/(app)/roster/page.tsx` |
| Bug | Null guard on `shift.unit.charAt()` | `app/(app)/roster/page.tsx` |
| Bug | `setLoading(false)` before early return when unauthenticated | `app/(app)/roster/page.tsx` |
| Bug | Missing `/projects/:id` dynamic route | `app/(app)/projects/[id]/page.tsx` (new) |
| Bug | Gallery fetch error handling (no `.catch()` → eternal loading) | `app/(app)/gallery/page.tsx` |
| Bug | Projects fetch error handling + cancelled flag | `app/(app)/projects/page.tsx` |
| Bug | Project detail fetch error handling + cancelled flag | `app/(app)/projects/[id]/page.tsx` |
| Dead code | Removed unused `User` import | `app/(app)/roster/page.tsx` |
| Dead code | Removed unused `Loader2` import (loading now uses `Loader2`) | `app/(app)/roster/page.tsx` |
| Accessibility | `aria-hidden="true"` on 26+ decorative icons | All page files + play-button |
| Type safety | Runtime `in` check for milestone status validation | `app/(app)/projects/page.tsx` |
| Type safety | Removed optional `?` from profile `email` type | `app/(app)/profile/page.tsx` |
| Type safety | `currentUserId` converted from `let` to `useState` | `app/(app)/roster/page.tsx` |
| Mobile UX | Replaced `prompt()` with swap reason modal | `app/(app)/roster/page.tsx` |
| Consistency | Roster loading icon: `Calendar` → `Loader2 animate-spin` | `app/(app)/roster/page.tsx` |

---

## 9. Build & Deploy Commands

```bash
# Development
npm run dev

# Production build (static export)
npm run build

# Mobile build
npm run build:mobile
npm run cap:android
npm run cap:ios

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 10. File Reference

| Path | Description |
|------|-------------|
| `next.config.js` | Next.js config: static export, image optimization, remote patterns |
| `tailwind.config.ts` | Tailwind design tokens |
| `capacitor.config.ts` | Capacitor mobile config |
| `supabase/schema.sql` | Complete database schema (idempotent) |
| `app/(app)/layout.tsx` | Authenticated app shell |
| `app/(public)/layout.tsx` | Public shell |
| `lib/supabase/client.ts` | Browser Supabase client |
| `store/use-audio-store.ts` | Zustand audio state |
| `app/actions/roster.ts` | Roster swap server action |
