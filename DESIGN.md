# GAM App — Design & Engineering Constitution

This document is the **single source of truth** for all visual, architectural, and code-quality decisions. Any contribution (human or AI) must comply. Non-compliant code is a bug.

---

## 1. Visual System (Anti-Slop)

### 1.1 Color & Theme
- **Palette:** Cream (backgrounds) + Wine (foreground/primary) only.
- **CSS Variables:** Defined in `app/globals.css` + `tailwind.config.ts`.
- **No gradients** on any UI primitive (buttons, cards, badges, headers).
- **No neon, glows, aurora blobs, or radial blurs.**
- **Shadows:** Single-layer neutral only (`shadow-sm`, `shadow`, `shadow-xl` max). No colored shadows.

### 1.2 Layout & Hierarchy
- **Max container nesting: 2 levels** (Page → Card). Never Card → Card → Card.
- **Spacing scale:** Tailwind default (4px base). No arbitrary `px` values.
- **Border radius:** `--radius` (0.75rem) for cards, `rounded-xl` for buttons/inputs.

### 1.3 Iconography
- **Lucide React only.** Zero emojis in UI (no list bullets, no nav shortcuts, no status decoration).
- Icons always paired with text labels (accessibility).

### 1.4 Status Indicators
- **No static status dots, pulsing rings, or decorative badges.**
- Only live, reactive states: WebSocket connection, sync status, recording indicator.

### 1.5 Typography
- **System font stack** (Tailwind default `font-sans`).
- **Scale:** `text-xs` (meta), `text-sm` (body), `text-base` (emphasis), `text-lg`/`text-xl` (headings), `text-2xl+` (hero).
- **Weight:** `font-medium` (default), `font-semibold` (labels), `font-bold` (titles).

### 1.6 Components
- **Buttons:** `.btn-primary` (wine-600), `.btn-secondary` (cream-200), `.btn-ghost`, `.btn-accent` (wine-600). No custom inline styles.
- **Inputs:** `.input-base` only.
- **Cards:** `.card`, `.card-compact`, `.card-interactive`. No custom card variants.
- **Empty states:** `.empty-state` + `.empty-state-icon` + `.empty-state-title` + `.empty-state-desc`.

---

## 2. Engineering System (Anti-Bloat)

### 2.1 Dependency Policy
- **Zero new packages** without written justification in PR description.
- **Allowed categories only:**
  - Framework: `next`, `react`, `react-dom`
  - Database: `@supabase/supabase-js`, `@supabase/ssr`
  - State: `zustand`
  - Icons: `lucide-react`
  - Dates: `date-fns`
  - PWA: `@serwist/next`, `idb`
  - Utils: `clsx`/`tailwind-merge` (if needed), `cheerio`/`music-metadata` (scripts only)
  - Observability: `@vercel/analytics`, `@sentry/nextjs`
- **Forbidden:** UI component libraries, animation libraries, form libraries, fetch wrappers, date pickers, chart libraries.

### 2.2 Unified Data Fetching
- **Server Components:** `lib/supabase/server.ts` → `createClient()` (async cookies). [Unused — static export has no SSR. Kept for reference only; no new code imports it.]
- **Client Components:** `lib/supabase/client.ts` → `createBrowserClient()`.
- **Middleware:** None. `next.config.js` uses `output: 'export'` for a fully bundled mobile shell; Next static export does not execute Middleware. Auth/session enforcement is handled client-side via Supabase session state + `DeepLinkAuth`, plus Supabase RLS policies for all table reads/writes. `lib/supabase/middleware.ts` does not exist and must not be created.
- **No `fetch()` in components.** No `useEffect` data fetching. No SWR/TanStack Query.
- **Server Actions** for mutations (`app/actions/*.ts`).

### 2.3 Dead Code Purge
- **Delete on refactor:** Old branches, unused helpers, orphaned files, commented blocks.
- **No `// TODO` or `// FIXME`** without linked GitHub issue.
- **No console.log** in committed code (use Sentry/logger).

### 2.4 Error Handling (Mandatory)
Every async boundary must render:
- **Loading:** Skeleton or spinner (`.animate-pulse` or `Loader2`).
- **Empty:** `.empty-state` with actionable copy.
- **Error:** Toast (`toast.error`) + inline fallback UI + "Retry" button.
- **Boundary:** `error.tsx` per route segment.

### 2.5 Accessibility & Compliance (Non-Negotiable)
- **Semantic HTML:** `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`.
- **ARIA:** `aria-label` on icon-only buttons, `aria-live` on toasts, `role="region"` on search results.
- **Focus visible:** `focus-visible:ring-2` on all interactives.
- **Color contrast:** WCAG AA minimum (tested in cream/wine palette).
- **Legal footer:** Every public layout includes links to Privacy Policy, Terms of Service, Contact.

---

## 3. Architecture Invariants

### 3.1 PWA
- **Bundler:** Webpack only (`next build --webpack`). Turbopack disabled for production.
- **SW:** `@serwist/next` with runtime caching (R2, Supabase Storage, Supabase REST).
- **Install:** `SmartInstallBanner` (auto) + `InstallButton` (manual). iOS guide mandatory.
- **Offline:** IndexedDB audio cache (LRU, 200MB cap) + MiniSearch index cached.

### 3.2 Audio
- **Gesture unlock:** Synchronous `Audio()` play on click before async blob fetch.
- **Persistent player:** Fixed bottom, survives navigation, Media Session API synced to Zustand.
- **Keyboard shortcuts:** Space/k, ArrowLeft/Right (±10s), ArrowUp/Down (±30s), m, 0.
- **Offline-first:** Read from `offlineAudioUrl` (IndexedDB blob URL) when available.

### 3.3 Search
- **Server:** PostgreSQL `tsvector` + GIN index + RPC `search_sermons`.
- **Client:** MiniSearch index (`public/search-index.json`) cached in IndexedDB.
- **Auto-switch:** Server search when `total ≥ 100`, else client.
- **Debounce:** 300ms on input.

### 3.4 Database
- **RLS enabled** on all tables. Policies: public read, user self-manage, admin write.
- **MatView refresh:** Trigger on `sermons`/`topics` changes → `REFRESH MATERIALIZED VIEW CONCURRENTLY sermons_search`.
- **Migrations only.** No raw SQL in app code.

### 3.5 Auth & Guards
- **Auth guards:** Client-side via Supabase session state + `components/auth/deep-link-auth.tsx` (native `gami://auth-callback` cold/warm start). No root `middleware.ts` — `output: 'export'` cannot run it. Route protection enforced client-side at component boundaries; data access enforced server-side via Supabase RLS.
- **Admin role:** Checked via RLS policies (`is_admin_or_pastor()`) + client-side guard on `/admin/*` pages.

### 3.6 Ingestion (One-Time)
- **Script:** `scripts/ingest-telegram.ts` (Cheerio + music-metadata).
- **Output:** R2 upload → Supabase insert → `public/search-index.json` emit.
- **No manual CSV/JSON editing.**

---

## 4. File & Code Conventions

| Rule | Enforcement |
|------|-------------|
| **TypeScript strict** | `strict: true`, `noUncheckedIndexedAccess: true` |
| **ESLint** | `next/core-web-vitals` + `plugin:@typescript-eslint/recommended` |
| **Prettier** | Single quotes, trailing commas, 100-char line |
| **Imports** | Absolute (`@/...`) only. Group: external → internal → relative. |
| **Components** | PascalCase, one per file, default export. |
| **Hooks** | `use` prefix, colocated with consumer. |
| **Utils** | Pure functions, `lib/utils.ts` or colocated `utils.ts`. |
| **Types** | Shared in `types/` or inline with component. No `any`. |

---

## 5. Review Checklist (Every PR)

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes (Webpack)
- [ ] No new dependencies added (or justified)
- [ ] No gradients, glows, emojis, nested cards >2, static status dots
- [ ] All async boundaries have loading/empty/error states
- [ ] Semantic HTML + ARIA labels on icon buttons
- [ ] Legal footer present on public layouts
- [ ] Dead code purged (no commented blocks, unused imports)
- [ ] PWA install tested on Android + iOS
- [ ] Audio gesture unlock verified on iOS Safari
- [ ] Offline search works after first load

---

## 6. Enforcement

**CI Pipeline** (`.github/workflows/ci.yml`):
```yaml
- run: npm ci
- run: npm run typecheck
- run: npm run lint
- run: npm run build
```

**Pre-commit** (Husky):
```bash
npx lint-staged
```

**AI Agent Instruction:**
> Before writing or modifying any file, read `DESIGN.md`. Verify compliance against every section. If a change violates a constraint, stop and propose an alternative that complies.

---

**Version:** 2.0 (Production-Hardened)
**Last Updated:** 2026-10-10
**Owners:** Henry (Lead), AI Agent (Compliance)