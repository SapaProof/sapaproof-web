import React, { useEffect, useState } from "react";
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "../api.js";
import { naira, nairaCompact } from "../utils.js";
import { colorFor } from "../categoryColors.js";
import Card from "../Card.jsx";

export default function SpendingPlan() {
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

  if (status === "loading") return <div className="screen">Loading spending plan…</div>;
  if (status === "error" || !cashflow) {
    return (
      <div className="screen">
        <div className="empty-state"><p>No data yet. Load demo data from the Dashboard first.</p></div>
      </div>
    );
  }

  const plannedTotal = Object.values(cashflow.planned || {}).reduce((s, v) => s + v, 0);
  // "Bills" = recurring-looking categories; "Other Spend" = everything else planned.
  const billsCategories = ["Rent & Utilities", "Subscriptions", "Data & Airtime"];
  const bills = Object.entries(cashflow.byCategory)
    .filter(([c]) => billsCategories.includes(c))
    .reduce((s, [, v]) => s + v, 0);
  const otherSpend = cashflow.totalSpent - bills;
  const goals = 0; // Goals screen tracks these separately, not wired into spend math yet
  const leftThisMonth = cashflow.totalIncome - bills - otherSpend - goals;

  const rows = [
    { label: "Income", value: cashflow.totalIncome, icon: Plus, color: "var(--accent-green)" },
    { label: "Bills", value: -bills, icon: Minus, color: "var(--accent-gold)" },
    { label: "Other Spend", value: -otherSpend, icon: Minus, color: "var(--coral)" },
    { label: "Goals", value: -goals, icon: Minus, color: "var(--text-secondary)" },
  ];

  return (
    <div className="screen" style={{ maxWidth: 1000 }}>
      <div className="eyebrow-row">
        <span className="hello">Spending Plan</span>
      </div>

      <div className="month-nav">
        <button className="icon-btn"><ChevronLeft size={16} /></button>
        <span className="month-nav-label">
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button className="icon-btn"><ChevronRight size={16} /></button>
      </div>

      <div className="two-col">
        <Card title="This month">
          {rows.map((r) => (
            <div className="plan-row" key={r.label}>
              <div className="plan-row-icon" style={{ background: r.color }}>
                <r.icon size={13} color="#fff" />
              </div>
              <span className="plan-row-label">{r.label}</span>
              <span className="plan-row-value">{naira(r.value)}</span>
            </div>
          ))}
          <div className="plan-left-row">
            <span>Left this month</span>
            <span style={{ color: leftThisMonth < 0 ? "var(--coral)" : "var(--accent-green)" }}>
              {naira(leftThisMonth)}
            </span>
          </div>
          <div style={{ width: 140, height: 140, margin: "12px auto 0" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ value: 1 }]} dataKey="value" innerRadius={45} outerRadius={65}>
                  <Cell fill={leftThisMonth < 0 ? "var(--coral)" : "var(--accent-green)"} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Planned Spend by category" right={<span className="qcard-subtitle">{nairaCompact(plannedTotal)} planned total</span>}>
          {Object.entries(cashflow.planned || {}).map(([category, plannedAmt]) => {
            const spent = cashflow.byCategory[category] || 0;
            const pct = Math.min(100, Math.round((spent / plannedAmt) * 100));
            const over = spent > plannedAmt;
            return (
              <div className="planned-cell full-width" key={category}>
                <div className="planned-cell-title">
                  <span className="category-dot" style={{ background: colorFor(category) }} />
                  {category}
                </div>
                <div className="flow-track" style={{ margin: "6px 0" }}>
                  <div className="flow-fill" style={{ width: `${pct}%`, background: over ? "var(--coral)" : "var(--accent-green)" }} />
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Spent {nairaCompact(spent)} of {nairaCompact(plannedAmt)} planned
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
