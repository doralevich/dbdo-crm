import { google } from "googleapis";
import { supabase } from "./supabase.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

let cachedAuth = null;
let authExpiry = 0;

export async function getGoogleAuth() {
  if (!CLIENT_ID || !CLIENT_SECRET || !supabase) return null;

  // Return cached auth if still valid (with 5 min buffer)
  if (cachedAuth && Date.now() < authExpiry - 300000) {
    return cachedAuth;
  }

  try {
    const { data } = await supabase
      .from("google_tokens")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2.setCredentials({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expiry_date: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
    });

    // Set up token refresh listener to update Supabase
    oauth2.on("tokens", async (tokens) => {
      console.log("Google token refreshed, updating Supabase...");
      try {
        const updateData = {
          access_token: tokens.access_token,
        };
        if (tokens.expiry_date) {
          updateData.expires_at = new Date(tokens.expiry_date).toISOString();
        }
        if (tokens.refresh_token) {
          updateData.refresh_token = tokens.refresh_token;
        }

        await supabase
          .from("google_tokens")
          .update(updateData)
          .eq("id", data.id);

        authExpiry = tokens.expiry_date || Date.now() + 3600000;
        console.log("✅ Supabase tokens updated");
      } catch (err) {
        console.error("Failed to update tokens in Supabase:", err.message);
      }
    });

    cachedAuth = oauth2;
    authExpiry = data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 3600000;
    return oauth2;
  } catch (err) {
    console.error("getGoogleAuth error:", err.message);
    return null;
  }
}

export async function getGmail() {
  const auth = await getGoogleAuth();
  if (!auth) return null;
  return google.gmail({ version: "v1", auth });
}

export async function getCalendar() {
  const auth = await getGoogleAuth();
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

export async function getGoogleContacts() {
  const auth = await getGoogleAuth();
  if (!auth) return null;

  try {
    const people = google.people({ version: "v1", auth });

    // Fetch all contacts with pagination
    let allConnections = [];
    let nextPageToken = null;

    do {
      const response = await people.people.connections.list({
        resourceName: "people/me",
        pageSize: 1000,
        personFields:
          "names,emailAddresses,phoneNumbers,organizations,photos,memberships",
        pageToken: nextPageToken || undefined,
      });

      const connections = response.data.connections || [];
      allConnections = allConnections.concat(connections);
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    console.log(`✅ Fetched ${allConnections.length} Google contacts`);
    return allConnections;
  } catch (err) {
    console.error("Google Contacts fetch error:", err.message);
    // If auth error, clear cache so next attempt refetches
    if (err.code === 401 || err.code === 403) {
      cachedAuth = null;
      authExpiry = 0;
    }
    return null;
  }
}

// Force refresh the token (useful for debugging)
export async function refreshGoogleToken() {
  cachedAuth = null;
  authExpiry = 0;
  const auth = await getGoogleAuth();
  if (!auth) return { success: false, error: "No auth available" };

  try {
    const { credentials } = await auth.refreshAccessToken();
    return { success: true, expires: new Date(credentials.expiry_date).toISOString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
