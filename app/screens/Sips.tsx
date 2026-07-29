"use client";

import { useState } from "react";
import { fundByIsin, useStore } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { ChevronLeft } from "../components/icons";
import { inr } from "../lib/format";

export function Sips() {
  const { state, back, switchTab, cancelSip, toast } = useStore();
  const { sips } = state;
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          My SIPs
        </span>
      </div>

      <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
        {sips.length === 0 ? (
          <div className="card card-lg" style={{ textAlign: "center", marginTop: 24 }}>
            <div className="h-sora" style={{ fontSize: 16 }}>
              No active SIPs
            </div>
            <div className="muted mt8" style={{ fontSize: 14 }}>
              Automate your investing — start from any fund.
            </div>
            <button className="btn btn-green btn-sm mt16" onClick={() => switchTab("explore")}>
              Explore funds
            </button>
          </div>
        ) : (
          <>
            <div className="lab" style={{ padding: "10px 0" }}>
              {sips.filter((s) => s.status === "Active").length} active ·{" "}
              {inr(sips.filter((s) => s.status === "Active").reduce((a, s) => a + s.amount, 0))}
              /month
            </div>
            <div className="col gap12">
              {sips.map((s) => {
                const f = fundByIsin(s.isin)!;
                const paused = s.status === "Paused";
                return (
                  <div key={s.id} className="card">
                    <div className="rowc gap12">
                      <AmcLogo fund={f} size={36} />
                      <div className="grow col gap4" style={{ minWidth: 0 }}>
                        <span
                          className="h-sora"
                          style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {s.fundName}
                        </span>
                        <span className="mono muted" style={{ fontSize: 12 }}>
                          {paused ? "Paused" : `Next debit ${s.nextLabel}`}
                        </span>
                      </div>
                      <div className="col gap4" style={{ alignItems: "flex-end" }}>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>
                          {inr(s.amount)}
                        </span>
                        <span className="lab">per month</span>
                      </div>
                    </div>

                    <div className="hr" style={{ margin: "12px 0" }} />
                    {/* Tarrakki exposes cancellation for systematic orders but no
                        pause/resume, so only cancel is offered. */}
                    <div className="rowc gap8">
                      <button
                        className="chip chip-sm grow"
                        style={{
                          justifyContent: "center",
                          color: "var(--red)",
                          borderColor: "var(--line)",
                        }}
                        disabled={busy === s.id}
                        onClick={async () => {
                          setBusy(s.id);
                          try {
                            await cancelSip(s.id);
                            toast("SIP cancelled");
                          } catch (e) {
                            toast(e instanceof Error ? e.message : "Couldn't cancel the SIP.");
                          } finally {
                            setBusy(null);
                          }
                        }}
                      >
                        {busy === s.id ? "Cancelling…" : "Cancel SIP"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
