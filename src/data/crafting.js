// ─── INGREDIENT TIERS & BIOME DROPS ───

export const INGREDIENTS = {
  // Tier 1 — common drops
  bone_shard: { name: "Bone Shard", icon: "🦴", tier: 1 },
  rough_hide: { name: "Rough Hide", icon: "🐾", tier: 1 },
  iron_chunk: { name: "Iron Chunk", icon: "⛏", tier: 1 },
  moss_clump: { name: "Moss Clump", icon: "🌿", tier: 1 },
  // Tier 2 — uncommon drops
  venom_sac: { name: "Venom Sac", icon: "🧪", tier: 2 },
  shadow_essence: { name: "Shadow Essence", icon: "🌑", tier: 2 },
  cursed_ore: { name: "Cursed Ore", icon: "💎", tier: 2 },
  spectral_dust: { name: "Spectral Dust", icon: "✨", tier: 2 },
};

// Which ingredients drop in each biome (weighted by tier)
export const BIOME_DROPS = {
  gloomhaze:      { common: ["rough_hide", "moss_clump"], rare: ["shadow_essence"] },
  northern_ruins: { common: ["bone_shard", "iron_chunk"], rare: ["spectral_dust"] },
  mine:           { common: ["iron_chunk", "bone_shard"], rare: ["cursed_ore"] },
  marshes:        { common: ["moss_clump", "rough_hide"], rare: ["venom_sac"] },
  trade_road:     { common: ["rough_hide", "iron_chunk"], rare: ["venom_sac"] },
  east_village:   { common: ["bone_shard", "moss_clump"], rare: ["spectral_dust"] },
};

/**
 * Roll a random ingredient drop for a given biome.
 * 70% common, 30% rare. Returns ingredient ID or null (20% no drop).
 */
export function rollDrop(biomeKey) {
  if (Math.random() < 0.2) return null; // 20% no drop

  const drops = BIOME_DROPS[biomeKey] || BIOME_DROPS.gloomhaze;
  const pool = Math.random() < 0.7 ? drops.common : drops.rare;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Max equipment slots for crafted items (prevents power creep)
 */
export const MAX_CRAFTED_SLOTS = 4;
