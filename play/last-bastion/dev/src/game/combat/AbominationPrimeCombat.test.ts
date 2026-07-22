import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, MINI_BOSS_POOL, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

const EMPTY_ARENA: ArenaDefinition = {
  id: "abomination-prime-live-test",
  widthMetres: 30,
  heightMetres: 20,
  tileSizeMetres: 1,
  obstacles: [],
};

function collect(subject: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...subject.step(IDLE, 0.05).events);
  }
  return events;
}

function sandbox(): CombatSimulation {
  return new CombatSimulation({
    autoStartWaves: false,
    autoFireEnabled: false,
    arena: EMPTY_ARENA,
    widthMetres: 30,
    heightMetres: 20,
  });
}

describe("Abomination Prime live behavior gate", () => {
  it("uses the proposed durability, standard reward, and held random-pool contract", () => {
    const subject = new CombatSimulation({ scenario: "abomination-prime", seed: 66040 });
    const boss = subject.snapshot().enemies.find((enemy) => enemy.miniBossKind === "abomination-prime")!;
    expect(boss).toMatchObject({ rank: "mini-boss", health: 920, maxHealth: 920 });
    subject.dealDamage(boss.id, 10, "physical");
    expect(subject.snapshot().enemies.find((enemy) => enemy.id === boss.id)?.health).toBe(913);
    expect(MINI_BOSS_POOL).not.toContain("abomination-prime");
    subject.dealDamage(boss.id, 9999, "physical");
    expect(subject.snapshot().events).toContainEqual(expect.objectContaining({
      type: "mini-boss-reward-dropped", miniBossKind: "abomination-prime",
    }));
  });

  it("locks one slam, damages the player and nearby terrain once, then recovers", () => {
    const arena: ArenaDefinition = {
      ...EMPTY_ARENA,
      obstacles: [{ id: "slam-crate", kind: "cargo-crate", x: 14.4, y: 9.3, width: 1.2, height: 1.2 }],
    };
    const subject = new CombatSimulation({ autoStartWaves: false, arena, widthMetres: 30, heightMetres: 20 });
    const player = subject.snapshot().playerPosition;
    subject.spawnEnemy("scuttler", { x: 1, y: 1 });
    subject.spawnEnemy("scuttler", { x: 2, y: 1 });
    const bossId = subject.spawnMiniBoss("abomination-prime", { x: player.x - 2.5, y: player.y });
    const events = collect(subject, 3.2);
    expect(events.filter((event) => event.type === "abomination-prime-slam")).toHaveLength(1);
    expect(events).toContainEqual(expect.objectContaining({
      type: "abomination-prime-slam", enemyId: bossId, hitPlayer: true,
    }));
    expect(events.some((event) => (
      (event.type === "obstacle-damaged" || event.type === "obstacle-destroyed")
      && event.obstacleId === "slam-crate"
      && event.source === "enemy-slam"
    ))).toBe(true);
  });

  it("reserves one grab, pulls the player, and breaks from post-mitigation damage", () => {
    const subject = sandbox();
    const player = subject.snapshot().playerPosition;
    const bossId = subject.spawnMiniBoss("abomination-prime", { x: player.x - 2.8, y: player.y });
    const before = subject.snapshot().playerPosition;
    const events = collect(subject, 3.1);
    expect(events).toContainEqual(expect.objectContaining({
      type: "abomination-prime-grab-latched", enemyId: bossId,
    }));
    expect(subject.snapshot().playerTethered).toBe(true);
    expect(subject.snapshot().playerPosition.x).toBeLessThan(before.x);
    subject.dealDamage(bossId, 40, "physical");
    const broken = collect(subject, 0.05);
    expect(broken).toContainEqual(expect.objectContaining({
      type: "abomination-prime-grab-broken", enemyId: bossId, reason: "damage",
    }));
    expect(subject.snapshot().playerTethered).toBe(false);
  });

  it("lobs one projectile into one finite hazard and cleans both up with its owner", () => {
    const subject = sandbox();
    const player = subject.snapshot().playerPosition;
    subject.spawnEnemy("scuttler", { x: 1, y: 1 });
    const bossId = subject.spawnMiniBoss("abomination-prime", { x: player.x - 7, y: player.y - 2 });
    const thrown = collect(subject, 3.2);
    expect(thrown).toContainEqual(expect.objectContaining({
      type: "abomination-prime-biomass-thrown", enemyId: bossId,
    }));
    expect(subject.snapshot().enemyProjectiles).toContainEqual(expect.objectContaining({
      type: "prime-biomass",
    }));
    const landed = collect(subject, 1);
    expect(landed).toContainEqual(expect.objectContaining({
      type: "abomination-prime-biomass-landed", enemyId: bossId,
    }));
    expect(subject.snapshot().groundHazards.filter((hazard) => hazard.type === "prime-biomass"))
      .toHaveLength(1);
    expect(subject.snapshot().enemies.find((enemy) => enemy.id === bossId)?.abominationPrimeHazard)
      .toMatchObject({ radiusMetres: 2.1 });
    subject.dealDamage(bossId, 9999, "physical");
    expect(subject.snapshot().groundHazards.some((hazard) => hazard.type === "prime-biomass")).toBe(false);
    expect(subject.snapshot().enemyProjectiles.some((projectile) => projectile.type === "prime-biomass")).toBe(false);
  });

  it("keeps the isolated route beneath its ten-unit ceiling", () => {
    const subject = new CombatSimulation({ scenario: "abomination-prime", seed: 66041 });
    expect(subject.snapshot().enemies).toHaveLength(4);
    collect(subject, 14);
    expect(subject.snapshot().density.peakLiveEnemies).toBeLessThanOrEqual(10);
  });
});
