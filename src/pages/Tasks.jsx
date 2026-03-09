import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare, AlertTriangle, Calendar, ChevronDown,
  ChevronRight, CheckCircle2, Plus,
} from "lucide-react";
import Card from "../components/Card";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import TaskDrawer from "../components/TaskDrawer";
import AddTaskModal from "../components/AddTaskModal";
import { fetchTasks, fetchClients } from "../lib/api";
import { cn, formatDate } from "../lib/utils";

const PRIORITY = {
  4: { label: "Urgent", border: "border-l-red-500",    dot: "bg-red-500" },
  3: { label: "High",   border: "border-l-orange-400", dot: "bg-orange-400" },
  2: { label: "Medium", border: "border-l-blue-400",   dot: "bg-blue-400" },
  1: { label: "Low",    border: "border-l-gray-500",   dot: "bg-gray-500" },
};

function TaskRow({ task, today, onClick }) {
  const p = PRIORITY[task.priority] || PRIORITY[1];
  const isOverdue = task.due_date && task.due_date < today;
  const isToday   = task.due_date && task.due_date === today;

  return (
    <button
      onClick={() => onClick(task)}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-2.5 border-l-2 hover:bg-surface-raised/40 transition-colors text-left",
        p.border,
        isOverdue && "bg-red-400/5"
      )}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-text-muted/40 group-hover:text-emerald-400 transition-colors" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary leading-snug">{task.content}</p>
        {task.due_date && (
          <span className={cn("text-xs",
            isOverdue ? "text-red-400 font-medium" :
            isToday   ? "text-brand-gold font-medium" :
            "text-text-muted"
          )}>
            {isOverdue ? `Overdue · ${formatDate(task.due_date)}` :
             isToday   ? "Due today" :
             formatDate(task.due_date)}
          </span>
        )}
        {(task.description || task.notes) && (
          <span className="ml-2 text-xs text-text-muted/60 italic">has notes</span>
        )}
      </div>
      <div className={cn("h-2 w-2 rounded-full shrink-0", p.dot)} title={p.label} />
    </button>
  );
}

export default function Tasks() {
  const [tasks, setTasks]             = useState([]);
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterPriority, setFilter]   = useState("all");
  const [expandedGroups, setExpanded] = useState(new Set());
  const [selectedTask, setSelected]   = useState(null);
  const [showAdd, setShowAdd]         = useState(false);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchClients()])
      .then(([t, c]) => { setTasks(t); setClients(c); })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let r = tasks.filter(t => !t.is_completed);
    if (filterPriority !== "all") r = r.filter(t => t.priority === parseInt(filterPriority));
    return r;
  }, [tasks, filterPriority]);

  const grouped = useMemo(() => {
    const g = {};
    for (const t of filtered) {
      const key = t.owner || "Uncategorized";
      if (!g[key]) g[key] = [];
      g[key].push(t);
    }
    for (const k of Object.keys(g)) {
      g[k].sort((a, b) => {
        const ad = a.due_date || "9999", bd = b.due_date || "9999";
        return ad !== bd ? ad.localeCompare(bd) : b.priority - a.priority;
      });
    }
    return Object.fromEntries(Object.entries(g).sort(([a],[b]) => a.localeCompare(b)));
  }, [filtered]);

  const toggleGroup = (name) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const handleTaskUpdate = (updated) => {
    if (updated.is_completed) {
      setTasks(prev => prev.filter(t => t.id !== updated.id));
    } else {
      setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    }
  };

  const handleTaskDelete = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleTaskAdd = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const overdue  = filtered.filter(t => t.due_date && t.due_date < today);
  const dueToday = filtered.filter(t => t.due_date && t.due_date === today);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-muted mt-0.5">{filtered.length} open</p>
        </div>
        <div className="flex items-center gap-2">
          {overdue.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-400/5 px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">{overdue.length} overdue</span>
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-brand-gold/30 bg-brand-gold/5 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-brand-gold" />
              <span className="text-xs font-medium text-brand-gold">{dueToday.length} today</span>
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-gold/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Priority filter */}
      <div className="flex flex-wrap gap-1.5">
        {[["all","All"],[4,"Urgent"],[3,"High"],[2,"Medium"],[1,"Low"]].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(String(val))}
            className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filterPriority === String(val)
                ? "bg-brand-gold text-brand-navy"
                : "bg-surface-raised text-text-secondary hover:text-text-primary")}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Task groups — 2-column */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyState icon={CheckSquare} title="No open tasks" description="All caught up. Add a task to get started." />
      ) : (
        <div className="columns-1 lg:columns-2 gap-4">
          {Object.entries(grouped).map(([project, projectTasks]) => {
            const isExpanded = expandedGroups.has(project);
            const overdueCt  = projectTasks.filter(t => t.due_date && t.due_date < today).length;
            return (
              <div key={project} className="break-inside-avoid mb-3">
                <Card className="p-0 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(project)}
                    className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-surface-raised/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        : <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />}
                      <span className="text-sm font-semibold text-text-primary truncate">{project}</span>
                      <span className="text-xs text-text-muted shrink-0">{projectTasks.length}</span>
                      {overdueCt > 0 && (
                        <span className="text-xs text-red-400 shrink-0">{overdueCt} overdue</span>
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border-subtle divide-y divide-border-subtle/50">
                      {projectTasks.map(task => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          today={today}
                          onClick={setSelected}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Task drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          clients={clients}
          onClose={() => setSelected(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {/* Add task modal */}
      {showAdd && (
        <AddTaskModal
          clients={clients}
          onClose={() => setShowAdd(false)}
          onAdd={handleTaskAdd}
        />
      )}
    </div>
  );
}
