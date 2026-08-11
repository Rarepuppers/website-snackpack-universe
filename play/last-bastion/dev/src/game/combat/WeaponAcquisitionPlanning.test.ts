import { describe, expect, it } from "vitest";
import type { WeaponRackSlot, WeaponTile } from "../equipment/WeaponInventory";
import {
  canAdmitWeapon,
  planWeaponAcquisitionDestination,
  planWeaponInitialization,
} from "./WeaponAcquisitionPlanning";

const tile: WeaponTile = {
  instanceId: 1,
  weaponId: "bastion-service-rifle",
  weaponClass: "light",
  tier: 1,
};

describe("weapon-acquisition admission", () => {
  it("admits strictly below the equipped cap", () => {
    expect(canAdmitWeapon({ equippedWeaponCount: 11, maximumEquippedWeapons: 12 })).toBe(true);
    expect(canAdmitWeapon({ equippedWeaponCount: 12, maximumEquippedWeapons: 12 })).toBe(false);
  });
});

describe("weapon-acquisition destination planning", () => {
  it("chooses the first empty compatible rack slot", () => {
    const rack: WeaponRackSlot[] = [
      { id: "heavy", weaponClass: "heavy", tile: null },
      { id: "full", weaponClass: "all", tile },
      { id: "open", weaponClass: "all", tile: null },
    ];
    expect(planWeaponAcquisitionDestination({ weaponClass: "light", rack, stash: [null] }))
      .toEqual({ kind: "rack", slotIndex: 2 });
  });

  it("falls back to the first empty stash slot, then none when full", () => {
    const rack: WeaponRackSlot[] = [{ id: "heavy", weaponClass: "heavy", tile: null }];
    expect(planWeaponAcquisitionDestination({ weaponClass: "light", rack, stash: [tile, null] }))
      .toEqual({ kind: "stash", slotIndex: 1 });
    expect(planWeaponAcquisitionDestination({ weaponClass: "light", rack, stash: [tile] }))
      .toEqual({ kind: "none" });
  });
});

describe("weapon tile and runtime initialization", () => {
  it("builds tier-one tile and deterministic runtime state", () => {
    const plan = planWeaponInitialization({ instanceId: 7, weaponId: "scattergun" });
    expect(plan.tile).toEqual({
      instanceId: 7,
      weaponId: "scattergun",
      weaponClass: "heavy",
      tier: 1,
    });
    expect(plan.runtimeWeapon).toMatchObject({
      instanceId: 7,
      weaponId: "scattergun",
      cooldownSeconds: 0,
      cooldownDurationSeconds: 0,
      orbitAngleRadians: 0,
    });
    expect(plan.runtimeWeapon.projectileCarry).toBeCloseTo(0.59);
  });

  it("copies catalogue stats instead of returning the canonical object", () => {
    const first = planWeaponInitialization({ instanceId: 1, weaponId: "scattergun" });
    const second = planWeaponInitialization({ instanceId: 2, weaponId: "scattergun" });
    expect(first.runtimeWeapon.stats).toEqual(second.runtimeWeapon.stats);
    expect(first.runtimeWeapon.stats).not.toBe(second.runtimeWeapon.stats);
  });
});
