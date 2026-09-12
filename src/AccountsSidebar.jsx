import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal, AlertTriangle, Trash2 } from "lucide-react";
import { api } from "./api.js";
import { naira } from "./utils.js";
import ConnectBankButton from "./ConnectBankButton.jsx";

const GROUP_LABELS = {
  bank: "Banking",
  investment: "Investments",
  savings: "Savings",
  other: "Other",
};
const GROUP_ORDER = ["bank", "investment", "savings", "other"];

function ManualAccountForm({ onAdded, onClose }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [balance, setBalance] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [category, setCategory] = useState("investment");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name || !balance) return;
    setSaving(true);
    try {
      await api.addManualAccount({
        name,
        currency,
        balance: Number(balance),
        category,
        costBasis: costBasis ? Number(costBasis) : null,
      });
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="sidebar-add-form" onSubmit={submit}>
      <input placeholder="e.g. Bamboo" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="sidebar-add-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="bank">Bank</option>
          <option value="investment">Investment</option>
          <option value="savings">Savings</option>
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="NGN">NGN</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <input
        type="number"
        placeholder="Current balance"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
      />
      {category === "investment" && (
        <input
          type="number"
          placeholder="Amount originally invested (optional)"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
        />
      )}
      <div className="sidebar-add-row">
        <button type="submit" disabled={saving}>{saving ? "Adding…" : "Add"}</button>
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function AccountsSidebar({ refreshKey, onChanged }) {
  const [linked, setLinked] = useState([]);
  const [manual, setManual] = useState([]);
  const [totalNgn, setTotalNgn] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  async function load() {
    const [linkedRes, manualRes, netRes] = await Promise.all([
      api.getLinkedAccounts().catch(() => ({ accounts: [] })),
      api.getManualAccounts().catch(() => ({ accounts: [] })),
      // Use the backend's already-correct total (it converts USD accounts
      // and includes linked banks) rather than re-summing client-side —
      // a client-side NGN-only sum here previously silently dropped both
      // linked bank balances and USD accounts, showing a wrong total that
      // didn't match the Dashboard/Net Worth pages.
      api.getNetWorth("parallel").catch(() => ({ totalNgn: 0 })),
    ]);
    setLinked(linkedRes.accounts);
    setManual(manualRes.accounts);
    setTotalNgn(netRes.totalNgn);
  }

  useEffect(() => {
    load();
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const allAccounts = [
    ...linked.map((a) => ({
      id: a.monoAccountId,
      name: a.institutionName,
      category: "bank",
      needsAttention: false,
      isManual: false,
    })),
    ...manual.map((a) => ({
      id: a.id,
      name: a.name,
      balance: a.currency === "USD" ? `$${a.balance.toLocaleString()}` : naira(a.balance),
      category: a.category || "other",
      needsAttention: false,
      isManual: true,
    })),
  ];

  const grouped = GROUP_ORDER.map((key) => ({
    key,
    label: GROUP_LABELS[key],
    accounts: allAccounts.filter((a) => a.category === key),
  })).filter((g) => g.accounts.length > 0);

  return (
    <aside className="accounts-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Accounts</span>
        <div className="sidebar-header-actions">
          <button className="icon-btn" onClick={() => setShowAddMenu((s) => !s)} aria-label="Add account">
            <Plus size={16} />
          </button>
          <button className="icon-btn" aria-label="More">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {showAddMenu && !showManualForm && (
        <div className="sidebar-add-menu">
          <div onClick={() => setShowAddMenu(false)}>
            <ConnectBankButton
              onLinked={() => {
                load();
                onChanged?.();
              }}
            />
          </div>
          <button
            className="connect-cta secondary"
            onClick={() => setShowManualForm(true)}
          >
            + Add investment/manual account
          </button>
        </div>
      )}
      {showManualForm && (
        <ManualAccountForm
          onAdded={() => {
            load();
            onChanged?.();
          }}
          onClose={() => {
            setShowManualForm(false);
            setShowAddMenu(false);
          }}
        />
      )}

      <div className="sidebar-all-accounts">
        <span>All Accounts</span>
        <span className="sidebar-total">{naira(totalNgn)}</span>
      </div>

      <div className="sidebar-groups">
        {grouped.length === 0 && (
          <p className="muted" style={{ padding: "0 4px" }}>
            No accounts yet — click + above to connect a bank or add one manually.
          </p>
        )}
        {grouped.map((g) => (
          <div className="sidebar-group" key={g.key}>
            <div className="sidebar-group-label">{g.label}</div>
            {g.accounts.map((a) => (
              <div className="sidebar-account-row" key={a.id}>
                {a.needsAttention && <AlertTriangle size={12} className="warning-icon" />}
                <span className="sidebar-account-name">{a.name}</span>
                <span className="sidebar-account-balance">{a.balance ?? ""}</span>
                {a.isManual && (
                  <button
                    className="sidebar-remove-btn"
                    onClick={async () => {
                      await api.removeManualAccount(a.id);
                      load();
                      onChanged?.();
                    }}
                    aria-label="Remove account"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
