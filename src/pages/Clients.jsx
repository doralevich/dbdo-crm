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
  Users,
  Briefcase,
  Heart,
  Home,
  Package,
  HelpCircle,
  Mail,
  Phone,
  Building2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchClients, fetchContacts, updateContactCategory } from "../lib/api";
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


// ── Contacts sub-components ──────────────────────────────────────────────────

const CONTACT_CATEGORIES = [
  { key: "all", label: "All", icon: Users, color: "text-text-secondary" },
  { key: "Clients", label: "Clients", icon: Briefcase, color: "text-brand-gold" },
  { key: "Friends", label: "Friends", icon: Heart, color: "text-rose-400" },
  { key: "Family", label: "Family", icon: Home, color: "text-emerald-400" },
  { key: "Vendors", label: "Vendors", icon: Package, color: "text-violet-400" },
  { key: "Other", label: "Other", icon: HelpCircle, color: "text-blue-400" },
];

const CONTACT_CATEGORY_COLORS = {
  Clients: "text-brand-gold bg-brand-gold/10",
  Friends: "text-rose-400 bg-rose-400/10",
  Family: "text-emerald-400 bg-emerald-400/10",
  Vendors: "text-violet-400 bg-violet-400/10",
  Other: "text-blue-400 bg-blue-400/10",
};

function ContactCard({ contact, onCategoryChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Card className="group hover:border-brand-gold/20 transition-all relative">
      <div className="flex items-start gap-3">
        {contact.photo_url ? (
          <img src={contact.photo_url} alt={contact.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold shrink-0">
            {getInitials(contact.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate">{contact.name}</h3>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className={cn(CONTACT_CATEGORY_COLORS[contact.category], "cursor-pointer hover:ring-1 hover:ring-current/20 flex items-center gap-1")}>
                  {contact.category}<ChevronDown className="h-3 w-3" />
                </Badge>
              </button>
              {!menuOpen && <Badge className={cn(CONTACT_CATEGORY_COLORS[contact.category], "group-hover:hidden")}>{contact.category}</Badge>}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border-default bg-surface-raised shadow-xl py-1">
                    {["Clients", "Friends", "Family", "Vendors", "Other"].map((cat) => (
                      <button key={cat} onClick={() => { onCategoryChange(contact.id, cat); setMenuOpen(false); }}
                        className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-surface-overlay transition-colors", contact.category === cat ? "text-brand-gold font-medium" : "text-text-secondary")}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {contact.title && contact.organization ? (
            <p className="text-xs text-text-muted truncate mt-0.5">{contact.title} at {contact.organization}</p>
          ) : contact.organization ? (
            <p className="text-xs text-text-muted truncate mt-0.5 flex items-center gap-1"><Building2 className="h-3 w-3 shrink-0" />{contact.organization}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-brand-gold transition-colors truncate">
            <Mail className="h-3 w-3 shrink-0 text-text-muted" />{contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-brand-gold transition-colors">
            <Phone className="h-3 w-3 shrink-0 text-text-muted" />{contact.phone}
          </a>
        )}
      </div>
    </Card>
  );
}

function ContactsTab() {
  const [data, setData] = useState({ contacts: [], stats: {}, source: "" });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const loadContacts = (cat) => {
    setLoading(true);
    const params = {};
    if (cat && cat !== "all") params.category = cat;
    fetchContacts(Object.keys(params).length ? params : undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContacts(category); }, [category]);
  useEffect(() => {
    const t = setTimeout(() => loadContacts(category), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCategoryChange = async (contactId, newCategory) => {
    try {
      await updateContactCategory(contactId, newCategory);
      setData((prev) => ({ ...prev, contacts: prev.contacts.map((c) => c.id === contactId ? { ...c, category: newCategory } : c) }));
    } catch (err) { console.error(err); }
  };

  const stats = data.stats || {};
  const filtered = search
    ? data.contacts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.organization?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search))
    : data.contacts;

  return (
    <div className="space-y-5">
      {/* Stats + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">{stats.total || 0} total contacts
          {data.source === "google" && <span className="ml-2 text-emerald-400/70 text-xs">● Synced from Google</span>}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => loadContacts(category)} className="rounded-lg p-2 text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-colors"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setView("grid")} className={cn("rounded-lg p-2 transition-colors", view === "grid" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={cn("rounded-lg p-2 transition-colors", view === "list" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CONTACT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                category === cat.key ? "bg-brand-gold text-brand-navy" : "bg-surface-raised text-text-secondary hover:text-text-primary")}>
              <Icon className="h-3 w-3" />{cat.label}
              <span className="tabular-nums">{cat.key === "all" ? stats.total || 0 : stats[cat.key.toLowerCase()] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input type="text" placeholder="Search by name, email, company, or phone..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-default bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold" />
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No contacts found" description={search ? "Try adjusting your search." : "Connect Google to import your contacts."} />
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((c) => <ContactCard key={c.id} contact={c} onCategoryChange={handleCategoryChange} />)}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised">
                  {["Contact", "Category", "Email", "Phone", "Title"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {contact.photo_url ? <img src={contact.photo_url} alt={contact.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                          : <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold text-xs font-semibold shrink-0">{getInitials(contact.name)}</div>}
                        <div className="min-w-0">
                          <span className="font-medium text-text-primary truncate block">{contact.name}</span>
                          {contact.organization && <span className="text-xs text-text-muted truncate block">{contact.organization}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge className={CONTACT_CATEGORY_COLORS[contact.category]}>{contact.category}</Badge></td>
                    <td className="px-4 py-3">{contact.email ? <a href={`mailto:${contact.email}`} className="text-text-secondary hover:text-brand-gold text-sm">{contact.email}</a> : <span className="text-text-muted">—</span>}</td>
                    <td className="px-4 py-3 text-text-secondary text-sm">{contact.phone || "—"}</td>
                    <td className="px-4 py-3 text-text-muted text-sm">{contact.title || "—"}</td>
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

// ── Main Clients page ─────────────────────────────────────────────────────────

export default function Clients() {
  const [tab, setTab] = useState("clients");
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
          {tab === "clients" && (
            <p className="text-sm text-text-muted mt-1">
              {filtered.length} client{filtered.length !== 1 && "s"}
              {totalActive > 0 && <span className="text-emerald-400"> · {totalActive} active</span>}
            </p>
          )}
        </div>
        {tab === "clients" && (
          <div className="flex items-center gap-2">
            <button onClick={() => setView("grouped")} className={cn("rounded-lg px-3 py-2 text-xs font-medium transition-colors", view === "grouped" ? "bg-brand-gold text-brand-navy" : "bg-surface-raised text-text-secondary hover:text-text-primary")}>Grouped</button>
            <button onClick={() => setView("grid")} className={cn("rounded-lg p-2 transition-colors", view === "grid" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={cn("rounded-lg p-2 transition-colors", view === "list" ? "bg-surface-raised text-text-primary" : "text-text-muted hover:text-text-secondary")}><List className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border-subtle">
        {[{ key: "clients", label: "Clients" }, { key: "contacts", label: "Contacts" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.key ? "border-brand-gold text-brand-gold" : "border-transparent text-text-muted hover:text-text-secondary")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contacts" ? (
        <ContactsTab />
      ) : (
        <>
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
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {cls.map((client) => <ClientCard key={client.id} client={client} />)}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((client) => <ClientCard key={client.id} client={client} />)}
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
        </>
      )}
    </div>
  );
}
