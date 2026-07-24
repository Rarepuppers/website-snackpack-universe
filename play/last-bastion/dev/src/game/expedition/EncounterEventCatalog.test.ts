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

  it("holds the expanded catalogue (15 shrines + 39 events)", () => {
    const shrines = ENCOUNTER_EVENT_CATALOG.filter((event) => event.kind === "shrine");
    const events = ENCOUNTER_EVENT_CATALOG.filter((event) => event.kind === "event");
    expect(shrines).toHaveLength(15);
    expect(events).toHaveLength(39);
  });

  it("resolves a new escort event into an ambush plus a relic", () => {
    const refugee = encounterEventById("event-refugee-column")!;
    const escort = refugee.choices.find((choice) => choice.id === "escort")!;
    const result = resolveEventChoice(build(), 18, escort, 0);
    expect(result.effects.ambush).not.toBeNull();
    expect(result.effects.relicIds.length).toBe(1);
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

describe("Phase 2 enabler outcomes", () => {
  function choiceWith(outcomes: EventChoice["outcomes"]): EventChoice {
    return { id: "test", label: "Test", outcomes };
  }

  it("grantConsumable carries a kit forward as a consumable side effect", () => {
    const result = resolveEventChoice(build(), 60, choiceWith([
      { type: "grantConsumable", powerupType: "siege-loader" },
    ]), 0);
    expect(result.effects.consumables).toEqual(["siege-loader"]);
    const merged = applyEventResolutionToBuild(result);
    expect(merged.carriedConsumables).toEqual(["siege-loader"]);
  });

  it("pickUpgradeFromSet deterministically draws one option by roll and levels an owned one", () => {
    const fresh = resolveEventChoice(build(), 60, choiceWith([
      { type: "pickUpgradeFromSet", upgradeIds: ["upg-a", "upg-b", "upg-c"] },
    ]), 0.5);
    expect(fresh.build.upgrades).toEqual([{ upgradeId: "upg-b", level: 1 }]);

    const owned = resolveEventChoice(build({ upgrades: [{ upgradeId: "upg-b", level: 1 }] }), 60, choiceWith([
      { type: "pickUpgradeFromSet", upgradeIds: ["upg-a", "upg-b", "upg-c"] },
    ]), 0.5);
    expect(owned.build.upgrades).toEqual([{ upgradeId: "upg-b", level: 2 }]);
  });

  it("removeUpgrade drops a level from the most recently taken upgrade, removing it at zero", () => {
    const twoLevels = build({ upgrades: [{ upgradeId: "upg-a", level: 2 }] });
    const stepDown = resolveEventChoice(twoLevels, 60, choiceWith([{ type: "removeUpgrade" }]), 0);
    expect(stepDown.build.upgrades).toEqual([{ upgradeId: "upg-a", level: 1 }]);

    const oneLevel = build({ upgrades: [{ upgradeId: "upg-a", level: 1 }] });
    const removed = resolveEventChoice(oneLevel, 60, choiceWith([{ type: "removeUpgrade" }]), 0);
    expect(removed.build.upgrades).toEqual([]);
  });

  it("purifyRelic removes a named relic, or the most recently owned one", () => {
    const withTwo = build({ relicIds: ["rel-blast-baffle", "rel-field-lattice"] });
    const named = resolveEventChoice(withTwo, 60, choiceWith([
      { type: "purifyRelic", relicId: "rel-blast-baffle" },
    ]), 0);
    expect(named.build.relicIds).toEqual(["rel-field-lattice"]);

    const unnamed = resolveEventChoice(withTwo, 60, choiceWith([{ type: "purifyRelic" }]), 0);
    expect(unnamed.build.relicIds).toEqual(["rel-blast-baffle"]);
  });

  it("fullCleanse heals to full and undoes an accumulated negative max-health bonus", () => {
    const scarred = build({ health: 10, maxHealthBonus: -8 });
    const result = resolveEventChoice(scarred, 12, choiceWith([{ type: "fullCleanse" }]), 0);
    expect(result.effects.maxHealthDelta).toBe(8);
    expect(result.build.health).toBe(20); // 12 (current max) + 8 restored
  });

  it("transmogrifyWeapon consumes weapons off the rack and grants one result weapon", () => {
    const twoWeapons = build({
      weapons: [{ weaponId: "wpn-scattergun", tier: 1 }, { weaponId: "wpn-arc-carbine", tier: 2 }],
    });
    const result = resolveEventChoice(twoWeapons, 60, choiceWith([
      { type: "transmogrifyWeapon", resultWeaponId: "wpn-railspike", resultTier: 2, consumeCount: 2 },
    ]), 0);
    expect(result.build.weapons).toEqual([{ weaponId: "wpn-railspike", tier: 2 }]);
  });

  it("duplicateWeapon adds a copy of the last-equipped weapon", () => {
    const result = resolveEventChoice(build({ weapons: [{ weaponId: "wpn-scattergun", tier: 2 }] }), 60, choiceWith([
      { type: "duplicateWeapon" },
    ]), 0);
    expect(result.build.weapons).toEqual([
      { weaponId: "wpn-scattergun", tier: 2 },
      { weaponId: "wpn-scattergun", tier: 2 },
    ]);
  });

  it("duplicateRelic adds a second copy of a named or most-recently-owned relic id", () => {
    const owned = build({ relicIds: ["rel-blast-baffle"] });
    const result = resolveEventChoice(owned, 60, choiceWith([{ type: "duplicateRelic" }]), 0);
    expect(result.build.relicIds).toEqual(["rel-blast-baffle", "rel-blast-baffle"]);
  });

  it("swapStat converts scrap into max health", () => {
    const result = resolveEventChoice(build({ scrap: 50, health: 18 }), 18, choiceWith([
      { type: "swapStat", from: "scrap", to: "maxHealth", amount: 20 },
    ]), 0);
    expect(result.build.scrap).toBe(30);
    expect(result.effects.maxHealthDelta).toBe(20);
    expect(result.build.health).toBe(38);
  });

  it("swapStat spends health for scrap without dropping below one", () => {
    const result = resolveEventChoice(build({ scrap: 0, health: 5 }), 18, choiceWith([
      { type: "swapStat", from: "health", to: "scrap", amount: 10 },
    ]), 0);
    expect(result.build.health).toBe(1);
    expect(result.build.scrap).toBe(4);
  });

  it("grantLifesteal records a bonus lifesteal-per-kill side effect that carries onto the build", () => {
    const result = resolveEventChoice(build(), 60, choiceWith([{ type: "grantLifesteal", amount: 0.1 }]), 0);
    expect(result.effects.bonusLifestealPerKill).toBe(0.1);
    const merged = applyEventResolutionToBuild(result);
    expect(merged.bonusLifestealPerKill).toBe(0.1);
  });
});

describe("Phase 2 event cards", () => {
  it("Cryo Shrine cleanses via the real card", () => {
    const cryo = encounterEventById("shrine-cryo")!;
    const result = resolveEventChoice(build({ health: 10, maxHealthBonus: -6 }), 16, choiceById(cryo, "step-in"), 0);
    expect(result.effects.maxHealthDelta).toBe(6);
    expect(result.build.health).toBe(22);
  });

  it("Forge of the Fallen gambles a sacrificed weapon into one of three results", () => {
    const forge = encounterEventById("shrine-forge-fallen")!;
    const sacrifice = choiceById(forge, "sacrifice-weapon");
    const withWeapon = build({ weapons: [{ weaponId: "scattergun", tier: 1 }] });
    const low = resolveEventChoice(withWeapon, 60, sacrifice, 0);
    const high = resolveEventChoice(withWeapon, 60, sacrifice, 0.99);
    expect(low.build.weapons).toEqual([{ weaponId: "bulwark-rotary-cannon", tier: 2 }]);
    expect(high.build.weapons).toEqual([{ weaponId: "arc-carbine", tier: 2 }]);
  });

  it("Duplication Vat duplicates a weapon or a relic via the real card", () => {
    const vat = encounterEventById("shrine-duplication-vat")!;
    const startWeapons = build({ weapons: [{ weaponId: "patrol-blade", tier: 1 }] });
    const weaponResult = resolveEventChoice(startWeapons, 60, choiceById(vat, "duplicate-weapon"), 0);
    expect(weaponResult.build.weapons).toEqual([
      { weaponId: "patrol-blade", tier: 1 },
      { weaponId: "patrol-blade", tier: 1 },
    ]);

    const startRelics = build({ relicIds: ["rel-kinetic-greaves"] });
    const relicResult = resolveEventChoice(startRelics, 60, choiceById(vat, "duplicate-relic"), 0);
    expect(relicResult.build.relicIds).toEqual(["rel-kinetic-greaves", "rel-kinetic-greaves"]);
  });

  it("Purifier Station purges an upgrade or a relic and pays scrap either way", () => {
    const purifier = encounterEventById("shrine-purifier")!;
    const upgradeResult = resolveEventChoice(
      build({ upgrades: [{ upgradeId: "rapid-cycling", level: 2 }], scrap: 0 }),
      60,
      choiceById(purifier, "purge-upgrade"),
      0,
    );
    expect(upgradeResult.build.upgrades).toEqual([{ upgradeId: "rapid-cycling", level: 1 }]);
    expect(upgradeResult.build.scrap).toBe(20);

    const relicResult = resolveEventChoice(
      build({ relicIds: ["rel-hunters-beacon"], scrap: 0 }),
      60,
      choiceById(purifier, "purge-relic"),
      0,
    );
    expect(relicResult.build.relicIds).toEqual([]);
    expect(relicResult.build.scrap).toBe(20);
  });

  it("Weapon Smuggler trades two weapons for one heavier one", () => {
    const smuggler = encounterEventById("event-weapon-smuggler")!;
    const result = resolveEventChoice(
      build({ weapons: [{ weaponId: "scattergun", tier: 1 }, { weaponId: "arc-carbine", tier: 1 }] }),
      60,
      choiceById(smuggler, "trade-up"),
      0,
    );
    expect(result.build.weapons).toEqual([{ weaponId: "bulwark-rotary-cannon", tier: 2 }]);
  });

  it("Rogue Server draws one upgrade from the offered set by roll", () => {
    const server = encounterEventById("event-rogue-server")!;
    const download = choiceById(server, "download");
    const first = resolveEventChoice(build(), 60, download, 0);
    const last = resolveEventChoice(build(), 60, download, 0.99);
    expect(first.build.upgrades).toEqual([{ upgradeId: "rapid-cycling", level: 1 }]);
    expect(last.build.upgrades).toEqual([{ upgradeId: "composite-plating", level: 1 }]);
  });

  it("Whispering Cargo swaps out the most recently owned relic for a fresh one", () => {
    const cargo = encounterEventById("event-whispering-cargo")!;
    const result = resolveEventChoice(build({ relicIds: ["rel-blast-baffle"] }), 60, choiceById(cargo, "trade-relic"), 0.3);
    expect(result.effects.relicIds.length).toBe(1);
    const merged = applyEventResolutionToBuild(result);
    // The old relic id was removed from the base and the new one appended.
    expect(merged.relicIds).not.toContain("rel-blast-baffle");
    expect(merged.relicIds!.length).toBe(1);
  });

  it("Chimera Experiment converts health to scrap or scrap to max health", () => {
    const chimera = encounterEventById("event-chimera-experiment")!;
    const fleshForScrap = resolveEventChoice(build({ health: 18, scrap: 0 }), 18, choiceById(chimera, "flesh-for-scrap"), 0);
    expect(fleshForScrap.build.health).toBe(8);
    expect(fleshForScrap.build.scrap).toBe(10);

    const scrapForFlesh = resolveEventChoice(build({ health: 18, scrap: 20 }), 18, choiceById(chimera, "scrap-for-flesh"), 0);
    expect(scrapForFlesh.build.scrap).toBe(0);
    expect(scrapForFlesh.effects.maxHealthDelta).toBe(20);
    expect(scrapForFlesh.build.health).toBe(38);
  });
});

describe("Phase 3: grantTransformationAffinity", () => {
  function choiceWith(outcomes: EventChoice["outcomes"]): EventChoice {
    return { id: "test", label: "Test", outcomes };
  }

  it("applies one pick by default, tracked in the build's transformation state", () => {
    const result = resolveEventChoice(build(), 60, choiceWith([
      { type: "grantTransformationAffinity", choiceId: "dense-tissue" },
    ]), 0);
    expect(result.build.transformation?.paths).toEqual([
      { pathId: "mutagenic-evolution", affinity: 1, choiceIds: ["dense-tissue"] },
    ]);
    expect(result.build.transformation?.committedPathId).toBeNull();
  });

  it("applies multiple picks via count, committing the path at 3 Affinity", () => {
    const result = resolveEventChoice(build(), 60, choiceWith([
      { type: "grantTransformationAffinity", choiceId: "dense-tissue", count: 3 },
    ]), 0);
    expect(result.build.transformation?.committedPathId).toBe("mutagenic-evolution");
    expect(result.build.transformation?.paths[0]?.affinity).toBe(3);
  });

  it("stops early and no-ops the remainder once a path is locked to a different committed path", () => {
    const locked = resolveEventChoice(
      build({
        transformation: {
          committedPathId: "cultist-doctrine",
          paths: [{ pathId: "cultist-doctrine", affinity: 3, choiceIds: ["zealous-fervor", "zealous-fervor", "zealous-fervor"] }],
        },
      }),
      60,
      choiceWith([{ type: "grantTransformationAffinity", choiceId: "dense-tissue", count: 3 }]),
      0,
    );
    // The already-committed Church path is untouched; the attempted Mutagenic pick never lands.
    expect(locked.build.transformation?.committedPathId).toBe("cultist-doctrine");
    expect(locked.build.transformation?.paths.some((path) => path.pathId === "mutagenic-evolution")).toBe(false);
  });

  it("leaves the build's transformation field absent when the outcome never runs", () => {
    const before = build();
    const result = resolveEventChoice(before, 60, choiceWith([{ type: "nothing" }]), 0);
    expect(result.build.transformation).toBeUndefined();
  });

  it("carries the granted affinity through applyEventResolutionToBuild", () => {
    const result = resolveEventChoice(build(), 60, choiceWith([
      { type: "grantTransformationAffinity", choiceId: "zealous-fervor" },
    ]), 0);
    const merged = applyEventResolutionToBuild(result);
    expect(merged.transformation?.paths[0]?.pathId).toBe("cultist-doctrine");
  });
});

describe("Phase 3 event cards", () => {
  it("Blood Market trades health for scrap, a relic, or a random kit", () => {
    const market = encounterEventById("event-blood-market")!;
    const scrapResult = resolveEventChoice(build({ health: 10, scrap: 0 }), 10, choiceById(market, "sell-blood-scrap"), 0);
    expect(scrapResult.build.health).toBe(4);
    expect(scrapResult.build.scrap).toBe(35);

    const relicResult = resolveEventChoice(build({ health: 12 }), 12, choiceById(market, "sell-blood-relic"), 0);
    expect(relicResult.build.health).toBe(3);
    expect(relicResult.effects.relicIds.length).toBe(1);

    const kitChoice = choiceById(market, "sell-blood-kit");
    const kitResult = resolveEventChoice(build({ health: 8 }), 8, kitChoice, 0);
    expect(kitResult.build.health).toBe(4);
    expect(kitResult.effects.consumables).toEqual(["siege-loader"]);
  });

  it("Vampire Coven pays max health for lifesteal", () => {
    const coven = encounterEventById("event-vampire-coven")!;
    const result = resolveEventChoice(build({ health: 18 }), 18, choiceById(coven, "join-feeding"), 0);
    expect(result.effects.maxHealthDelta).toBe(-3);
    expect(result.effects.bonusLifestealPerKill).toBeCloseTo(0.12);
  });

  it("Fleshcraft Vat pays max health for Alien Symbiosis Affinity", () => {
    const vat = encounterEventById("event-fleshcraft-vat")!;
    const result = resolveEventChoice(build({ health: 18 }), 18, choiceById(vat, "enter-vat"), 0);
    expect(result.effects.maxHealthDelta).toBe(-3);
    expect(result.build.transformation?.paths[0]).toEqual({
      pathId: "alien-symbiosis",
      affinity: 1,
      choiceIds: ["feeding-tendrils"],
    });
  });

  it("Cybernetics Bay grants Cybernetic Ascension Affinity either by max health or by a weapon", () => {
    const bay = encounterEventById("event-cybernetics-bay")!;
    const healthResult = resolveEventChoice(build({ health: 18 }), 18, choiceById(bay, "graft-implant"), 0);
    expect(healthResult.effects.maxHealthDelta).toBe(-4);
    expect(healthResult.build.transformation?.paths[0]?.choiceIds).toEqual(["targeting-suite"]);

    const weaponResult = resolveEventChoice(build({ weapons: [{ weaponId: "scattergun", tier: 1 }] }), 18, choiceById(bay, "feed-weapon"), 0);
    expect(weaponResult.build.weapons).toEqual([]);
    expect(weaponResult.build.transformation?.paths[0]?.choiceIds).toEqual(["shield-lattice"]);
  });

  it("The Designed Arrival grants Church Affinity by health or by a relic", () => {
    const arrival = encounterEventById("event-designed-arrival")!;
    const markResult = resolveEventChoice(build({ health: 10 }), 10, choiceById(arrival, "take-the-mark"), 0);
    expect(markResult.build.health).toBe(5);
    expect(markResult.build.transformation?.paths[0]?.choiceIds).toEqual(["zealous-fervor"]);

    const relicResult = resolveEventChoice(build({ relicIds: ["rel-blast-baffle"] }), 10, choiceById(arrival, "offer-relic"), 0);
    expect(relicResult.build.relicIds).toEqual([]);
    expect(relicResult.build.transformation?.paths[0]?.choiceIds).toEqual(["martyrs-resolve"]);
  });

  it("Void Rift grants Void Initiation Affinity for free (the scar is baked into the choice itself)", () => {
    const rift = encounterEventById("event-void-rift")!;
    const result = resolveEventChoice(build(), 10, choiceById(rift, "step-through"), 0);
    expect(result.build.transformation?.paths[0]?.choiceIds).toEqual(["rift-step"]);
    expect(result.build.health).toBe(build().health);
  });

  it("Super-Soldier Serum spends scrap and health for Bastion Super-Soldier Affinity", () => {
    const serum = encounterEventById("event-super-soldier-serum")!;
    const result = resolveEventChoice(build({ scrap: 30, health: 10 }), 10, choiceById(serum, "take-the-dose"), 0);
    expect(result.build.scrap).toBe(0);
    expect(result.build.health).toBe(7);
    expect(result.build.transformation?.paths[0]?.choiceIds).toEqual(["heavy-gunner"]);
  });

  it("Mutagen Pool gambles between three Mutagenic Evolution choices", () => {
    const pool = encounterEventById("event-mutagen-pool")!;
    const bathe = choiceById(pool, "bathe");
    const low = resolveEventChoice(build(), 10, bathe, 0);
    const high = resolveEventChoice(build(), 10, bathe, 0.99);
    expect(low.build.transformation?.paths[0]?.choiceIds).toEqual(["regenerative-glands"]);
    expect(high.build.transformation?.paths[0]?.choiceIds).toEqual(["reactive-blood"]);
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
