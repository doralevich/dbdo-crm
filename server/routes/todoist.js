import { Router } from "express";

const router = Router();
const BASE = "https://api.todoist.com/api/v1";

function todoistHeaders() {
  return {
    Authorization: `Bearer ${process.env.TODOIST_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function normalizeTask(t) {
  return {
    id: t.id,
    content: t.content,
    description: t.description || "",
    priority: t.priority,
    due_date: t.due?.date || null,
    project_id: t.project_id,
    labels: t.labels || [],
    url: `https://app.todoist.com/app/task/${t.id}`,
  };
}

// Fetch all tasks, handling pagination
async function fetchAllTasks() {
  const tasks = [];
  let cursor = null;
  do {
    const url = cursor ? `${BASE}/tasks?cursor=${cursor}` : `${BASE}/tasks`;
    const r = await fetch(url, { headers: todoistHeaders() });
    if (!r.ok) throw new Error(`Todoist error: ${r.status}`);
    const data = await r.json();
    tasks.push(...(data.results || []));
    cursor = data.next_cursor || null;
  } while (cursor);
  return tasks;
}

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await fetchAllTasks();
    res.json(tasks.map(normalizeTask));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/projects", async (req, res) => {
  try {
    const r = await fetch(`${BASE}/projects`, { headers: todoistHeaders() });
    if (!r.ok) return res.status(r.status).json({ message: "Todoist error" });
    const data = await r.json();
    res.json(data.results || data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/tasks/:id/close", async (req, res) => {
  try {
    const r = await fetch(`${BASE}/tasks/${req.params.id}/close`, {
      method: "POST",
      headers: todoistHeaders(),
    });
    if (!r.ok) return res.status(r.status).json({ message: "Todoist error" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
