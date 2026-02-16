const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { system, message, temperature: clientTemp } = req.body;

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        temperature: clientTemp ?? 0.9,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    // Strip any markdown/quotes, just get raw dialogue
    const clean = text.replace(/^["']|["']$/g, "").trim();
    return res.status(200).json({ text: clean });
  } catch (err) {
    return res.status(200).json({ text: null });
  }
}
