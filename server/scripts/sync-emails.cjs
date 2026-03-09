#!/usr/bin/env node
/**
 * sync-emails.cjs
 * Pulls recent emails via gog CLI, matches them to CRM clients, and stores in Supabase.
 *
 * Usage:
 *   node server/scripts/sync-emails.cjs
 *   node server/scripts/sync-emails.cjs --max 100
 *   node server/scripts/sync-emails.cjs --dry-run
 */

'use strict';

require('dotenv/config');
const { execSync } = require('child_process');

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const GOG_ACCOUNT  = 'daveo@designsbydaveo.com';

const args      = process.argv.slice(2);
const MAX       = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? '50');
const DRY_RUN   = args.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

// ── Supabase helpers ─────────────────────────────────────────────────────────
const supa = {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  },

  async get(table, params = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`;
    const res = await fetch(url, { headers: { ...this.headers, 'Prefer': 'return=representation' } });
    if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
    return res.json();
  },

  async upsert(table, rows, conflictOn = 'id') {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Prefer': `resolution=merge-duplicates,return=minimal`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`UPSERT ${table}: ${res.status} ${body}`);
    }
    return true;
  },

  async createTable() {
    // Create client_emails table via RPC if it exists, otherwise via REST
    const sql = `
      CREATE TABLE IF NOT EXISTS client_emails (
        id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        message_id  TEXT UNIQUE NOT NULL,
        thread_id   TEXT,
        client_id   UUID REFERENCES clients(id),
        contact_id  UUID REFERENCES contacts(id),
        from_email  TEXT,
        from_name   TEXT,
        to_email    TEXT,
        subject     TEXT,
        snippet     TEXT,
        date        TIMESTAMPTZ,
        labels      JSONB DEFAULT '[]'::jsonb,
        is_read     BOOLEAN DEFAULT true,
        direction   TEXT DEFAULT 'inbound',
        synced_at   TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS client_emails_client_id_idx ON client_emails(client_id);
      CREATE INDEX IF NOT EXISTS client_emails_date_idx ON client_emails(date DESC);
      CREATE INDEX IF NOT EXISTS client_emails_from_email_idx ON client_emails(from_email);
    `;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query: sql }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async tableExists(table) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
        headers: this.headers,
      });
      return res.status !== 404 && res.status !== 400;
    } catch {
      return false;
    }
  },
};

// ── Email utilities ──────────────────────────────────────────────────────────
function extractEmail(str) {
  if (!str) return null;
  const m = str.match(/<([^>]+)>/);
  if (m) return m[1].toLowerCase().trim();
  const plain = str.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return plain ? plain[0].toLowerCase().trim() : null;
}

function extractName(str) {
  if (!str) return null;
  const m = str.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : null;
}

function parseDate(str) {
  if (!str) return null;
  try { return new Date(str).toISOString(); } catch { return null; }
}

// ── gog CLI helpers ──────────────────────────────────────────────────────────
function gogList(query, max) {
  try {
    const cmd = `gog gmail list ${JSON.stringify(query)} -a ${GOG_ACCOUNT} --max ${max} -j`;
    console.log(`  $ ${cmd}`);
    const out = execSync(cmd, { timeout: 60_000 }).toString();
    const data = JSON.parse(out);
    return data.threads || [];
  } catch (err) {
    console.warn(`  gog list failed: ${err.message}`);
    return [];
  }
}

function gogThreadGet(threadId) {
  try {
    const cmd = `gog gmail thread get ${threadId} -a ${GOG_ACCOUNT} -j`;
    const out = execSync(cmd, { timeout: 30_000 }).toString();
    const data = JSON.parse(out);
    return data.thread || null;
  } catch (err) {
    console.warn(`  gog thread get ${threadId} failed: ${err.message}`);
    return null;
  }
}

// ── Contact/client lookup cache ──────────────────────────────────────────────
const emailToClientId = new Map();  // email -> clientId
const emailToContactId = new Map(); // email -> contactId

async function buildLookupCache() {
  console.log('Building contact lookup cache...');
  // Fetch all contacts that have a client_id
  const contacts = await supa.get(
    'contacts',
    'select=id,email,client_id&client_id=not.is.null&email=not.is.null'
  );
  for (const c of contacts) {
    if (c.email) {
      const norm = c.email.toLowerCase().trim();
      emailToClientId.set(norm, c.client_id);
      emailToContactId.set(norm, c.id);
    }
  }

  // Also pull contacts without client_id — we can still store the contact_id
  const allContacts = await supa.get(
    'contacts',
    'select=id,email,client_id&email=not.is.null'
  );
  for (const c of allContacts) {
    const norm = c.email.toLowerCase().trim();
    if (!emailToContactId.has(norm)) {
      emailToContactId.set(norm, c.id);
    }
    if (!emailToClientId.has(norm) && c.client_id) {
      emailToClientId.set(norm, c.client_id);
    }
  }

  console.log(`  Loaded ${emailToClientId.size} email→client mappings`);
}

function lookupEmail(emailStr) {
  const addr = extractEmail(emailStr);
  if (!addr) return { clientId: null, contactId: null, email: null };
  return {
    clientId:  emailToClientId.get(addr)  || null,
    contactId: emailToContactId.get(addr) || null,
    email: addr,
  };
}

// ── Message extraction ───────────────────────────────────────────────────────
function extractMessageRecord(msg, direction = 'inbound') {
  const headers = {};
  for (const h of (msg.payload?.headers || [])) {
    headers[h.name] = h.value;
  }

  const fromRaw = headers['From'] || '';
  const toRaw   = headers['To']   || '';
  const fromEmail = extractEmail(fromRaw);
  const toEmail   = extractEmail(toRaw);

  // Determine client match: check both from and to
  const fromLookup = lookupEmail(fromRaw);
  const toLookup   = lookupEmail(toRaw);

  // Prefer the non-daveo side for client matching
  const isOutbound  = fromEmail === GOG_ACCOUNT.toLowerCase();
  const matchSide   = isOutbound ? toLookup : fromLookup;

  return {
    message_id: msg.id,
    thread_id:  msg.threadId || msg.id,
    client_id:  matchSide.clientId,
    contact_id: matchSide.contactId,
    from_email: fromEmail,
    from_name:  extractName(fromRaw),
    to_email:   toEmail,
    subject:    headers['Subject'] || '(no subject)',
    snippet:    msg.snippet || null,
    date:       parseDate(headers['Date']) ||
                (msg.internalDate ? new Date(parseInt(msg.internalDate)).toISOString() : null),
    labels:     msg.labelIds || [],
    is_read:    !(msg.labelIds || []).includes('UNREAD'),
    direction:  isOutbound ? 'outbound' : 'inbound',
    synced_at:  new Date().toISOString(),
  };
}

// ── Main sync ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== sync-emails.cjs  [${DRY_RUN ? 'DRY RUN' : 'LIVE'}] ===\n`);

  // 1. Ensure the emails table exists
  const tableOk = await supa.tableExists('client_emails');
  if (!tableOk) {
    console.log('Table client_emails not found — attempting to create...');
    const created = await supa.createTable();
    console.log(created ? '  Created.' : '  Could not auto-create. Create manually (see SQL below).');
    if (!created) {
      printCreateSQL();
      process.exit(1);
    }
  } else {
    console.log('Table client_emails: OK');
  }

  // 2. Build contact→client lookup cache
  await buildLookupCache();

  // 3. Fetch threads: inbox + sent
  const queries = [
    { q: 'in:inbox',        dir: 'inbound',  label: 'INBOX' },
    { q: 'in:sent',         dir: 'outbound', label: 'SENT'  },
  ];

  const allThreadIds = new Set();
  const threadMeta   = new Map(); // threadId -> { dir }

  for (const { q, dir, label } of queries) {
    console.log(`\nFetching ${label} threads (max ${MAX})...`);
    const threads = gogList(q, MAX);
    console.log(`  Got ${threads.length} threads`);
    for (const t of threads) {
      if (!allThreadIds.has(t.id)) {
        allThreadIds.add(t.id);
        threadMeta.set(t.id, { dir });
      }
    }
  }

  console.log(`\nTotal unique threads to process: ${allThreadIds.size}`);

  // 4. Fetch each thread's messages and build records
  let records = [];
  let idx = 0;
  for (const threadId of allThreadIds) {
    idx++;
    process.stdout.write(`\r  Fetching thread ${idx}/${allThreadIds.size}...`);

    const thread = gogThreadGet(threadId);
    if (!thread) continue;

    const { dir } = threadMeta.get(threadId);
    for (const msg of (thread.messages || [])) {
      const rec = extractMessageRecord(msg, dir);
      records.push(rec);
    }
  }
  console.log(`\n\nExtracted ${records.length} message records`);

  // 5. Stats
  const matched = records.filter(r => r.client_id).length;
  console.log(`  Matched to clients: ${matched}/${records.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample records (first 5 matched):');
    records.filter(r => r.client_id).slice(0, 5).forEach(r => {
      console.log(`  [${r.direction}] ${r.from_email} → ${r.to_email} | "${r.subject}" | client: ${r.client_id}`);
    });
    console.log('\n[DRY RUN] No data written.');
    return;
  }

  // 6. Upsert in batches of 50
  const BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    try {
      await supa.upsert('client_emails', batch);
      upserted += batch.length;
      process.stdout.write(`\r  Upserted ${upserted}/${records.length}...`);
    } catch (err) {
      console.error(`\n  Batch upsert error: ${err.message}`);
    }
  }

  console.log(`\n\nDone. ${upserted} emails synced.`);

  // 7. Summary of client coverage
  const clientCounts = {};
  for (const r of records) {
    if (r.client_id) {
      clientCounts[r.client_id] = (clientCounts[r.client_id] || 0) + 1;
    }
  }
  const numClients = Object.keys(clientCounts).length;
  console.log(`Emails linked to ${numClients} unique clients.`);
}

function printCreateSQL() {
  console.log(`\n--- Create this table in Supabase SQL Editor ---`);
  console.log(`
CREATE TABLE IF NOT EXISTS client_emails (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id  TEXT UNIQUE NOT NULL,
  thread_id   TEXT,
  client_id   UUID REFERENCES clients(id),
  contact_id  UUID REFERENCES contacts(id),
  from_email  TEXT,
  from_name   TEXT,
  to_email    TEXT,
  subject     TEXT,
  snippet     TEXT,
  date        TIMESTAMPTZ,
  labels      JSONB DEFAULT '[]'::jsonb,
  is_read     BOOLEAN DEFAULT true,
  direction   TEXT DEFAULT 'inbound',
  synced_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS client_emails_client_id_idx ON client_emails(client_id);
CREATE INDEX IF NOT EXISTS client_emails_date_idx ON client_emails(date DESC);
CREATE INDEX IF NOT EXISTS client_emails_from_email_idx ON client_emails(from_email);
`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
