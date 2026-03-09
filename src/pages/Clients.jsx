import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Globe,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
  User,
  Mail,
  Phone,
  Pencil,
  Trash2,
  CheckSquare,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchClients, updateClient, deleteClient, fetchTaskClients } from "../lib/api";
import {
  cn,
  formatCurrency,
  formatRelative,
  getStatusColor,
  getInitials,
} from "../lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "client", label: "Clients" },
  { key: "contact", label: "Contacts" },
  { key: "lead", label: "Leads" },
];

function ClientLogo({ client, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  if (client.logo_url && !imgError) {
    return (
      <div className={cn("shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center", sizeClasses[size])}>
        <img
          src={client.logo_url}
          alt={client.name}
          className="h-full w-full object-contain p-1"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold font-semibold shrink-0",
        sizeClasses[size]
      )}
    >
      {getInitials(client.name)}
    </div>
  );
}

function categorizeClients(clients) {
  const categories = {
    "Active": [],
    "Completed": [],
  };

  for (const client of clients) {
    if (client.status === "completed") {
      categories["Completed"].push(client);
    } else {
      categories["Active"].push(client);
    }
  }

  return categories;
}

const PRIORITY_BORDER = { 4: "border-l-red-500", 3: "border-l-orange-400", 2: "border-l-blue-400", 1: "border-l-gray-500" };

function ClientCard({ client, onTypeChange, onDelete, taskInfo }) {
  const isContact = client.type === "contact";

  const handlePromote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newType = isContact ? "active" : "contact";
    await updateClient(client.id, { type: newType });
    onTypeChange(client.id, newType);
  };

  return (
    <Link to={`/clients/${client.id}`}>
      <Card className="group hover:border-brand-gold/30 cursor-pointer h-full transition-all hover:shadow-lg hover:shadow-brand-gold/5 overflow-hidden p-0">
        {/* Top banner — company name */}
        <div className="relative bg-surface-raised border-b border-border-subtle px-4 py-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-text-primary truncate group-hover:text-brand-gold transition-colors leading-snug">
            {client.name}
          </h3>
          <button
            onClick={handlePromote}
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium transition-all border opacity-0 group-hover:opacity-100",
              isContact
                ? "border-brand-gold/40 text-brand-gold hover:bg-brand-gold hover:text-brand-navy"
                : "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400 hover:text-white"
            )}
            title={isContact ? "Promote to Client" : "Mark as Contact"}
          >
            {isContact ? "→ Client" : "→ Contact"}
          </button>
        </div>

        {/* Card body */}
        <div className="px-4 py-3">
          {/* Contact name + website */}
          {client.contact_name && client.contact_name !== client.name && (
            <div className="flex items-center gap-1.5 mb-2">
              <User className="h-3 w-3 text-text-muted shrink-0" />
              <span className="text-xs text-text-secondary truncate">{client.contact_name}</span>
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-1.5 mb-2">
              <Globe className="h-3 w-3 text-text-muted shrink-0" />
              <span className="text-xs text-text-muted truncate">{client.website}</span>
            </div>
          )}

          {/* Tasks */}
          {taskInfo && taskInfo.count > 0 && (
            <div className="mt-2 mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckSquare className="h-3 w-3 text-brand-gold shrink-0" />
                <span className="text-xs font-medium text-brand-gold">{taskInfo.count} open task{taskInfo.count !== 1 && "s"}</span>
              </div>
              <div className="space-y-1">
                {taskInfo.tasks.map(t => (
                  <div key={t.id} className={cn("flex items-center gap-2 text-xs text-text-muted border-l-2 pl-2 py-0.5", PRIORITY_BORDER[t.priority] || "border-l-gray-500")}>
                    <span className="truncate">{t.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email + Phone */}
          <div className="space-y-1 mt-2">
            {client.contact_email && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary truncate">
                <Mail className="h-3 w-3 text-text-muted shrink-0" />
                <span className="truncate">{client.contact_email}</span>
              </div>
            )}
            {client.contact_phone && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Phone className="h-3 w-3 text-text-muted shrink-0" />
                <span>{client.contact_phone}</span>
              </div>
            )}
          </div>

          {/* Footer: Activity + Value + Actions */}
          <div className="flex items-center justify-between text-xs text-text-muted pt-3 mt-3 border-t border-border-subtle">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatRelative(client.last_activity)}</span>
            </div>
            <div className="flex items-center gap-2">
              {client.monthly_value > 0 && (
                <span className="font-semibold text-brand-gold text-sm">
                  {formatCurrency(client.monthly_value)}<span className="text-xs text-text-muted font-normal">/mo</span>
                </span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  to={`/clients/${client.id}/edit`}
                  onClick={e => e.stopPropagation()}
                  className="rounded p-1 text-text-muted hover:text-brand-gold transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(client.id); }}
                  className="rounded p-1 text-text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ── Main Clients page ─────────────────────────────────────────────────────────

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [taskMap, setTaskMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grouped");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClients(), fetchTaskClients()])
      .then(([cls, taskClients]) => {
        setClients([...cls].sort((a, b) => a.name.localeCompare(b.name)));
        const map = {};
        for (const tc of taskClients || []) {
          if (tc.id) map[tc.id] = tc;
        }
        setTaskMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTypeChange = (id, newType) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, type: newType } : c));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    setClients(prev => prev.filter(c => c.id !== id));
    try { await deleteClient(id); } catch {}
  };

  const filtered = useMemo(() => {
    let list = clients;
    if (filter === "client") list = list.filter(c => c.type !== "contact" && c.type !== "lead");
    else if (filter === "contact") list = list.filter(c => c.type === "contact");
    else if (filter === "lead") list = list.filter(c => c.type === "lead");
    if (search) list = list.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.website?.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, filter, search]);

  const categories = useMemo(() => categorizeClients(filtered), [filtered]);

  const totalActive = categories["Active"].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-sm text-text-muted mt-1">
            {filtered.length} client{filtered.length !== 1 && "s"}
            {totalActive > 0 && <span className="text-emerald-400"> · {totalActive} active</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("grouped")} className={cn("rounded-lg px-3 py-2 text-xs font-medium transition-colors", view === "grouped" ? "bg-brand-gold text-brand-navy" : "bg-surface-raised text-text-secondary hover:text-text-primary")}>Grouped</button>
          <button onClick={() => setView("grid")} className={cn("rounded-lg p-2 transition-colors", view === "grid" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={cn("rounded-lg p-2 transition-colors", view === "list" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors", filter === f.key ? "bg-brand-gold text-brand-navy" : "bg-surface-raised text-text-secondary hover:text-text-primary")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Filter} title="No clients found" description="Try adjusting your search or filter." />
      ) : view === "grouped" ? (
        <div className="space-y-8">
          {Object.entries(categories).map(([name, cls]) =>
            cls.length > 0 ? (
              <div key={name} className="space-y-3">
                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider px-1">{name} ({cls.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cls.map((client) => <ClientCard key={client.id} client={client} onTypeChange={handleTypeChange} onDelete={handleDelete} taskInfo={taskMap[client.id]} />)}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((client) => <ClientCard key={client.id} client={client} onTypeChange={handleTypeChange} onDelete={handleDelete} taskInfo={taskMap[client.id]} />)}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised">
                  {["Client", "Type", "Status", "Value", "Contact", "Last Activity"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/clients/${client.id}`} className="flex items-center gap-3 hover:text-brand-gold transition-colors">
                        <ClientLogo client={client} size="sm" />
                        <div className="min-w-0">
                          <span className="font-semibold text-text-primary block truncate">{client.name}</span>
                          {client.website && <span className="text-xs text-text-muted block truncate">{client.website}</span>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge className={getStatusColor(client.type)}>{client.type}</Badge></td>
                    <td className="px-4 py-3"><Badge className={getStatusColor(client.status)}>{client.status}</Badge></td>
                    <td className="px-4 py-3 text-text-secondary">{client.monthly_value > 0 ? formatCurrency(client.monthly_value) : "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">{client.contact_name || "—"}</td>
                    <td className="px-4 py-3 text-text-muted">{formatRelative(client.last_activity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
