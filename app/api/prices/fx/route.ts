import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pair = searchParams.get("pair"); // e.g. "AUDGBP" or "GBP"

  if (!pair) {
    return Response.json({ error: "pair param required" }, { status: 400 });
  }

  try {
    // frankfurter.app — free, no key needed
    const base = "AUD";
    const target = pair.replace("AUD", "").toUpperCase();

    const url = `https://api.frankfurter.app/latest?from=${base}&to=${target}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`);

    const data = await res.json();
    const rate = data.rates?.[target] ?? null;

    return Response.json({ pair: `${base}${target}`, rate }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("FX fetch error:", err);
    return Response.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
  }
}
