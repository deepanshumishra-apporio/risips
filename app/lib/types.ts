// Domain types for the risips prototype. All mock — no backend.

export type RiskLevel =
  | "Low"
  | "Low to Moderate"
  | "Moderate"
  | "Moderately High"
  | "High"
  | "Very High";

export interface Fund {
  isin: string;
  name: string;
  amc: string;
  /** two-letter mark shown in the AMC circle */
  amcShort: string;
  category: string;
  risk: RiskLevel;
  nav: number;
  /** 1-day NAV change in percent */
  navChange: number;
  returns: { "1y": number; "3y": number; "5y": number };
  rating: number;
  expense: number;
  aumCr: number;
  minSip: number;
  minLumpsum: number;
  tags: string[];
  /** ~24 monthly NAV points, oldest → newest */
  chart: number[];

  /* --- extended detail --- */
  objective: string;
  manager: string;
  launched: string;
  benchmark: string;
  exitLoad: string;
  lockIn: string;
}

export interface Holding {
  isin: string;
  folio: string;
  units: number;
  invested: number;
  /** current market value */
  current: number;
}

export type OrderStatus = "Pending" | "Allotted" | "Redeemed";
export type OrderKind = "One-time" | "SIP" | "Redeem";

export interface Order {
  id: string;
  isin: string;
  fundName: string;
  kind: OrderKind;
  amount: number;
  units: number;
  status: OrderStatus;
  /** epoch ms when placed — drives the Pending→Allotted flip */
  placedAt: number;
  /** human date label, precomputed (no Date.now in render paths) */
  placedLabel: string;
}

export interface SIP {
  id: string;
  isin: string;
  fundName: string;
  amount: number;
  /** monthly debit day, 1–28 */
  day: number;
  nextLabel: string;
  status: "Active" | "Paused";
}

export interface User {
  name: string;
  phone: string;
  pan: string;
  bank: string;
  kycVerified: boolean;
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
  upiApp?: string;
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
  holdings: Holding[];
  orders: Order[];
  sips: SIP[];
  /** user-created named watchlists */
  watchlists: Watchlist[];
  /** planned one-time investments awaiting checkout */
  cart: CartItem[];
  /** in-app money balance (₹) usable for investing */
  wallet: number;
  walletTxns: WalletTxn[];
  /** cleared once the user opens the notifications screen */
  notificationsSeen: boolean;
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
