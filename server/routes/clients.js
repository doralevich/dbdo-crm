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
      let query = supabase.from("clients").select("*").order("last_activity", { ascending: false }).range(0, 999);

      if (req.query.status) query = query.eq("status", req.query.status);
      if (req.query.type) query = query.eq("type", req.query.type);

      const { data, error } = await query;

      if (!error && data) {
        let clients = data;

        if (req.query.filter === "quiet") {
          const cutoff = Date.now() - 30 * 86400000;
          clients = clients.filter((c) => new Date(c.last_activity).getTime() < cutoff);
        }
        if (req.query.filter === "lapsed") {
          const cutoff = Date.now() - 60 * 86400000;
          clients = clients.filter((c) => new Date(c.last_activity).getTime() < cutoff);
        }

        return res.json(clients);
      }
    }

    // Fallback to mock data
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

// GET /api/clients/:id — full client detail with contacts + calendar
router.get("/:id", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error) {
        // Table may not exist — fall through to mock data
        const client = mockClients.find((c) => c.id === req.params.id);
        if (!client) return res.status(404).json({ message: "Client not found" });
        return res.json({ ...client, linked_contacts: [], upcoming_events: [] });
      }

      // Enrich with linked contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("client_id", req.params.id);

      // Enrich with upcoming calendar events
      const { data: events } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("client_id", req.params.id)
        .gte("start_time", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("start_time")
        .limit(10);

      const enrichedEvents = (events || []).map((e) => ({
        id: e.google_event_id || e.id,
        summary: e.title,
        start: { dateTime: e.start_time },
        end: { dateTime: e.end_time },
        attendees: e.attendees || [],
        location: e.location || "",
      }));

      return res.json({
        ...data,
        linked_contacts: (contacts || []).map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone,
          photo_url: c.photo_url,
          title: c.title,
          company: c.company,
        })),
        upcoming_events: enrichedEvents,
      });
    }

    const client = mockClients.find((c) => c.id === req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ ...client, linked_contacts: [], upcoming_events: [] });
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

// PUT /api/clients/:id
router.put("/:id", async (req, res) => {
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

// DELETE /api/clients/:id
router.delete("/:id", async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase.from("clients").delete().eq("id", req.params.id);
      if (error) throw error;
      return res.json({ success: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
