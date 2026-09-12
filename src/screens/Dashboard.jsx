import React, { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, YAxis, XAxis, Tooltip,
} from "recharts";
import { Target } from "lucide-react";
import { api } from "../api.js";
import { naira, nairaCompact, formatPayee } from "../utils.js";
import { colorFor } from "../categoryColors.js";
import ConnectBankButton from "../ConnectBankButton.jsx";
import Card from "../Card.jsx";

function NetWorthChart({ history }) {
  if (!history || history.length < 2) return null;
  return (
    <div style={{ width: "100%", height: 200, marginTop: 12 }}>
      <ResponsiveContainer>
        <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={["dataMin - 100000", "dataMax + 100000"]} />
          <Area type="monotone" dataKey="totalNgn" stroke="var(--accent-green)" strokeWidth={2.5} fill="url(#nwFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function IncomeSpendingChart({ data, dataKey, color }) {
  return (
    <div style={{ width: "100%", height: 180, marginTop: 8 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => nairaCompact(v)}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryDonut({ byCategory, centerLabel, centerValue }) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const data = entries.map(([name, value]) => ({ name, value }));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, flexWrap: "wrap" }}>
      <div style={{ width: 160, height: 160, flexShrink: 0, position: "relative" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.name} fill={colorFor(d.name)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="donut-center">
            <div className="donut-center-label">{centerLabel}</div>
            <div className="donut-center-value">{centerValue}</div>
          </div>
        )}
      </div>
      <div className="donut-legend">
        {entries.map(([name, value]) => (
          <div className="donut-legend-row" key={name}>
            <span className="donut-dot" style={{ background: colorFor(name) }} />
            <span className="donut-legend-name">{name}</span>
            <span className="donut-legend-value">{nairaCompact(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ refreshSignal }) {
  const [net, setNet] = useState(null);
  const [history, setHistory] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [cashflowHistory, setCashflowHistory] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState("loading");

  async function loadAll() {
    setStatus("loading");
    try {
      const netResult = await api.getNetWorth("parallel");
      setNet(netResult);
      setStatus("ready");

      api.getNetWorthHistory().then((h) => setHistory(h.history)).catch(() => setHistory(null));
      api.getCashflowHistory().then((h) => setCashflowHistory(h.history)).catch(() => setCashflowHistory(null));

      const linked = await api.getLinkedAccounts().catch(() => ({ accounts: [] }));
      const accountId = linked.accounts[0] ? linked.accounts[0].monoAccountId : "demo";
      api.getBudgetSummary(accountId).then(setCashflow).catch((err) => {
        console.error("dashboard cash flow failed:", err);
        setCashflow(null);
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    loadAll();
  }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") return <div className="screen">Loading dashboard…</div>;
  if (status === "error") {
    return (
      <div className="screen">
        <div className="empty-state">
          <p>Couldn't reach the backend. Is sapaproof-backend running on the URL in your .env?</p>
        </div>
      </div>
    );
  }

  const hasAccounts = net.accounts.length > 0;

  if (!hasAccounts) {
    return (
      <div className="screen">
        <div className="empty-state">
          <p>No accounts connected yet. Link a bank to see your real dashboard here.</p>
          <ConnectBankButton onLinked={loadAll} />
          <p className="muted" style={{ marginTop: 14 }}>
            Waiting on Mono's business verification? Load sample data instead —
            everything else (net worth math, FX conversion, categorization) runs for real.
          </p>
          <button
            className="connect-cta"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              await api.seedDemo();
              await loadAll();
              setSeeding(false);
            }}
          >
            {seeding ? "Loading demo data…" : "Load demo data"}
          </button>
        </div>
      </div>
    );
  }

  const recentTxns = cashflow
    ? [...cashflow.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4)
    : [];
  const recurring = cashflow
    ? cashflow.transactions
        .filter((t) => ["Subscriptions", "Data & Airtime"].includes(t.category))
        .slice(0, 3)
    : [];
  const plannedTotal = cashflow ? Object.values(cashflow.planned || {}).reduce((s, v) => s + v, 0) : 0;
  const available = plannedTotal - (cashflow ? cashflow.totalSpent : 0);

  return (
    <div className="screen dashboard-grid">
      <div className="eyebrow-row" style={{ gridColumn: "1 / -1" }}>
        <span className="hello">Hello there 👋</span>
      </div>

      {/* Net Worth */}
      <Card title="Net Worth" className="span-2">
        <div className="hero-figure">{naira(net.totalNgn)}</div>
        <div className="hero-label">
          1 USD ≈ {naira(net.rateUsed.usdToNgn)} ({net.rateUsed.mode})
        </div>
        <NetWorthChart history={history} />
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Transactions">
        {recentTxns.map((t, i) => (
          <div className="txn-row" key={i}>
            <div className="txn-text">
              <div className="txn-payee">{formatPayee(t.narration)}</div>
              <div className="txn-category">{t.category}</div>
            </div>
            <div className={`txn-amount ${t.type === "credit" ? "positive" : ""}`}>
              {t.type === "credit" ? "+" : ""}
              {nairaCompact(t.amount)}
            </div>
          </div>
        ))}
        {recentTxns.length === 0 && <p className="muted">No transactions yet.</p>}
      </Card>

      {/* Potential Recurring */}
      <Card title="Potential Recurring">
        {recurring.map((t, i) => (
          <div className="txn-row" key={i}>
            <div className="txn-text">
              <div className="txn-payee">{formatPayee(t.narration)}</div>
              <div className="txn-category">Every month</div>
            </div>
            <div className="txn-amount">{nairaCompact(t.amount)}</div>
          </div>
        ))}
        {recurring.length === 0 && <p className="muted">Nothing recurring detected yet.</p>}
      </Card>

      {/* Income */}
      {cashflowHistory && (
        <Card title="Income" right={<span className="qcard-subtitle">Recent 6 months</span>}>
          <IncomeSpendingChart data={cashflowHistory} dataKey="income" color="var(--accent-green)" />
        </Card>
      )}

      {/* Spending */}
      {cashflowHistory && (
        <Card title="Spending" right={<span className="qcard-subtitle">Recent 6 months</span>}>
          <IncomeSpendingChart data={cashflowHistory} dataKey="spending" color="var(--accent-gold)" />
        </Card>
      )}

      {/* Top Spending Categories */}
      {cashflow && (
        <Card title="Top Spending Categories" className="span-2" right={<span className="qcard-subtitle">This month</span>}>
          <CategoryDonut byCategory={cashflow.byCategory} />
        </Card>
      )}

      {/* Spending Plan */}
      {cashflow && (
        <Card title="Spending Plan" right={<span className="qcard-subtitle">{new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
            <div style={{ width: 130, height: 130, position: "relative" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[{ value: 1 }]}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={64}
                  >
                    <Cell fill={available < 0 ? "var(--coral)" : "var(--accent-green)"} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <div className="donut-center-label">Available</div>
                <div
                  className="donut-center-value"
                  style={{ color: available < 0 ? "var(--coral)" : "var(--accent-green)", fontSize: 16 }}
                >
                  {naira(available)}
                </div>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {available < 0 ? "Overspent" : "On track"} vs {naira(plannedTotal)} planned this month
            </div>
          </div>
        </Card>
      )}

      {/* Planned Spend grid */}
      {cashflow && (
        <Card title="Planned Spend">
          <div className="planned-grid">
            {Object.entries(cashflow.planned || {}).slice(0, 4).map(([category, plannedAmt]) => {
              const spent = cashflow.byCategory[category] || 0;
              const pct = Math.min(100, Math.round((spent / plannedAmt) * 100));
              const over = spent > plannedAmt;
              return (
                <div className="planned-cell" key={category}>
                  <div className="planned-cell-title">{category}</div>
                  <div className="flow-track" style={{ margin: "6px 0" }}>
                    <div
                      className="flow-fill"
                      style={{ width: `${pct}%`, background: over ? "var(--coral)" : "var(--accent-green)" }}
                    />
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Spent {nairaCompact(spent)} of {nairaCompact(plannedAmt)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Savings Goals — empty state, matches Quicken's own placeholder for
          the same feature; goal-setting isn't built yet. */}
      <Card title="Savings Goals" className="span-2">
        <div className="empty-state" style={{ boxShadow: "none" }}>
          <Target size={40} style={{ color: "var(--accent-gold)", marginBottom: 8 }} />
          <p>Set your goals and start saving for future plans or unexpected expenses.</p>
          <button className="connect-cta" disabled>
            Create Goal (coming soon)
          </button>
        </div>
      </Card>
    </div>
  );
}
