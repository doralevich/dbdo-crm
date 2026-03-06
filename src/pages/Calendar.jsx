import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchEvents, syncCalendar as triggerSync } from "../lib/api";
import { cn, formatTime } from "../lib/utils";

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    days.push(dd);
  }
  return days;
}

function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();

  const days = [];
  // Fill preceding days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  // Fill month days
  for (let i = 1; i <= last.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Fill trailing days
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }
  return days;
}

function dateKey(d) {
  return d.toISOString().split("T")[0];
}

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list, week, month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerSync();
      const newEvents = await fetchEvents();
      setEvents(newEvents);
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  // Build event map by date key
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const event of events) {
      const dt = event.start?.dateTime || event.start?.date;
      if (!dt) continue;
      const key = dateKey(new Date(dt));
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [events]);

  // Group events by day for list view
  const grouped = useMemo(() => {
    const groups = {};
    for (const event of events) {
      const dt = event.start?.dateTime || event.start?.date;
      if (!dt) continue;
      const date = new Date(dt);
      const key = date.toDateString();
      if (!groups[key]) groups[key] = { date, events: [] };
      groups[key].events.push(event);
    }
    return Object.values(groups).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [events]);

  const navigateDate = (dir) => {
    const d = new Date(currentDate);
    if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  if (loading) return <PageLoader />;

  const today = new Date().toDateString();
  const todayKey = dateKey(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
          <p className="text-sm text-text-muted mt-1">
            {events.length} event{events.length !== 1 && "s"} from Google Calendar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg p-2 text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-colors disabled:opacity-50"
            title="Sync calendar"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          </button>
          {["list", "week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                view === v
                  ? "bg-brand-gold text-brand-navy"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Week/Month navigation */}
      {(view === "week" || view === "month") && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate(-1)}
            className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary">
              {view === "week"
                ? (() => {
                    const days = getWeekDates(currentDate);
                    const start = days[0];
                    const end = days[6];
                    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                  })()
                : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-brand-gold hover:text-brand-gold-light transition-colors"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        grouped.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Your calendar is clear."
          />
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => {
              const isToday = group.date.toDateString() === today;
              const isTomorrow =
                group.date.toDateString() ===
                new Date(Date.now() + 86400000).toDateString();
              const dayLabel = isToday
                ? "Today"
                : isTomorrow
                ? "Tomorrow"
                : group.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  });

              return (
                <div key={group.date.toISOString()}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2
                      className={cn(
                        "text-sm font-semibold",
                        isToday ? "text-brand-gold" : "text-text-primary"
                      )}
                    >
                      {dayLabel}
                    </h2>
                    <div className="flex-1 h-px bg-border-subtle" />
                    <span className="text-xs text-text-muted">
                      {group.events.length} event{group.events.length !== 1 && "s"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.events.map((event) => {
                      const start = new Date(event.start.dateTime);
                      const end = new Date(event.end.dateTime);
                      const durationMins = Math.round((end - start) / 60000);
                      const durationLabel =
                        durationMins >= 60
                          ? `${Math.round((durationMins / 60) * 10) / 10}h`
                          : `${durationMins}m`;

                      return (
                        <Card
                          key={event.id}
                          className={cn(
                            "flex items-start gap-4",
                            isToday && "border-brand-gold/20"
                          )}
                        >
                          <div className="flex flex-col items-center shrink-0 w-16 pt-0.5">
                            <span className="text-sm font-semibold text-text-primary">
                              {formatTime(event.start.dateTime)}
                            </span>
                            <span className="text-[10px] text-text-muted mt-0.5">
                              {durationLabel}
                            </span>
                          </div>
                          <div className="w-px self-stretch bg-brand-gold/30 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-text-primary">
                              {event.summary}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(event.start.dateTime)} -{" "}
                                  {formatTime(event.end.dateTime)}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.attendees?.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {event.attendees
                                      .map((a) => a.email)
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="grid grid-cols-7 gap-2">
          {getWeekDates(currentDate).map((day) => {
            const key = dateKey(day);
            const dayEvents = eventsByDate[key] || [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl border p-3 min-h-[140px]",
                  isToday
                    ? "border-brand-gold/30 bg-brand-gold/5"
                    : "border-border-subtle bg-surface"
                )}
              >
                <div className="text-center mb-2">
                  <p className="text-[10px] uppercase text-text-muted font-medium">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      isToday ? "text-brand-gold" : "text-text-primary"
                    )}
                  >
                    {day.getDate()}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-lg bg-brand-gold/10 border border-brand-gold/20 px-2 py-1"
                    >
                      <p className="text-[11px] font-medium text-text-primary truncate">
                        {event.summary}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {formatTime(event.start?.dateTime || event.start?.date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] uppercase font-medium text-text-muted py-2"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {getMonthDates(currentDate).map(({ date: day, isCurrentMonth }) => {
              const key = dateKey(day);
              const dayEvents = eventsByDate[key] || [];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg border p-2 min-h-[90px]",
                    !isCurrentMonth && "opacity-40",
                    isToday
                      ? "border-brand-gold/30 bg-brand-gold/5"
                      : "border-border-subtle bg-surface"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-medium mb-1",
                      isToday ? "text-brand-gold" : "text-text-primary"
                    )}
                  >
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="rounded bg-brand-gold/10 px-1 py-0.5"
                        title={event.summary}
                      >
                        <p className="text-[10px] text-text-primary truncate">
                          {event.summary}
                        </p>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-text-muted">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
