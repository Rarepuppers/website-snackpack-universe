import type { WeaponClass } from "../hero/HeroDefinition";
import type { WeaponId } from "../content/weaponCatalog";

export const WEAPON_INVENTORY_CAPACITY = 4;

export type WeaponTier = 1 | 2 | 3;
export type WeaponPlacementTarget =
  | { kind: "rack"; slotId: string }
  | { kind: "inventory"; slotIndex: number }
  | { kind: "discard" }
  | { kind: "merge"; slotId: string | null; inventoryIndex: number | null };

export interface WeaponTile {
  instanceId: number;
  weaponId: WeaponId;
  weaponClass: WeaponClass;
  tier: WeaponTier;
}

export interface WeaponRackSlot {
  id: string;
  weaponClass: WeaponClass | "all";
  tile: WeaponTile | null;
}

export interface WeaponInventoryState {
  rack: WeaponRackSlot[];
  stash: Array<WeaponTile | null>;
  nextInstanceId: number;
}

export type WeaponPlacementFailure =
  | "invalid-target"
  | "illegal-slot"
  | "stash-full"
  | "inventory-full"
  | "merge-not-available";

export type WeaponPlacementResult =
  | { ok: true; state: WeaponInventoryState; merged: boolean; discarded: boolean }
  | { ok: false; reason: WeaponPlacementFailure };

export function createWeaponInventory(
  rackClasses: readonly (WeaponClass | "all")[],
  equipped: readonly WeaponTile[] = [],
  stashCapacity = WEAPON_INVENTORY_CAPACITY,
): WeaponInventoryState {
  const rack: WeaponRackSlot[] = rackClasses.map((weaponClass, index) => ({
    id: `rack-${index + 1}`,
    weaponClass,
    tile: null,
  }));
  const stash: Array<WeaponTile | null> = Array.from(
    { length: Math.max(0, Math.floor(stashCapacity)) },
    () => null,
  );
  for (const tile of equipped) {
    const slot = rack.find((candidate) => candidate.tile === null && slotAcceptsWeapon(candidate, tile));
    if (slot) slot.tile = tile;
    else {
      const stashIndex = stash.findIndex((candidate) => candidate === null);
      if (stashIndex >= 0) stash[stashIndex] = tile;
    }
  }
  const nextInstanceId = equipped.reduce((max, tile) => Math.max(max, tile.instanceId), 0) + 1;
  return { rack, stash, nextInstanceId };
}

export function slotAcceptsWeapon(slot: WeaponRackSlot, tile: WeaponTile): boolean {
  return slot.weaponClass === "all" || slot.weaponClass === tile.weaponClass;
}

export function findMergePair(state: WeaponInventoryState, tile: WeaponTile): WeaponPlacementTarget | null {
  if (tile.tier >= 3) return null;
  const rack = state.rack.find((slot) => (
    slot.tile?.weaponId === tile.weaponId && slot.tile.tier === tile.tier
  ));
  if (rack) return { kind: "merge", slotId: rack.id, inventoryIndex: null };
  const inventoryIndex = state.stash.findIndex((candidate) => (
    candidate?.weaponId === tile.weaponId && candidate.tier === tile.tier
  ));
  return inventoryIndex >= 0 ? { kind: "merge", slotId: null, inventoryIndex } : null;
}

export function placeWeapon(
  state: WeaponInventoryState,
  incoming: WeaponTile,
  target: WeaponPlacementTarget,
): WeaponPlacementResult {
  const next = cloneState(state);
  if (target.kind === "discard") return { ok: true, state: next, merged: false, discarded: true };

  if (target.kind === "merge") {
    return mergeIncoming(next, incoming, target);
  }

  if (target.kind === "inventory") {
    if (!Number.isInteger(target.slotIndex) || target.slotIndex < 0 || target.slotIndex >= next.stash.length) {
      return { ok: false, reason: "invalid-target" };
    }
    if (next.stash[target.slotIndex]) return { ok: false, reason: "inventory-full" };
    next.stash[target.slotIndex] = incoming;
    return { ok: true, state: next, merged: false, discarded: false };
  }

  const slot = next.rack.find((candidate) => candidate.id === target.slotId);
  if (!slot) return { ok: false, reason: "invalid-target" };
  if (!slotAcceptsWeapon(slot, incoming)) return { ok: false, reason: "illegal-slot" };
  if (!slot.tile) {
    slot.tile = incoming;
    return { ok: true, state: next, merged: false, discarded: false };
  }

  const stashIndex = next.stash.findIndex((candidate) => candidate === null);
  if (stashIndex < 0) return { ok: false, reason: "stash-full" };
  next.stash[stashIndex] = slot.tile;
  slot.tile = incoming;
  return { ok: true, state: next, merged: false, discarded: false };
}

function mergeIncoming(
  state: WeaponInventoryState,
  incoming: WeaponTile,
  target: Extract<WeaponPlacementTarget, { kind: "merge" }>,
): WeaponPlacementResult {
  const existing = target.slotId
    ? state.rack.find((slot) => slot.id === target.slotId)?.tile ?? null
    : target.inventoryIndex === null ? null : state.stash[target.inventoryIndex] ?? null;
  if (!existing || existing.weaponId !== incoming.weaponId || existing.tier !== incoming.tier || existing.tier >= 3) {
    return { ok: false, reason: "merge-not-available" };
  }
  const merged: WeaponTile = { ...incoming, tier: (incoming.tier + 1) as WeaponTier };
  if (target.slotId) {
    const slot = state.rack.find((candidate) => candidate.id === target.slotId)!;
    slot.tile = merged;
  } else {
    state.stash[target.inventoryIndex!] = merged;
  }
  return { ok: true, state, merged: true, discarded: false };
}

function cloneState(state: WeaponInventoryState): WeaponInventoryState {
  return {
    rack: state.rack.map((slot) => ({ ...slot, tile: slot.tile ? { ...slot.tile } : null })),
    stash: state.stash.map((tile) => tile ? { ...tile } : null),
    nextInstanceId: state.nextInstanceId,
  };
}
