"use client";

// App store + a lightweight screen router (context state machine).
//
// All data comes from the backend (see ../../backend), which brokers the Tarrakki API.
// Actions call the API and then refresh the affected slice, so what the UI shows is what
// the upstream actually recorded — no optimistic invention of orders or holdings.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  ApiError,
  getToken,
  setToken,
  toFund,
  type FundConstraints,
  type FundDTO,
  type OrderDTO,
  type SipDTO,
} from "./api";
import type {
  AppState,
  Fund,
  Holding,
  Order,
  SIP,
  Toast,
  User,
  Watchlist,
  WalletTxn,
} from "./types";

/* ----------------------------- fund cache -------------------------------- */

// Screens look funds up synchronously by ISIN (11 call sites). Rather than rewrite each
// one as async, the store keeps a cache that every fetch populates, and `fundByIsin`
// reads from it. A miss returns undefined, which screens already handle.
const fundCache = new Map<string, Fund>();

function cacheFunds(dtos: FundDTO[]): Fund[] {
  const mapped = dtos.map(toFund);
  for (const f of mapped) {
    fundCache.set(f.isin, f);
    fundCache.set(f.id, f);
  }
  return mapped;
}

export const fundByIsin = (isin: string | null | undefined): Fund | undefined =>
  isin ? fundCache.get(isin) : undefined;

/* ----------------------------- routing ---------------------------------- */

export type ScreenName =
  | "splash"
  | "onboard"
  | "login"
  | "phone"
  | "otp"
  | "pan"
  | "bank"
  | "home"
  | "explore"
  | "fund"
  | "payment"
  | "success"
  | "orders"
  | "orderDetail"
  | "portfolio"
  | "redeem"
  | "sips"
  | "profile"
  | "notifications"
  | "wishlist"
  | "cart"
  | "wallet";

export interface Route {
  screen: ScreenName;
  params?: Record<string, unknown>;
}

export const TAB_SCREENS: ScreenName[] = ["home", "explore", "wishlist", "orders", "portfolio"];

/* --------------------------- invest draft -------------------------------- */

export interface InvestDraft {
  isin: string;
  amount: number;
  mode: "One-time" | "SIP";
  sipDay: number;
}

/* ----------------------------- mappers ----------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Map Tarrakki's order status vocabulary onto the app's. */
function orderStatus(raw: string, kind: Order["kind"]): Order["status"] {
  switch (raw?.toLowerCase()) {
    case "success":
      return kind === "Redeem" ? "Redeemed" : "Allotted";
    case "cancelled":
      return "Cancelled";
    case "failed":
    case "rejected":
      return "Failed";
    default:
      return "Pending";
  }
}

function orderKind(orderType: string): Order["kind"] {
  if (orderType === "sell" || orderType === "swp") return "Redeem";
  if (orderType === "sip") return "SIP";
  return "One-time";
}

function toOrder(d: OrderDTO): Order {
  const kind = orderKind(d.orderType);
  const fund = fundCache.get(d.fundId);
  return {
    id: d.id,
    fundId: d.fundId,
    isin: fund?.isin ?? d.fundId,
    fundName: d.fundName,
    kind,
    amount: d.amount,
    units: d.units,
    nav: d.nav,
    folio: d.folio,
    status: orderStatus(d.status, kind),
    rawStatus: d.status,
    statusRemark: d.statusRemark,
    date: d.date,
    placedLabel: dateLabel(d.date),
  };
}

function toSip(d: SipDTO): SIP {
  const fund = fundCache.get(d.fundId);
  const day = Number(d.startDate?.slice(8, 10)) || 1;
  const cancelled = d.status?.toLowerCase() === "cancelled";
  return {
    id: d.id,
    fundId: d.fundId,
    isin: fund?.isin ?? d.fundId,
    fundName: d.fundName,
    amount: d.amount,
    frequency: d.frequency,
    day,
    startDate: d.startDate,
    nextLabel: dateLabel(d.startDate),
    installments: d.installments,
    status: cancelled ? "Cancelled" : "Active",
  };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Upstream portfolio rows are loosely typed; pick the fields we need defensively. */
function toHolding(h: Record<string, unknown>): Holding {
  const fundId = String(h.fund_id ?? h.fundId ?? "");
  const fund = fundCache.get(fundId);
  return {
    fundId,
    isin: fund?.isin ?? fundId,
    fundName: String(h.fund_name ?? h.fundName ?? fund?.name ?? "—"),
    folio: String(h.folio ?? "—"),
    units: num(h.units),
    invested: num(h.invested_amount ?? h.invested),
    current: num(h.current_value ?? h.current),
  };
}

/* --------------------------- empty state --------------------------------- */

const EMPTY_USER: User = {
  name: "",
  phone: "",
  pan: "",
  bank: "",
  kycVerified: false,
  investorId: null,
  investorStatus: null,
};

function emptyState(): AppState {
  return {
    user: EMPTY_USER,
    onboarded: false,
    authenticated: false,
    loading: true,
    holdings: [],
    orders: [],
    sips: [],
    watchlists: [],
    cart: [],
    wallet: 0,
    walletTxns: [],
    notificationsSeen: true,
    unreadNotifications: 0,
    portfolioTotals: { invested: 0, current: 0, gain: 0, returnPct: 0 },
    loadErrors: {},
  };
}

/** Turn a failed slice fetch into a message the UI can show verbatim. */
function sliceError(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

/* --------------------------- context ------------------------------------- */

/**
 * Outcome of a PAN link.
 *
 * `linked: false` is not a failure — it means the PAN has no Tarrakki investor yet, which is
 * the normal state for a new signup. `next` says whether to create one (`create_investor`,
 * when the PAN is already KYC-verified) or send the user through KYC first (`start_kyc`).
 *
 * Derived from the client so the two can't drift apart.
 */
export type LinkResult = Awaited<ReturnType<typeof api.investor.link>>;

interface Store {
  // routing
  route: Route;
  canBack: boolean;
  activeTab: ScreenName;
  go: (screen: ScreenName, params?: Record<string, unknown>) => void;
  switchTab: (screen: ScreenName) => void;
  back: () => void;

  // state
  state: AppState;

  // catalogue
  /** A browse list (top funds by AUM), loaded once for Home/Explore. */
  funds: Fund[];
  fundsLoading: boolean;
  fundByIsin: (isin: string | null | undefined) => Fund | undefined;
  searchFunds: (query: string, signal?: AbortSignal) => Promise<Fund[]>;
  loadFund: (isin: string) => Promise<Fund | undefined>;
  loadConstraints: (isin: string) => Promise<FundConstraints | null>;

  // toasts
  toasts: Toast[];
  toast: (message: string) => void;

  // auth
  requestOtp: (mobile: string) => Promise<{ devCode?: string }>;
  verifyOtp: (mobile: string, code: string) => Promise<void>;
  linkInvestor: (pan: string) => Promise<LinkResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;

  // actions
  completeOnboarding: (patch?: Partial<User>) => void;
  placeInvestment: (draft: InvestDraft) => Promise<Order>;
  redeem: (isin: string, amount: number) => Promise<Order>;
  cancelSip: (id: string) => Promise<void>;

  // watchlists
  isWatched: (isin: string) => boolean;
  listsContaining: (isin: string) => string[];
  createWatchlist: (name: string) => Promise<string>;
  renameWatchlist: (id: string, name: string) => Promise<void>;
  deleteWatchlist: (id: string) => Promise<void>;
  addFundToList: (listId: string, isin: string) => Promise<void>;
  removeFundFromList: (listId: string, isin: string) => Promise<void>;
  markNotificationsSeen: () => void;

  // cart
  addToCart: (isin: string, amount: number) => Promise<void>;
  removeFromCart: (isin: string) => Promise<void>;
  setCartAmount: (isin: string, amount: number) => Promise<void>;
  clearCart: () => Promise<void>;
  inCart: (isin: string) => boolean;
  checkoutCart: () => Promise<Order[]>;

  // wallet
  addMoney: (amount: number) => Promise<void>;
  withdrawMoney: (amount: number) => Promise<void>;
  spendFromWallet: (amount: number, label: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

/** Every order-placing call needs a key so a retry can't buy twice. */
const idempotencyKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `k${Date.now()}${Math.random().toString(36).slice(2)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Route[]>([{ screen: "splash" }]);
  const [state, setState] = useState<AppState>(emptyState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [fundsLoading, setFundsLoading] = useState(true);
  const toastSeq = useRef(0);

  const toast = useCallback((message: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  /** Surface an API failure to the user instead of failing silently. */
  const reportError = useCallback(
    (e: unknown, fallback: string) => {
      const msg = e instanceof ApiError ? e.message : fallback;
      toast(msg);
      return msg;
    },
    [toast],
  );

  /* ------------------------- catalogue bootstrap ------------------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // A browse slice, largest first — enough for Home and Explore to feel populated
        // without pulling all 5.9k funds into the client.
        const res = await api.funds.list({ sort: "aum", limit: 100 });
        if (cancelled) return;
        setFunds(cacheFunds(res.results));
      } catch (e) {
        if (!cancelled) reportError(e, "Couldn't load funds.");
      } finally {
        if (!cancelled) setFundsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportError]);

  /* ----------------------------- data load ------------------------------- */

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setState((s) => ({ ...s, loading: false, authenticated: false }));
      return;
    }

    try {
      const me = await api.auth.me();

      // Anything below needs a linked investor; app-owned slices don't.
      const [watchRes, cartRes, walletRes, notifRes] = await Promise.all([
        api.app.watchlists().catch(() => ({ results: [] })),
        api.app.cart().catch(() => ({ results: [], total: 0 })),
        api.app.wallet().catch(() => ({ balance: 0, transactions: [] })),
        api.app.notifications().catch(() => ({ results: [], unread: 0 })),
      ]);

      let orders: Order[] = [];
      let sips: SIP[] = [];
      let holdings: Holding[] = [];
      let totals = { invested: 0, current: 0, gain: 0, returnPct: 0 };
      // One slice failing upstream shouldn't blank the whole screen, but it shouldn't look
      // like "you have no orders" either — record it so the UI can say what didn't load.
      const loadErrors: AppState["loadErrors"] = {};
      const noteError = (slice: keyof AppState["loadErrors"]) => (e: unknown) => {
        loadErrors[slice] = e instanceof Error ? e.message : "Couldn't load this right now.";
        return null;
      };

      if (me.user.investorId) {
        const [ordersRes, sipsRes, portfolioRes] = await Promise.all([
          api.orders.list().catch(noteError("orders")),
          api.systematic.sips().catch(noteError("sips")),
          api.investor.portfolio().catch(noteError("portfolio")),
        ]);

        const orderRows = ordersRes?.results ?? [];
        const sipRows = sipsRes?.results ?? [];
        const holdingRows = portfolioRes?.holdings ?? [];

        // Orders/holdings reference funds by id; make sure those are in the cache so
        // fundByIsin resolves on the detail screens.
        const ids = new Set<string>();
        for (const o of orderRows) ids.add(o.fundId);
        for (const s of sipRows) ids.add(s.fundId);
        for (const h of holdingRows) {
          const id = String((h as Record<string, unknown>).fund_id ?? "");
          if (id) ids.add(id);
        }
        const missing = [...ids].filter((id) => !fundCache.has(id));
        if (missing.length) {
          const fetched = await Promise.all(missing.map((id) => api.funds.get(id).catch(() => null)));
          cacheFunds(fetched.filter((f): f is FundDTO => !!f));
        }

        orders = orderRows.map(toOrder);
        sips = sipRows.map(toSip);
        holdings = holdingRows.map((h) => toHolding(h as Record<string, unknown>));
        totals = portfolioRes?.totals ?? totals;
      }

      // Watchlist/cart payloads embed full fund objects — cache them too.
      cacheFunds(watchRes.results.flatMap((w) => w.funds));
      cacheFunds(cartRes.results.map((i) => i.fund));

      const watchlists: Watchlist[] = watchRes.results.map((w) => ({
        id: w.id,
        name: w.name,
        isins: w.funds.map((f) => f.isin ?? f.id),
      }));

      const walletTxns: WalletTxn[] = walletRes.transactions.map((t) => ({
        id: t.id,
        kind: (t.kind as WalletTxn["kind"]) ?? "Added",
        amount: t.amount,
        label: t.label,
        when: dateLabel(t.createdAt),
      }));

      setState({
        user: {
          ...EMPTY_USER,
          name: me.user.name ?? "",
          phone: me.user.mobile,
          pan: me.user.pan ?? "",
          email: me.user.email ?? undefined,
          bank: "",
          kycVerified: me.investorStatus === "ready_to_invest",
          investorId: me.user.investorId,
          investorStatus: me.investorStatus,
          dob: me.investor?.dob,
          gender: me.investor?.gender,
          address: me.investor?.address
            ? [
                me.investor.address.address_line_1,
                me.investor.address.address_line_2,
                me.investor.address.city,
                me.investor.address.state,
                me.investor.address.pincode,
              ]
                .filter(Boolean)
                .join(", ")
            : undefined,
          occupation: me.investor?.fatca_detail?.occupation,
          income: me.investor?.fatca_detail?.income_slab,
        },
        onboarded: Boolean(me.user.investorId),
        authenticated: true,
        loading: false,
        holdings,
        orders,
        sips,
        watchlists,
        cart: cartRes.results.map((i) => ({ isin: i.fund.isin ?? i.fund.id, amount: i.amount })),
        wallet: walletRes.balance,
        walletTxns,
        notificationsSeen: notifRes.unread === 0,
        unreadNotifications: notifRes.unread,
        portfolioTotals: totals,
        loadErrors,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setToken(null);
        setState({ ...emptyState(), loading: false });
        return;
      }
      reportError(e, "Couldn't load your account.");
      setState((s) => ({ ...s, loading: false }));
    }
  }, [reportError]);

  // Deferred to a macrotask: refresh() sets state on the no-session path, and doing that
  // synchronously inside the effect body causes a cascading render.
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) void refresh();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [refresh]);

  /* ------------------------------ routing -------------------------------- */

  const route = history[history.length - 1]!;
  const canBack = history.length > 1;
  const activeTab =
    TAB_SCREENS.find((t) => t === route.screen) ??
    ([
      "onboard",
      "login",
      "fund",
      "payment",
      "success",
      "redeem",
      "orderDetail",
      "sips",
      "profile",
      "notifications",
      "cart",
      "wallet",
    ].includes(route.screen)
      ? "home"
      : route.screen);

  const go = useCallback((screen: ScreenName, params?: Record<string, unknown>) => {
    setHistory((h) => [...h, { screen, params }]);
  }, []);

  const switchTab = useCallback((screen: ScreenName) => setHistory([{ screen }]), []);
  const back = useCallback(() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)), []);

  /* ------------------------------ catalogue ------------------------------ */

  const searchFunds = useCallback(async (query: string, signal?: AbortSignal): Promise<Fund[]> => {
    const res = await api.funds.list({ q: query || undefined, sort: "aum", limit: 50 }, signal);
    return cacheFunds(res.results);
  }, []);

  const loadFund = useCallback(async (isin: string): Promise<Fund | undefined> => {
    const hit = fundCache.get(isin);
    if (hit) return hit;
    try {
      const dto = await api.funds.get(isin);
      return cacheFunds([dto])[0];
    } catch {
      return undefined;
    }
  }, []);

  const loadConstraints = useCallback(async (isin: string): Promise<FundConstraints | null> => {
    try {
      const res = await api.funds.constraints(isin);
      // Fold the SIP minimum back into the cached fund so screens can read fund.minSip.
      const cached = fundCache.get(isin);
      if (cached) {
        const monthly = res.constraints.sip.frequencies.find((f) => f.type === "monthly");
        cached.minSip = monthly?.minAmount ?? null;
      }
      return res.constraints;
    } catch {
      return null;
    }
  }, []);

  /* -------------------------------- auth --------------------------------- */

  const requestOtp = useCallback(async (mobile: string) => {
    const res = await api.auth.requestOtp(mobile.replace(/\D/g, ""));
    return { devCode: res.devCode };
  }, []);

  const verifyOtp = useCallback(
    async (mobile: string, code: string) => {
      const res = await api.auth.verifyOtp(mobile.replace(/\D/g, ""), code);
      setToken(res.token);
      await refresh();
    },
    [refresh],
  );

  /**
   * Link this account to a Tarrakki investor by PAN.
   *
   * Returns the outcome rather than throwing when no investor exists — that is a normal state
   * for a new signup, and the caller needs `next` to decide where to send them. Only refreshes
   * when something was actually linked.
   */
  const linkInvestor = useCallback(
    async (pan: string): Promise<LinkResult> => {
      const res = await api.investor.link(pan.trim().toUpperCase());
      if (res.linked) await refresh();
      return res;
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    setToken(null);
    fundCache.clear();
    setState({ ...emptyState(), loading: false });
    setHistory([{ screen: "login" }]);
  }, []);

  /* ------------------------------- actions -------------------------------- */

  const completeOnboarding = useCallback((patch?: Partial<User>) => {
    // Upstream owns KYC state; this only reflects locally-collected profile bits.
    setState((prev) => ({ ...prev, user: { ...prev.user, ...patch } }));
  }, []);

  const placeInvestment = useCallback(
    async (draft: InvestDraft): Promise<Order> => {
      const fund = fundCache.get(draft.isin);
      if (!fund) throw new Error("Fund not found");

      if (draft.mode === "SIP") {
        // A SIP needs a registered mandate; pick the investor's first active one.
        const { results: mandates } = await api.investor.mandates();
        const mandate = mandates.find((m) => m.status !== "cancelled") ?? mandates[0];
        if (!mandate) {
          throw new ApiError(400, "You need a registered bank mandate before starting a SIP.");
        }
        const start = new Date();
        start.setMonth(start.getMonth() + 1);
        start.setDate(Math.min(draft.sipDay, 28));
        const startDate = start.toISOString().slice(0, 10);

        await api.orders.sip(
          {
            fund: fund.id,
            amount: draft.amount,
            mandateId: mandate.mandateId,
            startDate,
            frequency: "monthly",
          },
          idempotencyKey(),
        );
        await refresh();
        // SIPs surface under /sips, not /orders; return a record for the success screen,
        // which only needs the fund name, amount and start date.
        return {
          id: "SIP",
          fundId: fund.id,
          isin: fund.isin,
          fundName: fund.name,
          kind: "SIP",
          amount: draft.amount,
          units: null,
          nav: null,
          folio: null,
          status: "Pending",
          rawStatus: "pending",
          statusRemark: null,
          date: startDate,
          placedLabel: dateLabel(startDate),
        };
      }

      const res = await api.orders.buy({ fund: fund.id, amount: draft.amount }, idempotencyKey());
      await refresh();
      return toOrder(res.order);
    },
    [refresh],
  );

  const redeem = useCallback(
    async (isin: string, amount: number): Promise<Order> => {
      const fund = fundCache.get(isin);
      if (!fund) throw new Error("Fund not found");

      // Redemption is folio-scoped; find the holding being sold.
      const holding = state.holdings.find((h) => h.isin === isin || h.fundId === fund.id);
      if (!holding?.folio || holding.folio === "—") {
        throw new ApiError(400, "No folio found for this fund — nothing to redeem.");
      }

      const res = await api.orders.sell(
        { fund: fund.id, folio: holding.folio, amount },
        idempotencyKey(),
      );
      await refresh();
      return toOrder(res.order);
    },
    [refresh, state.holdings],
  );

  const cancelSip = useCallback(
    async (id: string) => {
      await api.systematic.cancel(id);
      await refresh();
    },
    [refresh],
  );

  /* ----------------------------- watchlists ------------------------------- */

  const isWatched = useCallback(
    (isin: string) => state.watchlists.some((w) => w.isins.includes(isin)),
    [state.watchlists],
  );

  const listsContaining = useCallback(
    (isin: string) => state.watchlists.filter((w) => w.isins.includes(isin)).map((w) => w.id),
    [state.watchlists],
  );

  const createWatchlist = useCallback(
    async (name: string) => {
      const res = await api.app.createWatchlist(name.trim());
      await refresh();
      return res.id;
    },
    [refresh],
  );

  const renameWatchlist = useCallback(
    async (id: string, name: string) => {
      await api.app.renameWatchlist(id, name.trim());
      await refresh();
    },
    [refresh],
  );

  const deleteWatchlist = useCallback(
    async (id: string) => {
      await api.app.deleteWatchlist(id);
      await refresh();
    },
    [refresh],
  );

  const addFundToList = useCallback(
    async (listId: string, isin: string) => {
      // Optimistic: watchlist membership drives a heart icon; a wrong flash is cheap and
      // refresh() reconciles. Money-moving actions above deliberately do not do this.
      setState((prev) => ({
        ...prev,
        watchlists: prev.watchlists.map((w) =>
          w.id === listId && !w.isins.includes(isin) ? { ...w, isins: [isin, ...w.isins] } : w,
        ),
      }));
      try {
        await api.app.addToWatchlist(listId, isin);
      } catch (e) {
        reportError(e, "Couldn't add to watchlist.");
      }
      await refresh();
    },
    [refresh, reportError],
  );

  const removeFundFromList = useCallback(
    async (listId: string, isin: string) => {
      setState((prev) => ({
        ...prev,
        watchlists: prev.watchlists.map((w) =>
          w.id === listId ? { ...w, isins: w.isins.filter((x) => x !== isin) } : w,
        ),
      }));
      try {
        await api.app.removeFromWatchlist(listId, isin);
      } catch (e) {
        reportError(e, "Couldn't remove from watchlist.");
      }
      await refresh();
    },
    [refresh, reportError],
  );

  const markNotificationsSeen = useCallback(() => {
    setState((prev) =>
      prev.notificationsSeen ? prev : { ...prev, notificationsSeen: true, unreadNotifications: 0 },
    );
    void api.app.markNotificationsSeen().catch(() => {});
  }, []);

  /* -------------------------------- cart ---------------------------------- */

  const addToCart = useCallback(
    async (isin: string, amount: number) => {
      setState((prev) =>
        prev.cart.some((c) => c.isin === isin) ? prev : { ...prev, cart: [{ isin, amount }, ...prev.cart] },
      );
      try {
        await api.app.setCartItem(isin, amount);
      } catch (e) {
        reportError(e, "Couldn't add to cart.");
        await refresh();
      }
    },
    [refresh, reportError],
  );

  const removeFromCart = useCallback(
    async (isin: string) => {
      setState((prev) => ({ ...prev, cart: prev.cart.filter((c) => c.isin !== isin) }));
      try {
        await api.app.removeCartItem(isin);
      } catch (e) {
        reportError(e, "Couldn't remove from cart.");
        await refresh();
      }
    },
    [refresh, reportError],
  );

  const setCartAmount = useCallback(
    async (isin: string, amount: number) => {
      setState((prev) => ({
        ...prev,
        cart: prev.cart.map((c) => (c.isin === isin ? { ...c, amount } : c)),
      }));
      try {
        await api.app.setCartItem(isin, amount);
      } catch (e) {
        reportError(e, "Couldn't update the amount.");
        await refresh();
      }
    },
    [refresh, reportError],
  );

  const clearCart = useCallback(async () => {
    setState((prev) => (prev.cart.length ? { ...prev, cart: [] } : prev));
    await api.app.clearCart().catch(() => {});
  }, []);

  const inCart = useCallback((isin: string) => state.cart.some((c) => c.isin === isin), [state.cart]);

  const checkoutCart = useCallback(async (): Promise<Order[]> => {
    const items = [...state.cart];
    const placed: Order[] = [];
    const failed: string[] = [];

    // Sequential, not parallel: each is a real order, and a partial failure should stop
    // rather than fan out more buys.
    for (const item of items) {
      const fund = fundCache.get(item.isin);
      if (!fund) continue;
      try {
        const res = await api.orders.buy({ fund: fund.id, amount: item.amount }, idempotencyKey());
        placed.push(toOrder(res.order));
        await api.app.removeCartItem(item.isin).catch(() => {});
      } catch (e) {
        failed.push(fund.name);
        reportError(e, `Couldn't place the order for ${fund.name}.`);
        break;
      }
    }

    await refresh();
    if (failed.length && placed.length) {
      toast(`${placed.length} order(s) placed; ${failed.length} could not be placed.`);
    }
    return placed;
  }, [state.cart, refresh, reportError, toast]);

  /* ------------------------------- wallet --------------------------------- */

  const addMoney = useCallback(
    async (amount: number) => {
      try {
        const res = await api.app.addMoney(amount, "Added to wallet");
        setState((prev) => ({ ...prev, wallet: res.balance }));
        await refresh();
      } catch (e) {
        reportError(e, "Couldn't add money.");
      }
    },
    [refresh, reportError],
  );

  const withdrawMoney = useCallback(
    async (amount: number) => {
      try {
        const res = await api.app.withdraw(amount, "Withdrawn to bank");
        setState((prev) => ({ ...prev, wallet: res.balance }));
        await refresh();
      } catch (e) {
        reportError(e, "Couldn't withdraw.");
      }
    },
    [refresh, reportError],
  );

  const spendFromWallet = useCallback(
    async (amount: number, label: string) => {
      try {
        const res = await api.app.withdraw(amount, label);
        setState((prev) => ({ ...prev, wallet: res.balance }));
      } catch (e) {
        reportError(e, "Couldn't debit the wallet.");
      }
    },
    [reportError],
  );

  const value = useMemo<Store>(
    () => ({
      route,
      canBack,
      activeTab,
      go,
      switchTab,
      back,
      state,
      funds,
      fundsLoading,
      fundByIsin,
      searchFunds,
      loadFund,
      loadConstraints,
      toasts,
      toast,
      requestOtp,
      verifyOtp,
      linkInvestor,
      logout,
      refresh,
      completeOnboarding,
      placeInvestment,
      redeem,
      cancelSip,
      isWatched,
      listsContaining,
      createWatchlist,
      renameWatchlist,
      deleteWatchlist,
      addFundToList,
      removeFundFromList,
      markNotificationsSeen,
      addToCart,
      removeFromCart,
      setCartAmount,
      clearCart,
      inCart,
      checkoutCart,
      addMoney,
      withdrawMoney,
      spendFromWallet,
    }),
    [
      route, canBack, activeTab, go, switchTab, back, state, funds, fundsLoading,
      searchFunds, loadFund, loadConstraints, toasts, toast, requestOtp, verifyOtp,
      linkInvestor, logout, refresh, completeOnboarding, placeInvestment, redeem, cancelSip,
      isWatched, listsContaining, createWatchlist, renameWatchlist, deleteWatchlist,
      addFundToList, removeFundFromList, markNotificationsSeen, addToCart, removeFromCart,
      setCartAmount, clearCart, inCart, checkoutCart, addMoney, withdrawMoney, spendFromWallet,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* --------------------------- derived helpers ----------------------------- */

export function portfolioTotals(holdings: Holding[]) {
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const current = holdings.reduce((s, h) => s + h.current, 0);
  const gain = current - invested;
  const returnPct = invested > 0 ? (gain / invested) * 100 : 0;
  return { invested, current, gain, returnPct };
}
