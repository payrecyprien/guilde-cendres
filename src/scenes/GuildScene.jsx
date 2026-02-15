import { useMemo } from "react";
import { TILE_SIZE, T } from "../data/constants";
import { GUILD_MAP, NPCS } from "../data/guild";
import Tile from "../components/Tile";
import NPCSprite from "../components/NPCSprite";

export default function GuildScene({ highlightedNPC }) {
  // Precompute torch positions once
  const torchPositions = useMemo(() => {
    const positions = [];
    GUILD_MAP.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === T.TORCH) positions.push({ x, y });
      });
    });
    return positions;
  }, []);

  return (
    <>
      {/* Torch ambient lighting */}
      {torchPositions.map((t, i) => (
        <div
          key={`glow-${i}`}
          className="torch-glow"
          style={{
            left: t.x * TILE_SIZE - 60,
            top: t.y * TILE_SIZE - 20,
            width: TILE_SIZE + 120,
            height: TILE_SIZE + 100,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Tiles */}
      {GUILD_MAP.map((row, y) =>
        row.map((tile, x) => (
          <Tile key={`${x}-${y}`} type={tile} x={x} y={y} />
        ))
      )}

      {/* NPCs */}
      {NPCS.map((npc) => (
        <NPCSprite
          key={npc.id}
          npc={npc}
          isHighlighted={highlightedNPC?.id === npc.id}
        />
      ))}
    </>
  );
}
