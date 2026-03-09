import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ClientEdit from "./pages/ClientEdit";
import Duplicates from "./pages/Duplicates";
import Tasks from "./pages/Tasks";

import Calendar from "./pages/Calendar";



function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/clients/:id/edit" element={<ClientEdit />} />
        <Route path="/duplicates" element={<Duplicates />} />
        <Route path="/tasks" element={<Tasks />} />
        
        <Route path="/calendar" element={<Calendar />} />


        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("crm_token"));

  if (!token) {
    return <Login onLogin={(t) => { localStorage.setItem("crm_token", t); setToken(t); }} />;
  }

  return <AppRoutes />;
}
