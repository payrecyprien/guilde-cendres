const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

function parseJSON(text) {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

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
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 200,
        temperature: clientTemp ?? 0.8,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";
    const item = parseJSON(rawText);

    if (!item || !item.name || !item.stat) {
      return res.status(200).json({
        name: "Crude Alloy Blade",
        description: "*shrugs* Not my best work, but it'll cut.",
        stat: "atk",
        bonus: 2,
      });
    }

    // Clamp bonus
    item.bonus = Math.max(1, Math.min(6, item.bonus));
    return res.status(200).json(item);
  } catch (err) {
    return res.status(200).json({
      name: "Salvaged Edge",
      description: "*hammers it flat* Better than nothing.",
      stat: "atk",
      bonus: 1,
    });
  }
}
