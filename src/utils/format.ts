export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(n: number): string {
  return (n >= 0 ? "+" : "") + formatNumber(n) + "%";
}
