import type { EliteKind } from "../combat/EliteCadence";
import type { ExpeditionBuildSnapshot } from "./ExpeditionRun";
import { RELIC_IDS, type ArtifactId, type RelicId } from "../content/relicCatalog";

export type { ArtifactId, RelicId } from "../content/relicCatalog";

/**
 * Shrine and Event content for the expedition map (Task 94), in the spirit of
 * Slay the Spire's `?` events and FTL's beacon encounters: short narrative
 * cards with two to four choices, some deterministic, some a weighted gamble,
 * some leading to an ambush combat. "Leave" is always available so a node can
 * never trap the player.
 *
 * This module is pure and Phaser-free, matching `perkCatalog` and the
 * transformation catalogs: the catalog is data, `resolveEventChoice` is a
 * deterministic function of (build, choice, roll), and the map/scene wiring is
 * a separate behavior gate. Fields the live systems already own (health,
 * shield, scrap, experience, weapons) are applied to the build snapshot
 * directly; effects whose systems are not live yet (relics, artifacts, weapon
 * slots, upgrade rerolls, next-node modifiers) are carried in `EventSideEffects`
 * for the run to consume when those systems land — the same "carry but resolve
 * later" approach the transformation state already uses.
 */

export type EncounterEventKind = "shrine" | "event";

/**
 * A single effect of a choice. Health/shield/scrap/experience/weapon effects
 * mutate the build snapshot; the rest become side effects the run applies.
 * Relic/Artifact ids come from `relicCatalog`, the single source of truth.
 */
export type EventOutcome =
  | { type: "heal"; amount: number }
  | { type: "healToFull" }
  | { type: "damage"; amount: number }
  | { type: "grantShield"; amount: number }
  | { type: "maxHealth"; delta: number }
  | { type: "scrap"; delta: number }
  | { type: "experience"; amount: number }
  | { type: "grantWeaponSlot"; count?: number }
  | { type: "strengthenWeapon"; tiers?: number }
  | { type: "loseWeapon" }
  | { type: "grantRelic"; relicId?: RelicId }
  | { type: "grantArtifact"; artifactId: ArtifactId }
  | { type: "upgradeReroll"; count: number }
  | { type: "duplicateUpgradeWithPenalty" }
  | { type: "guaranteedEliteRelicNextNode" }
  | { type: "ambush"; threatBudget: number; eliteKind?: EliteKind }
  | { type: "nothing" };

/** One weighted arm of a random (FTL-style) result table. */
export interface EventOutcomeBranch {
  weight: number;
  resultText: string;
  outcomes: readonly EventOutcome[];
}

/** Gates whether a choice can be offered, so a card never proposes the impossible. */
export interface EventRequirement {
  minScrap?: number;
  minHealth?: number;
  /** Effective max health must stay at or above this after any maxHealth cost. */
  minMaxHealthAfterCost?: number;
  /** Needs a weapon to spare so a "sacrifice a gun" choice is legal. */
  minWeapons?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  /** Short hint shown under the label, e.g. the visible cost. */
  detail?: string;
  requirement?: EventRequirement;
  /** Deterministic result. Exactly one of `outcomes` / `randomOutcomes` is set. */
  outcomes?: readonly EventOutcome[];
  resultText?: string;
  /** Weighted gamble; the run rolls once and applies the chosen branch. */
  randomOutcomes?: readonly EventOutcomeBranch[];
}

export interface EncounterEventDefinition {
  id: string;
  kind: EncounterEventKind;
  name: string;
  /** Narrative flavour shown on the card body. */
  text: string;
  /** Earliest zero-based column this may appear on; keeps risk off the opening. */
  minColumn: number;
  choices: readonly EventChoice[];
}

/** The always-available exit; every card includes one so a node cannot trap the player. */
const LEAVE_CHOICE: EventChoice = Object.freeze({
  id: "leave",
  label: "Move on",
  outcomes: Object.freeze([{ type: "nothing" } as const]),
  resultText: "You press on into the dark.",
});

// ---------------------------------------------------------------------------
// Shrines — deliberate, one-use risk/reward with the cost shown up front.
// ---------------------------------------------------------------------------

const SHRINES: readonly EncounterEventDefinition[] = Object.freeze([
  {
    id: "shrine-steel",
    kind: "shrine",
    name: "Shrine of Steel",
    text: "A slab of fused Bastion armour hums with a cold offer: give it your flesh and it will give you iron.",
    minColumn: 2,
    choices: [
      {
        id: "forge-slot",
        label: "Bleed for a weapon slot",
        detail: "-4 max health → +1 weapon slot",
        requirement: { minMaxHealthAfterCost: 10 },
        outcomes: [{ type: "maxHealth", delta: -4 }, { type: "grantWeaponSlot" }],
        resultText: "The slab carves a new mount into your rig. You feel lighter, and less alive.",
      },
      {
        id: "forge-weapon",
        label: "Temper a weapon",
        detail: "-3 max health → strengthen an owned weapon",
        requirement: { minMaxHealthAfterCost: 10, minWeapons: 1 },
        outcomes: [{ type: "maxHealth", delta: -3 }, { type: "strengthenWeapon", tiers: 1 }],
        resultText: "Your gun drinks the heat and comes back meaner.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-hunt",
    kind: "shrine",
    name: "Shrine of the Hunt",
    text: "A horned totem marks the path ahead as a hunting ground. Take the harder road and it swears a prize.",
    minColumn: 3,
    choices: [
      {
        id: "accept-hunt",
        label: "Mark the next encounter",
        detail: "Next node gains an elite, but guarantees a relic",
        outcomes: [{ type: "guaranteedEliteRelicNextNode" }],
        resultText: "The totem's eyes flare. Something bigger is waiting for you now.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-echoes",
    kind: "shrine",
    name: "Shrine of Echoes",
    text: "A resonant well throws your own choices back at you, doubled — but the echo drags.",
    minColumn: 3,
    choices: [
      {
        id: "echo-upgrade",
        label: "Double an upgrade",
        detail: "Duplicate an owned upgrade; that family gains a cooldown penalty",
        outcomes: [{ type: "duplicateUpgradeWithPenalty" }],
        resultText: "The echo lands. Your build speaks twice, and answers a beat slower.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-fleshwright",
    kind: "shrine",
    name: "Fleshwright Altar",
    text: "A nest of pale symbiote tendrils reaches toward your wounds, offering to knit them — for a taste.",
    minColumn: 2,
    choices: [
      {
        id: "accept-graft",
        label: "Let it feed",
        detail: "-4 health now → heal to full and gain 5 shield",
        requirement: { minHealth: 5 },
        outcomes: [{ type: "damage", amount: 4 }, { type: "healToFull" }, { type: "grantShield", amount: 5 }],
        resultText: "It bites deep, then seals you whole under a film of living plate.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-reliquary",
    kind: "shrine",
    name: "Scrap Reliquary",
    text: "A sealed cache stamped with a dead expedition's sigil. The lock wants payment, not force.",
    minColumn: 2,
    choices: [
      {
        id: "pay-reliquary",
        label: "Pay the lock",
        detail: "-60 scrap → guaranteed relic",
        requirement: { minScrap: 60 },
        outcomes: [{ type: "scrap", delta: -60 }, { type: "grantRelic" }],
        resultText: "The cache exhales cold air and offers up its keepsake.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-void-coin",
    kind: "shrine",
    name: "Void Coin",
    text: "A single black coin spins on a pedestal, never slowing. Feed it and let fortune decide.",
    minColumn: 4,
    choices: [
      {
        id: "flip-coin",
        label: "Flip the coin",
        detail: "-40 scrap → a random fortune",
        requirement: { minScrap: 40 },
        randomOutcomes: [
          { weight: 3, resultText: "The coin lands on a relic.", outcomes: [{ type: "scrap", delta: -40 }, { type: "grantRelic" }] },
          { weight: 3, resultText: "The coin pays back double.", outcomes: [{ type: "scrap", delta: 80 }] },
          { weight: 2, resultText: "The coin carves you a new mount.", outcomes: [{ type: "scrap", delta: -40 }, { type: "grantWeaponSlot" }] },
          { weight: 2, resultText: "The coin takes, and gives nothing.", outcomes: [{ type: "scrap", delta: -40 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
]);

// ---------------------------------------------------------------------------
// Events — FTL/StS narrative encounters, some random, some an ambush.
// ---------------------------------------------------------------------------

const EVENTS: readonly EncounterEventDefinition[] = Object.freeze([
  {
    id: "event-derelict-dropship",
    kind: "event",
    name: "Derelict Dropship",
    text: "A crashed Bastion dropship lies half-swallowed by biomass, its cargo bay still sealed.",
    minColumn: 1,
    choices: [
      {
        id: "search-cargo",
        label: "Crack the cargo bay",
        detail: "Scavenge — but something may still be aboard",
        randomOutcomes: [
          { weight: 4, resultText: "Intact requisition crates — you strip them for scrap.", outcomes: [{ type: "scrap", delta: 45 }] },
          { weight: 3, resultText: "A spare weapon mount, still boxed.", outcomes: [{ type: "grantWeaponSlot" }] },
          { weight: 3, resultText: "The cargo was bait. Something was nesting inside.", outcomes: [{ type: "ambush", threatBudget: 55 }] },
        ],
      },
      {
        id: "strip-hull",
        label: "Strip the hull plating",
        detail: "Safe, modest salvage",
        outcomes: [{ type: "scrap", delta: 20 }],
        resultText: "You peel off what plating you can carry.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-stranded-survivor",
    kind: "event",
    name: "Stranded Survivor",
    text: "A wounded scout flags you down from a collapsed bunker, half-mad with relief.",
    minColumn: 1,
    choices: [
      {
        id: "share-supplies",
        label: "Share your supplies",
        detail: "-3 health → they mark a cache for you",
        requirement: { minHealth: 4 },
        randomOutcomes: [
          { weight: 3, resultText: "Grateful, they hand you a relic pulled from the wreck.", outcomes: [{ type: "damage", amount: 3 }, { type: "grantRelic" }] },
          { weight: 2, resultText: "They point you to a scrap stash before slipping away.", outcomes: [{ type: "damage", amount: 3 }, { type: "scrap", delta: 40 }] },
        ],
      },
      {
        id: "debrief",
        label: "Debrief them",
        detail: "Learn the road ahead",
        outcomes: [{ type: "experience", amount: 30 }],
        resultText: "Their intel on the approach sharpens your read of the fight to come.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-distress-beacon",
    kind: "event",
    name: "Distress Beacon",
    text: "A looping automated beacon pulses from a ridge, older than this expedition. Its source is close.",
    minColumn: 2,
    choices: [
      {
        id: "investigate",
        label: "Trace the beacon",
        randomOutcomes: [
          { weight: 3, resultText: "A dead operative's kit — you recover their relic.", outcomes: [{ type: "grantRelic" }] },
          { weight: 2, resultText: "A supply drop, untouched.", outcomes: [{ type: "scrap", delta: 35 }, { type: "heal", amount: 3 }] },
          { weight: 3, resultText: "The beacon was a lure. They close in fast.", outcomes: [{ type: "ambush", threatBudget: 65 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-dormant-fabricator",
    kind: "event",
    name: "Dormant Fabricator",
    text: "A machine-uprising fabricator sits powered down, its forge still warm. Its core could be turned.",
    minColumn: 3,
    choices: [
      {
        id: "hack-core",
        label: "Splice its core",
        detail: "Reprogram the forge — risky",
        randomOutcomes: [
          { weight: 3, resultText: "The forge stamps you a fresh weapon mount before dying.", outcomes: [{ type: "grantWeaponSlot" }] },
          { weight: 2, resultText: "It bleeds its reserve into your rig.", outcomes: [{ type: "grantShield", amount: 6 }] },
          { weight: 3, resultText: "A feedback surge arcs through your armour.", outcomes: [{ type: "damage", amount: 4 }] },
        ],
      },
      {
        id: "salvage",
        label: "Salvage it for parts",
        detail: "Safe scrap",
        outcomes: [{ type: "scrap", delta: 30 }],
        resultText: "You gut the fabricator for anything that still holds value.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-spore-bloom",
    kind: "event",
    name: "Spore Bloom",
    text: "A wall of toxic bloom has swallowed the path. Something metallic glints deep inside it.",
    minColumn: 2,
    choices: [
      {
        id: "push-through",
        label: "Push through the bloom",
        detail: "-4 health → reach the glint",
        requirement: { minHealth: 5 },
        outcomes: [{ type: "damage", amount: 4 }, { type: "scrap", delta: 40 }],
        resultText: "You wade through, coughing, and pry loose a cache on the far side.",
      },
      {
        id: "go-around",
        label: "Take the long way around",
        detail: "Costs nothing",
        outcomes: [{ type: "nothing" }],
        resultText: "You give the bloom a wide berth and lose nothing but time.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-abandoned-armoury",
    kind: "event",
    name: "Abandoned Armoury",
    text: "A Bastion armoury door hangs half-sealed, its lock fried. Weapons are stacked just out of reach.",
    minColumn: 2,
    choices: [
      {
        id: "force-door",
        label: "Force the door",
        randomOutcomes: [
          { weight: 4, resultText: "You haul out a working weapon and its mount.", outcomes: [{ type: "grantWeaponSlot" }] },
          { weight: 3, resultText: "A relic in a sealed field case.", outcomes: [{ type: "grantRelic" }] },
          { weight: 2, resultText: "The stack was booby-trapped.", outcomes: [{ type: "damage", amount: 3 }] },
        ],
      },
      {
        id: "prise-lockbox",
        label: "Prise the lockbox only",
        detail: "Safe scrap",
        outcomes: [{ type: "scrap", delta: 25 }],
        resultText: "You settle for the lockbox and leave the rest.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-corrupted-medbay",
    kind: "event",
    name: "Corrupted Medbay",
    text: "A field hospital, overrun. Its autodoc still cycles, dripping something that is not quite medicine.",
    minColumn: 2,
    choices: [
      {
        id: "loot-medbay",
        label: "Trust the autodoc",
        detail: "Heal, but the medicine is tainted",
        randomOutcomes: [
          { weight: 3, resultText: "It patches you clean and deep.", outcomes: [{ type: "heal", amount: 6 }] },
          { weight: 2, resultText: "It heals — and something takes hold under your skin.", outcomes: [{ type: "heal", amount: 7 }, { type: "damage", amount: 2 }] },
        ],
      },
      {
        id: "burn-it",
        label: "Burn it down",
        detail: "Deny the corruption; learn from the loss",
        outcomes: [{ type: "experience", amount: 25 }],
        resultText: "You torch the ward. Whatever it was becoming, it won't now.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-star-merchant",
    kind: "event",
    name: "Wandering Quartermaster",
    text: "A lone trader has parked a rover across the path, tarp thrown back over a rack of oddments.",
    minColumn: 3,
    choices: [
      {
        id: "buy-relic",
        label: "Buy the relic on the rack",
        detail: "-50 scrap → a relic",
        requirement: { minScrap: 50 },
        outcomes: [{ type: "scrap", delta: -50 }, { type: "grantRelic" }],
        resultText: "The trader wraps it, pockets your scrap, and waves you on.",
      },
      {
        id: "sell-blood",
        label: "Sell them a favour",
        detail: "-4 health → +45 scrap",
        requirement: { minHealth: 5 },
        outcomes: [{ type: "damage", amount: 4 }, { type: "scrap", delta: 45 }],
        resultText: "You do the dangerous errand; they pay in hard scrap.",
      },
      LEAVE_CHOICE,
    ],
  },
]);

export const ENCOUNTER_EVENT_CATALOG: readonly EncounterEventDefinition[] =
  Object.freeze([...SHRINES, ...EVENTS]);

export function encounterEventById(id: string): EncounterEventDefinition | null {
  return ENCOUNTER_EVENT_CATALOG.find((event) => event.id === id) ?? null;
}

/** Every definition of a kind eligible at the given zero-based column. */
export function eligibleEvents(
  kind: EncounterEventKind,
  column: number,
): readonly EncounterEventDefinition[] {
  return ENCOUNTER_EVENT_CATALOG.filter(
    (event) => event.kind === kind && column >= event.minColumn,
  );
}

/**
 * Deterministically picks which shrine/event a node presents. Seeded so a map
 * seed always shows the same card on the same node, exactly like the rest of
 * the expedition generator.
 */
export function selectEncounterEvent(
  kind: EncounterEventKind,
  seed: number,
  column: number,
): EncounterEventDefinition | null {
  const pool = eligibleEvents(kind, column);
  if (pool.length === 0) {
    return null;
  }
  const index = Math.abs(Math.floor(seed)) % pool.length;
  return pool[index]!;
}

// ---------------------------------------------------------------------------
// Resolution — pure, deterministic given a roll in [0, 1).
// ---------------------------------------------------------------------------

/** Effects whose live systems do not exist yet; the run carries these forward. */
export interface EventSideEffects {
  maxHealthDelta: number;
  weaponSlotsGranted: number;
  upgradeRerolls: number;
  relicIds: RelicId[];
  artifactIds: ArtifactId[];
  guaranteedEliteRelicNextNode: boolean;
  duplicateUpgradeWithPenalty: boolean;
  ambush: { threatBudget: number; eliteKind: EliteKind | null } | null;
}

export interface EventResolution {
  build: ExpeditionBuildSnapshot;
  effects: EventSideEffects;
  resultText: string;
}

export function emptySideEffects(): EventSideEffects {
  return {
    maxHealthDelta: 0,
    weaponSlotsGranted: 0,
    upgradeRerolls: 0,
    relicIds: [],
    artifactIds: [],
    guaranteedEliteRelicNextNode: false,
    duplicateUpgradeWithPenalty: false,
    ambush: null,
  };
}

/**
 * Whether a choice may be offered for the current build. `maxHealth` is the
 * hero's current maximum (health cap), which the run knows and the snapshot
 * does not, so max-health costs can be floored.
 */
export function isChoiceAvailable(
  build: ExpeditionBuildSnapshot,
  maxHealth: number,
  choice: EventChoice,
): boolean {
  const requirement = choice.requirement;
  if (!requirement) {
    return true;
  }
  if (requirement.minScrap !== undefined && build.scrap < requirement.minScrap) {
    return false;
  }
  if (requirement.minHealth !== undefined && build.health < requirement.minHealth) {
    return false;
  }
  if (requirement.minWeapons !== undefined && build.weapons.length < requirement.minWeapons) {
    return false;
  }
  if (requirement.minMaxHealthAfterCost !== undefined) {
    const cost = maxHealthCostOf(choice);
    if (maxHealth - cost < requirement.minMaxHealthAfterCost) {
      return false;
    }
  }
  return true;
}

/** The largest max-health reduction any outcome branch of a choice can apply. */
function maxHealthCostOf(choice: EventChoice): number {
  const branches = choice.randomOutcomes
    ? choice.randomOutcomes.map((branch) => branch.outcomes)
    : [choice.outcomes ?? []];
  let worst = 0;
  for (const outcomes of branches) {
    for (const outcome of outcomes) {
      if (outcome.type === "maxHealth" && outcome.delta < 0) {
        worst = Math.max(worst, -outcome.delta);
      }
    }
  }
  return worst;
}

/**
 * Resolves a chosen option against the build. `roll` in [0, 1) selects the
 * weighted branch for gamble choices and is ignored for deterministic ones, so
 * tests reproduce every outcome exactly. `maxHealth` clamps healing.
 */
export function resolveEventChoice(
  build: ExpeditionBuildSnapshot,
  maxHealth: number,
  choice: EventChoice,
  roll: number,
): EventResolution {
  const branch = choice.randomOutcomes
    ? pickWeightedBranch(choice.randomOutcomes, roll)
    : null;
  const outcomes = branch ? branch.outcomes : choice.outcomes ?? [];
  const resultText = branch ? branch.resultText : choice.resultText ?? "";

  const effects = emptySideEffects();
  const effectiveMax = () => maxHealth + effects.maxHealthDelta;
  let health = build.health;
  let shield = build.shield;
  let scrap = build.scrap;
  let experience = build.experience;
  let weapons = build.weapons.map((weapon) => ({ ...weapon }));

  for (const outcome of outcomes) {
    switch (outcome.type) {
      case "heal":
        health = Math.min(effectiveMax(), health + outcome.amount);
        break;
      case "healToFull":
        health = effectiveMax();
        break;
      case "damage":
        health = Math.max(1, health - outcome.amount);
        break;
      case "grantShield":
        shield += outcome.amount;
        break;
      case "maxHealth":
        effects.maxHealthDelta += outcome.delta;
        // A max-health cut also trims current health to the new ceiling.
        health = Math.min(health, effectiveMax());
        break;
      case "scrap":
        scrap = Math.max(0, scrap + outcome.delta);
        break;
      case "experience":
        experience += outcome.amount;
        break;
      case "grantWeaponSlot":
        effects.weaponSlotsGranted += outcome.count ?? 1;
        break;
      case "strengthenWeapon":
        weapons = strengthenLastWeapon(weapons, outcome.tiers ?? 1);
        break;
      case "loseWeapon":
        weapons = weapons.slice(0, -1);
        break;
      case "grantRelic":
        effects.relicIds.push(outcome.relicId ?? pickRelic(RELIC_IDS, roll, effects.relicIds));
        break;
      case "grantArtifact":
        effects.artifactIds.push(outcome.artifactId);
        break;
      case "upgradeReroll":
        effects.upgradeRerolls += outcome.count;
        break;
      case "duplicateUpgradeWithPenalty":
        effects.duplicateUpgradeWithPenalty = true;
        break;
      case "guaranteedEliteRelicNextNode":
        effects.guaranteedEliteRelicNextNode = true;
        break;
      case "ambush":
        effects.ambush = { threatBudget: outcome.threatBudget, eliteKind: outcome.eliteKind ?? null };
        break;
      case "nothing":
        break;
    }
  }

  return {
    build: { ...build, health, shield, scrap, experience, weapons },
    effects,
    resultText,
  };
}

/** Increments the last equipped weapon's tier, capped at Tier III. */
function strengthenLastWeapon(
  weapons: { weaponId: string; tier: number }[],
  tiers: number,
): { weaponId: string; tier: number }[] {
  if (weapons.length === 0) {
    return weapons;
  }
  const last = weapons.length - 1;
  weapons[last] = { ...weapons[last]!, tier: Math.min(3, weapons[last]!.tier + tiers) };
  return weapons;
}

/** Selects a relic id not already granted this resolution, deterministic by roll. */
function pickRelic(pool: readonly RelicId[], roll: number, already: readonly RelicId[]): RelicId {
  const available = pool.filter((id) => !already.includes(id));
  const choices = available.length > 0 ? available : pool;
  const index = Math.min(choices.length - 1, Math.floor(roll * choices.length));
  return choices[index]!;
}

/**
 * Folds a resolution's carried side-effects into the run build: relics
 * accumulate, the last granted artifact becomes equipped, and the max-health
 * and weapon-slot bonuses add on. `resolution.build` already holds the applied
 * health/shield/scrap/experience/weapon changes; this layers the reward-item
 * carrier on top so the in-run event screen can commit one snapshot. Ambush and
 * next-node modifiers are handled by the run, not the build.
 */
export function applyEventResolutionToBuild(resolution: EventResolution): ExpeditionBuildSnapshot {
  const { build, effects } = resolution;
  const relicIds = [...(build.relicIds ?? []), ...effects.relicIds];
  const equippedArtifactId = effects.artifactIds.length > 0
    ? effects.artifactIds[effects.artifactIds.length - 1]!
    : build.equippedArtifactId ?? null;
  return {
    ...build,
    relicIds,
    equippedArtifactId,
    maxHealthBonus: (build.maxHealthBonus ?? 0) + effects.maxHealthDelta,
    weaponSlotBonus: (build.weaponSlotBonus ?? 0) + effects.weaponSlotsGranted,
  };
}

/**
 * Picks a weighted branch. `roll` in [0, 1) is scaled to the total weight, so
 * the same roll always yields the same branch and the distribution matches the
 * weights.
 */
export function pickWeightedBranch(
  branches: readonly EventOutcomeBranch[],
  roll: number,
): EventOutcomeBranch {
  const total = branches.reduce((sum, branch) => sum + branch.weight, 0);
  const clamped = Math.min(0.9999999, Math.max(0, roll));
  let cursor = clamped * total;
  for (const branch of branches) {
    cursor -= branch.weight;
    if (cursor < 0) {
      return branch;
    }
  }
  return branches[branches.length - 1]!;
}
