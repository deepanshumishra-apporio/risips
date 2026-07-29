"use client";

import { useState } from "react";
import { useStore } from "../lib/store";
import { Spinner } from "../components/ui";
import {
  ChevronLeft,
  ArrowDownIcon,
  ArrowUpIcon,
  ShieldCheck,
  CheckIcon,
} from "../components/icons";
import { inr } from "../lib/format";
import type { WalletTxn } from "../lib/types";

const CHIPS = [500, 1000, 5000, 10000];

function txnMeta(kind: WalletTxn["kind"]) {
  if (kind === "Added") return { sign: "+", cls: "green", Icon: ArrowDownIcon };
  if (kind === "Withdrawn") return { sign: "−", cls: "", Icon: ArrowUpIcon };
  return { sign: "−", cls: "", Icon: ArrowUpIcon }; // Invested
}

export function Wallet() {
  const { state, back, go, withdrawMoney, toast } = useStore();
  const [mode, setMode] = useState<null | "add" | "withdraw">(null);
  const [amount, setAmount] = useState(1000);
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");

  const bal = state.wallet;

  function openAdd() {
    setMode("add");
    setAmount(1000);
  }
  function openWithdraw() {
    setMode("withdraw");
    setAmount(Math.min(1000, bal));
    setPhase("idle");
  }

  async function confirmWithdraw() {
    if (amount <= 0 || amount > bal) return;
    setPhase("processing");
    try {
      await withdrawMoney(amount);
      setPhase("done");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Withdrawal failed.");
      setPhase("idle");
    }
  }

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          risips Balance
        </span>
      </div>

      <div className="scroll pad" style={{ paddingBottom: 20 }}>
        {/* balance hero */}
        <div
          className="card card-lg"
          style={{ background: "var(--ink)", borderColor: "var(--ink)" }}
        >
          <span className="lab" style={{ color: "#A9A497" }}>
            Available balance
          </span>
          <div className="num-hero" style={{ fontSize: 36, color: "var(--paper)", marginTop: 6 }}>
            {inr(bal)}
          </div>
          <div className="rowc gap8 mt12" style={{ color: "#A9A497", fontSize: 12 }}>
            <ShieldCheck size={13} /> Held with our RBI-regulated partner bank
          </div>
          <div className="rowc gap12 mt16">
            <button className="btn btn-green grow" onClick={openAdd}>
              Add money
            </button>
            <button
              className="btn grow"
              style={{ background: "#2a2a24", color: "var(--paper)" }}
              onClick={openWithdraw}
              disabled={bal <= 0}
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="muted mt16" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          Use your balance to invest instantly — no UPI approval needed at
          checkout.
        </div>

        {/* transactions */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Transactions
        </div>
        <div className="card divide" style={{ padding: "0 16px" }}>
          {state.walletTxns.map((t) => {
            const m = txnMeta(t.kind);
            return (
              <div key={t.id} className="row">
                <span
                  className="amc"
                  style={{ width: 38, height: 38, borderColor: "var(--line)" }}
                >
                  <m.Icon size={18} />
                </span>
                <span className="grow col gap4" style={{ minWidth: 0 }}>
                  <span className="h-sora" style={{ fontSize: 14 }}>
                    {t.kind}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {t.label} · {t.when}
                  </span>
                </span>
                <span
                  className={`mono ${m.cls}`}
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {m.sign}
                  {inr(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* add money sheet → routes to UPI payment */}
      {mode === "add" && (
        <div className="overlay" onClick={() => setMode(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grip" />
            <div className="h-sora" style={{ fontSize: 17 }}>
              Add money to balance
            </div>
            <div className="prefix-field field-lg mt16">
              <span className="pf" style={{ fontSize: 24 }}>
                ₹
              </span>
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
            <button
              className="btn btn-green btn-block mt16"
              disabled={amount < 1}
              onClick={() => {
                setMode(null);
                go("payment", { addMoney: true, amount });
              }}
            >
              Add {inr(amount)} via UPI
            </button>
          </div>
        </div>
      )}

      {/* withdraw sheet (instant, to bank) */}
      {mode === "withdraw" && (
        <div className="overlay" onClick={() => phase !== "processing" && setMode(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grip" />
            {phase === "done" ? (
              <div
                className="col"
                style={{ alignItems: "center", textAlign: "center", padding: "12px 0 8px", gap: 8 }}
              >
                <div className="check-ring" style={{ width: 72, height: 72 }}>
                  <CheckIcon size={34} />
                </div>
                <div className="h-sora" style={{ fontSize: 18, marginTop: 12 }}>
                  {inr(amount)} on the way
                </div>
                <div className="muted" style={{ fontSize: 13.5, maxWidth: "28ch" }}>
                  Credited to HDFC ••••4321 by T+1 working day.
                </div>
                <button
                  className="btn btn-ink btn-block mt16"
                  onClick={() => setMode(null)}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="h-sora" style={{ fontSize: 17 }}>
                  Withdraw to bank
                </div>
                <div className="muted mt4" style={{ fontSize: 12.5 }}>
                  Balance {inr(bal)} · to HDFC ••••4321
                </div>
                <div className="prefix-field field-lg mt16">
                  <span className="pf" style={{ fontSize: 24 }}>
                    ₹
                  </span>
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
                  <button
                    className="amt-chip"
                    onClick={() => setAmount(Math.round(bal / 2))}
                  >
                    50%
                  </button>
                  <button className="amt-chip" onClick={() => setAmount(bal)}>
                    All {inr(bal)}
                  </button>
                </div>
                {amount > bal && (
                  <div className="red mt12" style={{ fontSize: 13 }}>
                    You can withdraw up to {inr(bal)}.
                  </div>
                )}
                <button
                  className="btn btn-ink btn-block mt16"
                  disabled={amount < 1 || amount > bal || phase === "processing"}
                  onClick={confirmWithdraw}
                >
                  {phase === "processing" ? (
                    <>
                      <Spinner /> Processing…
                    </>
                  ) : (
                    `Withdraw ${inr(amount)}`
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
