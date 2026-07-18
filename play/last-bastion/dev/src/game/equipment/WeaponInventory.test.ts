import { describe, expect, it } from "vitest";
import {
  createWeaponInventory,
  findMergePair,
  placeWeapon,
  type WeaponTile,
} from "./WeaponInventory";

const rifle = (instanceId: number, tier: 1 | 2 | 3 = 1): WeaponTile => ({
  instanceId,
  weaponId: "bastion-service-rifle",
  weaponClass: "medium",
  tier,
});

describe("weapon placement, inventory, and merge gate", () => {
  it("enforces typed rack slots and keeps a displaced tile in the stash", () => {
    const state = createWeaponInventory(["medium", "light", "heavy", "all"], [rifle(1)]);
    const illegal = placeWeapon(state, { ...rifle(2), weaponClass: "heavy", weaponId: "scattergun" }, { kind: "rack", slotId: "rack-2" });
    expect(illegal.ok).toBe(false);
    expect(illegal).toMatchObject({ reason: "illegal-slot" });

    const swapped = placeWeapon(state, rifle(2), { kind: "rack", slotId: "rack-1" });
    expect(swapped.ok).toBe(true);
    if (swapped.ok) {
      expect(swapped.state.rack[0]?.tile?.instanceId).toBe(2);
      expect(swapped.state.stash[0]?.instanceId).toBe(1);
    }
  });

  it("allows a duplicate to merge, caps at tier III, and frees one tile", () => {
    const state = createWeaponInventory(["medium"], [rifle(1)]);
    expect(findMergePair(state, rifle(2))).toEqual({ kind: "merge", slotId: "rack-1", inventoryIndex: null });
    const merged = placeWeapon(state, rifle(2), { kind: "merge", slotId: "rack-1", inventoryIndex: null });
    expect(merged.ok).toBe(true);
    if (merged.ok) expect(merged.state.rack[0]?.tile?.tier).toBe(2);
    const capped = createWeaponInventory(["medium"], [rifle(1, 3)]);
    expect(findMergePair(capped, rifle(2, 3))).toBeNull();
  });

  it("never silently loses a tile when rack and stash are full", () => {
    const equipped = [rifle(1), rifle(2), rifle(3), rifle(4), rifle(5)];
    const state = createWeaponInventory(["medium", "medium", "medium", "medium", "medium"], equipped);
    state.stash = [rifle(6), rifle(7), rifle(8), rifle(9)];
    const result = placeWeapon(state, rifle(10), { kind: "rack", slotId: "rack-1" });
    expect(result).toMatchObject({ ok: false, reason: "stash-full" });
  });
});
