"use client";

import { fundByIsin, useStore } from "../lib/store";
import { CheckIcon } from "../components/icons";
import { inr } from "../lib/format";

export function OrderSuccess() {
  const { route, switchTab } = useStore();
  const p = route.params ?? {};
  const isCart = p.cart === true;
  const count = p.count as number;
  const orderId = p.orderId as string;
  const isin = p.isin as string;
  const amount = p.amount as number;
  const mode = p.mode as "One-time" | "SIP";
  const sipDay = p.sipDay as number;
  const fund = fundByIsin(isin);

  const heading = isCart
    ? `${count} orders placed`
    : mode === "SIP"
    ? "SIP started"
    : "Order placed";

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div
        className="grow col pad"
        style={{ alignItems: "center", justifyContent: "center", textAlign: "center", gap: 0 }}
      >
        <div className="check-ring">
          <CheckIcon size={44} />
        </div>

        <div className="display" style={{ fontSize: 26, marginTop: 26 }}>
          {heading}
        </div>
        <p className="muted mt12" style={{ fontSize: 14.5, maxWidth: "30ch" }}>
          Units will be allotted in{" "}
          <b style={{ color: "var(--ink)" }}>1–2 working days</b> at today&apos;s
          NAV.
        </p>

        <div className="card card-lg mt24" style={{ width: "100%", textAlign: "left" }}>
          <div className="between">
            <span className="lab">
              {isCart ? "Total invested" : mode === "SIP" ? "Monthly SIP" : "Amount"}
            </span>
            <span className="mono" style={{ fontWeight: 500 }}>
              {inr(amount)}
              {!isCart && mode === "SIP" ? " /mo" : ""}
            </span>
          </div>
          <div className="hr" style={{ margin: "12px 0" }} />
          <div className="between">
            <span className="lab">{isCart ? "Funds" : "Fund"}</span>
            <span style={{ fontSize: 13, maxWidth: "18ch", textAlign: "right" }}>
              {isCart ? `${count} funds` : fund?.name}
            </span>
          </div>
          {!isCart && mode === "SIP" && (
            <>
              <div className="hr" style={{ margin: "12px 0" }} />
              <div className="between">
                <span className="lab">Every month on</span>
                <span className="mono" style={{ fontSize: 13 }}>
                  Day {sipDay}
                </span>
              </div>
            </>
          )}
          {!isCart && (
            <>
              <div className="hr" style={{ margin: "12px 0" }} />
              <div className="between">
                <span className="lab">Order ID</span>
                <span className="mono muted" style={{ fontSize: 13 }}>
                  {orderId}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        <button
          className="btn btn-ink btn-block"
          onClick={() => switchTab("portfolio")}
        >
          View portfolio
        </button>
        <button
          className="btn btn-block"
          style={{ background: "transparent" }}
          onClick={() => switchTab("orders")}
        >
          Track order
        </button>
      </div>
    </div>
  );
}
