"use client";

import { useState } from "react";
import type { Fund } from "../lib/types";
import { useStore } from "../lib/store";
import { CheckIcon, PlusIcon } from "./icons";

export function WatchlistSheet({
  fund,
  onClose,
}: {
  fund: Fund;
  onClose: () => void;
}) {
  const {
    state,
    listsContaining,
    addFundToList,
    removeFundFromList,
    createWatchlist,
    toast,
  } = useStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const inLists = new Set(listsContaining(fund.isin));

  function toggle(listId: string, listName: string) {
    if (inLists.has(listId)) {
      removeFundFromList(listId, fund.isin);
      toast(`Removed from ${listName}`);
    } else {
      addFundToList(listId, fund.isin);
      toast(`Added to ${listName}`);
    }
  }

  function create() {
    const n = name.trim();
    if (!n) return;
    const id = createWatchlist(n);
    addFundToList(id, fund.isin);
    toast(`Added to ${n}`);
    setName("");
    setCreating(false);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grip" />
        <div className="between" style={{ marginBottom: 4 }}>
          <span className="h-sora" style={{ fontSize: 17 }}>
            Save to watchlist
          </span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          {fund.name}
        </div>

        <div className="col gap8">
          {state.watchlists.map((w) => {
            const on = inLists.has(w.id);
            return (
              <button
                key={w.id}
                className={`opt${on ? " on" : ""}`}
                onClick={() => toggle(w.id, w.name)}
              >
                <span
                  className="box-check"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: on ? "none" : "2px solid var(--line)",
                    background: on ? "var(--ink)" : "transparent",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                  }}
                >
                  {on && <CheckIcon size={14} />}
                </span>
                <span className="grow">{w.name}</span>
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {w.isins.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* create new */}
        {creating ? (
          <div className="rowc gap8" style={{ marginTop: 12 }}>
            <input
              autoFocus
              className="field"
              style={{ height: 48 }}
              placeholder="New watchlist name"
              value={name}
              maxLength={28}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <button
              className="btn btn-ink btn-sm"
              style={{ flex: "0 0 auto" }}
              disabled={!name.trim()}
              onClick={create}
            >
              Create
            </button>
          </div>
        ) : (
          <button
            className="opt"
            style={{ marginTop: 12 }}
            onClick={() => setCreating(true)}
          >
            <span
              style={{
                width: 22,
                height: 22,
                display: "grid",
                placeItems: "center",
                color: "var(--ink)",
                flex: "0 0 auto",
              }}
            >
              <PlusIcon size={18} />
            </span>
            <span className="grow">Create new watchlist</span>
          </button>
        )}

        <button className="btn btn-ink btn-block mt16" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
