import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export const SYNAPSE_HERALD_ENTRANCE_SECONDS = 0.9;
export const SYNAPSE_HERALD_SETUP_SECONDS = 0.8;
export const SYNAPSE_HERALD_LINK_SECONDS = 4;
export const SYNAPSE_HERALD_LINK_RANGE_METRES = 7;
export const SYNAPSE_HERALD_MARKED_ZONE_COUNT = 3;

export type SynapseHeraldMove = "lunge-chain" | "marked-zones" | "synapse-link";
export type SynapseHeraldPhase = "entrance" | "setup" | "windup" | "action" | "recovery";

export interface SynapseBrainCandidate {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
  readonly rank: "standard" | "elite" | "mini-boss" | "boss";
}

export interface SynapseHeraldContext {
  readonly ownerPosition: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly ownerHealth: number;
  readonly ownerMaxHealth: number;
  readonly arenaWidthMetres: number;
  readonly arenaHeightMetres: number;
  readonly brainBlobs: readonly SynapseBrainCandidate[];
}

export interface SynapseHeraldState {
  readonly phase: SynapseHeraldPhase;
  readonly phaseRemainingSeconds: number;
  readonly move: SynapseHeraldMove | null;
  readonly previousMove: SynapseHeraldMove | null;
  readonly attackIndex: number;
  readonly seedOffset: number;
  readonly lockedPlayerTarget: Vector2Data | null;
  readonly lungeTargets: readonly Vector2Data[];
  readonly markedZones: readonly Vector2Data[];
  readonly linkTargetId: number | null;
}

export interface SynapseHeraldStepResult {
  readonly state: SynapseHeraldState;
  readonly moveStarted: SynapseHeraldMove | null;
  readonly actionStarted: SynapseHeraldMove | null;
  readonly moveResolved: SynapseHeraldMove | null;
  readonly linkBroken: boolean;
}

const MOVE_ORDER: readonly SynapseHeraldMove[] = Object.freeze([
  "lunge-chain",
  "marked-zones",
  "synapse-link",
]);

export function createSynapseHeraldBehavior(seed: number): SynapseHeraldState {
  return {
    phase: "entrance",
    phaseRemainingSeconds: SYNAPSE_HERALD_ENTRANCE_SECONDS,
    move: null,
    previousMove: null,
    attackIndex: 0,
    seedOffset: Math.abs(Math.floor(seed)) % MOVE_ORDER.length,
    lockedPlayerTarget: null,
    lungeTargets: [],
    markedZones: [],
    linkTargetId: null,
  };
}

export function selectSynapseHeraldMove(
  state: SynapseHeraldState,
  context: SynapseHeraldContext,
): SynapseHeraldMove {
  const start = (state.seedOffset + state.attackIndex) % MOVE_ORDER.length;
  for (let offset = 0; offset < MOVE_ORDER.length; offset += 1) {
    const candidate = MOVE_ORDER[(start + offset) % MOVE_ORDER.length]!;
    if (candidate === state.previousMove) continue;
    if (candidate === "synapse-link" && selectLinkTarget(context) === null) continue;
    return candidate;
  }
  return state.previousMove === "lunge-chain" ? "marked-zones" : "lunge-chain";
}

export function stepSynapseHeraldBehavior(
  state: SynapseHeraldState,
  deltaSeconds: number,
  context: SynapseHeraldContext,
): SynapseHeraldStepResult {
  const delta = Math.max(0, deltaSeconds);
  if (state.phase === "action" && state.move === "synapse-link" && !linkTargetIsValid(state, context)) {
    return result(enterRecovery(state, context), null, null, "synapse-link", true);
  }
  const remaining = Math.max(0, state.phaseRemainingSeconds - delta);
  if (remaining > 0) return result({ ...state, phaseRemainingSeconds: remaining });

  switch (state.phase) {
    case "entrance":
      return result({ ...state, phase: "setup", phaseRemainingSeconds: SYNAPSE_HERALD_SETUP_SECONDS });
    case "setup": {
      const move = selectSynapseHeraldMove(state, context);
      const begun = beginMove(state, move, context);
      return result(begun, move);
    }
    case "windup":
      return result({
        ...state,
        phase: "action",
        phaseRemainingSeconds: actionSeconds(state.move!),
      }, null, state.move);
    case "action":
      return result(enterRecovery(state, context), null, null, state.move);
    case "recovery":
      return result({
        ...state,
        phase: "setup",
        phaseRemainingSeconds: SYNAPSE_HERALD_SETUP_SECONDS,
        move: null,
        lockedPlayerTarget: null,
        lungeTargets: [],
        markedZones: [],
        linkTargetId: null,
      });
  }
}

function beginMove(
  state: SynapseHeraldState,
  move: SynapseHeraldMove,
  context: SynapseHeraldContext,
): SynapseHeraldState {
  const lockedPlayerTarget = clampPoint(context.playerPosition, context);
  const linkTarget = move === "synapse-link" ? selectLinkTarget(context) : null;
  return {
    ...state,
    phase: "windup",
    phaseRemainingSeconds: windupSeconds(move, enrageTier(context)),
    move,
    attackIndex: state.attackIndex + 1,
    lockedPlayerTarget,
    lungeTargets: move === "lunge-chain" ? buildLungeTargets(state, context) : [],
    markedZones: move === "marked-zones" ? buildMarkedZones(state, context) : [],
    linkTargetId: linkTarget?.id ?? null,
  };
}

function buildLungeTargets(
  state: SynapseHeraldState,
  context: SynapseHeraldContext,
): readonly Vector2Data[] {
  const target = clampPoint(context.playerPosition, context);
  const direction = normalizeVector({
    x: target.x - context.ownerPosition.x,
    y: target.y - context.ownerPosition.y,
  });
  const side = (state.seedOffset + state.attackIndex) % 2 === 0 ? 1 : -1;
  const perpendicular = { x: -direction.y * side, y: direction.x * side };
  const targets = [
    { x: target.x + perpendicular.x * 1.8, y: target.y + perpendicular.y * 1.8 },
    { x: target.x - perpendicular.x * 1.8, y: target.y - perpendicular.y * 1.8 },
  ];
  if (enrageTier(context) === 2) {
    targets.push({ x: target.x + direction.x * 2.2, y: target.y + direction.y * 2.2 });
  }
  return targets.map((point) => clampPoint(point, context));
}

function buildMarkedZones(
  state: SynapseHeraldState,
  context: SynapseHeraldContext,
): readonly Vector2Data[] {
  const target = clampPoint(context.playerPosition, context);
  const direction = normalizeVector({
    x: target.x - context.ownerPosition.x,
    y: target.y - context.ownerPosition.y,
  });
  const side = (state.seedOffset + state.attackIndex) % 2 === 0 ? 1 : -1;
  const perpendicular = { x: -direction.y * side, y: direction.x * side };
  return [
    target,
    clampPoint({ x: target.x + perpendicular.x * 2.4, y: target.y + perpendicular.y * 2.4 }, context),
    clampPoint({ x: target.x - perpendicular.x * 2.4, y: target.y - perpendicular.y * 2.4 }, context),
  ];
}

function selectLinkTarget(context: SynapseHeraldContext): SynapseBrainCandidate | null {
  return [...context.brainBlobs].filter((blob) => (
    !blob.dead
    && blob.rank === "standard"
    && distance(context.ownerPosition, blob.position) <= SYNAPSE_HERALD_LINK_RANGE_METRES
  )).sort((left, right) => (
    distance(context.ownerPosition, left.position) - distance(context.ownerPosition, right.position)
    || left.id - right.id
  ))[0] ?? null;
}

function linkTargetIsValid(state: SynapseHeraldState, context: SynapseHeraldContext): boolean {
  return state.linkTargetId !== null && context.brainBlobs.some((blob) => (
    blob.id === state.linkTargetId
    && !blob.dead
    && blob.rank === "standard"
    && distance(context.ownerPosition, blob.position) <= SYNAPSE_HERALD_LINK_RANGE_METRES
  ));
}

function windupSeconds(move: SynapseHeraldMove, tier: 0 | 1 | 2): number {
  const base = move === "lunge-chain" ? 0.75 : move === "marked-zones" ? 1.2 : 0.9;
  return base * ([1, 0.88, 0.74][tier] ?? 1);
}

function actionSeconds(move: SynapseHeraldMove): number {
  return move === "lunge-chain" ? 0.72 : move === "marked-zones" ? 0.25 : SYNAPSE_HERALD_LINK_SECONDS;
}

function enterRecovery(state: SynapseHeraldState, context: SynapseHeraldContext): SynapseHeraldState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: [1.15, 0.95, 0.78][enrageTier(context)]!,
    previousMove: state.move,
    linkTargetId: null,
  };
}

function enrageTier(context: SynapseHeraldContext): 0 | 1 | 2 {
  const ratio = context.ownerMaxHealth > 0 ? context.ownerHealth / context.ownerMaxHealth : 0;
  return ratio <= 0.2 ? 2 : ratio <= 0.5 ? 1 : 0;
}

function clampPoint(point: Readonly<Vector2Data>, context: SynapseHeraldContext): Vector2Data {
  return {
    x: Math.max(0.8, Math.min(context.arenaWidthMetres - 0.8, point.x)),
    y: Math.max(0.8, Math.min(context.arenaHeightMetres - 0.8, point.y)),
  };
}

function distance(left: Readonly<Vector2Data>, right: Readonly<Vector2Data>): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function result(
  state: SynapseHeraldState,
  moveStarted: SynapseHeraldMove | null = null,
  actionStarted: SynapseHeraldMove | null = null,
  moveResolved: SynapseHeraldMove | null = null,
  linkBroken = false,
): SynapseHeraldStepResult {
  return { state, moveStarted, actionStarted, moveResolved, linkBroken };
}
