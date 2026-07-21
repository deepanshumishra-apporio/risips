"use client";

import { useEffect, useState } from "react";
import { fundByIsin, useStore } from "../lib/store";
import { AmcLogo } from "../components/AmcLogo";
import { CartButton } from "../components/CartButton";
import { AddFundsSheet } from "../components/AddFundsSheet";
import {
  ChevronLeft,
  PlusIcon,
  PenIcon,
  TrashIcon,
  HeartIcon,
} from "../components/icons";
import { pct } from "../lib/format";

export function Wishlist() {
  const {
    state,
    back,
    canBack,
    go,
    createWatchlist,
    renameWatchlist,
    deleteWatchlist,
    removeFundFromList,
    toast,
  } = useStore();

  const lists = state.watchlists;
  const [activeId, setActiveId] = useState(lists[0]?.id ?? "");
  const [modal, setModal] = useState<null | { mode: "create" | "rename" }>(null);
  const [name, setName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // keep a valid selection as lists change
  useEffect(() => {
    if (lists.length && !lists.some((l) => l.id === activeId)) {
      setActiveId(lists[0].id);
    }
  }, [lists, activeId]);

  const active = lists.find((l) => l.id === activeId) ?? lists[0];
  const funds = (active?.isins ?? [])
    .map((isin) => fundByIsin(isin))
    .filter(Boolean) as NonNullable<ReturnType<typeof fundByIsin>>[];

  function openCreate() {
    setName("");
    setModal({ mode: "create" });
  }
  function openRename() {
    setName(active?.name ?? "");
    setModal({ mode: "rename" });
  }
  function submitModal() {
    const n = name.trim();
    if (!n || !modal) return;
    if (modal.mode === "create") {
      const id = createWatchlist(n);
      setActiveId(id);
      toast("Watchlist created");
    } else {
      renameWatchlist(active.id, n);
      toast("Watchlist renamed");
    }
    setModal(null);
  }
  function remove() {
    if (!active) return;
    deleteWatchlist(active.id);
    toast("Watchlist deleted");
  }

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      {canBack ? (
        <div className="backbar" style={{ justifyContent: "space-between" }}>
          <div className="rowc gap8">
            <button className="iconbtn" onClick={back}>
              <ChevronLeft size={22} />
            </button>
            <span className="h-sora" style={{ fontSize: 16 }}>
              Watchlists
            </span>
          </div>
          <CartButton />
        </div>
      ) : (
        <div className="appbar">
          <span className="display" style={{ fontSize: 24 }}>
            Watchlists
          </span>
          <CartButton />
        </div>
      )}

      {/* list tabs */}
      <div className="chiprow" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {lists.map((l) => (
          <button
            key={l.id}
            className={`chip${l.id === activeId ? " active" : ""}`}
            onClick={() => setActiveId(l.id)}
          >
            {l.name}
            <span
              className="mono"
              style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}
            >
              {l.isins.length}
            </span>
          </button>
        ))}
        <button className="chip rowc gap4" onClick={openCreate}>
          <PlusIcon size={15} /> New
        </button>
      </div>

      <div className="scroll pad-x" style={{ paddingBottom: 16 }}>
        {!active ? (
          <div className="card card-lg" style={{ textAlign: "center", marginTop: 24 }}>
            <div className="col" style={{ alignItems: "center", gap: 10 }}>
              <span className="muted">
                <HeartIcon size={30} />
              </span>
              <div className="h-sora" style={{ fontSize: 16 }}>
                No watchlists yet
              </div>
              <div className="muted" style={{ fontSize: 14, maxWidth: "26ch" }}>
                Create a watchlist to track funds you&apos;re interested in.
              </div>
              <button className="btn btn-ink btn-sm mt8" onClick={openCreate}>
                Create watchlist
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* manage bar */}
            <div className="between" style={{ padding: "10px 2px" }}>
              <span className="lab">
                {funds.length} fund{funds.length === 1 ? "" : "s"}
              </span>
              <span className="rowc gap8">
                <button className="chip chip-sm rowc gap4" onClick={openRename}>
                  <PenIcon size={13} /> Rename
                </button>
                <button
                  className="chip chip-sm rowc gap4"
                  style={{ color: "var(--red)" }}
                  onClick={remove}
                >
                  <TrashIcon size={13} /> Delete
                </button>
              </span>
            </div>

            {/* add funds yourself */}
            <button
              className="btn btn-ink btn-block rowc gap8"
              style={{ marginBottom: 14 }}
              onClick={() => setShowAdd(true)}
            >
              <PlusIcon size={18} /> Add funds
            </button>

            {funds.length === 0 ? (
              <div className="card card-lg" style={{ textAlign: "center" }}>
                <div className="muted" style={{ fontSize: 14 }}>
                  “{active.name}” is empty. Tap{" "}
                  <b style={{ color: "var(--ink)" }}>Add funds</b> to track funds
                  here.
                </div>
              </div>
            ) : (
              <div className="col gap12">
                {funds.map((f) => (
                  <div key={f.isin} className="card rowc gap12">
                    <button
                      className="rowc gap12 grow"
                      style={{ textAlign: "left", minWidth: 0 }}
                      onClick={() => go("fund", { isin: f.isin })}
                    >
                      <AmcLogo fund={f} size={40} />
                      <span className="grow col gap4" style={{ minWidth: 0 }}>
                        <span
                          className="h-sora"
                          style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {f.name}
                        </span>
                        <span className="rowc gap8">
                          <span className="tag">{f.category}</span>
                          <span className="mono green" style={{ fontSize: 12, fontWeight: 500 }}>
                            {pct(f.returns["3y"])} · 3Y
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      className="iconbtn"
                      aria-label="Remove from watchlist"
                      onClick={() => {
                        removeFundFromList(active.id, f.isin);
                        toast(`Removed from ${active.name}`);
                      }}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* create / rename modal */}
      {modal && (
        <div className="overlay center" onClick={() => setModal(null)}>
          <div
            className="card card-lg"
            style={{ width: "82%", maxWidth: 320, animation: "menuin .16s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-sora" style={{ fontSize: 17 }}>
              {modal.mode === "create" ? "New watchlist" : "Rename watchlist"}
            </div>
            <input
              autoFocus
              className="field mt16"
              placeholder="e.g. Retirement, Tax savers"
              value={name}
              maxLength={28}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitModal()}
            />
            <div className="rowc gap8 mt16">
              <button
                className="btn btn-ghost grow"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-ink grow"
                disabled={!name.trim()}
                onClick={submitModal}
              >
                {modal.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && active && (
        <AddFundsSheet
          listId={active.id}
          listName={active.name}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
