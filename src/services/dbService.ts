import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("hfinance.db");

export interface WatchItem {
  symbol: string;
  name: string;
}

export interface HoldingItem {
  id?: number;
  symbol: string;
  shares: number;
  buyPrice: number;
}

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS watchlist (
      symbol TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      shares REAL NOT NULL,
      buyPrice REAL NOT NULL
    );
  `);
}

// Watchlist Queries พร้อม Console.log ตรวจสอบข้อมูลใน Terminal
export function getWatchlistFromDb(): WatchItem[] {
  const allRows = db.getAllSync("SELECT * FROM watchlist") as WatchItem[];
  console.log("--- [SQL] ข้อมูล Watchlist ทั้งหมดในฐานข้อมูล ---", allRows);
  return allRows;
}

export function addToWatchlistDb(symbol: string, name: string) {
  db.runSync("INSERT OR IGNORE INTO watchlist (symbol, name) VALUES (?, ?);", [
    symbol,
    name,
  ]);
  console.log(
    `--- [SQL] เพิ่มหุ้นลง Watchlist สำเร็จ: ${symbol} (${name}) ---`,
  );
}

export function removeFromWatchlistDb(symbol: string) {
  db.runSync("DELETE FROM watchlist WHERE symbol = ?;", [symbol]);
  console.log(`--- [SQL] ลบหุ้นออกจาก Watchlist สำเร็จ: ${symbol} ---`);
}

export function isInWatchlistDb(symbol: string): boolean {
  const row = db.getFirstSync("SELECT * FROM watchlist WHERE symbol = ?;", [
    symbol,
  ]);
  return !!row;
}

// Portfolio Queries พร้อม Console.log ตรวจสอบข้อมูลใน Terminal
export function getPortfolioFromDb(): HoldingItem[] {
  const allRows = db.getAllSync("SELECT * FROM portfolio") as HoldingItem[];
  console.log("--- [SQL] ข้อมูลพอร์ตจำลองทั้งหมดในฐานข้อมูล ---", allRows);
  return allRows;
}

export function addHoldingDb(symbol: string, shares: number, buyPrice: number) {
  db.runSync(
    "INSERT INTO portfolio (symbol, shares, buyPrice) VALUES (?, ?, ?);",
    [symbol, shares, buyPrice],
  );
  console.log(
    `--- [SQL] บันทึกหุ้นลงพอร์ตสำเร็จ: ${symbol} จำนวน ${shares} หุ้น ราคา ${buyPrice} ---`,
  );
}

export function removeHoldingDb(id: number) {
  db.runSync("DELETE FROM portfolio WHERE id = ?;", [id]);
  console.log(`--- [SQL] ลบรายการพอร์ต ID: ${id} สำเร็จ ---`);
}
