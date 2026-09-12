import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { api } from "../api.js";
import { naira } from "../utils.js";
import Card from "../Card.jsx";

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

  return (
    <div className="screen" style={{ maxWidth: 900 }}>
      <div className="eyebrow-row">
        <span className="hello">Investments</span>
      </div>

      <Card title="Total value">
        <div className="hero-figure" style={{ fontSize: 30 }}>{naira(totalValue)}</div>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
          Across {investmentAccounts.length} investment account{investmentAccounts.length !== 1 ? "s" : ""}.
          Note: platforms like Bamboo, RiseVest, and Cowrywise manage pooled funds rather than
          individual stock positions, and don't expose per-holding data (shares, price, gain) the
          way a brokerage account does — so this shows account-level balances, not a stock ticker table.
        </p>
      </Card>

      <Card title="Investment accounts">
        {investmentAccounts.length === 0 && (
          <p className="muted">No investment accounts yet. Add one from the sidebar.</p>
        )}
        {investmentAccounts.map((a) => (
          <div className="account-row" key={a.id}>
            <div className="account-bar" style={{ background: "var(--accent-gold)" }} />
            <div className="account-text">
              <div className="account-name">{a.name}</div>
              <div className="account-sub">{a.currency} account</div>
            </div>
            <div className="account-balance">
              {a.currency === "USD" ? `$${(a.balanceNgn / (net.rateUsed.usdToNgn || 1)).toFixed(2)}` : ""}
            </div>
            <div className="account-balance" style={{ marginLeft: 12 }}>{naira(a.balanceNgn)}</div>
          </div>
        ))}
      </Card>

      <Card title="What's not tracked yet">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <TrendingUp size={18} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 2 }} />
          <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
            Gain/loss, day change, and individual holdings would need each platform's own API
            (where one exists) or manual cost-basis entry — genuinely unbuilt, not hidden behind
            a loading state. Worth prioritizing if investment performance tracking becomes a core
            differentiator.
          </p>
        </div>
      </Card>
    </div>
  );
}
