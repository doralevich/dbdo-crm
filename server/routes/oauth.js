import { google } from "googleapis";
import { supabase } from "../lib/supabase.js";

const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.OAUTH_REDIRECT_URI || "https://crm.dbdodev.com/auth/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/drive.readonly",
];

const oauth2Client = new google.auth.OAuth2(
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  REDIRECT_URI
);

function ensureOAuthConfigured(req, res) {
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
    res
      .status(500)
      .send("Error: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET must be set.");
    return false;
  }
  return true;
}

// GET /auth/google — generate auth URL and redirect user to Google
export function authGoogleHandler(req, res) {
  if (!ensureOAuthConfigured(req, res)) return;
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  res.redirect(url);
}

// GET /auth/callback — receive Google callback, exchange code for tokens, save to Supabase
export async function authCallbackHandler(req, res) {
  if (!ensureOAuthConfigured(req, res)) return;
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Error: No authorization code received.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("✅ Google OAuth tokens received!");
    console.log(
      "  Access token:",
      tokens.access_token?.substring(0, 20) + "..."
    );
    console.log("  Refresh token:", tokens.refresh_token ? "YES" : "NO");
    console.log("  Scopes:", tokens.scope);
    console.log(
      "  Expires:",
      new Date(tokens.expiry_date).toLocaleString()
    );

    if (!supabase) {
      console.error("Supabase not configured — cannot save tokens");
      return res.status(500).send("Error: Database not configured.");
    }

    // Upsert tokens into Supabase google_tokens table
    const tokenRow = {
      id: 1,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    };

    // Try update first
    const { error: updateError } = await supabase
      .from("google_tokens")
      .update(tokenRow)
      .eq("id", 1);

    if (updateError) {
      // Fall back to insert
      const { error: insertError } = await supabase
        .from("google_tokens")
        .insert(tokenRow);

      if (insertError) {
        console.error("Supabase save error:", insertError.message);
        return res.status(500).send("Error saving tokens: " + insertError.message);
      }
    }

    console.log("✅ Tokens saved to Supabase!");

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Google Connected</title></head>
      <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: white;">
        <div style="text-align: center;">
          <h1>✅ Google Connected!</h1>
          <p>CRM now has access to Gmail, Calendar, Contacts, and Drive.</p>
          <p style="color: #888;">You can close this tab.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.status(500).send("Error exchanging authorization code: " + err.message);
  }
}
