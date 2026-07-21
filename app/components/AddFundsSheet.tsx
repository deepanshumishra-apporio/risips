"use client";

import { useMemo, useState } from "react";
import { FUNDS, useStore } from "../lib/store";
import { AmcLogo } from "./AmcLogo";
import { SearchIcon, CheckIcon, PlusIcon } from "./icons";
import { pct } from "../lib/format";

export function AddFundsSheet({
  listId,
  listName,
  onClose,
}: {
  listId: string;
  listName: string;
  onClose: () => void;
}) {
  const { state, addFundToList, removeFundFromList, toast } = useStore();
  const [q, setQ] = useState("");

  const list = state.watchlists.find((w) => w.id === listId);
  const inList = useMemo(() => new Set(list?.isins ?? []), [list]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return FUNDS;
    return FUNDS.filter(
      (f) =>
        f.name.toLowerCase().includes(s) ||
        f.amc.toLowerCase().includes(s) ||
        f.category.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        style={{ height: "88%", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grip" />
        <div className="between" style={{ marginBottom: 2 }}>
          <span className="h-sora" style={{ fontSize: 17 }}>
            Add funds
          </span>
          <button className="lab" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          to “{listName}”
        </div>

        <div className="prefix-field" style={{ height: 48, flex: "0 0 auto" }}>
          <SearchIcon size={20} />
          <input
            autoFocus
            placeholder="Search funds or AMCs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        </div>

        <div
          className="scroll"
          style={{ marginTop: 8, marginLeft: -4, marginRight: -4 }}
        >
          <div className="divide" style={{ padding: "0 4px" }}>
            {results.map((f) => {
              const added = inList.has(f.isin);
              return (
                <div key={f.isin} className="row">
                  <AmcLogo fund={f} size={38} />
                  <span className="grow col gap4" style={{ minWidth: 0 }}>
                    <span
                      className="h-sora"
                      style={{ fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {f.name}
                    </span>
                    <span className="rowc gap8">
                      <span className="tag">{f.category}</span>
                      <span className="mono green" style={{ fontSize: 11.5, fontWeight: 500 }}>
                        {pct(f.returns["3y"])} · 3Y
                      </span>
                    </span>
                  </span>
                  <button
                    className={`chip chip-sm rowc gap4${added ? " active" : ""}`}
                    style={{ flex: "0 0 auto" }}
                    onClick={() => {
                      if (added) {
                        removeFundFromList(listId, f.isin);
                        toast(`Removed from ${listName}`);
                      } else {
                        addFundToList(listId, f.isin);
                        toast(`Added to ${listName}`);
                      }
                    }}
                  >
                    {added ? (
                      <>
                        <CheckIcon size={13} /> Added
                      </>
                    ) : (
                      <>
                        <PlusIcon size={14} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
            {results.length === 0 && (
              <div className="muted" style={{ padding: "28px 0", textAlign: "center" }}>
                No funds match “{q}”.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
