import { TRANSFORMATION_COMMIT_AFFINITY, TRANSFORMATION_ASCEND_AFFINITY, TRANSFORMATION_APEX_AFFINITY, type TransformationAffinityState } from "../transformations/TransformationAffinity";
import { transformationPathById } from "../transformations/TransformationPathCatalog";

/** Pure projection of real progression; never grants or predicts an unavailable offer. */
export function affinityHudModel(state: TransformationAffinityState): { title: string; detail: string } | null {
  const progress = state.committedPathId
    ? state.paths.find(path => path.pathId === state.committedPathId)
    : [...state.paths].sort((a, b) => b.affinity - a.affinity || a.pathId.localeCompare(b.pathId))[0];
  if (!progress || progress.affinity <= 0) return null;
  const committed = state.committedPathId !== null;
  const target = !committed ? TRANSFORMATION_COMMIT_AFFINITY
    : progress.affinity < TRANSFORMATION_ASCEND_AFFINITY ? TRANSFORMATION_ASCEND_AFFINITY : TRANSFORMATION_APEX_AFFINITY;
  const consequence = progress.affinity >= TRANSFORMATION_APEX_AFFINITY ? "Apex reached"
    : !committed && progress.affinity === TRANSFORMATION_COMMIT_AFFINITY - 1 ? "Next aligned choice commits"
    : committed ? `${target === TRANSFORMATION_ASCEND_AFFINITY ? "Ascend" : "Apex"} at ${target}` : `Commit at ${target}`;
  return { title: `${transformationPathById(progress.pathId).name} ${progress.affinity}/${target}`,
    detail: `${consequence} / Inspect` };
}
