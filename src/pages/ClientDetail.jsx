import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Phone,
  Mail,
  Clock,
  Award,
  User,
  CheckSquare,
  Edit3,
  Check,
  X,
  CheckCircle2,
} from "lucide-react";
import Card, { CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import {
  fetchClient,
  fetchTasks,
  fetchCompletedTasks,
  updateTask,
  updateClient,
} from "../lib/api";
import {
  cn,
  formatDate,
  formatRelative,
  getStatusColor,
  getInitials,
} from "../lib/utils";

const PRIORITY_COLORS = {
  4: "bg-red-400",
  3: "bg-orange-400",
  2: "bg-blue-400",
  1: "bg-gray-500",
};

const PRIORITY_OPTIONS = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
  { value: 4, label: "Urgent" },
];

function TaskModal({ task, onClose, onSave, onComplete }) {
  const [content, setContent] = useState(task.content || "");
  const [dueDate, setDueDate] = useState(task.due?.date || "");
  const [priority, setPriority] = useState(task.priority || 2);
  const [notes, setNotes] = useState(task.notes || "");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(task.id, { content, due_date: dueDate || null, priority, notes });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(task.id);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border-default bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">Edit Task</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Task title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Task</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              autoFocus
              className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold/50 focus:outline-none resize-none"
            />
          </div>

          {/* Due date + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-brand-gold/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-brand-gold/50 focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes..."
              className="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold/50 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-subtle px-5 py-4">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? "Completing..." : "Mark Complete"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:border-border-default/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-black hover:bg-brand-gold-light transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskView, setTaskView] = useState("open"); // "open" | "completed"
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClient(id), fetchTasks()])
      .then(([c, t]) => {
        setClient(c);
        setNotesText(c.notes || "");
        setTasks(
          t.filter(
            (task) =>
              task.client_id === id ||
              (c.name &&
                task.project_name?.toLowerCase() === c.name.toLowerCase())
          )
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Reload completed tasks every time the tab is opened — filter client-side
  // to catch tasks matched by project_name as well as client_id
  useEffect(() => {
    if (taskView === "completed" && client) {
      fetchCompletedTasks().then((data) => {
        const filtered = (data || []).filter(
          (t) =>
            t.client_id === id ||
            (client.name &&
              t.project_name?.toLowerCase() === client.name.toLowerCase())
        );
        setCompletedTasks(filtered);
      }).catch(() => {});
    }
  }, [taskView, id, client]);

  const handleSaveNotes = async () => {
    try {
      await updateClient(id, { notes: notesText });
      setClient((prev) => ({ ...prev, notes: notesText }));
    } catch {
      // accept local state
    }
    setEditingNotes(false);
  };

  const handleTaskSave = async (taskId, fields) => {
    try {
      const res = await updateTask(taskId, fields);
      const updated = res.task || { ...tasks.find((t) => t.id === taskId), ...fields };
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
      setSelectedTask(null);
    } catch {
      setSelectedTask(null);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await updateTask(taskId, { is_completed: true });
      const completed = tasks.find((t) => t.id === taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (completed) {
        setCompletedTasks((prev) => [
          { ...completed, is_completed: true, completed_at: new Date().toISOString() },
          ...prev,
        ]);
      }
      setSelectedTask(null);
      setTaskView("completed"); // switch to completed tab so it's immediately visible
    } catch {
      setSelectedTask(null);
    }
  };

  if (loading) return <PageLoader />;
  if (!client) {
    return (
      <EmptyState
        icon={User}
        title="Client not found"
        description="This client may have been removed."
      />
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const openTasks = tasks.filter((t) => !t.is_completed);

  const lastAct = client.last_activity ? new Date(client.last_activity) : null;
  const daysQuiet = lastAct
    ? Math.floor((Date.now() - lastAct.getTime()) / 86400000)
    : 999;

  return (
    <div className="space-y-6">
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleTaskSave}
          onComplete={handleTaskComplete}
        />
      )}

      {/* Back nav */}
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-gold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      {/* Client header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {client.logo_url ? (
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-surface-raised flex items-center justify-center shrink-0">
              <img
                src={client.logo_url}
                alt={client.name}
                className="h-full w-full object-contain p-1"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold text-lg font-bold">
              {getInitials(client.name)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge className={getStatusColor(client.type)}>{client.type}</Badge>
              <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
              {daysQuiet >= 60 && (
                <Badge className="text-red-400 bg-red-400/10">{daysQuiet}d quiet</Badge>
              )}
              {daysQuiet >= 30 && daysQuiet < 60 && (
                <Badge className="text-amber-400 bg-amber-400/10">{daysQuiet}d quiet</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {client.contact_email && (
            <a
              href={`mailto:${client.contact_email}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
          {client.contact_phone && (
            <a
              href={`tel:${client.contact_phone}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          )}
        </div>
      </div>

      {/* Contact info bar */}
      <Card className="flex flex-wrap gap-6 p-4">
        {client.contact_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-text-muted" />
            <span className="text-text-secondary">{client.contact_name}</span>
          </div>
        )}
        {client.contact_email && (
          <a
            href={`mailto:${client.contact_email}`}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-gold transition-colors"
          >
            <Mail className="h-4 w-4 text-text-muted" />
            {client.contact_email}
          </a>
        )}
        {client.contact_phone && (
          <a
            href={`tel:${client.contact_phone}`}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-gold transition-colors"
          >
            <Phone className="h-4 w-4 text-text-muted" />
            {client.contact_phone}
          </a>
        )}
        {client.website && (
          <a
            href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-gold transition-colors"
          >
            <Globe className="h-4 w-4 text-text-muted" />
            {client.website}
          </a>
        )}
        {client.last_activity && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-text-muted" />
            <span className="text-text-muted">Last active {formatRelative(client.last_activity)}</span>
          </div>
        )}
        {client.referral_source && (
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-brand-gold" />
            <span className="text-brand-gold font-medium">Referred by {client.referral_source}</span>
          </div>
        )}
      </Card>

      {/* Two-column: Notes + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Notes */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Notes</CardTitle>
            {editingNotes ? (
              <button
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-gold hover:text-brand-gold-light transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </button>
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-brand-gold transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </CardHeader>
          {editingNotes ? (
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={10}
              autoFocus
              className="flex-1 w-full rounded-lg border border-brand-gold/30 bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none resize-none"
              placeholder="Add notes about this client..."
            />
          ) : (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap min-h-[10rem]">
              {client.notes || (
                <span className="text-text-muted italic">No notes yet. Click Edit to add some.</span>
              )}
            </p>
          )}
        </Card>

        {/* Tasks */}
        <Card className="flex flex-col">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg bg-surface-raised p-1">
              <button
                onClick={() => setTaskView("open")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  taskView === "open"
                    ? "bg-brand-gold text-black"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                Tasks
                {openTasks.length > 0 && (
                  <span className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    taskView === "open" ? "bg-black/20 text-black" : "bg-brand-gold/20 text-brand-gold"
                  )}>
                    {openTasks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTaskView("completed")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  taskView === "completed"
                    ? "bg-brand-gold text-black"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                Completed
                {completedTasks.length > 0 && (
                  <span className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    taskView === "completed" ? "bg-black/20 text-black" : "bg-emerald-400/20 text-emerald-400"
                  )}>
                    {completedTasks.length}
                  </span>
                )}
              </button>
            </div>
          </CardHeader>

          {taskView === "open" && (
            openTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No open tasks"
                description="All caught up for this client."
              />
            ) : (
              <div className="space-y-1">
                {openTasks.map((task) => {
                  const isOverdue = task.due?.date && task.due.date < today;
                  const isToday = task.due?.date && task.due.date === today;
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                        isOverdue ? "border-red-500/20 bg-red-400/5" : "border-border-subtle hover:border-border-default"
                      )}
                    >
                      {/* Radio / complete button */}
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors hover:border-emerald-400 hover:bg-emerald-400/10",
                          PRIORITY_COLORS[task.priority]
                            ? `border-current ${PRIORITY_COLORS[task.priority].replace("bg-", "text-")}`
                            : "border-gray-500"
                        )}
                        title="Mark complete"
                      />
                      {/* Task text — click to edit */}
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm text-text-primary hover:text-brand-gold transition-colors">{task.content}</p>
                        {task.due?.date && (
                          <p className={cn(
                            "text-xs mt-0.5",
                            isOverdue ? "text-red-400 font-medium" : isToday ? "text-brand-gold font-medium" : "text-text-muted"
                          )}>
                            {isOverdue ? `Overdue — ${formatDate(task.due.date)}` : isToday ? "Due today" : `Due ${formatDate(task.due.date)}`}
                          </p>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {taskView === "completed" && (
            completedTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No completed tasks"
                description="Completed tasks will appear here."
              />
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-border-subtle p-3 opacity-70"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-secondary line-through">{task.content}</p>
                      {task.completed_at && (
                        <p className="text-xs mt-0.5 text-text-muted">
                          Completed {formatRelative(task.completed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      </div>
    </div>
  );
}
