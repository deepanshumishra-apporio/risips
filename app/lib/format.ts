// Formatting helpers — Indian rupee grouping, NAV, percentages.

/** ₹ with Indian digit grouping, no decimals. e.g. 125000 → "₹1,25,000" */
export function inr(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/** ₹ with two decimals — used for precise money (NAV totals). */
export function inr2(amount: number): string {
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Compact ₹ for AUM. e.g. 63840 (cr) → "₹63,840 Cr" */
export function crore(cr: number): string {
  return "₹" + cr.toLocaleString("en-IN") + " Cr";
}

/** NAV to four decimals, mono column style. */
export function nav(value: number): string {
  return (
    "₹" +
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  );
}

/** Signed percentage. e.g. 14.2 → "+14.20%", -0.4 → "-0.40%" */
export function pct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(2) + "%";
}

export function units(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/** Deterministic-ish folio number from an isin (no randomness in render). */
export function folioFor(isin: string): string {
  let h = 0;
  for (let i = 0; i < isin.length; i++) h = (h * 31 + isin.charCodeAt(i)) >>> 0;
  const a = (h % 9000) + 1000;
  const b = (Math.floor(h / 9000) % 90000) + 10000;
  return `${a} / ${b}`;
}
