import { TILE_SIZE } from "../data/constants";

export default function MonsterSprite({ monster, isHighlighted }) {
  return (
    <div
      className="monster-sprite"
      style={{
        left: monster.x * TILE_SIZE,
        top: monster.y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
      }}
    >
      <div className={`monster-body ${isHighlighted ? "monster-highlighted" : ""}`}>
        {/* Monster shape — menacing */}
        <div className="monster-head" />
        <div className="monster-torso">
          <span className="monster-icon">👹</span>
        </div>
      </div>

      {isHighlighted && (
        <div className="monster-name-tag">
          {monster.name}
          <span className="monster-hp-tag">❤ {monster.hp}</span>
        </div>
      )}
    </div>
  );
}
