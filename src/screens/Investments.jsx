import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { api } from "../api.js";
import { naira } from "../utils.js";
import Card from "../Card.jsx";

const ALLOCATION_COLORS = ["#059669", "#D97706", "#2563EB", "#DB2777", "#0891B2", "#9333EA"];

export default function Investments() {
  const [net, setNet] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const netResult = await api.getNetWorth("parallel");
        setNet(netResult);
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    load();
  }, []);

  if (status === "loading") return <div className="screen">Loading investments…</div>;
  if (status === "error" || !net) {
    return (
      <div className="screen">
        <div className="empty-state"><p>Couldn't load investment data.</p></div>
      </div>
    );
  }

  const investmentAccounts = net.accounts.filter((a) => a.category === "investment");
  const totalValue = investmentAccounts.reduce((s, a) => s + a.balanceNgn, 0);

  const tracked = investmentAccounts.filter((a) => a.costBasisNgn != null);
  const totalCostBasis = tracked.reduce((s, a) => s + a.costBasisNgn, 0);
  const totalGain = tracked.reduce((s, a) => s + (a.balanceNgn - a.costBasisNgn), 0);
  const totalGainPct = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;

  const allocationData = investmentAccounts.map((a, i) => ({
    name: a.name,
    value: a.balanceNgn,
    color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));

  if (investmentAccounts.length === 0) {
    return (
      <div className="screen">
        <div className="empty-state">
          <p>No investment accounts yet — add one from the sidebar (Bamboo, RiseVest, Cowrywise, etc).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ maxWidth: 1000 }}>
      <div className="eyebrow-row"><span className="hello">Investments</span></div>

      <div className="two-col">
        <Card title="Total value">
          <div className="hero-figure" style={{ fontSize: 30 }}>{naira(totalValue)}</div>
          <div className="muted">Across {investmentAccounts.length} account{investmentAccounts.length !== 1 ? "s" : ""}</div>
        </Card>

        <Card title="Total gain / loss">
          {tracked.length > 0 ? (
            <>
              <div
                className="hero-figure"
                style={{ fontSize: 30, color: totalGain >= 0 ? "var(--accent-green)" : "var(--coral)" }}
              >
                {totalGain >= 0 ? "+" : ""}{naira(totalGain)}
              </div>
              <div className="muted" style={{ color: totalGain >= 0 ? "var(--accent-green)" : "var(--coral)" }}>
                {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}% vs. {naira(totalCostBasis)} invested
              </div>
            </>
          ) : (
            <p className="muted">
              Add "amount originally invested" when creating an account to see real gain/loss here.
            </p>
          )}
        </Card>
      </div>

      <Card title="Allocation">
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
          <div style={{ width: 180, height: 180, flexShrink: 0 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {allocationData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="donut-legend">
            {allocationData.map((d) => (
              <div className="donut-legend-row" key={d.name}>
                <span className="donut-dot" style={{ background: d.color }} />
                <span className="donut-legend-name">{d.name}</span>
                <span className="donut-legend-value">{Math.round((d.value / totalValue) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Accounts">
        {investmentAccounts.map((a, i) => {
          const hasCostBasis = a.costBasisNgn != null;
          const gain = hasCostBasis ? a.balanceNgn - a.costBasisNgn : null;
          const gainPct = hasCostBasis && a.costBasisNgn > 0 ? (gain / a.costBasisNgn) * 100 : null;
          const allocationPct = Math.round((a.balanceNgn / totalValue) * 100);
          return (
            <div className="invest-account-card" key={a.id}>
              <div className="invest-account-top">
                <div className="invest-account-dot" style={{ background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }} />
                <div className="invest-account-name">{a.name}</div>
                <div className="invest-account-alloc muted">{allocationPct}% of portfolio</div>
              </div>
              <div className="invest-account-bottom">
                <div className="invest-account-balance">{naira(a.balanceNgn)}</div>
                {hasCostBasis ? (
                  <div
                    className="invest-account-gain"
                    style={{ color: gain >= 0 ? "var(--accent-green)" : "var(--coral)" }}
                  >
                    {gain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {gain >= 0 ? "+" : ""}{naira(gain)} ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize: 12.5 }}>No cost basis entered</div>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <div className="info-note">
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <p>
          Gain/loss here comes from what you told us you originally invested, not live market
          pricing — platforms like Bamboo, RiseVest, and Cowrywise don't expose per-holding data
          (individual stocks, share counts) the way a brokerage account would, so there's no
          ticker-level detail to show. This is real math on real numbers you enter, not simulated.
        </p>
      </div>
    </div>
  );
}
