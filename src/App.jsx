import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Tasks from "./pages/Tasks";
import Email from "./pages/Email";
import Calendar from "./pages/Calendar";
import Contacts from "./pages/Contacts";
import Team from "./pages/Team";

const VALID_HASH = "8ff45e622b068d975d63e24a71ff93adf156e218d21c5261a3ba9e94645a0b8e";

export default function App() {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("crm_token");
    return stored === VALID_HASH ? stored : null;
  });

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
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/team" element={<Team />} />
      </Route>
    </Routes>
  );
}
