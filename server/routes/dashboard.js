import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import {
  mockClients,
  mockProposals,
  mockTasks,
} from "../lib/mock-data.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    if (supabase) {
      const [clientsRes, proposalsRes] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("proposals").select("*"),
      ]);

      const clients = clientsRes.data || [];
      const proposals = proposalsRes.data || [];

      const activeProjects = clients.filter((c) => c.status === "active").length;
      const pipelineValue = proposals
        .filter((p) => p.status === "sent" || p.status === "draft")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const monthlyRetainerValue = clients
        .filter((c) => c.type === "retainer" && c.status === "active")
        .reduce((sum, c) => sum + (c.monthly_value || 0), 0);

      return res.json({
        active_projects: activeProjects,
        pipeline_value: pipelineValue,
        monthly_retainer_value: monthlyRetainerValue,
        total_clients: clients.length,
      });
    }

    // Mock stats
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

    res.json({
      active_projects: activeProjects,
      pipeline_value: pipelineValue,
      monthly_retainer_value: monthlyRetainerValue,
      total_clients: mockClients.length,
      overdue_tasks: overdueTasks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
