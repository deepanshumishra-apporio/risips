# risips — Investor App Prototype

A mobile-first, click-through prototype of a mutual-fund investing app (Groww / Zerodha / Paytm-Money style), built to show the full investor journey visually. **No backend, no database, no real APIs** — everything runs from static mock data and in-memory state, so it deploys anywhere as static files.

> risips · an Arthasuta platform · _"Mutual funds, simply."_

---

## 1. Tech

- **Next.js 16** (App Router) + **React 19** + **TypeScript**.
- **Client-side SPA routing** via a React context state machine (see [`app/lib/store.tsx`](app/lib/store.tsx)) — a history stack with `go / back / switchTab`. This keeps all in-memory state alive across screen transitions without a backend. (react-router was in the original brief; an in-memory router is used instead as it fits the no-backend, shared-state model far better and avoids fighting the App Router.)
- **State**: one in-memory store in React context. Persisted to `localStorage` (`risips.v1`) so a demo survives refresh.
- **Data**: a single [`app/lib/funds.json`](app/lib/funds.json) with 10 seeded Indian funds. No external fetches.
- **Styling**: hand-written flat design system in [`app/globals.css`](app/globals.css) using the brand tokens (no Tailwind classes in the UI). Fonts loaded via `<link>` (Sora, Instrument Sans, IBM Plex Mono) so the build never needs a network fetch.
- **Device frame**: the app is centered in an **iPhone 17 Pro** frame on desktop (Dynamic Island, titanium edge, side buttons, iOS status bar + home indicator) and goes edge-to-edge on real mobile.

### Run

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm start` (serve the build), `npm run lint`.

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
- **Toasts** ([`Toasts.tsx`](app/components/Toasts.tsx)) — feedback for every mock action.
- All "server actions" are `setTimeout` + a state change.

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
    funds.json          # 10 seeded Indian mutual funds
    store.tsx           # context store: router + state + all actions, localStorage
    format.ts           # ₹ / NAV / % / units / folio formatting
  components/            # Mark, Device (status bar/home indicator), BottomTabs,
                         # Chart, Sparkline, RiskMeter, AmcLogo, icons, ui,
                         # InvestSheet, SipCalculator, WatchlistSheet, AddFundsSheet,
                         # CartButton, Toasts
  screens/              # the 17 screens listed above
  info/                 # risips brand sheet (HTML)
```

### Data model (in-memory, persisted to `localStorage`)
`AppState` = `{ user, onboarded, holdings[], orders[], sips[], watchlists[], cart[], wallet, walletTxns[], notificationsSeen }`, mutated locally on invest / redeem / add-money / watchlist / cart actions.

---

## 5. Demo script

1. **Splash → Get started** → walk the 11-step onboarding (draw the signature, run the face scan, link a UPI app) → "You're all set".
2. **Home** → note the portfolio sparkline, market ticker, and wallet balance.
3. Open a **fund** → show the chart, risk-o-meter, and SIP calculator → **heart** it into a watchlist.
4. **Add to cart** a couple of funds → **Cart** → check out **from risips Balance** (instant, no UPI).
5. **Orders** → open an order → watch **Pending → Allotted** on the timeline.
6. **Portfolio** → returns in green → **Redeem** flow.
7. Close: _"This exact UI plugs into real MF APIs in the build phase — nothing here is throwaway."_

---
*risips · investor prototype · an Arthasuta platform. Mutual fund investments are subject to market risks.*
