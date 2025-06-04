// File: api/check_email.js
// ─────────────────────────────────────────────────────
// This version adds CORS headers so the Framer site 
// (running at a different origin) can POST to it.

// No framework detected
// This is a pure Vercel Serverless Function.

export default async function handler(req, res) {
  // 1) CORS Preflight handling
  //    If the browser sends an OPTIONS request, we respond with
  //    the appropriate headers and a 204 status (no content).
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  // For all non-OPTIONS requests, we still need to allow our origin:
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 2) Only allow POST for the actual email check
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Expecting body: { email: "user@example.com" }
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ authorized: false });
    }

    // ──────────────────────────────────────────────────
    // 3) ACTIVE CAMPAIGN CREDENTIALS (YOUR EXACT VALUES)
    // ──────────────────────────────────────────────────
    const API_URL = "https://unicornlabs.api-us1.com";
    const API_KEY =
      "2573f43c58f048db397fbf3f8525d97affbddd4beb03fa452247b2190a952fc1024c23b9";
    const TAG_ID = "168";
    // ──────────────────────────────────────────────────

    // 4) Look up the contact by email
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

    // If no contact at all, unauthorized
    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(200).json({ authorized: false });
    }

    // Grab that contact’s ID
    const contactId = contactData.contacts[0].id;

    // 5) Fetch that contact’s tags
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

    // Check if any contactTags entry’s tag === TAG_ID
    const hasPurchasedTag = Array.isArray(tagsData.contactTags)
      ? tagsData.contactTags.some((ct) => String(ct.tag) === String(TAG_ID))
      : false;

    return res.status(200).json({ authorized: hasPurchasedTag });
  } catch (error) {
    console.error("Error in /api/check_email:", error);
    return res.status(500).json({ authorized: false });
  }
}
