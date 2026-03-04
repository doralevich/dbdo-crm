import { google } from "googleapis";
import { supabase } from "./supabase.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function getGoogleAuth() {
  if (!CLIENT_ID || !CLIENT_SECRET || !supabase) return null;

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
      expiry_date: data.expiry_date,
    });

    return oauth2;
  } catch {
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
