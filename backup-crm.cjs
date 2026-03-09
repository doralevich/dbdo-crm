#!/usr/bin/env node
// CRM Full Backup — exports all Supabase tables to JSON
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const s = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TABLES = ['clients', 'contacts', 'calendar_events', 'proposals', 'interactions'];
const BACKUP_DIR = path.join(__dirname, 'backups');

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = path.join(BACKUP_DIR, `crm-backup-${timestamp}.json`);
  const backupData = { backed_up_at: new Date().toISOString(), tables: {} };

  for (const table of TABLES) {
    const { data, error } = await s.from(table).select('*');
    if (error) {
      console.error(`Error backing up ${table}:`, error.message);
      backupData.tables[table] = { error: error.message, count: 0 };
    } else {
      backupData.tables[table] = { count: data.length, rows: data };
      console.log(`${table}: ${data.length} rows`);
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`\nBackup saved: ${backupFile}`);
  
  // Keep only last 30 backups
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('crm-backup-'))
    .sort()
    .reverse();
  
  if (files.length > 30) {
    for (const old of files.slice(30)) {
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log(`Cleaned old backup: ${old}`);
    }
  }
}

backup().catch(e => { console.error('Backup failed:', e); process.exit(1); });
