/**
 * Convert spreadsheet ticker format (Google Finance style) to Yahoo Finance format.
 *
 * Examples:
 *   "ASX:A200"    → "A200.AX"
 *   "ASX:QLTY"   → "QLTY.AX"
 *   "NYSE:AAPL"  → "AAPL"
 *   "NASDAQ:TSLA"→ "TSLA"
 *   "BTC"        → "BTC-AUD"  (crypto — appended in crypto price route)
 */
export function toYahooTicker(ticker: string): string {
  if (!ticker) return ticker;

  const upper = ticker.toUpperCase();

  if (upper.startsWith("ASX:")) {
    return upper.replace("ASX:", "") + ".AX";
  }
  if (upper.startsWith("NYSE:")) {
    return upper.replace("NYSE:", "");
  }
  if (upper.startsWith("NASDAQ:")) {
    return upper.replace("NASDAQ:", "");
  }
  if (upper.startsWith("LSE:")) {
    return upper.replace("LSE:", "") + ".L";
  }
  if (upper.startsWith("TSX:")) {
    return upper.replace("TSX:", "") + ".TO";
  }

  // Already in Yahoo format or unknown — return as-is
  return upper;
}

/** Reverse: Yahoo ticker → display ticker (best-effort) */
export function fromYahooTicker(yahooTicker: string): string {
  if (yahooTicker.endsWith(".AX")) {
    return "ASX:" + yahooTicker.replace(".AX", "");
  }
  if (yahooTicker.endsWith(".L")) {
    return "LSE:" + yahooTicker.replace(".L", "");
  }
  return yahooTicker;
}
