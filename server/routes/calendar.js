import { Router } from "express";
import { getCalendar } from "../lib/google.js";
import { supabase } from "../lib/supabase.js";
import { syncCalendar, getLastCalendarSyncTime } from "../lib/sync-calendar.js";
import { mockEvents } from "../lib/mock-data.js";

const router = Router();

// GET /api/calendar
router.get("/", async (req, res) => {
  try {
    // Try Supabase cached events first
    if (supabase) {
      const now = new Date();
      const timeMin = req.query.timeMin || new Date(now.getTime() - 7 * 86400000).toISOString();
      const timeMax = req.query.timeMax || new Date(now.getTime() + 30 * 86400000).toISOString();

      const { data: dbEvents, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", timeMin)
        .lte("start_time", timeMax)
        .order("start_time");

      if (!error && dbEvents && dbEvents.length > 0) {
        const events = dbEvents.map((e) => ({
          id: e.google_event_id || e.id,
          summary: e.title,
          description: e.description,
          start: { dateTime: e.start_time },
          end: { dateTime: e.end_time },
          attendees: e.attendees || [],
          location: e.location || "",
          client_id: e.client_id,
          source: "supabase",
        }));

        return res.json(events);
      }
    }

    // Fall back to live Google Calendar API
    const calendar = await getCalendar();

    if (calendar) {
      const now = new Date();
      const timeMin = req.query.timeMin || new Date(now.getTime() - 7 * 86400000).toISOString();
      const timeMax = req.query.timeMax || new Date(now.getTime() + 30 * 86400000).toISOString();

      const { data } = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
      });

      return res.json(
        (data.items || []).map((e) => ({
          id: e.id,
          summary: e.summary,
          description: e.description || "",
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

// GET /api/calendar/sync — trigger manual sync
router.get("/sync", async (req, res) => {
  try {
    const result = await syncCalendar();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/calendar/client/:clientId — events for a specific client
router.get("/client/:clientId", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("client_id", req.params.clientId)
        .order("start_time", { ascending: false })
        .limit(20);

      if (!error && data) {
        return res.json(
          data.map((e) => ({
            id: e.google_event_id || e.id,
            summary: e.title,
            start: { dateTime: e.start_time },
            end: { dateTime: e.end_time },
            attendees: e.attendees || [],
            location: e.location || "",
            client_id: e.client_id,
          }))
        );
      }
    }

    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
