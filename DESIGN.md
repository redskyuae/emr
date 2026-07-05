# EMR Design System

The design source of truth for all frontend work. Any agent or developer building UI must follow this document. If a change requires deviating from it, update this document in the same change.

## The decision

**Microsoft web design language (microsoft.com) with claymorphism depth, built on shadcn/ui, on a pure white canvas.**

- **Why the microsoft.com language**: EMR software is enterprise productivity software. Microsoft's web vocabulary — a white canvas, Segoe UI type, restrained color with one confident blue, generous whitespace, comfortable 40px+ controls — signals "professional tool", the right tone for hospital staff using this 8 hours a day.
- **Why claymorphism**: depth comes from soft, pillowy elevation — double drop shadows plus an inset top highlight — instead of hard borders. Surfaces read as gently extruded clay on the white page, which keeps hierarchy legible without adding color.
- **Why shadcn/ui**: components are owned in-repo (`components/ui/`), themed centrally through CSS variables, and accessible by default (Radix primitives). We restyle tokens, not components.
- **The primary is Microsoft web blue** (`#0067b8` → `oklch(0.51 0.145 251.5)`): it holds AA contrast as a text color and button fill on white.
- **Decided**: June 2026 (Fluent-inspired baseline); July 2026 (re-aligned to microsoft.com + claymorphism, white background). The product is **Medical EMR**, built by **Redsky Consultancy** (https://redskyconsultancy.com/). The brand string lives in `components/brand/logo.tsx`, the marketing header/footer, and root metadata — update it in those places only.

## Tokens

All tokens live in `app/globals.css` as CSS variables, mapped to Tailwind utilities via `@theme inline`. **Always use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-input`). Never hardcode hex/oklch values in components.**

### Color (light theme)

| Token                            | Value                     | Use for                                                           |
| -------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| `--primary`                      | `oklch(0.51 0.145 251.5)` | Primary actions, links, active states (Microsoft blue `#0067b8`)  |
| `--background`                   | `oklch(1 0 0)`            | App/page background — **always pure white**                       |
| `--foreground`                   | `oklch(0.205 0.01 255)`   | Body text (near-black neutral ink)                                |
| `--card`                         | white                     | Elevated surfaces (separated from the page by clay shadow + ring) |
| `--accent`                       | `oklch(0.945 0.022 250)`  | Light blue wash: hovers, selected items                           |
| `--muted` / `--muted-foreground` | neutral greys             | Secondary surfaces and text                                       |
| `--border` / `--input`           | neutral greys             | Hairlines; inputs slightly darker (visible field borders)         |
| `--destructive`                  | red oklch                 | Errors and destructive actions only                               |

A full dark theme exists under `.dark` (navy-tinted darks, lighter blue primary). Every screen must work in both; never use raw `white`/`black` utilities for surfaces or text.

### Typography

| Role     | Font                                                                 | Tailwind                              |
| -------- | -------------------------------------------------------------------- | ------------------------------------- |
| Headings | Segoe UI Variable Display / Segoe UI → Open Sans fallback (semibold) | `font-heading` (automatic on `h1–h4`) |
| Body/UI  | Segoe UI Variable Text / Segoe UI → Open Sans fallback               | `font-sans` (default)                 |
| Data     | Geist Mono — codes, IDs, timestamps, slugs                           | `font-mono`                           |

The stack is Segoe UI first — the microsoft.com typeface, native on Windows — with **Open Sans** (loaded in `app/layout.tsx` via `next/font`) as the bundled webfont fallback on other platforms. Headings default to semibold with tight tracking (the "Segoe UI Semibold" voice). Do not introduce other fonts.

### Elevation (clay depth ramp)

Custom shadow utilities defined in `globals.css`. Each level is a **claymorphic** shadow: a soft key + ambient drop shadow pair, an inset white highlight along the top edge, and a faint inset shade at the bottom — surfaces read as gently extruded clay on the white page. Values are theme-aware (`--elevation-*` in `:root` / `.dark`), and Tailwind's built-in `shadow-sm…shadow-2xl` are mapped onto the same ramp so floating shadcn surfaces match automatically.

| Utility            | Use for                                |
| ------------------ | -------------------------------------- |
| `shadow-fluent-2`  | Cards at rest, small chips             |
| `shadow-fluent-4`  | Raised cards, primary buttons          |
| `shadow-fluent-8`  | Hover states, dropdowns, command bars  |
| `shadow-fluent-16` | Popovers, tooltips, teaching callouts  |
| `shadow-fluent-28` | Hero artwork, marketing feature panels |
| `shadow-fluent-64` | Dialogs, panels, anything modal        |

Depth communicates hierarchy: the more an element interrupts the user, the higher its elevation. Prefer elevation + hairline border over heavy borders.

### Radius & spacing

- Base radius `--radius: 0.75rem` — the soft clay rounding; shadcn scales it down for small controls. Do not use `rounded-3xl`+ on controls (large radii are reserved for marketing artwork like the CTA banner).
- Controls follow microsoft.com sizing: default buttons/inputs/selects are 40px tall (`h-10`), large CTAs 48px (`h-12`), with generous horizontal padding and semibold labels. Compact `sm`/`xs` sizes remain for dense data UI.
- Spacing follows the 8px grid: prefer Tailwind steps that are multiples of 2 (`gap-2`, `p-4`, `py-6`); use odd steps only inside dense data UI.
- Avoid arbitrary Tailwind length utilities (`w-[360px]`, `text-[15px]`, `rounded-[4px]`) in product UI when a Tailwind scale class or design-system utility exists. Arbitrary values require a clear layout reason and should be rare.

### Surfaces

- `.acrylic` — translucent blurred light surface (sticky headers, floating bars).
- `.acrylic-dark` — navy translucent variant for dark bands.

### Marketing surfaces (editorial layout)

The public marketing pages (`app/(marketing)/`) follow an editorial, image-led layout inspired by a corporate-IT theme: a top utility bar, hexagon/blob-masked photography, dotted-grid accents, eyebrow labels, and a facilities gallery. These treatments are **marketing-only** and must never appear in the clinical app.

- **`--pop` / `bg-pop` / `text-pop`** — a single warm magenta-rose accent used sparingly as a pop (stat badges, a few decorative dots). The deep blue primary is still the dominant colour; `--pop` is the one permitted second accent and is confined to marketing artwork. Dark theme has its own `--pop`.
- **Decorative utilities** (in `globals.css`, marketing-only): `.clip-hexagon` (hero image mask), `.blob-a` / `.blob-b` (organic squircle photo masks), `.dot-grid` and `.dot-halo` (dotted-grid accents; `currentColor` tints the dots).
- **Imagery** comes from the Unsplash CDN via `next/image` (`images.unsplash.com` is whitelisted in `next.config.ts`). Large radii and continuous/parallax motion remain marketing-only, as already noted above.

## Motion (GSAP)

GSAP + `@gsap/react` is the animation library; tw-animate-css is acceptable only for tiny one-shot entrances on simple views (e.g. auth forms).

- **Pattern**: pages stay server components. Animations are driven by `data-*` attributes consumed by a client controller — see `components/marketing/marketing-animations.tsx` (`data-reveal`, `data-reveal-group`, `data-counter`, `data-hero-*`, `data-cta`).
- **Feel**: ease `power3.out`, durations 0.5–0.9s, stagger 0.08–0.12s, travel ≤ 56px. Motion should feel like Fluent: brief, purposeful, never bouncy.
- **Scroll reveals fire once** (`once: true`); scrolling back up must not replay the page.
- **Always respect `prefers-reduced-motion`** — bail out before creating any tween. This is non-negotiable in a healthcare product.
- Continuous motion (floats, parallax) is for marketing surfaces only — never inside the clinical app.

## Components

The full shadcn/ui set (55 components) is installed in `components/ui/` (style `radix-nova`, icon library `lucide-react`). All are themed by the tokens above — **do not fork or restyle a ui component for one screen; pass `className` for layout-level tweaks, and change tokens for theme-level changes.**

- Domain composites live outside `components/ui/`: `components/brand/`, `components/marketing/`, `components/auth/`.
- Page-specific React components under `app/` live in that route's `_components/` directory. Do not create ad hoc `components/` folders beside pages or leave page clients beside `page.tsx`.
- Every `app/**/page.tsx` has a sibling `loader.tsx` that imports and renders `Skeleton` from `@/components/ui/skeleton`. When the page or any route-local `_components/` file changes, update that route's `loader.tsx` in the same change so the loading state remains page-shaped.
- `components/ui/calendar.tsx` was patched for react-day-picker v10 (`month_grid` classNames key replaces v8's `table`). Re-apply if the component is regenerated.
- Charts use `chart.tsx` (Recharts) with `--chart-1..5` (a blue-led ramp). Toasts use `sonner.tsx`.

## UI principles (Microsoft-web-inspired)

1. **White, calm, blue-accented.** The page is pure white; the Microsoft blue primary is the only loud color. If a screen feels colorful, it's wrong.
2. **One accent at a time.** Primary blue marks the single most important action per view. Secondary actions are `outline`/`ghost`.
3. **Clay depth over decoration.** Hierarchy comes from the soft clay elevation ramp, spacing, and type weight — not from colored boxes and heavy borders.
4. **Soft radii, pillowy surfaces.** Corners are gently rounded (12px base) and surfaces sit on soft shadows — friendly, but still a tool.
5. **Type does the talking.** Segoe-voice semibold headings carry personality; body text stays quiet. Mono for anything machine-like (codes, MRNs, timestamps, slugs).
6. **Density with breathing room.** Clinical screens may be dense (tables, schedules) but always on the 8px grid with clear group separation.

## UX principles (EMR-specific)

1. **Context is safety.** The active Tenant and Facility must always be visible (header/sidebar). Staff switching facilities must never be guessing where an action lands.
2. **Clarity over cleverness.** No information critical to patient care hidden behind hover, truncation, or low-contrast text. Tooltips supplement; they never carry sole meaning.
3. **Forgiving forms.** Labels above fields, inline validation on blur (not on keystroke), exact API error messages surfaced verbatim, nothing blocks typing. Password fields get visibility toggles. Required fields are marked with a red asterisk; which fields are required is read from the API/DTO contract for that operation (not decided ad hoc), so the asterisk is `aria-hidden` and the input carries `aria-required`.
4. **Destructive actions confirm.** Deactivate/delete always goes through `alert-dialog` with the entity named in the prompt.
5. **Every async state designed.** Loading = `skeleton` (shape-matched, not spinners-everywhere); empty = `empty` with one clear next action; error = message plus retry.
6. **Keyboard first-class.** Everything reachable by tab; visible focus rings (already on all ui components); `command` palette patterns for power users like front-desk staff.
7. **Respect the session.** Hospital staff live in this product — avoid gratuitous animation, autoplaying anything, or layout shift. Fast and boring beats flashy.

## Checklist for any UI change

- [ ] Semantic tokens only — no raw colors
- [ ] Works in light **and** dark theme
- [ ] Focus-visible states intact; reachable by keyboard
- [ ] `prefers-reduced-motion` respected for any new animation
- [ ] Mobile layout verified (≤ 390px) as well as desktop
- [ ] Loading/empty/error states designed, not defaulted
- [ ] `page.tsx` has a matching sibling `loader.tsx`; changed route-local components update the loader too
- [ ] Uses `components/ui/` primitives instead of bespoke equivalents
