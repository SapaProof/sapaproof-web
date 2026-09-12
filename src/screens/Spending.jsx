import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { naira, nairaCompact } from "../utils.js";
import { colorFor } from "../categoryColors.js";
import Card from "../Card.jsx";

const PERIODS = ["Month", "Quarter", "Year"];

export default function Spending() {
  const [period, setPeriod] = useState("Month");
  const [cashflow, setCashflow] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const linked = await api.getLinkedAccounts().catch(() => ({ accounts: [] }));
        const accountId = linked.accounts[0] ? linked.accounts[0].monoAccountId : "demo";
        const summary = await api.getBudgetSummary(accountId);
        setCashflow(summary);
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    load();
  }, []);

  if (status === "loading") return <div className="screen">Loading spending…</div>;
  if (status === "error" || !cashflow) {
    return (
      <div className="screen">
        <div className="empty-state"><p>No spending data yet. Load demo data from the Dashboard first.</p></div>
      </div>
    );
  }

  const plannedTotal = Object.values(cashflow.planned || {}).reduce((s, v) => s + v, 0);
  const overspent = cashflow.totalSpent - plannedTotal;
  const savingsRate = cashflow.totalIncome > 0
    ? Math.round(((cashflow.totalIncome - cashflow.totalSpent) / cashflow.totalIncome) * 100)
    : 0;

  const categories = Object.entries(cashflow.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="screen" style={{ maxWidth: 900 }}>
      <div className="eyebrow-row">
        <span className="hello">Spending</span>
      </div>

      <div className="view-by-row">
        <span className="muted">View spend by:</span>
        {PERIODS.map((p) => (
          <button key={p} className={`period-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
        {period !== "Month" && (
          <span className="muted" style={{ marginLeft: 8 }}>
            (only current-month data is available so far — {period.toLowerCase()} view will fill in as more history builds up)
          </span>
        )}
      </div>

      <div className="summary-cards">
        <Card title="Income">
          <div className="hero-figure" style={{ fontSize: 24, color: "var(--accent-green)" }}>
            +{naira(cashflow.totalIncome)}
          </div>
        </Card>
        <Card title="Total spent">
          <div className="hero-figure" style={{ fontSize: 24 }}>-{naira(cashflow.totalSpent)}</div>
        </Card>
        <Card title="vs. planned">
          <div
            className="hero-figure"
            style={{ fontSize: 24, color: overspent > 0 ? "var(--coral)" : "var(--accent-green)" }}
          >
            {overspent > 0 ? "-" : "+"}
            {naira(Math.abs(overspent))}
          </div>
        </Card>
        <Card title="Savings rate">
          <div
            className="hero-figure"
            style={{ fontSize: 24, color: savingsRate >= 0 ? "var(--accent-green)" : "var(--coral)" }}
          >
            {savingsRate}%
          </div>
        </Card>
      </div>

      <Card title="Category" right={<span className="qcard-subtitle">Spend vs. planned budget</span>}>
        {categories.map(([category, amount]) => {
          const planned = (cashflow.planned || {})[category] || amount;
          const pct = Math.min(100, Math.round((amount / planned) * 100));
          const over = amount > planned;
          return (
            <div className="spend-compare-row" key={category}>
              <div className="spend-compare-label">
                <span className="category-dot" style={{ background: colorFor(category) }} />
                {category}
              </div>
              <div className="spend-compare-bars">
                <div className="flow-track">
                  <div className="flow-fill" style={{ width: `${pct}%`, background: over ? "var(--coral)" : "var(--accent-green)" }} />
                </div>
                <div className="spend-compare-figures">
                  <span>{nairaCompact(amount)} spent</span>
                  <span className="muted">of {nairaCompact(planned)} planned</span>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
