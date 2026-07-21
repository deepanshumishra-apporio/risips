"use client";

import { useMemo, useState } from "react";
import { FUNDS, fundByIsin, useStore, portfolioTotals } from "../lib/store";
import { Mark } from "../components/Mark";
import { FundCard, FundRow } from "../components/ui";
import { Sparkline } from "../components/Sparkline";
import { CartButton } from "../components/CartButton";
import { inr, pct } from "../lib/format";
import {
  BellIcon,
  ChevronRight,
  ExploreIcon,
  PortfolioIcon,
  HeartIcon,
  WalletIcon,
  UserIcon,
  LogOutIcon,
  ShieldCheck,
} from "../components/icons";

const COLLECTIONS = [
  { label: "Tax saver ELSS", tag: "Tax saver ELSS" },
  { label: "Index funds", tag: "Index funds" },
  { label: "High growth", tag: "High growth" },
  { label: "Low risk", tag: "Low risk" },
];

const MARKETS = [
  { name: "NIFTY 50", value: "24,812.05", change: 0.58 },
  { name: "SENSEX", value: "81,220.40", change: 0.61 },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const { state, go, switchTab } = useStore();
  const { holdings, user } = state;
  const totals = portfolioTotals(holdings);
  const invested = holdings.length > 0;
  const popular = FUNDS.filter((f) => f.tags.includes("Popular"));
  const [menu, setMenu] = useState(false);

  const watchedIsins = Array.from(
    new Set(state.watchlists.flatMap((w) => w.isins))
  );
  const watched = watchedIsins
    .map((isin) => fundByIsin(isin))
    .filter(Boolean)
    .slice(0, 4) as NonNullable<ReturnType<typeof fundByIsin>>[];

  // real portfolio value history (units × NAV history) for the sparkline
  const series = useMemo(() => {
    const len = 12;
    const pts = new Array(len).fill(0);
    for (const h of holdings) {
      const f = fundByIsin(h.isin);
      if (!f) continue;
      const tail = f.chart.slice(-len);
      const scale = h.current / (h.units * tail[tail.length - 1]);
      for (let i = 0; i < len; i++) pts[i] += h.units * tail[i] * scale;
    }
    return pts;
  }, [holdings]);

  // today's move across the portfolio
  const todayChange = useMemo(
    () =>
      holdings.reduce((s, h) => {
        const f = fundByIsin(h.isin);
        return s + (f ? (h.current * f.navChange) / 100 : 0);
      }, 0),
    [holdings]
  );
  const todayPct = totals.current > 0 ? (todayChange / totals.current) * 100 : 0;
  const dayUp = todayChange >= 0;
  const totalUp = totals.gain >= 0;

  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  const quick = [
    { label: "Invest", Icon: ExploreIcon, go: () => switchTab("explore") },
    { label: "My SIPs", Icon: PortfolioIcon, go: () => go("sips") },
    { label: "Watchlists", Icon: HeartIcon, go: () => go("wishlist") },
    { label: "Wallet", Icon: WalletIcon, go: () => go("wallet") },
  ];

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="appbar">
        <div className="col gap4">
          <span className="muted" style={{ fontSize: 12.5 }}>
            {greeting()}, {user.name.split(" ")[0]}
          </span>
          <div className="rowc gap8">
            <Mark size={22} />
            <span className="wordmark" style={{ fontSize: 21 }}>
              risips
            </span>
          </div>
        </div>
        <div className="rowc gap8">
          <CartButton />
          <button
            className="iconbtn noti-wrap"
            onClick={() => go("notifications")}
            aria-label="Notifications"
          >
            <BellIcon size={22} />
            {!state.notificationsSeen && <span className="noti-dot" />}
          </button>
          <button
            className="amc"
            style={{ width: 36, height: 36, fontSize: 13 }}
            onClick={() => setMenu((m) => !m)}
            aria-label="Account menu"
          >
            {initials}
          </button>
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 20 }}>
        {/* compact portfolio summary — light, glanceable (distinct from Portfolio's dark hero) */}
        {invested ? (
          <div className="pad-x">
            <button
              className="card card-lg"
              style={{ width: "100%", textAlign: "left" }}
              onClick={() => switchTab("portfolio")}
            >
              <div className="between">
                <span className="lab">Portfolio value</span>
                <span className="rowc gap4 muted" style={{ fontSize: 12 }}>
                  View all <ChevronRight size={15} />
                </span>
              </div>
              <div className="between" style={{ alignItems: "flex-end", marginTop: 8 }}>
                <div className="col gap4">
                  <span className="num-hero" style={{ fontSize: 28 }}>
                    {inr(totals.current)}
                  </span>
                  <span
                    className={`mono ${dayUp ? "green" : "red"}`}
                    style={{ fontSize: 12.5, fontWeight: 500 }}
                  >
                    {dayUp ? "+" : ""}
                    {inr(todayChange)} ({pct(todayPct)}) today
                  </span>
                </div>
                <Sparkline
                  values={series}
                  color={totalUp ? "var(--green)" : "var(--red)"}
                  width={96}
                  height={44}
                />
              </div>
              <div className="hr" style={{ margin: "14px 0 12px" }} />
              <div className="between">
                <span className="muted" style={{ fontSize: 12.5 }}>
                  Invested{" "}
                  <span className="mono" style={{ color: "var(--ink)" }}>
                    {inr(totals.invested)}
                  </span>
                </span>
                <span
                  className={`mono ${totalUp ? "green" : "red"}`}
                  style={{ fontSize: 12.5, fontWeight: 500 }}
                >
                  {totalUp ? "+" : ""}
                  {inr(totals.gain)} · {pct(totals.returnPct)}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="pad-x">
            <div className="card card-lg">
              <div className="h-sora" style={{ fontSize: 17 }}>
                Start investing today
              </div>
              <div className="muted mt8" style={{ fontSize: 14 }}>
                Pick a fund and begin with as little as ₹500.
              </div>
              <button
                className="btn btn-green btn-sm mt16"
                onClick={() => switchTab("explore")}
              >
                Explore funds
              </button>
            </div>
          </div>
        )}

        {/* wallet balance strip */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <button
            className="card rowc gap12"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => go("wallet")}
          >
            <span
              className="amc"
              style={{ width: 40, height: 40, borderColor: "var(--line)" }}
            >
              <WalletIcon size={20} />
            </span>
            <span className="grow col gap4">
              <span className="lab">risips Balance</span>
              <span className="mono" style={{ fontSize: 16, fontWeight: 500 }}>
                {inr(state.wallet)}
              </span>
            </span>
            <span className="chip chip-sm" style={{ pointerEvents: "none" }}>
              Add money
            </span>
          </button>
        </div>

        {/* quick actions — makes Home a launcher, not a portfolio clone */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <div className="quick">
            {quick.map((q) => (
              <button key={q.label} className="quick-tile" onClick={q.go}>
                <span className="qi">
                  <q.Icon size={18} />
                </span>
                <span className="ql">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* market snapshot */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <div className="stats">
            {MARKETS.map((m) => (
              <div className="cell" key={m.name}>
                <div className="between">
                  <span className="lab">{m.name}</span>
                  <span className="mono green" style={{ fontSize: 11.5, fontWeight: 500 }}>
                    {pct(m.change)}
                  </span>
                </div>
                <div className="v mono" style={{ fontSize: 15 }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* popular funds */}
        <div className="section-h">
          <h2>Popular funds</h2>
          <button className="lab" onClick={() => switchTab("explore")}>
            See all
          </button>
        </div>
        <div className="hscroll">
          {popular.map((f) => (
            <FundCard key={f.isin} fund={f} />
          ))}
        </div>

        {/* watchlist */}
        {watched.length > 0 && (
          <>
            <div className="section-h">
              <h2>Your watchlists</h2>
              <button className="lab" onClick={() => go("wishlist")}>
                Manage
              </button>
            </div>
            <div className="pad-x">
              <div className="card divide" style={{ padding: "0 16px" }}>
                {watched.map((f) => (
                  <FundRow key={f.isin} fund={f} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* collections */}
        <div className="section-h">
          <h2>Collections</h2>
        </div>
        <div className="chiprow">
          {COLLECTIONS.map((c) => (
            <button
              key={c.tag}
              className="chip"
              onClick={() => go("explore", { collection: c.tag })}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* all funds quick list */}
        <div className="section-h">
          <h2>All funds</h2>
          <button className="lab" onClick={() => switchTab("explore")}>
            See all
          </button>
        </div>
        <div className="pad-x">
          <div className="card divide" style={{ padding: "0 16px" }}>
            {FUNDS.slice(0, 5).map((f) => (
              <FundRow key={f.isin} fund={f} />
            ))}
          </div>
        </div>
      </div>

      {/* profile dropdown */}
      {menu && (
        <>
          <div className="menu-scrim" onClick={() => setMenu(false)} />
          <div className="menu">
            <div className="menu-head">
              <span className="amc" style={{ width: 40, height: 40, fontSize: 14 }}>
                {initials}
              </span>
              <div className="col gap4" style={{ minWidth: 0 }}>
                <span className="h-sora" style={{ fontSize: 14 }}>
                  {user.name}
                </span>
                <span className="green rowc gap4" style={{ fontSize: 11.5 }}>
                  <ShieldCheck size={12} /> KYC verified
                </span>
              </div>
            </div>
            <button
              className="menu-item"
              onClick={() => {
                setMenu(false);
                go("profile");
              }}
            >
              <UserIcon size={18} /> View profile
            </button>
            <button
              className="menu-item"
              onClick={() => {
                setMenu(false);
                go("sips");
              }}
            >
              <PortfolioIcon size={18} /> My SIPs
            </button>
            <button
              className="menu-item danger"
              onClick={() => {
                setMenu(false);
                switchTab("splash");
              }}
            >
              <LogOutIcon size={18} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
