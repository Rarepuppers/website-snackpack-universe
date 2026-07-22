import type { Vector2Data } from "../math/Vector2Data";
import { collidesWithObstacle, type ArenaDefinition, type ArenaObstacle } from "../arena/ArenaDefinition";

export const STORM_NODE_MAX_HEALTH = 6;
export const STORM_CHAIN_MAX_HOPS = 2;
export const STORM_CHAIN_TELL_SECONDS = 1.15;
export const STORM_CHAIN_DISCHARGE_SECONDS = 0.2;
export const STORM_SAVANT_OVERLOAD_RECOVERY_SECONDS = 1.7;
export const STORM_CHAIN_HALF_WIDTH_METRES = 0.32;
export const STORM_NODE_RADIUS_METRES = 0.42;

export interface ConductiveNodeState {
  readonly id: number;
  readonly position: Vector2Data;
  readonly health: number;
  readonly destroyed: boolean;
}

export interface StormChainSegment {
  readonly from: Vector2Data;
  readonly to: Vector2Data;
  readonly targetNodeId: number;
  readonly blockedByObstacleId?: string;
}

export interface StormNodePlacementPlan {
  readonly nodes: readonly ConductiveNodeState[];
  readonly chain: StormChainState;
  readonly escapeSamples: readonly Vector2Data[];
}

export type StormChainPhase = "idle" | "tell" | "discharge" | "overload-recovery";

export interface StormChainState {
  readonly phase: StormChainPhase;
  readonly phaseRemainingSeconds: number;
  readonly lockedNodeIds: readonly number[];
  readonly segments: readonly StormChainSegment[];
}

export interface StormChainStepResult {
  readonly state: StormChainState;
  readonly discharged: boolean;
}

export function createConductiveNode(id: number, position: Readonly<Vector2Data>): ConductiveNodeState {
  return { id, position: { ...position }, health: STORM_NODE_MAX_HEALTH, destroyed: false };
}

export function damageConductiveNode(
  node: ConductiveNodeState,
  rawDamage: number,
): ConductiveNodeState {
  if (node.destroyed || rawDamage <= 0) return node;
  const health = Math.max(0, node.health - rawDamage);
  return { ...node, health, destroyed: health <= 0 };
}

export function createIdleStormChain(): StormChainState {
  return { phase: "idle", phaseRemainingSeconds: 0, lockedNodeIds: [], segments: [] };
}

export function lockStormChain(
  origin: Readonly<Vector2Data>,
  nodes: readonly ConductiveNodeState[],
): StormChainState | null {
  const liveNodes = nodes.filter((node) => !node.destroyed).slice(0, STORM_CHAIN_MAX_HOPS);
  if (liveNodes.length === 0) return null;
  const segments: StormChainSegment[] = [];
  let from = { ...origin };
  for (const node of liveNodes) {
    segments.push({ from, to: { ...node.position }, targetNodeId: node.id });
    from = { ...node.position };
  }
  return {
    phase: "tell",
    phaseRemainingSeconds: STORM_CHAIN_TELL_SECONDS,
    lockedNodeIds: liveNodes.map((node) => node.id),
    segments,
  };
}

export function stepStormChain(
  state: StormChainState,
  deltaSeconds: number,
  nodes: readonly ConductiveNodeState[],
): StormChainStepResult {
  if (state.phase === "idle") return { state, discharged: false };
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  if (state.lockedNodeIds.some((id) => nodeById.get(id)?.destroyed !== false)) {
    return {
      state: {
        phase: "overload-recovery",
        phaseRemainingSeconds: STORM_SAVANT_OVERLOAD_RECOVERY_SECONDS,
        lockedNodeIds: [],
        segments: [],
      },
      discharged: false,
    };
  }
  const remaining = Math.max(0, state.phaseRemainingSeconds - Math.max(0, deltaSeconds));
  if (remaining > 0) {
    return { state: { ...state, phaseRemainingSeconds: remaining }, discharged: false };
  }
  if (state.phase === "tell") {
    return {
      state: { ...state, phase: "discharge", phaseRemainingSeconds: STORM_CHAIN_DISCHARGE_SECONDS },
      discharged: true,
    };
  }
  if (state.phase === "discharge") {
    return {
      state: {
        phase: "overload-recovery",
        phaseRemainingSeconds: STORM_SAVANT_OVERLOAD_RECOVERY_SECONDS,
        lockedNodeIds: [],
        segments: [],
      },
      discharged: false,
    };
  }
  return { state: createIdleStormChain(), discharged: false };
}

export function pointInsideStormChain(
  point: Readonly<Vector2Data>,
  segments: readonly StormChainSegment[],
  radiusMetres = 0,
): boolean {
  return segments.some((segment) => (
    distanceToSegment(point, segment.from, segment.to)
    <= STORM_CHAIN_HALF_WIDTH_METRES + Math.max(0, radiusMetres)
  ));
}

export function hasStormEscapeLane(
  candidatePoints: readonly Vector2Data[],
  segments: readonly StormChainSegment[],
  playerRadiusMetres: number,
): boolean {
  return candidatePoints.some((point) => !pointInsideStormChain(point, segments, playerRadiusMetres));
}

/**
 * Clips the chain at the first intact cover intersection. Propagation ends at
 * that cover, so later hops cannot strike through an opaque obstacle.
 */
export function clipStormChainToCover(
  segments: readonly StormChainSegment[],
  obstacles: readonly ArenaObstacle[],
): readonly StormChainSegment[] {
  const visible: StormChainSegment[] = [];
  for (const segment of segments) {
    const hit = firstSegmentObstacleHit(segment.from, segment.to, obstacles);
    if (!hit) {
      visible.push(segment);
      continue;
    }
    visible.push({
      ...segment,
      to: hit.position,
      blockedByObstacleId: hit.obstacle.id,
    });
    break;
  }
  return visible;
}

/** Deterministic, collision-free two-node layout with a player-sized exit. */
export function planStormNodePlacement(
  origin: Readonly<Vector2Data>,
  player: Readonly<Vector2Data>,
  arena: Readonly<ArenaDefinition>,
  firstNodeId: number,
  playerRadiusMetres: number,
): StormNodePlacementPlan | null {
  const offsets: readonly Vector2Data[] = [
    { x: -3.2, y: -2.5 }, { x: 3.2, y: -2.5 },
    { x: 3.2, y: 2.5 }, { x: -3.2, y: 2.5 },
    { x: 0, y: -3.6 }, { x: 0, y: 3.6 },
  ];
  const candidates = offsets.map((offset) => ({
    x: clamp(player.x + offset.x, STORM_NODE_RADIUS_METRES, arena.widthMetres - STORM_NODE_RADIUS_METRES),
    y: clamp(player.y + offset.y, STORM_NODE_RADIUS_METRES, arena.heightMetres - STORM_NODE_RADIUS_METRES),
  })).filter((position, index, positions) => (
    !collidesWithObstacle(position, STORM_NODE_RADIUS_METRES, arena.obstacles)
    && Math.hypot(position.x - player.x, position.y - player.y) >= 1.8
    && Math.hypot(position.x - origin.x, position.y - origin.y) >= 1.8
    && positions.findIndex((other) => other.x === position.x && other.y === position.y) === index
  ));
  const escapeSamples = buildStormEscapeSamples(player, arena, 2.2, playerRadiusMetres);
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      if (Math.hypot(
        candidates[first]!.x - candidates[second]!.x,
        candidates[first]!.y - candidates[second]!.y,
      ) < 2.2) continue;
      const nodes = [
        createConductiveNode(firstNodeId, candidates[first]!),
        createConductiveNode(firstNodeId + 1, candidates[second]!),
      ];
      const chain = lockStormChain(origin, nodes);
      if (!chain) continue;
      const visibleSegments = clipStormChainToCover(chain.segments, arena.obstacles);
      if (!hasStormEscapeLane(escapeSamples, visibleSegments, playerRadiusMetres)) continue;
      return {
        nodes,
        chain: { ...chain, segments: visibleSegments },
        escapeSamples,
      };
    }
  }
  return null;
}

export function buildStormEscapeSamples(
  player: Readonly<Vector2Data>,
  arena: Readonly<ArenaDefinition>,
  distanceMetres: number,
  playerRadiusMetres: number,
): readonly Vector2Data[] {
  return [
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
    { x: Math.SQRT1_2, y: Math.SQRT1_2 }, { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: Math.SQRT1_2, y: -Math.SQRT1_2 }, { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  ].map((direction) => ({
    x: clamp(player.x + direction.x * distanceMetres, playerRadiusMetres, arena.widthMetres - playerRadiusMetres),
    y: clamp(player.y + direction.y * distanceMetres, playerRadiusMetres, arena.heightMetres - playerRadiusMetres),
  })).filter((position) => !collidesWithObstacle(position, playerRadiusMetres, arena.obstacles));
}

function firstSegmentObstacleHit(
  from: Readonly<Vector2Data>,
  to: Readonly<Vector2Data>,
  obstacles: readonly ArenaObstacle[],
): { obstacle: ArenaObstacle; position: Vector2Data; time: number } | null {
  let first: { obstacle: ArenaObstacle; position: Vector2Data; time: number } | null = null;
  for (const obstacle of obstacles) {
    const time = segmentRectangleEntryTime(from, to, obstacle);
    if (time === null || (first && time >= first.time)) continue;
    first = {
      obstacle,
      time,
      position: {
        x: from.x + (to.x - from.x) * time,
        y: from.y + (to.y - from.y) * time,
      },
    };
  }
  return first;
}

function segmentRectangleEntryTime(
  from: Readonly<Vector2Data>,
  to: Readonly<Vector2Data>,
  obstacle: Readonly<ArenaObstacle>,
): number | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let near = 0;
  let far = 1;
  for (const [start, delta, minimum, maximum] of [
    [from.x, dx, obstacle.x, obstacle.x + obstacle.width],
    [from.y, dy, obstacle.y, obstacle.y + obstacle.height],
  ] as const) {
    if (Math.abs(delta) <= Number.EPSILON) {
      if (start < minimum || start > maximum) return null;
      continue;
    }
    const a = (minimum - start) / delta;
    const b = (maximum - start) / delta;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return null;
  }
  return near >= 0 && near <= 1 ? near : null;
}

function distanceToSegment(
  point: Readonly<Vector2Data>,
  from: Readonly<Vector2Data>,
  to: Readonly<Vector2Data>,
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= Number.EPSILON) return Math.hypot(point.x - from.x, point.y - from.y);
  const projection = Math.max(0, Math.min(1, (
    (point.x - from.x) * dx + (point.y - from.y) * dy
  ) / lengthSquared));
  return Math.hypot(point.x - (from.x + dx * projection), point.y - (from.y + dy * projection));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
