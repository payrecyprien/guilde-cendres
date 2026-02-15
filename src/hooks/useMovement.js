import { useState, useEffect, useCallback } from "react";
import { DIRECTIONS, KEY_MAP, INTERACT_KEYS } from "../data/constants";

/**
 * Hook for player movement and keyboard input.
 *
 * @param {Object} params
 * @param {Function} params.isWalkable - (x, y) => boolean
 * @param {Function} params.onInteract - called when player presses interact key
 * @param {boolean}  params.dialogueOpen - blocks movement when true
 * @param {Function} params.onDialogueAdvance - advance dialogue on E/Space
 * @param {Function} params.onDialogueClose - close dialogue on Escape
 * @param {Object}   params.dialogueStep - current dialogue step (for choice handling)
 * @param {Function} params.onChoice - (action) => void for choice buttons
 * @param {Object}   params.initialPos - { x, y }
 * @param {string}   params.initialFacing - "up"|"down"|"left"|"right"
 */
export default function useMovement({
  isWalkable,
  onInteract,
  dialogueOpen,
  onDialogueAdvance,
  onDialogueClose,
  dialogueStep,
  onChoice,
  initialPos = { x: 6, y: 7 },
  initialFacing = "up",
}) {
  const [pos, setPos] = useState(initialPos);
  const [facing, setFacing] = useState(initialFacing);

  // Allow external position resets (scene transitions)
  const resetPosition = useCallback((newPos, newFacing = "up") => {
    setPos(newPos);
    setFacing(newFacing);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      // ─── DIALOGUE MODE ───
      if (dialogueOpen) {
        if (INTERACT_KEYS.has(e.key)) {
          e.preventDefault();
          onDialogueAdvance?.();
        }
        if (e.key === "Escape" && dialogueStep?.type !== "loading") {
          onDialogueClose?.();
        }
        // Number keys for choices
        if (dialogueStep?.type === "choice" && dialogueStep.choices) {
          const num = parseInt(e.key);
          if (num >= 1 && num <= dialogueStep.choices.length) {
            e.preventDefault();
            onChoice?.(dialogueStep.choices[num - 1].action);
          }
        }
        return;
      }

      // ─── MOVEMENT ───
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        setFacing(dir);
        const [dx, dy] = DIRECTIONS[dir];
        setPos((prev) => {
          const nx = prev.x + dx;
          const ny = prev.y + dy;
          return isWalkable(nx, ny) ? { x: nx, y: ny } : prev;
        });
      }

      // ─── INTERACT ───
      if (INTERACT_KEYS.has(e.key)) {
        e.preventDefault();
        onInteract?.();
      }
    },
    [dialogueOpen, dialogueStep, isWalkable, onInteract, onDialogueAdvance, onDialogueClose, onChoice]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { pos, facing, setPos, setFacing, resetPosition };
}
