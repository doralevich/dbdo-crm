import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Tasks from "./pages/Tasks";
import Email from "./pages/Email";
import Calendar from "./pages/Calendar";
import Team from "./pages/Team";

export default function App() {
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
