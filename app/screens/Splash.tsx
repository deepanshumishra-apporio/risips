"use client";

import { useStore } from "../lib/store";
import { Mark } from "../components/Mark";

export function Splash() {
  const { go } = useStore();
  return (
    <div className="screen animate-in" style={{ background: "var(--ink)" }}>
      <div className="safe-top" />
      <div
        className="grow col"
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 22,
        }}
      >
        <Mark size={72} reversed />
        <div
          className="wordmark"
          style={{ color: "var(--paper)", fontSize: 44 }}
        >
          risips
        </div>
        <div
          className="muted"
          style={{ color: "#A9A497", fontSize: 16, marginTop: -6 }}
        >
          Mutual funds, simply.
        </div>
      </div>

      <div style={{ padding: "0 24px 40px" }}>
        <button
          className="btn btn-block"
          style={{ background: "var(--paper)", color: "var(--ink)" }}
          onClick={() => go("onboard")}
        >
          Get started
        </button>
        <button
          className="btn btn-block"
          style={{ background: "transparent", color: "#A9A497", marginTop: 4 }}
          onClick={() => go("login")}
        >
          I already have an account
        </button>
        <div
          className="lab"
          style={{
            textAlign: "center",
            marginTop: 18,
            color: "#615d54",
            letterSpacing: "0.12em",
          }}
        >
          An Arthasuta platform
        </div>
      </div>
    </div>
  );
}
