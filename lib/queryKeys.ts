type AssetType = "etfs" | "stocks" | "managed-funds" | "crypto";

export const queryKeys = {
  settings: () => ["settings"] as const,

  netWorth: () => ["net-worth"] as const,

  history: {
    list: () => ["history", "list"] as const,
  },

  cash: {
    accounts: () => ["cash", "accounts"] as const,
  },

  holdings: {
    all: (type: AssetType) => ["holdings", type] as const,
    detail: (type: AssetType, id: string) => ["holdings", type, id] as const,
    purchases: (type: AssetType, id: string) =>
      ["holdings", type, id, "purchases"] as const,
  },

  prices: {
    stocks: (tickers: string[]) => ["prices", "stocks", ...tickers] as const,
    crypto: (tickers: string[]) => ["prices", "crypto", ...tickers] as const,
    fx: (pair: string) => ["prices", "fx", pair] as const,
  },

  dividends: {
    all: () => ["dividends"] as const,
    byFY: (fy: number) => ["dividends", "fy", fy] as const,
  },

  properties: {
    all: () => ["properties"] as const,
    detail: (id: string) => ["properties", id] as const,
  },

  loans: {
    all: () => ["loans"] as const,
  },

  budget: () => ["budget"] as const,

  sideIncome: {
    all: () => ["side-income"] as const,
    byFY: (fy: number) => ["side-income", "fy", fy] as const,
  },

  super: () => ["super"] as const,

  capitalGains: {
    all: () => ["capital-gains"] as const,
    byFY: (fy: number) => ["capital-gains", "fy", fy] as const,
  },

  fire: () => ["fire"] as const,

  otherAssets: () => ["other-assets"] as const,
};
