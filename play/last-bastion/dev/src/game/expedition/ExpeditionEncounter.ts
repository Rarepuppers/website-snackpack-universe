import type { EliteKind } from "../combat/EliteCadence";
import type { MiniBossKind } from "../combat/CombatSimulation";
import type { ExpeditionNode } from "./ExpeditionMap";
import { buildExpeditionWavePlan, type ExpeditionWavePlan } from "./ExpeditionNodeDirector";
import { selectEncounterEvent, type EncounterEventKind } from "./EncounterEventCatalog";

export type ExpeditionEncounterKind =
  | "combat"
  | "elite"
  | "mini-boss"
  | "supply-depot"
  | "weapon-cache"
  | "shrine"
  | "event"
  | "boss";

export interface ExpeditionEncounterDescriptor {
  nodeId: number;
  kind: ExpeditionEncounterKind;
  column: number;
  themeId: string;
  seed: number;
  /** Existing density-wave index used as Task 39's depth budget bridge. */
  directorWaveIndex: number;
  threatBudget: number;
  eliteKind: EliteKind | null;
  miniBossKind: MiniBossKind | null;
  /** Shrine/Event nodes resolve to a specific catalogue card; null otherwise. */
  eventId: string | null;
  waves: readonly ExpeditionWavePlan[];
}

const ELITES: readonly EliteKind[] = [
  "carapace-scuttler", "razorlord", "blightspitter", "quillback-matriarch",
];

/**
 * Mini-boss pool, tiered by depth so the difficulty curve holds after the
 * 23 July 2026 acceptance-backlog promotion. The original three (lighter,
 * 300–460 health) cover the earliest mini-boss nodes; the four apex bosses
 * promoted from the held pool (Synapse Herald, Assembly Prime, Storm Regent,
 * Abomination Prime, 560–920 health) only join from the late columns where a
 * built-up rack can answer them. Their 45–90-second fight feel remains a
 * playtest confirmation, but they are now reachable in an ordinary run.
 */
const EARLY_MINI_BOSSES: readonly MiniBossKind[] = [
  "siege-crusher", "brood-warden", "rift-stalker",
];
const APEX_MINI_BOSSES: readonly MiniBossKind[] = [
  "synapse-herald", "assembly-prime", "storm-regent", "abomination-prime",
];
/** Column at or beyond which the heavier apex bosses become eligible. */
const APEX_MINI_BOSS_COLUMN = 5;

function miniBossPoolForColumn(column: number): readonly MiniBossKind[] {
  return column >= APEX_MINI_BOSS_COLUMN
    ? [...EARLY_MINI_BOSSES, ...APEX_MINI_BOSSES]
    : EARLY_MINI_BOSSES;
}

/** Deterministic bridge from one chart node to an existing encounter family. */
export function expeditionEncounterForNode(
  mapSeed: number,
  node: ExpeditionNode,
): ExpeditionEncounterDescriptor {
  const seed = mixSeed(mapSeed, node.id, node.column);
  const baseBudget = [30, 45, 65, 90, 120, 120, 150, 180][Math.max(0, Math.min(7, node.column))]!;
  const threatBudget = node.type === "combat" ? baseBudget
    : node.type === "elite" ? Math.round(baseBudget * 0.8) + 15
      : node.type === "mini-boss" ? Math.round(baseBudget * 0.6) + 40
        : node.type === "boss" ? 40 : 0;
  const eliteKind = node.type === "elite" ? ELITES[seed % ELITES.length]! : null;
  const miniBossPool = miniBossPoolForColumn(node.column);
  const miniBossKind = node.type === "mini-boss" ? miniBossPool[seed % miniBossPool.length]! : null;
  const eventId = node.type === "shrine" || node.type === "event"
    ? selectEncounterEvent(node.type as EncounterEventKind, seed, node.column)?.id ?? null
    : null;
  const waves = buildExpeditionWavePlan(node.type, node.column, eliteKind, miniBossKind);
  return {
    nodeId: node.id,
    kind: node.type,
    column: node.column,
    themeId: node.themeId,
    seed,
    directorWaveIndex: Math.max(0, Math.min(8, node.column)),
    threatBudget: waves[0]?.threatBudget ?? threatBudget,
    eliteKind,
    miniBossKind,
    eventId,
    waves,
  };
}

/** Route hand-off keeps the node id explicit while the save remains authority. */
export function expeditionEncounterUrl(descriptor: ExpeditionEncounterDescriptor): string {
  const params = new URLSearchParams({
    screen: "game",
    expedition: "1",
    node: String(descriptor.nodeId),
    theme: descriptor.themeId,
    worldseed: String(descriptor.seed),
  });
  return `?${params.toString()}`;
}

function mixSeed(mapSeed: number, nodeId: number, column: number): number {
  let value = (Math.floor(mapSeed) ^ Math.imul(nodeId + 1, 0x45d9f3b)) >>> 0;
  value = (Math.imul(value ^ (value >>> 16), 0x45d9f3b) + column * 97) >>> 0;
  return value || 1;
}
