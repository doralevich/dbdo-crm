import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Mail,
  CalendarDays,
  UsersRound,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/email", icon: Mail, label: "Email" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/team", icon: UsersRound, label: "Team" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-navy border-r border-border-subtle transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border-subtle">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold font-bold text-brand-navy text-sm">
            D
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">Donna CRM</h1>
            <p className="text-[10px] text-text-muted tracking-wider uppercase">DBDO Agency</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold text-xs font-semibold">
                DO
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">David O.</p>
                <p className="text-xs text-text-muted truncate">Owner</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("crm_token");
                window.location.reload();
              }}
              className="text-text-muted hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b border-border-subtle bg-brand-navy px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-gold font-bold text-brand-navy text-xs">
              D
            </div>
            <span className="text-sm font-semibold">Donna CRM</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-950 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
