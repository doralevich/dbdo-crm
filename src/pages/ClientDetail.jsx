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
} from "lucide-react";
import Card, { CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import {
  fetchClient,
  fetchTasks,
  updateClient,
} from "../lib/api";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelative,
  getStatusColor,
  getInitials,
} from "../lib/utils";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

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

  const handleSaveNotes = async () => {
    try {
      await updateClient(id, { notes: notesText });
      setClient((prev) => ({ ...prev, notes: notesText }));
    } catch {
      // silently accept local state
    }
    setEditingNotes(false);
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
              {client.monthly_value > 0 && (
                <span className="text-sm font-semibold text-brand-gold">
                  {formatCurrency(client.monthly_value)}/mo
                </span>
              )}
              {daysQuiet >= 60 && (
                <Badge className="text-red-400 bg-red-400/10">{daysQuiet}d quiet</Badge>
              )}
              {daysQuiet >= 30 && daysQuiet < 60 && (
                <Badge className="text-amber-400 bg-amber-400/10">{daysQuiet}d quiet</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
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
            <span className="text-text-muted">
              Last active {formatRelative(client.last_activity)}
            </span>
          </div>
        )}
        {client.referral_source && (
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-brand-gold" />
            <span className="text-brand-gold font-medium">
              Referred by {client.referral_source}
            </span>
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
            <CardTitle>
              Tasks
              {openTasks.length > 0 && (
                <span className="ml-2 rounded-full bg-brand-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-gold">
                  {openTasks.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>

          {openTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No open tasks"
              description="All caught up for this client."
            />
          ) : (
            <div className="space-y-2">
              {openTasks.map((task) => {
                const isOverdue = task.due && task.due.date < today;
                const isToday = task.due && task.due.date === today;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3",
                      isOverdue
                        ? "border-red-500/20 bg-red-400/5"
                        : "border-border-subtle"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        task.priority === 4
                          ? "bg-red-400"
                          : task.priority === 3
                          ? "bg-orange-400"
                          : task.priority === 2
                          ? "bg-blue-400"
                          : "bg-gray-500"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">{task.content}</p>
                      {task.due && (
                        <p
                          className={cn(
                            "text-xs mt-0.5",
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
                            : `Due ${formatDate(task.due.date)}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
