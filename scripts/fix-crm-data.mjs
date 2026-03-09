/**
 * CRM Data Fix Script
 * 1. Populate contact_name/email/phone on clients from contacts table
 * 2. Fix invalid client type values
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testConnection() {
  const { data, error } = await supabase.from("clients").select("id").limit(1);
  if (error) throw new Error("Connection failed: " + error.message);
  console.log("Supabase connection OK");
}

// ── Fix 1: Populate client contact fields from contacts table ──────────────
async function populateClientContactFields() {
  console.log("\n── Fix 1: Populate client contact fields from contacts ──");

  // Get all clients that have a google_contact_id
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id, name, google_contact_id, contact_name, contact_email, contact_phone")
    .not("google_contact_id", "is", null);

  if (clientErr) throw clientErr;
  console.log(`Found ${clients.length} clients with google_contact_id`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const client of clients) {
    // Look up the contact by google_resource_name (google_contact_id stores the people/ resource name)
    const resourceName = client.google_contact_id.startsWith("people/")
      ? client.google_contact_id
      : `people/${client.google_contact_id}`;

    const { data: contacts, error: contactErr } = await supabase
      .from("contacts")
      .select("name, email, phone, company")
      .eq("google_resource_name", resourceName)
      .limit(1);

    if (contactErr || !contacts || contacts.length === 0) {
      // Try without the "people/" prefix as a fallback
      const { data: contacts2 } = await supabase
        .from("contacts")
        .select("name, email, phone, company")
        .eq("google_resource_name", client.google_contact_id)
        .limit(1);

      if (!contacts2 || contacts2.length === 0) {
        notFound++;
        continue;
      }
      contacts.push(...contacts2);
    }

    const contact = contacts[0];

    // Only update fields that are currently empty or would be improved
    const updates = {};
    if (!client.contact_name && contact.name) updates.contact_name = contact.name;
    if (!client.contact_email && contact.email) updates.contact_email = contact.email;
    if (!client.contact_phone && contact.phone) updates.contact_phone = contact.phone;

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    updates.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", client.id);

    if (updateErr) {
      console.error(`  Error updating client ${client.name}: ${updateErr.message}`);
    } else {
      updated++;
    }
  }

  console.log(`  Updated: ${updated} | Skipped (already had data): ${skipped} | Contact not found: ${notFound}`);
  return updated;
}

// ── Fix 2: Fix invalid client type values ─────────────────────────────────
async function fixClientTypes() {
  console.log("\n── Fix 2: Fix invalid client type values ──");

  const validTypes = ["retainer", "project", "lead", "prospect"];

  // Get all clients with invalid type
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, type, monthly_value")
    .not("type", "in", `(${validTypes.join(",")})`);

  if (error) throw error;
  console.log(`Found ${clients.length} clients with invalid type`);

  let retainerCount = 0;
  let projectCount = 0;

  for (const client of clients) {
    // If monthly_value > 0 → retainer, otherwise → project
    const newType = (client.monthly_value && client.monthly_value > 0) ? "retainer" : "project";

    const { error: updateErr } = await supabase
      .from("clients")
      .update({ type: newType, updated_at: new Date().toISOString() })
      .eq("id", client.id);

    if (updateErr) {
      console.error(`  Error updating client ${client.name}: ${updateErr.message}`);
    } else {
      if (newType === "retainer") retainerCount++;
      else projectCount++;
    }
  }

  console.log(`  Set to "retainer": ${retainerCount} | Set to "project": ${projectCount}`);
  return retainerCount + projectCount;
}

// ── Summary ────────────────────────────────────────────────────────────────
async function getStats() {
  console.log("\n── Current DB Stats ──");

  const { data: typeStats } = await supabase
    .from("clients")
    .select("type")
    .order("type");

  const counts = {};
  for (const row of typeStats || []) {
    counts[row.type] = (counts[row.type] || 0) + 1;
  }
  console.log("Client types:", counts);

  const { data: contactFillStats } = await supabase
    .from("clients")
    .select("id")
    .not("contact_name", "is", null);
  console.log(`Clients with contact_name populated: ${contactFillStats?.length ?? 0}`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  try {
    await testConnection();
    const contactsFixed = await populateClientContactFields();
    const typesFixed = await fixClientTypes();
    await getStats();

    console.log("\n── Summary ──");
    console.log(`Contact fields populated: ${contactsFixed} clients`);
    console.log(`Type values fixed: ${typesFixed} clients`);
    console.log("\nNote: last_activity timestamps (all set to 2026-03-07) need a separate");
    console.log("fix tied to real interaction data — not corrected here to avoid data loss.");
  } catch (err) {
    console.error("Fatal error:", err.message);
    process.exit(1);
  }
}

main();
