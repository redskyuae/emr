---
name: design-system
description: Apply the project's Microsoft Fluent-inspired design system when building or changing any frontend UI. Use when creating pages, components, forms, dashboards, styling, theming, or animations — or when the user mentions design, look-and-feel, shadcn, or Fluent.
---

# Design System

This project has a committed design system: **Microsoft Fluent-inspired, built on shadcn/ui, deep blue primary**. It is documented in [`DESIGN.md`](../../../DESIGN.md) at the repo root — that file is the source of truth. This skill tells you how to work inside it.

## Before writing any UI code

1. **Read `DESIGN.md`.** Tokens, typography, elevation, motion rules, and the UI/UX principles all live there.
2. **Check `components/ui/` first.** All 55 shadcn components are installed and themed. Never hand-roll a primitive (button, dialog, select, table, toast…) that already exists there.
3. **Look at an existing page** (`app/(marketing)/page.tsx`, `app/(auth)/login/page.tsx`) to match composition patterns before inventing new ones.

## Hard rules

- **Tokens only.** `bg-primary`, `text-muted-foreground`, `shadow-fluent-8` — never raw hex/oklch in components. Theme changes happen in `app/globals.css`, nowhere else.
- **Don't fork `components/ui/`.** Layout tweaks go through `className`; theme tweaks go through tokens. Domain composites go in `components/{brand,marketing,auth,...}/`.
- **Fonts are fixed**: Urbanist (headings — automatic on h1–h4 — and body), Geist Mono (codes/IDs/timestamps). Do not add fonts.
- **Elevation = hierarchy.** Use the `shadow-fluent-*` ramp from DESIGN.md; the more modal the element, the higher the shadow.
- **Motion**: GSAP via the data-attribute pattern in `components/marketing/marketing-animations.tsx`. Ease `power3.out`, ≤ 0.9s, scroll reveals fire once, and **always** bail out under `prefers-reduced-motion`. No continuous motion inside the clinical app.
- **Both themes.** Every screen must hold up in light and dark (`.dark`).
- **Route-local components.** Page-specific React components under `app/` must live in that route's `_components/` directory. Do not create ad hoc `components/` folders beside pages or leave page clients beside `page.tsx`.
- **Page skeletons.** Every `app/**/page.tsx` must have a sibling `loader.tsx` that imports and renders `Skeleton` from `@/components/ui/skeleton`. When a page or any component under its `_components/` directory changes, update that route's `loader.tsx` in the same change so the skeleton still matches the page shape.

## EMR-specific UX

- Active **Tenant and Facility context must stay visible** — staff must never guess where an action lands.
- Patient-safety information is never hover-only, truncated-only, or low-contrast.
- Forms: labels above fields, validate on blur, show exact API error strings, confirm destructive actions via `alert-dialog`.
- Design loading (`skeleton`), empty (`empty`), and error states explicitly.

## Finishing checklist

Run through the checklist at the bottom of `DESIGN.md` before declaring UI work done: tokens only, dark mode, keyboard/focus, reduced motion, mobile, async states, ui primitives reused.

If a task genuinely requires breaking a rule here, update `DESIGN.md` in the same change and say so — the doc and the code must never disagree.
