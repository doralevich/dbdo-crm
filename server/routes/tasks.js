import { Router } from "express";
import supabase from "../lib/supabase.js";

const router = Router();

const PRIORITY_LABEL = { 1: "low", 2: "medium", 3: "high", 4: "urgent" };

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    if (!supabase) return res.json([]);

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("is_completed", false)
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false });

    if (req.query.client) {
      query = query.contains("labels", [req.query.client]);
    }
    if (req.query.priority) {
      const pNum = Object.entries(PRIORITY_LABEL).find(([,v]) => v === req.query.priority)?.[0];
      if (pNum) query = query.eq("priority", parseInt(pNum));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const tasks = (data || []).map(t => ({
      id: t.id,
      content: t.content,
      project_name: t.labels?.[0] || "General",
      priority: t.priority,
      priority_label: PRIORITY_LABEL[t.priority] || "medium",
      due: t.due_date ? { date: t.due_date } : null,
      is_completed: t.is_completed,
      labels: t.labels || [],
      client_id: t.client_id,
    }));

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const { content, priority, due_date, labels, client_id } = req.body;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ content, priority: priority || 2, due_date, labels, client_id, is_completed: false })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.json({ success: true, task: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id — complete or update
router.patch("/:id", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ message: "No database" });
    const { data, error } = await supabase
      .from("tasks")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.json({ success: true, task: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
