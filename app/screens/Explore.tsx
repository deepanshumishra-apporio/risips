"use client";

import { useMemo, useState } from "react";
import { FUNDS, useStore } from "../lib/store";
import { FundRow } from "../components/ui";
import { CartButton } from "../components/CartButton";
import { SearchIcon } from "../components/icons";

const CATEGORIES = [
  "All",
  "Large Cap",
  "Mid Cap",
  "Small Cap",
  "Flexi Cap",
  "ELSS",
  "Index",
  "Hybrid",
  "Debt",
  "Contra",
];

const SORTS = [
  { key: "3y", label: "3Y return" },
  { key: "1y", label: "1Y return" },
  { key: "aum", label: "Fund size" },
] as const;

export function Explore() {
  const { route } = useStore();
  const collection = route.params?.collection as string | undefined;

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("3y");

  const results = useMemo(() => {
    let list = FUNDS.slice();
    if (collection) list = list.filter((f) => f.tags.includes(collection));
    if (cat !== "All") list = list.filter((f) => f.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(s) ||
          f.amc.toLowerCase().includes(s) ||
          f.category.toLowerCase().includes(s)
      );
    }
    list.sort((a, b) =>
      sort === "aum"
        ? b.aumCr - a.aumCr
        : b.returns[sort] - a.returns[sort]
    );
    return list;
  }, [q, cat, sort, collection]);

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
        {CATEGORIES.map((c) => (
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
        <span className="lab">{results.length} funds</span>
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
            <FundRow key={f.isin} fund={f} />
          ))}
          {results.length === 0 && (
            <div className="muted" style={{ padding: "28px 0", textAlign: "center" }}>
              No funds match “{q}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
