import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import { UPGRADE_ORDER } from "../content/upgradeCatalog";

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

/** Levels up until the target upgrade is offered, then chooses it. */
function chooseUpgradeWhenOffered(simulation: CombatSimulation, targetId: string, maxLevels = 16): boolean {
  for (let attempt = 0; attempt < maxLevels; attempt += 1) {
    const snapshot = simulation.snapshot();
    if (snapshot.pendingDecision?.kind !== "upgrade") {
      simulation.addExperience(snapshot.experienceForNextLevel);
      continue;
    }
    const offered = snapshot.pendingDecision.options.find((option) => option.id === targetId);
    simulation.chooseOption(offered ? targetId : snapshot.pendingDecision.options[0]!.id);
    if (offered) {
      return true;
    }
  }
  return false;
}

describe("expanded upgrade catalogue", () => {
  it("offers twelve distinct upgrades in the rotation", () => {
    expect(UPGRADE_ORDER).toHaveLength(12);
    expect(new Set(UPGRADE_ORDER).size).toBe(12);
  });

  it("converts weapon damage type with Incendiary Rounds", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeWhenOffered(simulation, "incendiary-rounds")).toBe(true);
    expect(simulation.snapshot().weapon.damageType).toBe("fire");
  });

  it("grants a recharging shield with Shield Capacitor", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeWhenOffered(simulation, "shield-capacitor")).toBe(true);
    expect(simulation.snapshot().playerMaxShield).toBe(15);
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 60; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }
    expect(snapshot.playerShield).toBeGreaterThan(0);
  });

  it("adds chain arcs to any weapon with Chain Lightning", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(chooseUpgradeWhenOffered(simulation, "chain-lightning")).toBe(true);
    expect(simulation.snapshot().weapon.chainCount).toBe(1);
    expect(simulation.snapshot().weapon.chainRadiusMetres).toBeGreaterThan(0);
  });
});

describe("Marine passive: Entrenched", () => {
  it("engages after standing still and reduces contact damage", () => {
    const entrenchedRun = new CombatSimulation({ autoStartWaves: false });
    let snapshot = entrenchedRun.snapshot();
    for (let frame = 0; frame < 25; frame += 1) {
      snapshot = entrenchedRun.step(intent(), 0.05);
    }
    expect(snapshot.playerEntrenched).toBe(true);

    const player = snapshot.playerPosition;
    entrenchedRun.spawnEnemy("scuttler", { x: player.x, y: player.y });
    for (let frame = 0; frame < 4; frame += 1) {
      snapshot = entrenchedRun.step(intent(), 0.05);
    }
    // 10 contact damage at +3 armour → 10 × (1 − 3/18) ≈ 8.33.
    expect(snapshot.playerHealth).toBeGreaterThan(91);
    expect(snapshot.playerHealth).toBeLessThan(92);
  });

  it("disengages the moment the Marine moves", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    for (let frame = 0; frame < 25; frame += 1) {
      simulation.step(intent(), 0.05);
    }
    const moved = simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    expect(moved.playerEntrenched).toBe(false);
  });
});

describe("Marine ultimate: Bastion Barrage", () => {
  it("fires a radial explosive volley and starts its cooldown", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const snapshot = simulation.step(intent({ ultimatePressed: true }), 0.05);

    expect(snapshot.events.some((event) => event.type === "ultimate-fired")).toBe(true);
    expect(snapshot.projectiles).toHaveLength(12);
    expect(snapshot.ultimateReady).toBe(false);
    expect(snapshot.ultimateCooldownRemainingSeconds).toBeGreaterThan(20);

    const again = simulation.step(intent({ ultimatePressed: true }), 0.05);
    expect(again.events.some((event) => event.type === "ultimate-fired")).toBe(false);
  });
});

describe("electric fence battlefield interaction", () => {
  it("activates from the switch and shocks enemies crossing the line", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    let snapshot = simulation.snapshot();
    expect(snapshot.fence).not.toBeNull();
    expect(snapshot.fence!.ready).toBe(true);
    expect(snapshot.fence!.playerNearSwitch).toBe(false);

    // Walk south from the arena centre to the switch.
    for (let frame = 0; frame < 20; frame += 1) {
      snapshot = simulation.step(intent({ move: { x: 0, y: 1 } }), 0.05);
    }
    expect(snapshot.fence!.playerNearSwitch).toBe(true);

    snapshot = simulation.step(intent({ interactPressed: true }), 0.05);
    expect(snapshot.events.some((event) => event.type === "fence-activated")).toBe(true);
    expect(snapshot.fence!.active).toBe(true);
    expect(snapshot.fence!.ready).toBe(false);

    // A Scuttler approaching from beyond the fence must cross the line.
    const scuttlerId = simulation.spawnEnemy("scuttler", { x: 15, y: 11.9 });
    let lowestHealth = 20;
    for (let frame = 0; frame < 30; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      const scuttler = snapshot.enemies.find((enemy) => enemy.id === scuttlerId);
      if (!scuttler) break;
      lowestHealth = Math.min(lowestHealth, scuttler.health);
    }
    expect(lowestHealth).toBeLessThan(20);
  });

  it("reports no fence for arenas without one", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      arena: {
        id: "bare-arena",
        widthMetres: 30,
        heightMetres: 16.875,
        tileSizeMetres: 1,
        obstacles: [],
      },
    });
    expect(simulation.snapshot().fence).toBeNull();
  });
});
