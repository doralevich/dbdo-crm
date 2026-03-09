#!/usr/bin/env node
// Daily Google Contacts → CRM Sync
// Upserts all contacts, creates new client records for new companies, links contacts

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

const s = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const GOG = '/Users/donna/openclaw/node_modules/.pnpm/node_modules/.bin/gog';
const ACCOUNT = 'daveo@designsbydaveo.com';

function gogContacts(page) {
  const pageFlag = page ? `--page "${page}"` : '';
  const out = execSync(
    `GOG_KEYRING_PASSWORD="Donna101!" ${GOG} contacts list --max 500 --json ${pageFlag} --account ${ACCOUNT} 2>/dev/null`,
    { encoding: 'utf8' }
  );
  return JSON.parse(out);
}

async function sync() {
  console.log(`[${new Date().toISOString()}] Starting Google Contacts sync...`);
  
  // Fetch all pages
  let all = [];
  let page = null;
  do {
    const data = gogContacts(page);
    all = all.concat(data.contacts || []);
    page = data.nextPageToken || null;
  } while (page);
  console.log(`Fetched ${all.length} contacts from Google`);

  // Get existing clients for company matching
  const { data: existingClients } = await s.from('clients').select('id, name');
  const clientsByName = {};
  for (const c of existingClients || []) {
    clientsByName[c.name.toLowerCase()] = c.id;
  }

  let synced = 0, newClients = 0, linked = 0, errors = 0;

  for (let i = 0; i < all.length; i += 50) {
    const batch = all.slice(i, i + 50);
    const records = [];

    for (const c of batch) {
      // Try to get full details for company info
      let company = null, title = null;
      try {
        const full = execSync(
          `GOG_KEYRING_PASSWORD="Donna101!" ${GOG} contacts get "${c.resource}" --json --account ${ACCOUNT} 2>/dev/null`,
          { encoding: 'utf8' }
        );
        const d = JSON.parse(full);
        company = d.contact?.organizations?.[0]?.name || null;
        title = d.contact?.organizations?.[0]?.title || null;
      } catch (e) {}

      // Find or create client for company
      let clientId = null;
      if (company) {
        const key = company.toLowerCase();
        if (clientsByName[key]) {
          clientId = clientsByName[key];
        } else {
          // Create new client
          const { data: newClient, error } = await s.from('clients').insert({
            name: company,
            status: 'active',
            type: 'project'
          }).select('id').single();
          if (!error && newClient) {
            clientId = newClient.id;
            clientsByName[key] = clientId;
            newClients++;
          }
        }
        if (clientId) linked++;
      }

      records.push({
        google_resource_name: c.resource,
        name: c.name || null,
        email: c.email || null,
        phone: c.phone || null,
        company,
        title,
        client_id: clientId,
        synced_at: new Date().toISOString()
      });
    }

    const { error } = await s.from('contacts').upsert(records, { onConflict: 'google_resource_name' });
    if (error) { errors++; console.error('Batch error:', error.message); }
    else synced += records.length;
  }

  console.log(`Synced: ${synced} | New clients: ${newClients} | Linked: ${linked} | Errors: ${errors}`);
  console.log(`[${new Date().toISOString()}] Sync complete.`);
}

sync().catch(e => { console.error('Sync failed:', e); process.exit(1); });
