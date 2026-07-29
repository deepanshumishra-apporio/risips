"use client";

import { useEffect, useMemo, useState } from "react";
import type { Fund } from "../lib/types";
import { useStore } from "../lib/store";
import type { FundConstraints } from "../lib/api";
import { AmcLogo } from "./AmcLogo";
import { WalletIcon, CheckIcon } from "./icons";
import { inr, units as fmtUnits } from "../lib/format";

const CHIPS = [500, 1000, 5000, 10000];
const DEFAULT_MIN = 1000;

export function InvestSheet({
  fund,
  mode: initialMode,
  onClose,
}: {
  fund: Fund;
  mode: "One-time" | "SIP";
  onClose: () => void;
}) {
  const { go, state, loadConstraints } = useStore();
  const [mode, setMode] = useState<"One-time" | "SIP">(initialMode);
  const [amount, setAmount] = useState<number>(fund.minLumpsum ?? DEFAULT_MIN);
  const [sipDay, setSipDay] = useState<number>(5);
  const [method, setMethod] = useState<"upi" | "wallet">("upi");

  // Order limits are exchange rules, so read them live rather than trusting the catalogue.
  const [cons, setCons] = useState<FundConstraints | null>(null);
  const [consLoading, setConsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadConstraints(fund.isin)
      .then((c) => {
        if (cancelled) return;
        setCons(c);
        const sipMin = c?.sip.frequencies.find((f) => f.type === "monthly")?.minAmount ?? null;
        const start = initialMode === "SIP" ? sipMin : c?.buy.min;
        if (start) setAmount(start);
      })
      .finally(() => !cancelled && setConsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fund.isin, initialMode, loadConstraints]);

  const monthly = useMemo(
    () => cons?.sip.frequencies.find((f) => f.type === "monthly") ?? null,
    [cons],
  );
  const sipAllowed = Boolean(cons?.sip.allowed && monthly);
  const buyAllowed = cons ? cons.buy.allowed : true;

  const min =
    mode === "SIP"
      ? monthly?.minAmount ?? fund.minSip ?? DEFAULT_MIN
      : cons?.buy.min ?? fund.minLumpsum ?? DEFAULT_MIN;

  const allowedDates = useMemo(
    () =>
      monthly?.allowedDates?.length
        ? monthly.allowedDates
        : Array.from({ length: 28 }, (_, i) => i + 1),
    [monthly],
  );

  // Derived rather than corrected-in-an-effect: the effective date is always one the AMC
  // accepts, even before the user touches the picker.
  const effectiveSipDay = allowedDates.includes(sipDay) ? sipDay : allowedDates[0]!;

  const walletOk = state.wallet >= amount;
  const modeAllowed = mode === "SIP" ? sipAllowed : buyAllowed;
  const valid = !consLoading && modeAllowed && amount >= min && (method === "upi" || walletOk);

  function proceed() {
    if (!valid) return;
    onClose();
    go("payment", { isin: fund.isin, amount, mode, sipDay: effectiveSipDay, method });
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
              style={{ flex: 1, opacity: m === "SIP" && !consLoading && !sipAllowed ? 0.5 : 1 }}
              disabled={m === "SIP" && !consLoading && !sipAllowed}
              onClick={() => {
                setMode(m);
                const nextMin = m === "SIP" ? monthly?.minAmount ?? null : cons?.buy.min ?? null;
                if (nextMin && amount < nextMin) setAmount(nextMin);
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

        {valid && fund.nav != null && fund.nav > 0 && (
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
              {allowedDates.map((d) => (
                <button
                  key={d}
                  onClick={() => setSipDay(d)}
                  className="mono"
                  style={{
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    fontSize: 13,
                    background: effectiveSipDay === d ? "var(--ink)" : "var(--paper)",
                    color: effectiveSipDay === d ? "var(--paper)" : "var(--ink)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="muted mt12" style={{ fontSize: 13 }}>
              First debit on {effectiveSipDay} of every month, until you cancel.
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

        {!consLoading && !modeAllowed && (
          <div className="red mt12" style={{ fontSize: 13 }}>
            {mode === "SIP"
              ? "This fund doesn't accept SIPs."
              : "This fund isn't open for purchase right now."}
          </div>
        )}
        {modeAllowed && amount < min && (
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
        {/* Read the plan off the fund — this catalogue is mostly Regular plans, and
            claiming "Direct · 0% commission" on a Regular scheme is simply false. */}
        <div className="muted mt12" style={{ fontSize: 12, textAlign: "center" }}>
          Allotment at today&apos;s NAV
          {fund.plan ? ` · ${fund.plan === "direct" ? "Direct plan · 0% commission" : "Regular plan"}` : ""}
        </div>
      </div>
    </div>
  );
}
