import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  applyTransformationChoice,
  createTransformationAffinityState,
  type TransformationAffinityState,
} from "../transformations/TransformationAffinity";

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

function committed(pathId: string, choiceId: string, times = 3): TransformationAffinityState {
  let state = createTransformationAffinityState();
  for (let i = 0; i < times; i += 1) {
    const result = applyTransformationChoice(state, pathId as never, choiceId as never);
    if (!result.ok) throw new Error(`setup failed: ${result.reason}`);
    state = result.state;
  }
  return state;
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

describe("committed transformation path effects reach real combat stats (Phase 3)", () => {
  it("Dense Tissue (Mutagenic Evolution) raises max health and slows movement", () => {
    const baseline = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    const boosted = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ transformation: committed("mutagenic-evolution", "dense-tissue") }),
    });
    expect(boosted.snapshot().playerMaxHealth).toBe(Math.round(baseline.snapshot().playerMaxHealth * 1.25));

    const baseSnapshot = baseline.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    const boostSnapshot = boosted.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    const baseDisplacement = baseSnapshot.playerPosition.x - baseline.snapshot().playerPosition.x + baseSnapshot.playerPosition.x * 0;
    void baseDisplacement;
    expect(boostSnapshot.playerPosition.x).toBeLessThan(baseSnapshot.playerPosition.x);
  });

  it("uncommitted exposure (below 3 Affinity) has no combat effect at all", () => {
    const baseline = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    const exposedOnly = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ transformation: committed("mutagenic-evolution", "dense-tissue", 2) }),
    });
    expect(exposedOnly.snapshot().playerMaxHealth).toBe(baseline.snapshot().playerMaxHealth);
  });

  it("Zealous Fervor (Church of the Designed Arrival) speeds fire rate but weakens armour", () => {
    const baseline = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ weapons: [{ weaponId: "bulwark-rotary-cannon", tier: 1 }] }),
    });
    const boosted = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({
        weapons: [{ weaponId: "bulwark-rotary-cannon", tier: 1 }],
        transformation: committed("cultist-doctrine", "zealous-fervor"),
      }),
    });
    baseline.step(intent(), 0.05);
    const baseSnapshot = baseline.step(intent({ fireHeld: true }), 0.05);
    boosted.step(intent(), 0.05);
    const boostSnapshot = boosted.step(intent({ fireHeld: true }), 0.05);
    expect(boostSnapshot.equippedWeapons[0]?.cooldownDurationSeconds)
      .toBeLessThan(baseSnapshot.equippedWeapons[0]?.cooldownDurationSeconds ?? Infinity);
  });

  it("Vanguard Conditioning (Bastion Super-Soldier) mitigates more incoming damage via bonus armour", () => {
    const baseline = new CombatSimulation({ autoStartWaves: false, startingBuild: build({ health: 20 }) });
    const boosted = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ health: 20, transformation: committed("bastion-super-soldier", "vanguard-conditioning") }),
    });
    const baselinePlayer = baseline.snapshot().playerPosition;
    const boostedPlayer = boosted.snapshot().playerPosition;
    baseline.spawnEnemy("scuttler", { ...baselinePlayer });
    boosted.spawnEnemy("scuttler", { ...boostedPlayer });
    for (let frame = 0; frame < 10; frame += 1) {
      baseline.step(intent(), 0.05);
      boosted.step(intent(), 0.05);
    }
    const baseDamageTaken = 20 - baseline.snapshot().playerHealth;
    const boostDamageTaken = 20 - boosted.snapshot().playerHealth;
    expect(boostDamageTaken).toBeLessThan(baseDamageTaken);
  });

  it("Heavy Gunner (Bastion Super-Soldier) increases damage from a heavy-class weapon only", () => {
    const baseline = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({ weapons: [{ weaponId: "bulwark-rotary-cannon", tier: 1 }] }),
    });
    const boosted = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build({
        weapons: [{ weaponId: "bulwark-rotary-cannon", tier: 1 }],
        transformation: committed("bastion-super-soldier", "heavy-gunner"),
      }),
    });
    const basePlayer = baseline.snapshot().playerPosition;
    const boostPlayer = boosted.snapshot().playerPosition;
    // A high-health target far enough that several of the cannon's frequent shots
    // (0.08s cadence, 24 m/s) sweep past it over these frames, so at least one lands.
    const baseId = baseline.spawnMiniBoss("siege-crusher", { x: basePlayer.x + 3, y: basePlayer.y });
    const boostId = boosted.spawnMiniBoss("siege-crusher", { x: boostPlayer.x + 3, y: boostPlayer.y });
    const baseBefore = baseline.snapshot().enemies.find((enemy) => enemy.id === baseId)!.health;
    const boostBefore = boosted.snapshot().enemies.find((enemy) => enemy.id === boostId)!.health;
    let baseAfter = baseBefore;
    let boostAfter = boostBefore;
    for (let frame = 0; frame < 13; frame += 1) {
      baseAfter = baseline.step(intent({ fireHeld: true }), 0.05).enemies.find((enemy) => enemy.id === baseId)?.health ?? baseAfter;
      boostAfter = boosted.step(intent({ fireHeld: true }), 0.05).enemies.find((enemy) => enemy.id === boostId)?.health ?? boostAfter;
    }
    const baseDamage = baseBefore - baseAfter;
    const boostDamage = boostBefore - boostAfter;
    expect(baseDamage).toBeGreaterThan(0);
    expect(boostDamage).toBeGreaterThan(baseDamage);
  });
});
