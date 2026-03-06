// Mock data used when API keys aren't configured
// This lets the dashboard work beautifully out of the box

export const mockClients = [
  {
    id: "c1",
    name: "Meridian Hotels Group",
    website: "meridianhotels.com",
    type: "retainer",
    status: "active",
    monthly_value: 4500,
    contact_name: "Sarah Chen",
    contact_email: "sarah@meridianhotels.com",
    contact_phone: "(555) 234-5678",
    referral_source: "LinkedIn",
    todoist_project_id: "2301",
    notes: "Redesigning their booking flow. Phase 2 starts next month.",
    last_activity: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: "2024-06-15T10:00:00Z",
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "c2",
    name: "Bolt Fitness Co",
    website: "boltfitness.co",
    type: "project",
    status: "active",
    monthly_value: 8000,
    contact_name: "Marcus Rivera",
    contact_email: "marcus@boltfitness.co",
    contact_phone: "(555) 876-5432",
    referral_source: "Referral — Sarah Chen",
    todoist_project_id: "2302",
    notes: "New brand identity + website. Launch deadline April 15.",
    last_activity: new Date(Date.now() - 5 * 3600000).toISOString(),
    created_at: "2025-01-10T10:00:00Z",
    updated_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "c3",
    name: "GreenPath Advisory",
    website: "greenpathadvisory.com",
    type: "retainer",
    status: "active",
    monthly_value: 3200,
    contact_name: "James Okoro",
    contact_email: "james@greenpathadvisory.com",
    contact_phone: "(555) 345-6789",
    referral_source: "Google Search",
    todoist_project_id: "2303",
    notes: "Monthly content + SEO. Great client, always on time with feedback.",
    last_activity: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: "2024-03-20T10:00:00Z",
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "c4",
    name: "Luma Skincare",
    website: "lumaskincare.com",
    type: "project",
    status: "active",
    monthly_value: 12000,
    contact_name: "Priya Patel",
    contact_email: "priya@lumaskincare.com",
    contact_phone: "(555) 567-8901",
    referral_source: "Instagram",
    todoist_project_id: "2304",
    notes: "E-commerce build. Shopify Plus migration. High priority.",
    last_activity: new Date(Date.now() - 1 * 3600000).toISOString(),
    created_at: "2025-02-01T10:00:00Z",
    updated_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: "c5",
    name: "Northside Dental",
    website: "northsidedental.com",
    type: "retainer",
    status: "active",
    monthly_value: 1800,
    contact_name: "Dr. Amy Liu",
    contact_email: "amy@northsidedental.com",
    contact_phone: "(555) 789-0123",
    referral_source: "Referral — James Okoro",
    todoist_project_id: "2305",
    notes: "Social media management + quarterly website updates.",
    last_activity: new Date(Date.now() - 48 * 3600000).toISOString(),
    created_at: "2024-09-01T10:00:00Z",
    updated_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "c6",
    name: "TerraVault Storage",
    website: "terravault.io",
    type: "lead",
    status: "active",
    monthly_value: 0,
    contact_name: "Kevin Park",
    contact_email: "kevin@terravault.io",
    contact_phone: "(555) 901-2345",
    referral_source: "Cold outreach",
    todoist_project_id: null,
    notes: "Had intro call. Interested in full rebrand. Follow up next week.",
    last_activity: new Date(Date.now() - 72 * 3600000).toISOString(),
    created_at: "2026-02-20T10:00:00Z",
    updated_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: "c7",
    name: "WaveRider Surf Co",
    website: "waveridersurfco.com",
    type: "project",
    status: "completed",
    monthly_value: 6500,
    contact_name: "Jake Thompson",
    contact_email: "jake@waveridersurfco.com",
    contact_phone: "(555) 234-5679",
    referral_source: "Referral",
    todoist_project_id: "2307",
    notes: "Website complete. May do Phase 2 (e-commerce) later this year.",
    last_activity: new Date(Date.now() - 35 * 86400000).toISOString(),
    created_at: "2024-08-15T10:00:00Z",
    updated_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: "c9",
    name: "Vacuum America Clean",
    website: "vacuum-america-clean.myshopify.com",
    type: "project",
    status: "active",
    monthly_value: 0,
    contact_name: "Mark Genoa",
    contact_email: "imark21@aol.com",
    contact_phone: "1 (631) 974-0649",
    referral_source: "",
    todoist_project_id: "",
    google_contact_id: "people/c4389558232168668562",
    notes: `President of Nationwide Sales & Service Inc. (now Vacuum America Clean).
Shopify store: vacuum-america-clean.myshopify.com
Sales email: sales@vacamericaclean.com
Domain: vacamerica.com (Google Workspace active)

ACTIVE TASKS:
- Shopify product spreadsheet — pricing & barcodes need review with Mark
- FedEx shipping setup — Mark using UPS, waiting on FedEx pricing
- Shopify tax document needed for store checkout
- Fred Morante handling product imagery (DropBox links for categories: vacuums, janitorial, microfiber, mops, squeegees, hand pads, power nozzles, carts, handles)
- Tibi (designer) did wireframe/design connect on Feb 27

PAYMENTS:
- $3,200 received via Wave (Jan 16, 2026)

KEY CONTACTS:
- Mark Genoa (President) — imark21@aol.com, (631) 974-0649
- Fred Morante — fred@minutemanbellerose.com, (516) 376-4415 (product imagery)
- Sales Team — sales@vacamericaclean.com

LAST COMMUNICATION:
- Mar 2: David & Mark discussing Wed meeting re: FedEx + spreadsheet review
- Mark said he'd get back with availability
- Status: Waiting on Mark to confirm meeting time`,
    last_activity: new Date("2026-03-02T22:32:00Z").toISOString(),
    created_at: "2026-01-16T10:00:00Z",
    updated_at: new Date("2026-03-02T22:32:00Z").toISOString(),
  },
  {
    id: "c8",
    name: "Pinnacle Legal Group",
    website: "pinnaclelegal.com",
    type: "prospect",
    status: "active",
    monthly_value: 0,
    contact_name: "Diana Reeves",
    contact_email: "diana@pinnaclelegal.com",
    contact_phone: "(555) 456-7890",
    referral_source: "Website form",
    todoist_project_id: null,
    notes: "Submitted inquiry for website redesign. Budget TBD.",
    last_activity: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: "2026-02-26T10:00:00Z",
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const mockProposals = [
  {
    id: "p1",
    client_id: "c1",
    title: "Booking Flow Redesign — Phase 2",
    amount: 18000,
    status: "sent",
    sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    follow_up_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    notes: "Includes mobile app mockups",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "p2",
    client_id: "c4",
    title: "Shopify Plus Migration",
    amount: 35000,
    status: "won",
    sent_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    notes: "Signed! Deposit received.",
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: "p3",
    client_id: "c6",
    title: "Full Rebrand Package",
    amount: 22000,
    status: "draft",
    notes: "Waiting for their brand audit results before sending",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "p4",
    client_id: "c2",
    title: "Brand Identity + Website",
    amount: 28000,
    status: "won",
    sent_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    notes: "Signed. Project in progress.",
    created_at: new Date(Date.now() - 65 * 86400000).toISOString(),
  },
];

export const mockInteractions = [
  {
    id: "i1",
    client_id: "c1",
    type: "call",
    summary: "Reviewed Phase 1 results. Client very happy with conversion lift.",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "i2",
    client_id: "c4",
    type: "email",
    summary: "Sent updated wireframes for product page template.",
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "i3",
    client_id: "c2",
    type: "meeting",
    summary: "Brand workshop session #2. Narrowed down to 2 logo concepts.",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "i4",
    client_id: "c3",
    type: "note",
    summary: "Blog post for March approved. Schedule for Tuesday publish.",
    created_at: new Date(Date.now() - 28 * 3600000).toISOString(),
  },
  {
    id: "i5",
    client_id: "c6",
    type: "call",
    summary: "Intro call — Kevin interested in full rebrand. Sending proposal next week.",
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

export const mockTasks = [
  {
    id: "t1",
    content: "Finalize homepage wireframe for Luma Skincare",
    project_name: "Luma Skincare",
    client_id: "c4",
    priority: 4,
    due: { date: new Date(today).toISOString().split("T")[0] },
    is_completed: false,
    labels: ["design"],
  },
  {
    id: "t2",
    content: "Send Phase 2 proposal to Meridian Hotels",
    project_name: "Meridian Hotels Group",
    client_id: "c1",
    priority: 4,
    due: {
      date: new Date(today.getTime() - 1 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["proposals"],
  },
  {
    id: "t3",
    content: "Review logo concepts with Marcus (Bolt Fitness)",
    project_name: "Bolt Fitness Co",
    client_id: "c2",
    priority: 3,
    due: { date: new Date(today).toISOString().split("T")[0] },
    is_completed: false,
    labels: ["design"],
  },
  {
    id: "t4",
    content: "Write March blog post for GreenPath",
    project_name: "GreenPath Advisory",
    client_id: "c3",
    priority: 2,
    due: {
      date: new Date(today.getTime() + 2 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["content"],
  },
  {
    id: "t5",
    content: "Schedule social posts — Northside Dental (March)",
    project_name: "Northside Dental",
    client_id: "c5",
    priority: 2,
    due: {
      date: new Date(today.getTime() + 3 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["social"],
  },
  {
    id: "t6",
    content: "Set up Shopify dev store for Luma migration",
    project_name: "Luma Skincare",
    client_id: "c4",
    priority: 3,
    due: {
      date: new Date(today.getTime() + 1 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["dev"],
  },
  {
    id: "t7",
    content: "Invoice Bolt Fitness — milestone 2",
    project_name: "Bolt Fitness Co",
    client_id: "c2",
    priority: 4,
    due: {
      date: new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["billing"],
  },
  {
    id: "t8",
    content: "Update portfolio with WaveRider case study",
    project_name: "Internal",
    client_id: null,
    priority: 1,
    due: {
      date: new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["marketing"],
  },
  {
    id: "t9",
    content: "Prepare TerraVault proposal deck",
    project_name: "TerraVault Storage",
    client_id: "c6",
    priority: 3,
    due: {
      date: new Date(today.getTime() + 4 * 86400000).toISOString().split("T")[0],
    },
    is_completed: false,
    labels: ["proposals"],
  },
  {
    id: "t10",
    content: "QA check responsive layouts — Bolt Fitness site",
    project_name: "Bolt Fitness Co",
    client_id: "c2",
    priority: 3,
    due: { date: new Date(today).toISOString().split("T")[0] },
    is_completed: false,
    labels: ["dev", "qa"],
  },
];

export const mockEmails = [
  {
    id: "e1",
    from: "sarah@meridianhotels.com",
    from_name: "Sarah Chen",
    subject: "Re: Phase 2 Timeline",
    snippet:
      "Hi David, thanks for the update. The board is meeting Thursday to approve the budget. I'll have a definitive answer by Friday...",
    date: new Date(Date.now() - 1 * 3600000).toISOString(),
    is_read: false,
    is_important: true,
    labels: ["INBOX", "IMPORTANT"],
  },
  {
    id: "e2",
    from: "priya@lumaskincare.com",
    from_name: "Priya Patel",
    subject: "Product photos ready for upload",
    snippet:
      "Hey! The photographer finished the shoot yesterday. I've uploaded all the product photos to the shared Drive folder...",
    date: new Date(Date.now() - 3 * 3600000).toISOString(),
    is_read: false,
    is_important: true,
    labels: ["INBOX", "IMPORTANT"],
  },
  {
    id: "e3",
    from: "marcus@boltfitness.co",
    from_name: "Marcus Rivera",
    subject: "Logo feedback from the team",
    snippet:
      "David, we had a team meeting about the logo concepts. Everyone loves Option B but wants to see it in a darker colorway...",
    date: new Date(Date.now() - 8 * 3600000).toISOString(),
    is_read: true,
    is_important: false,
    labels: ["INBOX"],
  },
  {
    id: "e4",
    from: "jake@waveridersurfco.com",
    from_name: "Jake Thompson",
    subject: "Phase 2 interest",
    snippet:
      "Hey man! The website is killing it. We've seen a 40% increase in online orders since launch. Let's talk about adding the e-commerce...",
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    is_read: true,
    is_important: false,
    labels: ["INBOX"],
  },
  {
    id: "e5",
    from: "diana@pinnaclelegal.com",
    from_name: "Diana Reeves",
    subject: "Website Redesign Inquiry",
    snippet:
      "Hello, I found your agency through your website and I'm impressed with your portfolio. We're looking to redesign our firm's website...",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    is_read: true,
    is_important: false,
    labels: ["INBOX"],
  },
  {
    id: "e6",
    from: "noreply@stripe.com",
    from_name: "Stripe",
    subject: "Payment received: $4,500.00 from Meridian Hotels",
    snippet:
      "You've received a payment of $4,500.00 USD from Meridian Hotels Group for Invoice #INV-2024-089...",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_read: true,
    is_important: false,
    labels: ["INBOX"],
  },
];

export const mockContacts = [
  // Clients
  {
    id: "ct1", name: "Sarah Chen", first_name: "Sarah", last_name: "Chen",
    email: "sarah@meridianhotels.com", emails: [{ value: "sarah@meridianhotels.com", type: "work" }],
    phone: "(555) 234-5678", phones: [{ value: "(555) 234-5678", type: "work" }],
    organization: "Meridian Hotels Group", title: "VP Marketing",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct2", name: "Marcus Rivera", first_name: "Marcus", last_name: "Rivera",
    email: "marcus@boltfitness.co", emails: [{ value: "marcus@boltfitness.co", type: "work" }],
    phone: "(555) 876-5432", phones: [{ value: "(555) 876-5432", type: "work" }],
    organization: "Bolt Fitness Co", title: "Founder",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct3", name: "James Okoro", first_name: "James", last_name: "Okoro",
    email: "james@greenpathadvisory.com", emails: [{ value: "james@greenpathadvisory.com", type: "work" }],
    phone: "(555) 345-6789", phones: [{ value: "(555) 345-6789", type: "work" }],
    organization: "GreenPath Advisory", title: "CEO",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct4", name: "Priya Patel", first_name: "Priya", last_name: "Patel",
    email: "priya@lumaskincare.com", emails: [{ value: "priya@lumaskincare.com", type: "work" }],
    phone: "(555) 567-8901", phones: [{ value: "(555) 567-8901", type: "work" }],
    organization: "Luma Skincare", title: "Creative Director",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct5", name: "Dr. Amy Liu", first_name: "Amy", last_name: "Liu",
    email: "amy@northsidedental.com", emails: [{ value: "amy@northsidedental.com", type: "work" }],
    phone: "(555) 789-0123", phones: [{ value: "(555) 789-0123", type: "work" }],
    organization: "Northside Dental", title: "Owner",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct6", name: "Barry Abrams", first_name: "Barry", last_name: "Abrams",
    email: "barry@abramsconsulting.com", emails: [{ value: "barry@abramsconsulting.com", type: "work" }],
    phone: "(516) 555-1234", phones: [{ value: "(516) 555-1234", type: "mobile" }],
    organization: "Abrams Consulting", title: "Principal",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
  // Friends
  {
    id: "ct7", name: "Ely", first_name: "Ely", last_name: "",
    email: "ely@seoguy.com", emails: [{ value: "ely@seoguy.com", type: "work" }],
    phone: "(917) 555-2468", phones: [{ value: "(917) 555-2468", type: "mobile" }],
    organization: "SEO Specialist", title: "SEO Expert",
    photo_url: "", labels: [], category: "Friends", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct8", name: "Justin Shukat", first_name: "Justin", last_name: "Shukat",
    email: "justin@primarywave.com", emails: [{ value: "justin@primarywave.com", type: "work" }],
    phone: "(212) 555-3579", phones: [{ value: "(212) 555-3579", type: "mobile" }],
    organization: "Primary Wave", title: "",
    photo_url: "", labels: [], category: "Friends", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct9", name: "BJ", first_name: "BJ", last_name: "",
    email: "bj@retail.com", emails: [{ value: "bj@retail.com", type: "work" }],
    phone: "(516) 555-7890", phones: [{ value: "(516) 555-7890", type: "mobile" }],
    organization: "Retail Business", title: "Owner",
    photo_url: "", labels: [], category: "Friends", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct10", name: "Sharon & Ron", first_name: "Sharon", last_name: "",
    email: "sharon@example.com", emails: [{ value: "sharon@example.com", type: "home" }],
    phone: "(516) 555-4567", phones: [{ value: "(516) 555-4567", type: "mobile" }],
    organization: "", title: "",
    photo_url: "", labels: [], category: "Friends", source: "mock",
    synced_at: new Date().toISOString(),
  },
  // Family
  {
    id: "ct11", name: "Jill Oralevich", first_name: "Jill", last_name: "Oralevich",
    email: "jill@example.com", emails: [{ value: "jill@example.com", type: "home" }],
    phone: "(516) 555-0001", phones: [{ value: "(516) 555-0001", type: "mobile" }],
    organization: "", title: "",
    photo_url: "", labels: [], category: "Family", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct12", name: "Noah Oralevich", first_name: "Noah", last_name: "Oralevich",
    email: "noah@example.com", emails: [{ value: "noah@example.com", type: "home" }],
    phone: "(516) 555-0002", phones: [{ value: "(516) 555-0002", type: "mobile" }],
    organization: "Chimera Securities", title: "",
    photo_url: "", labels: [], category: "Family", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct13", name: "Ben Oralevich", first_name: "Ben", last_name: "Oralevich",
    email: "ben@tulane.edu", emails: [{ value: "ben@tulane.edu", type: "school" }],
    phone: "(516) 555-0003", phones: [{ value: "(516) 555-0003", type: "mobile" }],
    organization: "Tulane University", title: "Student",
    photo_url: "", labels: [], category: "Family", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct14", name: "Mickey Oralevich", first_name: "Mickey", last_name: "Oralevich",
    email: "mickey@pinterest.com", emails: [{ value: "mickey@pinterest.com", type: "work" }],
    phone: "(650) 555-0004", phones: [{ value: "(650) 555-0004", type: "mobile" }],
    organization: "Pinterest", title: "",
    photo_url: "", labels: [], category: "Family", source: "mock",
    synced_at: new Date().toISOString(),
  },
  // Vendors
  {
    id: "ct15", name: "Arnab", first_name: "Arnab", last_name: "",
    email: "arnab@xcloud.host", emails: [{ value: "arnab@xcloud.host", type: "work" }],
    phone: "", phones: [],
    organization: "XCloud", title: "Server Admin",
    photo_url: "", labels: [], category: "Vendors", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct16", name: "Shamim", first_name: "Shamim", last_name: "",
    email: "shamim@dev.com", emails: [{ value: "shamim@dev.com", type: "work" }],
    phone: "", phones: [],
    organization: "WordPress Developer", title: "Developer",
    photo_url: "", labels: [], category: "Vendors", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct17", name: "Tibi", first_name: "Tibi", last_name: "",
    email: "tibi@design.com", emails: [{ value: "tibi@design.com", type: "work" }],
    phone: "", phones: [],
    organization: "Graphic Designer", title: "Designer",
    photo_url: "", labels: [], category: "Vendors", source: "mock",
    synced_at: new Date().toISOString(),
  },
  // Other
  {
    id: "ct18", name: "Michael Cohen", first_name: "Michael", last_name: "Cohen",
    email: "michael@stackhaus.ai", emails: [{ value: "michael@stackhaus.ai", type: "work" }],
    phone: "(212) 555-8888", phones: [{ value: "(212) 555-8888", type: "mobile" }],
    organization: "StackHaus.ai", title: "Co-Founder",
    photo_url: "", labels: [], category: "Other", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct19", name: "Cindy Margolis", first_name: "Cindy", last_name: "Margolis",
    email: "cindy@cooperriver.ai", emails: [{ value: "cindy@cooperriver.ai", type: "work" }],
    phone: "", phones: [],
    organization: "Cooper River", title: "Chief of Staff",
    photo_url: "", labels: [], category: "Other", source: "mock",
    synced_at: new Date().toISOString(),
  },
  {
    id: "ct20", name: "Diana Reeves", first_name: "Diana", last_name: "Reeves",
    email: "diana@pinnaclelegal.com", emails: [{ value: "diana@pinnaclelegal.com", type: "work" }],
    phone: "(555) 456-7890", phones: [{ value: "(555) 456-7890", type: "work" }],
    organization: "Pinnacle Legal Group", title: "Partner",
    photo_url: "", labels: [], category: "Clients", source: "mock",
    synced_at: new Date().toISOString(),
  },
];

export const mockEvents = [
  {
    id: "ev1",
    summary: "Luma Skincare — Wireframe Review",
    start: {
      dateTime: new Date(
        today.getTime() + 10 * 3600000
      ).toISOString(),
    },
    end: {
      dateTime: new Date(
        today.getTime() + 11 * 3600000
      ).toISOString(),
    },
    attendees: [{ email: "priya@lumaskincare.com" }],
    location: "Google Meet",
  },
  {
    id: "ev2",
    summary: "Bolt Fitness — Logo Presentation",
    start: {
      dateTime: new Date(
        today.getTime() + 14 * 3600000
      ).toISOString(),
    },
    end: {
      dateTime: new Date(
        today.getTime() + 15 * 3600000
      ).toISOString(),
    },
    attendees: [{ email: "marcus@boltfitness.co" }],
    location: "Zoom",
  },
  {
    id: "ev3",
    summary: "GreenPath — Monthly Check-in",
    start: {
      dateTime: new Date(
        today.getTime() + 86400000 + 9 * 3600000
      ).toISOString(),
    },
    end: {
      dateTime: new Date(
        today.getTime() + 86400000 + 9.5 * 3600000
      ).toISOString(),
    },
    attendees: [{ email: "james@greenpathadvisory.com" }],
    location: "Phone call",
  },
  {
    id: "ev4",
    summary: "Internal — Weekly Planning",
    start: {
      dateTime: new Date(
        today.getTime() + 86400000 + 13 * 3600000
      ).toISOString(),
    },
    end: {
      dateTime: new Date(
        today.getTime() + 86400000 + 14 * 3600000
      ).toISOString(),
    },
    attendees: [],
    location: "Office",
  },
  {
    id: "ev5",
    summary: "Meridian Hotels — Phase 2 Kickoff",
    start: {
      dateTime: new Date(
        today.getTime() + 3 * 86400000 + 11 * 3600000
      ).toISOString(),
    },
    end: {
      dateTime: new Date(
        today.getTime() + 3 * 86400000 + 12.5 * 3600000
      ).toISOString(),
    },
    attendees: [{ email: "sarah@meridianhotels.com" }],
    location: "Google Meet",
  },
];

export const mockTeam = [
  {
    id: "a1",
    name: "David Oralevich",
    role: "Owner / Creative Director",
    avatar: "DO",
    status: "active",
    current_tasks: [
      "Luma Skincare wireframes",
      "Bolt Fitness logo presentation",
    ],
    active_clients: ["Luma Skincare", "Bolt Fitness Co", "Meridian Hotels Group"],
  },
  {
    id: "a2",
    name: "Donna AI",
    role: "AI Agent — Operations",
    avatar: "DA",
    status: "active",
    current_tasks: [
      "Client follow-up reminders",
      "Invoice tracking",
      "Email triage",
    ],
    active_clients: ["All clients"],
  },
];
