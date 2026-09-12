import React, { useEffect, useState } from "react";
import { Target, Trash2, Plus } from "lucide-react";
import { api } from "../api.js";
import { naira } from "../utils.js";
import Card from "../Card.jsx";

function NewGoalForm({ onCreated }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name || !target) return;
    setSaving(true);
    try {
      await api.addGoal({ name, target: Number(target) });
      setName("");
      setTarget("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="manual-form" onSubmit={submit}>
      <input placeholder="e.g. Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        type="number"
        placeholder="Target (₦)"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        style={{ width: 140 }}
      />
      <button type="submit" disabled={saving}>
        <Plus size={14} /> {saving ? "Creating…" : "Create Goal"}
      </button>
    </form>
  );
}

function GoalCard({ goal, onUpdated, onRemoved }) {
  const [savedInput, setSavedInput] = useState(goal.saved);
  const pct = Math.min(100, Math.round((goal.saved / goal.target) * 100));

  async function save() {
    await api.updateGoal(goal.id, Number(savedInput));
    onUpdated();
  }

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <div>
          <div className="goal-card-name">{goal.name}</div>
          <div className="muted">{naira(goal.saved)} of {naira(goal.target)}</div>
        </div>
        <button className="icon-btn" onClick={() => onRemoved(goal.id)} aria-label="Delete goal">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flow-track" style={{ margin: "10px 0" }}>
        <div
          className="flow-fill"
          style={{ width: `${pct}%`, background: pct >= 100 ? "var(--accent-green)" : "var(--accent-gold)" }}
        />
      </div>
      <div className="goal-card-footer">
        <span className="muted">{pct}% there</span>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="number"
            value={savedInput}
            onChange={(e) => setSavedInput(e.target.value)}
            style={{ width: 100 }}
          />
          <button className="connect-cta secondary" style={{ width: "auto", padding: "6px 12px", marginTop: 0 }} onClick={save}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [status, setStatus] = useState("loading");

  async function load() {
    setStatus("loading");
    try {
      const res = await api.getGoals();
      setGoals(res.goals);
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <div className="screen">Loading goals…</div>;

  return (
    <div className="screen" style={{ maxWidth: 700 }}>
      <div className="eyebrow-row">
        <span className="hello">Savings Goals</span>
      </div>

      <Card title="New goal">
        <NewGoalForm onCreated={load} />
      </Card>

      {goals.length === 0 && (
        <div className="empty-state">
          <Target size={40} style={{ color: "var(--accent-gold)", marginBottom: 8 }} />
          <p>Set your first goal above and start saving for future plans or unexpected expenses.</p>
        </div>
      )}

      {goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          onUpdated={load}
          onRemoved={async (id) => {
            await api.removeGoal(id);
            load();
          }}
        />
      ))}
    </div>
  );
}
