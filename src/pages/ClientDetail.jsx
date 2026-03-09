import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  CheckSquare,
  Clock,
  Plus,
  Send,
  Award,
  X,
  User,
  CalendarDays,
  Video,
  MapPin,
  Users,
} from "lucide-react";
import Card, { CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import {
  fetchClient,
  fetchInteractions,
  fetchTasks,
  createInteraction,
  updateClient,
} from "../lib/api";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelative,
  formatTime,
  getStatusColor,
  getInitials,
} from "../lib/utils";

const INTERACTION_ICONS = {
  email: Mail,
  call: Phone,
  meeting: User,
  note: FileText,
};

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);

  const [interactions, setInteractions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState("note");
  const [noteSummary, setNoteSummary] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClient(id),
      fetchInteractions(id),
      fetchTasks(),
    ])
      .then(([c, i, t]) => {
        setClient(c);
        setNotesText(c.notes || "");
        setInteractions(i);
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

  const handleAddNote = async () => {
    if (!noteSummary.trim()) return;
    try {
      const newInteraction = await createInteraction(id, {
        type: noteType,
        summary: noteSummary.trim(),
      });
      setInteractions([
        { ...newInteraction, created_at: new Date().toISOString() },
        ...interactions,
      ]);
      setNoteSummary("");
      setShowNoteForm(false);
    } catch {
      setInteractions([
        {
          id: `i${Date.now()}`,
          type: noteType,
          summary: noteSummary.trim(),
          created_at: new Date().toISOString(),
        },
        ...interactions,
      ]);
      setNoteSummary("");
      setShowNoteForm(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateClient(id, { notes: notesText });
      setClient((prev) => ({ ...prev, notes: notesText }));
      setEditingNotes(false);
    } catch {
      setEditingNotes(false);
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

  const linkedContacts = client.linked_contacts || [];
  const upcomingEvents = client.upcoming_events || [];
  const today = new Date().toISOString().split("T")[0];

  // Compute days quiet for warning badges
  const lastAct = client.last_activity ? new Date(client.last_activity) : null;
  const daysQuiet = lastAct
    ? Math.floor((Date.now() - lastAct.getTime()) / 86400000)
    : 999;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks", count: tasks.filter((t) => !t.is_completed).length },

    { key: "activity", label: "Activity", count: interactions.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back nav + header */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-gold transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-surface-raised flex items-center justify-center shrink-0">
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold text-lg font-bold">
                {getInitials(client.name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {client.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={getStatusColor(client.type)}>
                  {client.type}
                </Badge>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                {client.monthly_value > 0 && (
                  <span className="text-sm font-semibold text-brand-gold">
                    {formatCurrency(client.monthly_value)}/mo
                  </span>
                )}
                {daysQuiet >= 60 && (
                  <Badge className="text-red-600 bg-red-100">
                    {daysQuiet}d quiet - needs re-engagement
                  </Badge>
                )}
                {daysQuiet >= 30 && daysQuiet < 60 && (
                  <Badge className="text-amber-600 bg-amber-100">
                    {daysQuiet}d quiet
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {client.contact_email && (
              <a
                href={`mailto:${client.contact_email}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:border-brand-gold/30 hover:text-brand-gold transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
            {client.contact_phone && (
              <a
                href={`tel:${client.contact_phone}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:border-brand-gold/30 hover:text-brand-gold transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
            <button
              onClick={() => setShowNoteForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-gold-light transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log Activity
            </button>
          </div>
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

      {/* Linked Google Contacts */}
      {linkedContacts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {linkedContacts.map((contact, i) => (
            <Card key={i} className="flex items-center gap-3 p-3">
              {contact.photo_url ? (
                <img
                  src={contact.photo_url}
                  alt={contact.name}
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold shrink-0">
                  {getInitials(contact.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                {contact.title && (
                  <p className="text-xs text-text-muted">{contact.title}</p>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="text-xs text-text-secondary hover:text-brand-gold transition-colors">
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="text-xs text-text-secondary hover:text-brand-gold transition-colors">
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-subtle">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === key
                ? "border-brand-gold text-brand-gold"
                : "border-transparent text-text-muted hover:text-text-secondary"
            )}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  activeTab === key
                    ? "bg-brand-gold/20 text-brand-gold"
                    : "bg-surface-raised text-text-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Meetings */}
          {upcomingEvents.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-gold" />
                <CardTitle>Upcoming Meetings</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const startDt = event.start?.dateTime || event.start?.date;
                  const endDt = event.end?.dateTime || event.end?.date;
                  const start = startDt ? new Date(startDt) : null;
                  const isToday = start && start.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-start gap-4 rounded-lg border p-3",
                        isToday ? "border-brand-gold/30 bg-brand-gold/5" : "border-border-subtle"
                      )}
                    >
                      <div className="flex flex-col items-center shrink-0 w-14">
                        <span className="text-xs text-text-muted font-medium">
                          {isToday
                            ? "Today"
                            : start?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-sm font-semibold text-text-primary">
                          {startDt ? formatTime(startDt) : ""}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          {event.summary}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {endDt && (
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(startDt)} - {formatTime(endDt)}
                            </span>
                          )}
                          {event.location && (
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                          {event.attendees?.length > 0 && (
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.attendees.length} attendee{event.attendees.length !== 1 && "s"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Notes</CardTitle>
              <button
                onClick={() => {
                  if (editingNotes) handleSaveNotes();
                  else setEditingNotes(true);
                }}
                className="text-xs text-brand-gold hover:text-brand-gold-light transition-colors"
              >
                {editingNotes ? "Save" : "Edit"}
              </button>
            </CardHeader>
            {editingNotes ? (
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none"
                placeholder="Add notes about this client..."
              />
            ) : (
              <p className="text-sm text-text-secondary leading-relaxed">
                {client.notes || "No notes yet. Click Edit to add some."}
              </p>
            )}
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Open Tasks</span>
                <span className="text-sm font-semibold text-text-primary">
                  {tasks.filter((t) => !t.is_completed).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Completed Tasks</span>
                <span className="text-sm font-semibold text-text-primary">
                  {tasks.filter((t) => t.is_completed).length}
                </span>
              </div>
              {client.monthly_value > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Monthly Retainer</span>
                  <span className="text-sm font-semibold text-brand-gold">
                    {formatCurrency(client.monthly_value)}/mo
                  </span>
                </div>
              )}
              {client.referral_source && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Referral Source</span>
                  <span className="text-sm text-brand-gold font-medium flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {client.referral_source}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            {interactions.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                No activity logged yet
              </p>
            ) : (
              <div className="space-y-3">
                {interactions.slice(0, 5).map((interaction) => {
                  const Icon =
                    INTERACTION_ICONS[interaction.type] || MessageSquare;
                  return (
                    <div
                      key={interaction.id}
                      className="flex items-start gap-3"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised shrink-0">
                        <Icon className="h-3.5 w-3.5 text-text-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-secondary">
                          {interaction.summary}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatRelative(interaction.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-2">
          {tasks.filter((t) => !t.is_completed).length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No active tasks"
              description="All tasks for this client are completed."
            />
          ) : (
            tasks
              .filter((t) => !t.is_completed)
              .map((task) => {
                const isOverdue = task.due && task.due.date < today;
                return (
                  <Card
                    key={task.id}
                    className={cn("p-4", isOverdue && "border-red-300")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                          task.priority === 4
                            ? "bg-red-500"
                            : task.priority === 3
                            ? "bg-orange-500"
                            : task.priority === 2
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary">
                          {task.content}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {task.due && (
                            <span
                              className={cn(
                                "text-xs",
                                isOverdue
                                  ? "text-red-500 font-medium"
                                  : "text-text-muted"
                              )}
                            >
                              {isOverdue ? "Overdue - " : "Due "}
                              {formatDate(task.due.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      )}



      {activeTab === "activity" && (
        <div className="space-y-3">
          {interactions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No activity"
              description="Log calls, meetings, or notes for this client."
            />
          ) : (
            interactions.map((interaction) => {
              const Icon =
                INTERACTION_ICONS[interaction.type] || MessageSquare;
              return (
                <Card key={interaction.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised shrink-0">
                      <Icon className="h-4 w-4 text-text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{interaction.type}</Badge>
                        <span className="text-xs text-text-muted">
                          {formatRelative(interaction.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {interaction.summary}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowNoteForm(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border-subtle bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Log Activity
              </h3>
              <button
                onClick={() => setShowNoteForm(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {["note", "call", "meeting", "email"].map((type) => (
                <button
                  key={type}
                  onClick={() => setNoteType(type)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    noteType === type
                      ? "bg-brand-gold text-brand-navy"
                      : "bg-surface-raised text-text-secondary hover:text-text-primary"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Summary */}
            <textarea
              value={noteSummary}
              onChange={(e) => setNoteSummary(e.target.value)}
              placeholder="What happened?"
              rows={4}
              className="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNoteForm(false)}
                className="rounded-lg px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteSummary.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
