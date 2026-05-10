import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

const INTAKE_KEY = process.env.INTAKE_KEY || "";
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || "";
const MANDRILL_KEY = process.env.MANDRILL_API_KEY || "";

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("Telegram send failed:", err.message);
  }
}

async function sendEmail(to, toName, subject, html) {
  if (!MANDRILL_KEY) return;
  try {
    await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: MANDRILL_KEY,
        message: {
          from_email: "daveo@designsbydaveo.com",
          from_name: "Designs By Dave O",
          to: [{ email: to, name: toName, type: "to" }],
          bcc_address: "daveo@designsbydaveo.com",
          subject,
          html,
          important: true,
        },
      }),
    });
  } catch (err) {
    console.error("Mandrill send failed:", err.message);
  }
}

router.post("/", async (req, res) => {
  const key = req.headers["x-intake-key"] || "";
  if (!INTAKE_KEY || key !== INTAKE_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { source = "unknown", email, fields = {} } = req.body || {};
  const { name, phone, company, service, message, budget } = fields;

  // Save lead to Supabase clients table
  let clientId = null;
  if (supabase) {
    try {
      const notes = [
        service && `Service: ${service}`,
        budget && `Budget: ${budget}`,
        message && `Message: ${message}`,
      ]
        .filter(Boolean)
        .join("\n");

      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: company || name || email,
          contact_name: name,
          contact_email: email,
          contact_phone: phone || null,
          referral_source: source,
          status: "lead",
          type: "project",
          notes,
          last_activity: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Supabase insert failed:", error.message);
      } else {
        clientId = data?.id;
      }
    } catch (err) {
      console.error("Supabase error:", err.message);
    }
  }

  // Telegram alert
  const tgText = [
    `<b>New DBDO Lead</b>`,
    `Name: ${name || "—"}`,
    `Email: ${email || "—"}`,
    `Phone: ${phone || "—"}`,
    `Company: ${company || "—"}`,
    `Service: ${service || "—"}`,
    `Budget: ${budget || "—"}`,
    message && `\n${message}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegram(tgText);

  // Email notification to David
  if (name && email) {
    const html = `
      <h2>New Contact Form Submission — designsbydaveo.com</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Name</b></td><td>${name}</td></tr>
        <tr><td><b>Email</b></td><td>${email}</td></tr>
        <tr><td><b>Phone</b></td><td>${phone || "—"}</td></tr>
        <tr><td><b>Company</b></td><td>${company || "—"}</td></tr>
        <tr><td><b>Service</b></td><td>${service || "—"}</td></tr>
        <tr><td><b>Budget</b></td><td>${budget || "—"}</td></tr>
        <tr><td><b>Message</b></td><td>${message || "—"}</td></tr>
      </table>
    `;
    await sendEmail(
      "daveo@designsbydaveo.com",
      "Dave O",
      `New Lead: ${name}${company ? ` — ${company}` : ""}`,
      html
    );
  }

  console.log(`[intake] ${source} | ${name} <${email}> | crm_id=${clientId}`);
  res.json({ ok: true });
});

export default router;
