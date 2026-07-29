"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { Wordmark } from "../components/Mark";
import { Spinner } from "../components/ui";
import { ChevronLeft, ShieldCheck } from "../components/icons";

// Real login against the backend: mobile → 6-digit OTP → (first time) link the Tarrakki
// investor by PAN. The old screen accepted "any 4 digits" and logged into a seeded user.

type Phase = "phone" | "otp" | "pan";

const OTP_LEN = 6;
const RESEND_SECONDS = 30;

export function Login() {
  const { back, switchTab, requestOtp, verifyOtp, linkInvestor, state, toast } = useStore();

  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [pan, setPan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const digitsOnly = phone.replace(/\D/g, "");
  const phoneValid = /^[6-9]\d{9}$/.test(digitsOnly);
  const panValid = /^[A-Z]{5}\d{4}[A-Z]$/.test(pan.toUpperCase());

  async function sendOtp() {
    if (!phoneValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { devCode } = await requestOtp(digitsOnly);
      setDevCode(devCode ?? null);
      setDigits(Array(OTP_LEN).fill(""));
      setPhase("otp");
      setCooldown(RESEND_SECONDS);
      setTimeout(() => refs.current[0]?.focus(), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(code: string) {
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(digitsOnly, code);
      // A user with no linked investor still needs their PAN before they can transact.
      setPhase("pan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't verify the code.");
      setDigits(Array(OTP_LEN).fill(""));
      refs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  // Once the session resolves, skip the PAN step for an already-linked investor.
  useEffect(() => {
    if (phase === "pan" && state.onboarded) {
      switchTab("home");
    }
  }, [phase, state.onboarded, switchTab]);

  function setAt(i: number, v: string) {
    // `v` can carry more than one digit: SMS autofill drops the whole code into the first
    // box, and fast typing can outrun the focus advance. Spread it across the boxes.
    const incoming = v.replace(/\D/g, "");
    if (!incoming) {
      const nx = [...digits];
      nx[i] = "";
      setDigits(nx);
      return;
    }

    const nx = [...digits];
    let cursor = i;
    for (const ch of incoming) {
      if (cursor >= OTP_LEN) break;
      nx[cursor] = ch;
      cursor++;
    }
    setDigits(nx);

    const next = Math.min(cursor, OTP_LEN - 1);
    refs.current[next]?.focus();
    if (nx.every(Boolean)) void submitOtp(nx.join(""));
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (text.length < OTP_LEN) return;
    e.preventDefault();
    const nx = text.split("");
    setDigits(nx);
    void submitOtp(text);
  }

  async function submitPan() {
    if (!panValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await linkInvestor(pan.toUpperCase());
      toast("Account linked");
      switchTab("home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't link that PAN.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button
          className="iconbtn"
          onClick={() => (phase === "phone" ? back() : setPhase("phone"))}
        >
          <ChevronLeft size={22} />
        </button>
        <Wordmark size={16} />
      </div>

      {/* PHONE */}
      {phase === "phone" && (
        <>
          <div className="scroll pad">
            <div className="display" style={{ fontSize: 26, marginTop: 8 }}>
              Log in with OTP
            </div>
            <div className="muted mt8">Enter your registered mobile number.</div>
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
                onKeyDown={(e) => e.key === "Enter" && void sendOtp()}
              />
            </div>

            {error && (
              <div className="red mt12" style={{ fontSize: 13 }}>
                {error}
              </div>
            )}

            <div
              className="rowc gap8 mt24"
              style={{ justifyContent: "center", color: "var(--mute)", fontSize: 12 }}
            >
              <ShieldCheck size={14} /> Secured · SEBI-registered platform
            </div>
          </div>
          <div className="sticky-cta" style={{ borderTop: "none" }}>
            <button
              className="btn btn-ink btn-block"
              disabled={!phoneValid || busy}
              onClick={() => void sendOtp()}
            >
              {busy ? <Spinner /> : "Send OTP"}
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
          <div className="muted mt8">Enter the {OTP_LEN}-digit code sent to +91 {phone}.</div>

          {devCode && (
            // Development convenience: with no SMS provider configured the backend returns
            // the code so the flow is testable. It is never returned in production.
            <div className="card mt12" style={{ padding: "10px 14px" }}>
              <span className="lab">Dev code</span>{" "}
              <span className="mono" style={{ fontSize: 15, letterSpacing: "0.15em" }}>
                {devCode}
              </span>
            </div>
          )}

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
                onPaste={onPaste}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>

          {error && (
            <div className="red mt16" style={{ fontSize: 13, textAlign: "center" }}>
              {error}
            </div>
          )}

          <div className="rowc gap8 mt24" style={{ justifyContent: "center", minHeight: 24 }}>
            {busy ? (
              <>
                <Spinner dark /> <span className="muted">Logging in…</span>
              </>
            ) : cooldown > 0 ? (
              <span className="muted" style={{ fontSize: 13 }}>
                Resend code in 0:{String(cooldown).padStart(2, "0")}
              </span>
            ) : (
              <button className="lab" onClick={() => void sendOtp()}>
                Resend code
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAN — link the Tarrakki investor */}
      {phase === "pan" && (
        <>
          <div className="scroll pad">
            <div className="display" style={{ fontSize: 26, marginTop: 8 }}>
              Link your PAN
            </div>
            <div className="muted mt8">
              We&apos;ll fetch your investor profile and KYC status against this PAN.
            </div>
            <div className="prefix-field" style={{ marginTop: 20 }}>
              <input
                autoFocus
                placeholder="ABCDE1234F"
                className="mono"
                value={pan}
                maxLength={10}
                style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && void submitPan()}
              />
            </div>

            {error && (
              <div className="red mt12" style={{ fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
          <div className="sticky-cta" style={{ borderTop: "none", flexDirection: "column", gap: 4 }}>
            <button
              className="btn btn-ink btn-block"
              disabled={!panValid || busy}
              onClick={() => void submitPan()}
            >
              {busy ? <Spinner /> : "Link account"}
            </button>
            <button
              className="btn btn-block"
              style={{ background: "transparent" }}
              onClick={() => switchTab("home")}
            >
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
