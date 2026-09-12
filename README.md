# SapaProof — web app

Real frontend, wired to the `sapaproof-backend` service — no more mock data.

## Run it

**1. Start the backend first** (see `sapaproof-backend/README.md` if you haven't already):
```
cd sapaproof-backend
npm install
cp .env.example .env   # add your Mono keys
npm run dev             # runs on :4000
```

**2. Start this web app:**
```
cd sapaproof-web
npm install
cp .env.example .env    # set VITE_MONO_PUBLIC_KEY (the public one, not secret)
npm run dev              # runs on :3000
```

Open http://localhost:3000. You'll land on an empty state — that's correct for a fresh user. Click **Connect a bank account** to run the real Mono widget in sandbox mode, or add a manual account (Bamboo, RiseVest, etc.) to see the net-worth math work.

## What's real vs. what's still a placeholder

- **Real**: bank linking via Mono, live balance fetch, USD→NGN conversion, transaction categorization (rules + Claude fallback), budget rollup by category.
- **Placeholder**: `getUserId()` in `src/api.js` fakes a logged-in user with a random ID stored in the browser. There's no login screen and no real auth check on the backend yet (see `requireUser` in the backend routes) — anyone who knows a user's ID could currently hit their endpoints. Fine for building solo against your own test accounts; not fine to deploy publicly as-is.
- **Not built yet**: net worth *history* (the sparkline from the earlier mockup) — `/api/finance/networth` only returns a current snapshot. To chart it over time you'd need to snapshot net worth to storage on some schedule (e.g. a daily cron job) and add an endpoint to read that history back.

## Natural next steps, roughly in order of what unblocks the most

1. **Real auth** — swap the `x-user-id` header stand-in for actual sessions/JWT before anyone but you touches this.
2. **Persistent database** — `store.js` in the backend is in-memory; move it to Postgres.
3. **Net worth history** — daily snapshot job + a history endpoint, to bring back the trend chart.
4. **Mobile** — once this is solid, port the screens to React Native. The backend doesn't change at all; only the frontend gets rebuilt with native components instead of DOM elements.
