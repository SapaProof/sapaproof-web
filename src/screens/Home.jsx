import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { api } from "../api.js";
import ConnectBankButton from "../ConnectBankButton.jsx";

function naira(n) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

const CATEGORY_COLOR = {
  bank: "var(--accent-green)",
  investment: "var(--accent-gold)",
  savings: "var(--coral)",
  other: "var(--text-secondary)",
};

export default function Home() {
  const [data, setData] = useState(null);
  const [rateMode, setRateMode] = useState("parallel");
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [seeding, setSeeding] = useState(false);

  async function load(mode) {
    setStatus("loading");
    try {
      const result = await api.getNetWorth(mode);
      setData(result);
      setStatus("ready");
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
          <p>Couldn't reach the backend. Is mono-backend running on the URL in your .env?</p>
        </div>
      </div>
    );
  }

  const hasAccounts = data.accounts.length > 0;

  return (
    <div className="screen">
      <div className="eyebrow-row">
        <span className="hello">Net worth</span>
        <select
          className="rate-select"
          value={rateMode}
          onChange={(e) => setRateMode(e.target.value)}
        >
          <option value="parallel">Parallel rate</option>
          <option value="official">Official rate</option>
        </select>
      </div>

      <div className="hero-panel">
        <div className="hero-label">
          Total across all accounts
          {data.rateUsed.isEstimate && rateMode === "parallel" && (
            <span className="estimate-tag"> · estimated</span>
          )}
        </div>
        <div className="hero-figure">{naira(data.totalNgn)}</div>
        <div className="hero-label">
          1 USD ≈ {naira(data.rateUsed.usdToNgn)} ({data.rateUsed.mode})
        </div>
      </div>

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

      {hasAccounts && (
        <>
          <div className="section-title">Where it lives</div>
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
        </>
      )}
    </div>
  );
}
