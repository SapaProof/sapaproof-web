import React, { useEffect, useState } from "react";
import { Home as HomeIcon, Wallet, PieChart, Sun, Moon } from "lucide-react";
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
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sapaproof_theme") || "light"
  );
  const ActiveScreen = TABS.find((t) => t.id === tab).Screen;

  useEffect(() => {
    localStorage.setItem("sapaproof_theme", theme);
  }, [theme]);

  return (
    <div className={`app-shell theme-${theme}`}>
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
          <button
            className="theme-toggle"
            aria-label="Toggle light/dark theme"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </nav>
      </header>
      <main className="content">
        <ActiveScreen />
      </main>
    </div>
  );
}
