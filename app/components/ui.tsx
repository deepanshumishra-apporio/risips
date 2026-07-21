"use client";

import type { Fund } from "../lib/types";
import { pct } from "../lib/format";
import { useStore } from "../lib/store";
import { StarIcon, ChevronRight } from "./icons";
import { AmcLogo } from "./AmcLogo";

export function AmcCircle({ fund, size = 40 }: { fund: Fund; size?: number }) {
  return <AmcLogo fund={fund} size={size} />;
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="rowc" style={{ gap: 2, color: "var(--ink)" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={12} filled={i <= n} />
      ))}
    </span>
  );
}

export function RiskTag({ fund }: { fund: Fund }) {
  return <span className="tag">{fund.risk} risk</span>;
}

/** Full-width list row used in Explore and search results. */
export function FundRow({ fund }: { fund: Fund }) {
  const { go } = useStore();
  const r = fund.returns["3y"];
  return (
    <button
      className="row"
      style={{ width: "100%", textAlign: "left" }}
      onClick={() => go("fund", { isin: fund.isin })}
    >
      <AmcCircle fund={fund} />
      <span className="grow col" style={{ gap: 3, minWidth: 0 }}>
        <span
          className="h-sora"
          style={{
            fontSize: 14.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fund.name}
        </span>
        <span className="rowc gap8">
          <span className="tag">{fund.category}</span>
          <span className="muted" style={{ fontSize: 12 }}>
            {fund.risk}
          </span>
        </span>
      </span>
      <span className="col" style={{ alignItems: "flex-end", gap: 2 }}>
        <span className="mono green" style={{ fontSize: 14, fontWeight: 500 }}>
          {pct(r)}
        </span>
        <span className="lab" style={{ letterSpacing: "0.08em" }}>
          3Y
        </span>
      </span>
    </button>
  );
}

/** Compact card used in the Home "Popular funds" horizontal scroller. */
export function FundCard({ fund }: { fund: Fund }) {
  const { go } = useStore();
  return (
    <button
      className="card"
      style={{ width: 210, flex: "0 0 auto", textAlign: "left" }}
      onClick={() => go("fund", { isin: fund.isin })}
    >
      <div className="between">
        <AmcCircle fund={fund} size={36} />
        <ChevronRight size={18} />
      </div>
      <div
        className="h-sora"
        style={{
          fontSize: 14.5,
          marginTop: 12,
          lineHeight: 1.25,
          height: 36,
          overflow: "hidden",
        }}
      >
        {fund.name}
      </div>
      <div className="rowc gap8 mt12">
        <span className="tag">{fund.category}</span>
      </div>
      <div className="between mt12">
        <span className="lab">3Y returns</span>
        <span className="mono green" style={{ fontSize: 15, fontWeight: 500 }}>
          {pct(fund.returns["3y"])}
        </span>
      </div>
    </button>
  );
}

export function Spinner({
  dark,
  lg,
}: {
  dark?: boolean;
  lg?: boolean;
}) {
  return (
    <span className={`spinner${dark ? " dark" : ""}${lg ? " lg" : ""}`} />
  );
}
