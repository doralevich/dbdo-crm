import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { getGmail } from "../lib/google.js";
import { mockEmails } from "../lib/mock-data.js";

const router = Router();

// ── GET /api/emails/:clientId — emails for a specific client ─────────────────
router.get("/:clientId", async (req, res) => {
  const { clientId } = req.params;
  const limit = parseInt(req.query.limit) || 25;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*")
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .limit(limit);

      if (!error) {
        return res.json(data || []);
      }
      // Table may not exist yet — fall through to live fetch
      console.warn("client_emails query error:", error.message);
    } catch (err) {
      console.warn("client_emails fetch error:", err.message);
    }
  }

  // Fallback: no stored emails yet for this client
  res.json([]);
});

// ── GET /api/emails — general inbox (live or DB) ─────────────────────────────
router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  // Try DB first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*")
        .order("date", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    } catch {
      // fall through to live fetch
    }
  }

  // Live fetch via Google API
  try {
    const gmail = await getGmail();

    if (gmail) {
      const { data: list } = await gmail.users.messages.list({
        userId: "me",
        maxResults: limit,
        q: req.query.q || "in:inbox",
      });

      if (!list.messages) return res.json([]);

      const emails = await Promise.all(
        list.messages.map(async (m) => {
          const { data: msg } = await gmail.users.messages.get({
            userId: "me",
            id: m.id,
            format: "metadata",
            metadataHeaders: ["From", "To", "Subject", "Date"],
          });

          const headers = {};
          for (const h of msg.payload.headers) {
            headers[h.name] = h.value;
          }

          return {
            message_id: msg.id,
            thread_id: msg.threadId,
            from_email: (headers.From || "").replace(/.*<|>.*/g, "").trim(),
            from_name:  (headers.From || "").replace(/<.*>/, "").trim(),
            to_email:   (headers.To   || "").replace(/.*<|>.*/g, "").trim(),
            subject:    headers.Subject || "(no subject)",
            snippet:    msg.snippet,
            date:       headers.Date,
            is_read:    !msg.labelIds?.includes("UNREAD"),
            direction:  "inbound",
            labels:     msg.labelIds || [],
          };
        })
      );

      return res.json(emails);
    }

    res.json(mockEmails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
