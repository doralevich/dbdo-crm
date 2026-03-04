import { Router } from "express";
import { mockTasks } from "../lib/mock-data.js";

const router = Router();

const TODOIST_API = "https://api.todoist.com/rest/v2";

async function fetchTodoist(path) {
  const token = process.env.TODOIST_API_KEY;
  if (!token) return null;

  const res = await fetch(`${TODOIST_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Todoist API error: ${res.status}`);
  return res.json();
}

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const token = process.env.TODOIST_API_KEY;

    if (token) {
      const [tasks, projects] = await Promise.all([
        fetchTodoist("/tasks"),
        fetchTodoist("/projects"),
      ]);

      const projectMap = {};
      for (const p of projects) projectMap[p.id] = p.name;

      const enriched = tasks.map((t) => ({
        id: t.id,
        content: t.content,
        project_name: projectMap[t.project_id] || "Unknown",
        priority: t.priority,
        due: t.due,
        is_completed: t.is_completed,
        labels: t.labels,
      }));

      if (req.query.client) {
        return res.json(
          enriched.filter(
            (t) => t.project_name.toLowerCase() === req.query.client.toLowerCase()
          )
        );
      }
      return res.json(enriched);
    }

    let tasks = [...mockTasks];
    if (req.query.client) {
      tasks = tasks.filter(
        (t) =>
          t.project_name.toLowerCase() === req.query.client.toLowerCase()
      );
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
