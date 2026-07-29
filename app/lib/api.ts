"use client";

// Typed client for the mutual-fund backend (see ../../backend).
//
// The backend is the only thing this app talks to. It brokers Tarrakki on the server so
// the client credentials never reach the browser.

import type { Fund, RiskLevel } from "./types";

/**
 * Where API calls go.
 *
 * Empty by default, meaning requests are same-origin (`/api/...`) and get proxied to the real
 * backend by the rewrites in next.config.ts. That makes CORS a non-issue: the browser never
 * talks to another origin, so a new deployment domain or Vercel preview URL can't break the
 * app. `BACKEND_URL` (server-side, in next.config.ts) chooses the upstream.
 *
 * Set NEXT_PUBLIC_API_URL to bypass the proxy and call a backend directly — useful when
 * running the frontend and backend separately in development. Doing so reintroduces CORS, so
 * that origin must be listed in the backend's CORS_ORIGIN.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const TOKEN_KEY = "risips.session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private browsing — session simply won't persist */
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestInitLike {
  method?: string;
  /**
   * JSON-serialised, unless it is a FormData — then it is sent as multipart and the browser
   * sets the boundary. The upload routes (bank document, NACH form, CAS) need the latter.
   */
  body?: unknown;
  headers?: Record<string, string>;
  /** Send the session token. Defaults to true when one exists. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestInitLike = {}): Promise<T> {
  const isMultipart = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  // Never set Content-Type for multipart: fetch must add its own boundary parameter.
  if (opts.body !== undefined && !isMultipart) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body:
        opts.body === undefined
          ? undefined
          : isMultipart
            ? (opts.body as FormData)
            : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ApiError(0, "Can't reach the server. Check that the backend is running.");
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!res.ok) {
    const err = (json as { error?: { message?: string; details?: unknown } })?.error;
    if (res.status === 401) setToken(null); // session is dead; force re-login
    throw new ApiError(res.status, err?.message ?? `Request failed (${res.status})`, err?.details);
  }

  return json as T;
}

/* ------------------------------ wire types -------------------------------- */

export interface FundDTO {
  id: string;
  isin: string | null;
  amfiCode: string | null;
  name: string;
  amc: string | null;
  amcId: string | null;
  amcShort: string;
  amcLogo: string | null;
  category: string | null;
  subCategory: string | null;
  schemeType: string | null;
  plan: string | null;
  option: string | null;
  status: string | null;
  nav: number | null;
  navDate: string | null;
  /** Day-on-day NAV change, %. Real, from AMFI. */
  navChange: number | null;
  /** Count of real NAV observations; 0 means AMFI has no data for this fund. */
  navPoints: number;
  aumCr: number | null;
  returns: { "6m": number | null; "1y": number | null; "3y": number | null; "5y": number | null };
  minLumpsum: number | null;
  minAdditional: number | null;
  tags: string[];
}

/** One real NAV observation. */
export interface NavPoint {
  /** YYYY-MM-DD. */
  date: string;
  nav: number;
}

export type NavRange = "1m" | "6m" | "1y" | "3y" | "5y" | "max";

export interface NavHistoryDTO {
  fundId: string;
  isin: string | null;
  range: NavRange;
  /** Always "amfi" — the official Indian NAV publisher. */
  source: string;
  /** Change across the returned window, %. Not the same as the day-on-day navChange. */
  changePct: number | null;
  latest: { nav: number | null; navDate: string | null; navChange: number | null };
  count: number;
  /** Oldest → newest. Empty when AMFI does not cover this fund. */
  series: NavPoint[];
}

/** Map the wire shape onto the app's Fund model. */
export function toFund(d: FundDTO): Fund {
  return {
    id: d.id,
    isin: d.isin ?? d.id,
    name: d.name,
    amc: d.amc ?? "—",
    amcShort: d.amcShort,
    amcLogo: d.amcLogo,
    category: d.category ?? "—",
    subCategory: d.subCategory,
    schemeType: d.schemeType,
    plan: d.plan,
    option: d.option,
    nav: d.nav,
    navDate: d.navDate,
    aumCr: d.aumCr,
    returns: {
      "6m": d.returns["6m"],
      "1y": d.returns["1y"],
      "3y": d.returns["3y"],
      // Real, annualised from AMFI history by the backend.
      "5y": d.returns["5y"] ?? null,
    },
    minLumpsum: d.minLumpsum,
    minAdditional: d.minAdditional,
    // SIP minimum comes from the live constraints call, not the catalogue.
    minSip: null,
    tags: d.tags,
    // Real, from AMFI.
    navChange: d.navChange ?? null,
    navPoints: d.navPoints ?? 0,
    // Not exposed by this Tarrakki tenant — see FundDetail for how these render.
    risk: null as RiskLevel | null,
    rating: null,
    expense: null,
    objective: null,
    manager: null,
    launched: null,
    benchmark: null,
    exitLoad: null,
    lockIn: null,
  };
}

export interface FundConstraints {
  buy: { allowed: boolean; min: number | null; max: number | null; multiples: number | null; additional: number | null };
  sell: { allowed: boolean; min: number | null; minUnits: number | null; multiples: number | null };
  sip: {
    allowed: boolean;
    frequencies: Array<{
      type: string;
      minAmount: number | null;
      maxAmount: number | null;
      multiples: number | null;
      minInstallments: number | null;
      maxInstallments: number | null;
      allowedDates: number[];
    }>;
  };
}

export interface OrderDTO {
  id: string;
  bseOrderId: string | null;
  fundId: string;
  fundName: string;
  orderType: string;
  amount: number | null;
  units: number | null;
  nav: number | null;
  navDate: string | null;
  folio: string | null;
  status: string;
  statusRemark: string | null;
  date: string;
  mandateId: string | null;
}

export interface SipDTO {
  id: string;
  fundId: string;
  fundName: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
  installments: number;
  folio: string | null;
  mandateId: string | null;
  status: string;
  date: string;
}

export interface InvestorDTO {
  id: string;
  email: string;
  mobile: string;
  pan: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  gender?: string;
  address?: Record<string, string>;
  fatca_detail?: Record<string, string>;
}

export interface BankDTO {
  bankId: string;
  accountType: string;
  /** Only the last four digits — the backend never sends the full number to the browser. */
  accountNumberMasked: string;
  ifsc: string;
  /** Populated by the detail endpoint; null when read from the list. */
  status: string | null;
  statusRemark: string | null;
}

export type MandateType = "nach" | "enach" | "upi";

export interface MandateDTO {
  mandateId: string;
  bankId: string;
  mandateType: string;
  autoDebitLimit: number;
  status: string;
  statusRemark: string | null;
  /** Where to send the investor to authorise an eNACH mandate, when upstream supplies one. */
  redirectionUrl: string | null;
  /** Only a physical `nach` mandate has a form to download. */
  nachDownloadable: boolean;
}

export interface NomineeDTO {
  id: string;
  name: string;
  relation: string;
  otherRelation: string | null;
  share: number;
  minor: boolean;
  dob: string | null;
  guardianName: string | null;
  identityType: string | null;
  email: string | null;
  mobileNumber: string | null;
}

/** A nominee as submitted. Shares across all nominees must total exactly 100. */
export interface NomineeInput {
  name: string;
  relation: "spouse" | "son" | "daughter" | "mother" | "father" | "brother" | "sister" | "others";
  other_relation?: string;
  share: number;
  identity_type: "pan" | "aadhar" | "driving_license" | "passport";
  identity_value: string;
  email: string;
  mobile_number: string;
  minor: boolean;
  dob?: string;
  guardian_name?: string;
}

/** STP and SWP share a shape; `type` says which. */
export interface SystematicDTO {
  id: string;
  type: "stp" | "swp";
  fundId: string;
  fundName: string | null;
  /** STP only — the scheme money moves into. */
  toFundId: string | null;
  toFundName: string | null;
  amount: number | null;
  units: number | null;
  frequency: string;
  startDate: string;
  endDate: string | null;
  installments: number | null;
  folio: string | null;
  status: string;
  date: string;
}

export interface BulkOrderDTO {
  id: string;
  date: string;
  status: string;
  euin: string | null;
  /** Child orders. Empty until upstream has broken the basket out. */
  orders: Array<{
    orderId: string | null;
    orderType: string | null;
    fundId: string | null;
    fundName: string | null;
    folio: string | null;
    amount: number | null;
    units: number | null;
    status: string | null;
    statusRemark: string | null;
    date: string | null;
  }>;
}

export interface PaymentDTO {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  /** UPI only: `intent` or `qr`. */
  mode: string | null;
  /** Order ids this payment settles. */
  orderIds: string[];
  /**
   * Where to send the investor to complete payment — a UPI intent link, a netbanking
   * redirect, or a QR payload. Normalised across methods by the backend.
   */
  actionUrl: string | null;
  /** QR payload when mode is `qr`. */
  qr: string | null;
  createdAt: string | null;
}

export interface KycStatusDTO {
  pan: string;
  /** Upstream's own value, e.g. "validated" | "pending". */
  status: string;
  /** True when the investor can transact without further KYC. */
  verified: boolean;
  /** What to do next, so the UI need not hard-code status strings. */
  action: "none" | "start_kyc";
}

/**
 * Purposes for a Tarrakki 2FA challenge. `nominee` is the one the app needs: nominee writes
 * are OTP-gated upstream regardless of authenticator mode.
 */
export type OtpType =
  | "nominee"
  | "buy_order"
  | "sell_order"
  | "sip_order"
  | "switch_order"
  | "stp_order"
  | "swp_order"
  | "cgs"
  | "redemption"
  | "cart"
  | "bulk_order";

export interface WalletTxnDTO {
  id: string;
  kind: string;
  amount: number;
  label: string;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

/* -------------------------------- endpoints -------------------------------- */

/**
 * Choose a wire format for a payload that may carry a file.
 *
 * With no file this stays JSON, which keeps the common case (registering a bank with no
 * document) exactly as it was. With a file it becomes multipart. The backend accepts either
 * on these routes and always talks multipart upstream.
 */
function toBody<T extends Record<string, unknown>>(body: T): T | FormData {
  const hasFile = Object.values(body).some(
    (v) => typeof File !== "undefined" && v instanceof File,
  );
  if (!hasFile) {
    // Drop undefined keys so they don't serialise as nulls.
    return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) as T;
  }

  const fd = new FormData();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (v instanceof File) fd.set(k, v, v.name);
    else fd.set(k, String(v));
  }
  return fd;
}

export const api = {
  health: () => request<{ status: string; catalogue: { funds: number } }>("/health", { auth: false }),

  auth: {
    requestOtp: (mobile: string) =>
      request<{ otpId: string; devCode?: string; expiresInSeconds: number }>(
        "/api/auth/otp/request",
        { method: "POST", body: { mobile }, auth: false },
      ),
    verifyOtp: (mobile: string, code: string) =>
      request<{
        token: string;
        user: { id: string; mobile: string; name: string | null; investorId: string | null; onboarded: boolean };
      }>("/api/auth/otp/verify", { method: "POST", body: { mobile, code }, auth: false }),
    me: () =>
      request<{
        user: {
          id: string;
          mobile: string;
          name: string | null;
          email: string | null;
          pan: string | null;
          investorId: string | null;
          walletBalance: number;
          onboarded: boolean;
        };
        investor: InvestorDTO | null;
        investorStatus: string | null;
      }>("/api/auth/me"),
    logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  },

  funds: {
    list: (params: {
      q?: string;
      category?: string;
      subCategory?: string;
      amcId?: string;
      sort?: "name" | "return_1y" | "return_3y" | "aum" | "nav";
      limit?: number;
      offset?: number;
    } = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
      return request<{ count: number; limit: number; offset: number; results: FundDTO[] }>(
        `/api/funds?${qs}`,
        { auth: false, signal },
      );
    },
    get: (idOrIsin: string) => request<FundDTO>(`/api/funds/${encodeURIComponent(idOrIsin)}`, { auth: false }),
    /**
     * Real NAV history from AMFI, for the fund chart. Returns an empty `series` for the ~100
     * funds AMFI doesn't cover — callers must render that as "unavailable", not as a flat line.
     */
    navHistory: (idOrIsin: string, range: NavRange = "3y", points = 120, signal?: AbortSignal) =>
      request<NavHistoryDTO>(
        `/api/funds/${encodeURIComponent(idOrIsin)}/nav-history?range=${range}&points=${points}`,
        { auth: false, signal },
      ),
    constraints: (idOrIsin: string) =>
      request<{ fundId: string; isin: string | null; constraints: FundConstraints }>(
        `/api/funds/${encodeURIComponent(idOrIsin)}/constraints`,
        { auth: false },
      ),
    categories: () =>
      request<{
        categories: Array<{ name: string; count: number }>;
        subCategories: Array<{ category: string; name: string; count: number }>;
      }>("/api/funds/categories", { auth: false }),
  },

  amcs: {
    list: () =>
      request<{ count: number; results: Array<{ id: string; name: string; short: string; logo: string | null; fundCount: number }> }>(
        "/api/amcs",
        { auth: false },
      ),
  },

  investor: {
    /**
     * Link this account to an existing Tarrakki investor by PAN.
     *
     * A PAN with no investor is a normal outcome, not an error: `linked` comes back false with
     * `next` saying what to do — `create_investor` when the PAN is already KYC-verified, or
     * `start_kyc` when it isn't. Callers must check `linked` rather than assuming success.
     */
    link: (pan: string) =>
      request<{
        linked: boolean;
        pan: string;
        investorId?: string;
        reason?: "no_investor";
        kycStatus?: string;
        kycVerified?: boolean;
        next?: "create_investor" | "start_kyc";
        message?: string;
      }>("/api/investor/link", { method: "POST", body: { pan } }),
    create: (body: Record<string, unknown>) =>
      request<{ investor: InvestorDTO }>("/api/investor", { method: "POST", body }),
    get: () =>
      request<{ investor: InvestorDTO; status: string; messages: string[] }>("/api/investor"),
    banks: () => request<{ count: number; results: BankDTO[] }>("/api/investor/banks"),
    bank: (bankId: string) =>
      request<{ bank: BankDTO }>(`/api/investor/banks/${encodeURIComponent(bankId)}`),
    /**
     * Register a bank. Pass a `file` to attach a cancelled cheque or statement — the request
     * then goes up as multipart, which is what Tarrakki requires for a document.
     */
    addBank: (body: {
      account_number: string;
      ifsc: string;
      account_type?: string;
      verification_document?: "cancelled_cheque" | "bank_statement";
      file?: File;
    }) =>
      request<{ bank: BankDTO }>("/api/investor/banks", {
        method: "POST",
        body: toBody(body),
      }),
    updateBank: (
      bankId: string,
      body: {
        account_number: string;
        ifsc: string;
        account_type?: string;
        verification_document?: "cancelled_cheque" | "bank_statement";
        file?: File;
      },
    ) =>
      request<{ bank: BankDTO }>(`/api/investor/banks/${encodeURIComponent(bankId)}`, {
        method: "PUT",
        body: toBody(body),
      }),

    nominees: () => request<{ count: number; results: NomineeDTO[] }>("/api/investor/nominees"),
    /**
     * Add nominees. Requires a verified `authRef` from the OTP flow — see `api.otp`. Shares
     * across `nominees` must total exactly 100.
     */
    addNominees: (body: { authRef: string; nominees: NomineeInput[]; nominationOptIn?: boolean }) =>
      request<{ nominee: unknown }>("/api/investor/nominees", { method: "POST", body }),
    /** Replace the whole nominee set. Same OTP requirement as addNominees. */
    replaceNominees: (body: { authRef: string; nominees: NomineeInput[]; nominationOptIn?: boolean }) =>
      request<{ nominee: unknown }>("/api/investor/nominees", { method: "PUT", body }),

    mandates: () => request<{ count: number; results: MandateDTO[] }>("/api/investor/mandates"),
    mandate: (mandateId: string) =>
      request<{ mandate: MandateDTO }>(`/api/investor/mandates/${encodeURIComponent(mandateId)}`),
    createMandate: (body: {
      bank_id: string;
      auto_debit_limit: number;
      mandate_type?: MandateType;
      /** Required for a `upi` mandate. */
      upi_id?: string;
      /** Where to return the investor after they authorise an `enach` mandate. */
      callback_url?: string;
    }) => request<{ mandate: MandateDTO }>("/api/investor/mandates", { method: "POST", body }),
    /**
     * Link to the physical NACH form. Only valid for a `nach` mandate (check
     * `nachDownloadable`), and the URL expires about a minute after it is issued.
     */
    mandateNachUrl: (mandateId: string) =>
      request<{ downloadUrl: string; expiresInSeconds: number }>(
        `/api/investor/mandates/${encodeURIComponent(mandateId)}/nach`,
      ),
    uploadMandateNach: (mandateId: string, file: File) =>
      request<{ uploaded: boolean }>(
        `/api/investor/mandates/${encodeURIComponent(mandateId)}/nach`,
        { method: "PUT", body: toBody({ file }) },
      ),

    /** Import externally-held holdings from a password-protected CAS PDF. */
    uploadCas: (file: File, password: string) =>
      request<{ cas: unknown }>("/api/investor/cas", {
        method: "POST",
        body: toBody({ file, password }),
      }),
    portfolio: () =>
      request<{
        holdings: Array<Record<string, unknown>>;
        totals: { invested: number; current: number; gain: number; returnPct: number };
      }>("/api/investor/portfolio"),
    virtualAccount: () =>
      request<{ virtual_account_id: string; beneficiary_name: string; ifsc: string }>(
        "/api/investor/virtual-account",
      ),
  },

  orders: {
    list: (limit = 50) => request<{ count: number; results: OrderDTO[] }>(`/api/orders?limit=${limit}`),
    get: (id: string) => request<OrderDTO>(`/api/orders/${encodeURIComponent(id)}`),
    buy: (body: { fund: string; amount: number; folio?: string; mandateId?: string }, key: string) =>
      request<{ order: OrderDTO; replayed: boolean }>("/api/orders/buy", {
        method: "POST",
        body,
        headers: { "Idempotency-Key": key },
      }),
    sell: (
      body: { fund: string; folio: string; amount?: number; units?: number; allUnits?: boolean; bankId?: string },
      key: string,
    ) =>
      request<{ order: OrderDTO; replayed: boolean }>("/api/orders/sell", {
        method: "POST",
        body,
        headers: { "Idempotency-Key": key },
      }),
    sip: (
      body: {
        fund: string;
        amount: number;
        mandateId: string;
        startDate: string;
        frequency?: string;
        installments?: number;
        firstOrderToday?: boolean;
      },
      key: string,
    ) =>
      request<{ sipOrderId: string; replayed: boolean }>("/api/orders/sip", {
        method: "POST",
        body,
        headers: { "Idempotency-Key": key },
      }),
    /** Cancel a pending order. Only possible before the exchange cut-off. */
    cancel: (id: string) =>
      request<{ cancelled: boolean }>(`/api/orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  },

  /**
   * Baskets — several buy/sell/SIP legs submitted together, which is how a multi-fund cart
   * checkout maps onto Tarrakki. Child order ids appear on the detail route once upstream
   * has broken the basket out, so poll `get` after placing.
   */
  bulkOrders: {
    list: (limit = 20) =>
      request<{ count: number; results: BulkOrderDTO[] }>(`/api/bulk-orders?limit=${limit}`),
    get: (id: string) => request<BulkOrderDTO>(`/api/bulk-orders/${encodeURIComponent(id)}`),
    place: (
      legs: Array<
        | { orderType: "buy"; fund: string; amount: number; folio?: string }
        | {
            orderType: "sell";
            fund: string;
            folio: string;
            amount?: number;
            units?: number;
            allUnits?: boolean;
          }
        | {
            orderType: "sip";
            fund: string;
            amount: number;
            mandateId: string;
            startDate: string;
            frequency?: "weekly" | "monthly" | "quarterly";
            installments?: number;
            firstOrderToday?: boolean;
            folio?: string;
          }
      >,
      key: string,
    ) =>
      request<{ bulkOrder: BulkOrderDTO | { id: string }; replayed: boolean }>("/api/bulk-orders", {
        method: "POST",
        body: { legs },
        headers: { "Idempotency-Key": key },
      }),
  },

  systematic: {
    sips: () => request<{ count: number; results: SipDTO[] }>("/api/systematic/sips"),
    stps: () => request<{ count: number; results: SystematicDTO[] }>("/api/systematic/stps"),
    swps: () => request<{ count: number; results: SystematicDTO[] }>("/api/systematic/swps"),
    /**
     * Cancel a SIP, STP or SWP. The backend works out which it is and which upstream
     * endpoint applies. Tarrakki has no pause/resume — cancellation is the only option.
     */
    cancel: (id: string) =>
      request<{ cancelled: boolean; type: "sip" | "stp" | "swp" }>(
        `/api/systematic/${encodeURIComponent(id)}/cancel`,
        { method: "POST" },
      ),
  },

  /**
   * Tarrakki's own 2FA, distinct from `api.auth` (this app's login OTP). The code goes to
   * the investor's registered mobile and email; the returned `authRef` is what gated writes
   * such as nominee changes require.
   */
  otp: {
    send: (otpType: OtpType, opts: { fund?: string; folio?: string } = {}) =>
      request<{
        authRef: string;
        otpType: OtpType;
        mobile: string | null;
        email: string | null;
        expiry: string | null;
      }>("/api/otp", { method: "POST", body: { otpType, ...opts } }),
    verify: (authRef: string, otpType: OtpType, code: string) =>
      request<{ verified: boolean; authRef: string }>(
        `/api/otp/${encodeURIComponent(authRef)}/verify`,
        { method: "POST", body: { otpType, code } },
      ),
    resend: (authRef: string) =>
      request<{ authRef: string }>(`/api/otp/${encodeURIComponent(authRef)}/resend`, {
        method: "POST",
      }),
  },

  payments: {
    banks: (method?: string) =>
      request<{ count: number; results: Array<{ name: string; type: string; payment_method: string[] }> }>(
        `/api/payments/banks${method ? `?method=${method}` : ""}`,
        { auth: false },
      ),
    list: () => request<{ count: number; results: PaymentDTO[] }>("/api/payments"),
    get: (id: string) => request<PaymentDTO>(`/api/payments/${encodeURIComponent(id)}`),
    /**
     * Settle placed orders.
     *
     * `amount` is optional and best omitted — the backend sums the orders' own amounts, and
     * rejects a supplied amount that disagrees with them. `neft_rtgs` is not creatable: for
     * that, show the investor their virtual account instead (`api.investor.virtualAccount`).
     */
    initiate: (body: {
      method: "upi" | "netbanking";
      /** Order ids. The backend verifies each belongs to you before charging anything. */
      orders: string[];
      bankId: string;
      /** UPI only, and required for it. */
      mode?: "intent" | "qr";
      amount?: number;
      callbackUrl?: string;
    }) =>
      request<{ payment: PaymentDTO; amount: number }>("/api/payments", { method: "POST", body }),
  },

  /**
   * Investor KYC. Separate from `api.auth` (login) and `api.otp` (order signing).
   *
   * Typical onboarding: `status()` first — if `action` is `start_kyc`, call `start()` and send
   * the investor to `kycUrl`. `verifyPan()` is the lighter check that a PAN exists and matches
   * a name and date of birth.
   */
  kyc: {
    /** Defaults to the session user's PAN when none is given. */
    status: (pan?: string) =>
      request<KycStatusDTO>(`/api/kyc${pan ? `?pan=${encodeURIComponent(pan)}` : ""}`),

    /**
     * Verify a PAN against the income-tax registry.
     *
     * This queries a government registry on a named individual, so consent is mandatory and
     * recorded — pass it only when the user has actually agreed on screen.
     */
    verifyPan: (body: {
      pan: string;
      name: string;
      dob: string;
      consent: true;
      fatherName?: string;
      /** 20–50 characters. Defaults server-side to a mutual-fund onboarding purpose. */
      consentPurpose?: string;
    }) => request<{ pan: string; verified: boolean }>("/api/kyc/pan-verification", { method: "POST", body }),

    /** Begin Tarrakki's hosted KYC journey. Send the investor to the returned `kycUrl`. */
    start: (body: {
      pan: string;
      name: string;
      email: string;
      mobile: string;
      /** Must be HTTPS. Where Tarrakki returns the investor afterwards. */
      callbackUrl?: string;
    }) =>
      request<{ alreadyVerified: boolean; pan: string; kycUrl?: string | null; status?: string }>(
        "/api/kyc/start",
        { method: "POST", body },
      ),
  },

  app: {
    watchlists: () =>
      request<{ results: Array<{ id: string; name: string; funds: FundDTO[] }> }>("/api/app/watchlists"),
    createWatchlist: (name: string) =>
      request<{ id: string; name: string }>("/api/app/watchlists", { method: "POST", body: { name } }),
    renameWatchlist: (id: string, name: string) =>
      request<{ ok: true }>(`/api/app/watchlists/${id}`, { method: "PATCH", body: { name } }),
    deleteWatchlist: (id: string) =>
      request<{ ok: true }>(`/api/app/watchlists/${id}`, { method: "DELETE" }),
    addToWatchlist: (id: string, fund: string) =>
      request<{ ok: true }>(`/api/app/watchlists/${id}/funds`, { method: "POST", body: { fund } }),
    removeFromWatchlist: (id: string, fund: string) =>
      request<{ ok: true }>(`/api/app/watchlists/${id}/funds/${encodeURIComponent(fund)}`, {
        method: "DELETE",
      }),

    cart: () => request<{ results: Array<{ amount: number; fund: FundDTO }>; total: number }>("/api/app/cart"),
    setCartItem: (fund: string, amount: number) =>
      request<{ ok: true }>("/api/app/cart", { method: "PUT", body: { fund, amount } }),
    removeCartItem: (fund: string) =>
      request<{ ok: true }>(`/api/app/cart/${encodeURIComponent(fund)}`, { method: "DELETE" }),
    clearCart: () => request<{ ok: true }>("/api/app/cart", { method: "DELETE" }),

    wallet: () => request<{ balance: number; transactions: WalletTxnDTO[] }>("/api/app/wallet"),
    addMoney: (amount: number, label?: string) =>
      request<{ balance: number }>("/api/app/wallet/add", { method: "POST", body: { amount, label } }),
    withdraw: (amount: number, label?: string) =>
      request<{ balance: number }>("/api/app/wallet/withdraw", { method: "POST", body: { amount, label } }),

    notifications: () =>
      request<{ results: NotificationDTO[]; unread: number }>("/api/app/notifications"),
    markNotificationsSeen: () =>
      request<{ ok: true }>("/api/app/notifications/seen", { method: "POST" }),
  },
};
