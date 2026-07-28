export type InteractionPhase = "available" | "holding" | "completed" | "cooldown" | "disabled";

export interface WorldInteractionState {
  objectId: string;
  definitionId: string;
  phase: InteractionPhase;
  progressSeconds: number;
  requiredSeconds: number;
  cooldownRemainingSeconds: number;
  completionCount: number;
}

export interface WorldInteractionDefinition {
  id: string;
  requiredSeconds: number;
  repeatable: boolean;
  cooldownSeconds: number;
  promptVerb: string;
  interruptOnDamage?: boolean;
  interruptOnShieldDamage?: boolean;
}

export interface WorldInteractionStepInput {
  state: WorldInteractionState;
  definition: WorldInteractionDefinition;
  distanceMetres: number;
  footprintMetres: number;
  interactHeld: boolean;
  interactPressed: boolean;
  interruptedByDamage?: boolean;
  interruptedByShieldDamage?: boolean;
  paused?: boolean;
  destroyed?: boolean;
  deltaSeconds: number;
}

export interface WorldInteractionCompletion {
  type: "complete";
  objectId: string;
  definitionId: string;
}

export interface WorldInteractionStepResult {
  state: WorldInteractionState;
  completion: WorldInteractionCompletion | null;
}

export const INTERACTION_PROMPT_MARGIN_METRES = 1.1;

export function stepWorldInteraction(input: WorldInteractionStepInput): WorldInteractionStepResult {
  const { state, definition } = input;
  if (input.destroyed || state.phase === "disabled") {
    return { state: { ...state, phase: "disabled", progressSeconds: 0 }, completion: null };
  }
  if (state.phase === "completed" && !definition.repeatable) return { state, completion: null };

  const delta = Math.max(0, input.deltaSeconds);
  const inRange = input.distanceMetres <= Math.max(0, input.footprintMetres) + INTERACTION_PROMPT_MARGIN_METRES;
  if (state.phase === "cooldown") {
    const remaining = Math.max(0, state.cooldownRemainingSeconds - delta);
    return { state: { ...state, phase: remaining > 0 ? "cooldown" : "available", cooldownRemainingSeconds: remaining, progressSeconds: 0 }, completion: null };
  }
  if (input.paused) return { state, completion: null };
  if (!inRange || (input.interruptedByDamage && (definition.interruptOnDamage ?? true)) || (input.interruptedByShieldDamage && (definition.interruptOnShieldDamage ?? false))) {
    return { state: { ...state, phase: "available", progressSeconds: 0, cooldownRemainingSeconds: 0 }, completion: null };
  }
  if (!input.interactHeld && !input.interactPressed) {
    return { state: { ...state, phase: "available", progressSeconds: 0 }, completion: null };
  }

  const required = Math.max(0, definition.requiredSeconds);
  const progress = Math.min(required, state.progressSeconds + delta);
  if (progress < required) return { state: { ...state, phase: "holding", requiredSeconds: required, progressSeconds: progress }, completion: null };
  const next: WorldInteractionState = {
    ...state,
    phase: definition.repeatable && definition.cooldownSeconds > 0 ? "cooldown" : "completed",
    requiredSeconds: required,
    progressSeconds: 0,
    cooldownRemainingSeconds: definition.repeatable ? Math.max(0, definition.cooldownSeconds) : 0,
    completionCount: state.completionCount + 1,
  };
  return { state: next, completion: { type: "complete", objectId: state.objectId, definitionId: state.definitionId } };
}

export function chooseWorldInteractionCandidate<T extends { objectId: string; definitionId: string; distanceMetres: number; valid: boolean }>(candidates: readonly T[]): T | null {
  return candidates.filter((candidate) => candidate.valid).sort((left, right) => left.distanceMetres - right.distanceMetres || left.objectId.localeCompare(right.objectId))[0] ?? null;
}
