import type { DashboardWidgetPref } from "./schemas";

// Re-export for convenience
export type { DashboardWidgetPref };

// ---------------------------------------------------------------------------
// Widget registry — defines all known widgets and their metadata.
// ---------------------------------------------------------------------------
/** Number of columns in the dashboard grid. Widgets are placed within this width. */
export const GRID_COLUMNS = 4;

export interface WidgetDef {
  key: string;
  label: string;
  description: string;
  /** Grid column span in the 4-column grid (1–4). */
  colSpan: 1 | 2 | 3 | 4;
  /** Grid row span (height, in row units). */
  rowSpan: 1 | 2 | 3;
  /** Whether this widget uses the hero gradient styling. */
  hero?: boolean;
  /** Feature flag key on UserSettings (e.g. "useFIRE"). If set, widget is hidden when flag is false. */
  featureFlag?: keyof { useCapitalGains: boolean; useFIRE: boolean; useSuper: boolean; useDividends: boolean; useSideIncome: boolean; useProperty: boolean; useLiabilities: boolean; useManagedFunds: boolean; useOtherAssets: boolean; useCrypto: boolean };
}

export const WIDGET_REGISTRY: WidgetDef[] = [
  { key: "networth-hero",    label: "Net Worth hero",     description: "Total net worth with sparkline",   colSpan: 1, rowSpan: 1, hero: true },
  { key: "investable",       label: "Investable assets",  description: "KPI with sparkline",               colSpan: 1, rowSpan: 1 },
  { key: "property-equity",  label: "Property equity",    description: "KPI",                              colSpan: 1, rowSpan: 1 },
  { key: "liabilities",      label: "Liabilities",        description: "KPI with trend",                   colSpan: 1, rowSpan: 1 },
  { key: "history-chart",    label: "Net Worth history",  description: "Area chart",                       colSpan: 3, rowSpan: 2 },
  { key: "allocation",       label: "Allocation",         description: "Allocation bar + legend",          colSpan: 1, rowSpan: 1 },
  { key: "allocation-chart", label: "Asset Allocation",   description: "Donut + target bars",              colSpan: 1, rowSpan: 2 },
  { key: "asset-breakdown",  label: "Asset breakdown",    description: "Table",                            colSpan: 2, rowSpan: 2 },
  { key: "properties",       label: "Properties",         description: "Table + LVR",                      colSpan: 3, rowSpan: 2 },
  { key: "fire-progress",    label: "FIRE progress",      description: "FIRE projection summary",          colSpan: 1, rowSpan: 1, featureFlag: "useFIRE" },
  { key: "budget-summary",   label: "Budget",             description: "Savings rate this month",          colSpan: 1, rowSpan: 1 },
  { key: "dividends",        label: "Dividends",          description: "FY dividends received",            colSpan: 2, rowSpan: 1, featureFlag: "useDividends" },
  { key: "side-income",      label: "Side income",        description: "Extra income by FY",               colSpan: 1, rowSpan: 1, featureFlag: "useSideIncome" },
  { key: "super-breakdown",  label: "Super breakdown",    description: "Balances across accounts",         colSpan: 1, rowSpan: 1, featureFlag: "useSuper" },
  { key: "cash-accounts",    label: "Cash accounts",      description: "Per-account balances",             colSpan: 1, rowSpan: 1 },
];

// ---------------------------------------------------------------------------
// Default layout — ordered array of { key, visible }.
// This is the starting point for new users (null in DB).
// ---------------------------------------------------------------------------
export const DEFAULT_LAYOUT: DashboardWidgetPref[] = [
  { key: "networth-hero", visible: true },
  { key: "investable", visible: true },
  { key: "liabilities", visible: true },
  { key: "history-chart", visible: true },
  { key: "asset-breakdown", visible: true },
  // Remaining widgets start hidden — users can enable them in edit mode
  { key: "property-equity", visible: false },
  { key: "allocation", visible: false },
  { key: "allocation-chart", visible: false },
  { key: "properties", visible: false },
  { key: "fire-progress", visible: false },
  { key: "budget-summary", visible: false },
  { key: "dividends", visible: false },
  { key: "side-income", visible: false },
  { key: "super-breakdown", visible: false },
  { key: "cash-accounts", visible: false },
];

// ---------------------------------------------------------------------------
// Reconciliation helper — merges saved layout with registry.
// - Drops keys not in registry (stale widgets).
// - Appends new registry keys as hidden (new widgets added in code).
// - Preserves order and visibility of existing keys.
// ---------------------------------------------------------------------------
export function reconcileLayout(
  saved: DashboardWidgetPref[] | null | undefined,
  featureFlags?: Partial<Record<"useCapitalGains" | "useFIRE" | "useSuper" | "useDividends" | "useSideIncome" | "useProperty" | "useLiabilities" | "useManagedFunds" | "useOtherAssets" | "useCrypto", boolean>>
): DashboardWidgetPref[] {
  // No saved layout yet (new user) — start from the curated default rather than all-hidden.
  const effectiveSaved = saved ?? DEFAULT_LAYOUT;

  const registryKeys = new Set(WIDGET_REGISTRY.map((w) => w.key));
  const savedMap = new Map(effectiveSaved.map((item) => [item.key, item]));

  const result: DashboardWidgetPref[] = [];

  // First, preserve saved items that still exist in registry
  for (const item of effectiveSaved) {
    if (registryKeys.has(item.key)) {
      result.push(item);
    }
  }

  // Then, append registry keys not in saved (new widgets) as hidden
  for (const widget of WIDGET_REGISTRY) {
    if (!savedMap.has(widget.key)) {
      result.push({ key: widget.key, visible: false });
    }
  }

  // Filter out widgets whose feature flag is off (if flags provided)
  const filtered = featureFlags
    ? result.filter((item) => {
        const widget = WIDGET_REGISTRY.find((w) => w.key === item.key);
        if (!widget?.featureFlag) return true;
        return featureFlags[widget.featureFlag] !== false;
      })
    : result;

  // Assign coordinates to any visible widget missing a valid position by packing
  // it into the first free cell. This bootstraps existing layouts (saved before
  // coordinates existed) and any newly-shown widget.
  return packMissingPositions(filtered);
}

// ---------------------------------------------------------------------------
// Grid geometry
// ---------------------------------------------------------------------------

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Width/height (in grid cells) for a widget key, from the registry. */
export function getWidgetSize(key: string): { w: number; h: number } {
  const def = getWidgetDef(key);
  return { w: def?.colSpan ?? 1, h: def?.rowSpan ?? 1 };
}

/** True if two rectangles overlap. */
function rectsOverlap(a: GridRect, b: GridRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Whether `candidate` can be placed without leaving the grid horizontally and
 * without overlapping any of the `occupied` rectangles. Vertical space is
 * unbounded (the grid grows downward).
 */
export function fits(candidate: GridRect, occupied: GridRect[]): boolean {
  if (candidate.x < 0 || candidate.y < 0) return false;
  if (candidate.x + candidate.w > GRID_COLUMNS) return false;
  return !occupied.some((rect) => rectsOverlap(candidate, rect));
}

/** Build the list of occupied rectangles for the given visible widgets, optionally excluding one key. */
export function occupiedRects(
  items: DashboardWidgetPref[],
  excludeKey?: string
): GridRect[] {
  return items
    .filter((item) => item.visible && item.key !== excludeKey && item.x != null && item.y != null)
    .map((item) => {
      const { w, h } = getWidgetSize(item.key);
      return { x: item.x as number, y: item.y as number, w, h };
    });
}

/** Find the first free top-left cell (scanning row-major) where a w×h box fits. */
function firstFreeCell(w: number, h: number, occupied: GridRect[]): { x: number; y: number } {
  for (let y = 0; y < 1000; y++) {
    for (let x = 0; x + w <= GRID_COLUMNS; x++) {
      if (fits({ x, y, w, h }, occupied)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/**
 * Assigns (x, y) to any visible widget that lacks a valid position, packing it
 * into the first free cell. Widgets with existing coordinates are left in place.
 */
function packMissingPositions(items: DashboardWidgetPref[]): DashboardWidgetPref[] {
  const placed: GridRect[] = occupiedRects(items);
  return items.map((item) => {
    if (!item.visible || (item.x != null && item.y != null)) return item;
    const { w, h } = getWidgetSize(item.key);
    const { x, y } = firstFreeCell(w, h, placed);
    placed.push({ x, y, w, h });
    return { ...item, x, y };
  });
}

/**
 * Compacts the layout vertically: pulls every visible widget up as far as it
 * can go without overlapping the widgets above it, removing the empty rows left
 * behind by inserts. Column (x) positions are preserved.
 */
export function compactLayout(layout: DashboardWidgetPref[]): DashboardWidgetPref[] {
  const visible = layout
    .filter((item) => item.visible && item.x != null && item.y != null)
    .sort((a, b) => (a.y as number) - (b.y as number) || (a.x as number) - (b.x as number));

  const placed: GridRect[] = [];
  const newY = new Map<string, number>();

  for (const item of visible) {
    const { w, h } = getWidgetSize(item.key);
    const x = item.x as number;
    let y = item.y as number;
    while (y > 0 && fits({ x, y: y - 1, w, h }, placed)) {
      y--;
    }
    placed.push({ x, y, w, h });
    newY.set(item.key, y);
  }

  return layout.map((item) => (newY.has(item.key) ? { ...item, y: newY.get(item.key) } : item));
}

// ---------------------------------------------------------------------------
// Helper to get widget definition by key.
// ---------------------------------------------------------------------------
export function getWidgetDef(key: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.key === key);
}
