import React, { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, PieChart, Pie, Cell } from "recharts";
import { api } from "../api.js";
import { naira } from "../utils.js";
import Card from "../Card.jsx";

const RANGES = ["1M", "3M", "6M", "1Y", "5Y", "QTD", "YTD", "All"];
const GROUP_LABELS = { bank: "Banking", investment: "Investments", savings: "Savings", other: "Other" };
const GROUP_COLORS = {
  bank: "var(--accent-green)",
  investment: "var(--accent-gold)",
  savings: "var(--coral)",
  other: "var(--text-secondary)",
};

export default function NetWorth() {
  const [range, setRange] = useState("6M");
  const [net, setNet] = useState(null);
  const [history, setHistory] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const netResult = await api.getNetWorth("parallel");
        setNet(netResult);
        const h = await api.getNetWorthHistory(range);
        setHistory(h.history);
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }
    load();
  }, [range]);

  if (status === "loading") return <div className="screen">Loading net worth…</div>;
  if (status === "error" || !net) {
    return (
      <div className="screen">
        <div className="empty-state"><p>Couldn't load net worth data.</p></div>
      </div>
    );
  }
  if (net.accounts.length === 0) {
    return (
      <div className="screen">
        <div className="empty-state"><p>No accounts yet — go to Dashboard to connect a bank or load demo data.</p></div>
      </div>
    );
  }

  const grouped = ["bank", "investment", "savings", "other"]
    .map((key) => ({
      key,
      label: GROUP_LABELS[key],
      accounts: net.accounts.filter((a) => a.category === key),
      total: net.accounts.filter((a) => a.category === key).reduce((s, a) => s + a.balanceNgn, 0),
    }))
    .filter((g) => g.accounts.length > 0);

  const donutData = grouped.map((g) => ({ name: g.label, value: g.total, color: GROUP_COLORS[g.key] }));

  return (
    <div className="screen" style={{ maxWidth: 1000 }}>
      <div className="eyebrow-row"><span className="hello">Net Worth</span></div>

      <div className="range-tabs">
        {RANGES.map((r) => (
          <button key={r} className={`range-tab ${range === r ? "active" : ""}`} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      <Card title="Your net worth">
        <div className="hero-figure" style={{ fontSize: 34 }}>{naira(net.totalNgn)}</div>
        <div className="hero-label">
          1 USD ≈ {naira(net.rateUsed.usdToNgn)} ({net.rateUsed.mode})
        </div>
        {history && history.length > 1 && (
          <div style={{ width: "100%", height: 240, marginTop: 12 }}>
            <ResponsiveContainer>
              <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="nwFill2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-green)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin - 100000", "dataMax + 100000"]} />
                <Area type="monotone" dataKey="totalNgn" stroke="var(--accent-green)" strokeWidth={2.5} fill="url(#nwFill2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="two-col">
        <Card title="Accounts">
          {grouped.map((g) => (
            <div key={g.key} className="networth-group-row">
              <div>
                <div className="networth-group-label">{g.label}</div>
                <div className="muted">{g.accounts.length} account{g.accounts.length > 1 ? "s" : ""}</div>
              </div>
              <div className="networth-group-total">{naira(g.total)}</div>
            </div>
          ))}
        </Card>

        <Card title="Breakdown">
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
            <div style={{ width: 150, height: 150, flexShrink: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-legend">
              {donutData.map((d) => (
                <div className="donut-legend-row" key={d.name}>
                  <span className="donut-dot" style={{ background: d.color }} />
                  <span className="donut-legend-name">{d.name}</span>
                  <span className="donut-legend-value">{naira(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
