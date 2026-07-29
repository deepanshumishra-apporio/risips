# risips — Investor App

A mobile-first mutual-fund investing app (Groww / Zerodha / Paytm-Money style) covering the
full investor journey. It runs against **live Tarrakki data** through the companion
[`../backend`](../backend) service: ~5,900 real Indian funds, real NAVs and returns, real
KYC/investor records, and real order placement.

> risips · an Arthasuta platform · _"Mutual funds, simply."_

---

## 1. Tech

- **Next.js 16** (App Router) + **React 19** + **TypeScript**.
- **Client-side SPA routing** via a React context state machine (see [`app/lib/store.tsx`](app/lib/store.tsx)) — a history stack with `go / back / switchTab`. This keeps shared state alive across screen transitions and avoids fighting the App Router.
- **State**: one store in React context, hydrated from the backend on boot and refreshed after every mutation. The session token lives in `localStorage` (`risips.session`); nothing else is cached client-side, so the UI always reflects what upstream actually recorded.
- **Data**: [`app/lib/api.ts`](app/lib/api.ts) — a typed client for the backend. The Tarrakki credentials stay server-side and never reach the browser.
- **Styling**: hand-written flat design system in [`app/globals.css`](app/globals.css) using the brand tokens (no Tailwind classes in the UI). Fonts loaded via `<link>` (Sora, Instrument Sans, IBM Plex Mono) so the build never needs a network fetch.
- **Device frame**: the app is centered in an **iPhone 17 Pro** frame on desktop (Dynamic Island, titanium edge, side buttons, iOS status bar + home indicator) and goes edge-to-edge on real mobile.

### Run

The backend must be running first — see [`../backend/README.md`](../backend/README.md).

```bash
bun install
```

```bash
bun run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` if the backend isn't on `http://localhost:4000`.

Other scripts: `bun run build`, `bun start`, `bun run lint`.

### Logging in

Login is mobile + 6-digit OTP. There is no SMS provider wired up, so in development the
backend returns the code and the OTP screen displays it as **DEV CODE**. After verifying,
enter your PAN to link the Tarrakki investor record (the UAT tenant has one seeded investor,
PAN `HYMPM6020H`, mobile `8923890294`).

---

## 1a. Data that genuinely isn't available

The Tarrakki tenant this app is provisioned against serves the fund **catalogue** but masks
per-fund analytics. The following are **not available** and render as an em-dash rather than
an invented number:

riskometer · expense ratio · NAV history (so no performance chart) · 1-day NAV change ·
star ratings · 5Y returns · fund manager · benchmark · exit load · lock-in · sector
allocation · top holdings · category-average returns

This is deliberate. The earlier prototype filled these with plausible-looking sample values
— hardcoded sector splits, a fake "category average" computed as 86% of the fund's own
return, a synthetic XIRR of `returnPct × 1.18`, and static NIFTY/SENSEX levels. Fabricated
figures on an investing screen are worse than a blank, so they were removed rather than
carried over. What *is* shown — NAV, 6M/1Y/3Y returns, AUM, minimums, order limits — is real.

See [`../backend/README.md`](../backend/README.md) for exactly which upstream fields are
masked.

---

## 2. Brand tokens

```css
--ink:   #1A1A18;   /* primary text, buttons */
--paper: #F3F1EB;   /* app background */
--line:  #E5E1D6;   /* borders, dividers */
--mute:  #8C877C;   /* secondary text, labels */
--green: #1B6B4A;   /* THE accent — used sparingly */
--green-rev: #2EB77F;/* green on dark surfaces */
--red:   #C0392B;   /* negative returns only */
```

- **Fonts**: Sora (headings, numbers-as-heroes, the lowercase `risips` wordmark); Instrument Sans (body/UI); IBM Plex Mono (NAV, folio, returns, dates).
- **One point of green**: green is reserved for _money-positive moments_ — returns, success states, and the primary Invest CTA. Never chrome, nav, or decoration. (AMC brand colours are treated as _content_, like the fund data, and are exempt.)
- **Flat**: 1px borders, 12–16px card radius, pill buttons, no shadows/gradients on UI (the device frame is chrome and does use a shadow).
- The `risips` mark (single unbroken stroke + one green point) lives in [`app/components/Mark.tsx`](app/components/Mark.tsx); the full brand sheet is at [`app/info/risips-brand-sheet.html`](app/info/risips-brand-sheet.html).

---

## 3. Features / Screens

### Onboarding — an 11-step KYC wizard ([`Onboarding.tsx`](app/screens/Onboarding.tsx))
A realistic, SEBI/KRA-style flow with a progress bar and back navigation:
1. **Mobile number** (+91)
2. **OTP** — 4 boxes, auto-advance, any 4 digits pass
3. **PAN → instant KYC** — spinner → "KYC verified via CVL KRA", fetches name + DOB
4. **Personal details** — name, email, DOB, gender (auto-filled from KYC)
5. **Communication address** — Aadhaar-fetched, editable, with a declaration
6. **Income & occupation** — occupation chips, income-slab list, **FATCA/CRS** tax-residency declaration
7. **Nominee** — add (name + relationship + 100%) or an explicit opt-out
8. **Link bank via UPI** — GPay / PhonePe / Paytm / BHIM app chooser **or** a UPI-ID entry, with a ₹1 **penny-drop** verification and a verified-account card
9. **Signature** — a real draw-on-canvas **digital signature** pad (eSign)
10. **Face verification** — liveness / IPV mock with a scanning animation
11. **App lock** — enable **Face ID / fingerprint** biometric toggle
→ **"You're all set"** success with a verification checklist → Home.

Everything collected flows into the user profile.

### Home — dashboard ([`Home.tsx`](app/screens/Home.tsx))
Time-of-day greeting, a **compact portfolio summary** with a live **sparkline** (real value history) and today's move, a **wallet balance** strip, **quick-action tiles** (Invest · My SIPs · Watchlists · Wallet), a **market snapshot** (Nifty 50 / Sensex), Popular funds, your watchlists, Collections chips, and All funds. The avatar opens a **profile dropdown** (View profile · My SIPs · **Sign out**); the bell opens Notifications with an unread dot.

### Explore ([`Explore.tsx`](app/screens/Explore.tsx))
Search, category filter chips, sort (3Y / 1Y / fund size), full fund list.

### Fund detail ([`FundDetail.tsx`](app/screens/FundDetail.tsx))
AMC logo + rating, objective, NAV + 1D change, **SVG returns chart** (1Y/3Y/5Y toggle), trailing-returns table (fund vs category), stats grid, **SEBI risk-o-meter**, an interactive **SIP calculator**, fund basics (manager, benchmark, exit load, lock-in…), **sector allocation** bars, top holdings, tax implications, and **similar funds**. Header has **save-to-watchlist (heart)** and a **cart** icon; sticky bar has **Add-to-cart · One-time · Start SIP**.

### Invest → pay → success
- **Invest sheet** ([`InvestSheet.tsx`](app/components/InvestSheet.tsx)) — One-time / SIP toggle, amount chips, SIP date picker, a live "≈ units" estimate, and a **Pay using** selector (**risips Balance** or **UPI**).
- **Mock payment** ([`Payment.tsx`](app/screens/Payment.tsx)) — UPI approval screen, or an instant wallet debit.
- **Order success** ([`OrderSuccess.tsx`](app/screens/OrderSuccess.tsx)) — "units allotted in 1–2 working days".

### Cart ([`Cart.tsx`](app/screens/Cart.tsx))
Add funds from any fund page, adjust amounts with a ± stepper, remove items, see the total, and **check out all funds at once** (via UPI or wallet). Cart icon with a live count badge in the headers.

### Wallet — in-app balance ([`Wallet.tsx`](app/screens/Wallet.tsx))
**risips Balance**: **Add money** (via UPI) and **Withdraw** (to bank, T+1), a transaction ledger (Added / Invested / Withdrawn), and the balance is **usable to buy funds** directly at checkout.

### Watchlists — multiple named lists ([`Wishlist.tsx`](app/screens/Wishlist.tsx))
A **Watchlist tab in the footer**. Create / rename / delete named lists, switch between them via tabs, and **add funds yourself** either with the in-list **＋ Add funds** search picker ([`AddFundsSheet.tsx`](app/components/AddFundsSheet.tsx)) or the **heart** on any fund (which opens a save-to-watchlist picker, [`WatchlistSheet.tsx`](app/components/WatchlistSheet.tsx)) that also creates new lists inline.

### Orders ([`Orders.tsx`](app/screens/Orders.tsx)) & Order detail ([`OrderDetail.tsx`](app/screens/OrderDetail.tsx))
Order list with a pulsing **Pending** status that auto-flips to **Allotted** after ~30s. Tapping an order opens a full detail view: status banner, a **tracking timeline** (Placed → Payment → Allotted, or the redeem equivalent), the fund, and a complete order summary.

### Portfolio ([`Portfolio.tsx`](app/screens/Portfolio.tsx)) & Redeem ([`Redeem.tsx`](app/screens/Redeem.tsx))
Dark hero with **XIRR** badge, per-holding cards (units, invested, current, return %), and a **redeem** flow (amount → confirm → "money in your bank by T+3").

### SIPs ([`Sips.tsx`](app/screens/Sips.tsx))
Active SIP list with amount, next debit date, and pause / resume / cancel.

### Profile ([`Profile.tsx`](app/screens/Profile.tsx))
Identity + KYC-verified badge, account rows, full **KYC details** (address, occupation, income, nominee), a **verification** grid (KYC · Bank · Signature · Face · Biometric), and links to Wallet / SIPs / Watchlists / Orders.

### Cross-cutting
- **Notifications** ([`Notifications.tsx`](app/screens/Notifications.tsx)) — order / SIP / NAV / KYC alerts, some derived from live state.
- **Toasts** ([`Toasts.tsx`](app/components/Toasts.tsx)) — feedback for every action, including surfacing upstream error messages verbatim.
- Every action is a real API call. Failures leave you on the form with the reason shown; the success screen is only reached once upstream confirms.

---

## 4. Project structure

```
app/
  layout.tsx            # root layout, fonts, metadata
  page.tsx              # renders <App/>
  App.tsx               # StoreProvider + iPhone frame + screen router
  globals.css           # flat design system + all component styles
  lib/
    types.ts            # Fund, Holding, Order, SIP, User, Watchlist, WalletTxn, AppState…
    api.ts              # typed backend client + wire types + session token
    store.tsx           # context store: router + state + all actions, backed by the API
    format.ts           # ₹ / NAV / % / units / folio formatting (+ null-safe *Or variants)
  components/            # Mark, Device (status bar/home indicator), BottomTabs,
                         # Chart, Sparkline, RiskMeter, AmcLogo, icons, ui,
                         # InvestSheet, SipCalculator, WatchlistSheet, AddFundsSheet,
                         # CartButton, Toasts
  screens/              # the 17 screens listed above
  info/                 # risips brand sheet (HTML)
```

### Data model

`AppState` = `{ user, onboarded, authenticated, loading, holdings[], orders[], sips[],
watchlists[], cart[], wallet, walletTxns[], notificationsSeen, unreadNotifications,
portfolioTotals }`.

Where each slice comes from:

| Slice | Owner |
| --- | --- |
| Funds, AMCs | Tarrakki catalogue, mirrored in the backend's Postgres |
| Investor, KYC, banks, nominees, mandates | Tarrakki, read live |
| Orders, SIPs, portfolio | Tarrakki, read live — never cached |
| Watchlists, cart, wallet, notifications | App-owned, in the backend's Postgres |

Funds are keyed by ISIN in the UI (all 5,946 have a unique one) and by Tarrakki fund `id`
when placing orders. The store keeps a fund cache so screens can still look funds up
synchronously via `fundByIsin`.

**The wallet is an app-level ledger only — it does not move real money.** Real settlement
runs through the payments API against the investor's registered bank.

---

## 5. Walkthrough

1. **Splash → I already have an account** → enter the registered mobile → the OTP screen
   shows the **DEV CODE** → verify → enter PAN to link the Tarrakki investor.
2. **Home** → largest funds by AUM, real 3Y returns, live wallet balance.
3. **Explore** → search the full ~5,900-fund catalogue server-side; filter by real
   categories (Equity / Debt / Hybrid / Commodity / Global); sort by 3Y, 1Y or fund size.
4. Open a **fund** → real NAV, trailing returns, AUM, ISIN and live order limits pulled from
   the AMC's restrictions → **heart** it into a watchlist.
5. **Invest** → the sheet enforces the fund's real minimum, real SIP dates, and disables SIP
   entirely on funds that don't accept it.
6. **Orders** → real upstream orders with their actual status; units appear once the AMC
   allots them.
7. **Portfolio** → holdings and returns straight from Tarrakki.

---
*risips · an Arthasuta platform. Mutual fund investments are subject to market risks.*
