"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Fund } from "../lib/types";
import { api, type NavPoint, type NavRange } from "../lib/api";
import { pctOr } from "../lib/format";

/**
 * Fund performance chart, plotted from real NAV history.
 *
 * Every point is a NAV that AMFI actually published — the series is thinned server-side by
 * dropping observations, never by averaging, so the peak and trough drawn here are real. When
 * AMFI has no history for a fund (about 100 of ~5,900) the series comes back empty and this
 * says so rather than drawing a flat or invented line.
 *
 * The percentage headline is the change across the *plotted window*, computed from its own
 * endpoints, so the number and the line always agree. Tarrakki's catalogue returns are shown
 * as a secondary reference where they exist.
 */

const RANGES: { key: NavRange; label: string; points: number }[] = [
  { key: "1m", label: "1M", points: 32 },
  { key: "6m", label: "6M", points: 60 },
  { key: "1y", label: "1Y", points: 80 },
  { key: "3y", label: "3Y", points: 100 },
  { key: "5y", label: "5Y", points: 120 },
];

const W = 320;
const H = 150;
const PAD = 6;

type Load = "loading" | "ready" | "error";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function ReturnsChart({ fund }: { fund: Fund }) {
  const [range, setRange] = useState<NavRange>("3y");
  const [series, setSeries] = useState<NavPoint[]>([]);
  const [changePct, setChangePct] = useState<number | null>(null);
  const [state, setState] = useState<Load>("loading");
  const [hover, setHover] = useState<number | null>(null);

  // Keyed by fund+range so switching either refetches, and a stale response from the
  // previous selection can't overwrite the current one.
  const requestRef = useRef(0);

  useEffect(() => {
    const id = ++requestRef.current;
    const controller = new AbortController();
    const cfg = RANGES.find((r) => r.key === range)!;

    setState("loading");
    setHover(null);

    api.funds
      .navHistory(fund.id, range, cfg.points, controller.signal)
      .then((res) => {
        if (id !== requestRef.current) return;
        setSeries(res.series ?? []);
        setChangePct(res.changePct);
        setState("ready");
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || id !== requestRef.current) return;
        setSeries([]);
        setChangePct(null);
        setState((e as Error)?.name === "AbortError" ? "loading" : "error");
      });

    return () => controller.abort();
  }, [fund.id, range]);

  const geometry = useMemo(() => {
    if (series.length < 2) return null;

    const navs = series.map((p) => p.nav);
    const min = Math.min(...navs);
    const max = Math.max(...navs);
    const span = max - min || 1;
    const stepX = (W - PAD * 2) / (series.length - 1);

    const pts = series.map((p, i) => {
      const x = PAD + i * stepX;
      const y = PAD + (H - PAD * 2) * (1 - (p.nav - min) / span);
      return [x, y] as const;
    });

    return {
      pts,
      path: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" "),
      area:
        `M${pts[0]![0].toFixed(1)} ${(H - PAD).toFixed(1)} ` +
        pts.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") +
        ` L${pts[pts.length - 1]![0].toFixed(1)} ${(H - PAD).toFixed(1)} Z`,
      up: series[series.length - 1]!.nav >= series[0]!.nav,
      min,
      max,
    };
  }, [series]);

  const color = geometry?.up === false ? "var(--red)" : "var(--green)";
  const label = RANGES.find((r) => r.key === range)!.label;

  // Prefer the plotted window's own change so the headline matches the line. Fall back to
  // Tarrakki's catalogue figure for ranges it reports and we can't yet compute.
  const catalogue =
    range === "1y" ? fund.returns["1y"] : range === "3y" ? fund.returns["3y"] : range === "5y" ? fund.returns["5y"] : null;
  const headline = changePct ?? catalogue;

  const active = hover != null ? series[hover] : undefined;
  const marker = geometry ? (geometry.pts[hover ?? geometry.pts.length - 1] ?? undefined) : undefined;

  /** Map a pointer position onto the nearest real observation. */
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!geometry) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const ratio = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1);
    setHover(Math.round(ratio * (series.length - 1)));
  };

  const header = (
    <div className="between" style={{ marginBottom: 10 }}>
      <div>
        <div className="lab">
          {active ? formatDay(active.date) : `${label} change`}
        </div>
        {active ? (
          <div className="num-hero" style={{ fontSize: 22, marginTop: 2 }}>
            ₹{active.nav.toFixed(4)}
          </div>
        ) : (
          <div
            className="num-hero"
            style={{ fontSize: 22, marginTop: 2, color: headline == null ? undefined : color }}
          >
            {pctOr(headline)}
          </div>
        )}
      </div>
      <div className="segment">
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={range === r.key ? "active" : ""}
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );

  /** Shared frame for the three non-plotting states, so the layout never jumps. */
  const placeholder = (title: string, detail: string, dashed = true) => (
    <div>
      {header}
      <div
        className="col"
        style={{
          height: H,
          alignItems: "center",
          justifyContent: "center",
          border: dashed ? "1px dashed var(--line)" : "1px solid var(--line)",
          borderRadius: 12,
          gap: 4,
        }}
      >
        <span className="muted" style={{ fontSize: 13 }}>{title}</span>
        <span className="lab" style={{ textAlign: "center", maxWidth: 240 }}>{detail}</span>
      </div>
    </div>
  );

  if (state === "loading" && !geometry) {
    return placeholder("Loading NAV history…", "Fetching published NAVs", false);
  }
  if (state === "error") {
    return placeholder("Couldn't load NAV history", "Check your connection and try again");
  }
  if (!geometry) {
    // A genuinely empty series — AMFI publishes nothing for this scheme, or not enough of it.
    return placeholder(
      "NAV history unavailable",
      fund.navPoints > 0
        ? "Not enough published history for this range yet"
        : "AMFI does not publish a NAV series for this scheme",
    );
  }

  return (
    <div>
      {header}

      <div
        style={{ position: "relative", touchAction: "pan-y" }}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${fund.name} NAV over ${label}: ${series.length} published observations from ${formatDay(
            series[0]!.date,
          )} to ${formatDay(series[series.length - 1]!.date)}`}
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

          <path d={geometry.area} fill={`url(#fill-${fund.isin})`} />
          {/* non-scaling stroke keeps the line an even 2px despite the stretch */}
          <path
            d={geometry.path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {hover != null && marker && (
            <line
              x1={marker[0]}
              x2={marker[0]}
              y1={PAD}
              y2={H - PAD}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.45}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* perfectly round marker as an overlay (an SVG circle would distort) */}
        {marker && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `${(marker[0] / W) * 100}%`,
              top: `${(marker[1] / H) * 100}%`,
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 0 5px ${color}22`,
              transition: hover == null ? "left .15s, top .15s" : "none",
            }}
          />
        )}
      </div>

      <div className="between" style={{ marginTop: 6 }}>
        <span className="lab">{formatDay(series[0]!.date)}</span>
        <span className="lab">
          {series.length} NAVs · AMFI
        </span>
        <span className="lab">{formatDay(series[series.length - 1]!.date)}</span>
      </div>
    </div>
  );
}
