"use client";

import { useState } from "react";
import { fundByIsin, useStore } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { ChevronLeft, TrashIcon } from "../components/icons";
import { inr } from "../lib/format";

const STEP = 500;

export function Cart() {
  const { state, back, switchTab, go, removeFromCart, setCartAmount, toast } =
    useStore();
  const [method, setMethod] = useState<"upi" | "wallet">("upi");
  const items = state.cart
    .map((c) => ({ item: c, fund: fundByIsin(c.isin) }))
    .filter((x) => x.fund) as { item: { isin: string; amount: number }; fund: NonNullable<ReturnType<typeof fundByIsin>> }[];

  const total = items.reduce((s, x) => s + x.item.amount, 0);

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          Cart
        </span>
      </div>

      {items.length === 0 ? (
        <div
          className="grow col pad"
          style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}
        >
          <div className="h-sora" style={{ fontSize: 18 }}>
            Your cart is empty
          </div>
          <div className="muted mt8" style={{ fontSize: 14, maxWidth: "26ch" }}>
            Add funds from any fund page to invest in them together in one go.
          </div>
          <button className="btn btn-green mt16" onClick={() => switchTab("explore")}>
            Explore funds
          </button>
        </div>
      ) : (
        <>
          <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
            <div className="lab" style={{ padding: "10px 0" }}>
              {items.length} fund{items.length > 1 ? "s" : ""} · one-time
              investment
            </div>

            <div className="col gap12">
              {items.map(({ item, fund }) => {
                const min = fund.minLumpsum;
                return (
                  <div key={item.isin} className="card">
                    <div className="rowc gap12">
                      <button
                        className="rowc gap12 grow"
                        style={{ textAlign: "left", minWidth: 0 }}
                        onClick={() => go("fund", { isin: fund.isin })}
                      >
                        <AmcLogo fund={fund} size={38} />
                        <span className="grow col gap4" style={{ minWidth: 0 }}>
                          <span
                            className="h-sora"
                            style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {fund.name}
                          </span>
                          <span className="muted" style={{ fontSize: 12 }}>
                            {fund.category} · NAV ₹{fund.nav.toFixed(2)}
                          </span>
                        </span>
                      </button>
                      <button
                        className="iconbtn"
                        aria-label="Remove"
                        onClick={() => {
                          removeFromCart(item.isin);
                          toast("Removed from cart");
                        }}
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>

                    <div className="hr" style={{ margin: "12px 0" }} />
                    <div className="between">
                      <span className="lab">Amount</span>
                      <div className="qty">
                        <button
                          aria-label="Decrease"
                          onClick={() =>
                            setCartAmount(
                              item.isin,
                              Math.max(min, item.amount - STEP)
                            )
                          }
                        >
                          −
                        </button>
                        <span className="val mono">{inr(item.amount)}</span>
                        <button
                          aria-label="Increase"
                          onClick={() => setCartAmount(item.isin, item.amount + STEP)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* bill summary */}
            <div className="card mt16">
              <div className="between">
                <span className="lab">Total investment</span>
                <span className="mono" style={{ fontWeight: 500 }}>
                  {inr(total)}
                </span>
              </div>
              <div className="hr" style={{ margin: "12px 0" }} />
              <div className="between">
                <span className="muted" style={{ fontSize: 13 }}>
                  Commission
                </span>
                <span className="mono green" style={{ fontSize: 13 }}>
                  ₹0 · Direct
                </span>
              </div>
            </div>
          </div>

          <div className="sticky-cta" style={{ flexDirection: "column", gap: 8 }}>
            <div className="amt-chips" style={{ width: "100%" }}>
              <button
                className={`amt-chip${method === "upi" ? " active" : ""}`}
                onClick={() => setMethod("upi")}
              >
                Pay via UPI
              </button>
              <button
                className={`amt-chip${method === "wallet" ? " active" : ""}`}
                disabled={state.wallet < total}
                style={{ opacity: state.wallet < total ? 0.5 : 1 }}
                onClick={() => setMethod("wallet")}
              >
                Balance {inr(state.wallet)}
              </button>
            </div>
            <button
              className="btn btn-green btn-block"
              onClick={() => go("payment", { cart: true, amount: total, method })}
            >
              {method === "wallet"
                ? `Pay ${inr(total)} from balance`
                : `Invest ${inr(total)}`}
            </button>
            <div className="muted" style={{ fontSize: 11.5, textAlign: "center" }}>
              Allotment at today&apos;s NAV · units in 1–2 working days
            </div>
          </div>
        </>
      )}
    </div>
  );
}
