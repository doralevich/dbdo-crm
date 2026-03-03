# Donna CRM — Build Brief

## What
A web dashboard for David Oralevich's agency (Designs By Dave O / DBDO). Single-page app that pulls data from multiple sources into one view.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js API
- **Database:** Supabase (PostgreSQL) — existing instance
- **Auth:** Simple token-based (single user — David)

## Data Sources (all have working credentials)
1. **Supabase** — CRM tables (clients, proposals, interactions) + existing donna_cache
   - URL: https://moubzvpffhqvumipbnfj.supabase.co
   - Service role key in macOS Keychain (or use env vars)
2. **Todoist** — Tasks by client (API v1)
   - API token in macOS Keychain
3. **Gmail** — Email (read only, flag important)
   - OAuth tokens stored in Supabase google_tokens table
4. **Google Calendar** — Upcoming events
   - Same OAuth tokens
5. **Google Contacts** — Client contact info
   - Same OAuth tokens

## Dashboard Sections

### 1. Overview (Home)
- Today's priorities
- Overdue task count (red badge)
- Upcoming calendar events (next 48h)
- Recent emails (flagged/important)
- Quick stats: active projects, pipeline value, overdue invoices

### 2. Clients
- Card grid or table view of all clients
- Each client shows: name, website, type (retainer/project), status, last activity, contact name
- Click → detail view with: tasks, emails, proposals, interactions, notes
- Filters: active, retainer, project, quiet 30+ days, lapsed 60+ days

### 3. Tasks
- Pulled from Todoist API
- Organized by client (each Todoist project = a client)
- Overdue highlighted in red
- Today's tasks highlighted
- Can filter by client, priority, status

### 4. Pipeline
- Proposals: sent, pending, won, lost
- Revenue tracking (if Wave connected later)
- Follow-up reminders (Day 3/7/14)

### 5. Team
- Agent assignments and active tasks
- Status of what each agent is working on

## Design
- Dark mode by default
- Clean, modern, minimal
- Mobile responsive (David checks from phone)
- DBDO branding — use brand colors if available, otherwise dark navy + gold accents

## API Keys (use environment variables)
```
SUPABASE_URL=https://moubzvpffhqvumipbnfj.supabase.co
SUPABASE_KEY=<service_role_key>
TODOIST_API_KEY=<token>
GOOGLE_CLIENT_ID=749448193098-eb3p8e20jmfrao4kr6va50qm6dvc0nqa.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
```

## Supabase Tables to Create

### clients
- id (uuid, PK)
- name (text)
- website (text)
- type (enum: retainer, project, lead, prospect)
- status (enum: active, paused, completed, lost)
- monthly_value (numeric)
- contact_name (text)
- contact_email (text)
- contact_phone (text)
- referral_source (text)
- todoist_project_id (text)
- notes (text)
- last_activity (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

### proposals
- id (uuid, PK)
- client_id (uuid, FK → clients)
- title (text)
- amount (numeric)
- status (enum: draft, sent, won, lost)
- sent_at (timestamptz)
- follow_up_at (timestamptz)
- lost_reason (text)
- notes (text)
- created_at (timestamptz)

### interactions
- id (uuid, PK)
- client_id (uuid, FK → clients)
- type (enum: email, call, meeting, note)
- summary (text)
- created_at (timestamptz)

## Important Rules
- NO sending emails. Ever. Read only.
- Dark mode default
- Fast. No bloat. Load in under 2 seconds.
- Mobile-first responsive design
