import { describe, expect, it } from "vitest";
import type { ExpeditionBuildSnapshot } from "./ExpeditionRun";
import {
  applyEventResolutionToBuild,
  ENCOUNTER_EVENT_CATALOG,
  eligibleEvents,
  emptySideEffects,
  encounterEventById,
  isChoiceAvailable,
  pickWeightedBranch,
  resolveEventChoice,
  selectEncounterEvent,
  type EncounterEventDefinition,
  type EventChoice,
  type EventResolution,
} from "./EncounterEventCatalog";

function build(overrides: Partial<ExpeditionBuildSnapshot> = {}): ExpeditionBuildSnapshot {
  return {
    health: 40,
    shield: 0,
    level: 5,
    experience: 100,
    scrap: 100,
    weapons: [{ weaponId: "wpn-service-rifle", tier: 1 }],
    upgrades: [],
    ...overrides,
  };
}

function choiceById(event: EncounterEventDefinition, id: string): EventChoice {
  const choice = event.choices.find((candidate) => candidate.id === id);
  if (!choice) {
    throw new Error(`missing choice ${id} on ${event.id}`);
  }
  return choice;
}

describe("catalog integrity", () => {
  it("has unique ids and both kinds represented", () => {
    const ids = ENCOUNTER_EVENT_CATALOG.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ENCOUNTER_EVENT_CATALOG.some((event) => event.kind === "shrine")).toBe(true);
    expect(ENCOUNTER_EVENT_CATALOG.some((event) => event.kind === "event")).toBe(true);
  });

  it("gives every card an always-available leave choice so no node can trap the player", () => {
    for (const event of ENCOUNTER_EVENT_CATALOG) {
      const leave = event.choices.find((choice) => choice.id === "leave");
      expect(leave, `${event.id} needs a leave choice`).toBeDefined();
      expect(leave!.requirement).toBeUndefined();
    }
  });

  it("gives every choice exactly one of deterministic or random outcomes", () => {
    for (const event of ENCOUNTER_EVENT_CATALOG) {
      for (const choice of event.choices) {
        const hasFixed = choice.outcomes !== undefined;
        const hasRandom = choice.randomOutcomes !== undefined;
        expect(hasFixed !== hasRandom, `${event.id}/${choice.id}`).toBe(true);
        if (hasRandom) {
          expect(choice.randomOutcomes!.every((branch) => branch.weight > 0)).toBe(true);
        }
      }
    }
  });

  it("looks up definitions by id", () => {
    expect(encounterEventById("shrine-steel")?.kind).toBe("shrine");
    expect(encounterEventById("event-derelict-dropship")?.kind).toBe("event");
    expect(encounterEventById("nope")).toBeNull();
  });
});

describe("column eligibility and selection", () => {
  it("filters a kind by minColumn", () => {
    const earlyShrines = eligibleEvents("shrine", 0);
    expect(earlyShrines.length).toBe(0); // every shrine gates to column >= 2
    const midShrines = eligibleEvents("shrine", 3);
    expect(midShrines.length).toBeGreaterThan(0);
    expect(midShrines.every((event) => event.kind === "shrine" && event.minColumn <= 3)).toBe(true);
  });

  it("selects deterministically for a seed and returns null when nothing is eligible", () => {
    const first = selectEncounterEvent("event", 12345, 4);
    const again = selectEncounterEvent("event", 12345, 4);
    expect(first?.id).toBe(again?.id);
    expect(first?.kind).toBe("event");
    expect(selectEncounterEvent("shrine", 1, 0)).toBeNull();
  });
});

describe("requirement gating", () => {
  it("hides the reliquary payment when scrap is short", () => {
    const reliquary = encounterEventById("shrine-reliquary")!;
    const pay = choiceById(reliquary, "pay-reliquary");
    expect(isChoiceAvailable(build({ scrap: 60 }), 60, pay)).toBe(true);
    expect(isChoiceAvailable(build({ scrap: 59 }), 60, pay)).toBe(false);
  });

  it("hides a max-health cost that would drop the player below the floor", () => {
    const steel = encounterEventById("shrine-steel")!;
    const slot = choiceById(steel, "forge-slot"); // -4 max, floor 10 → needs max >= 14
    expect(isChoiceAvailable(build(), 14, slot)).toBe(true);
    expect(isChoiceAvailable(build(), 13, slot)).toBe(false);
  });

  it("hides a health cost the player cannot pay", () => {
    const merchant = encounterEventById("event-star-merchant")!;
    const sell = choiceById(merchant, "sell-blood"); // needs health >= 5
    expect(isChoiceAvailable(build({ health: 5 }), 18, sell)).toBe(true);
    expect(isChoiceAvailable(build({ health: 4 }), 18, sell)).toBe(false);
  });

  it("treats the leave choice as always available", () => {
    for (const event of ENCOUNTER_EVENT_CATALOG) {
      const leave = choiceById(event, "leave");
      expect(isChoiceAvailable(build({ scrap: 0, health: 1 }), 10, leave)).toBe(true);
    }
  });
});

describe("deterministic resolution", () => {
  it("applies a max-health cost and grants a weapon slot, trimming current health to the new ceiling", () => {
    const steel = encounterEventById("shrine-steel")!;
    const slot = choiceById(steel, "forge-slot");
    const result = resolveEventChoice(build({ health: 18 }), 18, slot, 0);
    expect(result.effects.maxHealthDelta).toBe(-4);
    expect(result.effects.weaponSlotsGranted).toBe(1);
    expect(result.build.health).toBe(14); // clamped to 18 - 4
  });

  it("heals to full against the current max and never overshoots", () => {
    const altar = encounterEventById("shrine-fleshwright")!;
    const graft = choiceById(altar, "accept-graft"); // -4, heal full, +5 shield
    const result = resolveEventChoice(build({ health: 10 }), 18, graft, 0);
    expect(result.build.health).toBe(18);
    expect(result.build.shield).toBe(5);
  });

  it("floors damage at 1 and scrap at 0", () => {
    const bloom = encounterEventById("event-spore-bloom")!;
    const push = choiceById(bloom, "push-through"); // -4 health, +40 scrap
    const result = resolveEventChoice(build({ health: 2, scrap: 0 }), 18, push, 0);
    expect(result.build.health).toBe(1);
    expect(result.build.scrap).toBe(40);
  });

  it("strengthens the last weapon and caps at tier III", () => {
    const steel = encounterEventById("shrine-steel")!;
    const temper = choiceById(steel, "forge-weapon");
    const once = resolveEventChoice(build({ weapons: [{ weaponId: "wpn-scattergun", tier: 2 }] }), 60, temper, 0);
    expect(once.build.weapons[0]!.tier).toBe(3);
    const capped = resolveEventChoice(build({ weapons: [{ weaponId: "wpn-scattergun", tier: 3 }] }), 60, temper, 0);
    expect(capped.build.weapons[0]!.tier).toBe(3);
  });

  it("records the guaranteed-elite-relic next-node modifier", () => {
    const hunt = encounterEventById("shrine-hunt")!;
    const accept = choiceById(hunt, "accept-hunt");
    const result = resolveEventChoice(build(), 60, accept, 0);
    expect(result.effects.guaranteedEliteRelicNextNode).toBe(true);
  });

  it("purchases a relic, spending scrap and carrying the relic id forward", () => {
    const merchant = encounterEventById("event-star-merchant")!;
    const buy = choiceById(merchant, "buy-relic"); // -50 scrap, +relic
    const result = resolveEventChoice(build({ scrap: 100 }), 60, buy, 0);
    expect(result.build.scrap).toBe(50);
    expect(result.effects.relicIds.length).toBe(1);
  });

  it("leaves the build untouched on the leave choice", () => {
    const dropship = encounterEventById("event-derelict-dropship")!;
    const before = build();
    const result = resolveEventChoice(before, 60, choiceById(dropship, "leave"), 0);
    expect(result.build).toEqual(before);
    expect(result.effects).toEqual(emptySideEffects());
  });
});

describe("weighted gamble resolution", () => {
  it("selects branches across the weight range and reproduces per roll", () => {
    const dropship = encounterEventById("event-derelict-dropship")!;
    const search = choiceById(dropship, "search-cargo"); // weights 4 / 3 / 3
    const low = resolveEventChoice(build({ scrap: 0 }), 60, search, 0.0);
    const mid = resolveEventChoice(build({ scrap: 0 }), 60, search, 0.5);
    const high = resolveEventChoice(build({ scrap: 0 }), 60, search, 0.99);
    // First branch: scrap; last branch: ambush.
    expect(low.build.scrap).toBe(45);
    expect(high.effects.ambush).not.toBeNull();
    expect(high.effects.ambush!.threatBudget).toBe(55);
    // Same roll → same branch.
    expect(resolveEventChoice(build({ scrap: 0 }), 60, search, 0.5)).toEqual(mid);
  });

  it("maps roll to weight boundaries precisely", () => {
    const branches = [
      { weight: 4, resultText: "a", outcomes: [{ type: "scrap", delta: 1 } as const] },
      { weight: 3, resultText: "b", outcomes: [{ type: "scrap", delta: 2 } as const] },
      { weight: 3, resultText: "c", outcomes: [{ type: "scrap", delta: 3 } as const] },
    ];
    // total 10: [0,4) → a, [4,7) → b, [7,10) → c
    expect(pickWeightedBranch(branches, 0.0).resultText).toBe("a");
    expect(pickWeightedBranch(branches, 0.39).resultText).toBe("a");
    expect(pickWeightedBranch(branches, 0.4).resultText).toBe("b");
    expect(pickWeightedBranch(branches, 0.69).resultText).toBe("b");
    expect(pickWeightedBranch(branches, 0.7).resultText).toBe("c");
    expect(pickWeightedBranch(branches, 0.999).resultText).toBe("c");
  });
});

describe("applyEventResolutionToBuild", () => {
  function resolution(effects: Partial<EventResolution["effects"]>, buildOverrides: Partial<ReturnType<typeof build>> = {}): EventResolution {
    return {
      build: build(buildOverrides),
      effects: { ...emptySideEffects(), ...effects },
      resultText: "",
    };
  }

  it("accumulates granted relics onto any already owned", () => {
    const merged = applyEventResolutionToBuild(resolution(
      { relicIds: ["rel-blast-baffle"] },
      { relicIds: ["rel-field-lattice"] },
    ));
    expect(merged.relicIds).toEqual(["rel-field-lattice", "rel-blast-baffle"]);
  });

  it("equips the last granted artifact, replacing any prior", () => {
    const merged = applyEventResolutionToBuild(resolution(
      { artifactIds: ["art-broodbreaker-seal"] },
      { equippedArtifactId: "art-event-horizon-core" },
    ));
    expect(merged.equippedArtifactId).toBe("art-broodbreaker-seal");
  });

  it("keeps the prior artifact when none is granted", () => {
    const merged = applyEventResolutionToBuild(resolution({}, { equippedArtifactId: "art-last-bastion-protocol" }));
    expect(merged.equippedArtifactId).toBe("art-last-bastion-protocol");
  });

  it("adds max-health and weapon-slot bonuses on top of existing carriers", () => {
    const merged = applyEventResolutionToBuild(resolution(
      { maxHealthDelta: -20, weaponSlotsGranted: 1 },
      { maxHealthBonus: -12, weaponSlotBonus: 1 },
    ));
    expect(merged.maxHealthBonus).toBe(-32);
    expect(merged.weaponSlotBonus).toBe(2);
  });

  it("carries a real Shrine of Steel resolution end to end", () => {
    const steel = encounterEventById("shrine-steel")!;
    const slot = choiceById(steel, "forge-slot");
    const resolved = resolveEventChoice(build({ health: 18 }), 18, slot, 0);
    const merged = applyEventResolutionToBuild(resolved);
    expect(merged.maxHealthBonus).toBe(-4);
    expect(merged.weaponSlotBonus).toBe(1);
    expect(merged.health).toBe(14);
  });
});
