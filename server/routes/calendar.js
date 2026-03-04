import { Router } from "express";
import { getCalendar } from "../lib/google.js";
import { mockEvents } from "../lib/mock-data.js";

const router = Router();

// GET /api/calendar
router.get("/", async (req, res) => {
  try {
    const calendar = await getCalendar();

    if (calendar) {
      const now = new Date();
      const timeMin = req.query.timeMin || now.toISOString();
      const timeMax =
        req.query.timeMax ||
        new Date(now.getTime() + 7 * 86400000).toISOString();

      const { data } = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 20,
      });

      return res.json(
        (data.items || []).map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start,
          end: e.end,
          attendees: e.attendees || [],
          location: e.location || "",
        }))
      );
    }

    res.json(mockEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
