import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import { cueForEvent } from "../audio/AudioCueMap";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 1 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

describe("expanded elite contracts", () => {
  it("hardens Ironhide after a repeated damage-type pair", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const id = simulation.spawnElite("ironhide-abomination");
    const baseArmour = simulation.snapshot().enemies.find((enemy) => enemy.id === id)!.armour;
    simulation.dealDamage(id, 1, "physical");
    simulation.dealDamage(id, 1, "physical");
    const ironhide = simulation.snapshot().enemies.find((enemy) => enemy.id === id)!;
    expect(ironhide.armour).toBe(baseArmour + 1);
    expect(ironhide.ironhideAdaptiveArmour).toBe(1);
    expect(cueForEvent("ironhide-adapted")?.id).toBe("ironhide-adapt");
  });

  it("makes Splitcaller pods hatch six weaker hatchlings", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario: "splitcaller-weaver" });
    let sawFragilePod = false;
    let hatchCount = 0;
    for (let frame = 0; frame < 260 && hatchCount === 0; frame += 1) {
      const snapshot = simulation.step(IDLE, 0.05);
      sawFragilePod ||= snapshot.enemies.some((enemy) => enemy.type === "nest-pod" && enemy.maxHealth === 5);
      hatchCount = snapshot.events.find((event) => event.type === "nest-pod-hatched")?.count ?? 0;
    }
    expect(sawFragilePod).toBe(true);
    expect(hatchCount).toBe(6);
  });

  it("locks a second readable lane for the Voltaic Warden", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, scenario: "voltaic-warden" });
    let warden = simulation.snapshot().enemies.find((enemy) => enemy.eliteKind === "voltaic-warden")!;
    for (let frame = 0; frame < 100 && !warden.arcWardenSecondaryLane; frame += 1) {
      warden = simulation.step(IDLE, 0.05).enemies.find((enemy) => enemy.eliteKind === "voltaic-warden")!;
    }
    expect(warden.arcWardenLane).toBeTruthy();
    expect(warden.arcWardenSecondaryLane).toBeTruthy();
    expect(warden.arcWardenSecondaryLane!.to).not.toEqual(warden.arcWardenLane!.to);
  });
});
