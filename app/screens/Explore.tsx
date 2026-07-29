"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { api, toFund } from "../lib/api";
import type { Fund } from "../lib/types";
import { FundRow } from "../components/ui";
import { CartButton } from "../components/CartButton";
import { SearchIcon } from "../components/icons";
import { Spinner } from "../components/ui";

// Search, filtering and sorting all run server-side against the full ~5.9k fund catalogue.
// Filtering a client-side slice would silently hide most of the market.

const SORTS = [
  { key: "return_3y", label: "3Y return" },
  { key: "return_1y", label: "1Y return" },
  { key: "aum", label: "Fund size" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

const PAGE = 30;

export function Explore() {
  const { route, toast } = useStore();
  const collection = route.params?.collection as string | undefined;

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(collection ?? "All");
  const [sort, setSort] = useState<SortKey>("return_3y");

  const [categories, setCategories] = useState<string[]>([]);
  const [results, setResults] = useState<Fund[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const offsetRef = useRef(0);

  useEffect(() => {
    api.funds
      .categories()
      .then((r) => setCategories(r.categories.map((c) => c.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  // Refetch page 1 whenever the query changes (debounced on the text input).
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      offsetRef.current = 0;
      api.funds
        .list(
          {
            q: q.trim() || undefined,
            category: cat === "All" ? undefined : cat,
            sort,
            limit: PAGE,
            offset: 0,
          },
          ctrl.signal,
        )
        .then((r) => {
          setResults(r.results.map(toFund));
          setTotal(r.count);
          offsetRef.current = r.results.length;
        })
        .catch((e) => {
          if ((e as Error).name !== "AbortError") toast("Couldn't load funds.");
        })
        .finally(() => setLoading(false));
    }, q ? 250 : 0);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, cat, sort, toast]);

  async function loadMore() {
    if (loadingMore || results.length >= total) return;
    setLoadingMore(true);
    try {
      const r = await api.funds.list({
        q: q.trim() || undefined,
        category: cat === "All" ? undefined : cat,
        sort,
        limit: PAGE,
        offset: offsetRef.current,
      });
      setResults((prev) => [...prev, ...r.results.map(toFund)]);
      offsetRef.current += r.results.length;
    } catch {
      toast("Couldn't load more funds.");
    } finally {
      setLoadingMore(false);
    }
  }

  const chips = useMemo(() => ["All", ...categories], [categories]);
  const title = collection ?? "Explore";

  return (
    <div className="screen animate-in">
      <div className="safe-top" />
      <div className="appbar">
        <span className="display" style={{ fontSize: 24 }}>
          {title}
        </span>
        <CartButton />
      </div>

      {/* search */}
      <div className="pad-x">
        <div className="prefix-field" style={{ height: 48 }}>
          <SearchIcon size={20} />
          <input
            placeholder="Search funds or AMCs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        </div>
      </div>

      {/* category filter chips */}
      <div className="chiprow" style={{ marginTop: 14 }}>
        {chips.map((c) => (
          <button
            key={c}
            className={`chip${cat === c ? " active" : ""}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* sort */}
      <div className="between pad-x" style={{ marginTop: 14 }}>
        <span className="lab">
          {loading ? "Loading…" : `${total.toLocaleString("en-IN")} funds`}
        </span>
        <div className="segment">
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={sort === s.key ? "active" : ""}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll pad-x" style={{ marginTop: 4, paddingBottom: 16 }}>
        <div className="card divide" style={{ padding: "0 16px" }}>
          {results.map((f) => (
            <FundRow key={f.id} fund={f} />
          ))}

          {loading && (
            <div className="col" style={{ padding: "28px 0", alignItems: "center" }}>
              <Spinner dark />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="muted" style={{ padding: "28px 0", textAlign: "center" }}>
              {q ? `No funds match “${q}”.` : "No funds in this category."}
            </div>
          )}
        </div>

        {!loading && results.length < total && (
          <button
            className="btn btn-block mt16"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : `Show more (${total - results.length} left)`}
          </button>
        )}
      </div>
    </div>
  );
}
