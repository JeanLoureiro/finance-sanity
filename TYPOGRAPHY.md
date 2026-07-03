# Sanctum Typography Scale

## Font Sizes

The Sanctum design system uses a precise typography scale defined in CSS variables:

```css
--font-size-text-xs: 11px;    /* Tiny labels, metadata */
--font-size-text-sm: 12px;    /* Small labels, captions */
--font-size-text-base: 14px;  /* Base body text */
--font-size-text-md: 15px;    /* Medium body text */
--font-size-text-lg: 16px;    /* Large body, section titles */
--font-size-text-xl: 20px;    /* Secondary KPI values */
--font-size-text-2xl: 22px;   /* Page titles */
--font-size-text-3xl: 28px;   /* Hero KPI values */
--font-size-text-4xl: 44px;   /* Hero card values */
--font-size-text-5xl: 56px;   /* Display headings */
```

## Usage in Components

### KPI Cards (Regular)
```tsx
<Card>
  <CardContent className="flex flex-col gap-1.5 px-5 py-[18px]">
    <span className="text-[var(--font-size-text-sm)] text-[var(--fs-ink-3)]">
      Label
    </span>
    <span 
      className="font-semibold tracking-tight tabular-nums text-[var(--fs-ink-1)]"
      style={{ fontSize: "var(--font-size-text-2xl)", letterSpacing: "-0.01em" }}
    >
      $1,247,892
    </span>
  </CardContent>
</Card>
```

### Hero Cards (Inverted)

Use the `<Kpi inverted>` component, which applies the teal gradient (`--fs-surface-hero-from` → `--fs-surface-hero-to`) automatically:

```tsx
<Kpi inverted label="Net Worth" value="$1,247,892" sub={<Badge variant="gain">…</Badge>} />
```

If building a custom hero surface, apply the gradient manually:
```tsx
<div 
  className="rounded-xl text-white"
  style={{
    background: "linear-gradient(135deg, var(--fs-surface-hero-from), var(--fs-surface-hero-to))",
    padding: "24px 28px"
  }}
>
  <span className="text-sm text-white/60">Net Worth · April 2026</span>
  <span className="text-[26px] font-semibold tracking-tight tabular-nums text-white">$1,247,892</span>
</div>
```

### Page Headers
```tsx
<div>
  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
    Overview
  </p>
  <h1 
    className="mt-1 font-semibold tracking-tight" 
    style={{ fontSize: "var(--font-size-text-3xl)", letterSpacing: "-0.01em" }}
  >
    Net Worth
  </h1>
</div>
```

### Section Headers
```tsx
<h2 
  className="font-semibold text-[var(--fs-ink-1)]"
  style={{ fontSize: "var(--font-size-text-lg)", letterSpacing: "-0.01em" }}
>
  Spending Breakdown
</h2>
```

## Font Features

The Sanctum design uses Inter with OpenType features:

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-feature-settings: "cv11" 1, "ss01" 1;
```

- **cv11**: Single-story 'a' (more modern)
- **ss01**: Alternate stylistic set

## Tabular Numbers

All financial values should use tabular numbers for alignment:

```tsx
<span className="tabular-nums">$1,247,892</span>
```

Or with CSS:
```css
font-variant-numeric: tabular-nums;
```

## Letter Spacing

- **Headings**: `-0.01em` to `-0.02em` (tighter)
- **Body text**: Default (0)
- **Labels**: `0.5px` to `1px` (looser, especially for uppercase)

## Font Weights

- **Regular**: 400 (rarely used)
- **Medium**: 500 (body text, labels)
- **Semibold**: 600 (headings, KPI values)
- **Bold**: 700 (rarely used, only for emphasis)

## Color Pairings

### Light Mode
- **Primary text**: `var(--fs-ink-1)` - oklch(0.18 0.008 60)
- **Secondary text**: `var(--fs-ink-2)` - oklch(0.42 0.010 60)
- **Muted text**: `var(--fs-ink-3)` - oklch(0.58 0.012 60)
- **Placeholder**: `var(--fs-ink-4)` - oklch(0.70 0.012 60)

### Dark Mode
- **Primary text**: `var(--fs-ink-1)` - oklch(0.97 0.005 80)
- **Secondary text**: `var(--fs-ink-2)` - oklch(0.78 0.010 75)
- **Muted text**: `var(--fs-ink-3)` - oklch(0.62 0.012 70)
- **Placeholder**: `var(--fs-ink-4)` - oklch(0.45 0.012 65)

### On Hero (Teal Gradient) Surfaces
- Use plain `text-white`, `text-white/60`, `text-white/70` — the teal gradient provides sufficient contrast in both modes.

## Examples

### Budget Page KPIs (via `<Kpi>`)
- **Label**: 12px (text-sm), ink-3
- **Value**: 26px (hard-coded in Kpi component), semibold, tracking-tight
- **Padding**: 18px vertical, 20px horizontal

### Net Worth Hero Card (via `<Kpi inverted>`)
- **Background**: teal gradient (`--fs-surface-hero-from` → `--fs-surface-hero-to`)
- **Label**: 12px (text-sm), white @ 60% opacity
- **Value**: 26px hard-coded, semibold, white
- **Sub-text**: 12px (text-sm), white @ 70% opacity
- **Padding**: 18px vertical, 20px horizontal

### Breakdown Cards
- **Label**: 11px (text-xs), ink-3
- **Value**: 15px (text-md), semibold
- **Percentage**: 11px (text-xs), ink-3
