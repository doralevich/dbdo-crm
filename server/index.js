import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { authMiddleware, loginHandler } from "./middleware/auth.js";
import { authGoogleHandler, authCallbackHandler } from "./routes/oauth.js";
import clientsRouter from "./routes/clients.js";
import tasksRouter from "./routes/tasks.js";
import emailsRouter from "./routes/emails.js";
import calendarRouter from "./routes/calendar.js";
import dashboardRouter from "./routes/dashboard.js";
import teamRouter from "./routes/team.js";
import contactsRouter from "./routes/contacts.js";
// import todoistRouter from "./routes/todoist.js"; // disabled — Supabase tasks are source of truth
import { setupTables } from "./lib/setup-tables.js";
import { startContactsSync } from "./lib/sync-contacts.js";
import { startCalendarSync } from "./lib/sync-calendar.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth endpoint (public)
app.post("/api/auth/login", loginHandler);

// Google OAuth endpoints (public — no auth required)
app.get("/auth/google", authGoogleHandler);
app.get("/auth/callback", authCallbackHandler);

// Protect all API routes
app.use("/api", authMiddleware);

// API routes
app.use("/api/clients", clientsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/emails", emailsRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/team", teamRouter);
app.use("/api/contacts", contactsRouter);
// app.use("/api/todoist", todoistRouter); // disabled

// Stock quote proxy — avoids CORS issues from the browser
app.get("/api/quotes", async (req, res) => {
  try {
    const symbols = "^GSPC,^DJI,^IXIC,BTC-USD";
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChangePercent`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await r.json();
    const quotes = (data?.quoteResponse?.result || []).map(q => ({
      sym: q.symbol,
      price: q.regularMarketPrice ?? null,
      pct: q.regularMarketChangePercent ?? null,
    }));
    res.json(quotes);
  } catch {
    res.json([]);
  }
});

// Serve static files in production
const distPath = join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, async () => {
  console.log(`Donna CRM API running on http://localhost:${PORT}`);

  // Setup tables then start sync
  await setupTables();
  startContactsSync();
  startCalendarSync();
});
