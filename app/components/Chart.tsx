"use client";

import { useMemo, useState } from "react";
import type { Fund } from "../lib/types";
import { pct } from "../lib/format";

type Range = "1y" | "3y" | "5y";
const RANGES: { key: Range; label: string; take: number }[] = [
  { key: "1y", label: "1Y", take: 8 },
  { key: "3y", label: "3Y", take: 15 },
  { key: "5y", label: "5Y", take: 24 },
];

const W = 320;
const H = 150;
const PAD = 6;

export function ReturnsChart({ fund }: { fund: Fund }) {
  const [range, setRange] = useState<Range>("3y");

  const { path, area, series, up } = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range)!;
    const series = fund.chart.slice(-cfg.take);
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const stepX = (W - PAD * 2) / (series.length - 1);
    const pts = series.map((v, i) => {
      const x = PAD + i * stepX;
      const y = PAD + (H - PAD * 2) * (1 - (v - min) / span);
      return [x, y] as const;
    });
    const path = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(" ");
    const area =
      `M${pts[0][0].toFixed(1)} ${(H - PAD).toFixed(1)} ` +
      pts.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") +
      ` L${pts[pts.length - 1][0].toFixed(1)} ${(H - PAD).toFixed(1)} Z`;
    const up = series[series.length - 1] >= series[0];
    return { path, area, series: pts, up };
  }, [fund, range]);

  const end = series[series.length - 1];
  const rangeReturn = fund.returns[range];
  const color = up ? "var(--green)" : "var(--red)";

  return (
    <div>
      <div className="between" style={{ marginBottom: 10 }}>
        <div>
          <div className="lab">{RANGES.find((r) => r.key === range)!.label} return</div>
          <div
            className="num-hero"
            style={{ fontSize: 22, color, marginTop: 2 }}
          >
            {pct(rangeReturn)}
          </div>
        </div>
        <div className="segment">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={range === r.key ? "active" : ""}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${fund.name} ${range} performance`}
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id={`fill-${fund.isin}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* baseline grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD}
              x2={W - PAD}
              y1={PAD + (H - PAD * 2) * f}
              y2={PAD + (H - PAD * 2) * f}
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray="2 5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} fill={`url(#fill-${fund.isin})`} />
          {/* non-scaling stroke keeps the line an even 2px despite the stretch */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* perfectly round end marker as an overlay (SVG circle would distort) */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: `${(end[0] / W) * 100}%`,
            top: `${(end[1] / H) * 100}%`,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 0 5px ${color}22`,
          }}
        />
      </div>
    </div>
  );
}
