import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  broodWardenEnrageTier,
  CombatSimulation,
  createQuillbackFanDirections,
  pointInsideRipperSweep,
  quillbackVolleyCount,
  selectMiniBossForRoll,
  SPINEWHEEL_BASE_ROLL_SPEED,
  SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER,
} from "./CombatSimulation";
import type { ArenaDefinition } from "../arena/ArenaDefinition";

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

describe("CombatSimulation", () => {
  it("fires the Service Rifle and kills a damageable Scuttler", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x + 3, y: player.y });

    for (let frame = 0; frame < 80; frame += 1) {
      simulation.step(intent({ fireHeld: true }), 1 / 60);
    }

    const snapshot = simulation.snapshot();
    expect(snapshot.enemies).toHaveLength(0);
    expect(snapshot.pickups).toHaveLength(1);
  });

  it("hatches an Egg Cluster into two Scuttlers", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.spawnEnemy("egg-cluster", { x: 2, y: 2 });

    for (let frame = 0; frame < 125; frame += 1) {
      simulation.step(intent(), 0.05);
    }

    const enemies = simulation.snapshot().enemies;
    expect(enemies.filter((enemy) => enemy.type === "egg-cluster")).toHaveLength(0);
    expect(enemies.filter((enemy) => enemy.type === "scuttler")).toHaveLength(2);
  });

  it("offers and applies deterministic upgrade choices", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.addExperience(4);

    const choices = simulation.snapshot().pendingUpgradeChoices;
    expect(choices).toHaveLength(3);
    expect(simulation.chooseUpgrade(choices[0]!.id)).toBe(true);
    expect(simulation.snapshot().level).toBe(2);
    expect(simulation.snapshot().pendingUpgradeChoices).toHaveLength(0);
  });

  it("starts the deterministic first wave with Scuttlers", () => {
    const simulation = new CombatSimulation({ seed: 123 });
    simulation.step(intent(), 0.25);

    expect(simulation.snapshot().waveNumber).toBe(1);
    expect(simulation.snapshot().enemies.every((enemy) => enemy.type === "scuttler")).toBe(true);
  });

  it("telegraphs a Brain Blob wind-up before its lunge", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 7 });
    simulation.spawnEnemy("brain-blob", { x: 3, y: 3 });
    const observedPhases = new Set<string>();

    for (let frame = 0; frame < 100; frame += 1) {
      const brain = simulation.step(intent(), 0.05).enemies[0];
      if (brain?.brainPhase) {
        observedPhases.add(brain.brainPhase);
      }
    }

    expect(observedPhases).toContain("windup");
    expect(observedPhases).toContain("lunge");
  });

  it("telegraphs and fires a Slime Spitter glob that creates a timed puddle", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 5 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("slime-spitter", { x: player.x + 6, y: player.y });
    let observedWindup = false;
    let observedGlob = false;
    let observedImpact = false;
    let snapshot = simulation.snapshot();

    for (let frame = 0; frame < 100; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      observedWindup ||= snapshot.events.some((event) => event.type === "slime-spit-windup");
      observedGlob ||= snapshot.events.some((event) => event.type === "slime-glob-fired");
      observedImpact ||= snapshot.events.some((event) => event.type === "slime-impact");
      if (observedImpact) break;
    }

    expect(observedWindup).toBe(true);
    expect(observedGlob).toBe(true);
    expect(observedImpact).toBe(true);
    expect(snapshot.groundHazards).toHaveLength(1);
    expect(snapshot.groundHazards[0]?.remainingSeconds).toBeLessThanOrEqual(4);
  });

  it("slows ordinary movement while preserving the evasive escape action", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 5 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("slime-spitter", { x: player.x + 6, y: player.y });
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 100 && snapshot.groundHazards.length === 0; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }

    const beforeWalk = snapshot.playerPosition.x;
    const walked = simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    const slowedWalkDistance = walked.playerPosition.x - beforeWalk;
    const beforeRoll = walked.playerPosition.x;
    const rolled = simulation.step(intent({
      move: { x: 1, y: 0 },
      evasiveMovePressed: true,
    }), 0.05);

    expect(walked.playerSlowed).toBe(true);
    expect(slowedWalkDistance).toBeGreaterThan(0);
    expect(slowedWalkDistance).toBeLessThan(0.2);
    expect(rolled.playerPosition.x - beforeRoll).toBeGreaterThan(slowedWalkDistance);
  });

  it("caps simultaneous slowing puddles at five", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      scenario: "slime-spitter",
      seed: 12,
    });
    let maximumPuddles = 0;
    for (let frame = 0; frame < 240; frame += 1) {
      const snapshot = simulation.step(intent({
        move: { x: frame % 80 < 40 ? 1 : -1, y: 0.35 },
        evasiveMovePressed: frame % 36 === 0,
      }), 0.05);
      maximumPuddles = Math.max(maximumPuddles, snapshot.groundHazards.length);
      expect(snapshot.groundHazards.length).toBeLessThanOrEqual(5);
    }
    expect(maximumPuddles).toBeGreaterThan(1);
  });

  it("creates a durable Carapace Scuttler with telegraphed elite phases", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      scenario: "carapace-elite",
      seed: 4,
    });
    const elite = simulation.snapshot().enemies.find((enemy) => enemy.rank === "elite");

    expect(elite?.eliteKind).toBe("carapace-scuttler");
    expect(elite?.maxHealth).toBe(70);
    const observed = new Set<string>();
    for (let frame = 0; frame < 80; frame += 1) {
      const current = simulation.step(intent(), 0.05).enemies
        .find((enemy) => enemy.eliteKind === "carapace-scuttler");
      if (current?.carapacePhase) observed.add(current.carapacePhase);
    }
    expect(observed).toContain("windup");
    expect(observed).toContain("charge");
    expect(observed).toContain("recovery");
  });

  it("reduces direct projectile damage against Carapace frontal armour", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnElite("carapace-scuttler", { x: player.x + 3, y: player.y });
    let snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    let observedArmourHit = snapshot.events.some((event) => event.type === "elite-armour-hit");
    for (let frame = 0; frame < 12; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      observedArmourHit ||= snapshot.events.some((event) => event.type === "elite-armour-hit");
    }
    const elite = snapshot.enemies.find((enemy) => enemy.eliteKind === "carapace-scuttler");
    expect(observedArmourHit).toBe(true);
    expect(elite?.health).toBeCloseTo(67.5);
  });

  it("guarantees an upgrade cache when an elite is defeated", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponCount: 12,
    });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnElite("carapace-scuttler", { x: player.x + 5, y: player.y });
    let observedDrop = false;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 100 && !observedDrop; frame += 1) {
      snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
      observedDrop ||= snapshot.events.some((event) => event.type === "elite-reward-dropped");
    }
    expect(observedDrop).toBe(true);
    expect(snapshot.eliteRewards.length > 0 || snapshot.pendingUpgradeChoices.length > 0).toBe(true);
  });

  it("cycles the Siege Crusher through telegraphed mini-boss attacks", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      scenario: "siege-crusher",
      seed: 9,
    });
    const observed = new Set<string>();
    for (let frame = 0; frame < 150; frame += 1) {
      const boss = simulation.step(intent(), 0.05).enemies
        .find((enemy) => enemy.miniBossKind === "siege-crusher");
      if (boss?.siegeCrusherPhase) observed.add(boss.siegeCrusherPhase);
    }
    expect(observed).toContain("charge-windup");
    expect(observed).toContain("charge");
    expect(observed).toContain("recovery");
  });

  it("maps seeded mini-boss rolls only to mechanically complete pool entries", () => {
    expect(selectMiniBossForRoll(0)).toBe("siege-crusher");
    expect(selectMiniBossForRoll(0.499)).toBe("siege-crusher");
    expect(selectMiniBossForRoll(0.5)).toBe("brood-warden");
    expect(selectMiniBossForRoll(0.999)).toBe("brood-warden");
  });

  it("uses the Brood Warden's half-health and final-20-percent enrage tiers", () => {
    expect(broodWardenEnrageTier(2700, 2700)).toBe(0);
    expect(broodWardenEnrageTier(1350, 2700)).toBe(1);
    expect(broodWardenEnrageTier(540, 2700)).toBe(2);
  });

  it("unlocks the Brood Warden swarm rush at half health", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario: "brood-warden", seed: 12 });
    const boss = simulation.snapshot().enemies.find((enemy) => enemy.miniBossKind === "brood-warden")!;
    simulation.dealDamage(boss.id, boss.maxHealth * 0.51);
    let observedRush = false;
    let observedAdds = false;
    for (let frame = 0; frame < 100; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      observedRush ||= snapshot.events.some((event) => event.type === "brood-swarm-rush");
      observedAdds ||= snapshot.enemies.filter((enemy) => enemy.type === "scuttler").length >= 4;
    }
    expect(observedRush).toBe(true);
    expect(observedAdds).toBe(true);
  });

  it("cycles Brood Warden cleave, acid-volley, and egg-placement moves", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 3 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnMiniBoss("brood-warden", { x: player.x + 2.6, y: player.y });
    const observed = new Set<string>();
    for (let frame = 0; frame < 360 && observed.size < 3; frame += 1) {
      const cleaveObserved = observed.has("brood-cleave");
      const snapshot = simulation.step(intent({
        move: cleaveObserved
          ? { x: frame < 160 ? -1 : 1, y: frame % 160 < 80 ? 0.35 : -0.35 }
          : { x: 0, y: 0 },
        evasiveMovePressed: cleaveObserved && frame % 26 === 0,
      }), 0.05);
      for (const event of snapshot.events) {
        if (event.type === "brood-cleave" || event.type === "brood-acid-volley" || event.type === "brood-eggs-laid") {
          observed.add(event.type);
        }
      }
    }
    expect(observed).toEqual(new Set(["brood-cleave", "brood-acid-volley", "brood-eggs-laid"]));
  });

  it("restricts the Ripper sweep to its telegraphed forward cone", () => {
    const origin = { x: 4, y: 4 };
    const facing = { x: 1, y: 0 };
    expect(pointInsideRipperSweep(origin, facing, { x: 6.4, y: 4 }, 2.55)).toBe(true);
    expect(pointInsideRipperSweep(origin, facing, { x: 3, y: 4 }, 2.55)).toBe(false);
    expect(pointInsideRipperSweep(origin, facing, { x: 4, y: 6.5 }, 2.55)).toBe(false);
    expect(pointInsideRipperSweep(origin, facing, { x: 7, y: 4 }, 2.55)).toBe(false);
  });

  it("cycles the Ripper through wind-up, sweep, and punishable recovery", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 17 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("ripper", { x: player.x + 2.35, y: player.y });
    const phases = new Set<string>();
    let sweepEvent = false;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 80; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      const ripper = snapshot.enemies.find((enemy) => enemy.type === "ripper");
      if (ripper?.ripperPhase) phases.add(ripper.ripperPhase);
      sweepEvent ||= snapshot.events.some((event) => event.type === "ripper-sweep");
    }
    expect(phases).toContain("windup");
    expect(phases).toContain("sweep");
    expect(phases).toContain("recovery");
    expect(sweepEvent).toBe(true);
    expect(snapshot.playerHealth).toBeLessThan(snapshot.playerMaxHealth);
  });

  it("builds symmetric Quillback fans with intentional gaps", () => {
    expect(quillbackVolleyCount(0)).toBe(1);
    expect(quillbackVolleyCount(1)).toBe(3);
    expect(quillbackVolleyCount(2)).toBe(5);
    const fan = createQuillbackFanDirections({ x: 1, y: 0 }, 5);
    const angles = fan.map((direction) => Math.atan2(direction.y, direction.x));
    expect(fan).toHaveLength(5);
    expect(angles[0]).toBeCloseTo(-Math.PI * 32 / 180, 5);
    expect(angles[2]).toBeCloseTo(0, 5);
    expect(angles[4]).toBeCloseTo(Math.PI * 32 / 180, 5);
    expect(angles[1]! - angles[0]!).toBeGreaterThan(Math.PI * 14 / 180);
  });

  it("escalates Quillback volleys from one to three to five locked spikes", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 21 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("quillback", { x: player.x + 7, y: player.y });
    const windups: number[] = [];
    const volleys: number[] = [];
    for (let frame = 0; frame < 180 && volleys.length < 3; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      for (const event of snapshot.events) {
        if (event.type === "quillback-windup") windups.push(event.count);
        if (event.type === "quillback-volley") volleys.push(event.count);
      }
    }
    expect(windups.slice(0, 3)).toEqual([1, 3, 5]);
    expect(volleys.slice(0, 3)).toEqual([1, 3, 5]);
  });

  it("forces a close Quillback to retreat instead of firing point-blank", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, seed: 22 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("quillback", { x: player.x + 2.5, y: player.y });
    const initialDistance = 2.5;
    let fired = false;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 20; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
      fired ||= snapshot.events.some((event) => event.type === "quillback-volley");
    }
    const quillback = snapshot.enemies.find((enemy) => enemy.type === "quillback")!;
    expect(Math.abs(quillback.position.x - snapshot.playerPosition.x)).toBeGreaterThan(initialDistance);
    expect(fired).toBe(false);
    expect(quillback.quillbackPhase).toBe("positioning");
  });

  it("damages and then destroys cover struck by Crusher charges", () => {
    const arena: ArenaDefinition = {
      id: "crusher-test",
      widthMetres: 30,
      heightMetres: 16.875,
      tileSizeMetres: 1,
      obstacles: [{ id: "charge-cover", kind: "barricade", x: 11, y: 7.5, width: 1, height: 2 }],
    };
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnMiniBoss("siege-crusher", { x: 7, y: player.y });
    let observedDamage = false;
    let observedDestruction = false;
    for (let frame = 0; frame < 240; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      observedDamage ||= snapshot.events.some((event) => event.type === "obstacle-damaged");
      observedDestruction ||= snapshot.events.some((event) => event.type === "obstacle-destroyed");
      if (observedDestruction) {
        expect(snapshot.destroyedObstacleIds).toContain("charge-cover");
        break;
      }
    }
    expect(observedDamage).toBe(true);
    expect(observedDestruction).toBe(true);
  });

  it("guarantees an arsenal cache when the Siege Crusher is defeated", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponCount: 12 });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnMiniBoss("siege-crusher", { x: player.x + 5, y: player.y });
    let observedDrop = false;
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 240 && !observedDrop; frame += 1) {
      const boss = snapshot.enemies.find((enemy) => enemy.miniBossKind === "siege-crusher");
      const dx = (boss?.position.x ?? player.x + 1) - snapshot.playerPosition.x;
      const dy = (boss?.position.y ?? player.y) - snapshot.playerPosition.y;
      const magnitude = Math.hypot(dx, dy) || 1;
      snapshot = simulation.step(intent({
        aim: { x: dx / magnitude, y: dy / magnitude },
        fireHeld: true,
        move: { x: -dx / magnitude, y: -dy / magnitude },
        evasiveMovePressed: frame % 28 === 0,
      }), 0.05);
      observedDrop ||= snapshot.events.some((event) => event.type === "mini-boss-reward-dropped");
    }
    expect(observedDrop).toBe(true);
    expect(snapshot.eliteRewards.some((reward) => reward.type === "mini-boss-arsenal-cache")
      || snapshot.pendingUpgradeChoices.length > 0).toBe(true);
  });

  it("prevents contact damage during the Marine's invulnerability window", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x, y: player.y });

    const rolling = simulation.step(intent({
      move: { x: 1, y: 0 },
      evasiveMovePressed: true,
    }), 0.05);
    expect(rolling.playerHealth).toBe(rolling.playerMaxHealth);

    let snapshot = rolling;
    for (let frame = 0; frame < 80; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }

    expect(snapshot.playerHealth).toBeLessThan(snapshot.playerMaxHealth);
  });

  it("reports roll readiness after the universal prototype recovery", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    let snapshot = simulation.step(intent({ evasiveMovePressed: true }), 0.05);
    expect(snapshot.evasiveReady).toBe(false);

    for (let frame = 0; frame < 30; frame += 1) {
      snapshot = simulation.step(intent(), 0.05);
    }

    expect(snapshot.evasiveReady).toBe(true);
    expect(snapshot.evasiveCooldownRemainingSeconds).toBe(0);
  });

  it("emits typed feedback events for firing and enemy impacts", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x + 2, y: player.y });

    const fired = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(fired.events.some((event) => event.type === "weapon-fired")).toBe(true);

    let observedHit = fired.events.some((event) => event.type === "enemy-hit");
    for (let frame = 0; frame < 20; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      observedHit ||= snapshot.events.some((event) => event.type === "enemy-hit");
    }

    expect(observedHit).toBe(true);
  });

  it("fires every equipped weapon as an independent instance", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponCount: 4,
    });

    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    const firedIds = snapshot.events
      .filter((event) => event.type === "weapon-fired")
      .map((event) => event.weaponInstanceId);

    expect(snapshot.equippedWeapons).toHaveLength(4);
    expect(new Set(firedIds)).toEqual(new Set([1, 2, 3, 4]));
    expect(snapshot.projectiles).toHaveLength(4);
  });

  it("fires the Scattergun as a short-range five-pellet spread", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["scattergun"],
    });
    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);

    expect(snapshot.equippedWeapons[0]?.weaponId).toBe("scattergun");
    expect(snapshot.projectiles).toHaveLength(5);
    expect(snapshot.events.filter((event) => event.type === "weapon-fired")).toHaveLength(5);
    const rotations = snapshot.projectiles.map((projectile) => projectile.rotationRadians);
    expect(Math.max(...rotations) - Math.min(...rotations)).toBeGreaterThan(0.4);
  });

  it("auto-targets and chains with the Arc Carbine", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["arc-carbine"],
    });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("egg-cluster", { x: player.x + 3, y: player.y });
    simulation.spawnEnemy("egg-cluster", { x: player.x + 5, y: player.y });

    let observedChain = false;
    for (let frame = 0; frame < 20; frame += 1) {
      const snapshot = simulation.step(intent({ aim: { x: -1, y: 0 }, fireHeld: true }), 0.05);
      observedChain ||= snapshot.events.some((event) => event.type === "chain-arc");
    }

    expect(observedChain).toBe(true);
    expect(simulation.snapshot().enemies.some((enemy) => enemy.health < enemy.maxHealth)).toBe(true);
  });

  it("does not waste Arc Carbine cooldowns without a target", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponIds: ["arc-carbine"],
    });
    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(snapshot.projectiles).toHaveLength(0);
    expect(snapshot.events.some((event) => event.type === "weapon-fired")).toBe(false);
  });

  it("supports a deliberately unarmed review state", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingWeaponCount: 0,
    });

    const snapshot = simulation.step(intent({ fireHeld: true }), 0.05);
    expect(snapshot.equippedWeapons).toHaveLength(0);
    expect(snapshot.projectiles).toHaveLength(0);
  });

  it.each([
    [4, 23],
    [12, 45],
  ] as const)("creates the deterministic %i-weapon stress population", (profile, enemyCount) => {
    const simulation = new CombatSimulation({
      stressProfile: profile,
      startingWeaponCount: profile,
      seed: 99,
    });
    const snapshot = simulation.snapshot();

    expect(snapshot.stressProfile).toBe(profile);
    expect(snapshot.equippedWeapons).toHaveLength(profile);
    expect(snapshot.enemies).toHaveLength(enemyCount);
  });

  it("blocks the Marine from crossing an arena obstacle", () => {
    const arena = arenaWithObstacle(16, 7.4, 2, 2);
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });

    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 120; frame += 1) {
      snapshot = simulation.step(intent({ move: { x: 1, y: 0 } }), 0.05);
    }

    expect(snapshot.playerPosition.x).toBeLessThanOrEqual(16 - 0.55);
  });

  it("destroys projectiles that strike arena obstacles", () => {
    const arena = arenaWithObstacle(18, 7.4, 1, 2);
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });
    let observedBlock = false;

    for (let frame = 0; frame < 30; frame += 1) {
      const snapshot = simulation.step(intent({ fireHeld: frame === 0 }), 0.05);
      observedBlock ||= snapshot.events.some((event) => event.type === "projectile-blocked");
    }

    expect(observedBlock).toBe(true);
    expect(simulation.snapshot().projectiles).toHaveLength(0);
  });

  it("locks the Spinewheel heading during its warning instead of tracking the player", () => {
    const arena: ArenaDefinition = {
      id: "heading-lock-arena",
      widthMetres: 40,
      heightMetres: 22.5,
      tileSizeMetres: 1,
      obstacles: [],
    };
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("spinewheel", { x: player.x - 6, y: player.y });

    let lockedDirection = { x: 0, y: 0 };
    for (let frame = 0; frame < 14; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      const wheel = snapshot.enemies[0]!;
      if (wheel.spinewheelPhase === "windup") lockedDirection = wheel.spinewheelDirection!;
    }
    for (let frame = 0; frame < 16; frame += 1) {
      simulation.step(intent({ move: { x: 0, y: -1 } }), 0.05);
    }
    const rolling = simulation.snapshot().enemies[0]!;

    expect(rolling.spinewheelPhase).toBe("rolling");
    expect(rolling.spinewheelDirection?.x).toBeCloseTo(lockedDirection.x, 5);
    expect(rolling.spinewheelDirection?.y).toBeCloseTo(lockedDirection.y, 5);
  });

  it("completes two speed-decaying Spinewheel rebounds before exposed recovery", () => {
    const arena: ArenaDefinition = {
      id: "bounce-cycle-arena",
      widthMetres: 12,
      heightMetres: 8,
      tileSizeMetres: 1,
      obstacles: [],
    };
    const simulation = new CombatSimulation({ autoStartWaves: false, arena });
    simulation.spawnEnemy("spinewheel", { x: 2, y: 4 });
    const bounceSpeeds: number[] = [];
    let observedRecovery = false;

    for (let frame = 0; frame < 140; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      const wheel = snapshot.enemies[0];
      if (!wheel) break;
      if (snapshot.events.some((event) => event.type === "spinewheel-bounce")) {
        bounceSpeeds.push(wheel.spinewheelSpeedMetresPerSecond!);
      }
      observedRecovery ||= wheel.spinewheelPhase === "recovery";
    }

    expect(bounceSpeeds).toHaveLength(2);
    expect(bounceSpeeds[0]).toBeCloseTo(
      SPINEWHEEL_BASE_ROLL_SPEED * SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER,
    );
    expect(bounceSpeeds[1]).toBeCloseTo(
      SPINEWHEEL_BASE_ROLL_SPEED * SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER ** 2,
    );
    expect(observedRecovery).toBe(true);
  });
});

function arenaWithObstacle(x: number, y: number, width: number, height: number): ArenaDefinition {
  return {
    id: "test-arena",
    widthMetres: 30,
    heightMetres: 16.875,
    tileSizeMetres: 1,
    obstacles: [{ id: "test-obstacle", kind: "cargo-crate", x, y, width, height }],
  };
}
