const OPENAI_URL = "https://api.openai.com/v1/images/generations";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(200).json({ url: null, error: "OpenAI key not configured" });

  const { monsterName, monsterDescription, biome } = req.body;
  if (!monsterName) return res.status(400).json({ error: "Missing monsterName" });

  const prompt = `Pixel art RPG monster portrait on a dark transparent background. Style: 16-bit SNES era, dark medieval fantasy. The creature is "${monsterName}": ${monsterDescription || "a hostile creature"}. Setting: ${biome || "dark dungeon"}. Front-facing bust portrait, menacing expression, detailed pixel shading, no text, no UI elements.`;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "low",
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI error:", data.error);
      return res.status(200).json({ url: null, error: data.error.message });
    }

    // gpt-image-1 returns base64 by default
    const imageData = data.data?.[0]?.b64_json;
    if (imageData) {
      return res.status(200).json({ url: `data:image/png;base64,${imageData}` });
    }

    // Fallback: URL format
    const imageUrl = data.data?.[0]?.url;
    return res.status(200).json({ url: imageUrl || null });
  } catch (err) {
    console.error("Image gen failed:", err);
    return res.status(200).json({ url: null, error: err.message });
  }
}
