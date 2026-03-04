import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelative(date) {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getStatusColor(status) {
  const colors = {
    active: "text-emerald-400 bg-emerald-400/10",
    paused: "text-amber-400 bg-amber-400/10",
    completed: "text-blue-400 bg-blue-400/10",
    lost: "text-red-400 bg-red-400/10",
    draft: "text-gray-400 bg-gray-400/10",
    sent: "text-blue-400 bg-blue-400/10",
    won: "text-emerald-400 bg-emerald-400/10",
    retainer: "text-brand-gold bg-brand-gold/10",
    project: "text-violet-400 bg-violet-400/10",
    lead: "text-cyan-400 bg-cyan-400/10",
    prospect: "text-orange-400 bg-orange-400/10",
  };
  return colors[status] || "text-gray-400 bg-gray-400/10";
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
