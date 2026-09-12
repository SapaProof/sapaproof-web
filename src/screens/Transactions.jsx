import React, { useEffect, useState } from "react";
import { Search, Calendar, SlidersHorizontal, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "../api.js";
import { naira, nairaCompact, formatPayee, formatDate } from "../utils.js";
import { colorFor } from "../categoryColors.js";

const TABS = ["All", "Spending", "Income"];

function Donut({ byCategory, total }) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const data = entries.map(([name, value]) => ({ name, value }));
  return (
    <>
      <div className="hero-figure" style={{ marginTop: 4 }}>{naira(total)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ width: 200, height: 200, flexShrink: 0 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={98} paddingAngle={2}>
                {data.map((d) => (
                  <Cell key={d.name} fill={colorFor(d.name)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
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
    </>
  );
}

export default function Transactions() {
  const [tab, setTab] = useState("All");
  const [net, setNet] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [status, setStatus] = useState("loading");
  const [quickFilter, setQuickFilter] = useState(null);

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const netResult = await api.getNetWorth("parallel");
        setNet(netResult);
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

  if (status === "loading") return <div className="screen">Loading transactions…</div>;
  if (status === "error" || !cashflow) {
    return (
      <div className="screen">
        <div className="empty-state">
          <p>No transaction data yet. Load demo data from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  const allTransactions = [...cashflow.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  let visible = allTransactions;
  if (tab === "Spending") visible = allTransactions.filter((t) => t.type === "debit");
  if (tab === "Income") visible = allTransactions.filter((t) => t.type === "credit");
  if (quickFilter === "Uncategorized") visible = visible.filter((t) => t.category === "Other");

  return (
    <div className="screen" style={{ maxWidth: 760 }}>
      <div className="eyebrow-row">
        <span className="hello">Transactions</span>
      </div>

      <div className="txn-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`txn-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="qcard">
        <div className="qcard-header">
          <span className="qcard-title" style={{ fontSize: 20 }}>All Accounts</span>
          <span className="hero-figure" style={{ fontSize: 22, marginBottom: 0 }}>
            {naira(net ? net.totalNgn : 0)}
          </span>
        </div>
        <div className="muted">{net ? net.accounts.length : 0} accounts · Total balance</div>
      </div>

      {tab === "All" && (
        <div className="qcard">
          <div className="qcard-header">
            <span className="qcard-title">Transactions</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="icon-btn"><Search size={15} /></button>
              <button className="icon-btn"><Calendar size={15} /></button>
              <button className="icon-btn"><SlidersHorizontal size={15} /></button>
              <button className="connect-cta" style={{ width: "auto", padding: "8px 14px", marginTop: 0 }}>
                <Plus size={14} /> New
              </button>
            </div>
          </div>
          <div className="quick-filters">
            {["This month", "Uncategorized", "Unreviewed"].map((f) => (
              <button
                key={f}
                className={`filter-chip ${quickFilter === f ? "active" : ""}`}
                onClick={() => setQuickFilter(quickFilter === f ? null : f)}
              >
                {f}
              </button>
            ))}
          </div>

          <table className="txn-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t, i) => (
                <tr key={i}>
                  <td>{formatDate(t.date)}</td>
                  <td>{formatPayee(t.narration)}</td>
                  <td>
                    <span className="category-dot" style={{ background: colorFor(t.category) }} />
                    {t.category}
                  </td>
                  <td style={{ textAlign: "right" }} className={t.type === "credit" ? "positive" : ""}>
                    {t.type === "credit" ? "+" : ""}
                    {naira(t.amount)}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted" style={{ padding: "16px 0" }}>
                    No transactions match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Spending" && (
        <div className="qcard">
          <div className="qcard-header">
            <span className="qcard-title">Total expenses</span>
          </div>
          <Donut byCategory={cashflow.byCategory} total={cashflow.totalSpent} />
        </div>
      )}

      {tab === "Income" && (
        <div className="qcard">
          <div className="qcard-header">
            <span className="qcard-title">Total income</span>
          </div>
          <Donut byCategory={cashflow.byIncomeCategory || {}} total={cashflow.totalIncome} />
        </div>
      )}
    </div>
  );
}
