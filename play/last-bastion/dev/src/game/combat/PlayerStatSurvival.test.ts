import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";
import type { PlayerIntent } from "../input/PlayerIntent";

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

function build(overrides: Partial<ExpeditionBuildSnapshot> = {}): ExpeditionBuildSnapshot {
  return {
    health: 10,
    shield: 0,
    level: 1,
    experience: 0,
    scrap: 0,
    weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
    upgrades: [],
    ...overrides,
  };
}

function sim(itemStats?: Partial<PlayerStatBlock>): CombatSimulation {
  return new CombatSimulation({ autoStartWaves: false, startingBuild: build(itemStats ? { itemStats } : {}) });
}

describe("PlayerStatBlock survival/economy stats reach combat (Phase 1)", () => {
  it("max-HP flat and percent both raise the ceiling (flat added before the percent scales)", () => {
    const base = sim().snapshot().playerMaxHealth;
    expect(sim({ maxHpFlat: 20 }).snapshot().playerMaxHealth).toBe(base + 20);
    // percent is of the flat-adjusted base; +50% of (10 base) = 15.
    expect(sim({ maxHpPercent: 50 }).snapshot().playerMaxHealth).toBe(Math.max(3, base * 1.5));
    expect(sim({ maxHpFlat: 10, maxHpPercent: 50 }).snapshot().playerMaxHealth).toBe(Math.max(3, (base + 10) * 1.5));
  });

  it("flat armour mitigates more incoming damage", () => {
    const baseline = sim();
    const armoured = sim({ armourFlat: 8 });
    for (const s of [baseline, armoured]) {
      const p = s.snapshot().playerPosition;
      s.spawnEnemy("scuttler", { ...p });
    }
    for (let frame = 0; frame < 10; frame += 1) {
      baseline.step(intent(), 0.05);
      armoured.step(intent(), 0.05);
    }
    const baseTaken = 10 - baseline.snapshot().playerHealth;
    const armouredTaken = 10 - armoured.snapshot().playerHealth;
    expect(armouredTaken).toBeLessThan(baseTaken);
  });

  it("dodge at 100% ignores every incoming hit", () => {
    const dodgy = sim({ dodgePercent: 100 });
    const p = dodgy.snapshot().playerPosition;
    dodgy.spawnEnemy("scuttler", { ...p });
    for (let frame = 0; frame < 20; frame += 1) dodgy.step(intent(), 0.05);
    expect(dodgy.snapshot().playerHealth).toBe(dodgy.snapshot().playerMaxHealth);
  });

  it("move-speed percent moves the player further per frame", () => {
    const baseline = sim();
    const fast = sim({ moveSpeedPercent: 50 });
    const baseStart = baseline.snapshot().playerPosition.x;
    const fastStart = fast.snapshot().playerPosition.x;
    const baseAfter = baseline.step(intent({ move: { x: 1, y: 0 } }), 0.05).playerPosition.x;
    const fastAfter = fast.step(intent({ move: { x: 1, y: 0 } }), 0.05).playerPosition.x;
    expect(fastAfter - fastStart).toBeCloseTo((baseAfter - baseStart) * 1.5, 4);
  });

  it("attack-speed percent shortens a weapon's cooldown", () => {
    const baseline = sim();
    const hasty = sim({ attackSpeedPercent: 100 });
    const baseCd = baseline.step(intent({ fireHeld: true }), 0.05).equippedWeapons[0]!.cooldownDurationSeconds;
    const hastyCd = hasty.step(intent({ fireHeld: true }), 0.05).equippedWeapons[0]!.cooldownDurationSeconds;
    expect(hastyCd).toBeCloseTo(baseCd / 2, 4);
  });

  it("HP regen per second heals a wounded player over time", () => {
    // Start wounded (below max) so the passive regen tick has something to heal.
    const regen = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ health: 2, itemStats: { hpRegenPerSecond: 2 } }),
    });
    const startHealth = regen.snapshot().playerHealth;
    expect(startHealth).toBeLessThan(regen.snapshot().playerMaxHealth);
    let healed = false;
    for (let frame = 0; frame < 260 && !healed; frame += 1) {
      const snap = regen.step(intent(), 0.05);
      healed = snap.playerHealth > startHealth;
    }
    expect(healed).toBe(true);
  });

  it("lifesteal heals the player for a fraction of weapon damage dealt", () => {
    const leech = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ health: 5, weapons: [{ weaponId: "patrol-blade", tier: 1 }], itemStats: { lifestealPercent: 100 } }),
    });
    const player = leech.snapshot().playerPosition;
    leech.spawnEnemy("nest-pod", { x: player.x + 1.2, y: player.y });
    const before = leech.snapshot().playerHealth;
    let after = before;
    for (let frame = 0; frame < 3; frame += 1) after = leech.step(intent({ fireHeld: true }), 0.05).playerHealth;
    expect(after).toBeGreaterThan(before);
  });

  it("harvesting doubles scrap secured from a deterministic kill", () => {
    const baseline = sim();
    const harvester = sim({ harvestingPercent: 100 });
    for (const s of [baseline, harvester]) {
      const p = s.snapshot().playerPosition;
      // An aurum-hoarder secures a fixed scrap sum on defeat — no drop-chance RNG.
      const id = s.spawnEnemy("aurum-hoarder", { x: p.x + 3, y: p.y });
      s.dealDamage(id, 99999);
      s.step(intent(), 0.05);
    }
    const baseScrap = baseline.snapshot().securedScrap;
    const harvestScrap = harvester.snapshot().securedScrap;
    expect(baseScrap).toBeGreaterThan(0);
    expect(harvestScrap).toBeCloseTo(baseScrap * 2, 4);
  });
});
