import type { EliteKind } from "../combat/EliteCadence";
import type { MiniBossKind } from "../combat/CombatSimulation";
import type { ExpeditionNode } from "./ExpeditionMap";
import { buildExpeditionWavePlan, type ExpeditionWavePlan } from "./ExpeditionNodeDirector";

export type ExpeditionEncounterKind =
  | "combat"
  | "elite"
  | "mini-boss"
  | "supply-depot"
  | "weapon-cache"
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
  waves: readonly ExpeditionWavePlan[];
}

const ELITES: readonly EliteKind[] = [
  "carapace-scuttler", "razorlord", "blightspitter", "quillback-matriarch",
];
const MINI_BOSSES: readonly MiniBossKind[] = [
  "siege-crusher", "brood-warden", "rift-stalker",
];

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
  const miniBossKind = node.type === "mini-boss" ? MINI_BOSSES[seed % MINI_BOSSES.length]! : null;
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
