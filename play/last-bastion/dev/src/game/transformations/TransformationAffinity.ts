import {
  isTransformationChoiceId,
  transformationChoiceById,
  type TransformationChoiceId,
} from "./TransformationChoiceCatalog";
import { isTransformationPathId, type TransformationPathId } from "./TransformationPathCatalog";

export const TRANSFORMATION_COMMIT_AFFINITY = 3;
export const TRANSFORMATION_ASCEND_AFFINITY = 5;
export const TRANSFORMATION_APEX_AFFINITY = 7;

export type TransformationStage =
  | "none"
  | "exposed"
  | "adapted"
  | "transformed"
  | "ascended"
  | "apex";

export interface TransformationPathProgress {
  pathId: TransformationPathId;
  affinity: number;
  /** Ordered choice history. Repeated ids are legal and still add Affinity. */
  choiceIds: readonly TransformationChoiceId[];
}

export interface TransformationAffinityState {
  committedPathId: TransformationPathId | null;
  paths: readonly TransformationPathProgress[];
}

export type TransformationChoiceFailure =
  | "path-locked"
  | "apex-reached"
  | "choice-max-rank"
  | "invalid-choice";

export type TransformationChoiceResult =
  | {
    ok: true;
    state: TransformationAffinityState;
    previousStage: TransformationStage;
    stage: TransformationStage;
    committedNow: boolean;
  }
  | { ok: false; state: TransformationAffinityState; reason: TransformationChoiceFailure };

export type TransformationPurgeFailure = "no-affinity" | "committed-path";

export type TransformationPurgeResult =
  | { ok: true; state: TransformationAffinityState; removedAffinity: number }
  | { ok: false; state: TransformationAffinityState; reason: TransformationPurgeFailure };

export function createTransformationAffinityState(): TransformationAffinityState {
  return Object.freeze({ committedPathId: null, paths: Object.freeze([]) });
}

export function transformationProgress(
  state: TransformationAffinityState,
  pathId: TransformationPathId,
): TransformationPathProgress | null {
  return state.paths.find((progress) => progress.pathId === pathId) ?? null;
}

export function transformationStage(affinity: number): TransformationStage {
  if (affinity >= TRANSFORMATION_APEX_AFFINITY) return "apex";
  if (affinity >= TRANSFORMATION_ASCEND_AFFINITY) return "ascended";
  if (affinity >= TRANSFORMATION_COMMIT_AFFINITY) return "transformed";
  if (affinity >= 2) return "adapted";
  if (affinity >= 1) return "exposed";
  return "none";
}

/**
 * Applies one aligned perk/site choice. The third point commits the run to
 * that family. Progress in other families is retained as inactive exposure.
 */
export function applyTransformationChoice(
  state: TransformationAffinityState,
  pathId: TransformationPathId,
  choiceId: string,
): TransformationChoiceResult {
  if (!isTransformationChoiceId(choiceId) || transformationChoiceById(choiceId).pathId !== pathId) {
    return { ok: false, state, reason: "invalid-choice" };
  }
  if (state.committedPathId !== null && state.committedPathId !== pathId) {
    return { ok: false, state, reason: "path-locked" };
  }

  const current = transformationProgress(state, pathId);
  const affinity = current?.affinity ?? 0;
  if (affinity >= TRANSFORMATION_APEX_AFFINITY) {
    return { ok: false, state, reason: "apex-reached" };
  }
  if ((current?.choiceIds.filter((id) => id === choiceId).length ?? 0) >= transformationChoiceById(choiceId).maxRank) {
    return { ok: false, state, reason: "choice-max-rank" };
  }

  const previousStage = transformationStage(affinity);
  const nextProgress = freezeProgress(pathId, affinity + 1, [...(current?.choiceIds ?? []), choiceId]);
  const paths = state.paths.some((progress) => progress.pathId === pathId)
    ? state.paths.map((progress) => progress.pathId === pathId ? nextProgress : progress)
    : [...state.paths, nextProgress];
  const committedNow = state.committedPathId === null
    && nextProgress.affinity >= TRANSFORMATION_COMMIT_AFFINITY;
  const nextState = freezeState(
    committedNow ? pathId : state.committedPathId,
    paths,
  );
  return {
    ok: true,
    state: nextState,
    previousStage,
    stage: transformationStage(nextProgress.affinity),
    committedNow,
  };
}

export function cloneTransformationAffinityState(
  state: TransformationAffinityState | null | undefined,
): TransformationAffinityState {
  if (!state) return createTransformationAffinityState();
  return freezeState(state.committedPathId, state.paths.map((progress) => (
    freezeProgress(progress.pathId, progress.affinity, progress.choiceIds)
  )));
}

/** Sanitizes storage/cloud input and derives Affinity from valid choice history. */
export function normalizeTransformationAffinityState(value: unknown): TransformationAffinityState {
  if (typeof value !== "object" || value === null) return createTransformationAffinityState();
  const candidate = value as { committedPathId?: unknown; paths?: unknown };
  if (!Array.isArray(candidate.paths)) return createTransformationAffinityState();
  const progress: TransformationPathProgress[] = [];
  const seenPaths = new Set<TransformationPathId>();
  for (const raw of candidate.paths) {
    if (typeof raw !== "object" || raw === null) continue;
    const row = raw as { pathId?: unknown; choiceIds?: unknown };
    if (!isTransformationPathId(row.pathId) || seenPaths.has(row.pathId) || !Array.isArray(row.choiceIds)) continue;
    seenPaths.add(row.pathId);
    const counts = new Map<TransformationChoiceId, number>();
    const choiceIds: TransformationChoiceId[] = [];
    for (const choiceId of row.choiceIds) {
      if (!isTransformationChoiceId(choiceId)) continue;
      const definition = transformationChoiceById(choiceId);
      if (definition.pathId !== row.pathId) continue;
      const count = counts.get(choiceId) ?? 0;
      if (count >= definition.maxRank || choiceIds.length >= TRANSFORMATION_APEX_AFFINITY) continue;
      counts.set(choiceId, count + 1);
      choiceIds.push(choiceId);
    }
    if (choiceIds.length > 0) progress.push(freezeProgress(row.pathId, choiceIds.length, choiceIds));
  }
  const requestedCommit = isTransformationPathId(candidate.committedPathId)
    ? candidate.committedPathId
    : null;
  const committedPathId = requestedCommit
    && (progress.find(({ pathId }) => pathId === requestedCommit)?.affinity ?? 0) >= TRANSFORMATION_COMMIT_AFFINITY
    ? requestedCommit
    : progress.find(({ affinity }) => affinity >= TRANSFORMATION_COMMIT_AFFINITY)?.pathId ?? null;
  const safeProgress = committedPathId === null
    ? progress
    : progress.map((row) => row.pathId === committedPathId || row.affinity <= 2
      ? row
      : freezeProgress(row.pathId, 2, row.choiceIds.slice(0, 2)));
  return freezeState(committedPathId, safeProgress);
}

/** Removes a reversible exposure. Committed paths can never be purged. */
export function purgeTransformationPath(
  state: TransformationAffinityState,
  pathId: TransformationPathId,
): TransformationPurgeResult {
  const current = transformationProgress(state, pathId);
  if (!current) return { ok: false, state, reason: "no-affinity" };
  if (state.committedPathId === pathId) {
    return { ok: false, state, reason: "committed-path" };
  }
  return {
    ok: true,
    state: freezeState(state.committedPathId, state.paths.filter((progress) => progress.pathId !== pathId)),
    removedAffinity: current.affinity,
  };
}

function freezeProgress(
  pathId: TransformationPathId,
  affinity: number,
  choiceIds: readonly TransformationChoiceId[],
): TransformationPathProgress {
  return Object.freeze({ pathId, affinity, choiceIds: Object.freeze([...choiceIds]) });
}

function freezeState(
  committedPathId: TransformationPathId | null,
  paths: readonly TransformationPathProgress[],
): TransformationAffinityState {
  return Object.freeze({ committedPathId, paths: Object.freeze([...paths]) });
}
