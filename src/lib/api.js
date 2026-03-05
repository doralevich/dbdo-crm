const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }
  return res.json();
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
