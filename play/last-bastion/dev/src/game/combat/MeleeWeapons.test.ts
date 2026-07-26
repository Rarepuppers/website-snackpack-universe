import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";

/**
 * The close-quarters family exists because the rack had one melee option
 * against an arena whose whole pressure model is "things reach you". These
 * assert the archetypes are actually *different* — a family of six weapons that
 * all play the same is worse than one, because it dilutes every draw.
 */
const IDLE = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
  pausePressed: false, restartPressed: false,
};

const MELEE: readonly WeaponId[] = [
  "combat-knife", "machete", "fire-axe", "shock-baton", "breaching-maul", "plasma-saber",
];

function sim(weaponId: WeaponId) {
  return new CombatSimulation({
    autoStartWaves: false,
    startingBuild: {
      health: 30, shield: 0, level: 1, experience: 0, scrap: 0,
      weapons: [{ weaponId, tier: 1 }], upgrades: [],
    },
  });
}

describe("close-quarters weapon family", () => {
  it("is melee: every entry sweeps an arc at contact range", () => {
    for (const id of MELEE) {
      const stats = WEAPON_CATALOG[id];
      expect(stats.attackPattern, id).toBe("melee-sweep");
      expect(stats.meleeArcRadians, id).toBeGreaterThan(0);
      expect(stats.rangeMetres, id).toBeLessThanOrEqual(3);
    }
  });

  it("separates the thrust from the swing", () => {
    // A knife is a narrow, fast poke; a saber is a wide, slow cut. If these
    // converge the family stops being a choice.
    expect(WEAPON_CATALOG["combat-knife"].meleeArcRadians)
      .toBeLessThan(WEAPON_CATALOG["plasma-saber"].meleeArcRadians);
    expect(WEAPON_CATALOG["combat-knife"].fireIntervalSeconds)
      .toBeLessThan(WEAPON_CATALOG["plasma-saber"].fireIntervalSeconds);
  });

  it("gives each proc to exactly the weapon that advertises it", () => {
    expect(WEAPON_CATALOG["fire-axe"].damageType).toBe("fire");
    expect(WEAPON_CATALOG["plasma-saber"].damageType).toBe("fire");
    expect(WEAPON_CATALOG["shock-baton"].damageType).toBe("shock");
    expect(WEAPON_CATALOG["shock-baton"].chainCount).toBeGreaterThan(0);
    // The maul is the space-maker: hardest shove in the whole catalogue.
    const hardest = Math.max(...Object.values(WEAPON_CATALOG).map((w) => w.knockbackMetres));
    expect(WEAPON_CATALOG["breaching-maul"].knockbackMetres).toBe(hardest);
  });

  it("actually shoves bodies back — the maul harder than the knife", () => {
    const pushed = (weaponId: WeaponId): number => {
      const simulation = sim(weaponId);
      const player = simulation.snapshot().playerPosition;
      const start = { x: player.x + 1.2, y: player.y };
      const id = simulation.spawnEnemy("quillback", { ...start });
      for (let tick = 0; tick < 90; tick += 1) {
        simulation.step({ ...IDLE, fireHeld: true }, 0.05);
        const enemy = simulation.snapshot().enemies.find((e) => e.id === id);
        if (!enemy) break;
      }
      const enemy = simulation.snapshot().enemies.find((e) => e.id === id);
      // Distance from the player is the observable: knockback pushes outward.
      return enemy ? Math.hypot(enemy.position.x - player.x, enemy.position.y - player.y) : Infinity;
    };
    expect(pushed("breaching-maul")).toBeGreaterThan(pushed("combat-knife"));
  });

  it("breaks cover at wildly different rates", () => {
    // "Good at breaking walls" is a real knob, not flavour text.
    expect(WEAPON_CATALOG["breaching-maul"].terrainDamageMultiplier).toBeGreaterThan(3);
    expect(WEAPON_CATALOG["plasma-saber"].terrainDamageMultiplier).toBeGreaterThan(1);
    expect(WEAPON_CATALOG["combat-knife"].terrainDamageMultiplier).toBeLessThan(1);
  });
});
