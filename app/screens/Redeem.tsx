"use client";

import { useState } from "react";
import { fundByIsin, primaryBank, useStore } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { Spinner } from "../components/ui";
import { CheckIcon, ChevronLeft } from "../components/icons";
import { bankLabel, inr, units as fmtUnits } from "../lib/format";

export function Redeem() {
  const { route, back, switchTab, state, redeem } = useStore();
  const isin = route.params?.isin as string;
  const fund = fundByIsin(isin);
  const holding = state.holdings.find((h) => h.isin === isin);

  const [amount, setAmount] = useState<number>(0);
  const [phase, setPhase] = useState<"input" | "processing" | "done">("input");

  if (!fund || !holding) return null;

  const max = holding.current;
  const valid = amount > 0 && amount <= max;

  function confirm() {
    if (!valid) return;
    setPhase("processing");
    setTimeout(() => {
      redeem(isin, amount);
      setPhase("done");
    }, 1500);
  }

  if (phase === "done") {
    return (
      <div className="screen animate-in">
        <div className="safe-top" />
        <div
          className="grow col pad"
          style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
        >
          <div className="check-ring">
            <CheckIcon size={44} />
          </div>
          <div className="display" style={{ fontSize: 24, marginTop: 24 }}>
            Redemption placed
          </div>
          <p className="muted mt12" style={{ fontSize: 14.5, maxWidth: "28ch" }}>
            <b style={{ color: "var(--ink)" }}>{inr(amount)}</b> will be in your
            bank account by <b style={{ color: "var(--ink)" }}>T+3</b> working
            days.
          </p>
          <div className="mono muted mt16" style={{ fontSize: 13 }}>
            To {bankLabel(primaryBank(state))}
          </div>
        </div>
        <div style={{ padding: "0 20px 40px" }}>
          <button className="btn btn-ink btn-block" onClick={() => switchTab("portfolio")}>
            Back to portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          Redeem
        </span>
      </div>

      <div className="scroll pad">
        <div className="rowc gap12">
          <AmcLogo fund={fund} size={40} />
          <div className="col gap4" style={{ minWidth: 0 }}>
            <span className="h-sora" style={{ fontSize: 15 }}>
              {fund.name}
            </span>
            <span className="mono muted" style={{ fontSize: 12 }}>
              {fmtUnits(holding.units)} units · {inr(holding.current)}
            </span>
          </div>
        </div>

        <div className="lab" style={{ marginTop: 24, marginBottom: 8 }}>
          Amount to redeem
        </div>
        <div className="prefix-field field-lg">
          <span className="pf" style={{ fontSize: 24 }}>
            ₹
          </span>
          <input
            autoFocus
            inputMode="numeric"
            className="mono"
            value={amount ? amount.toLocaleString("en-IN") : ""}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, ""));
              setAmount(Number.isNaN(n) ? 0 : n);
            }}
          />
        </div>

        <div className="amt-chips mt12">
          {[25, 50, 100].map((p) => (
            <button
              key={p}
              className={`amt-chip${amount === Math.round((max * p) / 100) ? " active" : ""}`}
              onClick={() => setAmount(Math.round((max * p) / 100))}
            >
              {p === 100 ? "All" : `${p}%`}
            </button>
          ))}
        </div>

        {amount > max && (
          <div className="red mt12" style={{ fontSize: 13 }}>
            You can redeem up to {inr(max)}.
          </div>
        )}

        <div className="card mt24">
          <div className="between">
            <span className="lab">Estimated payout</span>
            <span className="mono" style={{ fontWeight: 500 }}>
              {inr(valid ? amount : 0)}
            </span>
          </div>
          <div className="hr" style={{ margin: "12px 0" }} />
          <div className="between">
            <span className="lab">Credited by</span>
            <span className="mono" style={{ fontSize: 13 }}>
              T+3 working days
            </span>
          </div>
        </div>
      </div>

      <div className="sticky-cta">
        <button
          className="btn btn-ink btn-block"
          disabled={!valid || phase === "processing"}
          onClick={confirm}
        >
          {phase === "processing" ? (
            <>
              <Spinner /> Processing…
            </>
          ) : (
            `Redeem ${inr(valid ? amount : 0)}`
          )}
        </button>
      </div>
    </div>
  );
}
