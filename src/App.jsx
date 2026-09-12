import React, { useEffect, useState } from "react";
import {
  LayoutGrid, Receipt, PieChart, TrendingUp, Wallet, LineChart, Target,
  Sun, Moon, RefreshCw,
} from "lucide-react";
import AccountsSidebar from "./AccountsSidebar.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Transactions from "./screens/Transactions.jsx";
import Spending from "./screens/Spending.jsx";
import NetWorth from "./screens/NetWorth.jsx";
import SpendingPlan from "./screens/SpendingPlan.jsx";
import Investments from "./screens/Investments.jsx";
import SavingsGoals from "./screens/SavingsGoals.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, Screen: Dashboard },
  { id: "transactions", label: "Transactions", icon: Receipt, Screen: Transactions },
  { id: "spending", label: "Spending", icon: PieChart, Screen: Spending },
  { id: "networth", label: "Net Worth", icon: TrendingUp, Screen: NetWorth },
  { id: "plan", label: "Spending Plan", icon: Wallet, Screen: SpendingPlan },
  { id: "investments", label: "Investments", icon: LineChart, Screen: Investments },
  { id: "goals", label: "Savings Goals", icon: Target, Screen: SavingsGoals },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("sapaproof_theme") || "light");

  useEffect(() => {
    localStorage.setItem("sapaproof_theme", theme);
  }, [theme]);

  const Active = NAV.find((n) => n.id === view).Screen;

  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="app-body">
        <nav className="icon-rail">
          <div className="rail-brand">S</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`rail-btn ${view === n.id ? "active" : ""}`}
              onClick={() => setView(n.id)}
              aria-label={n.label}
            >
              <n.icon size={19} className="rail-icon" />
              <span className="rail-label">{n.label}</span>
            </button>
          ))}
          <div className="rail-spacer" />
          <button
            className="rail-btn"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} className="rail-icon" /> : <Sun size={18} className="rail-icon" />}
            <span className="rail-label">{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
          <button
            className="rail-btn"
            onClick={() => setRefreshSignal((s) => s + 1)}
            aria-label="Refresh"
          >
            <RefreshCw size={18} className="rail-icon" />
            <span className="rail-label">Refresh</span>
          </button>
        </nav>

        <AccountsSidebar refreshKey={refreshSignal} onChanged={() => setRefreshSignal((s) => s + 1)} />

        <main className="main-content">
          <div className="content-header">
            <span className="brand-title">SapaProof</span>
          </div>
          <div className="content-scroll">
            <Active refreshSignal={refreshSignal} />
          </div>
        </main>
      </div>
    </div>
  );
}
