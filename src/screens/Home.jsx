import React, { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { TrendingUp, Wallet, PieChart as PieIcon, Landmark } from "lucide-react";
import { api } from "../api.js";
import ConnectBankButton from "../ConnectBankButton.jsx";

function naira(n) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
function nairaCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return naira(n);
}

const CATEGORY_COLOR = {
  bank: "var(--accent-green)",
  investment: "var(--accent-gold)",
  savings: "var(--coral)",
  other: "var(--text-secondary)",
};

/** Shared shell every Home snapshot widget uses, so each reads as its own
 * distinct card — like Simplifi's Net Worth / Spending Plan / Watchlist
 * tiles — rather than one continuous scroll of sections. */
function SnapshotCard({ icon: Icon, title, children }) {
  return (
    <div className="snapshot-card">
      <div className="snapshot-header">
        <Icon size={16} />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function NetWorthSparkline({ history }) {
  if (!history || history.length < 2) return null;
  return (
    <div style={{ width: "100%", height: 72, marginTop: 4 }}>
      <ResponsiveContainer>
        <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin - 100000", "dataMax + 100000"]} />
          <Area
            type="monotone"
            dataKey="totalNgn"
            stroke="var(--accent-green)"
            strokeWidth={2.5}
            fill="url(#nwFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [rateMode, setRateMode] = useState("parallel");
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [seeding, setSeeding] = useState(false);

  async function load(mode) {
    setStatus("loading");
    try {
      const result = await api.getNetWorth(mode);
      setData(result);
      setStatus("ready");

      // Best-effort extras — a missing history or cash-flow figure
      // shouldn't block the core net worth card from showing.
      api.getNetWorthHistory().then((h) => setHistory(h.history)).catch(() => setHistory(null));

      const linked = await api.getLinkedAccounts().catch(() => ({ accounts: [] }));
      const accountId = linked.accounts[0] ? linked.accounts[0].monoAccountId : "demo";
      api.getBudgetSummary(accountId).then(setCashFlow).catch((err) => {
        console.error("cash flow snapshot failed to load:", err);
        setCashFlow(null);
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load(rateMode);
  }, [rateMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") return <div className="screen">Loading net worth…</div>;

  if (status === "error") {
    return (
      <div className="screen">
        <div className="empty-state">
          <p>Couldn't reach the backend. Is sapaproof-backend running on the URL in your .env?</p>
        </div>
      </div>
    );
  }

  const hasAccounts = data.accounts.length > 0;
  const topCategories = cashFlow
    ? Object.entries(cashFlow.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  return (
    <div className="screen">
      <div className="eyebrow-row">
        <span className="hello">Overview</span>
        <select
          className="rate-select"
          value={rateMode}
          onChange={(e) => setRateMode(e.target.value)}
        >
          <option value="parallel">Parallel rate</option>
          <option value="official">Official rate</option>
        </select>
      </div>

      {/* Snapshot 1: Net Worth */}
      <SnapshotCard icon={TrendingUp} title="Net Worth">
        <div className="hero-figure">{naira(data.totalNgn)}</div>
        <div className="hero-label">
          1 USD ≈ {naira(data.rateUsed.usdToNgn)} ({data.rateUsed.mode})
          {data.rateUsed.isEstimate && rateMode === "parallel" && (
            <span className="estimate-tag"> · estimated</span>
          )}
        </div>
        <NetWorthSparkline history={history} />
      </SnapshotCard>

      {!hasAccounts && (
        <div className="empty-state">
          <p>No accounts connected yet. Link a bank to see your real balances here.</p>
          <ConnectBankButton onLinked={() => load(rateMode)} />
          <p className="muted" style={{ marginTop: 14 }}>
            Waiting on Mono's business verification? Load sample data instead —
            everything else (net worth math, FX conversion) runs for real.
          </p>
          <button
            className="connect-cta"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              await api.seedDemo();
              await load(rateMode);
              setSeeding(false);
            }}
          >
            {seeding ? "Loading demo data…" : "Load demo data"}
          </button>
        </div>
      )}

      {/* Snapshot 2: Spending Plan */}
      {hasAccounts && cashFlow && (
        <SnapshotCard icon={Wallet} title="Spending Plan">
          <div className="budget-row" style={{ marginBottom: 14 }}>
            <div className="budget-top">
              <span className="budget-name">Income</span>
              <span className="budget-amounts" style={{ color: "var(--accent-green)" }}>
                {nairaCompact(cashFlow.totalIncome || 0)}
              </span>
            </div>
            <div className="flow-track">
              <div className="flow-fill" style={{ width: "100%", background: "var(--accent-green)" }} />
            </div>
          </div>
          <div className="budget-row" style={{ marginBottom: 0 }}>
            <div className="budget-top">
              <span className="budget-name">Spent</span>
              <span className="budget-amounts">{nairaCompact(cashFlow.totalSpent || 0)}</span>
            </div>
            <div className="flow-track">
              <div
                className="flow-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((cashFlow.totalSpent || 0) / (cashFlow.totalIncome || 1)) * 100)
                  )}%`,
                  background: "var(--accent-gold)",
                }}
              />
            </div>
          </div>
        </SnapshotCard>
      )}

      {/* Snapshot 3: Top Spending (mini preview of the Budget tab) */}
      {hasAccounts && topCategories.length > 0 && (
        <SnapshotCard icon={PieIcon} title="Top Spending">
          {topCategories.map(([category, amount]) => (
            <div className="budget-row" key={category}>
              <div className="budget-top">
                <span className="budget-name">{category}</span>
                <span className="budget-amounts">{nairaCompact(amount)}</span>
              </div>
              <div className="flow-track">
                <div
                  className="flow-fill"
                  style={{
                    width: `${Math.round((amount / topCategories[0][1]) * 100)}%`,
                    background: "var(--accent-green)",
                  }}
                />
              </div>
            </div>
          ))}
        </SnapshotCard>
      )}

      {/* Snapshot 4: Accounts breakdown */}
      {hasAccounts && (
        <SnapshotCard icon={Landmark} title="Accounts">
          <div className="breakdown-row">
            {data.accounts.map((a) => {
              const pct = Math.round((a.balanceNgn / data.totalNgn) * 100);
              return (
                <div className="breakdown-chip" key={a.id}>
                  <div
                    className="chip-dot"
                    style={{ background: CATEGORY_COLOR[a.category] || CATEGORY_COLOR.other }}
                  />
                  <div className="chip-text">
                    <div className="chip-type">{a.name}</div>
                    <div className="chip-amount">{naira(a.balanceNgn)}</div>
                  </div>
                  <div className="chip-pct">{pct}%</div>
                </div>
              );
            })}
          </div>
        </SnapshotCard>
      )}
    </div>
  );
}
