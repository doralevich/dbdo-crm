import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CalendarDays,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchTaskClients } from "../lib/api";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },

  { to: "/calendar", icon: CalendarDays, label: "Calendar" },


];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [taskClients, setTaskClients] = useState([]);
  const location = useLocation();

  // Load only clients with open tasks — re-fetch when expanded or location changes
  useEffect(() => {
    if (tasksExpanded) {
      fetchTaskClients().then(setTaskClients).catch(() => {});
    }
  }, [tasksExpanded, location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-raised">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — dark */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-navy border-r border-brand-navy-light transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold font-bold text-brand-navy text-sm">
            D
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Donna CRM</h1>
            <p className="text-[10px] text-gray-500 tracking-wider uppercase">DBDO Agency</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(to);
            const isTasks = to === "/tasks";
            return (
              <div key={to}>
                <div className="flex items-center">
                  <NavLink
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-gold/15 text-brand-gold"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {label}
                  </NavLink>
                  {isTasks && (
                    <button
                      onClick={() => setTasksExpanded(e => !e)}
                      className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {tasksExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
                {isTasks && tasksExpanded && (
                  <div className="ml-8 mt-0.5 space-y-0.5 max-h-64 overflow-y-auto">
                    {taskClients.map(client => (
                      <NavLink
                        key={client.id}
                        to={`/tasks?client=${client.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors truncate",
                          location.search.includes(client.id)
                            ? "text-brand-gold bg-brand-gold/10"
                            : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
                      >
                        <span className="truncate">{client.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold text-xs font-semibold">
                DO
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">David O.</p>
                <p className="text-xs text-gray-500 truncate">Owner</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("crm_token");
                window.location.reload();
              }}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — light */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b border-border-subtle bg-surface px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-muted hover:text-text-primary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-gold font-bold text-brand-navy text-xs">
              D
            </div>
            <span className="text-sm font-semibold text-text-primary">Donna CRM</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-raised p-4 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
