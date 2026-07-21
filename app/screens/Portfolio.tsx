"use client";

import { fundByIsin, useStore, portfolioTotals } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { inr, pct, units as fmtUnits } from "../lib/format";

export function Portfolio() {
  const { state, go, switchTab } = useStore();
  const { holdings } = state;
  const t = portfolioTotals(holdings);
  const up = t.gain >= 0;

  if (holdings.length === 0) {
    return (
      <div className="screen animate-in">
        <div className="safe-top" />
        <div className="appbar">
          <span className="display" style={{ fontSize: 24 }}>
            Portfolio
          </span>
        </div>
        <div className="grow col pad" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div className="h-sora" style={{ fontSize: 18 }}>
            Nothing invested yet
          </div>
          <div className="muted mt8" style={{ fontSize: 14, maxWidth: "26ch" }}>
            Start a SIP or a one-time investment to build your portfolio.
          </div>
          <button className="btn btn-green mt16" onClick={() => switchTab("explore")}>
            Explore funds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="appbar">
        <span className="display" style={{ fontSize: 24 }}>
          Portfolio
        </span>
        <button className="chip chip-sm" onClick={() => go("sips")}>
          My SIPs
        </button>
      </div>

      <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
        {/* hero */}
        <div className="card card-lg" style={{ background: "var(--ink)", borderColor: "var(--ink)" }}>
          <div className="between">
            <span className="lab" style={{ color: "#A9A497" }}>
              Current value
            </span>
            <span
              className="mono"
              style={{
                fontSize: 12,
                padding: "3px 8px",
                borderRadius: 6,
                background: "#232320",
                color: "var(--green-rev)",
              }}
            >
              XIRR {pct(t.xirr)}
            </span>
          </div>
          <div className="num-hero" style={{ fontSize: 36, color: "var(--paper)", marginTop: 6 }}>
            {inr(t.current)}
          </div>
          <div className="between mt16">
            <div className="col gap4">
              <span className="lab" style={{ color: "#A9A497" }}>
                Invested
              </span>
              <span className="mono" style={{ color: "var(--paper)", fontSize: 14 }}>
                {inr(t.invested)}
              </span>
            </div>
            <div className="col gap4" style={{ alignItems: "flex-end" }}>
              <span className="lab" style={{ color: "#A9A497" }}>
                Total returns
              </span>
              <span
                className="mono"
                style={{ fontSize: 14, fontWeight: 500, color: up ? "var(--green-rev)" : "#e0796b" }}
              >
                {up ? "+" : ""}
                {inr(t.gain)} · {pct(t.returnPct)}
              </span>
            </div>
          </div>
        </div>

        <div className="lab" style={{ padding: "20px 0 10px" }}>
          Holdings · {holdings.length}
        </div>

        <div className="col gap12">
          {holdings.map((h) => {
            const f = fundByIsin(h.isin)!;
            const g = h.current - h.invested;
            const gPct = (g / h.invested) * 100;
            const hUp = g >= 0;
            return (
              <div key={h.isin} className="card">
                <button
                  className="rowc gap12"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => go("fund", { isin: h.isin })}
                >
                  <AmcLogo fund={f} size={36} />
                  <span className="grow col gap4" style={{ minWidth: 0 }}>
                    <span
                      className="h-sora"
                      style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {f.name}
                    </span>
                    <span className="mono muted" style={{ fontSize: 11.5 }}>
                      Folio {h.folio}
                    </span>
                  </span>
                  <span className="col gap4" style={{ alignItems: "flex-end" }}>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>
                      {inr(h.current)}
                    </span>
                    <span className={`mono ${hUp ? "green" : "red"}`} style={{ fontSize: 12 }}>
                      {hUp ? "+" : ""}
                      {pct(gPct)}
                    </span>
                  </span>
                </button>

                <div className="hr" style={{ margin: "12px 0" }} />
                <div className="between">
                  <div className="col gap4">
                    <span className="lab">Invested · Units</span>
                    <span className="mono" style={{ fontSize: 12.5 }}>
                      {inr(h.invested)} · {fmtUnits(h.units)}
                    </span>
                  </div>
                  <button
                    className="chip chip-sm"
                    onClick={() => go("redeem", { isin: h.isin })}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
