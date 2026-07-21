"use client";

import { useStore } from "../lib/store";

export function Toasts() {
  const { toasts } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="tdot" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
