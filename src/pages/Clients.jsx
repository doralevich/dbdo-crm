import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Globe,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
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
  { key: "retainer", label: "Retainers" },
  { key: "project", label: "Projects" },
  { key: "lead", label: "Leads" },
  { key: "quiet", label: "Quiet 30d+" },
  { key: "lapsed", label: "Lapsed 60d+" },
];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter === "active") params.status = "active";
    else if (filter === "retainer") params.type = "retainer";
    else if (filter === "project") params.type = "project";
    else if (filter === "lead") params.type = "lead";
    else if (filter === "quiet") params.filter = "quiet";
    else if (filter === "lapsed") params.filter = "lapsed";

    fetchClients(Object.keys(params).length ? params : undefined)
      .then(setClients)
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = search
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.contact_name?.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-sm text-text-muted mt-1">
            {filtered.length} client{filtered.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      ) : view === "grid" ? (
        /* Card grid */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <Link key={client.id} to={`/clients/${client.id}`}>
              <Card className="group hover:border-brand-gold/30 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy-lighter text-brand-gold text-sm font-semibold">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-brand-gold transition-colors">
                        {client.name}
                      </h3>
                      {client.contact_name && (
                        <p className="text-xs text-text-muted truncate">
                          {client.contact_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge className={getStatusColor(client.type)}>
                    {client.type}
                  </Badge>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    {client.website && (
                      <>
                        <Globe className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">
                          {client.website}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelative(client.last_activity)}</span>
                  </div>
                </div>

                {client.monthly_value > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <span className="text-sm font-semibold text-brand-gold">
                      {formatCurrency(client.monthly_value)}
                    </span>
                    <span className="text-xs text-text-muted"> /mo</span>
                  </div>
                )}
              </Card>
            </Link>
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy-lighter text-brand-gold text-xs font-semibold shrink-0">
                          {getInitials(client.name)}
                        </div>
                        <span className="font-medium text-text-primary">
                          {client.name}
                        </span>
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
