// Simple session-based auth middleware for CRM protection
// Password is validated server-side; client stores session token

import crypto from "crypto";

const APP_PASSWORD = process.env.CRM_PASSWORD || "Oralevich101!";
const sessions = new Map(); // token -> { createdAt }
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function loginHandler(req, res) {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    const token = generateToken();
    sessions.set(token, { createdAt: Date.now() });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: "Invalid password" });
}

export function authMiddleware(req, res, next) {
  // Allow login endpoint through
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
    return res.status(401).json({ message: "Session expired" });
  }

  next();
}

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) sessions.delete(token);
  }
}, 60 * 60 * 1000);
