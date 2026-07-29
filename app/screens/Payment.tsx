"use client";

import { useState } from "react";
import { fundByIsin, useStore, type InvestDraft } from "../lib/store";
import { Spinner } from "../components/ui";
import { LockIcon } from "../components/icons";
import { inr } from "../lib/format";

export function Payment() {
  const {
    route,
    back,
    go,
    placeInvestment,
    checkoutCart,
    addMoney,
    spendFromWallet,
    toast,
    state: app,
  } = useStore();
  const p = route.params ?? {};
  const isAddMoney = p.addMoney === true;
  const isCart = p.cart === true;
  const method = (p.method as "upi" | "wallet") ?? "upi";
  const isWallet = method === "wallet" && !isAddMoney;
  const isin = p.isin as string;
  const amount = p.amount as number;
  const mode = p.mode as "One-time" | "SIP";
  const sipDay = (p.sipDay as number) ?? 5;
  const fund = fundByIsin(isin);
  const cartCount = app.cart.length;

  const [state, setState] = useState<"idle" | "approving">("idle");

  if (!isAddMoney && !isCart && !fund) return null;

  const subtitle = isAddMoney
    ? "Add to risips balance"
    : isCart
    ? `${cartCount} fund${cartCount > 1 ? "s" : ""} · one-time`
    : mode === "SIP"
    ? "First SIP instalment"
    : "One-time investment";
  const detailLine = isAddMoney
    ? "Wallet top-up"
    : isCart
    ? "Cart checkout"
    : fund!.name;

  // Placement is a real upstream call, so failures have to land somewhere the user can
  // see: on error we surface the message and return to the form rather than routing to a
  // success screen for an order that was never placed.
  async function approve() {
    if (state === "approving") return;
    setState("approving");
    try {
      if (isAddMoney) {
        await addMoney(amount);
        toast(`${inr(amount)} added to balance`);
        back();
        return;
      }

      if (isCart) {
        const orders = await checkoutCart();
        if (!orders.length) {
          setState("idle");
          return; // checkoutCart already reported why
        }
        if (isWallet) await spendFromWallet(amount, `Cart · ${cartCount} funds`);
        go("success", { cart: true, count: orders.length, amount });
        return;
      }

      const draft: InvestDraft = { isin, amount, mode, sipDay };
      const order = await placeInvestment(draft);
      if (isWallet) await spendFromWallet(amount, fund!.name);
      go("success", { orderId: order.id, isin, amount, mode, sipDay });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Payment could not be completed.");
      setState("idle");
    }
  }

  return (
    <div className="screen animate-in" style={{ background: "var(--ink)" }}>
      <div className="safe-top" />
      {/* mock UPI app chrome */}
      <div
        className="backbar"
        style={{ justifyContent: "center", color: "var(--paper)" }}
      >
        <span className="wordmark" style={{ fontSize: 16, color: "var(--paper)" }}>
          {isWallet ? "risips Balance" : "UPI"}
        </span>
      </div>

      <div className="grow col pad" style={{ justifyContent: "center", gap: 4 }}>
        <div
          className="card card-lg"
          style={{ background: "#232320", borderColor: "#33332e", textAlign: "center", padding: 28 }}
        >
          <div className="lab" style={{ color: "#A9A497" }}>
            Payment request
          </div>
          <div
            className="rowc gap8"
            style={{ justifyContent: "center", marginTop: 16 }}
          >
            <span
              className="amc"
              style={{ width: 44, height: 44, background: "var(--paper)" }}
            >
              ri
            </span>
          </div>
          <div className="mt12" style={{ color: "var(--paper)", fontSize: 15 }}>
            {isWallet ? "Paying from your balance" : (<><b>risips</b> is requesting</>)}
          </div>
          <div
            className="num-hero"
            style={{ fontSize: 44, color: "var(--paper)", marginTop: 8 }}
          >
            {inr(amount)}
          </div>
          <div className="mono mt12" style={{ color: "#A9A497", fontSize: 13 }}>
            {subtitle}
          </div>
          <div className="mono mt4" style={{ color: "#A9A497", fontSize: 12 }}>
            {detailLine}
          </div>

          <div
            className="hr"
            style={{ background: "#33332e", margin: "20px 0" }}
          />

          <div className="between">
            <span className="mono" style={{ color: "#A9A497", fontSize: 13 }}>
              {isWallet ? "Balance after" : "Pay from"}
            </span>
            <span className="mono" style={{ color: "var(--paper)", fontSize: 13 }}>
              {isWallet ? inr(Math.max(0, app.wallet - amount)) : "HDFC ••••4321"}
            </span>
          </div>
        </div>

        <div
          className="rowc gap8"
          style={{ justifyContent: "center", color: "#A9A497", marginTop: 18, fontSize: 12 }}
        >
          <LockIcon size={13} />{" "}
          {isWallet
            ? "Instant · paid from your risips balance"
            : "Secured by UPI · demo — no real debit"}
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        <button
          className="btn btn-green btn-block"
          disabled={state === "approving"}
          onClick={approve}
        >
          {state === "approving" ? (
            <>
              <Spinner /> {isWallet ? "Paying…" : "Approving…"}
            </>
          ) : isWallet ? (
            `Pay ${inr(amount)}`
          ) : (
            `Approve ${inr(amount)}`
          )}
        </button>
        <button
          className="btn btn-block"
          style={{ color: "#A9A497", background: "transparent" }}
          disabled={state === "approving"}
          onClick={back}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
