"use client";

import { useStore } from "../lib/store";
import { inr, units as fmtUnits } from "../lib/format";
import type { Order } from "../lib/types";

function statusClass(s: Order["status"]) {
  return s === "Pending" ? "pending" : s === "Allotted" ? "allotted" : "redeemed";
}

export function Orders() {
  const { state, go, switchTab } = useStore();
  const { orders } = state;

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="appbar">
        <span className="display" style={{ fontSize: 24 }}>
          Orders
        </span>
      </div>

      <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
        {orders.length === 0 ? (
          <div className="card card-lg" style={{ textAlign: "center", marginTop: 24 }}>
            <div className="h-sora" style={{ fontSize: 16 }}>
              No orders yet
            </div>
            <div className="muted mt8" style={{ fontSize: 14 }}>
              Your investments will show up here.
            </div>
            <button className="btn btn-green btn-sm mt16" onClick={() => switchTab("explore")}>
              Explore funds
            </button>
          </div>
        ) : (
          <>
            <div className="lab" style={{ padding: "6px 0 10px" }}>
              Pending orders update to Allotted automatically
            </div>
            <div className="card divide" style={{ padding: "0 16px" }}>
              {orders.map((o) => (
                <button
                  key={o.id}
                  className="row"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => go("orderDetail", { orderId: o.id })}
                >
                  <span className="grow col gap4" style={{ minWidth: 0 }}>
                    <span
                      className="h-sora"
                      style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {o.fundName}
                    </span>
                    <span className="rowc gap8">
                      <span className="tag">{o.kind}</span>
                      <span className="mono muted" style={{ fontSize: 12 }}>
                        {o.placedLabel}
                      </span>
                    </span>
                    <span className="rowc gap8 mt4">
                      <span className={`dot ${statusClass(o.status)}`} />
                      <span
                        className="lab"
                        style={{
                          letterSpacing: "0.1em",
                          color:
                            o.status === "Pending"
                              ? "#a06f22"
                              : o.status === "Allotted"
                              ? "var(--green)"
                              : "var(--mute)",
                        }}
                      >
                        {o.status}
                      </span>
                    </span>
                  </span>
                  <span className="col gap4" style={{ alignItems: "flex-end" }}>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>
                      {o.kind === "Redeem" ? "−" : ""}
                      {inr(o.amount)}
                    </span>
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {fmtUnits(o.units)} units
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
