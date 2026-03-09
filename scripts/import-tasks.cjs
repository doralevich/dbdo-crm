/**
 * Import tasks from public/data/tasks.json into Supabase tasks table.
 * Matches project_name to client by name.
 * Schema mimics Todoist: content, priority, due_date, labels, section, is_completed.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// Todoist priority: 4=urgent, 3=high, 2=medium, 1=normal (keep as integer)

async function run() {
  const tasks = JSON.parse(fs.readFileSync('/tmp/crm-tasks.json', 'utf8'));
  console.log(`Loaded ${tasks.length} tasks`);

  // Get all clients for name matching
  const { data: clients } = await sb.from('clients').select('id, name');
  const clientByName = {};
  for (const c of clients) {
    clientByName[c.name.toLowerCase().trim()] = c.id;
  }
  console.log(`Loaded ${clients.length} clients`);

  // Check if tasks table needs section column
  const { error: altErr } = await sb.rpc('exec_sql', {
    sql: `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section text; ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text;`
  });
  if (altErr) {
    // Column likely already exists or no rpc — try directly
    console.log('Note: could not add columns via RPC, proceeding...');
  }

  const toInsert = [];
  let matched = 0;
  let unmatched = 0;

  for (const task of tasks) {
    if (!task.content?.trim()) continue;

    // Match client by project_name
    const projectKey = task.project_name?.toLowerCase().trim();
    let clientId = projectKey ? clientByName[projectKey] : null;

    // Fuzzy match: check if any client name contains the project name
    if (!clientId && projectKey) {
      for (const [name, id] of Object.entries(clientByName)) {
        if (name.includes(projectKey) || projectKey.includes(name)) {
          clientId = id;
          break;
        }
      }
    }

    if (clientId) matched++;
    else unmatched++;

    toInsert.push({
      content: task.content.trim(),
      client_id: clientId || null,
      priority: task.priority || 1,
      due_date: task.due?.date || null,
      is_completed: task.is_completed || false,
      labels: task.labels?.length ? task.labels : (task.section ? [task.section] : []),
      owner: task.project_name || null,
    });
  }

  console.log(`Matched to clients: ${matched}, Unmatched: ${unmatched}`);
  console.log(`Inserting ${toInsert.length} tasks...`);

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await sb.from('tasks').insert(batch);
    if (error) console.error(`Batch error: ${error.message}`);
    else inserted += batch.length;
  }

  console.log(`Done. Inserted: ${inserted} tasks.`);
}

run().catch(console.error);
