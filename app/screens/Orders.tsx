"use client";

import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { inrOr, unitsOr, navOr, inr, DASH } from "../lib/format";
import type { Order, OrderKind } from "../lib/types";

/**
 * Transaction history.
 *
 * The reference design is a desktop table (DATE · SCHEME · AMOUNT · UNITS · NAV · CREDIT DATE ·
 * STATUS). Seven columns do not fit a 390pt phone frame, so each transaction is a card with
 * the same seven values laid out as a labelled grid instead of a row of cells. Nothing is
 * dropped — it is the same information, re-flowed.
 */

type Filter = "All" | "Lumpsum" | "SIP" | "Switches" | "Redeemed";

/** Which order kinds each filter admits. `All` is handled separately. */
const FILTER_KINDS: Record<Exclude<Filter, "All">, OrderKind> = {
  Lumpsum: "One-time",
  SIP: "SIP",
  Switches: "Switch",
  Redeemed: "Redeem",
};

const FILTERS: Filter[] = ["All", "Lumpsum", "SIP", "Switches", "Redeemed"];

function statusClass(s: Order["status"]) {
  return s === "Pending" ? "pending" : s === "Allotted" ? "allotted" : "redeemed";
}

function statusColor(s: Order["status"]) {
  if (s === "Pending") return "#a06f22";
  if (s === "Allotted") return "var(--green)";
  if (s === "Failed" || s === "Cancelled") return "var(--red)";
  return "var(--mute)";
}

/**
 * Units are credited only once the AMC allots them, so a pending order has no credit date.
 * We show the allotment date when there is one and an em-dash otherwise, rather than
 * implying money has landed when it has not.
 */
function creditLabel(o: Order) {
  return o.status === "Allotted" || o.status === "Redeemed" ? o.placedLabel : DASH;
}

export function Orders() {
  const { state, go, switchTab } = useStore();
  const { orders, loadErrors } = state;
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      All: orders.length,
      Lumpsum: 0,
      SIP: 0,
      Switches: 0,
      Redeemed: 0,
    };
    for (const o of orders) {
      for (const f of FILTERS) {
        if (f !== "All" && FILTER_KINDS[f] === o.kind) c[f]++;
      }
    }
    return c;
  }, [orders]);

  const rows = useMemo(
    () => (filter === "All" ? orders : orders.filter((o) => o.kind === FILTER_KINDS[filter])),
    [orders, filter],
  );

  const invested = useMemo(
    () => rows.filter((o) => o.kind !== "Redeem").reduce((a, o) => a + (o.amount ?? 0), 0),
    [rows],
  );

  /*
   * An empty list after a failed fetch is not the same as having no transactions. Telling
   * someone they have none when the request simply failed is worse than saying nothing loaded,
   * so the two states render differently.
   */
  const failed = !!loadErrors.orders;

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="appbar">
        <span className="display" style={{ fontSize: 24 }}>
          Transactions
        </span>
      </div>

      {/* filters — horizontally scrollable, matching the design's arrow-paged tab strip */}
      <div className="chiprow" style={{ paddingBottom: 4 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {counts[f] > 0 && (
              <span className="mono muted" style={{ fontSize: 11, marginLeft: 6 }}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
        {failed && orders.length === 0 ? (
          <div className="card card-lg" style={{ textAlign: "center", marginTop: 24 }}>
            <div className="h-sora" style={{ fontSize: 16 }}>
              Couldn&apos;t load transactions
            </div>
            <div className="muted mt8" style={{ fontSize: 14 }}>
              {loadErrors.orders}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="card card-lg" style={{ textAlign: "center", marginTop: 24 }}>
            <div className="h-sora" style={{ fontSize: 16 }}>
              No transactions yet
            </div>
            <div className="muted mt8" style={{ fontSize: 14 }}>
              Your investments will show up here.
            </div>
            <button className="btn btn-green btn-sm mt16" onClick={() => switchTab("explore")}>
              Explore funds
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="card card-lg" style={{ textAlign: "center", marginTop: 24 }}>
            <div className="h-sora" style={{ fontSize: 15 }}>
              No {filter.toLowerCase()} transactions
            </div>
            <button className="btn btn-ghost btn-sm mt16" onClick={() => setFilter("All")}>
              Show all
            </button>
          </div>
        ) : (
          <>
            <div className="lab" style={{ padding: "6px 0 10px" }}>
              {rows.length} transaction{rows.length === 1 ? "" : "s"}
              {invested > 0 && ` · ${inr(invested)} invested`}
            </div>

            <div className="col gap12">
              {rows.map((o) => (
                <button
                  key={o.id}
                  className="card"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => go("orderDetail", { orderId: o.id })}
                >
                  {/* scheme + amount */}
                  <div className="rowc gap12">
                    <span className="grow col gap4" style={{ minWidth: 0 }}>
                      <span
                        className="h-sora"
                        style={{
                          fontSize: 14,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {o.fundName}
                      </span>
                      <span className="rowc gap8">
                        <span className="tag">{o.kind}</span>
                        <span className="mono muted" style={{ fontSize: 12 }}>
                          {o.placedLabel}
                        </span>
                      </span>
                    </span>
                    <span className="col gap4" style={{ alignItems: "flex-end" }}>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>
                        {o.kind === "Redeem" ? "−" : ""}
                        {inrOr(o.amount)}
                      </span>
                      <span className="rowc gap4">
                        <span className={`dot ${statusClass(o.status)}`} />
                        <span
                          className="lab"
                          style={{ letterSpacing: "0.1em", color: statusColor(o.status) }}
                        >
                          {o.status}
                        </span>
                      </span>
                    </span>
                  </div>

                  <div className="hr" style={{ margin: "12px 0" }} />

                  {/* the remaining table columns, re-flowed for a narrow screen */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      rowGap: 10,
                      columnGap: 12,
                    }}
                  >
                    <div className="col gap4">
                      <span className="lab">Units</span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        {unitsOr(o.units)}
                      </span>
                    </div>
                    <div className="col gap4">
                      <span className="lab">NAV</span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        {navOr(o.nav)}
                      </span>
                    </div>
                    <div className="col gap4">
                      <span className="lab">Folio no</span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        {o.folio ?? DASH}
                      </span>
                    </div>
                    <div className="col gap4">
                      <span className="lab">Credit date</span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        {creditLabel(o)}
                      </span>
                    </div>
                  </div>

                  {o.statusRemark && (
                    <div className="muted mt8" style={{ fontSize: 12 }}>
                      {o.statusRemark}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="lab" style={{ padding: "14px 0 0", textAlign: "center" }}>
              Units are credited once the AMC allots them
            </div>
          </>
        )}
      </div>
    </div>
  );
}
