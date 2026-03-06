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

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("crm_token"));

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
