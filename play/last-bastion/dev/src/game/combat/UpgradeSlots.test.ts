import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import { UPGRADE_CATALOG, UPGRADE_SLOT_HARD_CAP } from "../content/upgradeCatalog";
import { MARINE } from "../hero/marine";

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

/**
 * Kills an adjacent elite and collects its cache. Level-up decisions from the
 * elite's XP shard are resolved along the way; returns the first non-upgrade
 * decision (the cache reward), or null when none appears.
 */
function collectEliteCache(simulation: CombatSimulation) {
  const player = simulation.snapshot().playerPosition;
  const eliteId = simulation.spawnElite("carapace-scuttler", { x: player.x + 0.5, y: player.y });
  simulation.dealDamage(eliteId, 9999);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const snapshot = simulation.step(intent(), 0.05);
    const decision = snapshot.pendingDecision;
    if (!decision) continue;
    if (decision.kind === "upgrade") {
      simulation.chooseOption(decision.options[0]!.id);
      continue;
    }
    return decision;
  }
  return null;
}

describe("categorized upgrade slots", () => {
  it("starts the Marine with a balanced 7-slot profile under the hard cap", () => {
    const slots = new CombatSimulation({ autoStartWaves: false }).snapshot().upgradeSlots;
    const byCategory = Object.fromEntries(slots.map((slot) => [slot.category, slot.capacity]));
    expect(byCategory).toEqual({ offensive: 3, defensive: 2, support: 1, scavenger: 1 });
    const total = slots.reduce((sum, slot) => sum + slot.capacity, 0);
    expect(total).toBe(7);
    expect(total).toBeLessThanOrEqual(UPGRADE_SLOT_HARD_CAP);
    expect(MARINE.upgradeSlots.offensive).toBe(3);
  });

  it("stops offering new upgrades in a full category while allowing levels", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const ownedOffensive = new Set<string>();

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const snapshot = simulation.snapshot();
      if (snapshot.pendingDecision?.kind !== "upgrade") {
        simulation.addExperience(snapshot.experienceForNextLevel);
        continue;
      }
      const offensiveCapacity = snapshot.upgradeSlots
        .find((slot) => slot.category === "offensive")!.capacity;
      for (const option of snapshot.pendingDecision.options) {
        const definition = UPGRADE_CATALOG[option.id as keyof typeof UPGRADE_CATALOG];
        if (
          definition.category === "offensive"
          && !ownedOffensive.has(option.id)
          && ownedOffensive.size >= offensiveCapacity
        ) {
          throw new Error(`New offensive upgrade ${option.id} offered with no free slot`);
        }
      }
      const newOffensive = snapshot.pendingDecision.options.find((option) => (
        UPGRADE_CATALOG[option.id as keyof typeof UPGRADE_CATALOG].category === "offensive"
        && !ownedOffensive.has(option.id)
      ));
      const chosen = newOffensive ?? snapshot.pendingDecision.options[0]!;
      if (UPGRADE_CATALOG[chosen.id as keyof typeof UPGRADE_CATALOG].category === "offensive") {
        ownedOffensive.add(chosen.id);
      }
      simulation.chooseOption(chosen.id);
      if (ownedOffensive.size > 3) {
        throw new Error("Acquired more distinct offensive upgrades than slots allow");
      }
    }

    expect(ownedOffensive.size).toBe(3);
  });

  it("labels upgrade offers with their slot category", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    simulation.addExperience(10);
    const decision = simulation.snapshot().pendingDecision;
    expect(decision?.kind).toBe("upgrade");
    for (const option of decision!.options) {
      expect(option.description.startsWith("[")).toBe(true);
    }
  });

  it("turns an elite cache into a slot-requisition choice that grows a category", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });
    const decision = collectEliteCache(simulation);
    expect(decision?.kind).toBe("slot-requisition");
    expect(decision!.options.length).toBeLessThanOrEqual(3);
    for (const option of decision!.options) {
      expect(option.id.startsWith("slot-")).toBe(true);
    }

    const before = simulation.snapshot().upgradeSlots
      .find((slot) => slot.category === "offensive")!.capacity;
    const offensiveOffered = decision!.options.some((option) => option.id === "slot-offensive");
    const chosen = offensiveOffered ? "slot-offensive" : decision!.options[0]!.id;
    expect(simulation.chooseOption(chosen)).toBe(true);
    const slots = simulation.snapshot().upgradeSlots;
    const total = slots.reduce((sum, slot) => sum + slot.capacity, 0);
    expect(total).toBe(8);
    if (offensiveOffered) {
      expect(slots.find((slot) => slot.category === "offensive")!.capacity).toBe(before + 1);
    }
  });

  it("stops granting slots at the hard cap and falls back to experience", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false });

    for (let grant = 0; grant < UPGRADE_SLOT_HARD_CAP - 7; grant += 1) {
      const decision = collectEliteCache(simulation);
      expect(decision?.kind).toBe("slot-requisition");
      expect(simulation.chooseOption(decision!.options[0]!.id)).toBe(true);
    }

    const total = simulation.snapshot().upgradeSlots
      .reduce((sum, slot) => sum + slot.capacity, 0);
    expect(total).toBe(UPGRADE_SLOT_HARD_CAP);

    const overflow = collectEliteCache(simulation);
    expect(overflow?.kind).not.toBe("slot-requisition");
  });
});
