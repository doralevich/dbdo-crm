/**
 * Import Google contacts into Supabase clients table.
 * Skips contacts already linked to a client (client_id set).
 * Adds new clients for unlinked contacts.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  // Fetch all contacts from Supabase
  const { data: contacts, error: cErr } = await supabase
    .from("contacts")
    .select("*");

  if (cErr) throw new Error("Failed to fetch contacts: " + cErr.message);
  console.log(`Found ${contacts.length} contacts`);

  // Fetch existing clients
  const { data: existingClients, error: clErr } = await supabase
    .from("clients")
    .select("id, name, contact_email");

  if (clErr) throw new Error("Failed to fetch clients: " + clErr.message);

  const existingEmails = new Set(existingClients.map(c => c.contact_email?.toLowerCase()).filter(Boolean));
  const existingNames = new Set(existingClients.map(c => c.name?.toLowerCase()).filter(Boolean));

  // Build list of contacts to insert
  const toInsert = [];
  let skipped = 0;

  for (const contact of contacts) {
    const email = contact.email?.toLowerCase();
    const name = contact.name?.toLowerCase();

    // Skip if already a client (by email or name)
    if ((email && existingEmails.has(email)) || (name && existingNames.has(name))) {
      skipped++;
      continue;
    }

    // Skip contacts with no name
    if (!contact.name?.trim()) {
      skipped++;
      continue;
    }

    toInsert.push({
      name: contact.name,
      contact_name: contact.name,
      contact_email: contact.email || null,
      contact_phone: contact.phone || null,
      website: null,
      status: "active",
      type: "contact",
      monthly_value: 0,
      notes: contact.organization ? `Organization: ${contact.organization}` : null,
      last_activity: new Date().toISOString(),
    });
  }

  console.log(`Skipping ${skipped} (already exist)`);
  console.log(`Inserting ${toInsert.length} new clients...`);

  if (toInsert.length === 0) {
    console.log("Nothing to insert.");
    return;
  }

  // Insert in batches of 100
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error } = await supabase.from("clients").insert(batch);
    if (error) {
      console.error(`Batch ${i}-${i+100} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${toInsert.length}`);
    }
  }

  console.log(`Done. ${inserted} contacts imported as clients.`);
}

run().catch(console.error);
