import { collidesWithObstacle, type ArenaDefinition } from "../arena/ArenaDefinition";
import type { Vector2Data } from "../math/Vector2Data";
import {
  buildStormEscapeSamples,
  clipStormChainToCover,
  createConductiveNode,
  damageConductiveNode,
  hasStormEscapeLane,
  lockStormChain,
  type ConductiveNodeState,
  type StormChainState,
} from "./StormSavantLightning";

export const STORM_REGENT_ENTRANCE_SECONDS = 1;
export const STORM_REGENT_SETUP_SECONDS = 0.8;
export const STORM_REGENT_NODE_COUNT = 3;
export const STORM_REGENT_NODE_OVERCHARGE_RADIUS_METRES = 1.6;
export const STORM_REGENT_COIL_RADIUS_METRES = 2.8;

export type StormRegentMove = "chain-strike" | "node-overcharge" | "coil-burst";
export type StormRegentPhase = "entrance" | "setup" | "windup" | "action" | "recovery";

export interface StormRegentContext {
  readonly ownerPosition: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly ownerHealth: number;
  readonly ownerMaxHealth: number;
  readonly arena: Readonly<ArenaDefinition>;
  readonly playerRadiusMetres: number;
}

export interface StormRegentState {
  readonly phase: StormRegentPhase;
  readonly phaseRemainingSeconds: number;
  readonly move: StormRegentMove | null;
  readonly previousMove: StormRegentMove | null;
  readonly attackIndex: number;
  readonly seedOffset: number;
  readonly nodes: readonly ConductiveNodeState[];
  readonly escapeSamples: readonly Vector2Data[];
  readonly lockedChain: StormChainState | null;
  readonly overchargeNodeId: number | null;
  readonly coilCentre: Vector2Data | null;
}

export interface StormRegentStepResult {
  readonly state: StormRegentState;
  readonly moveStarted: StormRegentMove | null;
  readonly actionStarted: StormRegentMove | null;
  readonly moveResolved: StormRegentMove | null;
  readonly interrupted: boolean;
}

const MOVE_ORDER: readonly StormRegentMove[] = Object.freeze([
  "chain-strike",
  "node-overcharge",
  "coil-burst",
]);

export function createStormRegentBehavior(
  seed: number,
  context: StormRegentContext,
  firstNodeId: number,
): StormRegentState {
  return {
    phase: "entrance",
    phaseRemainingSeconds: STORM_REGENT_ENTRANCE_SECONDS,
    move: null,
    previousMove: null,
    attackIndex: 0,
    seedOffset: Math.abs(Math.floor(seed)) % MOVE_ORDER.length,
    nodes: planRegentNodes(context, firstNodeId),
    escapeSamples: buildStormEscapeSamples(
      context.playerPosition,
      context.arena,
      2.4,
      context.playerRadiusMetres,
    ),
    lockedChain: null,
    overchargeNodeId: null,
    coilCentre: null,
  };
}

export function damageStormRegentNode(
  state: StormRegentState,
  nodeId: number,
  damage: number,
): StormRegentState {
  return {
    ...state,
    nodes: state.nodes.map((node) => node.id === nodeId ? damageConductiveNode(node, damage) : node),
  };
}

export function selectStormRegentMove(
  state: StormRegentState,
  context: StormRegentContext,
): StormRegentMove | null {
  const start = (state.seedOffset + state.attackIndex) % MOVE_ORDER.length;
  for (let offset = 0; offset < MOVE_ORDER.length; offset += 1) {
    const candidate = MOVE_ORDER[(start + offset) % MOVE_ORDER.length]!;
    if (candidate === state.previousMove || !moveIsAvailable(candidate, state, context)) continue;
    return candidate;
  }
  return null;
}

export function stepStormRegentBehavior(
  state: StormRegentState,
  deltaSeconds: number,
  context: StormRegentContext,
): StormRegentStepResult {
  if (state.phase === "windup" && committedCounterWasDestroyed(state)) {
    return result(enterRecovery(state, context), {
      moveResolved: state.move,
      interrupted: true,
    });
  }
  const remaining = Math.max(0, state.phaseRemainingSeconds - Math.max(0, deltaSeconds));
  if (remaining > 0) return result({ ...state, phaseRemainingSeconds: remaining });
  switch (state.phase) {
    case "entrance":
      return result({ ...state, phase: "setup", phaseRemainingSeconds: STORM_REGENT_SETUP_SECONDS });
    case "setup": {
      const move = selectStormRegentMove(state, context);
      if (!move) return result({ ...state, phaseRemainingSeconds: STORM_REGENT_SETUP_SECONDS });
      return result(beginMove(state, move, context), { moveStarted: move });
    }
    case "windup":
      return result({
        ...state,
        phase: "action",
        phaseRemainingSeconds: actionSeconds(state.move!),
      }, { actionStarted: state.move });
    case "action":
      return result(enterRecovery(state, context), { moveResolved: state.move });
    case "recovery":
      return result({
        ...state,
        phase: "setup",
        phaseRemainingSeconds: STORM_REGENT_SETUP_SECONDS,
        move: null,
        lockedChain: null,
        overchargeNodeId: null,
        coilCentre: null,
      });
  }
}

export function stormRegentHasEscapeLane(state: StormRegentState, context: StormRegentContext): boolean {
  if (state.move === "chain-strike") {
    return hasStormEscapeLane(state.escapeSamples, state.lockedChain?.segments ?? [], context.playerRadiusMetres);
  }
  const centre = state.move === "node-overcharge"
    ? state.nodes.find((node) => node.id === state.overchargeNodeId)?.position ?? null
    : state.coilCentre;
  const radius = state.move === "node-overcharge"
    ? STORM_REGENT_NODE_OVERCHARGE_RADIUS_METRES
    : STORM_REGENT_COIL_RADIUS_METRES;
  return centre !== null && state.escapeSamples.some((sample) => (
    Math.hypot(sample.x - centre.x, sample.y - centre.y) > radius + context.playerRadiusMetres
  ));
}

function beginMove(
  state: StormRegentState,
  move: StormRegentMove,
  context: StormRegentContext,
): StormRegentState {
  const liveNodes = orderedLiveNodes(state, context);
  const rawChain = move === "chain-strike" ? lockStormChain(context.ownerPosition, liveNodes) : null;
  const lockedChain = rawChain ? {
    ...rawChain,
    segments: clipStormChainToCover(rawChain.segments, context.arena.obstacles),
  } : null;
  return {
    ...state,
    phase: "windup",
    phaseRemainingSeconds: windupSeconds(move, enrageTier(context)),
    move,
    attackIndex: state.attackIndex + 1,
    lockedChain,
    overchargeNodeId: move === "node-overcharge" ? liveNodes[0]?.id ?? null : null,
    coilCentre: move === "coil-burst" ? { ...context.ownerPosition } : null,
  };
}

function moveIsAvailable(
  move: StormRegentMove,
  state: StormRegentState,
  context: StormRegentContext,
): boolean {
  if (move === "coil-burst") {
    const preview = { ...state, move, coilCentre: { ...context.ownerPosition } };
    return stormRegentHasEscapeLane(preview, context);
  }
  const liveNodes = orderedLiveNodes(state, context);
  if (liveNodes.length === 0) return false;
  if (move === "node-overcharge") {
    return stormRegentHasEscapeLane({ ...state, move, overchargeNodeId: liveNodes[0]!.id }, context);
  }
  const chain = lockStormChain(context.ownerPosition, liveNodes);
  if (!chain) return false;
  const visible = clipStormChainToCover(chain.segments, context.arena.obstacles);
  return hasStormEscapeLane(state.escapeSamples, visible, context.playerRadiusMetres);
}

function committedCounterWasDestroyed(state: StormRegentState): boolean {
  if (state.move === "chain-strike") {
    return (state.lockedChain?.lockedNodeIds ?? []).some((id) => (
      state.nodes.find((node) => node.id === id)?.destroyed !== false
    ));
  }
  return state.move === "node-overcharge"
    && state.nodes.find((node) => node.id === state.overchargeNodeId)?.destroyed !== false;
}

function orderedLiveNodes(state: StormRegentState, context: StormRegentContext): ConductiveNodeState[] {
  const nodes = state.nodes.filter((node) => !node.destroyed).sort((left, right) => (
    Math.hypot(left.position.x - context.playerPosition.x, left.position.y - context.playerPosition.y)
    - Math.hypot(right.position.x - context.playerPosition.x, right.position.y - context.playerPosition.y)
    || left.id - right.id
  ));
  if ((state.seedOffset + state.attackIndex) % 2 === 1) nodes.reverse();
  return nodes;
}

function planRegentNodes(context: StormRegentContext, firstNodeId: number): readonly ConductiveNodeState[] {
  const offsets: readonly Vector2Data[] = [
    { x: -3.6, y: -2.8 }, { x: 3.6, y: -2.8 }, { x: 0, y: 3.8 },
    { x: -4.2, y: 2.4 }, { x: 4.2, y: 2.4 }, { x: 0, y: -4.2 },
  ];
  const nodes: ConductiveNodeState[] = [];
  for (const offset of offsets) {
    const position = {
      x: clamp(context.playerPosition.x + offset.x, 0.5, context.arena.widthMetres - 0.5),
      y: clamp(context.playerPosition.y + offset.y, 0.5, context.arena.heightMetres - 0.5),
    };
    if (collidesWithObstacle(position, 0.42, context.arena.obstacles)) continue;
    if (nodes.some((node) => Math.hypot(node.position.x - position.x, node.position.y - position.y) < 2.4)) continue;
    nodes.push(createConductiveNode(firstNodeId + nodes.length, position));
    if (nodes.length === STORM_REGENT_NODE_COUNT) break;
  }
  return nodes;
}

function windupSeconds(move: StormRegentMove, tier: 0 | 1 | 2): number {
  const base = move === "chain-strike" ? 1.3 : move === "node-overcharge" ? 1.05 : 0.9;
  return base * [1, 0.88, 0.74][tier]!;
}

function actionSeconds(move: StormRegentMove): number {
  return move === "chain-strike" ? 0.22 : move === "node-overcharge" ? 0.28 : 0.3;
}

function enterRecovery(state: StormRegentState, context: StormRegentContext): StormRegentState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: [1.5, 1.22, 0.96][enrageTier(context)]!,
    previousMove: state.move,
    lockedChain: null,
    overchargeNodeId: null,
    coilCentre: null,
  };
}

function enrageTier(context: StormRegentContext): 0 | 1 | 2 {
  const ratio = context.ownerMaxHealth > 0 ? context.ownerHealth / context.ownerMaxHealth : 0;
  return ratio <= 0.2 ? 2 : ratio <= 0.5 ? 1 : 0;
}

function result(
  state: StormRegentState,
  values: Partial<Omit<StormRegentStepResult, "state">> = {},
): StormRegentStepResult {
  return {
    state,
    moveStarted: null,
    actionStarted: null,
    moveResolved: null,
    interrupted: false,
    ...values,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
