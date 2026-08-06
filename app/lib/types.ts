// Domain types. Backed by the real Tarrakki API via the local backend.
//
// Nullability is meaningful here. The Tarrakki tenant this app is provisioned against
// serves the fund *catalogue* but masks per-fund analytics (riskometer, expense ratio,
// ratings, manager, benchmark, exit load). Those fields are typed `| null` and render as an
// em-dash — they are never invented, because a made-up risk rating or return figure on an
// investing screen would be actively misleading.
//
// NAV data is the exception and is fully real: NAV, its day-on-day change, the 5-year return
// and the chart series all come from AMFI — the official Indian NAV publisher — mirrored by
// the backend's `nav:sync` job. A fund AMFI does not cover keeps `null`/empty and the UI
// says so rather than drawing a line.

export type RiskLevel =
  | "Low"
  | "Low to Moderate"
  | "Moderate"
  | "Moderately High"
  | "High"
  | "Very High";

export interface Fund {
  /** Tarrakki fund id — required when placing orders. */
  id: string;
  isin: string;
  name: string;
  amc: string;
  /** two-letter mark shown in the AMC circle */
  amcShort: string;
  amcLogo: string | null;
  category: string;
  subCategory: string | null;
  schemeType: string | null;
  plan: string | null;
  option: string | null;

  nav: number | null;
  navDate: string | null;
  /** AUM in ₹ crore */
  aumCr: number | null;
  returns: {
    "6m": number | null;
    "1y": number | null;
    "3y": number | null;
    /** Annualised from real AMFI history; null for funds with under ~5y of data. */
    "5y": number | null;
  };
  minLumpsum: number | null;
  minAdditional: number | null;
  /** Populated lazily from the live constraints endpoint, not the catalogue. */
  minSip: number | null;
  tags: string[];

  /* --- real, from AMFI --- */
  /** Day-on-day NAV change in percent. Null until two observations exist. */
  navChange: number | null;
  /** How many real NAV observations back this fund; 0 means AMFI doesn't cover it. */
  navPoints: number;

  /* --- masked by the current Tarrakki entitlement; always null --- */
  risk: RiskLevel | null;
  rating: number | null;
  expense: number | null;
  objective: string | null;
  manager: string | null;
  launched: string | null;
  benchmark: string | null;
  exitLoad: string | null;
  lockIn: string | null;
}

export interface Holding {
  isin: string;
  fundId: string;
  fundName: string;
  folio: string;
  units: number;
  invested: number;
  /** current market value */
  current: number;
}

export type OrderStatus = "Pending" | "Allotted" | "Redeemed" | "Failed" | "Cancelled";
/**
 * How the order was placed, as the transaction history groups them.
 *
 * "One-time" is a lumpsum buy, "Switch" covers switch and switch_in (moving money between
 * schemes without it leaving the platform), "Redeem" covers sell and swp. Upstream's
 * `stp` also arrives as a switch, since that is what it is — a scheduled switch.
 */
export type OrderKind = "One-time" | "SIP" | "Switch" | "Redeem";

export interface Order {
  id: string;
  isin: string;
  fundId: string;
  fundName: string;
  kind: OrderKind;
  amount: number | null;
  units: number | null;
  nav: number | null;
  folio: string | null;
  status: OrderStatus;
  /** raw upstream status, for detail screens */
  rawStatus: string;
  statusRemark: string | null;
  /** ISO date from upstream */
  date: string;
  placedLabel: string;
}

export interface SIP {
  id: string;
  isin: string;
  fundId: string;
  fundName: string;
  amount: number;
  frequency: string;
  /** monthly debit day, derived from startDate */
  day: number;
  startDate: string;
  nextLabel: string;
  installments: number;
  status: "Active" | "Paused" | "Cancelled";
}

export interface User {
  name: string;
  phone: string;
  pan: string;
  kycVerified: boolean;
  /** Tarrakki investor id, once linked. */
  investorId?: string | null;
  /** Upstream investor status, e.g. "ready_to_invest". */
  investorStatus?: string | null;
  email?: string;
  dob?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  income?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  signatureDone?: boolean;
  faceVerified?: boolean;
  biometricEnabled?: boolean;
}

/**
 * A bank the investor has registered upstream (GET /api/investor/banks).
 *
 * Note what is *not* here: the bank's display name. Tarrakki returns only the IFSC, so a
 * name has to be derived from it (see `bankLabel`) rather than invented.
 */
export interface Bank {
  bankId: string;
  accountType: string;
  /** Last four digits only; the backend never sends the full number to the browser. */
  accountNumberMasked: string;
  ifsc: string;
  /** Only the detail endpoint carries approval status; null when read from the list. */
  status: string | null;
}

export interface CartItem {
  isin: string;
  amount: number;
}

export interface Watchlist {
  id: string;
  name: string;
  isins: string[];
}

export interface WalletTxn {
  id: string;
  kind: "Added" | "Invested" | "Withdrawn";
  amount: number;
  label: string;
  when: string;
}

export interface AppState {
  user: User;
  onboarded: boolean;
  /** true once a session token is present and /me has resolved */
  authenticated: boolean;
  loading: boolean;
  holdings: Holding[];
  orders: Order[];
  sips: SIP[];
  watchlists: Watchlist[];
  cart: CartItem[];
  /** Banks registered upstream. Empty until the investor adds one — never assume [0] exists. */
  banks: Bank[];
  wallet: number;
  walletTxns: WalletTxn[];
  /** Whether the server accepts wallet top-ups. False until a payment gateway is live. */
  walletTopUp: boolean;
  notificationsSeen: boolean;
  unreadNotifications: number;
  portfolioTotals: { invested: number; current: number; gain: number; returnPct: number };
  /**
   * Per-slice load failures. An empty list plus an error here means "we couldn't fetch
   * this", which must not be rendered as "you have none" — the upstream order endpoint
   * does go down, and telling someone they have no orders when they have seventeen is
   * worse than saying nothing loaded.
   */
  loadErrors: { orders?: string; sips?: string; portfolio?: string; banks?: string };
}

export interface Toast {
  id: number;
  message: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  when: string;
  kind: "order" | "sip" | "nav" | "info";
}
