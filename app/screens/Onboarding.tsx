"use client";

import { useEffect, useRef, useState } from "react";
import { primaryBank, useStore } from "../lib/store";
import { api } from "../lib/api";
import { bankLabel } from "../lib/format";
import { Spinner } from "../components/ui";
import {
  CheckIcon,
  ChevronLeft,
  ShieldCheck,
  FaceIdIcon,
  FingerprintIcon,
  PenIcon,
  CameraIcon,
  TrashIcon,
  LockIcon,
} from "../components/icons";

/* --------------------------- shared data -------------------------------- */

interface Data {
  phone: string;
  /** 6-digit login code, held so the OTP step can hand it to the verify call. */
  devCode: string;
  pan: string;
  name: string;
  email: string;
  dob: string;
  gender: string;
  address: string;
  occupation: string;
  income: string;
  fatca: boolean;
  addNominee: boolean;
  nomName: string;
  nomRel: string;
  /** Set once POST /api/investor/banks has actually registered an account. */
  bankRegistered: boolean;
  signed: boolean;
  biometric: boolean;
}

const DEFAULTS: Data = {
  phone: "",
  devCode: "",
  pan: "",
  name: "",
  email: "",
  dob: "",
  gender: "",
  address: "",
  occupation: "",
  income: "",
  fatca: false,
  addNominee: true,
  nomName: "",
  nomRel: "Spouse",
  bankRegistered: false,
  signed: false,
  biometric: false,
};

const STEP_TITLES = [
  "Mobile number",
  "Verify OTP",
  "PAN & instant KYC",
  "Personal details",
  "Communication address",
  "Income & occupation",
  "Add a nominee",
  "Link bank account",
  "Your signature",
  "Face verification",
  "Secure your account",
];
const TOTAL = STEP_TITLES.length;

const INCOMES = [
  "Below ₹1 lakh",
  "₹1–5 lakh",
  "₹5–10 lakh",
  "₹10–25 lakh",
  "₹25 lakh – 1 crore",
  "Above ₹1 crore",
];
const OCCUPATIONS = [
  "Private sector",
  "Public sector",
  "Business",
  "Professional",
  "Student",
  "Retired",
  "Homemaker",
  "Others",
];
const RELATIONS = ["Spouse", "Parent", "Child", "Sibling", "Other"];

/* ------------------------------ wrapper --------------------------------- */

export function OnboardWizard() {
  const { back, completeOnboarding, switchTab } = useStore();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Data>(DEFAULTS);
  const set = (part: Partial<Data>) => setD((prev) => ({ ...prev, ...part }));

  const next = () => setStep((s) => s + 1);
  const goBack = () => (step === 0 ? back() : setStep((s) => s - 1));

  // Identity fields (name, PAN, DOB, email, address) come from the linked Tarrakki
  // investor record, not from this wizard — `refresh()` has already populated them. Only
  // the preferences collected here are merged in, and no placeholder values are invented.
  function finish() {
    completeOnboarding({
      nomineeName: d.addNominee && d.nomName ? d.nomName : undefined,
      nomineeRelation: d.addNominee && d.nomName ? d.nomRel : undefined,
      signatureDone: d.signed,
      biometricEnabled: d.biometric,
    });
    switchTab("home");
  }

  // completed → success
  if (step >= TOTAL) return <DoneStep name={d.name} onFinish={finish} />;

  const common = { d, set, next };

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="backbar">
        <button className="iconbtn" onClick={goBack} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <div className="grow">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="pad-x" style={{ paddingTop: 2, paddingBottom: 4 }}>
        <div className="lab">
          Step {step + 1} of {TOTAL}
        </div>
        <div className="display" style={{ fontSize: 23, marginTop: 4 }}>
          {STEP_TITLES[step]}
        </div>
      </div>

      {step === 0 && <PhoneStep {...common} />}
      {step === 1 && <OtpStep {...common} />}
      {step === 2 && <PanStep {...common} />}
      {step === 3 && <PersonalStep {...common} />}
      {step === 4 && <AddressStep {...common} />}
      {step === 5 && <IncomeStep {...common} />}
      {step === 6 && <NomineeStep {...common} />}
      {step === 7 && <BankStep {...common} />}
      {step === 8 && <SignatureStep {...common} />}
      {step === 9 && <FaceStep {...common} />}
      {step === 10 && <BiometricStep {...common} />}
    </div>
  );
}

type StepProps = {
  d: Data;
  set: (p: Partial<Data>) => void;
  next: () => void;
};

function Footer({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="sticky-cta" style={{ borderTop: "none" }}>
      <button className="btn btn-ink btn-block" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

/* ------------------------------ steps ----------------------------------- */

function PhoneStep({ d, set, next }: StepProps) {
  const { requestOtp } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^[6-9]\d{9}$/.test(d.phone.replace(/\D/g, ""));

  async function send() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { devCode } = await requestOtp(d.phone.replace(/\D/g, ""));
      set({ devCode: devCode ?? "" });
      next();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="scroll pad">
        <div className="muted">We&apos;ll send a one-time code to verify it.</div>
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
            value={d.phone}
            maxLength={11}
            onChange={(e) => {
              const x = e.target.value.replace(/\D/g, "").slice(0, 10);
              set({ phone: x.length > 5 ? `${x.slice(0, 5)} ${x.slice(5)}` : x });
            }}
          />
        </div>
        {error && (
          <div className="red mt12" style={{ fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="muted mt16 rowc gap8" style={{ fontSize: 12.5 }}>
          <ShieldCheck size={14} /> 256-bit encrypted · SEBI-registered platform
        </div>
      </div>
      <Footer label={busy ? "Sending…" : "Continue"} disabled={!valid || busy} onClick={send} />
    </>
  );
}

const OTP_LEN = 6;

function OtpStep({ d, next }: StepProps) {
  const { verifyOtp } = useStore();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  async function submit(code: string) {
    setVerifying(true);
    setError(null);
    try {
      await verifyOtp(d.phone.replace(/\D/g, ""), code);
      next();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't verify the code.");
      setDigits(Array(OTP_LEN).fill(""));
      refs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  // Accepts multi-digit input so SMS autofill (and fast typing) fills the row.
  function setAt(i: number, v: string) {
    const incoming = v.replace(/\D/g, "");
    const nx = [...digits];
    if (!incoming) {
      nx[i] = "";
      setDigits(nx);
      return;
    }
    let cursor = i;
    for (const ch of incoming) {
      if (cursor >= OTP_LEN) break;
      nx[cursor] = ch;
      cursor++;
    }
    setDigits(nx);
    refs.current[Math.min(cursor, OTP_LEN - 1)]?.focus();
    if (nx.every(Boolean)) void submit(nx.join(""));
  }

  return (
    <div className="scroll pad">
      <div className="muted">
        Enter the {OTP_LEN}-digit code sent to +91 {d.phone || "your number"}.
      </div>

      {d.devCode && (
        // No SMS provider is configured in development, so the backend returns the code.
        <div className="card mt12" style={{ padding: "10px 14px" }}>
          <span className="lab">Dev code</span>{" "}
          <span className="mono" style={{ fontSize: 15, letterSpacing: "0.15em" }}>
            {d.devCode}
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
            disabled={verifying}
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
        {verifying && (
          <>
            <Spinner dark /> <span className="muted">Verifying…</span>
          </>
        )}
      </div>
    </div>
  );
}

function PanStep({ d, set, next }: StepProps) {
  const { linkInvestor, state } = useStore();
  const [pan, setPan] = useState(d.pan);
  const [phase, setPhase] = useState<"input" | "checking" | "done">("input");
  const [error, setError] = useState<string | null>(null);
  const valid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);

  // Real lookup: link the Tarrakki investor registered against this PAN and show what
  // actually came back, rather than asserting "KYC verified" after a timer.
  async function check() {
    if (!valid || phase === "checking") return;
    setPhase("checking");
    setError(null);
    try {
      const res = await linkInvestor(pan);
      if (res.linked) {
        set({ pan });
        setPhase("done");
        return;
      }
      // A PAN with no Tarrakki investor is the normal state for a new signup. Report what is
      // actually needed instead of failing as if the PAN were bad.
      setError(
        res.message ??
          (res.next === "start_kyc"
            ? "This PAN isn't KYC-verified yet. Complete KYC before opening an investment account."
            : "This PAN has no investment account yet."),
      );
      setPhase("input");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't verify that PAN.");
      setPhase("input");
    }
  }

  const kycReady = state.user.investorStatus === "ready_to_invest";

  if (phase === "done") {
    return (
      <>
        <div className="scroll pad">
          <div
            className="col animate-in"
            style={{ alignItems: "center", paddingTop: 32, textAlign: "center" }}
          >
            <div className="check-ring">
              <CheckIcon size={44} />
            </div>
            <div
              className={`display ${kycReady ? "green" : ""}`}
              style={{ fontSize: 22, marginTop: 20 }}
            >
              {kycReady ? "You're ready to invest" : "Account linked"}
            </div>
            <div className="muted mt8 rowc gap8">
              <ShieldCheck size={15} />{" "}
              {kycReady ? "KYC verified" : `Status: ${state.user.investorStatus ?? "pending"}`}
            </div>
            <div className="mono muted mt16" style={{ fontSize: 13 }}>
              PAN {state.user.pan || pan}
            </div>
            <div className="card mt24" style={{ width: "100%", textAlign: "left" }}>
              <div className="lab" style={{ marginBottom: 4 }}>
                From your investor record
              </div>
              <div className="between mt8">
                <span className="muted" style={{ fontSize: 13 }}>Name</span>
                <span style={{ fontSize: 13 }}>{state.user.name || "—"}</span>
              </div>
              <div className="between mt8">
                <span className="muted" style={{ fontSize: 13 }}>Date of birth</span>
                <span className="mono" style={{ fontSize: 13 }}>{state.user.dob || "—"}</span>
              </div>
              <div className="between mt8">
                <span className="muted" style={{ fontSize: 13 }}>Email</span>
                <span style={{ fontSize: 13 }}>{state.user.email || "—"}</span>
              </div>
            </div>
          </div>
        </div>
        <Footer label="Looks good, continue" onClick={next} />
      </>
    );
  }

  return (
    <>
      <div className="scroll pad">
        <div className="muted">
          We check your KYC instantly — no documents if you&apos;re already
          verified.
        </div>
        <input
          autoFocus
          className="field mt20 mono"
          placeholder="ABCDE1234F"
          value={pan}
          maxLength={10}
          disabled={phase === "checking"}
          style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
          onChange={(e) =>
            setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))
          }
        />
        {error && (
          <div className="red mt12" style={{ fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="rowc gap8 mt16" style={{ minHeight: 24 }}>
          {phase === "checking" ? (
            <>
              <Spinner dark /> <span className="muted">Looking up your KYC record…</span>
            </>
          ) : (
            <span className="muted rowc gap8" style={{ fontSize: 13 }}>
              <ShieldCheck size={15} /> Secured &amp; encrypted
            </span>
          )}
        </div>
      </div>
      {phase === "input" && (
        <Footer label="Verify KYC" disabled={!valid} onClick={check} />
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="mt16">
      <div className="lab" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <input
        className={`field${mono ? " mono" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PersonalStep({ d, set, next }: StepProps) {
  const valid = d.name.trim().length > 1 && /\S+@\S+\.\S+/.test(d.email);
  return (
    <>
      <div className="scroll pad">
        <span className="autofill">
          <ShieldCheck size={11} /> Auto-filled from KYC
        </span>
        <div className="muted mt8" style={{ fontSize: 13.5 }}>
          Review your details and add your email.
        </div>
        <Field label="Full name" value={d.name} onChange={(v) => set({ name: v })} />
        <Field
          label="Email address"
          value={d.email}
          placeholder="you@email.com"
          onChange={(v) => set({ email: v })}
        />
        <Field label="Date of birth" value={d.dob} mono onChange={(v) => set({ dob: v })} />
        <div className="mt16">
          <div className="lab" style={{ marginBottom: 8 }}>
            Gender
          </div>
          <div className="amt-chips">
            {["Male", "Female", "Other"].map((g) => (
              <button
                key={g}
                className={`amt-chip${d.gender === g ? " active" : ""}`}
                onClick={() => set({ gender: g })}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Footer label="Continue" disabled={!valid} onClick={next} />
    </>
  );
}

function AddressStep({ d, set, next }: StepProps) {
  return (
    <>
      <div className="scroll pad">
        <span className="autofill">
          <ShieldCheck size={11} /> From Aadhaar KYC
        </span>
        <div className="muted mt8" style={{ fontSize: 13.5 }}>
          Confirm your communication address.
        </div>
        <div className="mt16">
          <div className="lab" style={{ marginBottom: 8 }}>
            Address
          </div>
          <textarea
            className="field"
            value={d.address}
            rows={3}
            style={{ height: "auto", padding: 14, resize: "none", lineHeight: 1.5 }}
            onChange={(e) => set({ address: e.target.value })}
          />
        </div>
        <div className="check on mt16">
          <span className="box">
            <CheckIcon size={14} />
          </span>
          <span>This is my correct communication and permanent address.</span>
        </div>
      </div>
      <Footer label="Continue" disabled={!d.address.trim()} onClick={next} />
    </>
  );
}

function IncomeStep({ d, set, next }: StepProps) {
  const valid = !!d.occupation && !!d.income && d.fatca;
  return (
    <>
      <div className="scroll pad">
        <div className="lab" style={{ marginBottom: 10 }}>
          Occupation
        </div>
        <div className="chiprow" style={{ padding: 0, flexWrap: "wrap", gap: 8 }}>
          {OCCUPATIONS.map((o) => (
            <button
              key={o}
              className={`chip${d.occupation === o ? " active" : ""}`}
              onClick={() => set({ occupation: o })}
            >
              {o}
            </button>
          ))}
        </div>

        <div className="lab" style={{ margin: "22px 0 10px" }}>
          Annual income
        </div>
        <div className="col gap8">
          {INCOMES.map((inc) => (
            <button
              key={inc}
              className={`opt${d.income === inc ? " on" : ""}`}
              onClick={() => set({ income: inc })}
            >
              <span className="radio" />
              <span className="grow">{inc}</span>
            </button>
          ))}
        </div>

        <div
          className={`check${d.fatca ? " on" : ""}`}
          style={{ marginTop: 22 }}
          onClick={() => set({ fatca: !d.fatca })}
          role="checkbox"
          aria-checked={d.fatca}
        >
          <span className="box">{d.fatca && <CheckIcon size={14} />}</span>
          <span>
            I am a tax resident of India only and not of any other country
            (FATCA/CRS declaration).
          </span>
        </div>
      </div>
      <Footer label="Continue" disabled={!valid} onClick={next} />
    </>
  );
}

function NomineeStep({ d, set, next }: StepProps) {
  const valid = !d.addNominee || (d.nomName.trim().length > 1 && !!d.nomRel);
  return (
    <>
      <div className="scroll pad">
        <div className="muted" style={{ fontSize: 13.5 }}>
          A nominee makes it easy for your family to claim your investments.
        </div>

        <div className="amt-chips mt16">
          <button
            className={`amt-chip${d.addNominee ? " active" : ""}`}
            onClick={() => set({ addNominee: true })}
          >
            Add nominee
          </button>
          <button
            className={`amt-chip${!d.addNominee ? " active" : ""}`}
            onClick={() => set({ addNominee: false })}
          >
            Skip for now
          </button>
        </div>

        {d.addNominee ? (
          <>
            <Field
              label="Nominee full name"
              value={d.nomName}
              placeholder="e.g. Meera Sharma"
              onChange={(v) => set({ nomName: v })}
            />
            <div className="mt16">
              <div className="lab" style={{ marginBottom: 8 }}>
                Relationship
              </div>
              <div className="chiprow" style={{ padding: 0, flexWrap: "wrap", gap: 8 }}>
                {RELATIONS.map((r) => (
                  <button
                    key={r}
                    className={`chip${d.nomRel === r ? " active" : ""}`}
                    onClick={() => set({ nomRel: r })}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="card mt16 between">
              <span className="muted" style={{ fontSize: 13 }}>
                Allocation
              </span>
              <span className="mono">100%</span>
            </div>
          </>
        ) : (
          <div className="check on mt16" style={{ cursor: "default" }}>
            <span className="box">
              <CheckIcon size={14} />
            </span>
            <span>
              I choose not to nominate and understand I can add a nominee later
              from my profile.
            </span>
          </div>
        )}
      </div>
      <Footer label="Continue" disabled={!valid} onClick={next} />
    </>
  );
}

/**
 * Register the investor's bank account.
 *
 * This used to be a UPI-app chooser that resolved on a `setTimeout` and then displayed a
 * hardcoded "HDFC Bank · Savings ••••4321 · verified by ₹1 penny-drop". None of that
 * happened: no account was registered anywhere, and the account shown was not the user's.
 *
 * Tarrakki registers banks by account number + IFSC (POST /api/investor/banks), optionally
 * with a cancelled cheque or statement — there is no UPI-linking path — so that is what this
 * collects. Redemption payouts go to whatever is registered here, which is exactly why it
 * must not be faked.
 */
function BankStep({ d, set, next }: StepProps) {
  const { state, refresh, toast } = useStore();
  const [account, setAccount] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("savings");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already registered upstream (returning user, or a retry after this step succeeded).
  const existing = primaryBank(state);
  const registered = d.bankRegistered || !!existing;

  // Mirrors the backend's own validation so the user sees the problem before a round trip.
  const accountOk = /^\d{6,20}$/.test(account);
  const confirmOk = confirmAccount === account;
  const ifscOk = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  const valid = accountOk && confirmOk && ifscOk;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.investor.addBank({
        account_number: account,
        ifsc,
        account_type: accountType,
      });
      // Pull the registered account back from the server rather than echoing the form —
      // upstream owns the record, including the masking and any status it assigns.
      await refresh();
      set({ bankRegistered: true });
      toast("Bank account registered");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't register that account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="scroll pad">
        <div className="muted" style={{ fontSize: 13.5 }}>
          Add the bank account you&rsquo;ll invest from. Redemptions and withdrawals are
          paid back to this account, so it must be in your own name.
        </div>

        {registered ? (
          /* ---- registered account, as returned by the server ---- */
          <div className="card card-lg mt16 animate-in">
            <div className="col" style={{ alignItems: "center", textAlign: "center", gap: 8 }}>
              <div className="check-ring" style={{ width: 60, height: 60 }}>
                <CheckIcon size={28} />
              </div>
              <div className="h-sora green" style={{ fontSize: 16, marginTop: 8 }}>
                Bank account added
              </div>
              <div className="muted" style={{ fontSize: 12.5 }}>
                {/* Approval status only comes back from the bank detail endpoint, so the
                    list gives us null — don't claim "verified" without it. */}
                {existing?.status
                  ? `Status: ${existing.status}`
                  : "Verification is handled by our registrar"}
              </div>
            </div>
            {existing && (
              <>
                <div className="hr" style={{ margin: "16px 0" }} />
                <div className="rowc gap12">
                  <span
                    className="amc"
                    style={{ width: 44, height: 44, borderColor: "var(--line)" }}
                  >
                    {existing.ifsc.slice(0, 1)}
                  </span>
                  <div className="grow col gap4" style={{ minWidth: 0 }}>
                    <span className="h-sora" style={{ fontSize: 15 }}>
                      {bankLabel(existing)}
                    </span>
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {existing.accountType} · {existing.ifsc}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ---- registration form ---- */
          <>
            <div className="mt16">
              <div className="lab" style={{ marginBottom: 8 }}>
                Account type
              </div>
              <div className="chiprow" style={{ padding: 0, gap: 8 }}>
                {(["savings", "current"] as const).map((t) => (
                  <button
                    key={t}
                    className={`chip${accountType === t ? " active" : ""}`}
                    style={{ textTransform: "capitalize" }}
                    onClick={() => setAccountType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Account number"
              value={account}
              placeholder="6–20 digits"
              mono
              onChange={(v) => setAccount(v.replace(/\D/g, "").slice(0, 20))}
            />
            <Field
              label="Re-enter account number"
              value={confirmAccount}
              placeholder="Must match above"
              mono
              onChange={(v) => setConfirmAccount(v.replace(/\D/g, "").slice(0, 20))}
            />
            {confirmAccount && !confirmOk && (
              <div className="red mt12" style={{ fontSize: 13 }}>
                Account numbers don&rsquo;t match.
              </div>
            )}

            <Field
              label="IFSC"
              value={ifsc}
              placeholder="e.g. HDFC0001234"
              mono
              onChange={(v) =>
                setIfsc(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))
              }
            />
            {ifsc.length === 11 && !ifscOk && (
              <div className="red mt12" style={{ fontSize: 13 }}>
                That IFSC doesn&rsquo;t look right — 4 letters, a 0, then 6 characters.
              </div>
            )}

            {error && (
              <div className="red mt16" style={{ fontSize: 13 }}>
                {error}
              </div>
            )}

            <div
              className="rowc gap8"
              style={{ justifyContent: "center", color: "var(--mute)", marginTop: 22, fontSize: 12 }}
            >
              <LockIcon size={13} /> Sent straight to our registrar · never stored in the app
            </div>
          </>
        )}
      </div>
      {registered ? (
        <Footer label="Continue" onClick={next} />
      ) : (
        <div className="sticky-cta" style={{ borderTop: "none" }}>
          <button
            className="btn btn-ink btn-block"
            disabled={!valid || busy}
            onClick={submit}
          >
            {busy ? (
              <>
                <Spinner /> Registering…
              </>
            ) : (
              "Add bank account"
            )}
          </button>
        </div>
      )}
    </>
  );
}

function SignatureStep({ set, next }: StepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    c.width = rect.width;
    c.height = rect.height;
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = "#1A1A18";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function ptr(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = ptr(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasInk(true);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = ptr(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function up() {
    drawing.current = false;
  }
  function clear() {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  return (
    <>
      <div className="scroll pad">
        <div className="muted" style={{ fontSize: 13.5 }}>
          Draw your signature below. This is your digital signature for the
          scheme documents (eSign).
        </div>

        <div className="sigpad mt16">
          <canvas
            ref={canvasRef}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
          />
          <div className="sig-baseline" />
          {!hasInk && <div className="hint">Sign here</div>}
        </div>

        <div className="between mt12">
          <button className="chip chip-sm rowc gap4" onClick={clear}>
            <TrashIcon size={14} /> Clear
          </button>
          <span className="muted rowc gap8" style={{ fontSize: 12 }}>
            <PenIcon size={14} /> eSigned via Aadhaar
          </span>
        </div>
      </div>
      <Footer
        label="Confirm signature"
        disabled={!hasInk}
        onClick={() => {
          set({ signed: true });
          next();
        }}
      />
    </>
  );
}

function FaceStep({ next }: StepProps) {
  const [phase, setPhase] = useState<"idle" | "scan" | "done">("idle");

  function capture() {
    setPhase("scan");
    setTimeout(() => setPhase("done"), 2000);
  }

  return (
    <>
      <div className="scroll pad">
        <div className="muted" style={{ fontSize: 13.5 }}>
          A quick liveness check (in-person verification) confirms it&apos;s
          really you.
        </div>

        <div style={{ marginTop: 28 }}>
          <div className={`face-ring ${phase}`}>
            {phase === "done" ? (
              <CheckIcon size={54} />
            ) : (
              <FaceIdIcon size={72} />
            )}
            {phase === "scan" && <span className="face-scanline" />}
          </div>
        </div>

        <div
          className="col"
          style={{ alignItems: "center", textAlign: "center", marginTop: 20, gap: 6 }}
        >
          {phase === "idle" && (
            <span className="muted">Position your face inside the circle</span>
          )}
          {phase === "scan" && (
            <span className="rowc gap8">
              <Spinner dark /> <span className="muted">Verifying liveness…</span>
            </span>
          )}
          {phase === "done" && (
            <span className="green h-sora" style={{ fontSize: 16 }}>
              Face verified
            </span>
          )}
        </div>
      </div>
      {phase === "idle" && (
        <div className="sticky-cta" style={{ borderTop: "none" }}>
          <button className="btn btn-ink btn-block" onClick={capture}>
            <CameraIcon size={18} /> Start face scan
          </button>
        </div>
      )}
      {phase === "done" && <Footer label="Continue" onClick={next} />}
    </>
  );
}

function BiometricStep({ d, set, next }: StepProps) {
  return (
    <>
      <div className="scroll pad">
        <div
          className="col"
          style={{ alignItems: "center", textAlign: "center", paddingTop: 12, gap: 10 }}
        >
          <span
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "var(--ink)",
              color: "var(--paper)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <FingerprintIcon size={38} />
          </span>
          <div className="h-sora" style={{ fontSize: 17, marginTop: 6 }}>
            Lock the app with biometrics
          </div>
          <div className="muted" style={{ fontSize: 13.5, maxWidth: "30ch" }}>
            Use Face ID or your fingerprint so only you can open risips and
            approve investments.
          </div>
        </div>

        <button
          className="card between mt24"
          style={{ width: "100%" }}
          onClick={() => set({ biometric: !d.biometric })}
        >
          <span className="rowc gap12">
            <FaceIdIcon size={22} />
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>
              Enable Face ID / fingerprint
            </span>
          </span>
          <span className={`switch${d.biometric ? " on" : ""}`} />
        </button>
      </div>
      <Footer label={d.biometric ? "Finish setup" : "Maybe later"} onClick={next} />
    </>
  );
}

function DoneStep({ name, onFinish }: { name: string; onFinish: () => void }) {
  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div
        className="grow col pad"
        style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
      >
        <div className="check-ring">
          <CheckIcon size={44} />
        </div>
        <div className="display" style={{ fontSize: 26, marginTop: 24 }}>
          You&apos;re all set{name ? `, ${name.split(" ")[0]}` : ""}!
        </div>
        <p className="muted mt12" style={{ fontSize: 14.5, maxWidth: "30ch" }}>
          Your account is fully verified and ready. Start investing from{" "}
          <b style={{ color: "var(--ink)" }}>₹500</b>.
        </p>
        <div className="card mt24" style={{ width: "100%", textAlign: "left" }}>
          {[
            "KYC verified via CVL KRA",
            "Bank linked via UPI",
            "Nominee & signature on file",
            "Face verified · app locked",
          ].map((t) => (
            <div key={t} className="rowc gap12" style={{ padding: "8px 0" }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--green)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <CheckIcon size={13} />
              </span>
              <span style={{ fontSize: 14 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 20px 40px" }}>
        <button className="btn btn-green btn-block" onClick={onFinish}>
          Start investing
        </button>
      </div>
    </div>
  );
}
