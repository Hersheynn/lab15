const BASE_URL = "https://query1.finance.yahoo.com";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
}

export interface ChartPoint {
  date: string;
  close: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

async function getJson(path: string) {
  const res = await fetch(BASE_URL + path);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// ดึงราคาล่าสุดของหุ้น (ใช้ endpoint v8/finance/chart ไม่ต้องใช้ API Key)
export async function fetchQuote(
  symbol: string,
  fallbackName?: string,
): Promise<StockQuote> {
  const json = await getJson(
    "/v8/finance/chart/" + encodeURIComponent(symbol) + "?interval=1d&range=5d",
  );
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("ไม่พบข้อมูลหุ้นนี้");
  const meta = result.meta;
  const price = meta.regularMarketPrice ?? 0;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  return {
    symbol: meta.symbol ?? symbol.toUpperCase(),
    name:
      fallbackName ?? meta.longName ?? meta.shortName ?? symbol.toUpperCase(),
    price: price,
    change: change,
    changePercent: prev ? (change / prev) * 100 : 0,
    previousClose: prev,
    currency: meta.currency ?? "",
  };
}

// ดึงข้อมูลราคาย้อนหลังเพื่อวาดกราฟเส้น (Sparkline)
export async function fetchSparkline(
  symbol: string,
  range: "1mo" | "3mo" | "1y" = "1mo",
): Promise<ChartPoint[]> {
  const json = await getJson(
    "/v8/finance/chart/" +
      encodeURIComponent(symbol) +
      "?interval=1d&range=" +
      range,
  );
  const result = json?.chart?.result?.[0];
  if (!result) return [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const timestamps = result.timestamp ?? [];
  return timestamps
    .map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      close: closes[i],
    }))
    .filter((p: ChartPoint) => typeof p.close === "number");
}

// ค้นหาหุ้นจากชื่อหรือสัญลักษณ์
export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const json = await getJson(
    "/v1/finance/search?q=" +
      encodeURIComponent(query) +
      "&quotesCount=10&newsCount=0&listsCount=0",
  );
  const quotes = json?.quotes ?? [];
  return quotes
    .filter(
      (q: any) =>
        q.symbol &&
        (q.quoteType === "EQUITY" ||
          q.quoteType === "ETF" ||
          q.quoteType === "INDEX"),
    )
    .map((q: any) => ({
      symbol: q.symbol,
      name: q.shortname ?? q.longname ?? q.symbol,
      exchange: q.fullExchangeName ?? q.exchDisp ?? "",
    }));
}
