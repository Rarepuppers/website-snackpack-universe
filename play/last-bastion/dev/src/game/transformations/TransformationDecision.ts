import {
  applyTransformationChoice,
  purgeTransformationPath,
  transformationProgress,
  type TransformationAffinityState,
  type TransformationChoiceFailure,
  type TransformationPurgeFailure,
} from "./TransformationAffinity";
import { transformationChoiceById, type TransformationChoiceId } from "./TransformationChoiceCatalog";
import type { TransformationPathId } from "./TransformationPathCatalog";

export const STANDARD_DECISION_HOLD_MS = 450;
export const COMMITMENT_DECISION_HOLD_MS = 1_250;
export const PURGE_DECISION_HOLD_MS = 850;

export type TransformationDecisionWarning = "standard" | "commitment" | "purge";

export type TransformationDecisionAction =
  | { kind: "choose"; pathId: TransformationPathId; choiceId: TransformationChoiceId }
  | { kind: "purge"; pathId: TransformationPathId };

export interface PendingTransformationDecision {
  action: TransformationDecisionAction;
  warning: TransformationDecisionWarning;
  title: string;
  body: string;
  holdRequiredMs: number;
  holdElapsedMs: number;
}

export interface TransformationDecisionState {
  affinity: TransformationAffinityState;
  pending: PendingTransformationDecision | null;
  notice: string | null;
}

export type BeginTransformationDecisionResult =
  | { ok: true; state: TransformationDecisionState }
  | { ok: false; state: TransformationDecisionState; reason: TransformationChoiceFailure | TransformationPurgeFailure };

export function createTransformationDecisionState(
  affinity: TransformationAffinityState,
): TransformationDecisionState {
  return Object.freeze({ affinity, pending: null, notice: null });
}

export function beginTransformationChoice(
  state: TransformationDecisionState,
  pathId: TransformationPathId,
  choiceId: TransformationChoiceId,
): BeginTransformationDecisionResult {
  const preview = applyTransformationChoice(state.affinity, pathId, choiceId);
  if (!preview.ok) return { ok: false, state: withNotice(state, failureNotice(preview.reason)), reason: preview.reason };
  const choice = transformationChoiceById(choiceId);
  const commitment = preview.committedNow;
  return {
    ok: true,
    state: withPending(state, {
      action: { kind: "choose", pathId, choiceId },
      warning: commitment ? "commitment" : "standard",
      title: commitment ? "PERMANENT PATH COMMITMENT" : `${choice.boon.name.toUpperCase()} + SCAR`,
      body: commitment
        ? `This third aligned choice locks the run to this path. Other exposures stop advancing. ${choice.scar.name} remains part of the choice.`
        : `${choice.boon.summary} Cost: ${choice.scar.summary}`,
      holdRequiredMs: commitment ? COMMITMENT_DECISION_HOLD_MS : STANDARD_DECISION_HOLD_MS,
      holdElapsedMs: 0,
    }),
  };
}

export function beginTransformationPurge(
  state: TransformationDecisionState,
  pathId: TransformationPathId,
): BeginTransformationDecisionResult {
  const preview = purgeTransformationPath(state.affinity, pathId);
  if (!preview.ok) return { ok: false, state: withNotice(state, failureNotice(preview.reason)), reason: preview.reason };
  return {
    ok: true,
    state: withPending(state, {
      action: { kind: "purge", pathId },
      warning: "purge",
      title: "PURGE REVERSIBLE EXPOSURE",
      body: `Remove all ${preview.removedAffinity} uncommitted Affinity from this path. This does not refund the choice that created it.`,
      holdRequiredMs: PURGE_DECISION_HOLD_MS,
      holdElapsedMs: 0,
    }),
  };
}

export function advanceTransformationDecision(
  state: TransformationDecisionState,
  held: boolean,
  deltaMs: number,
): TransformationDecisionState {
  if (!state.pending) return state;
  const elapsed = held
    ? Math.min(state.pending.holdElapsedMs + Math.max(0, deltaMs), state.pending.holdRequiredMs)
    : 0;
  if (elapsed < state.pending.holdRequiredMs) {
    return withPending(state, { ...state.pending, holdElapsedMs: elapsed });
  }
  const action = state.pending.action;
  if (action.kind === "choose") {
    const result = applyTransformationChoice(state.affinity, action.pathId, action.choiceId);
    if (!result.ok) return withNotice({ ...state, pending: null }, failureNotice(result.reason));
    return Object.freeze({
      affinity: result.state,
      pending: null,
      notice: result.committedNow ? "PATH COMMITTED FOR THIS RUN" : "CHOICE ACCEPTED",
    });
  }
  const result = purgeTransformationPath(state.affinity, action.pathId);
  if (!result.ok) return withNotice({ ...state, pending: null }, failureNotice(result.reason));
  return Object.freeze({
    affinity: result.state,
    pending: null,
    notice: `PURGED ${result.removedAffinity} AFFINITY`,
  });
}

export function cancelTransformationDecision(state: TransformationDecisionState): TransformationDecisionState {
  return state.pending ? Object.freeze({ ...state, pending: null, notice: "DECISION CANCELLED" }) : state;
}

export function selectedChoiceRank(
  state: TransformationDecisionState,
  pathId: TransformationPathId,
  choiceId: TransformationChoiceId,
): number {
  return transformationProgress(state.affinity, pathId)?.choiceIds.filter((id) => id === choiceId).length ?? 0;
}

function withPending(
  state: TransformationDecisionState,
  pending: PendingTransformationDecision,
): TransformationDecisionState {
  return Object.freeze({ ...state, pending: Object.freeze(pending), notice: null });
}

function withNotice(state: TransformationDecisionState, notice: string): TransformationDecisionState {
  return Object.freeze({ ...state, pending: null, notice });
}

function failureNotice(reason: TransformationChoiceFailure | TransformationPurgeFailure): string {
  switch (reason) {
    case "path-locked": return "ANOTHER PATH OWNS THIS RUN";
    case "apex-reached": return "APEX AFFINITY ALREADY REACHED";
    case "choice-max-rank": return "CHOICE ALREADY AT RANK III";
    case "invalid-choice": return "INVALID PATH CHOICE";
    case "no-affinity": return "NO EXPOSURE TO PURGE";
    case "committed-path": return "COMMITTED PATH CANNOT BE PURGED";
  }
}
