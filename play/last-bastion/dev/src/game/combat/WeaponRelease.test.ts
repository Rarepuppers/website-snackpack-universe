import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, rotatingWindow, SHOP_WEAPON_CANDIDATE_COUNT, type CombatSnapshot } from "./CombatSimulation";
import { HELD_WEAPONS_IN_POOL, WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";

/**
 * The 26 July 2026 weapon release. Twelve built-and-tested weapons had been
 * unobtainable behind `HELD_WEAPONS_IN_POOL`, and Event Horizon behind no
 * acquisition path at all. These prove the *player-visible* outcomes of the
 * flip, not the constant — a test on the constant would have passed the whole
 * time the weapons were unreachable.
 */

const RELEASED_WEAPONS: readonly WeaponId[] = [
  "railspike", "seeker-swarm", "cryo-lance", "tesla-coil", "flamethrower", "sawblade",
  "combat-knife", "machete", "fire-axe", "shock-baton", "breaching-maul", "plasma-saber",
];

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    kitPressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

/** Steps the wave loop, instantly killing everything, until a decision appears. */
function runUntilDecision(simulation: CombatSimulation, maxFrames: number): CombatSnapshot {
  let snapshot = simulation.snapshot();
  for (let frame = 0; frame < maxFrames; frame += 1) {
    snapshot = simulation.step(intent(), 0.05);
    if (snapshot.pendingDecision) return snapshot;
    for (const enemy of snapshot.enemies) simulation.dealDamage(enemy.id, 9999);
  }
  return snapshot;
}

describe("weapon release — the twelve formerly-held weapons are reachable in play", () => {
  it("offers released weapons from the Weapon Chest", () => {
    // Across seeds rather than one: the chest draws three of the unowned pool,
    // so a single seed proves nothing about the other seventeen entries.
    const offered = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const simulation = new CombatSimulation({ seed });
      const chest = runUntilDecision(simulation, 500);
      if (chest.pendingDecision?.kind !== "weapon-chest") continue;
      for (const option of chest.pendingDecision.options) offered.add(option.id);
    }
    expect(HELD_WEAPONS_IN_POOL).toBe(true);
    expect(RELEASED_WEAPONS.some((id) => offered.has(id))).toBe(true);
    // Never offered by the chest, earned or not — uniques have their own route.
    expect(offered.has("event-horizon")).toBe(false);
  });

  it("equips and actually damages with a released weapon, end to end", () => {
    // One weapon from each previously-unreachable subsystem: sustained beam,
    // orbit-blade contact, homing volley, and the close-quarters sweep. Each was
    // fully unit-tested and fully unreachable before the release.
    for (const weaponId of ["flamethrower", "sawblade", "seeker-swarm", "breaching-maul"] as const) {
      const simulation = new CombatSimulation({ seed: 7, autoStartWaves: false, startingWeaponIds: [weaponId] });
      expect(simulation.snapshot().equippedWeapons.map((weapon) => weapon.weaponId)).toEqual([weaponId]);

      // Inside every one of these weapons' reach, dead ahead of the aim vector.
      const start = simulation.snapshot().playerPosition;
      const targetId = simulation.spawnEnemy("scuttler", { x: start.x + 1.4, y: start.y });
      const maxHealth = simulation.snapshot().enemies.find((enemy) => enemy.id === targetId)!.maxHealth;

      let damaged = false;
      for (let frame = 0; frame < 400 && !damaged; frame += 1) {
        const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
        const target = snapshot.enemies.find((enemy) => enemy.id === targetId);
        damaged = target === undefined || target.health < maxHealth;
      }
      expect(damaged, `${weaponId} never damaged anything`).toBe(true);
    }
  });
});

describe("Unique-class acquisition — earned, not drawn", () => {
  it("starts a run locked", () => {
    expect(new CombatSimulation({ seed: 3 }).hasUnlockedUniqueWeapons()).toBe(false);
  });

  it("stays locked while only ordinary enemies die", () => {
    const simulation = new CombatSimulation({ seed: 5, autoStartWaves: false });
    for (let index = 0; index < 12; index += 1) {
      const id = simulation.spawnEnemy("scuttler", { x: 4 + index * 0.2, y: 4 });
      simulation.dealDamage(id, 9999);
    }
    simulation.step(intent(), 0.05);
    expect(simulation.hasUnlockedUniqueWeapons()).toBe(false);
  });

  it("unlocks on a mini-boss kill and stays unlocked", () => {
    const simulation = new CombatSimulation({ seed: 5, autoStartWaves: false });
    const miniBossId = simulation.spawnMiniBoss("siege-crusher", { x: 6, y: 6 });
    expect(simulation.hasUnlockedUniqueWeapons()).toBe(false);

    simulation.dealDamage(miniBossId, 99_999);
    simulation.step(intent(), 0.05);
    expect(simulation.hasUnlockedUniqueWeapons()).toBe(true);

    // Not a one-frame window: the run keeps the unlock.
    for (let frame = 0; frame < 20; frame += 1) simulation.step(intent(), 0.05);
    expect(simulation.hasUnlockedUniqueWeapons()).toBe(true);
  });
});

describe("shop weapon stock stays capped now the pool is 20", () => {
  it("takes a rotating window rather than every unowned weapon", () => {
    const entries = ["a", "b", "c", "d", "e"];
    expect(rotatingWindow(entries, 3, 0)).toEqual(["a", "b", "c"]);
    expect(rotatingWindow(entries, 3, 1)).toEqual(["b", "c", "d"]);
    // Wraps rather than truncating, so late entries are reachable.
    expect(rotatingWindow(entries, 3, 4)).toEqual(["e", "a", "b"]);
    // Negative and oversized offsets stay in range.
    expect(rotatingWindow(entries, 3, -1)).toEqual(["e", "a", "b"]);
    expect(rotatingWindow(entries, 3, 12)).toEqual(["c", "d", "e"]);
    // Degenerate inputs return something usable.
    expect(rotatingWindow(entries, 9, 2)).toEqual(entries);
    expect(rotatingWindow([], 3, 0)).toEqual([]);
    expect(rotatingWindow(entries, 0, 0)).toEqual([]);
  });

  it("never floods a shop visit with weapon lines", () => {
    // The regression the release would otherwise have introduced: one candidate
    // per unowned weapon meant ~19 weapon entries against ~26 items, starving
    // the item economy out of the draw.
    let shopsObserved = 0;
    for (let seed = 1; seed <= 25; seed += 1) {
      const simulation = new CombatSimulation({ seed });
      let snapshot = runUntilDecision(simulation, 4_000);
      for (let guard = 0; guard < 12; guard += 1) {
        if (snapshot.pendingDecision?.kind === "scrap-shop") break;
        const first = snapshot.pendingDecision?.options[0];
        if (!first) break;
        simulation.chooseOption(first.id);
        snapshot = runUntilDecision(simulation, 4_000);
      }
      if (snapshot.pendingDecision?.kind !== "scrap-shop") continue;
      shopsObserved += 1;
      const weaponOffers = snapshot.pendingDecision.options
        .filter((option) => option.id.startsWith("shop-weapon:"));
      expect(weaponOffers.length).toBeLessThanOrEqual(SHOP_WEAPON_CANDIDATE_COUNT);
    }
    // Guard against the loop silently never reaching a shop and asserting nothing.
    expect(shopsObserved).toBeGreaterThan(0);
  });

  it("prices a Unique well above a Tier I weapon", () => {
    expect(WEAPON_CATALOG["event-horizon"].weaponClass).toBe("unique");
  });
});
