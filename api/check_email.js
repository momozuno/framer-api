// File: api/check_email.js
// ─────────────────────────────────────────────────────
// Allows CORS for Framer app and checks multiple AC tags

export default async function handler(req, res) {
  // 1) CORS Preflight handling
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  // Set CORS headers for actual requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2) Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 3) Extract email from body
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ authorized: false });
    }

    // 4) ActiveCampaign credentials
    const API_URL = "https://unicornlabs.api-us1.com";
    const API_KEY =
      "2573f43c58f048db397fbf3f8525d97affbddd4beb03fa452247b2190a952fc1024c23b9";
    const ALLOWED_TAGS = ["159", "161", "153", "155", "148", "167", "166"];

    // 5) Look up contact by email
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

    // 6) Get contact's tags
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

    // 7) Check if user has any of the allowed tags
    const hasAuthorizedTag = Array.isArray(tagsData.contactTags)
      ? tagsData.contactTags.some((ct) =>
          ALLOWED_TAGS.includes(String(ct.tag))
        )
      : false;

    return res.status(200).json({ authorized: hasAuthorizedTag });
  } catch (error) {
    console.error("Error in /api/check_email:", error);
    return res.status(500).json({ authorized: false });
  }
}
