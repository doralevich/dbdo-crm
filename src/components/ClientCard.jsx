import { Link } from "react-router-dom";
import { Mail, Phone, Globe, Clock } from "lucide-react";
import { cn, getInitials, formatRelative } from "../lib/utils";

/**
 * Avatar with initials — gradient using DBDO brand navy.
 */
export function ClientAvatar({ name, size = "md", className }) {
  const sizeClasses = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizeClasses[size],
        className
      )}
      style={{
        background: "linear-gradient(135deg, #1a3352 0%, #2e5282 100%)",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/**
 * Info row — icon + value, no label.
 */
function InfoRow({ icon: Icon, value, href }) {
  if (!value) return null;

  const content = (
    <div className="flex items-center gap-2 text-sm text-text-secondary min-w-0">
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "#1a3352" }} />
      <span className="truncate">{value}</span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="hover:text-brand-navy transition-colors"
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }

  return content;
}

/**
 * Grid / grouped card view — Outlook-style, Apple modern.
 * No status badge. Clean info rows with icons only.
 */
export default function ClientCard({ client }) {
  const websiteDisplay = client.website
    ? client.website.replace(/^https?:\/\/(www\.)?/, "")
    : null;

  return (
    <Link to={`/clients/${client.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-border-subtle hover:shadow-md hover:border-brand-navy/20 transition-all duration-200 p-5 h-full flex flex-col gap-4">
        {/* Header: Avatar + Name + Company */}
        <div className="flex items-center gap-3 min-w-0">
          <ClientAvatar name={client.name} size="md" />
          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-text-primary truncate leading-tight group-hover:text-brand-navy transition-colors"
              style={{ fontSize: "18px" }}
            >
              {client.name}
            </h3>
            {client.contact_name && (
              <p className="text-sm text-text-muted truncate mt-0.5">
                {client.contact_name}
              </p>
            )}
          </div>
        </div>

        {/* Info rows — icon + value only, no labels */}
        {(client.contact_email || client.website) && (
          <div className="flex flex-col gap-2">
            <InfoRow
              icon={Mail}
              value={client.contact_email}
              href={client.contact_email ? `mailto:${client.contact_email}` : null}
            />
            <InfoRow
              icon={Globe}
              value={websiteDisplay}
              href={client.website ? (client.website.startsWith("http") ? client.website : `https://${client.website}`) : null}
            />
          </div>
        )}

        {/* Footer: last activity */}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-text-muted pt-3 border-t border-border-subtle">
          <Clock className="h-3 w-3 shrink-0" style={{ color: "#1a3352" }} />
          <span>{formatRelative(client.last_activity)}</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Compact list row — Avatar | Name + email inline | last activity
 */
export function ClientListRow({ client }) {
  return (
    <Link
      to={`/clients/${client.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/70 transition-colors group"
    >
      {/* Avatar */}
      <ClientAvatar name={client.name} size="sm" />

      {/* Name + contact info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-brand-navy transition-colors">
          {client.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {client.contact_email && (
            <span className="flex items-center gap-1 text-xs text-text-muted truncate">
              <Mail className="h-3 w-3 shrink-0" style={{ color: "#1a3352" }} />
              {client.contact_email}
            </span>
          )}
          {client.website && !client.contact_email && (
            <span className="flex items-center gap-1 text-xs text-text-muted truncate">
              <Globe className="h-3 w-3 shrink-0" style={{ color: "#1a3352" }} />
              {client.website.replace(/^https?:\/\/(www\.)?/, "")}
            </span>
          )}
        </div>
      </div>

      {/* Last activity */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
        <Clock className="h-3 w-3" style={{ color: "#1a3352" }} />
        <span>{formatRelative(client.last_activity)}</span>
      </div>
    </Link>
  );
}
