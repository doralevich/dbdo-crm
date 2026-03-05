const API_BASE = "/api";

/**
 * Static data fallback mapping.
 * When the Express API server isn't running (e.g., XCloud static hosting),
 * /api/* routes return HTML (Nginx catch-all). We detect this and serve
 * pre-built JSON data files instead.
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
  // Strip query params and find matching static file
  const clean = apiPath.split("?")[0];
  return STATIC_DATA_MAP[clean] || null;
}

async function fetchStaticFallback(path) {
  const staticPath = getStaticPath(path);
  if (!staticPath) {
    throw new Error(`No static fallback for ${path}`);
  }
  const res = await fetch(staticPath);
  if (!res.ok) throw new Error(`Static data not found: ${staticPath}`);
  return res.json();
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
      console.warn(`[CRM] API returned HTML for ${path} — using static data fallback`);
      return fetchStaticFallback(path);
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API error: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    // Network error or API down — try static fallback
    const staticPath = getStaticPath(path);
    if (staticPath) {
      console.warn(`[CRM] API request failed for ${path} — using static data fallback`);
      return fetchStaticFallback(path);
    }
    throw err;
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
