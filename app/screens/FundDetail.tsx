"use client";

import { useEffect, useState } from "react";
import { fundByIsin, useStore } from "../lib/store";
import { api, toFund, type FundConstraints } from "../lib/api";
import { Wordmark } from "../components/Mark";
import { ReturnsChart } from "../components/Chart";
import { RiskMeter } from "../components/RiskMeter";
import { InvestSheet } from "../components/InvestSheet";
import { Stars, FundRow, Spinner } from "../components/ui";
import { AmcLogo } from "../components/AmcLogo";
import { ChevronLeft, ShieldCheck, HeartIcon, CartIcon } from "../components/icons";
import { SipCalculator } from "../components/SipCalculator";
import { CartButton } from "../components/CartButton";
import { WatchlistSheet } from "../components/WatchlistSheet";
import { inrOr, navOr, pctOr, croreOr, textOr, DASH } from "../lib/format";
import type { Fund } from "../lib/types";

// Sector allocation and top holdings used to be hardcoded sample data here, and the
// "category average" column was the fund's own return multiplied by 0.86. Both are gone:
// Tarrakki masks holdings and category returns for this tenant, and presenting invented
// portfolio composition or a fake peer benchmark on an investing screen is not acceptable.

function taxNote(fund: Fund): string {
  const cat = (fund.category ?? "").toLowerCase();
  const sub = (fund.subCategory ?? "").toLowerCase();
  if (sub.includes("elss")) {
    return "Qualifies for up to ₹1.5L deduction under Section 80C. LTCG taxed at 12.5% on gains above ₹1.25L a year. 3-year lock-in applies.";
  }
  if (cat === "debt") {
    return "Gains are added to your income and taxed at your income-tax slab rate.";
  }
  if (cat === "equity") {
    return "LTCG at 12.5% on gains above ₹1.25L per year (units held over 1 year). STCG at 20% if held under 1 year.";
  }
  return "Taxation depends on the scheme's equity exposure. Check the scheme information document for specifics.";
}

function planLabel(fund: Fund): string {
  const plan = fund.plan ? fund.plan[0]!.toUpperCase() + fund.plan.slice(1) : null;
  const option = fund.option === "idcw" ? "IDCW" : fund.option === "growth" ? "Growth" : null;
  return [plan, option].filter(Boolean).join(" · ") || DASH;
}

function Basic({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between">
      <span className="muted" style={{ fontSize: 14 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

export function FundDetail() {
  const { route, back, isWatched, toast, addToCart, inCart, loadFund, loadConstraints } = useStore();
  const isin = route.params?.isin as string;

  const [fund, setFund] = useState<Fund | undefined>(() => fundByIsin(isin));
  const [cons, setCons] = useState<FundConstraints | null>(null);
  const [similar, setSimilar] = useState<Fund[]>([]);
  const [sheet, setSheet] = useState<null | "One-time" | "SIP">(null);
  const [watchSheet, setWatchSheet] = useState(false);

  // The fund may not be cached yet (deep link, or a fund outside the browse slice).
  useEffect(() => {
    let cancelled = false;
    if (!fund) {
      loadFund(isin).then((f) => !cancelled && setFund(f));
    }
    return () => {
      cancelled = true;
    };
  }, [isin, fund, loadFund]);

  useEffect(() => {
    if (!fund) return;
    let cancelled = false;
    loadConstraints(fund.isin).then((c) => !cancelled && setCons(c));
    if (fund.category) {
      api.funds
        .list({ category: fund.category, sort: "aum", limit: 4 })
        .then((r) => {
          if (cancelled) return;
          setSimilar(r.results.map(toFund).filter((f) => f.id !== fund.id).slice(0, 3));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [fund, loadConstraints]);

  if (!fund) {
    return (
      <div className="screen animate-in">
        <div className="safe-top" />
        <div className="backbar">
          <button className="iconbtn" onClick={back}>
            <ChevronLeft size={22} />
          </button>
        </div>
        <div className="col" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Spinner dark lg />
        </div>
      </div>
    );
  }

  const watched = isWatched(fund.isin);
  const carted = inCart(fund.isin);
  const minBuy = cons?.buy.min ?? fund.minLumpsum ?? 1000;
  const cartAmount = Math.max(1000, minBuy);
  const minSip = cons?.sip.frequencies.find((f) => f.type === "monthly")?.minAmount ?? null;

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
              {fund.subCategory && <span className="tag">{fund.subCategory}</span>}
              {fund.rating != null && <Stars n={fund.rating} />}
            </div>
          </div>
        </div>

        {fund.objective && (
          <p className="muted mt12" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            {fund.objective}
          </p>
        )}

        {/* NAV */}
        <div className="between mt16">
          <div className="col gap4">
            <span className="lab">NAV{fund.navDate ? ` · ${fund.navDate}` : ""}</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
              {navOr(fund.nav)}
            </span>
          </div>
          <div className="col gap4" style={{ alignItems: "flex-end" }}>
            <span className="lab">1D change</span>
            <span
              className={`mono ${
                fund.navChange == null ? "muted" : fund.navChange >= 0 ? "green" : "red"
              }`}
              style={{ fontSize: 15, fontWeight: 500 }}
            >
              {pctOr(fund.navChange)}
            </span>
          </div>
        </div>

        {/* chart */}
        <div className="card mt16">
          <ReturnsChart fund={fund} />
        </div>

        {/* trailing returns */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Trailing returns (annualised)
        </div>
        <div className="card" style={{ padding: "6px 16px" }}>
          {(["6m", "1y", "3y", "5y"] as const).map((k) => {
            const v = fund.returns[k];
            return (
              <div
                key={k}
                className="row between"
                style={{ borderTop: k === "6m" ? "none" : "1px solid var(--line)" }}
              >
                <span style={{ fontSize: 14 }}>{k.toUpperCase()}</span>
                <span
                  className={`mono ${v == null ? "muted" : v >= 0 ? "green" : "red"}`}
                  style={{ width: 72, textAlign: "right", fontWeight: 500 }}
                >
                  {pctOr(v)}
                </span>
              </div>
            );
          })}
        </div>

        {/* stats grid */}
        <div className="stats mt16">
          <div className="cell">
            <span className="lab">Min SIP</span>
            <div className="v mono">{cons ? inrOr(minSip) : "…"}</div>
          </div>
          <div className="cell">
            <span className="lab">Min lump sum</span>
            <div className="v mono">{inrOr(cons?.buy.min ?? fund.minLumpsum)}</div>
          </div>
          <div className="cell">
            <span className="lab">Fund size</span>
            <div className="v mono">{croreOr(fund.aumCr)}</div>
          </div>
          <div className="cell">
            <span className="lab">Expense ratio</span>
            <div className="v mono">
              {fund.expense == null ? DASH : `${fund.expense.toFixed(2)}%`}
            </div>
          </div>
        </div>

        {/* risk-o-meter — only when a real riskometer value is available */}
        {fund.risk && (
          <div className="card card-lg mt16">
            <RiskMeter risk={fund.risk} />
          </div>
        )}

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
          <Basic label="AMC" value={textOr(fund.amc)} />
          <Basic label="ISIN" value={textOr(fund.isin)} />
          <Basic label="Plan" value={planLabel(fund)} />
          <Basic label="Fund manager" value={textOr(fund.manager)} />
          <Basic label="Launched" value={textOr(fund.launched)} />
          <Basic label="Benchmark" value={textOr(fund.benchmark)} />
          <Basic label="Exit load" value={textOr(fund.exitLoad)} />
          <Basic label="Lock-in" value={textOr(fund.lockIn)} />
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
                <FundRow key={f.id} fund={f} />
              ))}
            </div>
          </>
        )}

        <div className="lab" style={{ marginTop: 18, lineHeight: 1.7 }}>
          Mutual fund investments are subject to market risks. Read all scheme-related
          documents carefully.
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
              void addToCart(fund.isin, cartAmount);
              toast("Added to cart");
            }
          }}
        >
          <CartIcon size={20} />
        </button>
        <button className="btn btn-ghost grow" onClick={() => setSheet("One-time")}>
          One-time
        </button>
        <button
          className="btn btn-green grow"
          disabled={cons != null && !cons.sip.allowed}
          onClick={() => setSheet("SIP")}
        >
          Start SIP
        </button>
      </div>

      {sheet && <InvestSheet fund={fund} mode={sheet} onClose={() => setSheet(null)} />}
      {watchSheet && <WatchlistSheet fund={fund} onClose={() => setWatchSheet(false)} />}
    </div>
  );
}
