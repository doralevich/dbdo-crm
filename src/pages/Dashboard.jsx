import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, DollarSign, AlertTriangle, TrendingUp, CheckSquare,
  CalendarDays, ArrowRight, Clock, Circle, Star, Eye, Plus,
  CloudSun, TrendingDown,
} from "lucide-react";
import StatCard from "../components/StatCard";
import Card, { CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import AddTaskModal from "../components/AddTaskModal";
import { fetchDashboardStats, fetchTasks, fetchEvents, fetchClients } from "../lib/api";
import { cn, formatCurrency, formatRelative, formatTime, getStatusColor } from "../lib/utils";

// ── Live clock
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}

// ── Weather via open-meteo (no API key)
const LAT = 40.7906, LON = -73.6516; // Roslyn, NY
function useWeather() {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=5`)
      .then(r => r.json()).then(setWeather).catch(() => {});
  }, []);
  return weather;
}

// WMO weather code → simple label + emoji
function weatherLabel(code) {
  if (code == null) return { label: "—", emoji: "🌤" };
  if (code === 0)        return { label: "Clear",       emoji: "☀️" };
  if (code <= 2)         return { label: "Partly cloudy",emoji: "⛅" };
  if (code <= 3)         return { label: "Overcast",    emoji: "☁️" };
  if (code <= 49)        return { label: "Foggy",       emoji: "🌫" };
  if (code <= 59)        return { label: "Drizzle",     emoji: "🌦" };
  if (code <= 69)        return { label: "Rain",        emoji: "🌧" };
  if (code <= 79)        return { label: "Snow",        emoji: "❄️" };
  if (code <= 84)        return { label: "Rain showers",emoji: "🌦" };
  if (code <= 94)        return { label: "Snow showers",emoji: "🌨" };
  return { label: "Thunderstorm", emoji: "⛈" };
}

const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Stocks via Yahoo Finance proxy (no key needed)
const TICKERS = [
  { sym: "^GSPC", label: "S&P 500" },
  { sym: "^DJI",  label: "Dow" },
  { sym: "^IXIC", label: "Nasdaq" },
  { sym: "BTC-USD", label: "BTC" },
];
function useStocks() {
  const [stocks, setStocks] = useState(null);
  useEffect(() => {
    const symbols = TICKERS.map(t => t.sym).join(",");
    fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChangePercent&corsDomain=finance.yahoo.com`)
      .then(r => r.json())
      .then(d => {
        const quotes = d?.quoteResponse?.result || [];
        setStocks(quotes.map(q => ({
          sym: q.symbol,
          label: TICKERS.find(t => t.sym === q.symbol)?.label || q.symbol,
          price: q.regularMarketPrice,
          pct: q.regularMarketChangePercent,
        })));
      })
      .catch(() => {
        // Fallback mock so the widget still renders
        setStocks(TICKERS.map(t => ({ ...t, price: null, pct: null })));
      });
  }, []);
  return stocks;
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [events, setEvents]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const now     = useClock();
  const weather = useWeather();
  const stocks  = useStocks();

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchTasks(),
      fetchEvents({ timeMin: new Date().toISOString(), timeMax: new Date(Date.now() + 14 * 86400000).toISOString() }),
      fetchClients(),
    ])
      .then(([s, t, ev, c]) => {
        setStats(s);
        setTasks(t);
        setClients(c);
        const upcoming = (ev || [])
          .filter(e => new Date(e.start?.dateTime || e.start?.date) >= new Date())
          .sort((a, b) => new Date(a.start?.dateTime || a.start?.date) - new Date(b.start?.dateTime || b.start?.date));
        setEvents(upcoming);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const today       = new Date().toISOString().split("T")[0];
  const overdue     = tasks.filter(t => t.due_date && t.due_date < today && !t.is_completed);
  const todayTasks  = tasks.filter(t => t.due_date && t.due_date === today && !t.is_completed);
  const urgentTasks = [...overdue, ...todayTasks].slice(0, 5);
  const upcomingEvents = events.slice(0, 5);
  const needsAttention = stats?.needs_attention || [];

  // Weather helpers
  const cur    = weather?.current;
  const daily  = weather?.daily;
  const curWx  = weatherLabel(cur?.weathercode);

  return (
    <div className="space-y-5">
      {/* ── Top bar: date/time + Add Task */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h1>
          <p className="text-3xl font-mono font-semibold text-brand-gold mt-0.5 tracking-tight">
            {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-gold/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </div>

      {/* ── Weather + Stocks row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Weather */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{curWx.emoji}</span>
              <div>
                <p className="text-xl font-bold text-text-primary leading-none">
                  {cur ? `${Math.round(cur.temperature_2m)}°F` : "—"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{curWx.label} · Roslyn, NY</p>
              </div>
            </div>
            {cur && (
              <p className="text-xs text-text-muted">{Math.round(cur.windspeed_10m)} mph</p>
            )}
          </div>
          {/* 5-day forecast */}
          {daily && (
            <div className="grid grid-cols-5 gap-1">
              {[0,1,2,3,4].map(i => {
                const d = new Date(daily.time[i] + "T12:00:00");
                const wx = weatherLabel(daily.weathercode[i]);
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5 rounded-lg bg-white/5 py-2 px-1">
                    <span className="text-[10px] font-medium text-text-muted">{i === 0 ? "Today" : DAY[d.getDay()]}</span>
                    <span className="text-base">{wx.emoji}</span>
                    <span className="text-[11px] font-semibold text-text-primary">{Math.round(daily.temperature_2m_max[i])}°</span>
                    <span className="text-[10px] text-text-muted">{Math.round(daily.temperature_2m_min[i])}°</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Stocks */}
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-3">Markets</p>
          {!stocks ? (
            <p className="text-xs text-text-muted">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {stocks.map(s => {
                const up = s.pct >= 0;
                return (
                  <div key={s.sym} className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2",
                    up ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                  )}>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{s.label}</p>
                      <p className="text-[10px] text-text-muted">
                        {s.price != null ? (s.price > 1000 ? s.price.toLocaleString("en-US", {maximumFractionDigits:0}) : s.price.toLocaleString("en-US", {maximumFractionDigits:2})) : "—"}
                      </p>
                    </div>
                    <span className={cn("text-xs font-semibold", up ? "text-emerald-400" : "text-red-400")}>
                      {s.pct != null ? `${up ? "+" : ""}${s.pct.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-text-muted/50 mt-2 text-right">via Yahoo Finance · 15min delay</p>
        </Card>
      </div>

      {/* ── Stats row (removed Active Projects) */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pipeline Value"      value={formatCurrency(stats?.pipeline_value || 0)}          icon={TrendingUp}  />
        <StatCard label="Monthly Retainers"   value={formatCurrency(stats?.monthly_retainer_value || 0)}  icon={DollarSign}  />
        <StatCard label="Meetings Today"      value={stats?.meetings_today || 0}                          icon={CalendarDays}/>
      </div>

      {/* ── Main content */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Today's Priorities */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-brand-gold" />
              <CardTitle>Today's Priorities</CardTitle>
            </div>
            <Link to="/tasks" className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-gold transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {urgentTasks.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">All caught up!</p>
            ) : urgentTasks.map((task) => {
              const isOverdue = task.due_date && task.due_date < today;
              return (
                <Link key={task.id} to="/tasks"
                  className="flex items-start gap-3 rounded-lg border border-border-subtle p-3 hover:border-brand-gold/30 transition-colors">
                  <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full",
                    task.priority === 4 ? "bg-red-500" : task.priority === 3 ? "bg-orange-400" : "bg-blue-400"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{task.content}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{task.owner}</span>
                      {isOverdue && <span className="text-xs text-red-400 font-medium">Overdue</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-gold" />
              <CardTitle>Upcoming Events</CardTitle>
            </div>
            <Link to="/calendar" className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-gold transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No upcoming events</p>
            ) : upcomingEvents.map((event) => {
              const startDt = event.start?.dateTime || event.start?.date;
              const start   = startDt ? new Date(startDt) : null;
              const isToday = start && start.toDateString() === new Date().toDateString();
              return (
                <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border-subtle p-3">
                  <div className="flex flex-col items-center shrink-0 w-10 text-center">
                    <span className="text-[10px] uppercase text-text-muted font-medium">
                      {isToday ? "Today" : start ? DAY[start.getDay()] : ""}
                    </span>
                    <span className="text-xs text-brand-gold font-medium">{startDt ? formatTime(startDt) : ""}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">{event.summary}</p>
                    {event.location && <p className="text-xs text-text-muted mt-0.5 truncate">{event.location}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-500" />
                <CardTitle>Needs Attention</CardTitle>
              </div>
              <Link to="/clients" className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-gold transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {needsAttention.map((client) => (
                <Link key={client.id} to={`/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-subtle p-3 hover:border-brand-gold/30 transition-colors">
                  <span className="text-sm font-medium text-text-primary">{client.name}</span>
                  <span className={cn("text-xs font-semibold", client.days_quiet >= 60 ? "text-red-400" : "text-amber-400")}>
                    {client.days_quiet}d quiet
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {showAdd && (
        <AddTaskModal clients={clients} onClose={() => setShowAdd(false)} onAdd={() => setShowAdd(false)} />
      )}
    </div>
  );
}
