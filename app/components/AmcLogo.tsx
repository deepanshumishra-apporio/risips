// Branded AMC logo chips. Real AMC logos are proprietary raster assets and
// can't be fetched offline, so these are clean stylized brand marks — each in
// the AMC's approximate brand colour with a monogram (drop-in replaceable with
// a real <img>/SVG per AMC later). Colour here is content (like fund data),
// not app chrome, so it doesn't break the "one point of green" rule.

import type { Fund } from "../lib/types";

interface Brand {
  bg: string;
  fg: string;
  mark: string;
}

const BRANDS: Record<string, Brand> = {
  "ICICI Prudential": { bg: "#F37920", fg: "#fff", mark: "iP" },
  "Nippon India": { bg: "#0E2C54", fg: "#fff", mark: "N" },
  HDFC: { bg: "#E4202B", fg: "#fff", mark: "H" },
  Axis: { bg: "#97144D", fg: "#fff", mark: "A" },
  PPFAS: { bg: "#12508C", fg: "#fff", mark: "PP" },
  SBI: { bg: "#22409A", fg: "#fff", mark: "S" },
  UTI: { bg: "#E5342A", fg: "#fff", mark: "U" },
  Kotak: { bg: "#EF3E42", fg: "#fff", mark: "K" },
};

const FALLBACK: Brand = { bg: "#1A1A18", fg: "#F3F1EB", mark: "•" };

export function AmcLogo({
  fund,
  size = 40,
}: {
  fund: Pick<Fund, "amc" | "amcShort">;
  size?: number;
}) {
  const b = BRANDS[fund.amc] ?? { ...FALLBACK, mark: fund.amcShort };
  // SBI's recognisable keyhole gets a special glyph
  const isSbi = fund.amc === "SBI";

  return (
    <span
      aria-label={fund.amc}
      style={{
        flex: "0 0 auto",
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: b.bg,
        color: b.fg,
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-sora)",
        fontWeight: 700,
        fontSize: size * (b.mark.length > 1 ? 0.34 : 0.44),
        letterSpacing: b.mark.length > 1 ? "-0.02em" : "0",
        overflow: "hidden",
      }}
    >
      {isSbi ? (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={b.fg}
            strokeWidth="2.6"
            strokeDasharray="46 12"
            transform="rotate(120 12 12)"
          />
          <circle cx="12" cy="12" r="3.1" fill={b.fg} />
        </svg>
      ) : (
        b.mark
      )}
    </span>
  );
}
