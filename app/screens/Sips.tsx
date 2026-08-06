"use client";

import { useMemo, useState } from "react";
import { fundByIsin, useStore } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { ChevronLeft } from "../components/icons";
import { inr } from "../lib/format";
import type { SIP } from "../lib/types";

type SipFilter = "All" | "Active" | "Paused" | "Cancelled";
const SIP_FILTERS: SipFilter[] = ["All", "Active", "Paused", "Cancelled"];

export function Sips() {
  const { state, back, switchTab, cancelSip, toast } = useStore();
  const { sips } = state;
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<SipFilter>("All");

  const counts = useMemo(() => {
    const c: Record<SipFilter, number> = { All: sips.length, Active: 0, Paused: 0, Cancelled: 0 };
    for (const s of sips) c[s.status as Exclude<SipFilter, "All">]++;
    return c;
  }, [sips]);

  const rows: SIP[] = useMemo(
    () => (filter === "All" ? sips : sips.filter((s) => s.status === filter)),
    [sips, filter],
  );

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

      {sips.length > 0 && (
        <div className="chiprow" style={{ paddingBottom: 4 }}>
          {SIP_FILTERS.map((f) => (
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
      )}

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
            {rows.length === 0 && (
              <div className="card card-lg" style={{ textAlign: "center" }}>
                <div className="h-sora" style={{ fontSize: 15 }}>
                  No {filter.toLowerCase()} SIPs
                </div>
                <button className="btn btn-ghost btn-sm mt16" onClick={() => setFilter("All")}>
                  Show all
                </button>
              </div>
            )}
            <div className="col gap12">
              {rows.map((s) => {
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

                    {/* A cancelled SIP has nothing left to act on, so the button is dropped
                        rather than shown disabled. */}
                    {s.status !== "Cancelled" && (
                      <>
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
                      </>
                    )}
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
