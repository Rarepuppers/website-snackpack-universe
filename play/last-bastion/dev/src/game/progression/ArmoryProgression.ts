import type { WeaponId } from "../content/weaponCatalog";
import type { HeroDefinition } from "../hero/HeroDefinition";
import type { RunSummary } from "../run/RunSummary";

export const COMMAND_MARKS_LABEL = "COMMAND MARKS";

export type ArmoryNodeId = "armory-scattergun" | "armory-arc-carbine" | "armory-patrol-blade" | "armory-assault-clearance" | "armory-tactician-clearance" | "armory-scout-clearance";

interface ArmoryNodeBase {
  readonly id: ArmoryNodeId;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly prerequisiteIds: readonly ArmoryNodeId[];
  readonly released: boolean;
}

export interface StartingWeaponArmoryNode extends ArmoryNodeBase {
  readonly kind: "starting-weapon";
  readonly startingWeaponId: WeaponId;
}

export interface HeroUnlockArmoryNode extends ArmoryNodeBase {
  readonly kind: "hero-unlock";
  readonly heroId: HeroDefinition["id"];
}

export type ArmoryNode = StartingWeaponArmoryNode | HeroUnlockArmoryNode;

/** C3 art, audio delivery, runtime wiring, and contextual listening accepted 9 Aug 2026. */
export const ASSAULT_DEPLOYMENT_RELEASED = true;
export const ASSAULT_UNLOCK_NODE_ID: ArmoryNodeId = "armory-assault-clearance";
/** Mechanics, C3 presentation, tuning, density, and contextual listening accepted 9 Aug 2026. */
export const TACTICIAN_DEPLOYMENT_RELEASED = true;
export const TACTICIAN_UNLOCK_NODE_ID: ArmoryNodeId = "armory-tactician-clearance";
/** Mechanics, C3 presentation, tuning, density, progression, and contextual listening accepted 9 Aug 2026. */
export const SCOUT_DEPLOYMENT_RELEASED = true;
export const SCOUT_UNLOCK_NODE_ID: ArmoryNodeId = "armory-scout-clearance";

/**
 * A deliberately modest first tree: every purchase exposes a real starting
 * loadout instead of a promise of future content. Purchases are permanent so
 * the set can be union-merged safely across Steam Cloud devices.
 */
const ARMORY_NODE_CATALOG: readonly ArmoryNode[] = Object.freeze([
  Object.freeze({
    id: "armory-scattergun",
    kind: "starting-weapon",
    name: "CLOSE-QUARTERS KIT",
    description: "Begin a new run with the Scattergun.",
    cost: 5,
    prerequisiteIds: Object.freeze([]) as readonly ArmoryNodeId[],
    released: true,
    startingWeaponId: "scattergun",
  }),
  Object.freeze({
    id: "armory-arc-carbine",
    kind: "starting-weapon",
    name: "SHOCK DOCTRINE",
    description: "Begin a new run with the Arc Carbine.",
    cost: 8,
    prerequisiteIds: Object.freeze(["armory-scattergun"] as ArmoryNodeId[]),
    released: true,
    startingWeaponId: "arc-carbine",
  }),
  Object.freeze({
    id: "armory-patrol-blade",
    kind: "starting-weapon",
    name: "BREACH PROTOCOL",
    description: "Begin a new run with the Patrol Blade.",
    cost: 12,
    prerequisiteIds: Object.freeze(["armory-scattergun"] as ArmoryNodeId[]),
    released: true,
    startingWeaponId: "patrol-blade",
  }),
  Object.freeze({
    id: ASSAULT_UNLOCK_NODE_ID,
    kind: "hero-unlock",
    name: "ASSAULT CLEARANCE",
    description: "Authorize Assault for future deployments.",
    cost: 18,
    prerequisiteIds: Object.freeze(["armory-patrol-blade"] as ArmoryNodeId[]),
    released: ASSAULT_DEPLOYMENT_RELEASED,
    heroId: "assault",
  }),
  Object.freeze({
    id: TACTICIAN_UNLOCK_NODE_ID,
    kind: "hero-unlock",
    name: "TACTICIAN CLEARANCE",
    description: "Authorize Tactician for future deployments.",
    cost: 22,
    prerequisiteIds: Object.freeze(["armory-arc-carbine"] as ArmoryNodeId[]),
    released: TACTICIAN_DEPLOYMENT_RELEASED,
    heroId: "tactician",
  }),
  Object.freeze({
    id: SCOUT_UNLOCK_NODE_ID,
    kind: "hero-unlock",
    name: "SCOUT CLEARANCE",
    description: "Authorize Scout for future deployments.",
    cost: 20,
    prerequisiteIds: Object.freeze(["armory-arc-carbine", "armory-patrol-blade"] as ArmoryNodeId[]),
    released: SCOUT_DEPLOYMENT_RELEASED,
    heroId: "scout",
  }),
]);

/** Only released nodes render in the Armory or accept purchases. */
export const ARMORY_NODES: readonly ArmoryNode[] = Object.freeze(ARMORY_NODE_CATALOG.filter((node) => node.released));

const NODE_BY_ID = new Map(ARMORY_NODE_CATALOG.map((node) => [node.id, node]));

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
  return node.released
    && !purchased.has(id)
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
  if (selectedId === null || !purchasedIds.includes(selectedId)) return null;
  const node = armoryNode(selectedId);
  return node.kind === "starting-weapon" ? node.startingWeaponId : null;
}

export function canSelectArmoryNode(id: ArmoryNodeId): boolean {
  return armoryNode(id).kind === "starting-weapon";
}

export function isHeroDeploymentUnlocked(
  heroId: HeroDefinition["id"],
  purchasedIds: readonly ArmoryNodeId[],
): boolean {
  if (heroId === "marine" || heroId === "medic") return true;
  if (heroId === "assault") {
    return ASSAULT_DEPLOYMENT_RELEASED && normalizePurchasedArmoryNodeIds(purchasedIds).includes(ASSAULT_UNLOCK_NODE_ID);
  }
  if (heroId === "tactician") {
    return TACTICIAN_DEPLOYMENT_RELEASED && normalizePurchasedArmoryNodeIds(purchasedIds).includes(TACTICIAN_UNLOCK_NODE_ID);
  }
  if (heroId === "scout") {
    return SCOUT_DEPLOYMENT_RELEASED && normalizePurchasedArmoryNodeIds(purchasedIds).includes(SCOUT_UNLOCK_NODE_ID);
  }
  return false;
}

export function assaultUnlockRequirementText(): string {
  const node = armoryNode(ASSAULT_UNLOCK_NODE_ID);
  return node.released
    ? `Purchase ${node.name} for ${node.cost} Command Marks after ${armoryNode(node.prerequisiteIds[0]!).name}.`
    : `C3 audio acceptance pending. Then purchase ${node.name} for ${node.cost} Command Marks after ${armoryNode(node.prerequisiteIds[0]!).name}.`;
}

export function tacticianUnlockRequirementText(): string {
  const node = armoryNode(TACTICIAN_UNLOCK_NODE_ID);
  return node.released
    ? `Purchase ${node.name} for ${node.cost} Command Marks after ${armoryNode(node.prerequisiteIds[0]!).name}.`
    : `C3 acceptance pending. Then purchase ${node.name} for ${node.cost} Command Marks after ${armoryNode(node.prerequisiteIds[0]!).name}.`;
}

export function scoutUnlockRequirementText(): string {
  const node = armoryNode(SCOUT_UNLOCK_NODE_ID);
  const prerequisiteNames = node.prerequisiteIds.map((id) => armoryNode(id).name).join(" and ");
  return node.released
    ? `Purchase ${node.name} for ${node.cost} Command Marks after ${prerequisiteNames}.`
    : `C3 audio acceptance pending. Then purchase ${node.name} for ${node.cost} Command Marks after ${prerequisiteNames}.`;
}
