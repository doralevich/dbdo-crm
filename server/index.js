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

// Serve static files in production
const distPath = join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Donna CRM API running on http://localhost:${PORT}`);
});
