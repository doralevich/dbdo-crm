import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import {
  mockClients,
  mockProposals,
  mockTasks,
  mockEvents,
} from "../lib/mock-data.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    if (supabase) {
      const [clientsRes, proposalsRes, eventsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("proposals").select("*"),
        supabase
          .from("calendar_events")
          .select("*")
          .gte("start_time", new Date().toISOString())
          .order("start_time")
          .limit(10),
      ]);

      // If tables exist and have no errors, use Supabase data
      if (!clientsRes.error && !proposalsRes.error) {
        const clients = clientsRes.data || [];
        const proposals = proposalsRes.data || [];
        const upcomingEvents = eventsRes.data || [];

        const activeProjects = clients.filter((c) => c.status === "active").length;
        const pipelineValue = proposals
          .filter((p) => p.status === "sent" || p.status === "draft")
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const monthlyRetainerValue = clients
          .filter((c) => c.type === "retainer" && c.status === "active")
          .reduce((sum, c) => sum + (c.monthly_value || 0), 0);

        const now = Date.now();
        const quietClients = clients.filter((c) => {
          if (c.status !== "active") return false;
          const lastAct = c.last_activity ? new Date(c.last_activity).getTime() : 0;
          return now - lastAct > 30 * 86400000;
        });

        const today = new Date().toISOString().split("T")[0];
        const todayMeetings = upcomingEvents.filter((e) =>
          e.start_time?.startsWith(today)
        );

        return res.json({
          active_projects: activeProjects,
          pipeline_value: pipelineValue,
          monthly_retainer_value: monthlyRetainerValue,
          total_clients: clients.length,
          meetings_today: todayMeetings.length,
          quiet_clients: quietClients.length,
          upcoming_events: upcomingEvents.slice(0, 3).map((e) => ({
            id: e.google_event_id || e.id,
            summary: e.title,
            start: { dateTime: e.start_time },
            end: { dateTime: e.end_time },
            location: e.location || "",
            client_id: e.client_id,
          })),
          needs_attention: quietClients.slice(0, 5).map((c) => ({
            id: c.id,
            name: c.name,
            last_activity: c.last_activity,
            days_quiet: Math.floor((now - new Date(c.last_activity).getTime()) / 86400000),
          })),
        });
      }
    }

    // Mock stats (fallback when Supabase tables don't exist)
    const activeProjects = mockClients.filter((c) => c.status === "active").length;
    const pipelineValue = mockProposals
      .filter((p) => p.status === "sent" || p.status === "draft")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlyRetainerValue = mockClients
      .filter((c) => c.type === "retainer" && c.status === "active")
      .reduce((sum, c) => sum + (c.monthly_value || 0), 0);
    const overdueTasks = mockTasks.filter(
      (t) => t.due && new Date(t.due.date) < new Date() && !t.is_completed
    ).length;

    const today = new Date().toDateString();
    const todayEvents = mockEvents.filter(
      (e) => new Date(e.start.dateTime).toDateString() === today
    );

    res.json({
      active_projects: activeProjects,
      pipeline_value: pipelineValue,
      monthly_retainer_value: monthlyRetainerValue,
      total_clients: mockClients.length,
      overdue_tasks: overdueTasks,
      meetings_today: todayEvents.length,
      quiet_clients: 0,
      upcoming_events: mockEvents.slice(0, 3).map((e) => ({
        id: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        location: e.location || "",
      })),
      needs_attention: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
