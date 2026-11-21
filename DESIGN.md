# EMR Design System

The design source of truth for all frontend work. Any agent or developer building UI must follow this document. If a change requires deviating from it, update this document in the same change.

## The decision

**Microsoft Fluent-inspired, built on shadcn/ui, with a deep blue primary.**

- **Why Fluent**: EMR software is enterprise productivity software. Fluent's vocabulary — clean light surfaces, restrained color, flat surfaces with elevation reserved for overlays, small radii, dense-but-breathable layouts — signals "professional tool", which is the right tone for hospital staff using this 8 hours a day.
- **Why shadcn/ui**: components are owned in-repo (`components/ui/`), themed centrally through CSS variables, and accessible by default (Radix primitives). We restyle tokens, not components.
- **Why a darker blue**: Microsoft's brand blue (`#0078D4`) is too bright for long clinical sessions and too recognizable as "Microsoft". Our primary is a deeper, calmer blue — `oklch(0.43 0.118 254)` — that holds AA contrast as a text color and button fill on white.
- **Decided**: June 2026, while building the marketing and auth pages. The product is **Medical EMR**, built by **Redsky Consultancy** (https://redskyconsultancy.com/). The brand string lives in `components/brand/logo.tsx`, the marketing header/footer, and root metadata — update it in those places only.
- **Refreshed**: November 2026, to give the clinical app more room. The app took the shell and control sizing of our Whiteboard and Construction Management products: the Satoshi typeface, an ink floating sidebar, a large page title over a faint watermark of itself, 40px form controls, a 12px base radius, flat shadowless surfaces, and tables with a header band. The deep blue primary and the semantic status colours did not change.
- **Deployment branding**: `LOGIN_LOGO_VARIANT` selects the visible Dhathri logo across login, navigation, loading screens, and the browser icon. `none` keeps the Medical EMR mark. Product copy and metadata still identify Medical EMR and Redsky Consultancy.

## Tokens

All tokens live in `app/globals.css` as CSS variables, mapped to Tailwind utilities via `@theme inline`. **Always use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-input`). Never hardcode hex/oklch values in components.**

### Color (light theme)

| Token                            | Value                    | Use for                                                          |
| -------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `--primary`                      | `oklch(0.43 0.118 254)`  | Links, selection, active states                                  |
| `--cta`                          | `oklch(0.225 0.018 268)` | Solid call-to-action fill (`Button` default): near-black ink     |
| `--background`                   | `oklch(0.975 0.006 262)` | App/page background (cool tinted grey, so white cards lift off)  |
| `--foreground`                   | `oklch(0.21 0.03 265)`   | Body text (navy ink, not pure black)                             |
| `--card`                         | white                    | Elevated surfaces                                                |
| `--field`                        | white                    | Fill of text boxes, Selects and Comboboxes (`bg-field`)          |
| `--accent`                       | `oklch(0.948 0.02 248)`  | Light blue wash: hovers, selected items                          |
| `--muted` / `--muted-foreground` | cool greys               | Secondary surfaces and text                                      |
| `--border` / `--input`           | cool greys               | Hairlines; inputs slightly darker (Fluent visible-field borders) |
| `--destructive`                  | red oklch                | Errors, blocked states, and destructive actions                  |

The sidebar has its own tokens (`--sidebar*`) and is **ink in both themes**: a near-black panel whose current row is `--sidebar-selected`, a grey a step lighter than the hover grey, marked by a white `--sidebar-selected-indicator` bar. `--sidebar-primary` is kept for solid accents such as the avatar. The page keeps its own theme; the sidebar does not follow it.

A full dark theme exists under `.dark` (navy-tinted darks, lighter blue primary). Every screen must work in both; never use raw `white`/`black` utilities for surfaces or text.

One exception: photo scrims (the auth brand panel) use fixed black and white, so text stays legible on any image in both themes.

### Functional and status colors

Clinical booking uses semantic color to distinguish functionality and resource status:

| Token           | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `--primary`     | Selection, the current step, and Consultation              |
| `--procedure`   | Procedure and Treatment functionality                      |
| `--success`     | Ready, available, verified, or completed                   |
| `--warning`     | Pending work, cleaning, maintenance, and clinical warnings |
| `--destructive` | Blocked or unavailable resources and errors                |

Identity accents colour a decorative icon beside a text label in list cells, never on their own: `--gender-male` (dark blue) and `--gender-female` (hot pink) for the gender glyphs, and `--phone` (green) for the phone glyph in the Patients table.

These tokens have light and dark values in `app/globals.css`. Use restrained tinted backgrounds,
borders, icons, and badges; reserve solid primary for the main action. Status text and an icon must
accompany color. Selected resources use blue while their availability status remains labeled.
Resource option cards use equal grid tracks and retain all details when text wraps.

#### Visit step accents

The Visit workspace gives each consultation step one accent so the Doctor can tell where they are
at a glance. The accent colours the step's icon in the step track, its heading icon and progress
bar, and the matching sections of the Patient context pane. The current step is marked by the ink
pill, not by its accent. It is identity, not status, so labels and icons always carry the meaning.

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

| Role     | Font                                       | Tailwind                              |
| -------- | ------------------------------------------ | ------------------------------------- |
| Headings | Satoshi                                    | `font-heading` (automatic on `h1–h4`) |
| Body/UI  | Satoshi                                    | `font-sans` (default)                 |
| Data     | Geist Mono — codes, IDs, timestamps, slugs | `font-mono`                           |

Satoshi is the single global sans: headings and body share the family, so hierarchy comes from
weight and size rather than a second typeface. (It replaced Urbanist in November 2026.) Data stays
on Geist Mono, a monospaced face, so digits line up in columns.

Satoshi is a variable font (weights 300–900). Its `@font-face` is declared at the top of
`globals.css` and points at the font file on Fontshare's CDN; `--font-satoshi` names it and
`app/layout.tsx` preconnects to the CDN. Its licence allows loading it from Fontshare but not
committing the font files to a public repository. No third-party stylesheet is loaded, so the font
never blocks first paint: with `font-display: swap` the UI shows in the system sans-serif font
until Satoshi arrives, and stays in it if the CDN is unreachable. Geist Mono is loaded in
`app/layout.tsx` via `next/font`. Do not introduce other fonts.

Using Fontshare is a deliberate choice: every staff browser requests the font file from
`cdn.fontshare.com`. A deployment's network must allow that host, and any future
Content-Security-Policy must list `https://cdn.fontshare.com` under `font-src`. A deployment that
cannot make third-party requests runs in the system font.

### Elevation (Fluent depth ramp)

**The clinical app is flat.** Nothing that sits in the page casts a shadow: cards, headers, toolbars, stat cards, command bars, sticky and fixed bars, the active tab and the sidebar panel are separated only by a solid `bg-card` (white) surface, its hairline border, and the tinted page behind it. Do not add `shadow-*` to an in-page surface, including on hover; a hover state changes the border or background instead.

Shadows are kept only for surfaces that float over the page and must read as on top of it: menus, selects, popovers, hover cards and combobox lists (the shadcn defaults in `components/ui/`), and sheets and dialogs (`shadow-fluent-64`).

The custom Fluent steps in `globals.css` remain for those overlays and for the marketing site:

| Utility                                | Use for                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `shadow-fluent-2` … `shadow-fluent-28` | Marketing pages only (hero artwork, feature panels, chips) |
| `shadow-fluent-64`                     | Sheets and dialogs                                         |

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

- In-page surfaces (cards, page and record headers, command bars, sticky or fixed action bars) are solid `bg-card`, never translucent or tinted.
- `.acrylic` — translucent blurred light surface. In the app it is used only by the page-coloured `AppTopbar`, which has no border and must blend with the page; the marketing site header also uses it.
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
- **Loading indicators are the one exception.** A `Spinner`, a `Skeleton` pulse and the dots and logo pulse on the app splash may loop, because they are only on screen while something is loading. They still stop under `prefers-reduced-motion`, and the splash then shows its "Loading your workspace…" caption instead.
- Small component-level effects that are not page choreography (the splash dots, the auth headline wobble) use the `motion` library; they follow the same rules.

## Components

The full shadcn/ui set (55 components) is installed in `components/ui/` (style `radix-nova`). All are themed by the tokens above — **do not fork or restyle a ui component for one screen; pass `className` for layout-level tweaks, and change tokens for theme-level changes.**

- Domain composites live outside `components/ui/`: `components/brand/`, `components/marketing/`, `components/auth/`.
- Page-specific React components under `app/` live in that route's `_components/` directory. Do not create ad hoc `components/` folders beside pages or leave page clients beside `page.tsx`.
- Every `app/**/page.tsx` has a sibling `loader.tsx` that imports and renders `Skeleton` from `@/components/ui/skeleton`. When the page or any route-local `_components/` file changes, update that route's `loader.tsx` in the same change so the loading state remains page-shaped.
- `components/ui/calendar.tsx` was patched for react-day-picker v10 (`month_grid` classNames key replaces v8's `table`). Re-apply if the component is regenerated.
- **Icons** come from `react-icons`. Use Circum Icons (`react-icons/ci`, `Ci*`) wherever Circum has the glyph. Circum has no plain check, X, plus, minus, chevron, arrow, spinner, eye-off, rich-text or most user-variant icons, so those use Phosphor's Light weight (`react-icons/pi`, `Pi*Light`), the closest thin line style; `PiCircleNotchLight` with `animate-spin` is the loading spinner. Type an icon prop as `IconType` from `react-icons`. Size icons with `size-*` classes; never set `strokeWidth`, because Circum draws its outlines as filled paths. A filled icon (such as rating stars) uses Phosphor's `Fill` weight, not a `fill-*` class. `components.json` still names `lucide` because the shadcn CLI accepts no other value here, so swap the icon imports in any component the CLI adds.
- **Tabs** use `components/ui/tabs.tsx`: a white pill track with a hairline ring and one ink (`--cta`) pill that glides to the current tab with GSAP (`power3.out`, 0.5s; it jumps under `prefers-reduced-motion`). Every `TabsTrigger` leads with an icon before its label (`aria-hidden`, sized by the trigger). Until the pill has measured its first position the active trigger fills itself, so the first frame is correct. A row of many tabs scrolls sideways (`max-w-full overflow-x-auto`) instead of wrapping. The `line` variant (underline) stays available but is unused. A loader mirrors the track as one `h-10 rounded-full` skeleton. **A pill track sits on the page, never inside a card**: its hairline ring next to a card's border reads as a border inside a border, so the track goes above the card that holds its content (see the Visit workspace).
- **Stat cards** use `StatCard` from `components/app/stat-card.tsx`: a plain white card with a small muted label, one large figure in the foreground colour, an optional hint line, and a 40px round icon chip in the corner. The chip is the only part that takes a status tone (`neutral` by default, then `primary`, `success`, `warning`, `destructive`); the card surface, border and figure are never tinted, and a page has no gradient banners. A row of stat cards sits in a `gap-4` grid. Pass `onPress` and `pressed` when the cards filter the list below them, and use `StatCardSkeleton` for the loading state. Do not hand-roll a stat card in a route.
- Charts use `chart.tsx` (Recharts) with `--chart-1..5` (a blue-led ramp). Toasts use `sonner.tsx`.
- **Tables** use `components/ui/table.tsx`: a muted header band with small uppercase labels, 3.5 units of vertical cell padding, and 20px insets on the first and last column. Wrap a table in a `Card` with `py-0` (or a `bg-card rounded-xl border` box) so the band meets the card edge. A hand-rolled `<table>`, and the loader skeleton that mirrors it, takes `tableHeadRowClass`, `tableHeadCellClass` and `tableCellClass` from `components/ui/table-styles.ts` instead of repeating the class strings; `TableCell` uses the same constant. Deliberately dense tables keep their own smaller padding.

## App shell

The authenticated shell is `SidebarProvider` → `AppSidebar` + `SidebarInset` in `app/(protected)/layout.tsx`.

- **`AppSidebar`** is a floating ink panel (`variant="floating"`, 2xl radius). Rows are 40px pills; the current row is `sidebar-selected`, a grey a step lighter than the hover grey (`sidebar-accent`), with white semibold text and a 3px white `sidebar-selected-indicator` bar on its left edge. A solid blue fill shouted on the ink panel, and a black one disappeared into it. Collapsed to icons, the bar is dropped. A parent with a submenu only brightens, and its current child carries the selection; collapsed to icons the submenu is hidden, so the parent takes the selection instead. Group labels are `sidebar-foreground/60`, which keeps them above 4.5:1 on the panel. It is a sheet on a phone.
- **`AppTopbar`** is a slim sticky utility bar: the sidebar trigger, global search, the active Tenant (`TenantChip`), help and notifications. It carries no page title.
- **`AppPageHeader`** sits under the top bar on every page. It shows the page's sidebar group as a small muted eyebrow (`getAppPageGroup`), the title as a plain `h1` in the foreground colour, and the subtitle under it. The title is repeated behind the header as a large watermark at 4.5% foreground opacity that drifts in from the left on navigation, inside the motion rule (0.7s, `power3.out`; skipped under `prefers-reduced-motion`); it is `aria-hidden` and clipped by the header. Title and subtitle come from `app-shell-config.ts`; a page does not render its own `h1`, and its section headings start at `h2`. A task page that needs its own name (Check in Patient, Reschedule Appointment) gets its own page meta there instead of a second, larger heading in the page.
- A page header **primary action** (`primaryAction` in the page meta) is only for pages whose content has no always-visible button for the same action. A list page with a create button in its toolbar leaves it out, so an action never appears twice.
- On a phone the Tenant chip moves from the top bar into the page header, so the active Tenant stays visible.

## Clinical surfaces

- **Rich text fields**: `components/clinical/rich-text-editor.tsx` matches `Input` (same radius, border, focus ring) and shows its formatting toolbar below the text only while focused, so a form with many narrative fields stays calm. The toolbar is never the only route to the text.
- **Visit workspace** (`/visits/[id]`): a sticky Patient header holds the one primary action for the current Visit Status. Under it, two pill tracks sit level on the page: the Patient context tabs (Trends, Previous Visits) over the context card, and the consultation steps over the step card. The step track (`consultation-step-nav.tsx`) looks and moves like `Tabs` but is a `nav` of buttons with `aria-current="step"`, because the steps are parts of one consultation; it shows fields filled per step. When the track is narrow, the steps other than the current one drop their count and their icon (a done step keeps its check) before the track scrolls sideways. The step card opens with the step's heading and progress bar and ends with the save status, Back and Continue. Boxes inside a step are plain hairline boxes with no coloured edge. The consultation is an inline form, not a Sheet, because it is the main task on the page. Closing a Visit warns about open items rather than blocking.
- **Everything within reach**: the consultation is one scrolling page with numbered sections and a sticky jump bar showing fields filled per section. Workflow steps are clickable, a Quick actions panel holds every Visit task, and Previous Visits expand in place, newest first. Tabs hold separate records (Billing, Documents), never the encounter itself.
- **EMR and Ayurveda**: `isAyurvedaBrand()` in `components/brand/brand-config.ts` decides whether Ayurveda-specific fields appear. `LOGIN_LOGO_VARIANT=none` is the general EMR. Keep shared screens free of Ayurvedic wording unless they check this.

## UI principles (Fluent-inspired)

1. **Light, calm, blue-accented.** Surfaces are near-white and cool-tinted; the main action is a near-black ink button (`--cta`, off-white in dark), and deep blue primary marks links, selection and the current step. Functional and status colors add meaning through restrained tints.
2. **One accent at a time.** One solid ink button marks the single most important action per view. Secondary actions are `outline`/`ghost`. Functional and status colors may coexist when each communicates a distinct meaning.
3. **Flat, not decorated.** Hierarchy comes from white surfaces on the tinted page, hairline borders, spacing, and type weight — not from shadows, colored boxes or heavy borders. Only overlays (menus, popovers, sheets, dialogs) are elevated.
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
