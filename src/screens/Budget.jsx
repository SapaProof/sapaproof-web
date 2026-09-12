import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function naira(n) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

export default function Budget() {
  const [linked, setLinked] = useState([]);
  const [accountId, setAccountId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .getLinkedAccounts()
      .then((res) => {
        setLinked(res.accounts);
        setAccountId(res.accounts[0] ? res.accounts[0].monoAccountId : "demo");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (!accountId) return;
    setStatus("loading");
    api
      .getBudgetSummary(accountId)
      .then((res) => {
        setSummary(res);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [accountId]);

  return (
    <div className="screen">
      <div className="eyebrow-row">
        <span className="hello">Budget</span>
        {linked.length > 1 && (
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {linked.map((a) => (
              <option key={a.monoAccountId} value={a.monoAccountId}>
                {a.institutionName}
              </option>
            ))}
          </select>
        )}
      </div>

      {summary?.isDemo && (
        <p className="muted" style={{ marginBottom: 12 }}>
          Showing demo transactions — link a bank to see your real spending here.
        </p>
      )}

      {status === "loading" && <p>Categorizing transactions…</p>}
      {status === "error" && <p className="muted">Couldn't load transactions.</p>}

      {status === "ready" && summary && (
        <>
          <div className="hero-panel small">
            <div className="hero-label">Spent this month ({summary.month})</div>
            <div className="hero-figure small">{naira(summary.totalSpent)}</div>
          </div>

          <div className="section-title">By category</div>
          {Object.entries(summary.byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
              const pct = Math.round((amount / summary.totalSpent) * 100) || 0;
              return (
                <div className="budget-row" key={category}>
                  <div className="budget-top">
                    <span className="budget-name">{category}</span>
                    <span className="budget-amounts">{naira(amount)}</span>
                  </div>
                  <div className="flow-track">
                    <div
                      className="flow-fill"
                      style={{ width: `${pct}%`, background: "var(--accent-green)" }}
                    />
                  </div>
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
