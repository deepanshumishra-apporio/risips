"use client";

import { useMemo, useState } from "react";
import type { Fund } from "../lib/types";
import { inr } from "../lib/format";

const AMOUNTS = [1000, 2500, 5000, 10000];
const YEARS = [3, 5, 10, 15];

export function SipCalculator({
  fund,
  onStart,
}: {
  fund: Fund;
  onStart: () => void;
}) {
  const [amount, setAmount] = useState(5000);
  const [years, setYears] = useState(5);

  // Project using the fund's 3Y annualised return, monthly compounding. When the fund has
  // no reported 3Y figure there is nothing honest to project from — see the guard below.
  const rate3y = fund.returns["3y"];

  const { invested, future, gain } = useMemo(() => {
    const rate = (rate3y ?? 0) / 100;
    const n = years * 12;
    const r = rate / 12;
    // future value of a monthly annuity
    const fv = amount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = amount * n;
    return { invested, future: Math.round(fv), gain: Math.round(fv) - invested };
  }, [amount, years, rate3y]);

  const gainPctOfTotal = future > 0 ? Math.round((gain / future) * 100) : 0;

  // Without a past-return figure any projection would be a number we made up.
  if (rate3y == null) {
    return (
      <div className="card card-lg">
        <div className="lab">SIP projection</div>
        <div className="muted mt12" style={{ fontSize: 13 }}>
          This fund has no reported 3-year return, so we can&apos;t project a SIP value for it.
        </div>
        <button className="btn btn-green btn-block mt16" onClick={onStart}>
          Start a SIP
        </button>
      </div>
    );
  }

  return (
    <div className="card card-lg">
      <div className="lab">Monthly investment</div>
      <div className="amt-chips mt8">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            className={`amt-chip${amount === a ? " active" : ""}`}
            onClick={() => setAmount(a)}
          >
            {inr(a)}
          </button>
        ))}
      </div>

      <div className="lab mt16">Time period</div>
      <div className="amt-chips mt8">
        {YEARS.map((y) => (
          <button
            key={y}
            className={`amt-chip${years === y ? " active" : ""}`}
            onClick={() => setYears(y)}
          >
            {y} yr
          </button>
        ))}
      </div>

      {/* projected value */}
      <div className="mt16" style={{ textAlign: "center" }}>
        <div className="lab">Projected value in {years} years</div>
        <div className="num-hero" style={{ fontSize: 32, marginTop: 6 }}>
          {inr(future)}
        </div>
      </div>

      {/* invested vs gain bar */}
      <div
        className="mt16"
        style={{
          height: 8,
          borderRadius: 4,
          background: "var(--line-soft)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${100 - gainPctOfTotal}%`,
            background: "var(--ink)",
          }}
        />
        <div
          style={{ width: `${gainPctOfTotal}%`, background: "var(--green)" }}
        />
      </div>

      <div className="between mt12">
        <div className="col gap4">
          <span className="rowc gap8" style={{ fontSize: 12 }}>
            <span
              style={{ width: 8, height: 8, borderRadius: 2, background: "var(--ink)" }}
            />
            Invested
          </span>
          <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
            {inr(invested)}
          </span>
        </div>
        <div className="col gap4" style={{ alignItems: "flex-end" }}>
          <span className="rowc gap8" style={{ fontSize: 12 }}>
            <span
              style={{ width: 8, height: 8, borderRadius: 2, background: "var(--green)" }}
            />
            Est. returns
          </span>
          <span className="mono green" style={{ fontSize: 14, fontWeight: 500 }}>
            +{inr(gain)}
          </span>
        </div>
      </div>

      <button className="btn btn-green btn-block mt16" onClick={onStart}>
        Start this SIP
      </button>
      <div className="muted mt8" style={{ fontSize: 11.5, textAlign: "center" }}>
        Projection at {rate3y.toFixed(1)}% p.a. (past 3Y) — returns are not guaranteed.
      </div>
    </div>
  );
}
