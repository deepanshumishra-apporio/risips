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

/** Compact ₹ for AUM. e.g. 63840.12 (cr) → "₹63,840 Cr", 4.317 → "₹4.32 Cr" */
export function crore(cr: number): string {
  // Upstream reports AUM to 4 decimals; that precision is noise at crore scale.
  const digits = Math.abs(cr) >= 100 ? 0 : 2;
  return (
    "₹" +
    cr.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits }) +
    " Cr"
  );
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

/* --------------------------- nullable variants ---------------------------- */
// The Tarrakki tenant this app runs against does not expose every fund metric (riskometer,
// expense ratio, NAV history, 1-day change, ratings). Those arrive as null rather than an
// invented number, so render paths need a consistent "no data" form.

/** What we show when a figure genuinely isn't available. */
export const DASH = "—";

export const inrOr = (v: number | null | undefined) => (v == null ? DASH : inr(v));
export const inr2Or = (v: number | null | undefined) => (v == null ? DASH : inr2(v));
export const croreOr = (v: number | null | undefined) => (v == null ? DASH : crore(v));
export const navOr = (v: number | null | undefined) => (v == null ? DASH : nav(v));
export const pctOr = (v: number | null | undefined) => (v == null ? DASH : pct(v));
export const unitsOr = (v: number | null | undefined) => (v == null ? DASH : units(v));
export const textOr = (v: string | null | undefined) => (v && v.trim() ? v : DASH);

/* ------------------------------- banks ----------------------------------- */

/**
 * How to render a registered bank account, e.g. "HDFC ••••4321".
 *
 * Tarrakki gives us no bank name — only the IFSC, whose first four characters are the
 * bank's code by RBI convention (HDFC0001234 → HDFC). Deriving the name that way keeps it
 * honest; the alternative is a hardcoded label that lies whenever the account isn't the one
 * it was written for.
 *
 * Pass `null`/`undefined` (no bank registered) and you get "No bank linked" — say that
 * plainly rather than showing a plausible-looking account the investor doesn't have.
 */
export function bankLabel(
  bank: { ifsc?: string | null; accountNumberMasked?: string | null } | null | undefined,
): string {
  if (!bank) return "No bank linked";
  const code = (bank.ifsc ?? "").slice(0, 4).toUpperCase();
  const acc = bank.accountNumberMasked ?? "";
  if (!code && !acc) return "Bank account";
  return [code, acc].filter(Boolean).join(" ");
}

// Removed: `folioFor(isin)`, which hashed an ISIN into a plausible-looking folio number.
// Orders carry the real folio from upstream (`Order.folio`, null until allotment); a made-up
// one is worse than "—" because it reads as authoritative and matches no actual account.
