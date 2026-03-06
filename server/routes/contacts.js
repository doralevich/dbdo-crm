import { Router } from "express";
import { getGoogleContacts } from "../lib/google.js";
import { supabase } from "../lib/supabase.js";
import { syncContacts, getLastContactsSyncTime } from "../lib/sync-contacts.js";
import { mockContacts } from "../lib/mock-data.js";

const router = Router();

const CATEGORY_RULES = {
  Clients: {
    orgKeywords: [
      "design", "web", "marketing", "agency", "media", "consulting",
      "solutions", "digital", "creative", "studio", "brand",
    ],
    labelKeywords: ["client", "customer", "business"],
  },
  Vendors: {
    orgKeywords: [
      "hosting", "domain", "server", "cloud", "software", "tech",
      "print", "supply", "service", "support", "insurance", "bank",
      "accounting", "legal", "law",
    ],
    labelKeywords: ["vendor", "supplier", "partner"],
  },
  Family: {
    labelKeywords: ["family", "relative"],
    namePatterns: ["oralevich", "jill", "noah", "ben"],
  },
  Friends: {
    labelKeywords: ["friend", "personal", "social"],
  },
};

function categorizeContact(contact) {
  const name = (contact.name || "").toLowerCase();
  const org = (contact.company || contact.organization || "").toLowerCase();
  const email = (contact.email || "").toLowerCase();

  if (CATEGORY_RULES.Family.namePatterns?.some((p) => name.includes(p))) {
    return "Family";
  }

  if (org) {
    for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
      if (rules.orgKeywords?.some((kw) => org.includes(kw))) {
        return category;
      }
    }
  }

  if (email) {
    const domain = email.split("@")[1] || "";
    if (["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "me.com"].includes(domain)) {
      return "Other";
    }
    return "Clients";
  }

  return "Other";
}

function normalizeGoogleContact(person) {
  const names = person.names?.[0] || {};
  const emails = person.emailAddresses || [];
  const phones = person.phoneNumbers || [];
  const orgs = person.organizations || [];
  const photos = person.photos || [];
  const memberships = person.memberships || [];

  const labels = memberships
    .filter((m) => m.contactGroupMembership?.contactGroupResourceName)
    .map((m) => m.contactGroupMembership.contactGroupResourceName.replace("contactGroups/", ""));

  const contact = {
    id: person.resourceName?.replace("people/", "") || "",
    name: names.displayName || "",
    first_name: names.givenName || "",
    last_name: names.familyName || "",
    email: emails[0]?.value || "",
    emails: emails.map((e) => ({ value: e.value, type: e.type || "other" })),
    phone: phones[0]?.value || "",
    phones: phones.map((p) => ({ value: p.value, type: p.type || "other" })),
    organization: orgs[0]?.name || "",
    title: orgs[0]?.title || "",
    photo_url: photos[0]?.url || "",
    labels,
    source: "google",
    synced_at: new Date().toISOString(),
  };

  contact.category = categorizeContact(contact);
  return contact;
}

// GET /api/contacts
router.get("/", async (req, res) => {
  try {
    const { category, q } = req.query;

    // Try Supabase cached contacts first
    if (supabase) {
      let query = supabase.from("contacts").select("*").order("name");

      if (q) {
        query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);
      }

      const { data: dbContacts, error } = await query;

      if (!error && dbContacts && dbContacts.length > 0) {
        const normalized = dbContacts.map((c) => ({
          id: c.google_resource_name?.replace("people/", "") || c.id,
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          organization: c.company || "",
          company: c.company || "",
          title: c.title || "",
          photo_url: c.photo_url || "",
          client_id: c.client_id,
          category: categorizeContact(c),
          source: "supabase",
          synced_at: c.synced_at,
        }));

        let filtered = normalized;
        if (category && category !== "all") {
          filtered = filtered.filter(
            (c) => c.category.toLowerCase() === category.toLowerCase()
          );
        }

        const stats = {
          total: normalized.length,
          clients: normalized.filter((c) => c.category === "Clients").length,
          friends: normalized.filter((c) => c.category === "Friends").length,
          family: normalized.filter((c) => c.category === "Family").length,
          vendors: normalized.filter((c) => c.category === "Vendors").length,
          other: normalized.filter((c) => c.category === "Other").length,
        };

        return res.json({
          contacts: filtered,
          stats,
          source: "supabase",
          last_sync: getLastContactsSyncTime(),
        });
      }
    }

    // Fall back to live Google API
    const contacts = await getGoogleContacts();

    if (contacts) {
      const normalized = contacts
        .map(normalizeGoogleContact)
        .filter((c) => c.name)
        .sort((a, b) => a.name.localeCompare(b.name));

      let filtered = normalized;

      if (category && category !== "all") {
        filtered = filtered.filter(
          (c) => c.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (q) {
        const search = q.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search) ||
            c.organization.toLowerCase().includes(search) ||
            c.phone.includes(search)
        );
      }

      const stats = {
        total: normalized.length,
        clients: normalized.filter((c) => c.category === "Clients").length,
        friends: normalized.filter((c) => c.category === "Friends").length,
        family: normalized.filter((c) => c.category === "Family").length,
        vendors: normalized.filter((c) => c.category === "Vendors").length,
        other: normalized.filter((c) => c.category === "Other").length,
      };

      return res.json({ contacts: filtered, stats, source: "google" });
    }

    // Fall back to mock data
    let filtered = mockContacts;

    if (category && category !== "all") {
      filtered = filtered.filter(
        (c) => c.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (q) {
      const search = q.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.organization || "").toLowerCase().includes(search) ||
          c.phone.includes(search)
      );
    }

    const stats = {
      total: mockContacts.length,
      clients: mockContacts.filter((c) => c.category === "Clients").length,
      friends: mockContacts.filter((c) => c.category === "Friends").length,
      family: mockContacts.filter((c) => c.category === "Family").length,
      vendors: mockContacts.filter((c) => c.category === "Vendors").length,
      other: mockContacts.filter((c) => c.category === "Other").length,
    };

    res.json({ contacts: filtered, stats, source: "mock" });
  } catch (err) {
    console.error("Contacts error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/contacts/sync — trigger manual sync
router.get("/sync", async (req, res) => {
  try {
    const result = await syncContacts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/contacts/:id/category
router.patch("/:id/category", async (req, res) => {
  const { category } = req.body;
  const validCategories = ["Clients", "Friends", "Family", "Vendors", "Other"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
  }
  res.json({ id: req.params.id, category, updated: true });
});

export default router;
