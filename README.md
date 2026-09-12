# SapaProof — web app

Real frontend, wired to the `sapaproof-backend` service.

## Run it

**1. Start the backend first** (see `sapaproof-backend/README.md`):
```
cd sapaproof-backend
npm install
cp .env.example .env   # add your Mono keys (test_sk_/test_pk_ while KYB is pending)
npm run dev             # runs on :4000
```

**2. Start this web app:**
```
cd sapaproof-web
npm install
cp .env.example .env    # set VITE_API_BASE_URL and VITE_MONO_PUBLIC_KEY
npm run dev              # runs on :3000
```

Open http://localhost:3000. You'll land on an empty Dashboard — click **Load demo data** to see everything populated with realistic Nigerian numbers (GTBank, Zenith, Access, Bamboo, RiseVest, Cowrywise, PiggyVest, Kuda), or **Connect a bank account** to try the real Mono sandbox widget.

## Layout

Icon rail on the far left switches between seven views: **Dashboard**, **Transactions**, **Spending**, **Net Worth**, **Spending Plan**, **Investments**, **Savings Goals**. The **Accounts sidebar** next to it is always visible regardless of which view is active — click the "+" there to connect a bank or add a manual account.

## What's real vs. what's illustrative vs. what's a placeholder

**Real, computed from actual data:**
- Bank linking via Mono (sandbox mode; live mode needs KYB approval)
- Net worth math, USD→NGN conversion (official and parallel rate)
- Transaction categorization (keyword rules + Claude fallback for anything ambiguous)
- Investment gain/loss, once you enter what you originally invested (real subtraction, not simulated market data)
- Savings Goals — create, track, and update; a genuinely working feature, not a mockup

**Illustrative (clearly synthetic, ends at a real current total, but not real tracked history):**
- Net worth trend chart, and the Income/Spending 6-month bar charts. Real historical tracking needs a scheduled snapshot job writing to a database — not built yet (see below).
- "Planned" budget figures in Spending Plan / Top Spending — placeholder targets since there's no budget-setting UI yet.

**Known gaps, not hidden — stated outright in the Investments page too:**
- No per-holding stock data (shares, price, day change) — Bamboo/RiseVest/Cowrywise are pooled-fund platforms, not brokerages, and don't expose that.
- `getUserId()` in `src/api.js` fakes a logged-in user with a random browser-stored ID. No real login, no real auth check on the backend (`requireUser` just checks a header is present). Fine solo; not fine to open to real users as-is.

## Natural next steps, roughly in order of what unblocks the most

1. **Real auth** — swap the `x-user-id` stand-in for actual sessions/JWT.
2. **Persistent database** — `store.js` in the backend is in-memory and resets on every restart/redeploy. Move to Postgres.
3. **Real net worth/cash-flow history** — a daily snapshot job once there's a database to snapshot into.
4. **Budget-setting UI** — replace the hardcoded `PLANNED` figures in `routes/finance.js` with something the user actually sets.
5. **Mobile** — port screens to React Native once the web version is solid; the backend doesn't change at all.
