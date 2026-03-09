import { NavLink, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, CheckSquare, CalendarDays,
  Menu, X, LogOut, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchTaskClients } from "../lib/api";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/",        icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients", icon: Users,           label: "Clients"   },
  { to: "/tasks",   icon: CheckSquare,     label: "Tasks"     },
  { to: "/calendar",icon: CalendarDays,    label: "Calendar"  },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [taskClients, setTaskClients]   = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (tasksExpanded) {
      fetchTaskClients().then(setTaskClients).catch(() => {});
    }
  }, [tasksExpanded, location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#000" }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-60 flex-col transition-transform duration-300 lg:static lg:translate-x-0",
        "border-r border-white/8",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "rgba(28,28,30,0.95)", backdropFilter: "blur(20px)" }}>

        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gold font-bold text-black text-sm tracking-tight">
            D
          </div>
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">DBDO</p>
            <p className="text-[10px] text-white/30 tracking-widest uppercase">Agency CRM</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            const isTasks  = to === "/tasks";

            return (
              <div key={to}>
                <div className="flex items-center">
                  <NavLink to={to} onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:bg-white/6 hover:text-white/80"
                    )}>
                    <Icon className={cn("h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-brand-gold" : "text-white/40"
                    )} />
                    {label}
                  </NavLink>
                  {isTasks && (
                    <button onClick={() => setTasksExpanded(e => !e)}
                      className="p-1.5 text-white/30 hover:text-white/60 transition-colors mr-1">
                      {tasksExpanded
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />}
                    </button>
                  )}
                </div>

                {isTasks && tasksExpanded && (
                  <div className="ml-9 mt-0.5 space-y-0.5 pb-1">
                    {taskClients.map(client => (
                      <NavLink key={client.id}
                        to={`/clients/${client.id}?tab=tasks`}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "block rounded-lg px-2.5 py-1.5 text-[12px] truncate transition-colors",
                          location.pathname.includes(client.id)
                            ? "text-brand-gold bg-brand-gold/10"
                            : "text-white/40 hover:text-white/70 hover:bg-white/6"
                        )}>
                        {client.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-brand-gold/20 flex items-center justify-center text-[11px] font-bold text-brand-gold">
                DO
              </div>
              <p className="text-[12px] font-medium text-white/70">David O.</p>
            </div>
            <button onClick={() => { localStorage.removeItem("crm_token"); window.location.reload(); }}
              className="text-white/25 hover:text-red-400 transition-colors" title="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main */}
      <div className="flex flex-1 flex-col overflow-hidden" style={{ background: "#111113" }}>
        {/* Mobile header */}
        <header className="flex h-12 items-center gap-3 border-b border-white/8 px-4 lg:hidden"
          style={{ background: "rgba(28,28,30,0.9)", backdropFilter: "blur(20px)" }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">DBDO</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
