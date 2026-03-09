import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

const PRIORITY_LABEL = { 1: "low", 2: "medium", 3: "high", 4: "urgent" };

// Ensure extended columns + task_comments table exist
async function ensureSchema() {
  if (!supabase) return;
  // Add columns if missing — Supabase ignores if already exists via RPC
  await supabase.rpc("exec_sql", { sql: `
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes text;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
    CREATE TABLE IF NOT EXISTS task_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
      content text NOT NULL,
      author text DEFAULT 'David',
      created_at timestamptz DEFAULT now()
    );
  ` }).catch(() => {});
}
ensureSchema();

// Normalize task for client
function normalize(t) {
  return {
    id: t.id,
    content: t.content,
    description: t.description || "",
    notes: t.notes || "",
    owner: t.owner || t.labels?.[0] || "General",
    project_name: t.owner || t.labels?.[0] || "General",
    priority: t.priority,
    priority_label: PRIORITY_LABEL[t.priority] || "medium",
    due_date: t.due_date || null,
    due: t.due_date ? { date: t.due_date } : null,
    is_completed: t.is_completed,
    completed_at: t.completed_at || null,
    labels: t.labels || [],
    client_id: t.client_id,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

// GET /api/tasks/clients — clients that have open tasks, with counts + top tasks
router.get("/clients", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase
      .from("tasks")
      .select("id, content, owner, client_id, priority, due_date")
      .eq("is_completed", false)
      .order("priority", { ascending: false });
    if (error) throw new Error(error.message);

    const map = {};
    for (const t of data || []) {
      const key = t.client_id || t.owner;
      if (!key) continue;
      if (!map[key]) map[key] = { id: t.client_id, name: t.owner, count: 0, tasks: [] };
      map[key].count++;
      if (map[key].tasks.length < 3) map[key].tasks.push({ id: t.id, content: t.content, priority: t.priority, due_date: t.due_date });
    }
    const clients = Object.values(map).sort((a, b) => (a.name||"").localeCompare(b.name||""));
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/history — completed tasks
router.get("/history", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    let query = supabase.from("tasks").select("*").eq("is_completed", true)
      .order("completed_at", { ascending: false }).limit(100);
    if (req.query.client_id) query = query.eq("client_id", req.query.client_id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json((data || []).map(normalize));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    let query = supabase.from("tasks").select("*")
      .eq("is_completed", false)
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false });
    if (req.query.client_id) query = query.eq("client_id", req.query.client_id);
    if (req.query.priority) {
      const pNum = Object.entries(PRIORITY_LABEL).find(([,v]) => v === req.query.priority)?.[0];
      if (pNum) query = query.eq("priority", parseInt(pNum));
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json((data || []).map(normalize));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get("/:id", async (req, res) => {
  try {
    if (!supabase) return res.status(404).json({ message: "Not found" });
    const { data, error } = await supabase.from("tasks").select("*").eq("id", req.params.id).single();
    if (error) throw new Error(error.message);
    const { data: comments } = await supabase.from("task_comments").select("*").eq("task_id", req.params.id).order("created_at");
    res.json({ ...normalize(data), comments: comments || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const { content, description, notes, priority, due_date, labels, client_id, owner } = req.body;
    const { data, error } = await supabase.from("tasks")
      .insert({ content, description, notes, priority: priority || 2, due_date, labels, client_id, owner, is_completed: false })
      .select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, task: normalize(data) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.is_completed && !updates.completed_at) updates.completed_at = new Date().toISOString();
    const { data, error } = await supabase.from("tasks").update(updates).eq("id", req.params.id).select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, task: normalize(data) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const { error } = await supabase.from("tasks").delete().eq("id", req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id/comments
router.get("/:id/comments", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from("task_comments").select("*").eq("task_id", req.params.id).order("created_at");
    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post("/:id/comments", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const { content, author } = req.body;
    const { data, error } = await supabase.from("task_comments")
      .insert({ task_id: req.params.id, content, author: author || "David" })
      .select().single();
    if (error) throw new Error(error.message);
    res.json({ success: true, comment: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id/comments/:commentId
router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const { error } = await supabase.from("task_comments").delete().eq("id", req.params.commentId);
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
