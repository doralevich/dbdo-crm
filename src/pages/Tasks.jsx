import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchTasks } from "../lib/api";
import { cn, formatDate } from "../lib/utils";

const PRIORITY_LABELS = {
  4: { label: "Urgent", color: "text-red-400 bg-red-400/10" },
  3: { label: "High", color: "text-orange-400 bg-orange-400/10" },
  2: { label: "Medium", color: "text-blue-400 bg-blue-400/10" },
  1: { label: "Low", color: "text-gray-400 bg-gray-400/10" },
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let result = tasks.filter((t) => !t.is_completed);
    if (filterPriority !== "all") {
      result = result.filter((t) => t.priority === parseInt(filterPriority));
    }
    return result;
  }, [tasks, filterPriority]);

  // Group by client project
  const grouped = useMemo(() => {
    const groups = {};
    for (const task of filtered) {
      const key = task.project_name || "Uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    // Sort tasks within each group by due date, then priority
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const ad = a.due?.date || "9999";
        const bd = b.due?.date || "9999";
        if (ad !== bd) return ad.localeCompare(bd);
        return b.priority - a.priority;
      });
    }
    return groups;
  }, [filtered]);

  const toggleGroup = (name) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Expand all by default on first load
  useEffect(() => {
    if (Object.keys(grouped).length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(Object.keys(grouped)));
    }
  }, [grouped]);

  const overdue = filtered.filter((t) => t.due && t.due.date < today);
  const dueToday = filtered.filter((t) => t.due && t.due.date === today);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
        <p className="text-sm text-text-muted mt-1">
          {filtered.length} task{filtered.length !== 1 && "s"} remaining
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {overdue.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-400/5 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {overdue.length} overdue
            </span>
          </div>
        )}
        {dueToday.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-brand-gold/30 bg-brand-gold/5 px-3 py-2">
            <Calendar className="h-4 w-4 text-brand-gold" />
            <span className="text-sm font-medium text-brand-gold">
              {dueToday.length} due today
            </span>
          </div>
        )}
      </div>

      {/* Priority filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterPriority("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            filterPriority === "all"
              ? "bg-brand-gold text-brand-navy"
              : "bg-surface-raised text-text-secondary hover:text-text-primary"
          )}
        >
          All
        </button>
        {[4, 3, 2, 1].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(String(p))}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filterPriority === String(p)
                ? "bg-brand-gold text-brand-navy"
                : "bg-surface-raised text-text-secondary hover:text-text-primary"
            )}
          >
            {PRIORITY_LABELS[p].label}
          </button>
        ))}
      </div>

      {/* Grouped tasks */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="All caught up, or try adjusting your filters."
        />
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([project, projectTasks]) => {
            const isExpanded = expandedGroups.has(project);
            const projectOverdue = projectTasks.filter(
              (t) => t.due && t.due.date < today
            );
            return (
              <Card key={project} className="p-0 overflow-hidden">
                <button
                  onClick={() => toggleGroup(project)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-raised/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    )}
                    <h3 className="text-sm font-semibold text-text-primary">
                      {project}
                    </h3>
                    <span className="text-xs text-text-muted">
                      {projectTasks.length} task{projectTasks.length !== 1 && "s"}
                    </span>
                    {projectOverdue.length > 0 && (
                      <Badge className="text-red-400 bg-red-400/10">
                        {projectOverdue.length} overdue
                      </Badge>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border-subtle divide-y divide-border-subtle">
                    {projectTasks.map((task) => {
                      const isOverdue = task.due && task.due.date < today;
                      const isToday = task.due && task.due.date === today;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3",
                            isOverdue && "bg-red-400/5"
                          )}
                        >
                          <Circle
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              task.priority === 4
                                ? "text-red-400"
                                : task.priority === 3
                                ? "text-orange-400"
                                : task.priority === 2
                                ? "text-blue-400"
                                : "text-gray-500"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-primary">
                              {task.content}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge className={PRIORITY_LABELS[task.priority].color}>
                                {PRIORITY_LABELS[task.priority].label}
                              </Badge>
                              {task.due && (
                                <span
                                  className={cn(
                                    "text-xs",
                                    isOverdue
                                      ? "text-red-400 font-medium"
                                      : isToday
                                      ? "text-brand-gold font-medium"
                                      : "text-text-muted"
                                  )}
                                >
                                  {isOverdue
                                    ? `Overdue — ${formatDate(task.due.date)}`
                                    : isToday
                                    ? "Due today"
                                    : formatDate(task.due.date)}
                                </span>
                              )}
                              {task.labels?.map((label) => (
                                <Badge key={label}>{label}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
