// Simple session-based auth middleware for CRM protection
// Sessions are persisted to disk so they survive PM2 restarts

import crypto from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SESSIONS_FILE = join(__dirname, "../../data/sessions.json");

const APP_PASSWORD = process.env.CRM_PASSWORD || "Oralevich101!";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Load sessions from disk
function loadSessions() {
  try {
    if (existsSync(SESSIONS_FILE)) {
      const raw = readFileSync(SESSIONS_FILE, "utf8");
      return new Map(Object.entries(JSON.parse(raw)));
    }
  } catch {}
  return new Map();
}

// Save sessions to disk
function saveSessions(sessions) {
  try {
    writeFileSync(SESSIONS_FILE, JSON.stringify(Object.fromEntries(sessions)), "utf8");
  } catch {}
}

const sessions = loadSessions();

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function loginHandler(req, res) {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    const token = generateToken();
    sessions.set(token, { createdAt: Date.now() });
    saveSessions(sessions);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: "Invalid password" });
}

export function authMiddleware(req, res, next) {
  if (req.path === "/api/auth/login") return next();

  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.query.token;

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const session = sessions.get(token);
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(token);
    saveSessions(sessions);
    return res.status(401).json({ message: "Session expired" });
  }

  next();
}

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(token);
      changed = true;
    }
  }
  if (changed) saveSessions(sessions);
}, 60 * 60 * 1000);
