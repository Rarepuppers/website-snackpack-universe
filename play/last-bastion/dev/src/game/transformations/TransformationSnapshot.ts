import { transformationChoiceById, type TransformationChoiceId } from "./TransformationChoiceCatalog";
import { transformationPathById, type TransformationPathId } from "./TransformationPathCatalog";
import {
  cloneTransformationAffinityState,
  transformationStage,
  type TransformationAffinityState,
  type TransformationStage,
} from "./TransformationAffinity";

export interface TransformationChoiceSnapshot {
  id: TransformationChoiceId;
  name: string;
  rank: number;
}

export interface TransformationPathSnapshot {
  pathId: TransformationPathId;
  name: string;
  affinity: number;
  stage: TransformationStage;
  committed: boolean;
  choices: readonly TransformationChoiceSnapshot[];
}

export interface TransformationCodexSnapshot {
  committedPathId: TransformationPathId | null;
  paths: readonly TransformationPathSnapshot[];
}

/** Stable presentation snapshot for Codex, warning UI, debrief, and diagnostics. */
export function createTransformationCodexSnapshot(
  input: TransformationAffinityState | null | undefined,
): TransformationCodexSnapshot {
  const state = cloneTransformationAffinityState(input);
  return {
    committedPathId: state.committedPathId,
    paths: state.paths.map((progress) => {
      const ranks = new Map<TransformationChoiceId, number>();
      for (const id of progress.choiceIds) ranks.set(id, (ranks.get(id) ?? 0) + 1);
      return {
        pathId: progress.pathId,
        name: transformationPathById(progress.pathId).name,
        affinity: progress.affinity,
        stage: transformationStage(progress.affinity),
        committed: state.committedPathId === progress.pathId,
        choices: [...ranks].map(([id, rank]) => ({ id, name: transformationChoiceById(id).boon.name, rank })),
      };
    }),
  };
}
