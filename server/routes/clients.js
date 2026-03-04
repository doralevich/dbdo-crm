import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import {
  mockClients,
  mockProposals,
  mockInteractions,
} from "../lib/mock-data.js";

const router = Router();

// GET /api/clients
router.get("/", async (req, res) => {
  try {
    if (supabase) {
      let query = supabase.from("clients").select("*").order("last_activity", { ascending: false });

      if (req.query.status) query = query.eq("status", req.query.status);
      if (req.query.type) query = query.eq("type", req.query.type);

      const { data, error } = await query;
      if (error) throw error;
      return res.json(data);
    }

    let clients = [...mockClients];
    if (req.query.status) clients = clients.filter((c) => c.status === req.query.status);
    if (req.query.type) clients = clients.filter((c) => c.type === req.query.type);
    if (req.query.filter === "quiet") {
      const cutoff = Date.now() - 30 * 86400000;
      clients = clients.filter((c) => new Date(c.last_activity).getTime() < cutoff);
    }
    if (req.query.filter === "lapsed") {
      const cutoff = Date.now() - 60 * 86400000;
      clients = clients.filter((c) => new Date(c.last_activity).getTime() < cutoff);
    }
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/clients/:id
router.get("/:id", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", req.params.id)
        .single();
      if (error) throw error;
      return res.json(data);
    }

    const client = mockClients.find((c) => c.id === req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/clients
router.post("/", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("clients")
        .insert(req.body)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ ...req.body, id: `c${Date.now()}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/clients/:id
router.patch("/:id", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("clients")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/clients/:id/proposals
router.get("/:id/proposals", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("client_id", req.params.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.json(data);
    }
    res.json(mockProposals.filter((p) => p.client_id === req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/clients/:id/proposals
router.post("/:id/proposals", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("proposals")
        .insert({ ...req.body, client_id: req.params.id })
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ ...req.body, id: `p${Date.now()}`, client_id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/clients/:id/interactions
router.get("/:id/interactions", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("client_id", req.params.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.json(data);
    }
    res.json(mockInteractions.filter((i) => i.client_id === req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/clients/:id/interactions
router.post("/:id/interactions", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("interactions")
        .insert({ ...req.body, client_id: req.params.id })
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ ...req.body, id: `i${Date.now()}`, client_id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
