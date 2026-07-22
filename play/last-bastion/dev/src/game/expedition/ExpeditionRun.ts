import {
  expeditionNodeById,
  generateExpeditionMap,
  reachableNodes,
  type ExpeditionMapData,
} from "./ExpeditionMap";
import { EMPTY_RUN_METRICS, mergeRunMetrics, type RunMetrics } from "../run/RunSummary";
import {
  cloneTransformationAffinityState,
  type TransformationAffinityState,
} from "../transformations/TransformationAffinity";

/**
 * Mid-run expedition state (Task 38): which chart the run is on, where the
 * dropship sits, and what has been cleared. Pure and Phaser-free so traversal
 * legality and save round-trips are unit-testable. Node → encounter wiring
 * (Task 39) consumes `moveTo`; until then the map screen advances directly.
 *
 * The build snapshot carries the hero between encounters once Task 39 lands;
 * the schema exists now so save version 2 never needs a second migration.
 */
export interface ExpeditionBuildSnapshot {
  health: number;
  shield: number;
  level: number;
  experience: number;
  scrap: number;
  /** Equipped weapon ids with their merge tiers, rack order preserved. */
  weapons: readonly { weaponId: string; tier: number }[];
  /** Taken upgrade ids with levels. */
  upgrades: readonly { upgradeId: string; level: number }[];
  /** Optional only for migration compatibility; every newly completed node writes it. */
  transformation?: TransformationAffinityState;
}

export interface ExpeditionRunState {
  mapSeed: number;
  currentNodeId: number;
  clearedNodeIds: readonly number[];
  build: ExpeditionBuildSnapshot | null;
  metrics: RunMetrics;
}

export interface ExpeditionRun {
  map: ExpeditionMapData;
  state: ExpeditionRunState;
}

export function startExpeditionRun(mapSeed: number): ExpeditionRun {
  const map = generateExpeditionMap(mapSeed);
  return {
    map,
    state: {
      mapSeed,
      currentNodeId: map.startNodeId,
      clearedNodeIds: [map.startNodeId],
      build: null,
      metrics: cloneMetrics(EMPTY_RUN_METRICS),
    },
  };
}

/**
 * Restores a run from persisted state. Returns null when the state no longer
 * matches a valid chart position (foreign seed data, edited storage), so a
 * corrupt save degrades to "no run in progress" rather than a broken screen.
 */
export function resumeExpeditionRun(state: ExpeditionRunState): ExpeditionRun | null {
  const map = generateExpeditionMap(state.mapSeed);
  const current = expeditionNodeById(map, state.currentNodeId);
  if (!current) {
    return null;
  }
  const validIds = new Set(map.nodes.map((node) => node.id));
  if (!state.clearedNodeIds.every((id) => validIds.has(id))) {
    return null;
  }
  const cleared = new Set(state.clearedNodeIds);
  const currentIsCleared = cleared.has(state.currentNodeId);
  const currentIsPending = map.nodes.some((node) => (
    cleared.has(node.id) && node.next.includes(state.currentNodeId)
  ));
  if (!currentIsCleared && !currentIsPending) {
    return null;
  }
  return {
    map,
    state: {
      ...state,
      clearedNodeIds: [...state.clearedNodeIds],
      metrics: cloneMetrics(state.metrics ?? EMPTY_RUN_METRICS),
    },
  };
}

/** Nodes the dropship may travel to from its current position. */
export function selectableNodeIds(run: ExpeditionRun): readonly number[] {
  if (!run.state.clearedNodeIds.includes(run.state.currentNodeId)) {
    return [];
  }
  return reachableNodes(run.map, run.state.currentNodeId).map((node) => node.id);
}

/**
 * Travels to a reachable node, marking it cleared. Returns null for illegal
 * targets — the screen must never be able to teleport the dropship.
 */
export function moveToNode(run: ExpeditionRun, nodeId: number): ExpeditionRun | null {
  if (!selectableNodeIds(run).includes(nodeId)) {
    return null;
  }
  return {
    map: run.map,
    state: {
      ...run.state,
      currentNodeId: nodeId,
      clearedNodeIds: [...run.state.clearedNodeIds],
    },
  };
}

/** Commits a successful node and the build that leaves it. Idempotent. */
export function completeCurrentNode(
  run: ExpeditionRun,
  build: ExpeditionBuildSnapshot,
  encounterMetrics: RunMetrics = EMPTY_RUN_METRICS,
): ExpeditionRun {
  const clearedNodeIds = run.state.clearedNodeIds.includes(run.state.currentNodeId)
    ? [...run.state.clearedNodeIds]
    : [...run.state.clearedNodeIds, run.state.currentNodeId];
  return {
    map: run.map,
    state: {
      ...run.state,
      clearedNodeIds,
      build: cloneBuild(build),
      metrics: mergeRunMetrics(run.state.metrics, encounterMetrics),
    },
  };
}

export function hasPendingEncounter(run: ExpeditionRun): boolean {
  return !run.state.clearedNodeIds.includes(run.state.currentNodeId);
}

/** The run completes when the boss node has been cleared. */
export function isExpeditionComplete(run: ExpeditionRun): boolean {
  return run.state.clearedNodeIds.includes(run.map.bossNodeId);
}

/**
 * Chart regions for presentation: current pulses, reachable glow, cleared
 * dims with a stamp, and everything not on a forward path greys out.
 */
export type NodePresentation = "current" | "reachable" | "cleared" | "open" | "unreachable";

export function nodePresentation(run: ExpeditionRun, nodeId: number): NodePresentation {
  if (nodeId === run.state.currentNodeId) {
    return "current";
  }
  if (selectableNodeIds(run).includes(nodeId)) {
    return "reachable";
  }
  if (run.state.clearedNodeIds.includes(nodeId)) {
    return "cleared";
  }
  return forwardNodeIds(run).has(nodeId) ? "open" : "unreachable";
}

/** Every node still reachable by travelling forward from the current node. */
function forwardNodeIds(run: ExpeditionRun): ReadonlySet<number> {
  const seen = new Set<number>();
  const queue = [...selectableNodeIds(run)];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const node = expeditionNodeById(run.map, id);
    for (const next of node?.next ?? []) {
      queue.push(next);
    }
  }
  return seen;
}

function cloneBuild(build: ExpeditionBuildSnapshot): ExpeditionBuildSnapshot {
  return {
    ...build,
    weapons: build.weapons.map((weapon) => ({ ...weapon })),
    upgrades: build.upgrades.map((upgrade) => ({ ...upgrade })),
    transformation: cloneTransformationAffinityState(build.transformation),
  };
}

function cloneMetrics(metrics: RunMetrics): RunMetrics {
  return {
    kills: metrics.kills,
    scrapEarned: metrics.scrapEarned,
    damageByWeapon: { ...metrics.damageByWeapon },
  };
}
