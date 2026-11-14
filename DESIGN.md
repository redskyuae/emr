# EMR Design System

The design source of truth for all frontend work. Any agent or developer building UI must follow this document. If a change requires deviating from it, update this document in the same change.

## The decision

**Microsoft Fluent-inspired, built on shadcn/ui, with a deep blue primary.**

- **Why Fluent**: EMR software is enterprise productivity software. Fluent's vocabulary — clean light surfaces, restrained color, depth through elevation, small radii, dense-but-breathable layouts — signals "professional tool", which is the right tone for hospital staff using this 8 hours a day.
- **Why shadcn/ui**: components are owned in-repo (`components/ui/`), themed centrally through CSS variables, and accessible by default (Radix primitives). We restyle tokens, not components.
- **Why a darker blue**: Microsoft's brand blue (`#0078D4`) is too bright for long clinical sessions and too recognizable as "Microsoft". Our primary is a deeper, calmer blue — `oklch(0.43 0.118 254)` — that holds AA contrast as a text color and button fill on white.
- **Decided**: June 2026, while building the marketing and auth pages. The product is **Medical EMR**, built by **Redsky Consultancy** (https://redskyconsultancy.com/). The brand string lives in `components/brand/logo.tsx`, the marketing header/footer, and root metadata — update it in those places only.
- **Refreshed**: November 2026, to give the clinical app more room. The app took the shell and control sizing of our Whiteboard and Construction Management products: the Satoshi typeface, an ink floating sidebar, a large page title over a faint watermark of itself, 40px form controls, a 12px base radius, softer shadows, and tables with a header band. The deep blue primary and the semantic status colours did not change.
- **Deployment branding**: `LOGIN_LOGO_VARIANT` selects the visible Dhathri logo across login, navigation, loading screens, and the browser icon. `none` keeps the Medical EMR mark. Product copy and metadata still identify Medical EMR and Redsky Consultancy.

## Tokens

All tokens live in `app/globals.css` as CSS variables, mapped to Tailwind utilities via `@theme inline`. **Always use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-input`). Never hardcode hex/oklch values in components.**

### Color (light theme)

| Token                            | Value                    | Use for                                                          |
| -------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `--primary`                      | `oklch(0.43 0.118 254)`  | Primary actions, links, active states                            |
| `--background`                   | `oklch(0.975 0.006 262)` | App/page background (cool tinted grey, so white cards lift off)  |
| `--foreground`                   | `oklch(0.21 0.03 265)`   | Body text (navy ink, not pure black)                             |
| `--card`                         | white                    | Elevated surfaces                                                |
| `--field`                        | white                    | Fill of text boxes, Selects and Comboboxes (`bg-field`)          |
| `--accent`                       | `oklch(0.948 0.02 248)`  | Light blue wash: hovers, selected items                          |
| `--muted` / `--muted-foreground` | cool greys               | Secondary surfaces and text                                      |
| `--border` / `--input`           | cool greys               | Hairlines; inputs slightly darker (Fluent visible-field borders) |
| `--destructive`                  | red oklch                | Errors, blocked states, and destructive actions                  |

The sidebar has its own tokens (`--sidebar*`) and is **ink in both themes**: a near-black panel with `--sidebar-primary`, a lifted blue, for the active row. The page keeps its own theme; the sidebar does not follow it.

A full dark theme exists under `.dark` (navy-tinted darks, lighter blue primary). Every screen must work in both; never use raw `white`/`black` utilities for surfaces or text.

### Functional and status colors

Clinical booking uses semantic color to distinguish functionality and resource status:

| Token           | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `--primary`     | Selection, the current step, and Consultation              |
| `--procedure`   | Procedure and Treatment functionality                      |
| `--success`     | Ready, available, verified, or completed                   |
| `--warning`     | Pending work, cleaning, maintenance, and clinical warnings |
| `--destructive` | Blocked or unavailable resources and errors                |

These tokens have light and dark values in `app/globals.css`. Use restrained tinted backgrounds,
borders, icons, and badges; reserve solid primary for the main action. Status text and an icon must
accompany color. Selected resources use blue while their availability status remains labeled.
Resource option cards use equal grid tracks and retain all details when text wraps.

#### Visit step accents

The Visit workspace gives each consultation step one accent so the Doctor can tell where they are
at a glance. The accent tints the step's nav item, its heading icon and the stripe on top of the
step pane, and the matching sections of the Patient context pane. It is identity, not status, so
labels and icons always carry the meaning.

| Step              | Token         | Why                                            |
| ----------------- | ------------- | ---------------------------------------------- |
| Subjective        | `--primary`   | The Consultation itself                        |
| Objective         | `--chart-4`   | Teal for Vital Signs and examination           |
| Assessment        | `--pop`       | The one permitted second accent, for diagnosis |
| Plan & Session    | `--procedure` | Treatment functionality                        |
| Review & complete | `--success`   | Completion                                     |

`--warning` and `--destructive` stay reserved for alerts (Allergies tint destructive only when the
Patient has an active allergy).

### Typography

| Role     | Font                                                     | Tailwind                              |
| -------- | -------------------------------------------------------- | ------------------------------------- |
| Headings | Satoshi                                                  | `font-heading` (automatic on `h1–h4`) |
| Body/UI  | Satoshi                                                  | `font-sans` (default)                 |
| Data     | Satoshi, tabular figures — codes, IDs, timestamps, slugs | `font-mono`                           |

Satoshi is the single global font: headings, body and data share the family, so hierarchy comes
from weight and size rather than a second typeface. (It replaced Urbanist in November 2026.)
`font-mono` is kept as the semantic marker for codes and IDs; it maps to Satoshi with tabular
figures so numbers still line up in columns.

Satoshi is a variable font (weights 300–900) loaded from Fontshare's servers by `FontStylesheet`
(`components/providers/font-stylesheet.tsx`), rendered once in `app/layout.tsx`; `--font-satoshi`
in `globals.css` names it. Its licence allows loading it from Fontshare but not committing the
font files to a public repository. If Fontshare is unreachable the UI falls back to the system
sans-serif font. Do not introduce other fonts.

### Elevation (Fluent depth ramp)

Custom shadow utilities defined in `globals.css`, replacing Tailwind's default shadows for surfaces.
The steps keep their Fluent names, but the shadows are soft and low-contrast: a card at rest is
separated mostly by its hairline ring and the tinted page behind it.

| Utility            | Use for                                |
| ------------------ | -------------------------------------- |
| `shadow-fluent-2`  | Cards at rest, small chips             |
| `shadow-fluent-4`  | Raised cards                           |
| `shadow-fluent-8`  | Hover states, dropdowns, command bars  |
| `shadow-fluent-16` | Popovers, tooltips, teaching callouts  |
| `shadow-fluent-28` | Hero artwork, marketing feature panels |
| `shadow-fluent-64` | Dialogs, panels, anything modal        |

Depth communicates hierarchy: the more an element interrupts the user, the higher its elevation. Prefer elevation + hairline border over heavy borders.

### Radius & spacing

- Base radius `--radius: 0.75rem` (12px): controls are `rounded-lg` (12px), cards `rounded-xl` (16px), small chips `rounded-md` (10px). Do not use `rounded-3xl`+ on controls (large radii are reserved for marketing artwork like the CTA banner).
- Spacing follows the 8px grid: prefer Tailwind steps that are multiples of 2 (`gap-2`, `p-4`, `py-6`); use odd steps only inside dense data UI.
- **Leave room.** The page has 32px side gutters on desktop (`lg:px-8`), cards pad their content by 20px (16px for `size="sm"`), and sections sit 16px apart. Do not add `p-3`/`p-4` to a `CardContent` that sits directly in a `Card`: the card already pads it. A `Card` whose content is flush (a table, a list) takes `py-0`.
- **Control sizes.** Inputs, Selects, search boxes and toolbar buttons are 40px tall so a toolbar lines up without overrides.

  | Control                                 | Height                                |
  | --------------------------------------- | ------------------------------------- |
  | `Input`, `SelectTrigger`, `InputGroup`  | 40px (`SelectTrigger size="sm"` 32px) |
  | `Button` `xs` / `sm` / `default` / `lg` | 28 / 32 / 36 / 40px; icon sizes match |
  | `Toggle` `sm` / `default` / `lg`        | 32 / 36 / 40px                        |
  | `Badge`                                 | 24px                                  |

  Use `size="lg"` for a button or toggle group beside an input. Do not pin a control's height with `h-8`/`h-9`; deliberately dense grids (the Billing Counter line editor) are the exception.

- Avoid arbitrary Tailwind length utilities (`w-[360px]`, `text-[15px]`, `rounded-[4px]`) in product UI when a Tailwind scale class or design-system utility exists. Arbitrary values require a clear layout reason and should be rare.

### Surfaces

- `.acrylic` — translucent blurred light surface (sticky headers, floating bars).
- `.acrylic-dark` — navy translucent variant for dark bands.

### Marketing surfaces (editorial layout)

The public marketing pages (`app/(marketing)/`) follow an editorial, image-led layout inspired by a corporate-IT theme: a top utility bar, hexagon/blob-masked photography, dotted-grid accents, eyebrow labels, and a facilities gallery. These treatments are **marketing-only** and must never appear in the clinical app.

- **`--pop` / `bg-pop` / `text-pop`** — a single warm magenta-rose accent used sparingly as a pop (stat badges, a few decorative dots). The deep blue primary is still the dominant colour; `--pop` is the one permitted second accent and is confined to marketing artwork and the Assessment step accent in the Visit workspace. Dark theme has its own `--pop`.
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
- **Tables** use `components/ui/table.tsx`: a muted header band with small uppercase labels, 3.5 units of vertical cell padding, and 20px insets on the first and last column. Wrap a table in a `Card` with `py-0` (or a `bg-card rounded-xl border` box) so the band meets the card edge. A hand-rolled `<table>` copies the same header row classes.

## App shell

The authenticated shell is `SidebarProvider` → `AppSidebar` + `SidebarInset` in `app/(protected)/layout.tsx`.

- **`AppSidebar`** is a floating ink panel (`variant="floating"`, 2xl radius). Rows are 40px pills; the current row is solid `sidebar-primary`. A parent with a submenu only brightens, and its current child carries the pill. It still collapses to icons, and is a sheet on a phone.
- **`AppTopbar`** is a slim sticky utility bar: the sidebar trigger, global search, the active Tenant (`TenantChip`), help and notifications. It carries no page title.
- **`AppPageHeader`** sits under the top bar on every page. It shows the page's sidebar group as a small muted eyebrow (`getAppPageGroup`), the title as a plain `h1` in the foreground colour, and the subtitle under it. The title is repeated behind the header as a large watermark at 4.5% foreground opacity that drifts in from the left on navigation (skipped under `prefers-reduced-motion`); it is `aria-hidden` and clipped by the header. Title and subtitle come from `app-shell-config.ts`; a page does not render its own `h1`, and its section headings start at `h2`.
- A page header **primary action** (`primaryAction` in the page meta) is only for pages whose content has no always-visible button for the same action. A list page with a create button in its toolbar leaves it out, so an action never appears twice.
- On a phone the Tenant chip moves from the top bar into the page header, so the active Tenant stays visible.

## Clinical surfaces

- **Rich text fields**: `components/clinical/rich-text-editor.tsx` matches `Input` (same radius, border, focus ring) and shows its formatting toolbar below the text only while focused, so a form with many narrative fields stays calm. The toolbar is never the only route to the text.
- **Visit workspace** (`/visits/[id]`): a sticky Patient header holds the one primary action for the current Visit Status, a workflow stepper shows progress, and a snapshot rail keeps Vital Signs, allergies, medications, and the completion checklist in view. The consultation is an inline form, not a Sheet, because it is the main task on the page. Closing a Visit warns about open items rather than blocking.
- **Everything within reach**: the consultation is one scrolling page with numbered sections and a sticky jump bar showing fields filled per section. Workflow steps are clickable, a Quick actions panel holds every Visit task, and Previous Visits expand in place, newest first. Tabs hold separate records (Billing, Documents), never the encounter itself.
- **EMR and Ayurveda**: `isAyurvedaBrand()` in `components/brand/brand-config.ts` decides whether Ayurveda-specific fields appear. `LOGIN_LOGO_VARIANT=none` is the general EMR. Keep shared screens free of Ayurvedic wording unless they check this.

## UI principles (Fluent-inspired)

1. **Light, calm, blue-accented.** Surfaces are near-white and cool-tinted; deep blue primary anchors the main action. Functional and status colors add meaning through restrained tints.
2. **One accent at a time.** Primary blue marks the single most important action per view. Secondary actions are `outline`/`ghost`. Functional and status colors may coexist when each communicates a distinct meaning.
3. **Depth over decoration.** Hierarchy comes from elevation, spacing, and type weight — not from colored boxes and heavy borders.
4. **Soft corners, calm surfaces.** A 12px base radius and hairline rings; nothing bubbly.
5. **Type does the talking.** Satoshi headings carry personality through weight and size; body text stays quiet. Mono for anything machine-like (codes, MRNs, timestamps, slugs).
6. **Breathing room first.** Staff use this all day: generous gutters, 40px controls and roomy table rows come before fitting more on screen. Deliberately dense grids are the exception, and still sit on the 8px grid with clear group separation.

## UX principles (EMR-specific)

1. **Context is safety.** Show the active Tenant in the shell. When Facility selection is available, show the selected Facility too. Never substitute a sample Facility name for missing session context; staff must not have to guess where an action lands.
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
- [ ] No second `h1`, no duplicate of the page header's title or primary action, and no pinned control heights
