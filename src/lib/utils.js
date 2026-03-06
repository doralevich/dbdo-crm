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
    active: "text-emerald-700 bg-emerald-100",
    paused: "text-amber-700 bg-amber-100",
    completed: "text-blue-700 bg-blue-100",
    lost: "text-red-700 bg-red-100",
    draft: "text-gray-600 bg-gray-100",
    sent: "text-blue-700 bg-blue-100",
    won: "text-emerald-700 bg-emerald-100",
    retainer: "text-brand-gold-dark bg-brand-gold/15",
    project: "text-violet-700 bg-violet-100",
    lead: "text-cyan-700 bg-cyan-100",
    prospect: "text-orange-700 bg-orange-100",
  };
  return colors[status] || "text-gray-600 bg-gray-100";
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
