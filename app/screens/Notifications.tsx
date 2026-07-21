"use client";

import { useEffect } from "react";
import { useStore } from "../lib/store";
import { ChevronLeft, OrdersIcon, PortfolioIcon, ShieldCheck, BellIcon } from "../components/icons";
import type { AppNotification } from "../lib/types";
import { inr } from "../lib/format";

function buildNotifications(
  pendingCount: number,
  sips: { amount: number; day: number; fundName: string }[]
): AppNotification[] {
  const list: AppNotification[] = [];

  if (pendingCount > 0) {
    list.push({
      id: "n-pending",
      kind: "order",
      title: "Order being processed",
      body: `${pendingCount} order${pendingCount > 1 ? "s" : ""} placed — units will be allotted in 1–2 working days.`,
      when: "Just now",
    });
  }

  list.push({
    id: "n-allot",
    kind: "order",
    title: "Units allotted",
    body: "Your ICICI Prudential Bluechip order has been allotted at today's NAV.",
    when: "2h ago",
  });

  if (sips[0]) {
    list.push({
      id: "n-sip",
      kind: "sip",
      title: "Upcoming SIP",
      body: `Your ${inr(sips[0].amount)} SIP in ${sips[0].fundName} is due on the ${sips[0].day}th.`,
      when: "Yesterday",
    });
  }

  list.push(
    {
      id: "n-nav",
      kind: "nav",
      title: "Markets closed higher",
      body: "Nifty 50 ended +0.58% today. NAVs updated for all your holdings.",
      when: "Yesterday",
    },
    {
      id: "n-kyc",
      kind: "info",
      title: "KYC verified",
      body: "Your KYC is verified via CVL KRA. You're all set to invest.",
      when: "3 days ago",
    }
  );

  return list;
}

function Glyph({ kind }: { kind: AppNotification["kind"] }) {
  const Icon =
    kind === "order"
      ? OrdersIcon
      : kind === "sip"
      ? PortfolioIcon
      : kind === "nav"
      ? BellIcon
      : ShieldCheck;
  return (
    <span className="amc" style={{ width: 40, height: 40, borderColor: "var(--line)" }}>
      <Icon size={19} />
    </span>
  );
}

export function Notifications() {
  const { back, state, markNotificationsSeen } = useStore();

  useEffect(() => {
    markNotificationsSeen();
  }, [markNotificationsSeen]);

  const pending = state.orders.filter((o) => o.status === "Pending").length;
  const items = buildNotifications(
    pending,
    state.sips
      .filter((s) => s.status === "Active")
      .map((s) => ({ amount: s.amount, day: s.day, fundName: s.fundName }))
  );

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          Notifications
        </span>
      </div>

      <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
        <div className="col gap12" style={{ paddingTop: 6 }}>
          {items.map((n) => (
            <div key={n.id} className="card rowc gap12" style={{ alignItems: "flex-start" }}>
              <Glyph kind={n.kind} />
              <div className="grow col gap4">
                <div className="between">
                  <span className="h-sora" style={{ fontSize: 14 }}>
                    {n.title}
                  </span>
                  <span className="lab" style={{ letterSpacing: "0.04em" }}>
                    {n.when}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                  {n.body}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="muted" style={{ textAlign: "center", fontSize: 12, padding: "22px 0" }}>
          That&apos;s everything from the last 7 days.
        </div>
      </div>
    </div>
  );
}
