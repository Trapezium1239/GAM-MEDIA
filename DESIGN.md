# GAM Church App — Design System Constitution

**Version:** 1.0  
**Last Updated:** October 2026

---

## 1. Color Palette

All colors are defined in `tailwind.config.ts` as CSS custom properties or Tailwind extensions.

| Token | Usage | Example Classes |
|-------|-------|-----------------|
| `wine` | Primary brand color | `text-wine-900`, `bg-wine-600`, `border-wine-200` |
| `cream` | Backgrounds, surfaces | `bg-cream-50`, `text-cream-50`, `bg-cream-100` |
| `zinc` | Secondary text, borders, surfaces | `text-zinc-500`, `bg-zinc-800`, `border-zinc-800/50` |
| `amber` | Accent, giving/bank details | `text-amber-400`, `bg-amber-500/10`, `border-amber-500/20` |
| `emerald` | Success, coverage states | `text-emerald-400`, `bg-emerald-500/10` |
| `red` | Errors, alerts, paused states | `text-red-400`, `bg-red-500/10` |
| `blue` | Planned states | `text-blue-400`, `bg-blue-500/10` |
| `green` | Completed states | `text-green-400`, `bg-green-500/10` |

---

## 2. Icon System

**Rule:** Lucide React icons exclusively. **Zero emoji.** **Zero SVG icons from other libraries.**

All icons must be imported from `lucide-react`:

```tsx
import { AlertTriangle, ChevronRight, User } from 'lucide-react'
```

### Prohibited
- Emoji characters (🏦, ⚠️, 🔴, 🟡, etc.)
- Inline SVGs not from lucide-react
- Icon fonts (FontAwesome, Material Icons, etc.)

### Decorative Icons
All purely decorative icons (next to text that conveys the same meaning) must include `aria-hidden="true"`:

```tsx
<Target className="w-6 h-6 text-primary" aria-hidden="true" />
```

### Functional Icons
Icons that are the sole content of a button or actionable element must have an `aria-label` on the parent element:

```tsx
<button aria-label="Play sermon" aria-hidden="true">
  <Music className="w-4 h-4" />
</button>
```

---

## 3. Typography

**Rule:** Use Tailwind utility classes only. **Zero arbitrary values** like `text-[10px]`.

| Size | Class | Usage |
|------|-------|-------|
| `text-xs` | ~0.75rem | Small captions, metadata, labels |
| `text-sm` | ~0.875rem | Body text, secondary headings |
| `text-base` | 1rem | Primary body text |
| `text-lg` | 1.125rem | Large body, emphasis |
| `text-xl` | 1.25rem | Section headings |
| `text-2xl` | 1.5rem | Page titles |

### Prohibited
- `text-[10px]`, `text-[11px]`, `text-[12px]` — use `text-xs` instead
- Arbitrary line-height or letter-spacing values without design token justification

---

## 4. Gradients & Visual Effects

**Rule:** Zero gradients on buttons, cards, or section containers.

### Prohibited
- `bg-gradient-to-*` on any surface, card, button, or section
- `bg-[radial-gradient(...)]` or `bg-[linear-gradient(...)]` arbitrary values
- Glow, aurora, or blur effects on interactive elements

### Allowed
- Subtle background gradients on landing page hero sections only (marketing pages, not app shells)
- Solid background colors with opacity (`bg-zinc-900/50`, `bg-amber-500/10`) for surfaces

---

## 5. Layout & Container Nesting

**Rule:** Maximum container nesting of 2 levels for content sections.

### Recommended Pattern
```tsx
<section className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
  <div className="max-w-md mx-auto">
    {/* Content — 2 levels deep */}
  </div>
</section>
```

### Prohibited
- 3+ levels of wrapper divs for visual styling alone
- Unnecessary `div` wrappers that don't add layout or semantic value

---

## 6. Component States

Every async boundary must render one of three standard states:

| State | Component | Classes |
|-------|-----------|---------|
| Loading | `<Loader2 className="empty-state-icon animate-spin" aria-hidden="true" />` | `animate-spin` |
| Empty | `<Target className="empty-state-icon" aria-hidden="true" />` | Static icon |
| Error | `<AlertTriangle className="empty-state-icon" aria-hidden="true" />` + retry button | `role="alert"` |

### Loading
```tsx
<div className="empty-state">
  <Loader2 className="empty-state-icon animate-spin" aria-hidden="true" />
  <p className="empty-state-title">Loading...</p>
</div>
```

### Empty
```tsx
<div className="empty-state">
  <Target className="empty-state-icon" aria-hidden="true" />
  <p className="empty-state-title">No items yet</p>
</div>
```

### Error
```tsx
<div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
  {errorMessage}
</div>
```

---

## 7. Accessibility

**Rule:** All interactive elements must be keyboard navigable and screen-reader friendly.

### Requirements
- All buttons: `type="button"` (unless form submission)
- All icons: `aria-hidden="true"` if decorative, `aria-label` on parent if functional
- All images: `alt` attribute with descriptive text
- All form inputs: associated `<label>` with `htmlFor`
- All modals/dialogs: `role="dialog"` or `role="alertdialog"`, `aria-modal="true"`
- All tabs: `role="tablist"`, `role="tab"`, `aria-selected`
- All alerts: `role="alert"` or `aria-live="polite"`

---

## 8. Mobile-First Layout

**Rule:** All app pages must be mobile-first with safe-area support.

| Pattern | Class | Purpose |
|---------|-------|---------|
| Container | `max-w-md mx-auto` | Constrained width for phone |
| Bottom padding | `pb-28` or `pb-32` | Bottom nav clearance |
| Top padding | `pt-[env(safe-area-inset-top)]` | iOS notch clearance |
| Bottom env padding | `pb-[env(safe-area-inset-bottom)]` | iOS home indicator clearance |
| Touch targets | `touch-manipulation` | Fast tap response on mobile |

---

## 9. Prohibited Patterns Summary

| Pattern | Example | Correct Alternative |
|---------|---------|---------------------|
| Emoji | `🏦`, `⚠️`, `🔴` | `<Landmark />`, `<AlertTriangle />` |
| Arbitrary text size | `text-[10px]` | `text-xs` |
| Gradients on cards | `bg-gradient-to-br` | `bg-zinc-900/50` |
| Missing aria-hidden | `<Target />` | `<Target aria-hidden="true" />` |
| Missing alt text | `<NextImage src={...} />` | `<NextImage src={...} alt="..." />` |
| 3+ nesting levels | `<div><div><div>` | `<section><div>` |
