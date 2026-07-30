import { describe, expect, it } from "vitest";
import { CombatSimulation, type CombatSnapshot } from "./CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { BASTION_ARENA, type ArenaDefinition } from "../arena/ArenaDefinition";
import { worldObjectById } from "../arena/WorldObjectCatalog";

/**
 * The interaction verb, end to end.
 *
 * `interaction/WorldInteraction.ts` was a complete, tested state machine that
 * nothing imported, and `WorldObjectPlacement` filtered every interactable out
 * of every room. So the whole layer type-checked, passed its unit tests, and
 * could not be reached by a player. These tests drive a real simulation.
 */

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
    evasiveMovePressed: false, ultimatePressed: false, kitPressed: false,
    interactPressed: false, interactHeld: false,
    pausePressed: false, restartPressed: false,
    ...overrides,
  };
}

/** An arena holding exactly one interactable, centred on the player's spawn. */
function arenaWith(worldObjectId: string, offsetMetres = 0.9): ArenaDefinition {
  const definition = worldObjectById(worldObjectId)!;
  const { width, height } = definition.footprintMetres;
  return {
    ...BASTION_ARENA,
    obstacles: Object.freeze([
      Object.freeze({
        id: "test-interactable",
        worldObjectId,
        kind: definition.visualKind ?? "cargo-crate",
        x: BASTION_ARENA.widthMetres / 2 + offsetMetres,
        y: BASTION_ARENA.heightMetres / 2 - height / 2,
        width,
        height,
        maxDurability: definition.durability ?? undefined,
      }),
    ]),
    hazards: Object.freeze([]),
  } as ArenaDefinition;
}

/**
 * Holds the interact key and gathers every event raised along the way.
 * `snapshot.events` is per-frame, so a completion two ticks ago is not visible
 * in the final snapshot — collect as you go or you will miss it.
 */
function hold(simulation: CombatSimulation, seconds: number): CombatSnapshot["events"][number][] {
  const events: CombatSnapshot["events"][number][] = [];
  for (let tick = 0; tick < Math.ceil(seconds / 0.05); tick += 1) {
    const snapshot = simulation.step(intent({ interactHeld: true, interactPressed: tick === 0 }), 0.05);
    events.push(...snapshot.events);
  }
  return events;
}

describe("world interaction runtime", () => {
  it("offers a prompt when in range and none when out of range", () => {
    const near = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("supply-chest") });
    near.step(intent(), 0.05);
    const prompt = near.snapshot().worldInteractionPrompt;
    expect(prompt?.worldObjectId).toBe("supply-chest");
    expect(prompt?.verb).toBe("OPEN");

    const far = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("supply-chest", 14) });
    far.step(intent(), 0.05);
    expect(far.snapshot().worldInteractionPrompt).toBeNull();
  });

  it("completes a hold and pays out the loot", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("supply-chest") });
    const scrapBefore = simulation.snapshot().securedScrap;
    const events = hold(simulation, 1);

    const completed = events.find((event) => event.type === "world-interaction-completed");
    expect(completed).toBeDefined();
    expect(simulation.snapshot().securedScrap).toBeGreaterThan(scrapBefore);
    // open-loot mirrors a sealed chest: scrap plus a medkit on the floor.
    expect(simulation.snapshot().powerups.some((p) => p.type === "medkit")).toBe(true);
  });

  it("does not complete without the key held", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("supply-chest") });
    for (let tick = 0; tick < 40; tick += 1) simulation.step(intent(), 0.05);
    expect(simulation.snapshot().securedScrap).toBe(0);
    expect(simulation.snapshot().worldInteractionPrompt?.holding ?? false).toBe(false);
  });

  it("reports hold progress so the HUD can draw a ring", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("scrap-seam") });
    // Scrap Seam takes 2s, so a few ticks land mid-hold rather than completing.
    for (let tick = 0; tick < 10; tick += 1) {
      simulation.step(intent({ interactHeld: true, interactPressed: tick === 0 }), 0.05);
    }
    const prompt = simulation.snapshot().worldInteractionPrompt;
    expect(prompt?.verb).toBe("HARVEST");
    expect(prompt?.holding).toBe(true);
    expect(prompt?.progress).toBeGreaterThan(0);
    expect(prompt?.progress).toBeLessThan(1);
  });

  it("pays Scrap Seam through the harvest verb, and only once", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("scrap-seam") });
    hold(simulation, 2.5);
    const afterFirst = simulation.snapshot().securedScrap;
    expect(afterFirst).toBeGreaterThan(0);
    // The seam is not repeatable; holding again must not print money.
    hold(simulation, 2.5);
    expect(simulation.snapshot().securedScrap).toBe(afterFirst);
    expect(simulation.snapshot().worldInteractionPrompt).toBeNull();
  });

  it("stops offering an interaction once the object is destroyed", () => {
    // A wide, flimsy object: the point is the destroyed→no-prompt transition,
    // not time-to-kill. Wide matters — projectile/obstacle collision is point
    // sampled each tick, and a rifle round covers more ground per tick than a
    // 1.3m crate is deep, so a narrow target can sit between two samples.
    const arena = arenaWith("reinforced-gate") as ArenaDefinition;
    const gate = arena.obstacles[0]!;
    const flimsy = {
      ...arena,
      obstacles: Object.freeze([Object.freeze({ ...gate, maxDurability: 3 })]),
    } as ArenaDefinition;

    const simulation = new CombatSimulation({ autoStartWaves: false, arena: flimsy });
    simulation.step(intent(), 0.05);
    expect(simulation.snapshot().worldInteractionPrompt).not.toBeNull();

    // Shoot it apart instead of opening it.
    for (let tick = 0; tick < 200; tick += 1) simulation.step(intent({ fireHeld: true }), 0.05);
    expect(simulation.snapshot().destroyedObstacleIds).toContain("test-interactable");
    expect(simulation.snapshot().worldInteractionPrompt).toBeNull();
  });

  it("open-gate clears the gate from collision without gunfire", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, arena: arenaWith("reinforced-gate") });
    expect(simulation.snapshot().destroyedObstacleIds).toHaveLength(0);
    hold(simulation, 1);
    // The gate has 1600 durability — no weapon opens it in a second, and this
    // hold never fires. Only the verb can have cleared it.
    expect(simulation.snapshot().destroyedObstacleIds).toContain("test-interactable");
  });

  it("resolves stacked interactables one at a time, not all on one press", () => {
    const definition = worldObjectById("supply-chest")!;
    const { width, height } = definition.footprintMetres;
    const centreX = BASTION_ARENA.widthMetres / 2;
    const centreY = BASTION_ARENA.heightMetres / 2;
    const arena = {
      ...BASTION_ARENA,
      obstacles: Object.freeze([
        // Centres land at +1.45 and -1.60 from the player: "near" is genuinely
        // nearer, and both stay inside the 1.75m prompt reach.
        Object.freeze({ id: "near", worldObjectId: "supply-chest", kind: "cargo-crate", x: centreX + 0.8, y: centreY - height / 2, width, height, maxDurability: 120 }),
        Object.freeze({ id: "far", worldObjectId: "supply-chest", kind: "cargo-crate", x: centreX - 2.25, y: centreY - height / 2, width, height, maxDurability: 120 }),
      ]),
      hazards: Object.freeze([]),
    } as ArenaDefinition;

    const simulation = new CombatSimulation({ autoStartWaves: false, arena });
    // A chest takes 0.35s. After 0.4s of holding exactly one has opened — the
    // nearer one — even though both are inside reach the whole time.
    const early = hold(simulation, 0.4).filter((event) => event.type === "world-interaction-completed");
    expect(early).toHaveLength(1);
    expect(early[0]).toMatchObject({ objectId: "near" });

    // Keep holding and the second follows, sequentially rather than together.
    const later = hold(simulation, 0.5).filter((event) => event.type === "world-interaction-completed");
    expect(later).toHaveLength(1);
    expect(later[0]).toMatchObject({ objectId: "far" });
  });
});
