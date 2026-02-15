import { useState, useCallback } from "react";

/**
 * Hook for managing step-based dialogue.
 * Supports: text, loading, choice steps.
 */
export default function useDialogue() {
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = steps[stepIndex] || null;
  const isOpen = steps.length > 0;

  const open = useCallback((newSteps) => {
    setSteps(newSteps);
    setStepIndex(0);
  }, []);

  const close = useCallback(() => {
    setSteps([]);
    setStepIndex(0);
  }, []);

  const advance = useCallback(() => {
    if (!isOpen) return false;
    if (currentStep?.type === "choice" || currentStep?.type === "loading") return false;
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return true;
    }
    close();
    return true;
  }, [isOpen, currentStep, stepIndex, steps.length, close]);

  // Replace all steps (useful when loading finishes)
  const replaceSteps = useCallback((newSteps, newIndex = 0) => {
    setSteps(newSteps);
    setStepIndex(newIndex);
  }, []);

  // Update a single step in-place (for async AI greeting replacement)
  const updateStep = useCallback((index, newStep) => {
    setSteps((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const copy = [...prev];
      copy[index] = newStep;
      return copy;
    });
  }, []);

  // Get a step by index (for preserving AI-replaced greetings)
  const getStep = useCallback((index) => steps[index] || null, [steps]);

  return { steps, stepIndex, currentStep, isOpen, open, close, advance, replaceSteps, updateStep, getStep };
}
