import { supabase } from "./supabase.js";
import { getCalendar } from "./google.js";

let lastSyncTime = null;

async function matchEventToClient(event) {
  if (!supabase) return null;

  const attendeeEmails = (event.attendees || [])
    .map((a) => a.email)
    .filter(Boolean);

  // Match by attendee email → client contact_email
  for (const email of attendeeEmails) {
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("contact_email", email)
      .limit(1)
      .maybeSingle();

    if (data) return data.id;
  }

  // Match by attendee email → contacts table
  for (const email of attendeeEmails) {
    const { data } = await supabase
      .from("contacts")
      .select("client_id")
      .eq("email", email)
      .not("client_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (data) return data.client_id;
  }

  // Match by event title containing client name
  if (event.summary) {
    const { data: clients } = await supabase.from("clients").select("id, name");
    if (clients) {
      const titleLower = event.summary.toLowerCase();
      for (const client of clients) {
        if (client.name && titleLower.includes(client.name.toLowerCase())) {
          return client.id;
        }
      }
    }
  }

  return null;
}

export async function syncCalendar() {
  if (!supabase) {
    console.log("No Supabase — skipping calendar sync");
    return { synced: 0, source: "skipped" };
  }

  console.log("Syncing Google Calendar...");

  try {
    const calendar = await getCalendar();
    if (!calendar) {
      console.warn("No calendar API available");
      return { synced: 0, source: "google_error" };
    }

    const now = new Date();
    const timeMin = new Date(now.getTime() - 7 * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + 30 * 86400000).toISOString();

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const events = data.items || [];
    let synced = 0;

    for (const event of events) {
      if (!event.id) continue;

      const clientId = await matchEventToClient(event);

      const row = {
        google_event_id: event.id,
        title: event.summary || "(No title)",
        description: event.description || null,
        start_time: event.start?.dateTime || event.start?.date || null,
        end_time: event.end?.dateTime || event.end?.date || null,
        location: event.location || null,
        attendees: event.attendees || [],
        client_id: clientId,
        raw_data: event,
        synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("calendar_events")
        .upsert(row, { onConflict: "google_event_id" });

      if (error) {
        console.warn(`Failed to upsert event "${row.title}": ${error.message}`);
      } else {
        synced++;
      }
    }

    lastSyncTime = new Date().toISOString();
    console.log(`Calendar sync complete: ${synced} events synced`);
    return { synced, total: events.length, source: "google", synced_at: lastSyncTime };
  } catch (err) {
    console.error("Calendar sync error:", err.message);
    return { synced: 0, source: "error", error: err.message };
  }
}

export function getLastCalendarSyncTime() {
  return lastSyncTime;
}

// Start periodic sync (every 15 minutes)
export function startCalendarSync() {
  // Initial sync after 8 second delay
  setTimeout(() => syncCalendar(), 8000);

  // Then every 15 minutes
  setInterval(() => syncCalendar(), 15 * 60 * 1000);
  console.log("Calendar sync scheduled: every 15 minutes");
}
