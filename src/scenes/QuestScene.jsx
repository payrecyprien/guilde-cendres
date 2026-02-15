import ZoneTile from "../components/ZoneTile";
import MonsterSprite from "../components/MonsterSprite";

export default function QuestScene({ zoneData, zoneBiome, monsters, highlightedMonster }) {
  if (!zoneData || !zoneBiome) return null;

  return (
    <>
      {/* Fog overlay */}
      <div className="zone-fog" style={{ background: zoneBiome.fog }} />

      {/* Tiles */}
      {zoneData.grid.map((row, y) =>
        row.map((tile, x) => (
          <ZoneTile key={`z${x}-${y}`} type={tile} x={x} y={y} biome={zoneBiome} />
        ))
      )}

      {/* Monsters */}
      {monsters.map((m, i) => (
        <MonsterSprite
          key={`m${i}`}
          monster={m}
          isHighlighted={highlightedMonster?.x === m.x && highlightedMonster?.y === m.y}
        />
      ))}
    </>
  );
}
