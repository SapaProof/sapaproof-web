export function naira(n) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export function nairaCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return naira(n);
}

/**
 * Nigerian bank narrations are raw and ugly ("NIP/DSTV SUBSCRIPTION/SEP",
 * "POS/SHOPRITE LEKKI") — this strips the transfer-type prefix and cleans
 * up spacing so the Transactions table reads more like a real "payee"
 * column instead of a raw bank string.
 */
export function formatPayee(narration) {
  return narration
    .replace(/^(NIP|TRF|POS|USSD)\//i, "")
    .replace(/\*.*$/, "")
    .replace(/\//g, " · ")
    .trim();
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
