# CampusFlow — Design System

Direction: **neo-brutalism, sober.** Think municipal notice board and carbon-copy service forms, not startup landing page. Flat colour, thick ink borders, hard offset shadows, dense honest data. Nothing glows, nothing blurs, nothing gradients.

---

## 1. Principles

1. **Function is the decoration.** Status, priority and SLA are the visual hierarchy. If an element doesn't carry information, remove it.
2. **Hard edges, real borders.** 2 px ink borders, 0–2 px radius, offset shadows with zero blur.
3. **Paper and ink.** Warm off-white paper, near-black ink, three muted signal colours.
4. **Tables are first-class.** This is an operations tool. Dense, readable tables beat card grids.
5. **Monospace for machine data.** IDs, timestamps, SLA timers, counts.
6. **Asymmetry with intent.** Left-aligned, uneven column widths, oversized section numerals. No centred-hero-plus-three-icon-cards template.

## 2. Anti-"AI-generated" Rules (hard constraints)

- ❌ No gradients of any kind (backgrounds, buttons, text, borders).
- ❌ No purple, violet, indigo, or blue-to-pink anything.
- ❌ No glassmorphism, blur, glow, neon, or soft shadows.
- ❌ No emoji as icons. No sparkle icons. No robot imagery.
- ❌ No centred hero with a tagline + two buttons + three feature cards.
- ❌ No generic copy: "Welcome to the future of…", "Seamless", "Empower", "Revolutionize", "Effortless".
- ❌ No rounded-2xl pill soup. No pastel blobs.
- ❌ No stock illustrations. No lorem ipsum in any screen; use real campus data (Block C, Room 214, Hostel H-4).
- ✅ Copy is plain and specific: "Raise a request", "12 open in Electrical", "Breached 41 min ago".
- ✅ Icons: a small custom set of simple 2 px square-cap line icons (or Phosphor "bold" set), used sparingly, always paired with a text label.
- ✅ Visible grid lines, rule lines, stamp-like badges, ticket-stub motifs for request cards.

## 3. Colour Tokens

Sober, low-saturation, print-like.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F1EDE3` | App background |
| `--paper-2` | `#E6E1D3` | Table zebra, secondary surfaces |
| `--card` | `#FBF9F3` | Panels, inputs |
| `--ink` | `#16150F` | Text, borders, shadows |
| `--ink-2` | `#4A483E` | Secondary text |
| `--ink-3` | `#7C7A6C` | Muted text, disabled |
| `--accent` | `#1F5C57` | Primary actions (deep teal-green) |
| `--accent-ink` | `#F1EDE3` | Text on accent |
| `--signal-amber` | `#D9A21B` | Warning, P2, SLA at risk |
| `--signal-brick` | `#B5432B` | Danger, P1, breach |
| `--signal-moss` | `#5B7A3A` | Resolved, healthy |
| `--signal-steel` | `#3E5A73` | Info, in progress |
| `--signal-clay` | `#A9795A` | On hold, neutral flag |

Contrast: all text/background pairs must hit WCAG AA (4.5:1). Amber is always used with `--ink` text, never white.

### Status → colour (chips are filled with a flat colour, ink border, ink text unless noted)

| Status | Fill | Text |
|---|---|---|
| OPEN | `--card` | ink |
| ASSIGNED | `--signal-steel` | paper |
| IN_PROGRESS | `--signal-amber` | ink |
| ON_HOLD | `--signal-clay` | ink |
| RESOLVED | `--signal-moss` | paper |
| CLOSED | `--paper-2` | ink-2 |
| REOPENED | `--signal-brick` | paper |
| CANCELLED | `--paper-2` + diagonal hatch | ink-2 |

### Priority

| Priority | Treatment |
|---|---|
| P1 | Brick fill, paper text, label `P1 CRITICAL` |
| P2 | Amber fill, ink text |
| P3 | Card fill, ink border |
| P4 | Paper-2 fill, ink-3 text |

## 4. Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / H1–H2 | **Archivo** (variable, use width 110–125 if available) or Archivo Black | 800–900 | Uppercase for H1, tight tracking −0.01em |
| Body / UI | **IBM Plex Sans** | 400/500/600 | 15 px base |
| Data / IDs / timers | **IBM Plex Mono** | 400/500 | Tabular numerals |

Scale (px): 12, 13, 15, 18, 24, 32, 48, 72 (72 only for oversized section numerals). Line-height 1.45 for body, 1.05 for display.

Avoid Inter, Space Grotesk, Poppins and Geist; they read as template defaults.

## 5. Spacing, Borders, Shadows

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64.
- Border: `2px solid var(--ink)` default. Heavy dividers `3px`. Table row rules `1px solid var(--ink)` at 20% opacity is **not** allowed (no translucency); use `--paper-2` solid.
- Radius: `0` default; `2px` for inputs and chips only.
- Shadows: `4px 4px 0 var(--ink)` for raised elements; `6px 6px 0` for modals; `2px 2px 0` for small chips. No blur radius ever.
- Pressed state: element translates `(4px, 4px)` and shadow becomes `0 0 0` (looks physically pushed in).
- Grid: 12-col, 24 px gutter, max width 1280 px, sidebar fixed at 232 px.

## 6. CSS Tokens (drop into `frontend/src/styles/tokens.css`)

```css
:root {
  --paper:#F1EDE3; --paper-2:#E6E1D3; --card:#FBF9F3;
  --ink:#16150F; --ink-2:#4A483E; --ink-3:#7C7A6C;
  --accent:#1F5C57; --accent-ink:#F1EDE3;
  --amber:#D9A21B; --brick:#B5432B; --moss:#5B7A3A; --steel:#3E5A73; --clay:#A9795A;

  --bw:2px; --bw-heavy:3px;
  --sh-sm:2px 2px 0 var(--ink);
  --sh-md:4px 4px 0 var(--ink);
  --sh-lg:6px 6px 0 var(--ink);
  --r:0; --r-sm:2px;

  --font-display:"Archivo", "Archivo Black", system-ui, sans-serif;
  --font-body:"IBM Plex Sans", system-ui, sans-serif;
  --font-mono:"IBM Plex Mono", ui-monospace, monospace;
}
```

Tailwind: extend `colors`, `boxShadow` (`brut`, `brut-sm`, `brut-lg`), `fontFamily`, `borderWidth` (`DEFAULT: 2px`), and set `borderRadius.DEFAULT = 0`. Disable the default shadow, blur and gradient utilities from usage via an ESLint/Tailwind lint rule: forbid `bg-gradient-*`, `shadow-*` (non-brut), `blur-*`, `backdrop-*`, `rounded-lg+`, any `purple|violet|indigo|fuchsia|pink` class.

## 7. Components

### Button
- Primary: accent fill, accent-ink text, 2 px ink border, `--sh-md`. Uppercase 13 px, 600, letter-spacing 0.04em.
- Secondary: card fill, ink text. Danger: brick fill.
- Hover: shadow grows to `--sh-lg`, translate `(-1px,-1px)`. Active: translate `(4px,4px)`, no shadow. Focus: 3 px amber outline offset 2 px (never remove focus).
- Disabled: paper-2 fill, ink-3 text, no shadow.

### Input / Select / Textarea
Card fill, 2 px ink border, radius 2 px, 40 px height, label above in 12 px uppercase mono. Focus: border stays ink, add `--sh-sm` in accent colour. Error: brick border and a one-line brick message with the rule violated ("Description needs at least 20 characters").

### Chip / Badge
Rectangular, 2 px ink border, 12 px mono uppercase, `--sh-sm` optional. Priority and status as per tables above.

### Request Row (primary list item) — ticket-stub style
```
┌────────────┬──────────────────────────────────────────┬──────────┬────────────┬───────────────┐
│ CF-2026-0123│ AC not cooling — Block C, Room 214       │ P2       │ IN_PROGRESS│ 02:14:07 left │
│ (mono)      │ Electrical · Raised by A. Sharma · 2h ago│          │            │ (SLA timer)   │
└────────────┴──────────────────────────────────────────┴──────────┴────────────┴───────────────┘
```
Left edge has a 8 px solid bar in the priority colour. Row hover: shifts background to `--paper-2` and adds `--sh-sm`. SLA timer turns amber under 25% remaining and brick with "BREACHED" stamp when negative (rotated −3°, 2 px brick border, uppercase mono).

### Table
Header row: ink fill, paper text, mono uppercase 12 px. Zebra with `--paper-2`. Sticky header. Column resize not required. Empty state: a bordered box with a plain sentence and one action, no illustration.

### Modal / Drawer
Card fill, 3 px ink border, `--sh-lg`. Backdrop is solid ink at 100% opacity? No: use `#16150F` at 60% via a flat overlay (the only permitted transparency in the system). Request detail opens as a right-side drawer 560 px wide.

### Timeline (history and comments)
Vertical 3 px ink rule on the left; each event is a square 12 px node (not a circle) with mono timestamp; internal comments are tinted `--paper-2` with a "INTERNAL" stamp.

### Toast
Bottom-left, card fill, 2 px border, `--sh-md`, left colour bar for type. Auto-dismiss 5 s. No slide-bounce; use a 120 ms step transition.

### Stat block (dashboard)
Big mono number (48 px), uppercase label above, 3 px top border in the relevant signal colour. No icons, no sparkline gradients; sparklines are flat 2 px ink lines with square caps.

### Charts
Recharts or visx, flat fills from the signal palette, 2 px ink strokes, no gridline fades, no rounded bars, no tooltips with shadows (use the standard `--sh-sm` box).

## 8. Layout and Screens

Global shell: left sidebar (232 px, ink background, paper text, active item has an amber 4 px left bar), top bar with search and the user's role stamp, content on paper.

| # | Screen | Layout notes |
|---|---|---|
| 1 | **Login / Register** | Split 5/7: left column ink block with an oversized "CF" wordmark and the live count "128 requests open today" from the API; right column form. No illustrations. |
| 2 | **My Requests** (Requester) | Table of ticket-stub rows, filter chips on top, "RAISE REQUEST" primary button top-right. |
| 3 | **New Request** | Single column form on a "carbon-copy form" panel: numbered fields (01 Category, 02 Location, 03 What's wrong, 04 Attachments). Right rail shows expected response time from SLA matrix for the chosen category. |
| 4 | **Request Detail** (drawer or page) | Header with public ID, status chip, priority chip. Two columns: left timeline and comments; right facts panel (assignee, department, SLA timers, location) and action buttons allowed for the role. Stale-version conflict shows an inline diff banner. |
| 5 | **Department Queue** (Technician/Head) | Kanban-less: table grouped by status with sticky group headers, sorted by priority then SLA remaining. Bulk reassign for Head. |
| 6 | **Dashboard** (Head/Admin) | 12-col grid: four stat blocks, SLA compliance bar chart, requests-by-category bars, workload table, hotspot list. Section numerals "01–04" oversized in outline text. |
| 7 | **Admin Console** | Tabs: Users, Departments, Categories & Routing, SLA Policies, Audit Log. Plain data tables with inline edit. |
| 8 | **Notifications** | Chronological list, unread items have a solid ink left bar. |

Responsive: sidebar collapses to a top bar at <900 px; tables become stacked ticket-stub rows at <640 px. Touch targets ≥ 44 px.

## 9. Motion

- Functional only: 100–150 ms linear/step transitions on button press, drawer slide (translateX), toast appear.
- No parallax, no float, no fade-in-on-scroll, no skeleton shimmer gradients (skeletons are flat `--paper-2` blocks that blink opacity 100/60%).
- Respect `prefers-reduced-motion`.

## 10. Content and Microcopy

| Context | Write | Don't write |
|---|---|---|
| Empty list | "No requests yet. Raise one when something breaks." | "Oops! Nothing here ✨" |
| Success | "Request CF-2026-0123 raised. Electrical will pick it up." | "Awesome! You're all set!" |
| Conflict | "Someone changed this request while you were editing. Review changes." | "Something went wrong" |
| Breach | "SLA breached 41 min ago. Escalated to Dept Head." | "Uh-oh!" |
| Loading | "Loading requests" | "Hang tight, magic is happening" |

Tone: municipal, direct, short. Sentence case for body, uppercase only for labels and buttons.

## 11. Accessibility

- WCAG AA contrast, visible focus (3 px amber outline), full keyboard navigation, `aria-live="polite"` on toasts and SLA changes.
- Never rely on colour alone: status chips always carry text; priority has text plus bar plus label.
- Forms: labels linked, errors announced.

## 12. Definition of "Done" for any UI work

- [ ] Uses only tokens from section 6 (no raw hex in components)
- [ ] Zero gradients, blur, soft shadows, purple-family colours
- [ ] Real data, no lorem ipsum, no emoji
- [ ] Keyboard and screen-reader pass
- [ ] Looks correct at 1280, 768 and 390 px
- [ ] Squint test: status and priority are readable without reading text
