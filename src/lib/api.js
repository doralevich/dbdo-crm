/**
 * Build-time embedded static data.
 * Vite imports these JSON files at build time, so data is always
 * available even when both Express API and static file serving fail
 * (e.g., Nginx catch-all intercepts /data/*.json requests).
 */
import clientsData from "../../public/data/clients.json";
import tasksData from "../../public/data/tasks.json";
import contactsData from "../../public/data/contacts.json";
import calendarData from "../../public/data/calendar.json";
import emailsData from "../../public/data/emails.json";
import teamData from "../../public/data/team.json";
import dashboardStatsData from "../../public/data/dashboard-stats.json";

const API_BASE = "/api";

/**
 * Embedded data map — bundled into the JS at build time.
 * This is the ultimate fallback when both API and file fetches fail.
 */
const EMBEDDED_DATA_MAP = {
  "/clients": clientsData,
  "/tasks": tasksData,
  "/contacts": contactsData,
  "/calendar": calendarData,
  "/emails": emailsData,
  "/team": teamData,
  "/dashboard/stats": dashboardStatsData,
};

function getEmbeddedData(apiPath) {
  const clean = apiPath.split("?")[0];
  return EMBEDDED_DATA_MAP[clean] || null;
}

/**
 * Static data fallback mapping (runtime fetch attempt).
 */
const STATIC_DATA_MAP = {
  "/clients": "/data/clients.json",
  "/tasks": "/data/tasks.json",
  "/contacts": "/data/contacts.json",
  "/calendar": "/data/calendar.json",
  "/emails": "/data/emails.json",
  "/team": "/data/team.json",
  "/dashboard/stats": "/data/dashboard-stats.json",
};

function getStaticPath(apiPath) {
  const clean = apiPath.split("?")[0];
  return STATIC_DATA_MAP[clean] || null;
}

async function fetchStaticFallback(path) {
  // First try runtime fetch of static JSON file
  const staticPath = getStaticPath(path);
  if (staticPath) {
    try {
      const res = await fetch(staticPath);
      const contentType = res.headers.get("content-type") || "";
      // Only use the response if it's actually JSON, not an HTML catch-all
      if (res.ok && !contentType.includes("text/html")) {
        return res.json();
      }
    } catch {
      // Fall through to embedded data
    }
  }

  // Final fallback: use build-time embedded data
  const embedded = getEmbeddedData(path);
  if (embedded) {
    console.info(`[CRM] Using embedded data for ${path}`);
    // Return a deep clone to prevent mutation of the module-level data
    return JSON.parse(JSON.stringify(embedded));
  }

  throw new Error(`No data available for ${path}`);
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    // Detect HTML response (means API server isn't running, Nginx returned index.html)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.warn(`[CRM] API returned HTML for ${path} — using fallback data`);
      return fetchStaticFallback(path);
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API error: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    // Network error or API down — try fallback chain
    console.warn(`[CRM] API request failed for ${path} — using fallback data`);
    return fetchStaticFallback(path);
  }
}

// Clients
export const fetchClients = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/clients${qs}`);
};
export const fetchClient = (id) => request(`/clients/${id}`);
export const createClient = (data) =>
  request("/clients", { method: "POST", body: JSON.stringify(data) });
export const updateClient = (id, data) =>
  request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// Proposals
export const fetchProposals = (clientId) =>
  request(`/clients/${clientId}/proposals`);
export const createProposal = (clientId, data) =>
  request(`/clients/${clientId}/proposals`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// Interactions
export const fetchInteractions = (clientId) =>
  request(`/clients/${clientId}/interactions`);
export const createInteraction = (clientId, data) =>
  request(`/clients/${clientId}/interactions`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// Tasks (Todoist)
export const fetchTasks = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/tasks${qs}`);
};

// Email (Gmail - read only)
export const fetchEmails = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/emails${qs}`);
};

// Calendar
export const fetchEvents = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/calendar${qs}`);
};

// Contacts (Google)
export const fetchContacts = (params) => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/contacts${qs}`);
};
export const updateContactCategory = (id, category) =>
  request(`/contacts/${id}/category`, {
    method: "PATCH",
    body: JSON.stringify({ category }),
  });

// Dashboard stats
export const fetchDashboardStats = () => request("/dashboard/stats");

// Team
export const fetchTeam = () => request("/team");
