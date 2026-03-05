import { Router } from "express";
import { getGoogleContacts, refreshGoogleToken } from "../lib/google.js";
import { mockContacts } from "../lib/mock-data.js";

const router = Router();

// Category keywords for auto-categorization
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
    // Will also match known family names from MEMORY.md
    namePatterns: [
      "oralevich", "jill", "noah", "ben",
    ],
  },
  Friends: {
    labelKeywords: ["friend", "personal", "social"],
  },
};

function categorizeContact(contact) {
  const name = (contact.name || "").toLowerCase();
  const org = (contact.organization || "").toLowerCase();
  const labels = (contact.labels || []).map((l) => l.toLowerCase());
  const email = (contact.email || "").toLowerCase();

  // Check Google contact group memberships first
  for (const label of labels) {
    for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
      if (rules.labelKeywords?.some((kw) => label.includes(kw))) {
        return category;
      }
    }
  }

  // Check family name patterns
  if (CATEGORY_RULES.Family.namePatterns?.some((p) => name.includes(p))) {
    return "Family";
  }

  // Check organization keywords
  if (org) {
    for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
      if (rules.orgKeywords?.some((kw) => org.includes(kw))) {
        return category;
      }
    }
  }

  // Check email domain patterns
  if (email) {
    const domain = email.split("@")[1] || "";
    // Common personal email domains -> Friends or Other
    if (["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "me.com"].includes(domain)) {
      // Personal email — could be friend or family, default to Other unless other signals
      return "Other";
    }
    // Business domain -> likely Client or Vendor
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
    .map((m) => {
      const name = m.contactGroupMembership.contactGroupResourceName;
      return name.replace("contactGroups/", "");
    });

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
    const contacts = await getGoogleContacts();

    if (contacts) {
      const normalized = contacts
        .map(normalizeGoogleContact)
        .filter((c) => c.name) // Skip contacts without names
        .sort((a, b) => a.name.localeCompare(b.name));

      // Apply category filter
      const { category, q } = req.query;
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

      // Summary stats
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
    const { category, q } = req.query;
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
          c.organization.toLowerCase().includes(search) ||
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

// PATCH /api/contacts/:id/category — manually recategorize a contact
router.patch("/:id/category", async (req, res) => {
  const { category } = req.body;
  const validCategories = ["Clients", "Friends", "Family", "Vendors", "Other"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
  }
  // In a full implementation, this would persist to Supabase
  // For now, acknowledge the change
  res.json({ id: req.params.id, category, updated: true });
});

export default router;
