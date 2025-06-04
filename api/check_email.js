// File: api/check_email.js

export default async function handler(req, res) {
  console.log("🚀 check_email handler invoked, method:", req.method);

  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ authorized: false });
    }

    // ───────────────────────────────────────────────────
    // 1) ACTIVE CAMPAIGN CREDENTIALS
    // ───────────────────────────────────────────────────
    const API_URL = "https://unicornlabs.api-us1.com";
    const API_KEY =
      "2573f43c58f048db397fbf3f8525d97affbddd4beb03fa452247b2190a952fc1024c23b9";
    const TAG_ID = "168";
    // ───────────────────────────────────────────────────

    // 2) Look up the contact by email
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

    // If no contact found, unauthorized
    if (!contactData.contacts || contactData.contacts.length === 0) {
      return res.status(200).json({ authorized: false });
    }

    // Grab that contact’s ID
    const contactId = contactData.contacts[0].id;

    // 3) Fetch that contact’s tags
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
