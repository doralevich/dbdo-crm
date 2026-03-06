import { supabase } from "./supabase.js";

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  type TEXT DEFAULT 'project',
  status TEXT DEFAULT 'active',
  monthly_value NUMERIC DEFAULT 0,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  referral_source TEXT,
  todoist_project_id TEXT,
  google_contact_id TEXT,
  notes TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_resource_name TEXT UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  photo_url TEXT,
  client_id UUID REFERENCES clients(id),
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_event_id TEXT UNIQUE,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  attendees JSONB,
  client_id UUID REFERENCES clients(id),
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  title TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  type TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function executeSql(sql) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return false;

  try {
    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setupTables() {
  if (!supabase) {
    console.warn("No Supabase connection - skipping table setup");
    return;
  }

  console.log("Setting up Supabase tables...");

  // Try executing DDL via RPC (if exec_sql function exists)
  const rpcWorked = await executeSql(TABLE_SQL);
  if (rpcWorked) {
    console.log("Tables created via SQL RPC");
  }

  // Verify tables exist by attempting selects
  const tables = ["clients", "contacts", "calendar_events", "proposals", "interactions"];
  let allOk = true;
  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      console.warn(`  Table "${table}" not found: ${error.message}`);
      allOk = false;
    } else {
      console.log(`  Table "${table}" OK`);
    }
  }

  if (!allOk) {
    console.warn("\nSome tables are missing. Create them in the Supabase SQL Editor:");
    console.warn("https://supabase.com/dashboard → SQL Editor → paste the CREATE TABLE statements");
    console.warn("The app will use mock/fallback data for missing tables.\n");
  }

  console.log("Table setup complete");
}
