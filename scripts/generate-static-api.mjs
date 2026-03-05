#!/usr/bin/env node
/**
 * Generate static JSON files for CRM API endpoints.
 * These serve as fallback data when the Express server isn't running
 * (e.g., XCloud static hosting via Nginx).
 *
 * Usage: node scripts/generate-static-api.mjs [--todoist path/to/todoist-data.json]
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicData = join(__dirname, "..", "public", "data");

// Ensure output dir exists
mkdirSync(publicData, { recursive: true });

// --- Load Todoist data if available ---
let todoistData = null;
const todoistArg = process.argv.indexOf("--todoist");
const todoistPath = todoistArg >= 0
  ? process.argv[todoistArg + 1]
  : join(__dirname, "..", "data", "todoist-data.json");

if (existsSync(todoistPath)) {
  todoistData = JSON.parse(readFileSync(todoistPath, "utf-8"));
  console.log(`✅ Loaded Todoist data: ${todoistData.stats.active_tasks} active tasks from ${todoistData.stats.total_clients} clients`);
}

// --- Transform Todoist tasks into CRM format ---
function buildTasks() {
  if (!todoistData) {
    console.log("⚠️  No Todoist data — using mock tasks");
    return [];
  }

  const tasks = [];
  for (const [projectId, client] of Object.entries(todoistData.clients)) {
    for (const task of client.tasks) {
      if (task.status !== "active") continue;
      tasks.push({
        id: task.id,
        content: task.title,
        project_name: client.name.replace(/ - Client$/, ""),
        priority: task.priority === "Urgent" ? 4 : task.priority === "High" ? 3 : task.priority === "Normal" ? 2 : 1,
        due: task.due_date ? { date: task.due_date } : null,
        is_completed: false,
        labels: task.labels || [],
        section: task.section || "",
      });
    }
  }
  return tasks;
}

// --- Build clients from Todoist projects ---
function buildClients() {
  if (!todoistData) return [];

  return Object.entries(todoistData.clients).map(([id, client], i) => {
    const activeTasks = client.tasks.filter((t) => t.status === "active");
    const name = client.name.replace(/ - Client$/, "");
    return {
      id: id,
      name: name,
      website: "",
      type: activeTasks.length > 3 ? "retainer" : "project",
      status: activeTasks.length > 0 ? "active" : "completed",
      monthly_value: 0,
      contact_name: "",
      contact_email: "",
      todoist_project_id: id,
      notes: `${activeTasks.length} active tasks, ${client.tasks.length} total`,
      last_activity: client.tasks[0]?.added_at || new Date().toISOString(),
      created_at: client.tasks[client.tasks.length - 1]?.added_at || new Date().toISOString(),
    };
  });
}

// --- Build dashboard stats ---
function buildDashboardStats(clients, tasks) {
  const activeClients = clients.filter((c) => c.status === "active");
  const overdueTasks = tasks.filter(
    (t) => t.due && new Date(t.due.date) < new Date() && !t.is_completed
  );
  return {
    active_projects: activeClients.length,
    total_clients: clients.length,
    pipeline_value: 0,
    monthly_retainer_value: 0,
    overdue_tasks: overdueTasks.length,
    total_tasks: tasks.length,
  };
}

// --- Contacts (mock data — will be replaced with Google Contacts when server runs) ---
function buildContacts() {
  // Import from mock-data concepts + real team info
  const contacts = [
    { id: "ct1", name: "Ely", first_name: "Ely", last_name: "", email: "", phone: "", organization: "SEO Specialist", title: "SEO Expert", category: "Friends", source: "static" },
    { id: "ct2", name: "Arnab", first_name: "Arnab", last_name: "", email: "", phone: "", organization: "XCloud", title: "Server Admin", category: "Vendors", source: "static" },
    { id: "ct3", name: "Shamim", first_name: "Shamim", last_name: "", email: "", phone: "", organization: "WordPress Developer", title: "Developer", category: "Vendors", source: "static" },
    { id: "ct4", name: "Tibi", first_name: "Tibi", last_name: "", email: "", phone: "", organization: "Graphic Designer", title: "Designer", category: "Vendors", source: "static" },
    { id: "ct5", name: "Michael Cohen", first_name: "Michael", last_name: "Cohen", email: "michael@stackhaus.ai", phone: "", organization: "StackHaus.ai", title: "Co-Founder", category: "Other", source: "static" },
    { id: "ct6", name: "Cindy Margolis", first_name: "Cindy", last_name: "Margolis", email: "cindy@cooperriver.ai", phone: "", organization: "Cooper River", title: "Chief of Staff", category: "Other", source: "static" },
  ];

  // Add clients from Todoist as contacts
  if (todoistData) {
    let i = 100;
    for (const [id, client] of Object.entries(todoistData.clients)) {
      const name = client.name.replace(/ - Client$/, "");
      contacts.push({
        id: `ct${i++}`,
        name: name,
        first_name: name.split(" ")[0],
        last_name: name.split(" ").slice(1).join(" "),
        email: "",
        phone: "",
        organization: name,
        title: "Client",
        category: "Clients",
        source: "static",
      });
    }
  }

  const stats = {
    total: contacts.length,
    clients: contacts.filter((c) => c.category === "Clients").length,
    friends: contacts.filter((c) => c.category === "Friends").length,
    family: contacts.filter((c) => c.category === "Family").length,
    vendors: contacts.filter((c) => c.category === "Vendors").length,
    other: contacts.filter((c) => c.category === "Other").length,
  };

  return { contacts, stats, source: "static" };
}

// --- Team data ---
function buildTeam() {
  return [
    { id: "a1", name: "David Oralevich", role: "Owner / Creative Director", avatar: "DO", status: "active", current_tasks: [], active_clients: ["All clients"] },
    { id: "a2", name: "Donna", role: "Chief of Staff — AI Agent", avatar: "DP", status: "active", current_tasks: ["Operations", "Team coordination", "Client follow-ups"], active_clients: ["All clients"] },
    { id: "a3", name: "Eitan", role: "Frontend Development", avatar: "EI", status: "active", current_tasks: ["CSS/JS learning", "Divi 5 mastery"], active_clients: [] },
    { id: "a4", name: "Ari", role: "Backend Development", avatar: "AR", status: "active", current_tasks: ["CRM API", "Server management"], active_clients: [] },
    { id: "a5", name: "Talia", role: "Content & Marketing", avatar: "TA", status: "active", current_tasks: ["HN post", "Product Hunt copy"], active_clients: [] },
    { id: "a6", name: "Shira", role: "Design & Visuals", avatar: "SH", status: "active", current_tasks: ["Product Hunt visuals", "Social media kit"], active_clients: [] },
    { id: "a7", name: "Yael", role: "Client Management", avatar: "YA", status: "active", current_tasks: ["Client audits", "Task tracking"], active_clients: [] },
    { id: "a8", name: "Lior", role: "Research & Analytics", avatar: "LI", status: "active", current_tasks: ["Research tasks"], active_clients: [] },
  ];
}

// --- Generate all static data files ---
const tasks = buildTasks();
const clients = buildClients();
const dashboardStats = buildDashboardStats(clients, tasks);
const contactsData = buildContacts();
const team = buildTeam();

// Calendar and emails need the server (Gmail/Calendar API) — provide empty defaults
const calendar = [];
const emails = [];

const files = {
  "tasks.json": tasks,
  "clients.json": clients,
  "dashboard-stats.json": dashboardStats,
  "contacts.json": contactsData,
  "team.json": team,
  "calendar.json": calendar,
  "emails.json": emails,
};

for (const [filename, data] of Object.entries(files)) {
  const path = join(publicData, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const size = JSON.stringify(data).length;
  console.log(`📝 ${filename} (${(size / 1024).toFixed(1)}KB)`);
}

console.log("\n✅ Static API data generated in public/data/");
