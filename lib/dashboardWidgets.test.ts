import { describe, it, expect } from "vitest";
import { reconcileLayout, DEFAULT_LAYOUT, WIDGET_REGISTRY } from "./dashboardWidgets";

describe("reconcileLayout", () => {
  it("falls back to DEFAULT_LAYOUT when saved is null (new user)", () => {
    const result = reconcileLayout(null);
    const visibleKeys = result.filter((item) => item.visible).map((item) => item.key);
    const defaultVisibleKeys = DEFAULT_LAYOUT.filter((item) => item.visible).map((item) => item.key);
    expect(visibleKeys.sort()).toEqual(defaultVisibleKeys.sort());
  });

  it("falls back to DEFAULT_LAYOUT when saved is undefined (new user)", () => {
    const result = reconcileLayout(undefined);
    const visibleKeys = result.filter((item) => item.visible).map((item) => item.key);
    const defaultVisibleKeys = DEFAULT_LAYOUT.filter((item) => item.visible).map((item) => item.key);
    expect(visibleKeys.sort()).toEqual(defaultVisibleKeys.sort());
  });

  it("honours an explicitly cleared layout (empty array) instead of falling back", () => {
    const result = reconcileLayout([]);
    const visibleKeys = result.filter((item) => item.visible).map((item) => item.key);
    expect(visibleKeys).toEqual([]);
  });

  it("includes every registry widget after reconciliation", () => {
    const result = reconcileLayout(null);
    const resultKeys = new Set(result.map((item) => item.key));
    for (const widget of WIDGET_REGISTRY) {
      expect(resultKeys.has(widget.key)).toBe(true);
    }
  });

  it("preserves order and visibility of an existing saved layout", () => {
    const saved = [
      { key: "networth-hero", visible: true },
      { key: "investable", visible: false },
    ];
    const result = reconcileLayout(saved);
    expect(result[0].key).toBe("networth-hero");
    expect(result[0].visible).toBe(true);
    expect(result[1].key).toBe("investable");
    expect(result[1].visible).toBe(false);
  });

  it("drops saved keys that no longer exist in the registry", () => {
    const saved = [{ key: "stale-widget", visible: true }];
    const result = reconcileLayout(saved);
    expect(result.some((item) => item.key === "stale-widget")).toBe(false);
  });

  it("appends new registry widgets not present in saved layout as hidden", () => {
    const saved = [{ key: "networth-hero", visible: true }];
    const result = reconcileLayout(saved);
    const appended = result.find((item) => item.key === "investable");
    expect(appended?.visible).toBe(false);
  });

  it("filters out widgets whose feature flag is off", () => {
    const result = reconcileLayout(null, { useFIRE: false });
    expect(result.some((item) => item.key === "fire-progress")).toBe(false);
  });

  it("keeps feature-flagged widgets when the flag is on", () => {
    const result = reconcileLayout(null, { useFIRE: true });
    expect(result.some((item) => item.key === "fire-progress")).toBe(true);
  });
});
