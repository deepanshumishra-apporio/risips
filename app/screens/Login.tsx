"use client";

import { useRef, useState } from "react";
import { useStore } from "../lib/store";
import { Wordmark } from "../components/Mark";
import { Spinner } from "../components/ui";
import {
  ChevronLeft,
  FaceIdIcon,
  CheckIcon,
  ShieldCheck,
} from "../components/icons";

type Phase = "choose" | "scan" | "phone" | "otp";

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length !== 10) return `+91 ${phone}`;
  return `+91 ••••• ${d.slice(5)}`;
}

export function Login() {
  const { state, back, completeOnboarding, switchTab } = useStore();
  const { user } = state;
  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  const [phase, setPhase] = useState<Phase>("choose");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function finish() {
    completeOnboarding(); // marks the account signed-in; user is already seeded
    switchTab("home");
  }

  function scan() {
    setPhase("scan");
    setTimeout(finish, 1600);
  }

  function setAt(i: number, v: string) {
    const c = v.replace(/\D/g, "").slice(-1);
    const nx = [...digits];
    nx[i] = c;
    setDigits(nx);
    if (c && i < 3) refs.current[i + 1]?.focus();
    if (i === 3 && c && nx.every(Boolean)) {
      setBusy(true);
      setTimeout(finish, 800);
    }
  }

  const phoneValid = phone.replace(/\D/g, "").length === 10;

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={back}>
          <ChevronLeft size={22} />
        </button>
        <Wordmark size={16} />
      </div>

      {/* CHOOSE — returning user */}
      {phase === "choose" && (
        <>
          <div className="scroll pad">
            <div className="display" style={{ fontSize: 26, marginTop: 8 }}>
              Welcome back
            </div>
            <div className="muted mt8">Log in to your risips account.</div>

            <div className="card card-lg mt24 rowc gap12">
              <span className="amc" style={{ width: 48, height: 48, fontSize: 17 }}>
                {initials}
              </span>
              <div className="col gap4" style={{ minWidth: 0 }}>
                <span className="h-sora" style={{ fontSize: 15 }}>
                  {user.name}
                </span>
                <span className="mono muted" style={{ fontSize: 12.5 }}>
                  {maskPhone(user.phone)}
                </span>
              </div>
            </div>

            {user.biometricEnabled && (
              <button
                className="card mt16 rowc gap12"
                style={{ width: "100%", textAlign: "left" }}
                onClick={scan}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "var(--ink)",
                    color: "var(--paper)",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                  }}
                >
                  <FaceIdIcon size={20} />
                </span>
                <span className="grow col gap4">
                  <span className="h-sora" style={{ fontSize: 14 }}>
                    Unlock with Face ID
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    Fastest way in
                  </span>
                </span>
              </button>
            )}

            <div
              className="rowc gap8 mt24"
              style={{ justifyContent: "center", color: "var(--mute)", fontSize: 12 }}
            >
              <ShieldCheck size={14} /> Secured · SEBI-registered platform
            </div>
          </div>

          <div className="sticky-cta" style={{ borderTop: "none", flexDirection: "column", gap: 4 }}>
            {user.biometricEnabled ? (
              <button className="btn btn-ink btn-block" onClick={scan}>
                <FaceIdIcon size={18} /> Unlock with Face ID
              </button>
            ) : (
              <button
                className="btn btn-ink btn-block"
                onClick={() => setPhase("phone")}
              >
                Log in with OTP
              </button>
            )}
            <button
              className="btn btn-block"
              style={{ background: "transparent" }}
              onClick={() => {
                setPhone("");
                setPhase("phone");
              }}
            >
              {user.biometricEnabled ? "Use OTP instead" : "Use a different number"}
            </button>
          </div>
        </>
      )}

      {/* SCAN — biometric */}
      {phase === "scan" && (
        <div className="grow col pad" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div className="face-ring scan">
            <FaceIdIcon size={72} />
            <span className="face-scanline" />
          </div>
          <div className="rowc gap8 mt24">
            <Spinner dark /> <span className="muted">Authenticating…</span>
          </div>
        </div>
      )}

      {/* PHONE */}
      {phase === "phone" && (
        <>
          <div className="scroll pad">
            <div className="display" style={{ fontSize: 26, marginTop: 8 }}>
              Log in with OTP
            </div>
            <div className="muted mt8">
              Enter your registered mobile number.
            </div>
            <div className="prefix-field" style={{ marginTop: 20 }}>
              <span
                className="pf"
                style={{
                  paddingRight: 10,
                  marginRight: 12,
                  borderRight: "1px solid var(--line)",
                  color: "var(--ink)",
                }}
              >
                +91
              </span>
              <input
                autoFocus
                inputMode="numeric"
                placeholder="98765 43210"
                className="mono"
                value={phone}
                maxLength={11}
                onChange={(e) => {
                  const x = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(x.length > 5 ? `${x.slice(0, 5)} ${x.slice(5)}` : x);
                }}
                onKeyDown={(e) => e.key === "Enter" && phoneValid && setPhase("otp")}
              />
            </div>
          </div>
          <div className="sticky-cta" style={{ borderTop: "none" }}>
            <button
              className="btn btn-ink btn-block"
              disabled={!phoneValid}
              onClick={() => setPhase("otp")}
            >
              Send OTP
            </button>
          </div>
        </>
      )}

      {/* OTP */}
      {phase === "otp" && (
        <div className="scroll pad">
          <div className="display" style={{ fontSize: 26, marginTop: 8 }}>
            Verify it&apos;s you
          </div>
          <div className="muted mt8">
            Enter the code sent to +91 {phone || maskPhone(user.phone)}.{" "}
            <span className="green" style={{ fontWeight: 500 }}>
              (any 4 digits)
            </span>
          </div>
          <div className="otp" style={{ marginTop: 28 }}>
            {digits.map((dig, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                autoFocus={i === 0}
                inputMode="numeric"
                className="box mono"
                value={dig}
                disabled={busy}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0)
                    refs.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>
          <div
            className="rowc gap8 mt24"
            style={{ justifyContent: "center", minHeight: 24 }}
          >
            {busy ? (
              <>
                <Spinner dark /> <span className="muted">Logging in…</span>
              </>
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>
                Resend code in 0:24
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
