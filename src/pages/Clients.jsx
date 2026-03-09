import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Globe,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
  User,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchClients } from "../lib/api";
import {
  cn,
  formatCurrency,
  formatRelative,
  getStatusColor,
  getInitials,
} from "../lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
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

function ClientCard({ client }) {
  return (
    <Link to={`/clients/${client.id}`}>
      <Card className="group hover:border-brand-gold/30 cursor-pointer h-full transition-all hover:shadow-lg hover:shadow-brand-gold/5">
        {/* Header: Logo + Name */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <ClientLogo client={client} size="md" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary truncate group-hover:text-brand-gold transition-colors leading-tight">
                {client.name}
              </h3>
              {client.contact_name ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <User className="h-3 w-3 text-text-muted shrink-0" />
                  <span className="text-xs text-text-secondary truncate">
                    {client.contact_name}
                  </span>
                </div>
              ) : (
                client.website && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Globe className="h-3 w-3 text-text-muted shrink-0" />
                    <span className="text-xs text-text-muted truncate">
                      {client.website}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge className={getStatusColor(client.type)}>
            {client.type}
          </Badge>
          <Badge className={getStatusColor(client.status)}>
            {client.status}
          </Badge>
        </div>

        {/* Footer: Activity + Value */}
        <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{formatRelative(client.last_activity)}</span>
          </div>
          {client.monthly_value > 0 && (
            <span className="font-semibold text-brand-gold text-sm">
              {formatCurrency(client.monthly_value)}<span className="text-xs text-text-muted font-normal">/mo</span>
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}


export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grouped");

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter === "active") params.status = "active";
    else if (filter === "lead") params.type = "lead";

    fetchClients(Object.keys(params).length ? params : undefined)
      .then(setClients)
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = search
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
          c.website?.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

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
            {totalActive > 0 && (
              <span className="text-emerald-400"> · {totalActive} active</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grouped")}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              view === "grouped"
                ? "bg-brand-gold text-brand-navy"
                : "bg-surface-raised text-text-secondary hover:text-text-primary"
            )}
          >
            Grouped
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn(
              "rounded-lg p-2 transition-colors",
              view === "grid"
                ? "bg-surface-raised text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "rounded-lg p-2 transition-colors",
              view === "list"
                ? "bg-surface-raised text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-brand-gold text-brand-navy"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No clients found"
          description="Try adjusting your search or filter."
        />
      ) : view === "grouped" ? (
        /* Grouped view - Active then Completed */
        <div className="space-y-8">
          {Object.entries(categories).map(([name, clients]) =>
            clients.length > 0 ? (
              <div key={name} className="space-y-3">
                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider px-1">{name} ({clients.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {clients.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : view === "grid" ? (
        /* Flat card grid */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        /* Table view */
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-surface-raised/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/clients/${client.id}`}
                        className="flex items-center gap-3 hover:text-brand-gold transition-colors"
                      >
                        <ClientLogo client={client} size="sm" />
                        <div className="min-w-0">
                          <span className="font-semibold text-text-primary block truncate">
                            {client.name}
                          </span>
                          {client.website && (
                            <span className="text-xs text-text-muted block truncate">
                              {client.website}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(client.type)}>
                        {client.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {client.monthly_value > 0
                        ? formatCurrency(client.monthly_value)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {client.contact_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatRelative(client.last_activity)}
                    </td>
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
