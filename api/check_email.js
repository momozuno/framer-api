// File: api/check_email.js

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ authorized: false });
    }

    // ─── ACTIVE CAMPAIGN SETTINGS ───────────────────────
    const API_URL = "https://unicornlabs.api-us1.com";
    const API_KEY =
      "2573f43c58f048db397fbf3f8525d97affbddd4beb03fa452247b2190a952fc1024c23b9";

    // 💡 List of allowed tag IDs
    const ALLOWED_TAGS = ["159", "161", "153", "155", "148", "167", "166"];
    // ────────────────────────────────────────────────────

    // 1. Get contact by email
    const contactRes = await fetch(
      `${API_URL}/api/3/contacts?email=${encodeURIComponent(email)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Api-Token": API_KEY,
        },
      }
    );
    const contactData = await contactRes.json();

    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(200).json({ authorized: false });
    }

    const contactId = contactData.contacts[0].id;

    // 2. Get contact's tags
    const tagsRes = await fetch(
      `${API_URL}/api/3/contacts/${contactId}/contactTags`,
      {
        headers: {
          "Content-Type": "application/json",
          "Api-Token": API_KEY,
        },
      }
    );
    const tagsData = await tagsRes.json();

    const tagIds = Array.isArray(tagsData.contactTags)
      ? tagsData.contactTags.map((ct) => String(ct.tag))
      : [];

    // Check if any of the contact's tags are included in the ALLOWED_TAGS
    const authorized = tagIds.some((tag) => ALLOWED_TAGS.includes(tag));

    return res.status(200).json({ authorized, tags: tagIds });
  } catch (error) {
    console.error("Error in /api/check_email:", error);
    return res.status(500).json({ authorized: false });
  }
}
