import { NextRequest } from "next/server";
import yahooFinance from "yahoo-finance2";
import { toYahooTicker } from "@/lib/tickerMapper";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tickersParam = searchParams.get("tickers");

  if (!tickersParam) {
    return Response.json({ error: "tickers param required" }, { status: 400 });
  }

  const inputTickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean);
  const yahooTickers = inputTickers.map(toYahooTicker);

  try {
    const results: Record<string, { price: number | null; name: string | null; pe: number | null }> = {};
    const yahooFinanceClient = new yahooFinance(); 


    await Promise.all(
      yahooTickers.map(async (yahooTicker, i) => {
        const originalTicker = inputTickers[i];
        try {
          const quote = await yahooFinanceClient.quote(yahooTicker, {}, { validateResult: false }) as Record<string, unknown>;
          results[originalTicker] = {
            price: (quote.regularMarketPrice as number | undefined) ?? null,
            name: (quote.longName as string | undefined) ?? (quote.shortName as string | undefined) ?? null,
            pe: (quote.trailingPE as number | undefined) ?? null,
          };
        } catch {
          results[originalTicker] = { price: null, name: null, pe: null };
        }
      })
    );

    return Response.json(results, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("Price fetch error:", err);
    return Response.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
