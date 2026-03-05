import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Tasks from "./pages/Tasks";
import Email from "./pages/Email";
import Calendar from "./pages/Calendar";
import Team from "./pages/Team";

export default function App() {
  const [token, setToken] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check for existing valid session
    const stored = localStorage.getItem("crm_token");
    if (stored) {
      // Validate token against server
      fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((res) => {
          if (res.ok) {
            setToken(stored);
          } else {
            localStorage.removeItem("crm_token");
          }
        })
        .catch(() => localStorage.removeItem("crm_token"))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/email" element={<Email />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/team" element={<Team />} />
      </Route>
    </Routes>
  );
}
