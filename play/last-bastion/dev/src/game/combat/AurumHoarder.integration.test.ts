import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 1, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  interactPressed: false,
  ultimatePressed: false,
  kitPressed: false,
  pausePressed: false,
  restartPressed: false,
};

describe("Aurum Hoarder integration", () => {
  it("permits only one forced Hoarder per wave", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    expect(simulation.spawnAurumHoarder({ x: 6, y: 6 })).not.toBeNull();
    expect(simulation.spawnAurumHoarder({ x: 8, y: 8 })).toBeNull();
    expect(simulation.snapshot().enemies.filter((enemy) => enemy.type === "aurum-hoarder")).toHaveLength(1);
  });

  it("escapes without defeat credit, Scrap, XP, or cache loot", () => {
    const simulation = new CombatSimulation({ scenario: "aurum-hoarder", startingWeaponIds: [] });
    const events: CombatEvent[] = [];
    for (let frame = 0; frame < 260 && simulation.snapshot().enemies.length > 0; frame += 1) {
      events.push(...simulation.step(IDLE, 0.05).events);
    }

    const snapshot = simulation.snapshot();
    expect(snapshot.enemies).toHaveLength(0);
    expect(events.some((event) => event.type === "aurum-fleeing")).toBe(true);
    expect(events.some((event) => event.type === "aurum-escaped")).toBe(true);
    expect(events.some((event) => event.type === "enemy-defeated")).toBe(false);
    expect(snapshot.securedScrap).toBe(0);
    expect(snapshot.eliteRewards).toHaveLength(0);
    expect(snapshot.experience).toBe(0);
  });

  it("pays three armour breaks plus kill Scrap and drops one valid cache", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingWeaponIds: [] });
    const player = simulation.snapshot().playerPosition;
    const id = simulation.spawnAurumHoarder({ x: player.x + 0.7, y: player.y });
    expect(id).not.toBeNull();

    simulation.dealDamage(id!, 9999);
    const defeated = simulation.snapshot();
    const breakEvents = defeated.events.filter((event) => event.type === "aurum-armour-broken");
    expect(breakEvents).toHaveLength(3);
    expect(defeated.securedScrap).toBe(60);
    expect(defeated.events.some((event) => event.type === "enemy-defeated" && event.bestiaryKey === "aurum-hoarder")).toBe(true);
    expect(defeated.eliteRewards.map((reward) => reward.type)).toEqual(["aurum-supply-cache"]);

    const collected = simulation.step(IDLE, 0.05);
    expect(collected.pendingDecision?.title).toBe("AURUM SUPPLY CACHE — CHOOSE ONE");
    expect(collected.pendingDecision?.kind).toBe("supply-depot");
    expect(collected.pendingDecision?.options).toHaveLength(3);
    expect(new Set(collected.pendingDecision?.options.map((option) => option.id)).size).toBe(3);
  });
});
