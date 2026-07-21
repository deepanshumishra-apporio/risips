"use client";

import { useState } from "react";
import type { Fund } from "../lib/types";
import { useStore } from "../lib/store";
import { AmcLogo } from "./AmcLogo";
import { WalletIcon, CheckIcon } from "./icons";
import { inr, units as fmtUnits } from "../lib/format";

const CHIPS = [500, 1000, 5000, 10000];

export function InvestSheet({
  fund,
  mode: initialMode,
  onClose,
}: {
  fund: Fund;
  mode: "One-time" | "SIP";
  onClose: () => void;
}) {
  const { go, state } = useStore();
  const [mode, setMode] = useState<"One-time" | "SIP">(initialMode);
  const [amount, setAmount] = useState<number>(
    initialMode === "SIP" ? fund.minSip : 1000
  );
  const [sipDay, setSipDay] = useState<number>(5);
  const [method, setMethod] = useState<"upi" | "wallet">("upi");

  const min = mode === "SIP" ? fund.minSip : fund.minLumpsum;
  const walletOk = state.wallet >= amount;
  const valid = amount >= min && (method === "upi" || walletOk);

  function proceed() {
    if (!valid) return;
    onClose();
    go("payment", { isin: fund.isin, amount, mode, sipDay, method });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />

        <div className="segment" style={{ display: "flex", width: "100%" }}>
          {(["One-time", "SIP"] as const).map((m) => (
            <button
              key={m}
              className={mode === m ? "active" : ""}
              style={{ flex: 1 }}
              onClick={() => {
                setMode(m);
                if (m === "SIP" && amount < fund.minSip) setAmount(fund.minSip);
              }}
            >
              {m === "One-time" ? "One-time" : "Monthly SIP"}
            </button>
          ))}
        </div>

        <div className="rowc gap12 mt16">
          <AmcLogo fund={fund} size={36} />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span
              className="h-sora"
              style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {fund.name}
            </span>
            <span className="lab">{mode === "SIP" ? "Monthly instalment" : "Lump sum amount"}</span>
          </div>
        </div>

        <div className="prefix-field field-lg" style={{ marginTop: 16 }}>
          <span className="pf" style={{ fontSize: 24 }}>₹</span>
          <input
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
          {CHIPS.map((c) => (
            <button
              key={c}
              className={`amt-chip${amount === c ? " active" : ""}`}
              onClick={() => setAmount(c)}
            >
              +{inr(c)}
            </button>
          ))}
        </div>

        {valid && (
          <div className="between mt12" style={{ fontSize: 12.5 }}>
            <span className="muted">≈ units at ₹{fund.nav.toFixed(2)} NAV</span>
            <span className="mono">{fmtUnits(amount / fund.nav)}</span>
          </div>
        )}

        {mode === "SIP" && (
          <div className="mt24">
            <div className="lab" style={{ marginBottom: 10 }}>
              Monthly SIP date
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 6,
              }}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  onClick={() => setSipDay(d)}
                  className="mono"
                  style={{
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    fontSize: 13,
                    background: sipDay === d ? "var(--ink)" : "var(--paper)",
                    color: sipDay === d ? "var(--paper)" : "var(--ink)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="muted mt12" style={{ fontSize: 13 }}>
              First debit on {sipDay} of every month, until you cancel.
            </div>
          </div>
        )}

        {/* pay using */}
        <div className="lab" style={{ margin: "18px 0 8px" }}>
          Pay using
        </div>
        <div className="col gap8">
          <button
            className={`opt${method === "wallet" ? " on" : ""}`}
            disabled={!walletOk}
            style={{ opacity: walletOk ? 1 : 0.55 }}
            onClick={() => setMethod("wallet")}
          >
            <WalletIcon size={20} />
            <span className="grow">
              risips Balance
              <span className="mono muted" style={{ fontSize: 12, marginLeft: 8 }}>
                {inr(state.wallet)}
              </span>
            </span>
            {method === "wallet" ? (
              <CheckIcon size={18} />
            ) : !walletOk ? (
              <span className="lab" style={{ color: "var(--red)" }}>
                Low
              </span>
            ) : null}
          </button>
          <button
            className={`opt${method === "upi" ? " on" : ""}`}
            onClick={() => setMethod("upi")}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: "#1A73E8",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-sora)",
                fontWeight: 700,
                fontSize: 11,
                flex: "0 0 auto",
              }}
            >
              G
            </span>
            <span className="grow">UPI · Google Pay / PhonePe</span>
            {method === "upi" && <CheckIcon size={18} />}
          </button>
        </div>

        {amount < min && (
          <div className="red mt12" style={{ fontSize: 13 }}>
            Minimum {mode === "SIP" ? "SIP" : "lump sum"} is {inr(min)}.
          </div>
        )}
        {amount >= min && method === "wallet" && !walletOk && (
          <div className="red mt12" style={{ fontSize: 13 }}>
            Balance short by {inr(amount - state.wallet)}. Add money or use UPI.
          </div>
        )}

        <button
          className="btn btn-green btn-block mt16"
          disabled={!valid}
          onClick={proceed}
        >
          {mode === "SIP"
            ? `Start SIP · ${inr(amount)}/mo`
            : method === "wallet"
            ? `Pay ${inr(amount)} from balance`
            : `Pay ${inr(amount)}`}
        </button>
        <div className="muted mt12" style={{ fontSize: 12, textAlign: "center" }}>
          Allotment at today&apos;s NAV · Direct plan · 0% commission
        </div>
      </div>
    </div>
  );
}
