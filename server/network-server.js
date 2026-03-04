import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import clientsRouter from "./routes/clients.js";
import tasksRouter from "./routes/tasks.js";
import emailsRouter from "./routes/emails.js";
import calendarRouter from "./routes/calendar.js";
import dashboardRouter from "./routes/dashboard.js";
import teamRouter from "./routes/team.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/clients", clientsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/emails", emailsRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/team", teamRouter);

// Serve static files
const distPath = join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Donna CRM running on http://0.0.0.0:${PORT}`);
  console.log(`Network access: http://${process.env.NETWORK_IP || 'localhost'}:${PORT}`);
});
