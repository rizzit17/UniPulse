---
name: Civic Cartography
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#57423b'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#8a726a'
  outline-variant: '#dec0b7'
  surface-tint: '#a23e18'
  primary: '#9f3c16'
  on-primary: '#ffffff'
  primary-container: '#bf542c'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59c'
  secondary: '#615e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e4dfdb'
  on-secondary-container: '#65625f'
  tertiary: '#2a674c'
  on-tertiary: '#ffffff'
  tertiary-container: '#448064'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#822801'
  secondary-fixed: '#e7e1de'
  secondary-fixed-dim: '#cbc5c2'
  on-secondary-fixed: '#1d1b19'
  on-secondary-fixed-variant: '#494644'
  tertiary-fixed: '#b1f0ce'
  tertiary-fixed-dim: '#95d4b3'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#0e5138'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 44px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  title-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-stamp:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-caption:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system treats campus infrastructure as civic architecture. It merges the deliberate structure of Swiss modernist wayfinding and transit maps with the tactile, high-density utility of archival indexing, Linear, and editorial catalog design.

### Brand Personality & Emotional Tone
- **Architectural & Authoritative:** Built on structural permanence, physical stone, and institutional responsibility. It rejects ephemeral SaaS aesthetics in favor of spatial clarity.
- **Quietly Confident:** Interfaces remain calm under pressure. Critical facility failures, hazardous maintenance, and campus operations are presented without panic-inducing bright red alarms, but with precise, high-contrast, ticket-based taxonomy.
- **Utilitarian & Exact:** Every element behaves like a physical ledger entry, public transit timetable, or building dispatch docket.

### Visual Aesthetic
The style is strictly flat, tectonic, and grounded:
- **Zero Gradients & Zero Blurred Depth:** Absolute ban on CSS backdrops, glassmorphic sheen, colorful glows, decorative floating blobs, and generic SaaS card elevations.
- **Structural Lines:** Layouts rely on 1px solid hairline grid intersections, ticket-spine notches, and dense typographic hierarchy to organize complex data.
- **Physical Document Metaphors:** Manifested through perforated slip edges, tabular indexing ribbons, ticket receipt margins, and stamped monospace metadata.

## Colors

The palette is rooted in mineral pigments, terracotta brickwork, and warm architectural stone. It decisively avoids standard tech-blue and synthetic purple tones.

### Canvas & Surface Hierarchy
- **Canvas (`#FBF9F5`):** Warm unbleached bone canvas. Acts as the primary structural ground.
- **Surface / Card (`#F3EFEA`):** Low-contrast structural paper tone. Used for docket cards, sheets, and active panels.
- **Surface Elevated / Input (`#FFFFFF`):** Pure white used sparingly for input fields, data entry cells, and focused index tabs.
- **Border Structural / Hairline (`#E8E2D8`):** 1px precise perimeter dividing columns, headers, and ticket segments.
- **Border Contrast (`#262422`):** Pure deep umber for high-priority outlines, focus states, and index tags.
- **Text Primary (`#262422`):** Deep charcoal-umber ink; high legibility without the harshness of pure `#000000`.
- **Text Secondary (`#706B65`):** Warm stone gray for secondary details, metadata labels, and tabular titles.
- **Text Muted (`#A8A29A`):** Lightened umber for inactive markers, column borders, and micro-grid rules.

### Brand Accent
- **Raw Terracotta (`#C85A32`):** The primary civic brand accent. Evokes fired clay, architectural drafting seals, and transit routing lines.
- **Deep Sienna (`#B84D26`):** Hover, active, and focused states for terracotta components.

### Operational Status Palette (Signaling Tokens)
Status tokens use subdued background washes paired with authoritative ink text and hairline framing:
- **Critical / SLA Breached:** Deep Rust Vermilion (Text: `#C23B22`, Background: `#FDF2F0`, Border: `#F5C6CB`).
- **Urgent / Expedited (<25% SLA):** Warm Ochre Amber (Text: `#B45309`, Background: `#FEF7EE`, Border: `#FCE4B8`).
- **Active / Dispatched:** Spruce Forest Olive (Text: `#2D6A4F`, Background: `#EDF6F1`, Border: `#C2E2D0`).
- **Pending / Scheduled:** Slate Charcoal (Text: `#57534E`, Background: `#F5F5F4`, Border: `#E7E5E4`).
- **Resolved / Archived:** Muted Meadow Sage (Text: `#386641`, Background: `#F0F5F1`, Border: `#C8DFCD`).

## Typography

The typographic system balances high-character editorial authority with industrial record-keeping clarity.

### Typographic Roles
- **Display & Headings (Newsreader):** Brings an intellectual, civic journal quality. Used for dashboard overviews, incident dispatch titles, category divisions, and empty-state broadsheets. Headings must be set with optical sizing enabled and tighter tracking to convey editorial poise.
- **Body & UI (IBM Plex Sans):** An industrial, geometric grotesque with humanist touches. Handles data grids, service instructions, team logs, and conversational activity feeds with neutral legibility.
- **Data, Telemetry & Codes (JetBrains Mono):** The operational spine of the design system. Dedicated to tracking identifiers (`UP-2026-00812`), SLA count-down timers (`01:42:19`), architectural room pins (`HALL-B·LVL-2·RM-204`), and ticket timestamps. All numbers in data tables must use tabular figures (`font-variant-numeric: tabular-nums`).

### Micro-Typographic Rules
- **Micro-Labels (`label-stamp`):** Always transformed to uppercase with letter-spacing set to `0.08em`.
- **Hierarchical Contrast:** Pair serif titles directly with monospaced tracking strings below them (e.g., a 24px Newsreader title above a 12px JetBrains Mono identifier) to anchor screen elements.

## Layout & Spacing

Layouts follow an architectural drafting grid with continuous horizontal and vertical registration rules.

### Layout Philosophy: Structural Grid & Index Columns
- **12-Column Grid (Desktop):** Elements align to a 12-column matrix separated by 1px rules or deliberate gutters.
- **Multi-Spine Shell:** The layout uses a persistent primary index spine (280px left rail for status queues and filters), an expansive central manifest sheet (fluid service requests and routing maps), and an optional inspection inspector drawer (400px docket sheet).
- **Edge Alignment:** Cards, tables, and inspection panes do not float with arbitrary air around them. They snap directly to neighboring structural 1px borders, emulating stacked ledger folios.

### Responsive Behavior
- **Mobile (< 768px):** Single-column layout. The left filter rail collapses into a horizontal scrollable index bar (`space-sm` gap). Margin is locked to `1rem`. Secondary ticket metadata hides behind an expandable drawer.
- **Tablet (768px - 1024px):** 6-column fluid structure. Margin expands to `2rem`. Left rail collapses into an icon-and-label docked ribbon (64px width).
- **Desktop (> 1024px):** Full 12-column layout with 24px gutters and structural dividing lines. Margins scale to `3rem` to establish clear broadsheet proportions.

## Elevation & Depth

Visual hierarchy is built through **stacked tonal surfaces and crisp structural borders**, deliberately avoiding drop shadows and blur filters.

### Tonal Stratification
Depth is created by stepping upward through neutral tones:
1. **Layer 0 (Canvas Base - `#FBF9F5`):** The foundation canvas representing the architectural blueprint desk.
2. **Layer 1 (Recessed Well - `#EFEAE2`):** Used for filter sidebars, inactive list bays, and data table headers.
3. **Layer 2 (Document Surface - `#F3EFEA`):** Used for individual ticket blocks, inspection sections, and dispatch lists.
4. **Layer 3 (Foreground Precision - `#FFFFFF`):** Reserved for focused inputs, active tabs, floating modal sheets, and tooltips.

### Line-Weight Hierarchy (Zero-Shadow Rule)
- **Ambient & Drop Shadows:** Standard CSS box-shadows are strictly `0 0 0 0 transparent`. No diffuse blur cones or saturated ambient color drop-offs.
- **Hairline Outlines:** Containers use a crisp `1px solid #E8E2D8` edge.
- **Focus & Selection Rules:** Active selection is communicated using an inner or outer `1px solid #262422` border, paired with an optional terracotta accent pip (`3px` square or `4px` hairline bar).
- **Notch Shadows:** Modals and flyout dockets use an intentional hard-edge contact stroke (`box-shadow: 2px 2px 0px 0px #262422`) instead of soft blur.

## Shapes

The design system uses sharp, unrounded geometry (`roundedness: 0`), reinforcing the physical feel of technical manuals, index cards, and printed tickets.

### Geometry & Edge Details
- **Base Corner Radius:** `0px` on buttons, cards, form inputs, dialogs, and tags. Corners remain orthogonal and crisp.
- **Ticket Notches (Physical Metaphor):** Request sheets and priority tokens may incorporate mechanical 45-degree chamfers (2px–4px) or inward-cut 6px circular ticket punches along the dividing line between ticket header and request body.
- **Linear Grid Dividing Lines:** Panels end in sharp right-angle intersections, aligning borders into continuous horizontal and vertical guidelines.

## Components

### Buttons
- **Primary Action (Dispatch / Resolve):** Flat `#C85A32` terracotta fill, `#FFFFFF` text, `0px` radius, font `IBM Plex Sans` 13px weight 600, uppercase micro-spacing (`0.04em`). Hover state shifts to `#B84D26`. Focus ring is an offset `1px solid #262422` with 2px gap.
- **Secondary (Inspect / Edit):** `#F3EFEA` background, `1px solid #262422` border, `#262422` text. Hover state shifts to `#262422` background with `#FBF9F5` text.
- **Tertiary / Ghost:** No background, no border, `#706B65` text. Hover state shifts to `#262422` text with an underline border (`1px solid #262422`).

### Chips, Badges & Status Stamps
- **Status Stamps:** Rendered in `JetBrains Mono` 11px uppercase (`label-stamp`). Framed by a 1px border using status-specific tokens (e.g., Rust Vermilion, Spruce Olive). No rounded corners. Must contain a small leading glyph or monospace mark: `[!] CRITICAL`, `[*] ACTIVE`, `[-] RESOLVED`.
- **Location & Category Index Chips:** `#EFEAE2` background, `1px solid #E8E2D8`, `#262422` body text, accompanied by an architectural room code in tabular monospace.

### Input Fields & Controls
- **Form Fields:** Crisp white (`#FFFFFF`) background, `1px solid #E8E2D8` border, 0px radius, 14px `IBM Plex Sans`. Focused inputs transition to `1px solid #262422` border with zero glow or blur. Placeholder text is `#A8A29A`.
- **Checkboxes & Radios:** Sharp square boxes (`14px x 14px`), `1px solid #262422`, `#FFFFFF` interior. Checked state fills the box with `#262422` displaying an inset square or sharp crosshair mark.

### Request Cards & Docket Sheets
- **The "Transit Ticket" Manifest Item:** Instead of rounded floating white cards, requests are rendered as continuous stacked strips.
- **Left Spine (The Stub):** Monospace ID (`UP-2026-000412`), status badge, and elapsed SLA ticker.
- **Center Body:** Serif incident headline (`Newsreader` 18px), brief summary (`IBM Plex Sans` 14px), and tabular location pin (`BLK-C · LVL-02 · RM-210`).
- **Dividing Spine:** Separated from the stub by a `1px dashed #E8E2D8` rule with circular receipt notches cut into the top and bottom edges.
- **Right Stub:** Assignee signature initials in small monospaced caps and a terracotta action trigger.

### Tables & Data Grids
- **Header:** Sticky `#EFEAE2` strip, bottom border `1px solid #262422`. Labels set in `JetBrains Mono` 11px uppercase (`#706B65`).
- **Rows:** Alternating subtle zebra striping (`#FBF9F5` to `#F7F4EF`), separated by `1px solid #E8E2D8`. Row hover is a clean tint `#EFEAE2` with a `2px solid #C85A32` left boundary indicator.
- **Tabular Numerals:** All timestamp, duration, room code, and SLA columns enforce `font-variant-numeric: tabular-nums`.

### SLA Countdown Tick-Rule
- A thin, continuous 2px structural progress line running along the bottom edge of high-priority dispatch cards.
- Composed of segmented hatch-marks (ticks) that change color based on urgency: Spruce Olive (>50% SLA remaining), Warm Ochre (25-50%), and Deep Vermilion (<25% or breached).