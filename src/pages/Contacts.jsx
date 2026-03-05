import { useState, useEffect } from "react";
import {
  Search,
  Users,
  Briefcase,
  Heart,
  Home,
  Package,
  HelpCircle,
  Mail,
  Phone,
  Building2,
  LayoutGrid,
  List,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchContacts, updateContactCategory } from "../lib/api";
import { cn, getInitials } from "../lib/utils";

const CATEGORIES = [
  { key: "all", label: "All", icon: Users, color: "text-text-secondary" },
  { key: "Clients", label: "Clients", icon: Briefcase, color: "text-brand-gold" },
  { key: "Friends", label: "Friends", icon: Heart, color: "text-rose-400" },
  { key: "Family", label: "Family", icon: Home, color: "text-emerald-400" },
  { key: "Vendors", label: "Vendors", icon: Package, color: "text-violet-400" },
  { key: "Other", label: "Other", icon: HelpCircle, color: "text-blue-400" },
];

const CATEGORY_COLORS = {
  Clients: "text-brand-gold bg-brand-gold/10",
  Friends: "text-rose-400 bg-rose-400/10",
  Family: "text-emerald-400 bg-emerald-400/10",
  Vendors: "text-violet-400 bg-violet-400/10",
  Other: "text-blue-400 bg-blue-400/10",
};

function StatPill({ icon: Icon, label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-3 transition-all border",
        active
          ? "border-brand-gold/30 bg-surface-raised shadow-sm"
          : "border-border-subtle bg-surface hover:border-border-default hover:bg-surface-raised/50"
      )}
    >
      <Icon className={cn("h-4 w-4", color)} />
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <span
        className={cn(
          "ml-auto text-lg font-bold tabular-nums",
          active ? color : "text-text-secondary"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ContactCard({ contact, onCategoryChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card className="group hover:border-brand-gold/20 transition-all relative">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {contact.photo_url ? (
          <img
            src={contact.photo_url}
            alt={contact.name}
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy-lighter text-brand-gold text-sm font-semibold shrink-0">
            {getInitials(contact.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {contact.name}
            </h3>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Badge className={cn(CATEGORY_COLORS[contact.category], "cursor-pointer hover:ring-1 hover:ring-current/20 flex items-center gap-1")}>
                  {contact.category}
                  <ChevronDown className="h-3 w-3" />
                </Badge>
              </button>
              {!menuOpen && (
                <Badge className={cn(CATEGORY_COLORS[contact.category], "group-hover:hidden")}>
                  {contact.category}
                </Badge>
              )}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border-default bg-surface-raised shadow-xl py-1">
                    {["Clients", "Friends", "Family", "Vendors", "Other"].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            onCategoryChange(contact.id, cat);
                            setMenuOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-xs hover:bg-surface-overlay transition-colors",
                            contact.category === cat
                              ? "text-brand-gold font-medium"
                              : "text-text-secondary"
                          )}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {contact.title && contact.organization ? (
            <p className="text-xs text-text-muted truncate mt-0.5">
              {contact.title} at {contact.organization}
            </p>
          ) : contact.organization ? (
            <p className="text-xs text-text-muted truncate mt-0.5 flex items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" />
              {contact.organization}
            </p>
          ) : null}
        </div>
      </div>

      {/* Contact details */}
      <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-brand-gold transition-colors truncate"
          >
            <Mail className="h-3 w-3 shrink-0 text-text-muted" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-brand-gold transition-colors"
          >
            <Phone className="h-3 w-3 shrink-0 text-text-muted" />
            {contact.phone}
          </a>
        )}
      </div>
    </Card>
  );
}

function ContactRow({ contact, onCategoryChange }) {
  return (
    <tr className="hover:bg-surface-raised/50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {contact.photo_url ? (
            <img
              src={contact.photo_url}
              alt={contact.name}
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy-lighter text-brand-gold text-xs font-semibold shrink-0">
              {getInitials(contact.name)}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-medium text-text-primary truncate block">
              {contact.name}
            </span>
            {contact.organization && (
              <span className="text-xs text-text-muted truncate block">
                {contact.organization}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge className={CATEGORY_COLORS[contact.category]}>
          {contact.category}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="text-text-secondary hover:text-brand-gold text-sm transition-colors"
          >
            {contact.email}
          </a>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-text-secondary text-sm">
        {contact.phone || "—"}
      </td>
      <td className="px-4 py-3 text-text-muted text-sm">
        {contact.title || "—"}
      </td>
    </tr>
  );
}

export default function Contacts() {
  const [data, setData] = useState({ contacts: [], stats: {}, source: "" });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const loadContacts = (cat) => {
    setLoading(true);
    const params = {};
    if (cat && cat !== "all") params.category = cat;
    if (search) params.q = search;
    fetchContacts(Object.keys(params).length ? params : undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContacts(category);
  }, [category]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts(category);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCategoryChange = async (contactId, newCategory) => {
    try {
      await updateContactCategory(contactId, newCategory);
      // Optimistically update the local state
      setData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) =>
          c.id === contactId ? { ...c, category: newCategory } : c
        ),
      }));
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  };

  const stats = data.stats || {};

  // Client-side search filter (in addition to server-side)
  const filtered = search
    ? data.contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.organization?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search)
      )
    : data.contacts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contacts</h1>
          <p className="text-sm text-text-muted mt-1">
            {stats.total || 0} total contacts
            {data.source === "mock" && (
              <span className="ml-2 text-amber-400/70 text-xs">
                (demo data — connect Google for live contacts)
              </span>
            )}
            {data.source === "google" && (
              <span className="ml-2 text-emerald-400/70 text-xs">
                ● Synced from Google
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadContacts(category)}
            className="rounded-lg p-2 text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-colors"
            title="Refresh contacts"
          >
            <RefreshCw className="h-4 w-4" />
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

      {/* Category stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {CATEGORIES.map((cat) => (
          <StatPill
            key={cat.key}
            icon={cat.icon}
            label={cat.label}
            count={
              cat.key === "all"
                ? stats.total || 0
                : stats[cat.key.toLowerCase()] || 0
            }
            color={cat.color}
            active={category === cat.key}
            onClick={() => setCategory(cat.key)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search by name, email, company, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-default bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
        />
      </div>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description={
            search
              ? "Try adjusting your search."
              : category !== "all"
              ? `No contacts in the "${category}" category.`
              : "Connect Google to import your contacts."
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onCategoryChange={handleCategoryChange}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-raised">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Title
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onCategoryChange={handleCategoryChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
