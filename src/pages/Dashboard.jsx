import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Mail,
  CalendarDays,
  ArrowRight,
  Clock,
  Circle,
  Star,
} from "lucide-react";
import StatCard from "../components/StatCard";
import Card, { CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import { fetchDashboardStats, fetchTasks, fetchEmails, fetchEvents } from "../lib/api";
import { cn, formatCurrency, formatRelative, formatTime, getStatusColor } from "../lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchTasks(),
      fetchEmails(),
      fetchEvents(),
    ])
      .then(([s, t, e, ev]) => {
        setStats(s);
        setTasks(t);
        setEmails(e);
        setEvents(ev);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(
    (t) => t.due && t.due.date < today && !t.is_completed
  );
  const todayTasks = tasks.filter(
    (t) => t.due && t.due.date === today && !t.is_completed
  );
  const urgentTasks = [...overdueTasks, ...todayTasks].slice(0, 5);
  const importantEmails = emails.filter((e) => !e.is_read || e.is_important).slice(0, 4);
  const upcomingEvents = events.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={stats?.active_projects || 0}
          icon={Users}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(stats?.pipeline_value || 0)}
          icon={TrendingUp}
        />
        <StatCard
          label="Monthly Retainers"
          value={formatCurrency(stats?.monthly_retainer_value || 0)}
          icon={DollarSign}
        />
        <StatCard
          label="Overdue Tasks"
          value={stats?.overdue_tasks || overdueTasks.length}
          icon={AlertTriangle}
          className={
            (stats?.overdue_tasks || overdueTasks.length) > 0
              ? "border-red-500/30"
              : ""
          }
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Priorities */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-brand-gold" />
              <CardTitle>Today's Priorities</CardTitle>
            </div>
            <Link
              to="/tasks"
              className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-gold transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {urgentTasks.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                All caught up!
              </p>
            ) : (
              urgentTasks.map((task) => {
                const isOverdue = task.due && task.due.date < today;
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-border-subtle p-3"
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                        task.priority === 4
                          ? "bg-red-400"
                          : task.priority === 3
                          ? "bg-orange-400"
                          : "bg-blue-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">
                        {task.content}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-text-muted">
                          {task.project_name}
                        </span>
                        {isOverdue && (
                          <Badge className="text-red-400 bg-red-400/10">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-gold" />
              <CardTitle>Upcoming Events</CardTitle>
            </div>
            <Link
              to="/calendar"
              className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-gold transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                No upcoming events
              </p>
            ) : (
              upcomingEvents.map((event) => {
                const start = new Date(event.start.dateTime);
                const isToday =
                  start.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border border-border-subtle p-3"
                  >
                    <div className="flex flex-col items-center shrink-0 w-12">
                      <span className="text-[10px] uppercase text-text-muted font-medium">
                        {isToday
                          ? "Today"
                          : start.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                      </span>
                      <span className="text-xs text-text-secondary font-medium">
                        {formatTime(event.start.dateTime)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">
                        {event.summary}
                      </p>
                      {event.location && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Recent Emails */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-gold" />
              <CardTitle>Recent Emails</CardTitle>
            </div>
            <Link
              to="/email"
              className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-gold transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {importantEmails.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  !email.is_read
                    ? "border-brand-gold/20 bg-brand-gold/5"
                    : "border-border-subtle"
                )}
              >
                <div className="mt-1 shrink-0">
                  {email.is_important ? (
                    <Star className="h-3.5 w-3.5 text-brand-gold fill-brand-gold" />
                  ) : (
                    <Circle
                      className={cn(
                        "h-2 w-2",
                        !email.is_read ? "text-blue-400 fill-blue-400" : "text-transparent"
                      )}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-sm truncate",
                        !email.is_read
                          ? "font-semibold text-text-primary"
                          : "text-text-secondary"
                      )}
                    >
                      {email.from_name}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatRelative(email.date)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm truncate",
                      !email.is_read
                        ? "text-text-primary"
                        : "text-text-secondary"
                    )}
                  >
                    {email.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted truncate">
                    {email.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
