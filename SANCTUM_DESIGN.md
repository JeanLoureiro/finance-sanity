# Sanctum Design System Implementation

## Overview

The **Sanctum** design system has been fully implemented across the Financial Sanity application. This warm-neutral, premium design system provides a calm, professional aesthetic optimized for financial data visualization.

## Design Tokens

All design tokens are defined in `app/globals.css` and include:

### Color Palette

**Surface Layers** (warm off-whites in light mode, warm near-blacks in dark mode):
- `--fs-surface-0`: Page background
- `--fs-surface-1`: Card backgrounds
- `--fs-surface-2`: Hover/elevated states
- `--fs-surface-3`: Sunken panels
- `--fs-surface-inv`: Inverted hero cards

**Ink** (warm near-blacks with subtle chroma):
- `--fs-ink-1`: Primary text
- `--fs-ink-2`: Secondary text
- `--fs-ink-3`: Tertiary/muted text
- `--fs-ink-4`: Placeholder/disabled text

**Accent** (teal/mint):
- `--fs-accent-500`: Primary accent (teal-500)
- `--fs-accent-fg`: Foreground on accent
- `--fs-accent-subtle`: Soft teal background (maps to `--fs-accent-50`)

**Hero KPI Gradient**:
- `--fs-surface-hero-from`: Gradient start (teal-600)
- `--fs-surface-hero-to`: Gradient end (teal-700)
- Applied via `linear-gradient(135deg, var(--fs-surface-hero-from), var(--fs-surface-hero-to))`

**Semantic Colors**:
- `--fs-gain`, `--fs-gain-soft`, `--fs-gain-strong`: Positive changes
- `--fs-loss`, `--fs-loss-soft`, `--fs-loss-strong`: Negative changes

**Asset Categories**:
- `--fs-cat-etf`, `--fs-cat-stock`, `--fs-cat-crypto`
- `--fs-cat-property`, `--fs-cat-super`, `--fs-cat-cash`
- `--fs-cat-mf`, `--fs-cat-other`

### Typography

- **Font**: Inter with OpenType features (`cv11`, `ss01`)
- **Letter spacing**: `-0.01em` to `-0.02em` for headings
- **Font weights**: 500 (medium), 600 (semibold) primarily
- **Tabular numbers**: Applied to all financial values

## Components Updated

### 1. Landing Page (`app/page.tsx`)

**Changes:**
- Hero background uses `var(--fs-surface-inv)`
- Glow effects use accent colors
- Typography refined with tighter letter-spacing
- Font weight changed from `bold` to `semibold`
- Consistent spacing and hierarchy

### 2. Navigation (`components/landing/LandingNav.tsx`)

**Changes:**
- Added brand mark (FS logo)
- Increased height to 16 (64px)
- Better backdrop blur and shadow on scroll
- Refined transitions

### 3. Feature Cards (`components/landing/FeatureCard.tsx`)

**Changes:**
- Icon container uses `bg-fs-surface-2`
- Hover state with `bg-fs-accent-subtle` and `text-fs-accent-strong`
- Lift animation on hover (`-translate-y-0.5`)
- Enhanced shadow on hover
- Refined typography with `-0.01em` letter-spacing

### 4. Button Component (`components/ui/button.tsx`)

**New Variants:**
- `accent`: Uses Sanctum accent colors
- `danger`: Solid red button for destructive actions

**Usage:**
```tsx
<Button variant="accent">Primary Action</Button>
<Button variant="danger">Delete</Button>
```

### 5. Chart Components

**Created:**
- `LineChart` (`components/ui/line-chart.tsx`): Apple Health-style charts
- `Donut` (`components/ui/donut.tsx`): Allocation visualization
- `Segmented` (`components/ui/segmented.tsx`): iOS-style picker

**Usage:**
```tsx
<LineChart
  series={[{ data: [980, 1010, 1040], color: "var(--fs-ink-1)" }]}
  xLabels={["Jan", "Feb", "Mar"]}
  formatY={(v) => `$${v}k`}
/>

<Donut
  data={[
    { value: 220, color: "var(--fs-cat-etf)" },
    { value: 683, color: "var(--fs-cat-property)" }
  ]}
  centerLabel="Assets"
  centerValue="$1.40M"
/>

<Segmented
  options={[
    { label: "1Y", value: "1y" },
    { label: "All", value: "all" }
  ]}
  value={range}
  onChange={setRange}
/>
```

### 6. Login Page (`app/login/page.tsx`)

**Changes:**
- Added brand mark (FS logo)
- Refined card header with logo + title layout
- Better typography with `-0.01em` letter-spacing

### 7. Dashboard Pages

**Updated with Sanctum:**
- **Budget** (`app/(dashboard)/budget/BudgetClient.tsx`):
  - Page header with eyebrow label
  - KPI cards with refined typography (26px, semibold, tight tracking)
  - Gain/loss colors for savings metrics
  - Breakdown cards with hover effects and accent colors
  - Tabular numbers for all financial values

**Already Using Sanctum:**
- Sidebar: Active items use `bg-fs-accent-subtle text-fs-accent-strong` with a teal left-border indicator (`bg-fs-accent-500`)
- Topbar: Breadcrumbs and search with Sanctum colors
- Net Worth page: Hero KPI cards with inverted styling
- KPI component: Supports inverted mode for hero cards

## Design System Page

View all components and tokens in action (super admins only — the route 404s for other users):
```
/design-system
```

This page showcases:
- Teal palette + semantic + asset category color swatches
- Typography scale (14px base)
- Buttons, badges, KPI tiles, cards, table, form elements

## Utility Classes

### `.fs-table`

Add this class to any `<table>` element to apply the standard Sanctum table style:
- Teal-tinted header background with uppercase `fs-accent-700` column labels
- Alternating zebra rows using `--fs-surface-2`
- Teal hover highlight (`--fs-accent-50`) with a 100ms transition

```tsx
<table className="w-full fs-table">
  <thead><tr><th className="text-left px-4">Asset</th>…</tr></thead>
  <tbody>…</tbody>
</table>
```

## Design Principles

1. **Warm Neutrals**: All grays have subtle warm chroma for a premium feel
2. **Refined Typography**: Tight letter-spacing (-0.01em to -0.02em) on headings
3. **Subtle Transitions**: 120-200ms duration with ease-out curves
4. **Consistent Spacing**: 4px base scale (s-1 through s-10)
5. **Semantic Colors**: Gain/loss colors for financial data
6. **Category Colors**: Distinct colors for each asset type

## Dark Mode

Dark mode is fully supported with:
- Inverted surface layers
- Adjusted accent colors for better contrast
- Maintained semantic meaning (gain/loss colors)
- Consistent shadows with higher opacity

Toggle dark mode via the theme toggle in the topbar.

## Browser Support

The design uses modern CSS features:
- `oklch()` color space for perceptually uniform colors
- CSS custom properties (CSS variables)
- Backdrop blur effects
- CSS Grid and Flexbox

Supported browsers: Chrome 111+, Safari 15.4+, Firefox 113+, Edge 111+

## Future Enhancements

Potential additions to the design system:
- Additional accent color themes
- Density variants (compact, balanced, spacious)
- Chart fill options (minimal, soft)
- Mono numbers toggle
- Sparkline visibility toggle

## Resources

- Design prototype: `/Users/jeanloureiro/Projects/compiledSanity/financial-sanity-html/`
- Tokens reference: `app/globals.css`
- Component library: `components/ui/`
- Design system page: `app/(dashboard)/design-system/page.tsx`
