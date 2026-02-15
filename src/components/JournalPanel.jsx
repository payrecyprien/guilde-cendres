export default function JournalPanel({ quests, onClose }) {
  return (
    <div className="journal-overlay" onClick={onClose}>
      <div className="journal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="journal-header">
          <div className="journal-title">📜 Quest Journal</div>
          <div className="journal-close">[J] or [Esc] to close</div>
        </div>

        <div className="journal-body">
          {quests.length === 0 ? (
            <div className="journal-empty">
              No completed quests yet. Talk to Commander Varek for your first contract.
            </div>
          ) : (
            [...quests].reverse().map((quest, i) => (
              <div key={i} className="journal-entry">
                <div className="journal-entry-header">
                  <span className="journal-entry-title">✅ {quest.title}</span>
                  <span className="journal-entry-reward">
                    <span className="j-gold">+{quest.reward_gold} gold</span>
                    {" · "}
                    <span className="j-xp">+{quest.reward_xp} XP</span>
                  </span>
                </div>
                <div className="journal-entry-desc">{quest.description}</div>
                <div className="journal-entry-location">
                  📍 {quest.location_name || quest.location}
                  {quest.type && ` · ${quest.type}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
