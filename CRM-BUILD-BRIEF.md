# CRM Build Brief — The Ultimate One-Touch Agency Dashboard

## Mission
Build the most informative, one-touch CRM dashboard ever created for a web design agency owner. 
When David clicks on ANYTHING, he should see EVERYTHING about that client/contact/event instantly.

## Current State
- React + Vite + Tailwind CSS frontend (src/)
- Express.js backend (server/)
- Google OAuth working via Supabase token storage
- Static data files exist but need live API replacement
- Deployed at crm.dbdodev.com on xCloud (separate deployment — we're building locally first)
- 38 clients in static JSON, 114 Todoist tasks, Google Contacts integration started

## .env is configured with:
- Supabase (service role key)
- Google OAuth (client ID + secret — same as gog CLI, has Gmail read, Calendar, Contacts, Drive scopes)
- Port 3001

## What To Build

### 1. Google Contacts Sync (PRIORITY)
- Fetch ALL Google Contacts via People API
- Store/cache in Supabase `contacts` table
- Auto-match contacts to clients by email/company
- Show contact details on client cards (photo, phone, email, company, title)
- Sync on server start + every 30 minutes
- Endpoint: GET /api/contacts, GET /api/contacts/sync

### 2. Google Calendar Sync (PRIORITY)  
- Fetch events from Google Calendar API (next 30 days + past 7 days)
- Store/cache in Supabase `calendar_events` table
- Auto-link events to clients by attendee email or event title matching client name
- Show upcoming meetings on client cards and dashboard
- Calendar page with week/month view
- Sync on server start + every 15 minutes
- Endpoint: GET /api/calendar, GET /api/calendar/sync

### 3. Dashboard (Home Page)
- Today's priorities (auto-generated from overdue tasks + upcoming meetings)
- Quick stats: active projects count, pipeline value, overdue invoices, meetings today
- Next 3 upcoming calendar events with one-click details
- Recent important emails (top 5-10)
- Overdue tasks (red badges)
- Clients needing attention (quiet 30+ days)
- Revenue snapshot (from Wave invoices if available, otherwise from client monthly_value)

### 4. Client Cards (Click → EVERYTHING)
When you click a client, show ONE page with ALL info:
- **Header:** Company name, logo/photo, website link, status badge, client type
- **Contact Info:** Name, email, phone, photo (from Google Contacts)
- **Quick Actions:** Email, Call, Schedule Meeting buttons
- **Upcoming Meetings:** From Google Calendar (matched by contact email)
- **Recent Emails:** Last 10 emails with/about this client
- **Active Tasks:** From Todoist (matched by project name)
- **Proposals:** Status, amounts, follow-up dates
- **Interaction History:** Calls, meetings, notes timeline
- **Billing:** Monthly retainer value, last invoice, overdue status
- **Notes:** Freeform notes field (saved to Supabase)
- **Activity Timeline:** Combined feed of emails, meetings, tasks, notes

### 5. Design Requirements
David's preferences (from prior sessions):
- **LIGHT THEME** (not dark mode)
- Clean, modern, minimal
- 15px body font size
- #111318 text color
- Card-based layout with subtle shadows
- Mobile responsive
- Fast — load under 2 seconds
- Sidebar navigation (dark sidebar #111318, light content area)
- No stock ticker, no unnecessary widgets

### 6. Supabase Tables Needed
Create these if they don't exist:

```sql
-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  type TEXT DEFAULT 'project', -- retainer, project, lead, prospect
  status TEXT DEFAULT 'active', -- active, paused, completed, lost
  monthly_value NUMERIC DEFAULT 0,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  referral_source TEXT,
  todoist_project_id TEXT,
  google_contact_id TEXT, -- linked Google Contact resourceName
  notes TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (synced from Google)
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

-- Calendar Events (synced from Google)
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

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  title TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'draft', -- draft, sent, won, lost
  sent_at TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  type TEXT, -- email, call, meeting, note
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. API Endpoints
All protected by auth middleware:
- GET /api/dashboard — aggregated stats
- GET /api/clients — list all clients with latest activity
- GET /api/clients/:id — full client detail with contacts, calendar, emails
- POST /api/clients — create client
- PUT /api/clients/:id — update client
- GET /api/contacts — all contacts
- GET /api/contacts/sync — trigger Google Contacts sync
- GET /api/calendar — upcoming events
- GET /api/calendar/sync — trigger Google Calendar sync
- GET /api/emails — recent emails (via Gmail API)
- GET /api/tasks — Todoist tasks grouped by project/client

### 8. Google Auth
The app already has Google OAuth setup:
- Tokens stored in Supabase `google_tokens` table
- server/lib/google.js has getGoogleAuth(), getGmail(), getCalendar(), getGoogleContacts()
- Uses refresh token flow
- Scopes needed: gmail.readonly, calendar.readonly, contacts.readonly, drive.readonly

### 9. Key Business Rules
- Hourly rate: $150
- Payment terms: 1/3, 1/3, 1/3
- If client quiet 30+ days → yellow warning badge
- If client quiet 60+ days → red "needs re-engagement" badge
- Referrals = gold — always highlight referral source
- Barry Abrams = high-touch, Raffi = highest-value retainer

## Tech Notes
- Use the existing server/lib/google.js for auth — it works
- Supabase client in server/lib/supabase.js
- Existing React components: Badge, Card, EmptyState, Layout, Spinner, StatCard
- Existing pages: Calendar, ClientDetail, Clients, Contacts, Dashboard, Email, Login, Tasks, Team
- Build on what's there, don't rewrite from scratch unless necessary
- npm install is already done

## Run
```bash
npm run dev  # starts both server (3001) and client (vite)
```

## DO NOT
- Send any emails ever
- Delete any data
- Change the .env file
- Modify Google OAuth scopes
