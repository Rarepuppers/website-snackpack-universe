import type { WeaponId } from "../content/weaponCatalog";
import type { RunSummary } from "../run/RunSummary";

export const COMMAND_MARKS_LABEL = "COMMAND MARKS";

export type ArmoryNodeId = "armory-scattergun" | "armory-arc-carbine" | "armory-patrol-blade";

export interface ArmoryNode {
  readonly id: ArmoryNodeId;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly prerequisiteIds: readonly ArmoryNodeId[];
  readonly startingWeaponId: WeaponId;
}

/**
 * A deliberately modest first tree: every purchase exposes a real starting
 * loadout instead of a promise of future content. Purchases are permanent so
 * the set can be union-merged safely across Steam Cloud devices.
 */
export const ARMORY_NODES: readonly ArmoryNode[] = Object.freeze([
  Object.freeze({
    id: "armory-scattergun",
    name: "CLOSE-QUARTERS KIT",
    description: "Begin a new run with the Scattergun.",
    cost: 5,
    prerequisiteIds: Object.freeze([]) as readonly ArmoryNodeId[],
    startingWeaponId: "scattergun",
  }),
  Object.freeze({
    id: "armory-arc-carbine",
    name: "SHOCK DOCTRINE",
    description: "Begin a new run with the Arc Carbine.",
    cost: 8,
    prerequisiteIds: Object.freeze(["armory-scattergun"] as ArmoryNodeId[]),
    startingWeaponId: "arc-carbine",
  }),
  Object.freeze({
    id: "armory-patrol-blade",
    name: "BREACH PROTOCOL",
    description: "Begin a new run with the Patrol Blade.",
    cost: 12,
    prerequisiteIds: Object.freeze(["armory-scattergun"] as ArmoryNodeId[]),
    startingWeaponId: "patrol-blade",
  }),
]);

const NODE_BY_ID = new Map(ARMORY_NODES.map((node) => [node.id, node]));

export function isArmoryNodeId(value: unknown): value is ArmoryNodeId {
  return typeof value === "string" && NODE_BY_ID.has(value as ArmoryNodeId);
}

export function normalizePurchasedArmoryNodeIds(value: unknown): ArmoryNodeId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isArmoryNodeId))];
}

export function armoryNode(id: ArmoryNodeId): ArmoryNode {
  return NODE_BY_ID.get(id)!;
}

export function commandMarksSpent(purchasedIds: readonly ArmoryNodeId[]): number {
  return normalizePurchasedArmoryNodeIds(purchasedIds)
    .reduce((total, id) => total + armoryNode(id).cost, 0);
}

export function commandMarksBalance(lifetimeEarned: number, purchasedIds: readonly ArmoryNodeId[]): number {
  return Math.max(0, Math.floor(lifetimeEarned) - commandMarksSpent(purchasedIds));
}

export function canPurchaseArmoryNode(
  id: ArmoryNodeId,
  lifetimeEarned: number,
  purchasedIds: readonly ArmoryNodeId[],
): boolean {
  const purchased = new Set(purchasedIds);
  const node = armoryNode(id);
  return !purchased.has(id)
    && node.prerequisiteIds.every((required) => purchased.has(required))
    && commandMarksBalance(lifetimeEarned, purchasedIds) >= node.cost;
}

/** Deterministic, capped run award; no random or wall-clock component. */
export function commandMarksForRun(summary: RunSummary): number {
  if (summary.mode === "quick-drop") {
    return Math.min(5, 1 + Math.floor(summary.waveReached / 5) + (summary.outcome === "victory" ? 2 : 0));
  }
  const completion = Math.max(1, Math.floor(summary.nodesCleared / 4));
  const victory = summary.outcome === "victory" ? 4 : 0;
  const threat = summary.threatTier ?? 0;
  return Math.min(12, completion + victory + threat);
}

export function selectedArmoryWeapon(
  selectedId: ArmoryNodeId | null,
  purchasedIds: readonly ArmoryNodeId[],
): WeaponId | null {
  return selectedId !== null && purchasedIds.includes(selectedId)
    ? armoryNode(selectedId).startingWeaponId
    : null;
}
