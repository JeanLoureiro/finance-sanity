import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tickersParam = searchParams.get("tickers");
  const currency = searchParams.get("currency") ?? "aud";

  if (!tickersParam) {
    return Response.json({ error: "tickers param required" }, { status: 400 });
  }

  const tickers = tickersParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

  try {
    // CoinGecko free API — convert ticker symbols to IDs
    const ids = tickers.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currency},usd&include_24hr_change=true`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko error: ${res.status}`);
    }

    const data = await res.json();

    // Normalise: { BTC: { priceAUD, priceUSD, change24h } }
    const results: Record<string, { priceAUD: number | null; priceUSD: number | null; change24h: number | null }> = {};

    for (const ticker of tickers) {
      const entry = data[ticker];
      if (entry) {
        results[ticker.toUpperCase()] = {
          priceAUD: entry[currency.toLowerCase()] ?? null,
          priceUSD: entry["usd"] ?? null,
          change24h: entry[`${currency.toLowerCase()}_24h_change`] ?? null,
        };
      } else {
        results[ticker.toUpperCase()] = { priceAUD: null, priceUSD: null, change24h: null };
      }
    }

    return Response.json(results, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("Crypto price fetch error:", err);
    return Response.json({ error: "Failed to fetch crypto prices" }, { status: 500 });
  }
}
