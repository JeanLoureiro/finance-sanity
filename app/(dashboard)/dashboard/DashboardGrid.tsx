"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  getWidgetSize,
  occupiedRects,
  fits,
  GRID_COLUMNS,
  type DashboardWidgetPref,
  type GridRect,
} from "@/lib/dashboardWidgets";
import { NetWorthHero } from "./widgets/NetWorthHero";
import { Investable } from "./widgets/Investable";
import { PropertyEquity } from "./widgets/PropertyEquity";
import { Liabilities } from "./widgets/Liabilities";
import { HistoryChart } from "./widgets/HistoryChart";
import { Allocation } from "./widgets/Allocation";
import { AssetAllocation } from "./widgets/AssetAllocation";
import { AssetBreakdown } from "./widgets/AssetBreakdown";
import { Properties } from "./widgets/Properties";
import { FIREProgress } from "./widgets/FIREProgress";
import { BudgetSummary } from "./widgets/BudgetSummary";
import { Dividends } from "./widgets/Dividends";
import { SideIncome } from "./widgets/SideIncome";
import { SuperBreakdown } from "./widgets/SuperBreakdown";
import { CashAccounts } from "./widgets/CashAccounts";
import { Button } from "@/components/ui/button";
import { GripVertical, X } from "lucide-react";

interface DashboardGridProps {
  layout: DashboardWidgetPref[];
  isEditMode: boolean;
  onLayoutChange: (newLayout: DashboardWidgetPref[]) => void;
  netWorth: number;
  monthDelta: number;
  monthDeltaPercent: number;
  historyNetWorth: number[];
  historyInvestable: number[];
  historyLiabilities: number[];
  totalInvestable: number;
  totalAssets: number;
  propertyEquity: number;
  propertyCount: number;
  liabilitiesTotal: number;
  history: { date: string; netWorth: number; cashTotal: number; etfTotal: number; stockTotal: number; cryptoTotal: number; managedFundTotal: number; superTotal: number; propertyValue: number; liabilitiesTotal: number; savingsRate: number | null }[];
  allocationSegments: { name: string; value: number; color: string }[];
  allocationData: { name: string; value: number; target: number }[];
  assetRows: { label: string; value: number; color: string; histKey: string }[];
  properties: { id: string; name: string; currentValue: number; currentMortgageBalance: number; equity: number }[];
}

// Grid metrics — ROW_UNIT_PX is the *minimum* row height; rows grow to fit content.
const ROW_UNIT_PX = 168;
const GAP_PX = 24;

/** Parse a computed `grid-template-*` value ("168px 360px …") into track pixel sizes. */
function parseTracks(value: string): number[] {
  return value
    .split(" ")
    .map((token) => parseFloat(token))
    .filter((size) => !Number.isNaN(size));
}

/**
 * Given track sizes and the gap, return the index of the track line the offset
 * is nearest to (i.e. the cell whose start edge is closest). Handles the
 * variable row heights produced by content-sized rows.
 */
function snapToTrack(offset: number, tracks: number[], gap: number): number {
  let start = 0;
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index <= tracks.length; index++) {
    const distance = Math.abs(offset - start);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
    start += (tracks[index] ?? ROW_UNIT_PX) + gap;
  }
  return bestIndex;
}

function DraggableWidget({
  item,
  children,
  isDragging,
  onRemove,
}: {
  item: DashboardWidgetPref;
  children: React.ReactNode;
  isDragging: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.key });
  const { w, h } = getWidgetSize(item.key);

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `${(item.x ?? 0) + 1} / span ${w}`,
        gridRow: `${(item.y ?? 0) + 1} / span ${h}`,
      }}
      className={["relative z-10 group", isDragging ? "opacity-30" : ""].join(" ")}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 bg-background/80 backdrop-blur cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 bg-background/80 backdrop-blur text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {/* [&>*]:h-full makes the widget's Card fill the (stretched) grid cell,
          so widgets sharing a row are visually the same height. */}
      <div className="h-full [&>*]:h-full">{children}</div>
    </div>
  );
}

export function DashboardGrid({
  layout,
  isEditMode,
  onLayoutChange,
  netWorth,
  monthDelta,
  monthDeltaPercent,
  historyNetWorth,
  historyInvestable,
  historyLiabilities,
  totalInvestable,
  totalAssets,
  propertyEquity,
  propertyCount,
  liabilitiesTotal,
  history,
  allocationSegments,
  allocationData,
  assetRows,
  properties,
}: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Resolved drop placement: where the widget lands, and whether landing there
  // pushes the widgets below down (insert) or drops into empty space (move).
  const [preview, setPreview] = useState<{ rect: GridRect; insert: boolean } | null>(null);

  const visibleWidgets = useMemo(() => layout.filter((widget) => widget.visible), [layout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  // Number of rows currently used — keeps the grid (and column guides) tall enough.
  const rowCount = useMemo(() => {
    let maxRow = 0;
    for (const widget of visibleWidgets) {
      const { h } = getWidgetSize(widget.key);
      maxRow = Math.max(maxRow, (widget.y ?? 0) + h);
    }
    // While dragging leave one spare row so a widget can be dropped below the stack.
    return Math.max(maxRow + (activeId ? 1 : 0), 1);
  }, [visibleWidgets, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setPreview(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const key = String(event.active.id);
    const grid = gridRef.current;
    const translated = event.active.rect.current.translated;
    if (!grid || !translated) return;

    const gridRect = grid.getBoundingClientRect();
    const gridStyle = getComputedStyle(grid);
    const columnTracks = parseTracks(gridStyle.gridTemplateColumns);
    const rowTracks = parseTracks(gridStyle.gridTemplateRows);

    const { w, h } = getWidgetSize(key);

    // Snap the dragged element's top-left to the nearest grid line. Reading the
    // resolved track sizes keeps this accurate even when rows grow to fit content.
    const relativeX = translated.left - gridRect.left;
    const relativeY = translated.top - gridRect.top;
    let x = snapToTrack(relativeX, columnTracks, GAP_PX);
    let y = snapToTrack(relativeY, rowTracks, GAP_PX);
    x = Math.max(0, Math.min(x, GRID_COLUMNS - w));
    y = Math.max(0, y);

    setPreview(resolvePlacement(key, x, y, w, h));
  };

  // Decide where a drag lands. If the target cell is free it's a plain move.
  // If it's occupied, it becomes an insert: the widget takes the row band and
  // everything from that row down is pushed lower (a new row is opened above
  // the widget being dropped on). insertRow is snapped up so it never bisects a
  // widget that spans across the target row.
  const resolvePlacement = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number
  ): { rect: GridRect; insert: boolean } => {
    const occupied = occupiedRects(layout, key);
    if (fits({ x, y, w, h }, occupied)) {
      return { rect: { x, y, w, h }, insert: false };
    }
    let insertRow = y;
    let changed = true;
    while (changed) {
      changed = false;
      for (const rect of occupied) {
        if (rect.y < insertRow && rect.y + rect.h > insertRow) {
          insertRow = rect.y;
          changed = true;
        }
      }
    }
    return { rect: { x, y: insertRow, w, h }, insert: true };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const key = String(event.active.id);
    const dropped = preview;
    setActiveId(null);
    setPreview(null);
    if (!dropped) return;

    const { x, y, h } = dropped.rect;

    onLayoutChange(
      layout.map((item) => {
        if (item.key === key) return { ...item, x, y };
        // Insert: push widgets at or below the insert row down by the widget's height.
        if (dropped.insert && item.visible && (item.y ?? 0) >= y) {
          return { ...item, y: (item.y ?? 0) + h };
        }
        return item;
      })
    );
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setPreview(null);
  };

  const handleRemove = (key: string) => {
    onLayoutChange(layout.map((item) => (item.key === key ? { ...item, visible: false } : item)));
  };

  const renderWidgetContent = (key: string) => (
    <>
      {key === "networth-hero" && (
        <NetWorthHero
          netWorth={netWorth}
          monthDelta={monthDelta}
          monthDeltaPercent={monthDeltaPercent}
          historyNetWorth={historyNetWorth}
        />
      )}
      {key === "investable" && (
        <Investable
          totalInvestable={totalInvestable}
          totalAssets={totalAssets}
          historyInvestable={historyInvestable}
        />
      )}
      {key === "property-equity" && (
        <PropertyEquity propertyEquity={propertyEquity} propertyCount={propertyCount} />
      )}
      {key === "liabilities" && (
        <Liabilities liabilitiesTotal={liabilitiesTotal} historyLiabilities={historyLiabilities} />
      )}
      {key === "history-chart" && <HistoryChart history={history} />}
      {key === "allocation" && (
        <Allocation allocationSegments={allocationSegments} totalAssets={totalAssets} />
      )}
      {key === "allocation-chart" && (
        <AssetAllocation allocationData={allocationData} totalInvestable={totalInvestable} />
      )}
      {key === "asset-breakdown" && (
        <AssetBreakdown assetRows={assetRows} history={history} totalAssets={totalAssets} />
      )}
      {key === "properties" && <Properties properties={properties} />}
      {key === "fire-progress" && <FIREProgress />}
      {key === "budget-summary" && <BudgetSummary />}
      {key === "dividends" && <Dividends />}
      {key === "side-income" && <SideIncome />}
      {key === "super-breakdown" && <SuperBreakdown />}
      {key === "cash-accounts" && <CashAccounts />}
    </>
  );

  // ── Non-edit mode ──────────────────────────────────────────────────────────
  if (!isEditMode) {
    // Small screens: stacked flow ordered by grid position.
    const ordered = [...visibleWidgets].sort(
      (a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0)
    );
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6 items-stretch">
          {ordered.map((item) => (
            <div key={item.key}>{renderWidgetContent(item.key)}</div>
          ))}
        </div>

        {/* lg+ mirrors the exact coordinate layout */}
        <div
          className="hidden lg:grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            gridAutoRows: `minmax(${ROW_UNIT_PX}px, auto)`,
          }}
        >
          {visibleWidgets.map((item) => {
            const { w, h } = getWidgetSize(item.key);
            return (
              <div
                key={item.key}
                style={{
                  gridColumn: `${(item.x ?? 0) + 1} / span ${w}`,
                  gridRow: `${(item.y ?? 0) + 1} / span ${h}`,
                }}
                className="h-full [&>*]:h-full"
              >
                {renderWidgetContent(item.key)}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // ── Edit mode: coordinate grid with fit-aware drag (lg+ only) ──────────────
  return (
    <>
      {/* Below lg the coordinate grid can't render; prompt to widen. */}
      <p className="lg:hidden text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 p-4">
        Rearranging widgets needs a wider screen. Rotate your device or use a larger window.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          ref={gridRef}
          className="hidden lg:grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rowCount}, minmax(${ROW_UNIT_PX}px, auto))`,
            gridAutoRows: `minmax(${ROW_UNIT_PX}px, auto)`,
          }}
        >
          {/* Column guides — real grid cells so they share tracks with the
              content and stay aligned even when rows grow. Shown while dragging. */}
          {activeId &&
            Array.from({ length: GRID_COLUMNS * rowCount }).map((_, index) => {
              const column = index % GRID_COLUMNS;
              const row = Math.floor(index / GRID_COLUMNS);
              return (
                <div
                  key={`guide-${index}`}
                  aria-hidden
                  className="pointer-events-none z-0 rounded-lg border border-dashed border-primary/25 bg-primary/[0.03]"
                  style={{ gridColumn: `${column + 1} / span 1`, gridRow: `${row + 1} / span 1` }}
                />
              );
            })}

          {/* Drop footprint — always shown while dragging. Solid green for a
              move into free space; amber "insert" when it will push widgets down. */}
          {preview && (
            <div
              className={[
                "pointer-events-none z-20 rounded-xl border-2 flex items-start justify-center",
                preview.insert
                  ? "border-amber-500 bg-amber-500/15"
                  : "border-emerald-500 bg-emerald-500/15",
              ].join(" ")}
              style={{
                gridColumn: `${preview.rect.x + 1} / span ${preview.rect.w}`,
                gridRow: `${preview.rect.y + 1} / span ${preview.rect.h}`,
              }}
            >
              {preview.insert && (
                <span className="mt-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Insert — pushes down
                </span>
              )}
            </div>
          )}

          {/* Widgets — direct grid children so their (x,y) placement applies */}
          {visibleWidgets.map((item) => (
            <DraggableWidget
              key={item.key}
              item={item}
              isDragging={activeId === item.key}
              onRemove={() => handleRemove(item.key)}
            >
              {renderWidgetContent(item.key)}
            </DraggableWidget>
          ))}
        </div>

        {/* Floating drag preview */}
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="opacity-90 shadow-2xl rounded-xl overflow-hidden h-full">
              {renderWidgetContent(activeId)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
