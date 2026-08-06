"use client";

import { fundByIsin, primaryBank, useStore } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { CheckIcon, ChevronLeft, ChevronRight } from "../components/icons";
import { bankLabel, inrOr, navOr, unitsOr, textOr, DASH } from "../lib/format";
import type { Order } from "../lib/types";

type StepState = "done" | "active" | "todo";

function Step({
  state,
  title,
  sub,
  last,
}: {
  state: StepState;
  title: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      {/* rail */}
      <div className="col" style={{ alignItems: "center" }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
            background:
              state === "done"
                ? "var(--green)"
                : state === "active"
                ? "var(--paper)"
                : "var(--paper)",
            border:
              state === "done"
                ? "none"
                : state === "active"
                ? "2px solid var(--green)"
                : "2px solid var(--line)",
            color: "#fff",
          }}
        >
          {state === "done" ? (
            <CheckIcon size={15} />
          ) : state === "active" ? (
            <span
              className="dot pending"
              style={{ width: 9, height: 9, background: "var(--green)" }}
            />
          ) : (
            <span
              style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--line)" }}
            />
          )}
        </span>
        {!last && (
          <span
            style={{
              width: 2,
              flex: 1,
              minHeight: 26,
              background: state === "done" ? "var(--green)" : "var(--line)",
              opacity: state === "done" ? 0.45 : 1,
            }}
          />
        )}
      </div>
      {/* label */}
      <div className="col gap4" style={{ paddingBottom: last ? 0 : 18 }}>
        <span
          className="h-sora"
          style={{
            fontSize: 14,
            color: state === "todo" ? "var(--mute)" : "var(--ink)",
          }}
        >
          {title}
        </span>
        {sub && (
          <span className="muted" style={{ fontSize: 12.5 }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function buyTimeline(o: Order) {
  const allotted = o.status === "Allotted";
  return (
    <>
      <Step state="done" title="Order placed" sub={o.placedLabel} />
      {/* No sub-label: nothing upstream tells us which account settled this order, and
          naming one would be a guess. See the "Paid via" row. */}
      <Step state="done" title="Payment successful" />
      <Step
        state={allotted ? "done" : "active"}
        title={allotted ? "Units allotted" : "Units being allotted"}
        sub={
          allotted
            ? `${unitsOr(o.units)} units credited`
            : "In 1–2 working days at today's NAV"
        }
        last
      />
    </>
  );
}

function redeemTimeline(o: Order, bankName: string | null) {
  const done = o.status === "Redeemed" || o.status === "Allotted";
  return (
    <>
      <Step state="done" title="Redemption placed" sub={o.placedLabel} />
      <Step state="done" title="Units sold" sub={`${unitsOr(o.units)} units at today's NAV`} />
      <Step
        state={done ? "done" : "active"}
        title={done ? "Amount credited" : "Payout in progress"}
        sub={
          bankName
            ? `To ${bankName} · by T+3 working days`
            : "By T+3 working days"
        }
        last
      />
    </>
  );
}

export function OrderDetail() {
  const { route, back, go, state } = useStore();
  const orderId = route.params?.orderId as string;
  const order = state.orders.find((o) => o.id === orderId);

  if (!order) return null;
  const fund = fundByIsin(order.isin);
  const isRedeem = order.kind === "Redeem";
  const bank = primaryBank(state);
  const statusColor =
    order.status === "Pending"
      ? "#a06f22"
      : order.status === "Allotted"
      ? "var(--green)"
      : "var(--mute)";

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Order ID", value: order.id, mono: true },
    { label: "Order type", value: order.kind },
    { label: isRedeem ? "Redeemed amount" : "Amount", value: inrOr(order.amount), mono: true },
    { label: "Units", value: unitsOr(order.units), mono: true },
    { label: "NAV", value: navOr(fund?.nav), mono: true },
    // The real folio from upstream. It is null until units are allotted — show that rather
    // than a number derived from the ISIN, which looked authoritative and matched nothing.
    { label: "Folio no.", value: textOr(order.folio), mono: true },
    { label: "Placed on", value: order.placedLabel },
    {
      label: isRedeem ? "Credit to" : "Paid via",
      // Redemptions land in the registered bank. For a purchase, upstream returns no
      // payment method on the order, so there is nothing true to show — see /api/payments.
      value: isRedeem ? bankLabel(bank) : DASH,
      mono: true,
    },
  ];

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          Order details
        </span>
      </div>

      <div className="scroll pad" style={{ paddingBottom: 24 }}>
        {/* status banner */}
        <div className="card card-lg">
          <div className="between">
            <div className="col gap4">
              <span className="lab">Status</span>
              <span className="rowc gap8">
                <span
                  className={`dot ${
                    order.status === "Pending"
                      ? "pending"
                      : order.status === "Allotted"
                      ? "allotted"
                      : "redeemed"
                  }`}
                />
                <span
                  className="h-sora"
                  style={{ fontSize: 18, color: statusColor }}
                >
                  {isRedeem && order.status === "Allotted"
                    ? "Redeemed"
                    : order.status}
                </span>
              </span>
            </div>
            <div className="col gap4" style={{ alignItems: "flex-end" }}>
              <span className="lab">{isRedeem ? "Amount" : "Invested"}</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 500 }}>
                {isRedeem ? "−" : ""}
                {inrOr(order.amount)}
              </span>
            </div>
          </div>
          {order.status === "Pending" && (
            <div
              className="mt16"
              style={{
                background: "var(--line-soft)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {isRedeem
                ? "Money will reach your bank by T+3 working days."
                : "Units will be allotted in 1–2 working days at today's NAV."}
            </div>
          )}
        </div>

        {/* fund card → detail */}
        {fund && (
          <button
            className="card mt16 rowc gap12"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => go("fund", { isin: fund.isin })}
          >
            <AmcLogo fund={fund} size={40} />
            <span className="grow col gap4" style={{ minWidth: 0 }}>
              <span
                className="h-sora"
                style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {fund.name}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                {fund.category} · {fund.amc}
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        )}

        {/* timeline */}
        <div className="lab" style={{ padding: "22px 0 12px" }}>
          Tracking
        </div>
        <div className="card card-lg">
          {isRedeem
            ? redeemTimeline(order, bank ? bankLabel(bank) : null)
            : buyTimeline(order)}
        </div>

        {order.kind === "SIP" && (
          <div className="muted mt16" style={{ fontSize: 13, lineHeight: 1.5 }}>
            This is the first instalment of a monthly SIP. Manage it anytime from{" "}
            <b style={{ color: "var(--ink)" }}>Portfolio → My SIPs</b>.
          </div>
        )}

        {/* order summary */}
        <div className="lab" style={{ padding: "22px 0 12px" }}>
          Order summary
        </div>
        <div className="card divide" style={{ padding: "0 16px" }}>
          {rows.map((r) => (
            <div key={r.label} className="row between">
              <span className="muted" style={{ fontSize: 14 }}>
                {r.label}
              </span>
              <span className={r.mono ? "mono" : ""} style={{ fontSize: 14 }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>

        <div className="lab" style={{ marginTop: 18, lineHeight: 1.7 }}>
          Need help with this order? Contact support@risips.in
        </div>
      </div>

      {fund && !isRedeem && (
        <div className="sticky-cta">
          <button
            className="btn btn-green btn-block"
            onClick={() => go("fund", { isin: fund.isin })}
          >
            Invest again
          </button>
        </div>
      )}
    </div>
  );
}
