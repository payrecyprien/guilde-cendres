const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const BIOMES = {
  brumesombre: { name: "Forêt de Brumesombre", floor: "herbe", walls: "arbres", obstacle: "buissons épais" },
  ruines_nord: { name: "Ruines du Nord", floor: "dalles fissurées", walls: "murs effondrés", obstacle: "gravats" },
  mine: { name: "Mine abandonnée", floor: "roche", walls: "parois rocheuses", obstacle: "éboulis" },
  marais: { name: "Marais de Valtorve", floor: "terre boueuse", walls: "eau profonde", obstacle: "roseaux" },
  route_commerce: { name: "Route commerciale", floor: "chemin de terre", walls: "rochers", obstacle: "chariots brisés" },
  village_est: { name: "Village de l'Est", floor: "pavés", walls: "bâtiments", obstacle: "étals renversés" },
};

function buildPrompt(quest) {
  const biome = BIOMES[quest.location] || BIOMES.brumesombre;

  return `Tu es un level designer de RPG. Tu génères des zones d'exploration pour un jeu tile-based.

## CONTEXTE
Quête : "${quest.title}"
${quest.description}
Lieu : ${biome.name}
Type : ${quest.type}
Difficulté : ${quest.difficulty}/5

## RÈGLES DE LA GRILLE
- La grille fait exactement 14 colonnes × 10 lignes
- Codes tiles : 0 = sol (${biome.floor}), 1 = mur/infranchissable (${biome.walls}), 2 = obstacle décoratif (${biome.obstacle}), 3 = entrée (1 seule, en bas), 4 = objectif (1 seul)
- Le contour (première/dernière ligne et colonne) DOIT être des murs (1), sauf l'entrée (3) en bas
- L'entrée (3) est au milieu de la dernière ligne
- L'objectif (4) est dans la moitié haute de la carte
- Laisse des chemins praticables entre l'entrée et l'objectif
- Place quelques obstacles (2) pour créer un parcours intéressant, pas un couloir vide
- Le sol (0) doit être la majorité des tiles intérieures

## MONSTRES
- Génère TOUJOURS entre 2 et 3 monstres, quel que soit le type de quête
- Chaque monstre a une position (x, y) sur une case de sol (0)
- Les monstres ne doivent PAS être sur l'entrée, l'objectif, ou un mur
- Nomme-les de façon originale (pas de "loup géant" ou "squelette" générique)

## FORMAT (JSON strict, rien d'autre)
{
  "grid": [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ...10 lignes de 14 colonnes...
  ],
  "monsters": [
    {
      "name": "Nom unique",
      "x": 5,
      "y": 4,
      "hp": 30,
      "atk": 6,
      "def": 2,
      "xp": 12,
      "gold": 8,
      "description": "courte description (1 phrase)"
    }
  ],
  "ambiance": "1 phrase décrivant l'atmosphère du lieu"
}`;
}

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

// Validate and fix common grid issues
function validateGrid(grid) {
  if (!grid || !Array.isArray(grid)) return null;

  // Ensure exactly 10 rows
  while (grid.length < 10) grid.push(new Array(14).fill(1));
  grid = grid.slice(0, 10);

  // Ensure exactly 14 columns per row
  grid = grid.map((row) => {
    if (!Array.isArray(row)) return new Array(14).fill(1);
    while (row.length < 14) row.push(1);
    return row.slice(0, 14);
  });

  // Ensure borders are walls
  for (let x = 0; x < 14; x++) {
    grid[0][x] = 1;
    if (x !== 6 && x !== 7) grid[9][x] = 1;
  }
  for (let y = 0; y < 10; y++) {
    grid[y][0] = 1;
    grid[y][13] = 1;
  }

  // Ensure entry exists
  grid[9][6] = 3;
  grid[9][7] = 3;

  // Ensure at least one objective exists
  let hasObjective = false;
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 14; x++) {
      if (grid[y][x] === 4) hasObjective = true;
    }
  }
  if (!hasObjective) {
    // Place objective in upper area
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 13; x++) {
        if (grid[y][x] === 0) {
          grid[y][x] = 4;
          hasObjective = true;
          break;
        }
      }
      if (hasObjective) break;
    }
  }

  return grid;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { quest } = req.body;
  if (!quest) return res.status(400).json({ error: "Missing quest" });

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
        max_tokens: 1200,
        temperature: 0.85,
        system: buildPrompt(quest),
        messages: [{ role: "user", content: "Génère la zone d'exploration." }],
      }),
    });

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";
    const zone = parseJSON(rawText);

    if (!zone || !zone.grid) {
      return res.status(200).json({ error: "Zone parsing failed", raw: rawText });
    }

    zone.grid = validateGrid(zone.grid);

    // Validate monster positions
    if (zone.monsters) {
      zone.monsters = zone.monsters.filter((m) => {
        const tile = zone.grid[m.y]?.[m.x];
        return tile === 0 && m.x > 0 && m.x < 13 && m.y > 0 && m.y < 9;
      });
    }

    // Fallback: ensure at least 2 monsters
    if (!zone.monsters || zone.monsters.length < 2) {
      const fallbackMonsters = [];
      for (let y = 2; y < 8 && fallbackMonsters.length < 2; y++) {
        for (let x = 2; x < 12 && fallbackMonsters.length < 2; x++) {
          if (zone.grid[y][x] === 0) {
            const existing = (zone.monsters || []).some((m) => m.x === x && m.y === y);
            if (!existing) {
              fallbackMonsters.push({
                name: fallbackMonsters.length === 0 ? "Rôdeur des ombres" : "Charognard",
                x, y, hp: 25 + Math.floor(Math.random() * 15),
                atk: 4 + Math.floor(Math.random() * 3),
                def: 1 + Math.floor(Math.random() * 2),
                xp: 10, gold: 8,
                description: "Une créature hostile rôde dans la zone.",
              });
            }
          }
        }
      }
      zone.monsters = [...(zone.monsters || []), ...fallbackMonsters];
    }

    return res.status(200).json(zone);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
