# The Ash Guild — AI-Powered RPG

**Portfolio project for Prompt Specialist position**
Live demo: [Vercel deployment URL]
Source code: [GitHub repository URL]

---

## What is it?

A fully playable tile-based RPG where every narrative element is generated in real-time by AI. Quests, exploration zones, combat narration, NPC dialogue, equipment crafting, and monster portraits are all produced dynamically — no pre-written content exists in the game beyond the world's foundational lore.

The game is built as a single-page React application with a retro 16-bit aesthetic. Players explore a guild hall, accept contracts from an AI-driven quest giver, venture into procedurally generated zones, fight monsters with narrated turn-based combat, collect materials, and forge unique equipment at the armorer.

---

## Prompt Engineering Highlights

This project demonstrates **six distinct prompt engineering patterns**, each solving a different generation challenge:

**1. Structured Narrative Generation (Claude Sonnet 4.5)**
The quest system produces complete, lore-consistent contracts with a single API call. The prompt defines Commander Varek's personality, enforces JSON output structure, and injects player context (level, stats, quest history) to avoid repetition and adapt difficulty. Each quest includes narrative intro, objectives, location mapping, rewards, moral dilemmas, and enemy hints — all coherent with the world of Ashburg.

**2. Procedural Level Design (Claude Sonnet 4.5)**
Zone generation translates a quest description into a playable 14×10 tile grid with valid pathfinding, biome-appropriate theming, and strategically placed monsters. The prompt encodes hard constraints (walkable paths, border walls, entry/objective placement) alongside creative freedom (obstacle layout, monster naming, atmospheric descriptions). The AI acts as a level designer operating within strict technical specifications.

**3. Real-Time Combat Narration (Claude Haiku 4.5)**
Each combat turn is narrated by a dedicated AI narrator that receives the full battle state (HP, stats, action chosen, monster context, location) and produces visceral, varied descriptions. Haiku was chosen over Sonnet specifically for speed (~1s vs ~3s), showing deliberate model selection based on the latency-quality tradeoff appropriate to real-time gameplay.

**4. Contextual NPC Dialogue (Claude Haiku 4.5)**
NPCs generate unique greetings every interaction based on the player's current state. The system fires the AI call in parallel with other operations (quest generation runs simultaneously with the greeting), so there is zero additional latency. A fixed fallback displays instantly and is seamlessly replaced when the AI responds — demonstrating graceful degradation patterns.

**5. AI-Driven Item Crafting (Claude Sonnet 4.5)**
Players collect biome-specific ingredients from defeated monsters and bring them to the armorer. The AI generates a unique piece of equipment from the ingredients provided — name, stats, and a description written in the NPC's voice. The prompt constrains stat bonuses proportionally to ingredient tier, preventing power creep while preserving creative freedom.

**6. Visual Asset Generation (GPT Image 1)**
Monster portraits are generated as pixel art in a consistent 16-bit SNES style. Portraits are pre-loaded asynchronously when a zone generates (not when combat starts), so they appear both on the exploration map and in the combat screen with no loading delay. The prompt enforces style consistency: "front-facing bust, dark medieval fantasy, menacing."

---

## Technical Architecture

**Frontend:** React 18 + Vite, no external UI framework. Custom tile engine, fog of war with radial gradients, CSS-only sprite animations, keyboard + future touch input.

**Backend:** Six Vercel serverless functions, each specialized for one AI task. All endpoints include JSON parsing with fallback responses — the game never crashes on an API failure.

**AI Models Used:**
- Claude Sonnet 4.5 — quest generation, zone design, item crafting (quality-critical, ~2-3s acceptable)
- Claude Haiku 4.5 — combat narration, NPC dialogue (speed-critical, ~1s target)
- GPT Image 1 — monster portraits (async, non-blocking)

**Cost per play session (~3 quests):** approximately $0.15
- Quest generation: ~$0.02/quest × 3
- Zone generation: ~$0.02/zone × 3
- Combat narration: ~$0.002/turn × ~8 turns
- NPC dialogue: ~$0.001/call × ~6 calls
- Monster portraits: $0.005/image × ~8 monsters
- Item crafting: ~$0.02/craft × ~1

---

## Key Design Decisions

**Graceful degradation everywhere.** Every AI call has a hardcoded fallback. If Sonnet is slow, the player sees a loading animation with in-character text. If image generation fails, an emoji sprite appears. If combat narration times out, a generic description plays. The game is always playable.

**Parallel async patterns.** NPC greetings generate in parallel with quest generation. Monster portraits generate in parallel with zone exploration. The player never waits for something that could load in the background.

**Model selection by constraint.** Sonnet for tasks where quality matters and 2-3 seconds are acceptable (quests, zones, crafting). Haiku for tasks where speed matters and brevity is fine (combat narration, NPC greetings). GPT Image 1 for visual assets where no text model can substitute.

**Prompt architecture.** A shared world context block is injected into all prompts for lore consistency. Each prompt is structured with role definition, rules/constraints, and strict output format. This mirrors production prompt engineering patterns used in game studios.

---

## Features Summary

- Title screen with animated tech stack showcase
- AI-generated quests with narrative intros, difficulty scaling, and moral dilemmas
- Procedurally generated exploration zones with biome theming and fog of war
- Turn-based combat with AI narration, damage variance, and flee mechanics
- AI-generated monster portraits (pixel art, pre-loaded on zone map)
- Contextual NPC dialogue that reacts to player state (HP, level, quest results)
- Ingredient drop system with biome-specific loot tables
- AI-powered equipment crafting through the armorer NPC
- Quest journal tracking completed contracts
- Shop system with potions and gear
- Keyboard controls (WASD/ZQSD + E to interact + J for journal)

---

## What This Demonstrates

For a Prompt Specialist role, this project shows:

1. **Prompt design for structured output** — Enforcing JSON schemas, controlling tone and length, injecting dynamic context
2. **Multi-model orchestration** — Choosing the right model for each task based on speed, cost, and quality requirements
3. **Production-grade error handling** — Every AI interaction has fallbacks, timeouts, and graceful degradation
4. **Async prompt patterns** — Parallel generation, non-blocking portrait loading, progressive UI updates
5. **Iterative prompt refinement** — Each prompt was tuned across multiple sessions for consistency and reliability
6. **Cross-model consistency** — Maintaining a coherent world and tone across Sonnet, Haiku, and GPT Image 1 outputs
7. **Cost awareness** — Deliberate model selection and token budgeting (~$0.15 per session)

---

*Built by Cyprien · React + Vite · Claude Sonnet & Haiku · GPT Image 1 · Deployed on Vercel*
