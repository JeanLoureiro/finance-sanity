/**
 * Format a number as AUD currency string.
 * e.g. formatAUD(2241027) → "$2,241,027.00"
 */
export function formatAUD(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Format a number as a percentage string.
 * e.g. formatPct(0.2356) → "23.56%"
 */
export function formatPct(
  value: number | string | null | undefined,
  decimals = 2
): string {
  const n = Number(value ?? 0);
  return `${(n * 100).toFixed(decimals)}%`;
}

/**
 * Format a number compactly (e.g. $2.24M, $37.3K)
 */
export function formatAUDCompact(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}
