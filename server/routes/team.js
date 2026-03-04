import { Router } from "express";
import { mockTeam } from "../lib/mock-data.js";

const router = Router();

// GET /api/team
router.get("/", async (req, res) => {
  try {
    res.json(mockTeam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
