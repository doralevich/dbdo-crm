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
  DollarSign,
  Clock,
  Plus,
  Send,
  Award,
  X,
  User,
} from "lucide-react";
import Card, { CardHeader, CardTitle } from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import {
  fetchClient,
  fetchProposals,
  fetchInteractions,
  fetchTasks,
  createInteraction,
} from "../lib/api";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelative,
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
  const [proposals, setProposals] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState("note");
  const [noteSummary, setNoteSummary] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClient(id),
      fetchProposals(id),
      fetchInteractions(id),
      fetchTasks(),
    ])
      .then(([c, p, i, t]) => {
        setClient(c);
        setProposals(p);
        setInteractions(i);
        // Filter tasks for this client
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
      // Silently handle — mock mode will still work
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

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks", count: tasks.filter((t) => !t.is_completed).length },
    { key: "proposals", label: "Proposals", count: proposals.length },
    { key: "activity", label: "Activity", count: interactions.length },
  ];

  const today = new Date().toISOString().split("T")[0];

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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-navy-lighter text-brand-gold text-lg font-bold">
              {getInitials(client.name)}
            </div>
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
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowNoteForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-gold-light transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Log Activity
          </button>
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
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-text-muted" />
            <span className="text-text-secondary">{client.contact_email}</span>
          </div>
        )}
        {client.contact_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-text-muted" />
            <span className="text-text-secondary">{client.contact_phone}</span>
          </div>
        )}
        {client.website && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-text-muted" />
            <span className="text-text-secondary">{client.website}</span>
          </div>
        )}
        {client.last_activity && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-text-muted" />
            <span className="text-text-muted">
              Last active {formatRelative(client.last_activity)}
            </span>
          </div>
        )}
      </Card>

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
          {/* Notes */}
          {client.notes && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <p className="text-sm text-text-secondary leading-relaxed">
                {client.notes}
              </p>
            </Card>
          )}

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
                <span className="text-sm text-text-muted">Proposals</span>
                <span className="text-sm font-semibold text-text-primary">
                  {proposals.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Pipeline Value</span>
                <span className="text-sm font-semibold text-brand-gold">
                  {formatCurrency(
                    proposals
                      .filter((p) => p.status === "sent" || p.status === "draft")
                      .reduce((s, p) => s + (p.amount || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Won Value</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(
                    proposals
                      .filter((p) => p.status === "won")
                      .reduce((s, p) => s + (p.amount || 0), 0)
                  )}
                </span>
              </div>
              {client.referral_source && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Referral Source</span>
                  <span className="text-sm text-text-secondary">
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
                    className={cn("p-4", isOverdue && "border-red-500/20")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
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
                        <p className="text-sm text-text-primary">
                          {task.content}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {task.due && (
                            <span
                              className={cn(
                                "text-xs",
                                isOverdue
                                  ? "text-red-400 font-medium"
                                  : "text-text-muted"
                              )}
                            >
                              {isOverdue ? "Overdue — " : "Due "}
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

      {activeTab === "proposals" && (
        <div className="space-y-3">
          {proposals.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No proposals"
              description="Create a proposal for this client."
            />
          ) : (
            proposals.map((proposal) => (
              <Card key={proposal.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {proposal.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-gold">
                        {formatCurrency(proposal.amount)}
                      </span>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    {proposal.notes && (
                      <p className="mt-2 text-xs text-text-muted">
                        {proposal.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-text-muted shrink-0">
                    {proposal.sent_at && (
                      <p>Sent {formatDate(proposal.sent_at)}</p>
                    )}
                    {proposal.follow_up_at && (
                      <p className="text-brand-gold">
                        Follow up {formatDate(proposal.follow_up_at)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
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
            className="absolute inset-0 bg-black/60"
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
              className="w-full rounded-lg border border-border-default bg-gray-950 px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold resize-none"
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
