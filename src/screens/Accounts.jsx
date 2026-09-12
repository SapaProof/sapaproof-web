import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../api.js";
import ConnectBankButton from "../ConnectBankButton.jsx";

function naira(n) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

function ManualAccountForm({ onAdded }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [balance, setBalance] = useState("");
  const [category, setCategory] = useState("investment");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name || !balance) return;
    setSaving(true);
    try {
      await api.addManualAccount({ name, currency, balance: Number(balance), category });
      setName("");
      setBalance("");
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="manual-form" onSubmit={submit}>
      <input
        placeholder="e.g. RiseVest"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="bank">Bank</option>
        <option value="investment">Investment</option>
        <option value="savings">Savings</option>
        <option value="other">Other</option>
      </select>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="NGN">NGN</option>
        <option value="USD">USD</option>
      </select>
      <input
        type="number"
        placeholder="Balance"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
      />
      <button type="submit" disabled={saving}>
        {saving ? "Adding…" : "Add"}
      </button>
    </form>
  );
}

export default function Accounts() {
  const [linked, setLinked] = useState([]);
  const [manual, setManual] = useState([]);
  const [status, setStatus] = useState("loading");

  async function load() {
    setStatus("loading");
    try {
      const [linkedRes, manualRes] = await Promise.all([
        api.getLinkedAccounts(),
        api.getManualAccounts(),
      ]);
      setLinked(linkedRes.accounts);
      setManual(manualRes.accounts);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <div className="screen">Loading accounts…</div>;
  if (status === "error") return <div className="screen">Couldn't load accounts.</div>;

  return (
    <div className="screen">
      <div className="eyebrow-row">
        <span className="hello">Accounts</span>
      </div>

      <div className="account-group">
        <div className="group-heading">
          <span>Banks (via Mono)</span>
        </div>
        {linked.length === 0 && <p className="muted">No banks linked yet.</p>}
        {linked.map((a) => (
          <div className="account-row" key={a.monoAccountId}>
            <div className="account-bar" style={{ background: "var(--accent-green)" }} />
            <div className="account-text">
              <div className="account-name">{a.institutionName}</div>
              <div className="account-sub">Linked {new Date(a.linkedAt).toLocaleDateString()}</div>
            </div>
            <button
              className="icon-btn"
              onClick={async () => {
                await api.unlinkAccount(a.monoAccountId);
                load();
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <ConnectBankButton onLinked={load} />
      </div>

      <div className="account-group">
        <div className="group-heading">
          <span>Investments & other (manual)</span>
        </div>
        {manual.length === 0 && <p className="muted">Nothing added yet.</p>}
        {manual.map((a) => (
          <div className="account-row" key={a.id}>
            <div className="account-bar" style={{ background: "var(--accent-gold)" }} />
            <div className="account-text">
              <div className="account-name">{a.name}</div>
              <div className="account-sub">
                Updated {new Date(a.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="account-balance">
              {a.currency === "USD" ? `$${a.balance.toLocaleString()}` : naira(a.balance)}
            </div>
            <button
              className="icon-btn"
              onClick={async () => {
                await api.removeManualAccount(a.id);
                load();
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <ManualAccountForm onAdded={load} />
      </div>
    </div>
  );
}
