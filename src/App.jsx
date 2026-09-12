import React, { useState } from "react";
import { Home as HomeIcon, Wallet, PieChart } from "lucide-react";
import Home from "./screens/Home.jsx";
import Accounts from "./screens/Accounts.jsx";
import Budget from "./screens/Budget.jsx";

const TABS = [
  { id: "home", label: "Home", icon: HomeIcon, Screen: Home },
  { id: "accounts", label: "Accounts", icon: Wallet, Screen: Accounts },
  { id: "budget", label: "Budget", icon: PieChart, Screen: Budget },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const ActiveScreen = TABS.find((t) => t.id === tab).Screen;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="brand">SapaProof</span>
        <nav className="top-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="content">
        <ActiveScreen />
      </main>
    </div>
  );
}
