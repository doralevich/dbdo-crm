import { useState, useEffect } from "react";
import {
  Mail,
  Star,
  Circle,
  Search,
  Inbox,
  AlertCircle,
} from "lucide-react";
import Card from "../components/Card";
import { PageLoader } from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { fetchEmails } from "../lib/api";
import { cn, formatRelative, formatDate } from "../lib/utils";

const TABS = [
  { key: "all", label: "All", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "important", label: "Important", icon: Star },
];

export default function Email() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    fetchEmails()
      .then(setEmails)
      .finally(() => setLoading(false));
  }, []);

  const filtered = emails.filter((e) => {
    if (tab === "unread" && e.is_read) return false;
    if (tab === "important" && !e.is_important) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.from_name.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Email</h1>
        <p className="text-sm text-text-muted mt-1">Read only — synced from Gmail</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-subtle">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count =
            key === "unread"
              ? emails.filter((e) => !e.is_read).length
              : key === "important"
              ? emails.filter((e) => e.is_important).length
              : emails.length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === key
                  ? "border-brand-gold text-brand-gold"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    tab === key
                      ? "bg-brand-gold/20 text-brand-gold"
                      : "bg-surface-raised text-text-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-default bg-surface pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
        />
      </div>

      {/* Email list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((email) => (
            <Card
              key={email.id}
              className={cn(
                "cursor-pointer hover:border-brand-gold/20 transition-all p-4",
                !email.is_read && "border-brand-gold/20 bg-brand-gold/[0.02]",
                selectedEmail?.id === email.id && "border-brand-gold/40 bg-brand-gold/5"
              )}
              onClick={() =>
                setSelectedEmail(
                  selectedEmail?.id === email.id ? null : email
                )
              }
            >
              <div className="flex items-start gap-3">
                {/* Indicators */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  {email.is_important ? (
                    <Star className="h-3.5 w-3.5 text-brand-gold fill-brand-gold" />
                  ) : (
                    <div className="h-3.5 w-3.5" />
                  )}
                  {!email.is_read && (
                    <Circle className="h-2 w-2 text-blue-400 fill-blue-400" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm truncate",
                        !email.is_read
                          ? "font-semibold text-text-primary"
                          : "text-text-secondary"
                      )}
                    >
                      {email.from_name}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatRelative(email.date)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm mt-0.5 truncate",
                      !email.is_read
                        ? "font-medium text-text-primary"
                        : "text-text-secondary"
                    )}
                  >
                    {email.subject}
                  </p>
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {email.snippet}
                  </p>

                  {/* Expanded view */}
                  {selectedEmail?.id === email.id && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <div className="space-y-2 text-xs text-text-muted">
                        <p>
                          <span className="text-text-secondary">From:</span>{" "}
                          {email.from}
                        </p>
                        <p>
                          <span className="text-text-secondary">Date:</span>{" "}
                          {formatDate(email.date)}
                        </p>
                      </div>
                      <div className="mt-3 rounded-lg bg-surface-raised p-4">
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {email.snippet}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-xs text-text-muted">
                          Read only — email preview from Gmail
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
