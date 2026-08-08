import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type BastionEaterAction, type BastionEaterPhase, type EnemySnapshot } from "./CombatSimulation";

/**
 * The boss's charge (7.8-9.2 m/s, faster than the player's 5.25) already
 * exists — it just turned out to be reachable only from the `breach` phase,
 * the opening third of the fight by health. `brood` (33-66% health) disabled
 * `stalk` movement outright, and neither `brood` nor `last-stand` (<33%) ever
 * rolled `charge-windup` into their action cycle. For two-thirds of the
 * fight the boss either stood still or shuffled at 0.95-1.25 m/s with
 * nothing fast or dodge-worthy in its kit — reported directly from a live
 * screenshot taken mid-`last-stand`.
 */

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  toggleFireModePressed: false, evasiveMovePressed: false, interactPressed: false,
  ultimatePressed: false, kitPressed: false, pausePressed: false, restartPressed: false,
};

function bossOf(enemies: readonly EnemySnapshot[]): EnemySnapshot {
  const boss = enemies.find((enemy) => enemy.type === "bastion-eater");
  if (!boss) throw new Error("Bastion Eater not found in snapshot");
  return boss;
}

/** Steps until the boss reaches a phase, or fails the test if it never does. */
function stepUntilPhase(simulation: CombatSimulation, phase: BastionEaterPhase, maxFrames: number): EnemySnapshot {
  let boss = bossOf(simulation.snapshot().enemies);
  for (let frame = 0; frame < maxFrames && boss.bastionEaterPhase !== phase; frame += 1) {
    boss = bossOf(simulation.step(IDLE, 0.05).enemies);
  }
  expect(boss.bastionEaterPhase).toBe(phase);
  return boss;
}

/** Runs `frames` more steps, recording every action and total distance moved. */
function observe(simulation: CombatSimulation, frames: number): { actionsSeen: Set<BastionEaterAction>; distanceMoved: number } {
  const actionsSeen = new Set<BastionEaterAction>();
  let boss = bossOf(simulation.snapshot().enemies);
  const start = { ...boss.position };
  let previous = { ...boss.position };
  let distanceMoved = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    boss = bossOf(simulation.step(IDLE, 0.05).enemies);
    if (boss.bastionEaterAction) actionsSeen.add(boss.bastionEaterAction);
    distanceMoved += Math.hypot(boss.position.x - previous.x, boss.position.y - previous.y);
    previous = { ...boss.position };
  }
  void start;
  return { actionsSeen, distanceMoved };
}

describe("Bastion Eater mobility across its full fight", () => {
  it("moves during brood-phase stalk instead of standing still", () => {
    const simulation = new CombatSimulation({ scenario: "bastion-eater", autoStartWaves: false });
    let boss = bossOf(simulation.snapshot().enemies);
    simulation.dealDamage(boss.id, 3_000);
    boss = stepUntilPhase(simulation, "brood", 20);

    const { distanceMoved } = observe(simulation, 400);
    expect(distanceMoved).toBeGreaterThan(1);
  });

  it("eventually charges during the brood phase, not only breach", () => {
    const simulation = new CombatSimulation({ scenario: "bastion-eater", autoStartWaves: false });
    let boss = bossOf(simulation.snapshot().enemies);
    simulation.dealDamage(boss.id, 3_000);
    boss = stepUntilPhase(simulation, "brood", 20);
    void boss;

    const { actionsSeen } = observe(simulation, 900);
    expect(actionsSeen.has("charge")).toBe(true);
  });

  it("eventually charges during last-stand, not only breach", () => {
    const simulation = new CombatSimulation({ scenario: "bastion-eater", autoStartWaves: false });
    let boss = bossOf(simulation.snapshot().enemies);
    simulation.dealDamage(boss.id, 3_000);
    stepUntilPhase(simulation, "brood", 20);
    boss = bossOf(simulation.snapshot().enemies);
    simulation.dealDamage(boss.id, 2_500);
    stepUntilPhase(simulation, "last-stand", 20);

    const { actionsSeen } = observe(simulation, 900);
    expect(actionsSeen.has("charge")).toBe(true);
  });

  it("still charges during breach, unchanged from before", () => {
    const simulation = new CombatSimulation({ scenario: "bastion-eater", autoStartWaves: false });
    const boss = bossOf(simulation.snapshot().enemies);
    expect(boss.bastionEaterPhase).toBe("breach");

    const { actionsSeen } = observe(simulation, 900);
    expect(actionsSeen.has("charge")).toBe(true);
  });
});
