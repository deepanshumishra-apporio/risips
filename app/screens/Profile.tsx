"use client";

import { useStore, portfolioTotals } from "../lib/store";
import { Mark } from "../components/Mark";
import { ChevronLeft, ChevronRight, ShieldCheck } from "../components/icons";
import { inr } from "../lib/format";

function maskPan(pan: string) {
  return pan.length === 10 ? `${pan.slice(0, 3)}••••${pan.slice(-2)}` : pan;
}

export function Profile() {
  const { state, back, switchTab, go, logout } = useStore();
  const { user, holdings, sips } = state;
  const t = portfolioTotals(holdings);

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "PAN", value: maskPan(user.pan), mono: true },
    { label: "Mobile", value: `+91 ${user.phone}`, mono: true },
    { label: "Email", value: user.email ?? "—" },
    { label: "Date of birth", value: user.dob ?? "—", mono: true },
    { label: "Bank account", value: user.bank, mono: true },
  ];

  const kyc: { label: string; value: string }[] = [
    { label: "Address", value: user.address ?? "—" },
    { label: "Occupation", value: user.occupation ?? "—" },
    { label: "Annual income", value: user.income ?? "—" },
    {
      label: "Nominee",
      value: user.nomineeName
        ? `${user.nomineeName}${user.nomineeRelation && user.nomineeRelation !== "—" ? ` · ${user.nomineeRelation}` : ""}`
        : "Not added",
    },
  ];

  const checks: { label: string; ok: boolean }[] = [
    { label: "KYC (CVL KRA)", ok: user.kycVerified },
    { label: "Bank linked", ok: !!user.bank },
    { label: "Signature", ok: !!user.signatureDone },
    { label: "Face verified", ok: !!user.faceVerified },
    { label: "Biometric lock", ok: !!user.biometricEnabled },
  ];

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <span className="h-sora" style={{ fontSize: 16 }}>
          Profile
        </span>
      </div>

      <div className="scroll pad" style={{ paddingBottom: 24 }}>
        {/* identity card */}
        <div className="col" style={{ alignItems: "center", textAlign: "center", gap: 4 }}>
          <span
            className="amc"
            style={{ width: 72, height: 72, fontSize: 26, fontFamily: "var(--font-sora)" }}
          >
            {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </span>
          <div className="display" style={{ fontSize: 22, marginTop: 12 }}>
            {user.name}
          </div>
          {user.kycVerified && (
            <div
              className="rowc gap4 green"
              style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}
            >
              <ShieldCheck size={15} /> KYC verified · CVL KRA
            </div>
          )}
        </div>

        {/* mini portfolio summary */}
        <div className="stats mt24">
          <div className="cell">
            <span className="lab">Invested</span>
            <div className="v mono">{inr(t.invested)}</div>
          </div>
          <div className="cell">
            <span className="lab">Current value</span>
            <div className="v mono">{inr(t.current)}</div>
          </div>
        </div>

        {/* details */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Account
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

        {/* KYC details */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          KYC details
        </div>
        <div className="card divide" style={{ padding: "0 16px" }}>
          {kyc.map((r) => (
            <div key={r.label} className="row between" style={{ alignItems: "flex-start" }}>
              <span className="muted" style={{ fontSize: 14, flex: "0 0 auto" }}>
                {r.label}
              </span>
              <span
                style={{ fontSize: 14, textAlign: "right", maxWidth: "62%" }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {/* verification status */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Verification
        </div>
        <div className="card card-lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {checks.map((c) => (
              <div key={c.label} className="rowc gap8">
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flex: "0 0 auto",
                    background: c.ok ? "var(--green)" : "var(--line)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {c.ok && <ShieldCheck size={12} />}
                </span>
                <span style={{ fontSize: 13 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="lab" style={{ padding: "22px 0 10px" }}>
          Manage
        </div>
        <div className="card divide" style={{ padding: "0 16px" }}>
          <button className="row between" style={{ width: "100%" }} onClick={() => go("wallet")}>
            <span style={{ fontSize: 14 }}>risips Balance</span>
            <span className="rowc gap8 muted">
              <span className="mono" style={{ fontSize: 13, color: "var(--ink)" }}>
                {inr(state.wallet)}
              </span>
              <ChevronRight size={18} />
            </span>
          </button>
          <button className="row between" style={{ width: "100%" }} onClick={() => go("sips")}>
            <span style={{ fontSize: 14 }}>My SIPs</span>
            <span className="rowc gap8 muted">
              <span className="mono" style={{ fontSize: 13 }}>
                {sips.length}
              </span>
              <ChevronRight size={18} />
            </span>
          </button>
          <button className="row between" style={{ width: "100%" }} onClick={() => go("wishlist")}>
            <span style={{ fontSize: 14 }}>Watchlists</span>
            <span className="rowc gap8 muted">
              <span className="mono" style={{ fontSize: 13 }}>
                {state.watchlists.length}
              </span>
              <ChevronRight size={18} />
            </span>
          </button>
          <button
            className="row between"
            style={{ width: "100%" }}
            onClick={() => switchTab("orders")}
          >
            <span style={{ fontSize: 14 }}>Order history</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          className="btn btn-ghost btn-block mt24"
          onClick={() => void logout()}
        >
          Log out
        </button>

        <div
          className="col"
          style={{ alignItems: "center", gap: 8, marginTop: 28 }}
        >
          <Mark size={20} />
          <div className="lab" style={{ letterSpacing: "0.12em" }}>
            risips · an Arthasuta platform
          </div>
        </div>
      </div>
    </div>
  );
}
