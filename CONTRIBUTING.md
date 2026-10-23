# Contributing Guide

## Development Workflow

1. **Branch**: `git checkout -b feature/name`
2. **Code**: Make changes
3. **Typecheck**: `npm run typecheck`
4. **Lint**: `npm run lint`
5. **Build**: `npm run build`
6. **Commit**: `git commit -m "feat: description"`
7. **Push**: `git push origin feature/name`
7. **PR**: Open PR to `master`

## Code Standards

- **TypeScript**: Strict mode, no `any`
- **Imports**: Absolute `@/` paths, grouped (external → internal → relative)
- **Components**: PascalCase, one per file, default export
- **Hooks**: `use` prefix, colocated with consumer
- **Styles**: Tailwind only, no custom CSS
- **Icons**: Lucide React only, always with text labels

## Design System

- **Palette**: Cream (bg) + Wine (fg) only
- **No gradients** on buttons/cards/badges
- **Max nesting**: 2 levels (Page → Card)
- **Components**: Use `.btn-*`, `.input-base`, `.card*`, `.empty-state*`

## Data Fetching

- **Client**: `createClient()` from `@/lib/supabase/client`
- **Server/Static**: `createStaticClient()` from `@/lib/supabase/static`
- **Mutations**: Server Actions in `app/actions/*.ts`
- **No `fetch()` in components**, no SWR/TanStack Query

## Static Export Compliance

- All pages must be statically generated
- Use `generateStaticParams()` for dynamic routes
- No `cookies()`, `headers()`, or `middleware.ts`
- Auth via client-side session + RLS

## Commit Messages

```
feat: add Bible reading feature
fix: resolve hydration error on Bible page
refactor: extract audio persistence hook
chore: update dependencies
```

## PR Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No new dependencies (or justified)
- [ ] No gradients/glows/emojis
- [ ] Loading + empty + error states
- [ ] Semantic HTML + ARIA labels
- [ ] Legal footer on public pages