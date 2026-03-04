import { Router } from "express";
import { getGmail } from "../lib/google.js";
import { mockEmails } from "../lib/mock-data.js";

const router = Router();

// GET /api/emails
router.get("/", async (req, res) => {
  try {
    const gmail = await getGmail();

    if (gmail) {
      const maxResults = parseInt(req.query.limit) || 20;
      const { data: list } = await gmail.users.messages.list({
        userId: "me",
        maxResults,
        q: req.query.q || "in:inbox",
      });

      if (!list.messages) return res.json([]);

      const emails = await Promise.all(
        list.messages.map(async (m) => {
          const { data: msg } = await gmail.users.messages.get({
            userId: "me",
            id: m.id,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = {};
          for (const h of msg.payload.headers) {
            headers[h.name] = h.value;
          }

          return {
            id: msg.id,
            from: headers.From || "",
            from_name: (headers.From || "").replace(/<.*>/, "").trim(),
            subject: headers.Subject || "(no subject)",
            snippet: msg.snippet,
            date: headers.Date,
            is_read: !msg.labelIds?.includes("UNREAD"),
            is_important: msg.labelIds?.includes("IMPORTANT"),
            labels: msg.labelIds || [],
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
