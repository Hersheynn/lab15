import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCHLIST_KEY = "@hfinance/watchlist";
const PORTFOLIO_KEY = "@hfinance/portfolio";

export interface WatchItem {
  symbol: string;
  name: string;
  addedAt: string;
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number; // จำนวนหุ้นที่ถือ
  buyPrice: number; // ราคาซื้อเฉลี่ยต่อหุ้น
  addedAt: string;
}

async function read<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function write(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---------- Watchlist ----------
export async function getWatchlist(): Promise<WatchItem[]> {
  return read<WatchItem>(WATCHLIST_KEY);
}

export async function addToWatchlist(item: WatchItem) {
  const list = await getWatchlist();
  if (!list.some((i) => i.symbol === item.symbol)) {
    list.unshift(item);
    await write(WATCHLIST_KEY, list);
  }
}

export async function removeFromWatchlist(symbol: string) {
  const list = await getWatchlist();
  await write(
    WATCHLIST_KEY,
    list.filter((i) => i.symbol !== symbol),
  );
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  const list = await getWatchlist();
  return list.some((i) => i.symbol === symbol);
}

// ---------- Portfolio (พอร์ตจำลอง) ----------
export async function getPortfolio(): Promise<Holding[]> {
  return read<Holding>(PORTFOLIO_KEY);
}

export async function addHolding(holding: Holding) {
  const list = await getPortfolio();
  list.unshift(holding);
  await write(PORTFOLIO_KEY, list);
}

export async function removeHolding(symbol: string, addedAt: string) {
  const list = await getPortfolio();
  await write(
    PORTFOLIO_KEY,
    list.filter((i) => !(i.symbol === symbol && i.addedAt === addedAt)),
  );
}
