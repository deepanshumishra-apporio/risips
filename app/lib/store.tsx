"use client";

// In-memory app store + a lightweight screen router (context state machine).
// No backend: every "server action" is a setTimeout + state change.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import fundsData from "./funds.json";
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
import { folioFor } from "./format";

export const FUNDS = fundsData as Fund[];
export const fundByIsin = (isin: string) =>
  FUNDS.find((f) => f.isin === isin);

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

export const TAB_SCREENS: ScreenName[] = [
  "home",
  "explore",
  "wishlist",
  "orders",
  "portfolio",
];

/* --------------------------- invest draft -------------------------------- */

export interface InvestDraft {
  isin: string;
  amount: number;
  mode: "One-time" | "SIP";
  sipDay: number;
}

/* --------------------------- seed state ---------------------------------- */

const PLACED_LABELS = ["Placed today", "Placed today"];

function mkHolding(isin: string, invested: number, gainPct: number): Holding {
  const f = fundByIsin(isin)!;
  const current = Math.round(invested * (1 + gainPct / 100));
  return {
    isin,
    folio: folioFor(isin),
    units: +(invested / f.nav).toFixed(3),
    invested,
    current,
  };
}

function seedState(): AppState {
  // A pre-populated investor so every tab has something to show in the demo.
  const holdings: Holding[] = [
    mkHolding("INF109K01Z48", 50000, 12.4),
    mkHolding("INF090I01569", 24000, 9.1),
  ];
  const orders: Order[] = [
    {
      id: "ORD90241",
      isin: "INF109K01Z48",
      fundName: fundByIsin("INF109K01Z48")!.name,
      kind: "One-time",
      amount: 50000,
      units: holdings[0].units,
      status: "Allotted",
      placedAt: 0,
      placedLabel: "18 Jun 2026",
    },
    {
      id: "ORD90118",
      isin: "INF090I01569",
      fundName: fundByIsin("INF090I01569")!.name,
      kind: "SIP",
      amount: 2000,
      units: 24.35,
      status: "Allotted",
      placedAt: 0,
      placedLabel: "05 Jun 2026",
    },
  ];
  const sips: SIP[] = [
    {
      id: "SIP5501",
      isin: "INF090I01569",
      fundName: fundByIsin("INF090I01569")!.name,
      amount: 2000,
      day: 5,
      nextLabel: "5 Aug 2026",
      status: "Active",
    },
  ];
  return {
    user: {
      name: "Aarav Sharma",
      phone: "98765 43210",
      pan: "ABCDE1234F",
      bank: "HDFC Bank ••••4321",
      kycVerified: true,
      email: "aarav.sharma@gmail.com",
      dob: "14 Aug 1994",
      gender: "Male",
      address: "402, Sunrise Residency, Sector 54, Gurugram, Haryana 122002",
      occupation: "Private sector",
      income: "₹10–25 lakh",
      nomineeName: "Meera Sharma",
      nomineeRelation: "Spouse",
      signatureDone: true,
      faceVerified: true,
      biometricEnabled: true,
      upiApp: "Google Pay",
    },
    onboarded: false,
    holdings,
    orders,
    sips,
    watchlists: [
      { id: "wl1", name: "My Watchlist", isins: ["INF179K01BE2", "INF109K01Z48"] },
      { id: "wl2", name: "High growth", isins: ["INF204K01K15", "INF200K01LM6"] },
    ],
    cart: [{ isin: "INF204K01K15", amount: 5000 }],
    wallet: 12500,
    walletTxns: [
      { id: "w2", kind: "Invested", amount: 2500, label: "Nippon India Small Cap", when: "14 Jul 2026" },
      { id: "w1", kind: "Added", amount: 15000, label: "Added via Google Pay", when: "12 Jul 2026" },
    ],
    notificationsSeen: false,
  };
}

/* --------------------------- context ------------------------------------- */

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

  // toasts
  toasts: Toast[];
  toast: (message: string) => void;

  // actions (all mock)
  completeOnboarding: (patch?: Partial<User>) => void;
  placeInvestment: (draft: InvestDraft) => Order;
  redeem: (isin: string, amount: number) => Order;
  setSipStatus: (id: string, status: SIP["status"]) => void;
  cancelSip: (id: string) => void;
  isWatched: (isin: string) => boolean;
  listsContaining: (isin: string) => string[];
  createWatchlist: (name: string) => string;
  renameWatchlist: (id: string, name: string) => void;
  deleteWatchlist: (id: string) => void;
  addFundToList: (listId: string, isin: string) => void;
  removeFundFromList: (listId: string, isin: string) => void;
  markNotificationsSeen: () => void;

  // cart
  addToCart: (isin: string, amount: number) => void;
  removeFromCart: (isin: string) => void;
  setCartAmount: (isin: string, amount: number) => void;
  clearCart: () => void;
  inCart: (isin: string) => boolean;
  checkoutCart: () => Order[];

  // wallet
  addMoney: (amount: number) => void;
  withdrawMoney: (amount: number) => void;
  spendFromWallet: (amount: number, label: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

const STORAGE_KEY = "risips.v1";
const ALLOT_MS = 30_000; // Pending → Allotted after 30s (demo touch)

let orderSeq = 90300;
const nextOrderId = () => `ORD${orderSeq++}`;

let watchlistSeq = 3;
const nextWatchlistId = () => `wl${watchlistSeq++}`;

let walletTxnSeq = 100;
const nextWalletTxnId = () => `w${walletTxnSeq++}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Route[]>([{ screen: "splash" }]);
  const [state, setState] = useState<AppState>(seedState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tick, setTick] = useState(0); // forces re-eval of allotment on interval
  const nowRef = useRef(0);
  const toastSeq = useRef(0);

  // hydrate from localStorage (demo survives refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AppState;
        // merge over seed so fields added in newer versions get defaults
        setState({ ...seedState(), ...saved });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toast = useCallback((message: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2600);
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // interval: flip pending orders that have aged past ALLOT_MS
  useEffect(() => {
    nowRef.current = Date.now();
    const id = setInterval(() => {
      nowRef.current = Date.now();
      setState((prev) => {
        let changed = false;
        const orders = prev.orders.map((o) => {
          if (
            o.status === "Pending" &&
            o.placedAt > 0 &&
            nowRef.current - o.placedAt >= ALLOT_MS
          ) {
            changed = true;
            return { ...o, status: "Allotted" as const };
          }
          return o;
        });
        return changed ? { ...prev, orders } : prev;
      });
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const route = history[history.length - 1];
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

  const go = useCallback(
    (screen: ScreenName, params?: Record<string, unknown>) => {
      setHistory((h) => [...h, { screen, params }]);
    },
    []
  );

  const switchTab = useCallback((screen: ScreenName) => {
    // tabs reset the stack to that tab root
    setHistory([{ screen }]);
  }, []);

  const back = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }, []);

  const completeOnboarding = useCallback((patch?: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      onboarded: true,
      user: { ...prev.user, ...patch, kycVerified: true },
    }));
  }, []);

  const placeInvestment = useCallback((draft: InvestDraft): Order => {
    const f = fundByIsin(draft.isin)!;
    const boughtUnits = +(draft.amount / f.nav).toFixed(3);
    // fresh money is marked to today's 1-day NAV move (not flat)
    const marked = Math.round(draft.amount * (1 + f.navChange / 100));
    const order: Order = {
      id: nextOrderId(),
      isin: draft.isin,
      fundName: f.name,
      kind: draft.mode,
      amount: draft.amount,
      units: boughtUnits,
      status: "Pending",
      placedAt: Date.now(),
      placedLabel: "Placed just now",
    };

    setState((prev) => {
      // add/merge holding immediately so the portfolio reflects it
      const existing = prev.holdings.find((h) => h.isin === draft.isin);
      let holdings: Holding[];
      if (existing) {
        holdings = prev.holdings.map((h) =>
          h.isin === draft.isin
            ? {
                ...h,
                units: +(h.units + boughtUnits).toFixed(3),
                invested: h.invested + draft.amount,
                current: h.current + marked,
              }
            : h
        );
      } else {
        holdings = [
          ...prev.holdings,
          {
            isin: draft.isin,
            folio: folioFor(draft.isin),
            units: boughtUnits,
            invested: draft.amount,
            current: marked,
          },
        ];
      }

      // if SIP, register it
      let sips = prev.sips;
      if (draft.mode === "SIP") {
        sips = [
          {
            id: `SIP${5600 + prev.sips.length}`,
            isin: draft.isin,
            fundName: f.name,
            amount: draft.amount,
            day: draft.sipDay,
            nextLabel: nextSipLabel(draft.sipDay),
            status: "Active",
          },
          ...prev.sips,
        ];
      }

      return { ...prev, holdings, orders: [order, ...prev.orders], sips };
    });

    return order;
  }, []);

  const redeem = useCallback((isin: string, amount: number): Order => {
    const f = fundByIsin(isin)!;
    const soldUnits = +(amount / f.nav).toFixed(3);
    const order: Order = {
      id: nextOrderId(),
      isin,
      fundName: f.name,
      kind: "Redeem",
      amount,
      units: soldUnits,
      status: "Pending",
      placedAt: Date.now(),
      placedLabel: "Placed just now",
    };
    setState((prev) => {
      const holdings = prev.holdings
        .map((h) => {
          if (h.isin !== isin) return h;
          const ratio = Math.min(1, amount / h.current);
          const remaining = h.current - amount;
          if (remaining <= 1) return null; // fully redeemed
          return {
            ...h,
            units: +(h.units * (1 - ratio)).toFixed(3),
            invested: Math.round(h.invested * (1 - ratio)),
            current: Math.round(remaining),
          };
        })
        .filter(Boolean) as Holding[];
      return { ...prev, holdings, orders: [order, ...prev.orders] };
    });
    return order;
  }, []);

  const setSipStatus = useCallback((id: string, status: SIP["status"]) => {
    setState((prev) => ({
      ...prev,
      sips: prev.sips.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  }, []);

  const cancelSip = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sips: prev.sips.filter((s) => s.id !== id),
    }));
  }, []);

  const isWatched = useCallback(
    (isin: string) => state.watchlists.some((w) => w.isins.includes(isin)),
    [state.watchlists]
  );

  const listsContaining = useCallback(
    (isin: string) =>
      state.watchlists.filter((w) => w.isins.includes(isin)).map((w) => w.id),
    [state.watchlists]
  );

  const createWatchlist = useCallback((name: string) => {
    const id = nextWatchlistId();
    setState((prev) => ({
      ...prev,
      watchlists: [...prev.watchlists, { id, name: name.trim(), isins: [] }],
    }));
    return id;
  }, []);

  const renameWatchlist = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      watchlists: prev.watchlists.map((w) =>
        w.id === id ? { ...w, name: name.trim() } : w
      ),
    }));
  }, []);

  const deleteWatchlist = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      watchlists: prev.watchlists.filter((w) => w.id !== id),
    }));
  }, []);

  const addFundToList = useCallback((listId: string, isin: string) => {
    setState((prev) => ({
      ...prev,
      watchlists: prev.watchlists.map((w) =>
        w.id === listId && !w.isins.includes(isin)
          ? { ...w, isins: [isin, ...w.isins] }
          : w
      ),
    }));
  }, []);

  const removeFundFromList = useCallback((listId: string, isin: string) => {
    setState((prev) => ({
      ...prev,
      watchlists: prev.watchlists.map((w) =>
        w.id === listId ? { ...w, isins: w.isins.filter((x) => x !== isin) } : w
      ),
    }));
  }, []);

  const markNotificationsSeen = useCallback(() => {
    setState((prev) =>
      prev.notificationsSeen ? prev : { ...prev, notificationsSeen: true }
    );
  }, []);

  const addToCart = useCallback((isin: string, amount: number) => {
    setState((prev) =>
      prev.cart.some((c) => c.isin === isin)
        ? prev
        : { ...prev, cart: [{ isin, amount }, ...prev.cart] }
    );
  }, []);

  const removeFromCart = useCallback((isin: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((c) => c.isin !== isin),
    }));
  }, []);

  const setCartAmount = useCallback((isin: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((c) => (c.isin === isin ? { ...c, amount } : c)),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState((prev) => (prev.cart.length ? { ...prev, cart: [] } : prev));
  }, []);

  const inCart = useCallback(
    (isin: string) => state.cart.some((c) => c.isin === isin),
    [state.cart]
  );

  const checkoutCart = useCallback((): Order[] => {
    const items = state.cart;
    const placed = items.map((item) =>
      placeInvestment({
        isin: item.isin,
        amount: item.amount,
        mode: "One-time",
        sipDay: 5,
      })
    );
    clearCart();
    return placed;
  }, [state.cart, placeInvestment, clearCart]);

  const addMoney = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      wallet: prev.wallet + amount,
      walletTxns: [
        {
          id: nextWalletTxnId(),
          kind: "Added",
          amount,
          label: `Added via ${prev.user.upiApp ?? "UPI"}`,
          when: "Just now",
        },
        ...prev.walletTxns,
      ],
    }));
  }, []);

  const withdrawMoney = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      wallet: Math.max(0, prev.wallet - amount),
      walletTxns: [
        {
          id: nextWalletTxnId(),
          kind: "Withdrawn",
          amount,
          label: "To HDFC ••••4321",
          when: "Just now",
        },
        ...prev.walletTxns,
      ],
    }));
  }, []);

  const spendFromWallet = useCallback((amount: number, label: string) => {
    setState((prev) => ({
      ...prev,
      wallet: Math.max(0, prev.wallet - amount),
      walletTxns: [
        {
          id: nextWalletTxnId(),
          kind: "Invested",
          amount,
          label,
          when: "Just now",
        },
        ...prev.walletTxns,
      ],
    }));
  }, []);

  const value: Store = {
    route,
    canBack,
    activeTab,
    go,
    switchTab,
    back,
    state,
    toasts,
    toast,
    completeOnboarding,
    placeInvestment,
    redeem,
    setSipStatus,
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
  };

  // reference tick so lint keeps the interval-driven re-render meaningful
  void tick;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* --------------------------- derived helpers ----------------------------- */

function nextSipLabel(day: number): string {
  // demo-fixed reference month so labels are deterministic (no Date.now)
  return `${day} Aug 2026`;
}

export function portfolioTotals(holdings: Holding[]) {
  const invested = holdings.reduce((s, h) => s + h.invested, 0);
  const current = holdings.reduce((s, h) => s + h.current, 0);
  const gain = current - invested;
  const returnPct = invested > 0 ? (gain / invested) * 100 : 0;
  // simple synthetic XIRR, a touch above absolute return
  const xirr = returnPct > 0 ? returnPct * 1.18 : returnPct;
  return { invested, current, gain, returnPct, xirr };
}
