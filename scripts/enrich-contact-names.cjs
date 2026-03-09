/**
 * Enrich contact-type clients:
 * - If a contact has an organization, make company the primary name
 * - Move person name to contact_name
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  // Get all Google contacts with organization info
  const { data: contacts, error: cErr } = await sb
    .from('contacts')
    .select('id, name, email, phone, company')
    .not('company', 'is', null)
    .neq('company', '');

  if (cErr) throw new Error(cErr.message);
  console.log(`Contacts with organizations: ${contacts.length}`);

  // Get all contact-type clients
  const { data: clients, error: clErr } = await sb
    .from('clients')
    .select('id, name, contact_name, contact_email, type')
    .eq('type', 'contact');

  if (clErr) throw new Error(clErr.message);
  console.log(`Contact-type clients: ${clients.length}`);

  // Build lookup by email and name
  const byEmail = {};
  const byName = {};
  for (const c of contacts) {
    if (c.email) byEmail[c.email.toLowerCase()] = c;
    if (c.name) byName[c.name.toLowerCase()] = c;
  }

  let updated = 0;
  let skipped = 0;

  for (const client of clients) {
    const email = client.contact_email?.toLowerCase();
    const name = client.name?.toLowerCase();

    // Find matching Google contact
    const match = (email && byEmail[email]) || (name && byName[name]);
    if (!match) { skipped++; continue; }

    const org = match.company;
    if (!org || org.trim() === '') { skipped++; continue; }

    // Don't overwrite if name is already the org
    if (client.name?.toLowerCase() === org.toLowerCase()) { skipped++; continue; }

    // Update: company as name, person as contact_name
    const { error } = await sb
      .from('clients')
      .update({
        name: org.trim(),
        contact_name: client.name, // person name moves here
      })
      .eq('id', client.id);

    if (error) {
      console.error(`Failed ${client.name}: ${error.message}`);
    } else {
      console.log(`  ${client.name} → "${org}" (contact: ${client.name})`);
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

run().catch(console.error);
