import { supabase } from "./supabase.js";
import { getGoogleContacts } from "./google.js";

let lastSyncTime = null;

function normalizeContact(person) {
  const names = person.names?.[0] || {};
  const emails = person.emailAddresses || [];
  const phones = person.phoneNumbers || [];
  const orgs = person.organizations || [];
  const photos = person.photos || [];

  return {
    google_resource_name: person.resourceName || null,
    name: names.displayName || "",
    email: emails[0]?.value || null,
    phone: phones[0]?.value || null,
    company: orgs[0]?.name || null,
    title: orgs[0]?.title || null,
    photo_url: photos[0]?.url || null,
    raw_data: person,
  };
}

async function matchContactToClient(contact) {
  if (!supabase || !contact.email) return null;

  // Match by email
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("contact_email", contact.email)
    .limit(1)
    .maybeSingle();

  if (data) return data.id;

  // Match by company name
  if (contact.company) {
    const { data: byCompany } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", `%${contact.company}%`)
      .limit(1)
      .maybeSingle();

    if (byCompany) return byCompany.id;
  }

  return null;
}

export async function syncContacts() {
  if (!supabase) {
    console.log("No Supabase — skipping contacts sync");
    return { synced: 0, source: "skipped" };
  }

  console.log("Syncing Google Contacts...");

  try {
    const contacts = await getGoogleContacts();
    if (!contacts) {
      console.warn("No contacts returned from Google");
      return { synced: 0, source: "google_error" };
    }

    let synced = 0;
    for (const person of contacts) {
      const contact = normalizeContact(person);
      if (!contact.name || !contact.google_resource_name) continue;

      const clientId = await matchContactToClient(contact);

      const { error } = await supabase
        .from("contacts")
        .upsert(
          {
            ...contact,
            client_id: clientId,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "google_resource_name" }
        );

      if (error) {
        console.warn(`Failed to upsert contact ${contact.name}: ${error.message}`);
      } else {
        synced++;
      }
    }

    // Update client google_contact_id for matched contacts
    const { data: matched } = await supabase
      .from("contacts")
      .select("google_resource_name, client_id")
      .not("client_id", "is", null);

    if (matched) {
      for (const c of matched) {
        await supabase
          .from("clients")
          .update({ google_contact_id: c.google_resource_name })
          .eq("id", c.client_id);
      }
    }

    lastSyncTime = new Date().toISOString();
    console.log(`Contacts sync complete: ${synced} contacts synced`);
    return { synced, total: contacts.length, source: "google", synced_at: lastSyncTime };
  } catch (err) {
    console.error("Contacts sync error:", err.message);
    return { synced: 0, source: "error", error: err.message };
  }
}

export function getLastContactsSyncTime() {
  return lastSyncTime;
}

// Start periodic sync (every 30 minutes)
export function startContactsSync() {
  // Initial sync after 5 second delay (let server start first)
  setTimeout(() => syncContacts(), 5000);

  // Then every 30 minutes
  setInterval(() => syncContacts(), 30 * 60 * 1000);
  console.log("Contacts sync scheduled: every 30 minutes");
}
