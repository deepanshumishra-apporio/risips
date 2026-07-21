"use client";

import { useState } from "react";
import { fundByIsin, useStore } from "../lib/store";
import { Wordmark } from "../components/Mark";
import { ReturnsChart } from "../components/Chart";
import { RiskMeter } from "../components/RiskMeter";
import { InvestSheet } from "../components/InvestSheet";
import { Stars, FundRow } from "../components/ui";
import { AmcLogo } from "../components/AmcLogo";
import { ChevronLeft, ShieldCheck, HeartIcon, CartIcon } from "../components/icons";
import { FUNDS } from "../lib/store";
import { SipCalculator } from "../components/SipCalculator";
import { CartButton } from "../components/CartButton";
import { WatchlistSheet } from "../components/WatchlistSheet";
import { inr, nav, pct, crore } from "../lib/format";
import type { Fund } from "../lib/types";

const TOP_HOLDINGS = [
  { name: "HDFC Bank", w: 8.4 },
  { name: "Reliance Industries", w: 6.9 },
  { name: "ICICI Bank", w: 6.1 },
  { name: "Infosys", w: 4.7 },
  { name: "Larsen & Toubro", w: 3.8 },
];

const SECTORS: Record<string, { name: string; pct: number }[]> = {
  "Large Cap": [
    { name: "Financials", pct: 32 },
    { name: "Information Tech", pct: 15 },
    { name: "Energy", pct: 11 },
    { name: "FMCG", pct: 9 },
    { name: "Automobile", pct: 8 },
  ],
  "Mid Cap": [
    { name: "Financials", pct: 22 },
    { name: "Capital Goods", pct: 16 },
    { name: "Healthcare", pct: 13 },
    { name: "Chemicals", pct: 10 },
    { name: "Consumer", pct: 9 },
  ],
  "Small Cap": [
    { name: "Capital Goods", pct: 20 },
    { name: "Financials", pct: 15 },
    { name: "Chemicals", pct: 13 },
    { name: "Consumer", pct: 11 },
    { name: "Realty", pct: 8 },
  ],
  "Flexi Cap": [
    { name: "Financials", pct: 28 },
    { name: "Overseas Equity", pct: 12 },
    { name: "Information Tech", pct: 11 },
    { name: "Consumer", pct: 10 },
    { name: "Energy", pct: 8 },
  ],
  ELSS: [
    { name: "Financials", pct: 30 },
    { name: "Information Tech", pct: 14 },
    { name: "Automobile", pct: 9 },
    { name: "Healthcare", pct: 8 },
    { name: "FMCG", pct: 7 },
  ],
  Index: [
    { name: "Financials", pct: 34 },
    { name: "Information Tech", pct: 14 },
    { name: "Energy", pct: 12 },
    { name: "FMCG", pct: 8 },
    { name: "Automobile", pct: 6 },
  ],
  Contra: [
    { name: "Financials", pct: 26 },
    { name: "Energy", pct: 14 },
    { name: "Information Tech", pct: 10 },
    { name: "Metals", pct: 9 },
    { name: "Utilities", pct: 8 },
  ],
  Hybrid: [
    { name: "Debt & G-Sec", pct: 35 },
    { name: "Financials", pct: 20 },
    { name: "Information Tech", pct: 8 },
    { name: "Energy", pct: 6 },
    { name: "Cash & Equiv.", pct: 8 },
  ],
  Debt: [
    { name: "G-Sec", pct: 40 },
    { name: "Corporate Bonds", pct: 30 },
    { name: "T-Bills", pct: 18 },
    { name: "Cert. of Deposit", pct: 8 },
    { name: "Cash & Equiv.", pct: 4 },
  ],
};

function taxNote(fund: Fund): string {
  if (fund.category === "Debt")
    return "Gains are added to your income and taxed at your income-tax slab rate.";
  if (fund.category === "ELSS")
    return "Qualifies for up to ₹1.5L deduction under Section 80C. LTCG taxed at 12.5% on gains above ₹1.25L a year. 3-year lock-in applies.";
  return "LTCG at 12.5% on gains above ₹1.25L per year (units held over 1 year). STCG at 20% if held under 1 year.";
}

function Basic({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between">
      <span className="muted" style={{ fontSize: 14 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, textAlign: "right", maxWidth: "60%" }}>
        {value}
      </span>
    </div>
  );
}

export function FundDetail() {
  const { route, back, isWatched, toast, addToCart, inCart } = useStore();
  const isin = route.params?.isin as string;
  const fund = fundByIsin(isin);
  const [sheet, setSheet] = useState<null | "One-time" | "SIP">(null);
  const [watchSheet, setWatchSheet] = useState(false);

  if (!fund) return null;
  const navUp = fund.navChange >= 0;
  const sectors = SECTORS[fund.category] ?? SECTORS["Large Cap"];
  const sectorMax = Math.max(...sectors.map((s) => s.pct));
  const watched = isWatched(fund.isin);
  const carted = inCart(fund.isin);
  const cartAmount = Math.max(1000, fund.minLumpsum);
  const similar = FUNDS.filter(
    (f) => f.category === fund.category && f.isin !== fund.isin
  ).slice(0, 3);

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar" style={{ justifyContent: "space-between" }}>
        <div className="rowc gap8">
          <button className="iconbtn" onClick={back}>
            <ChevronLeft size={22} />
          </button>
          <Wordmark size={16} />
        </div>
        <div className="rowc gap8">
          <CartButton />
          <button
            className={`watchbtn${watched ? " on" : ""}`}
            aria-label="Save to watchlist"
            onClick={() => setWatchSheet(true)}
          >
            <HeartIcon size={22} filled={watched} />
          </button>
        </div>
      </div>

      <div className="scroll pad" style={{ paddingBottom: 24 }}>
        {/* identity */}
        <div className="rowc gap12">
          <AmcLogo fund={fund} size={48} />
          <div className="col gap4" style={{ minWidth: 0 }}>
            <div className="h-sora" style={{ fontSize: 18, lineHeight: 1.2 }}>
              {fund.name}
            </div>
            <div className="rowc gap8">
              <span className="tag">{fund.category}</span>
              <Stars n={fund.rating} />
            </div>
          </div>
        </div>

        {/* objective */}
        <p className="muted mt12" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
          {fund.objective}
        </p>

        {/* NAV */}
        <div className="between mt16">
          <div className="col gap4">
            <span className="lab">NAV · today</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
              {nav(fund.nav)}
            </span>
          </div>
          <div className="col gap4" style={{ alignItems: "flex-end" }}>
            <span className="lab">1D change</span>
            <span
              className={`mono ${navUp ? "green" : "red"}`}
              style={{ fontSize: 15, fontWeight: 500 }}
            >
              {pct(fund.navChange)}
            </span>
          </div>
        </div>

        {/* chart */}
        <div className="card mt16">
          <ReturnsChart fund={fund} />
        </div>

        {/* trailing returns vs category */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Trailing returns (annualised)
        </div>
        <div className="card" style={{ padding: "6px 16px" }}>
          <div className="row between" style={{ paddingBottom: 8 }}>
            <span className="lab">Period</span>
            <span className="rowc" style={{ gap: 28 }}>
              <span className="lab" style={{ width: 56, textAlign: "right" }}>
                This fund
              </span>
              <span className="lab" style={{ width: 56, textAlign: "right" }}>
                Category
              </span>
            </span>
          </div>
          {(["1y", "3y", "5y"] as const).map((k) => {
            const cat = +(fund.returns[k] * 0.86).toFixed(1);
            return (
              <div key={k} className="row between" style={{ borderTop: "1px solid var(--line)" }}>
                <span style={{ fontSize: 14 }}>{k.toUpperCase()}</span>
                <span className="rowc" style={{ gap: 28 }}>
                  <span className="mono green" style={{ width: 56, textAlign: "right", fontWeight: 500 }}>
                    {pct(fund.returns[k])}
                  </span>
                  <span className="mono muted" style={{ width: 56, textAlign: "right" }}>
                    {pct(cat)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* stats grid */}
        <div className="stats mt16">
          <div className="cell">
            <span className="lab">Min SIP</span>
            <div className="v mono">{inr(fund.minSip)}</div>
          </div>
          <div className="cell">
            <span className="lab">Expense ratio</span>
            <div className="v mono">{fund.expense.toFixed(2)}%</div>
          </div>
          <div className="cell">
            <span className="lab">Fund size</span>
            <div className="v mono">{crore(fund.aumCr)}</div>
          </div>
          <div className="cell">
            <span className="lab">Rating</span>
            <div className="v rowc gap8">
              {fund.rating}.0 <Stars n={fund.rating} />
            </div>
          </div>
        </div>

        {/* risk-o-meter */}
        <div className="card card-lg mt16">
          <RiskMeter risk={fund.risk} />
        </div>

        {/* SIP calculator */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          SIP calculator
        </div>
        <SipCalculator fund={fund} onStart={() => setSheet("SIP")} />

        {/* fund basics */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Fund basics
        </div>
        <div className="card divide" style={{ padding: "0 16px" }}>
          <Basic label="Fund manager" value={fund.manager} />
          <Basic label="Launched" value={fund.launched} />
          <Basic label="Benchmark" value={fund.benchmark} />
          <Basic label="Plan" value="Direct · Growth" />
          <Basic label="Min lump sum" value={inr(fund.minLumpsum)} />
          <Basic label="Exit load" value={fund.exitLoad} />
          <Basic label="Lock-in" value={fund.lockIn} />
        </div>

        {/* sector allocation */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Sector allocation
        </div>
        <div className="card card-lg col" style={{ gap: 14 }}>
          {sectors.map((s) => (
            <div key={s.name} className="col gap8">
              <div className="between">
                <span style={{ fontSize: 13.5 }}>{s.name}</span>
                <span className="mono muted" style={{ fontSize: 12.5 }}>
                  {s.pct}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 4,
                  background: "var(--line-soft)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(s.pct / sectorMax) * 100}%`,
                    background: "var(--ink)",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* top holdings */}
        <div className="between" style={{ marginTop: 22, marginBottom: 10 }}>
          <span className="h-sora" style={{ fontSize: 16 }}>
            Top holdings
          </span>
          <span className="lab">% of portfolio</span>
        </div>
        <div className="card divide" style={{ padding: "0 16px" }}>
          {TOP_HOLDINGS.map((h) => (
            <div key={h.name} className="row between">
              <span style={{ fontSize: 14 }}>{h.name}</span>
              <span className="mono muted" style={{ fontSize: 13 }}>
                {h.w.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* tax */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Tax implications
        </div>
        <div className="card">
          <div className="rowc gap8" style={{ alignItems: "flex-start" }}>
            <span style={{ color: "var(--mute)", flex: "0 0 auto", marginTop: 1 }}>
              <ShieldCheck size={16} />
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.55 }}>{taxNote(fund)}</p>
          </div>
        </div>

        {/* similar funds */}
        {similar.length > 0 && (
          <>
            <div className="lab" style={{ padding: "22px 0 10px" }}>
              Similar {fund.category} funds
            </div>
            <div className="card divide" style={{ padding: "0 16px" }}>
              {similar.map((f) => (
                <FundRow key={f.isin} fund={f} />
              ))}
            </div>
          </>
        )}

        <div className="lab" style={{ marginTop: 18, lineHeight: 1.7 }}>
          Mutual fund investments are subject to market risks. Read all
          scheme-related documents carefully.
        </div>
      </div>

      {/* sticky invest CTAs */}
      <div className="sticky-cta">
        <button
          className="btn btn-ghost"
          aria-label={carted ? "In cart" : "Add to cart"}
          style={{ flex: "0 0 auto", width: 52, padding: 0 }}
          onClick={() => {
            if (carted) {
              toast("Already in cart");
            } else {
              addToCart(fund.isin, cartAmount);
              toast("Added to cart");
            }
          }}
        >
          <CartIcon size={20} />
        </button>
        <button className="btn btn-ghost grow" onClick={() => setSheet("One-time")}>
          One-time
        </button>
        <button className="btn btn-green grow" onClick={() => setSheet("SIP")}>
          Start SIP
        </button>
      </div>

      {sheet && (
        <InvestSheet fund={fund} mode={sheet} onClose={() => setSheet(null)} />
      )}
      {watchSheet && (
        <WatchlistSheet fund={fund} onClose={() => setWatchSheet(false)} />
      )}
    </div>
  );
}
