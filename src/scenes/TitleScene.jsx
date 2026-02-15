import { useState, useEffect } from "react";

const SUBTITLE_TEXT = "An AI-Powered RPG where quests, monsters, combat narration, and monster portraits are all generated in real-time by artificial intelligence.";

const TECH_TAGS = [
  "Claude Sonnet 4.5 — Quest & Zone Generation",
  "Claude Haiku 4.5 — Combat Narration",
  "GPT Image 1 — Monster Portraits",
  "React + Vite — Frontend",
];

export default function TitleScene({ onStart }) {
  const [typedText, setTypedText] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [flickerClass, setFlickerClass] = useState("");

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < SUBTITLE_TEXT.length) {
        setTypedText(SUBTITLE_TEXT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowTags(true), 300);
        setTimeout(() => setShowPrompt(true), 800);
      }
    }, 25);
    return () => clearInterval(interval);
  }, []);

  // Flicker effect on prompt
  useEffect(() => {
    if (!showPrompt) return;
    const interval = setInterval(() => {
      setFlickerClass((prev) => (prev === "" ? "prompt-dim" : ""));
    }, 800);
    return () => clearInterval(interval);
  }, [showPrompt]);

  return (
    <div className="title-container" onClick={onStart}>
      {/* Ambient particles */}
      <div className="title-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="title-particle"
            style={{
              left: `${8 + Math.random() * 84}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              opacity: 0.15 + Math.random() * 0.25,
            }}
          />
        ))}
      </div>

      {/* Guild emblem */}
      <div className="title-emblem">⚔</div>

      {/* Title */}
      <h1 className="title-main">
        <span className="title-the">The</span>
        <span className="title-name">Ash Guild</span>
      </h1>

      <div className="title-location">Mercenaries of Ashburg</div>

      {/* Typewriter subtitle */}
      <p className="title-subtitle">
        {typedText}
        <span className="title-cursor">|</span>
      </p>

      {/* Tech tags */}
      {showTags && (
        <div className="title-tags">
          {TECH_TAGS.map((tag, i) => (
            <span key={i} className="title-tag" style={{ animationDelay: `${i * 0.12}s` }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Start prompt */}
      {showPrompt && (
        <div className={`title-prompt ${flickerClass}`}>
          Press [E] or click to enter the guild
        </div>
      )}

      {/* Credits */}
      <div className="title-credits">
        A prompt engineering showcase by Cyprien
      </div>
    </div>
  );
}
