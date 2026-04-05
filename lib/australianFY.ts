/**
 * Australian Fiscal Year utilities.
 * AUS FY runs July 1 – June 30.
 * getFiscalYear(date) returns the FY *end* year:
 *   - July 1 2024 – June 30 2025 → FY2025
 *   - July 1 2025 – June 30 2026 → FY2026
 */

export function getFiscalYear(date: Date): number {
  // month is 0-indexed: 6 = July
  return date.getMonth() >= 6 ? date.getFullYear() + 1 : date.getFullYear();
}

/** Returns July 1 of the FY start (e.g. FY2025 → 2024-07-01) */
export function getFYStartDate(fy: number): Date {
  return new Date(fy - 1, 6, 1);
}

/** Returns June 30 of the FY end (e.g. FY2025 → 2025-06-30) */
export function getFYEndDate(fy: number): Date {
  return new Date(fy, 5, 30);
}

/** Label string e.g. "FY2025-26" */
export function getFYLabel(fy: number): string {
  return `FY${fy - 1}-${String(fy).slice(2)}`;
}

/** Returns current FY */
export function currentFY(): number {
  return getFiscalYear(new Date());
}
