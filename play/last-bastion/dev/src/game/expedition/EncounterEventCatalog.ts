import type { EliteKind } from "../combat/EliteCadence";
import type { PowerupType } from "../combat/CombatSimulation";
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
  | { type: "nothing" }
  // --- Phase 2 enablers (24 July 2026) ---
  /** Carries a field-drop kit into the next combat node's active-buff rotation. */
  | { type: "grantConsumable"; powerupType: PowerupType }
  /** Deterministically draws one upgrade from a small offered set (Rogue Server). */
  | { type: "pickUpgradeFromSet"; upgradeIds: readonly string[] }
  /** Drops the most recently taken upgrade's level by one, or a named one. */
  | { type: "removeUpgrade"; upgradeId?: string }
  /** Removes a relic (a named one, or the most recently owned) — Purifier Station. */
  | { type: "purifyRelic"; relicId?: RelicId }
  /** Heals to full and undoes any permanent max-health cost paid so far this run. */
  | { type: "fullCleanse" }
  /** Consumes weapons off the end of the rack and replaces them with one result weapon. */
  | { type: "transmogrifyWeapon"; resultWeaponId: string; resultTier?: number; consumeCount?: number }
  /** Adds a copy of the last-equipped weapon to the rack (Duplication Vat). */
  | { type: "duplicateWeapon" }
  /**
   * Adds a second copy of an owned relic id (a named one, or the most recently
   * owned). `resolveRelicModifiers` currently dedupes relic ids into a Set (by
   * design, one copy applies unless stated), so this is authored now and takes
   * full mechanical effect once relic stacking rules land — the same
   * carry-now/wire-later shape as `duplicateUpgradeWithPenalty`.
   */
  | { type: "duplicateRelic"; relicId?: RelicId }
  /** Converts an amount of one resource into another (Chimera Experiment). */
  | { type: "swapStat"; from: "scrap" | "health" | "experience"; to: "scrap" | "maxHealth" | "experience"; amount: number }
  /** Grants bonus lifesteal-per-kill on top of any relic/artifact source. */
  | { type: "grantLifesteal"; amount: number };

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
  {
    id: "shrine-altar-ash",
    kind: "shrine",
    name: "Altar of Ash",
    text: "A scorched altar to a dead war-god. Pilgrims left offerings; the desperate took them back.",
    minColumn: 2,
    choices: [
      {
        id: "pray",
        label: "Pray and leave an offering",
        detail: "-15 scrap → a blessing",
        requirement: { minScrap: 15 },
        randomOutcomes: [
          { weight: 3, resultText: "The ash stirs; you feel steadier.", outcomes: [{ type: "scrap", delta: -15 }, { type: "grantShield", amount: 6 }] },
          { weight: 2, resultText: "A relic was buried beneath the offerings.", outcomes: [{ type: "scrap", delta: -15 }, { type: "grantRelic" }] },
        ],
      },
      {
        id: "desecrate",
        label: "Desecrate it for what's buried",
        detail: "Take a relic, but the ash burns you (-3 health)",
        requirement: { minHealth: 4 },
        outcomes: [{ type: "grantRelic" }, { type: "damage", amount: 3 }],
        resultText: "You wrench the relic free as searing ash claws at you.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-monolith",
    kind: "shrine",
    name: "Whispering Monolith",
    text: "A black monolith murmurs a question only you can hear. Answer, and it answers back.",
    minColumn: 3,
    choices: [
      {
        id: "answer",
        label: "Answer the whisper",
        detail: "A gamble of insight",
        randomOutcomes: [
          { weight: 3, resultText: "You answer true. Knowledge floods in.", outcomes: [{ type: "experience", amount: 45 }, { type: "grantRelic" }] },
          { weight: 3, resultText: "A partial truth — some reward, some cost.", outcomes: [{ type: "scrap", delta: 40 }, { type: "damage", amount: 3 }] },
          { weight: 2, resultText: "You answer wrong. The monolith recoils into your mind.", outcomes: [{ type: "damage", amount: 4 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-requisition",
    kind: "shrine",
    name: "Requisition Terminal",
    text: "An intact Bastion armoury terminal, still authorised. One free service order remains.",
    minColumn: 2,
    choices: [
      {
        id: "upgrade-weapon",
        label: "Requisition a weapon upgrade",
        detail: "Strengthen an owned weapon a tier — free",
        requirement: { minWeapons: 1 },
        outcomes: [{ type: "strengthenWeapon", tiers: 1 }],
        resultText: "The terminal reforges your weapon to a higher spec.",
      },
      {
        id: "requisition-slot",
        label: "Requisition a mount",
        detail: "-45 scrap → +1 weapon slot",
        requirement: { minScrap: 45 },
        outcomes: [{ type: "scrap", delta: -45 }, { type: "grantWeaponSlot" }],
        resultText: "A new weapon mount clamps onto your rig.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-devourers-dream",
    kind: "shrine",
    name: "The Devourer's Dream",
    text: "You black out and stand inside the Bastion Eater's dream. Three doors hang in the dark. Choose one to wake.",
    minColumn: 4,
    choices: [
      {
        id: "door-hunt",
        label: "The door of teeth",
        detail: "Next encounter gains an elite, but guarantees a relic",
        outcomes: [{ type: "guaranteedEliteRelicNextNode" }],
        resultText: "You walk into the maw. Something will be waiting — and so will your prize.",
      },
      {
        id: "door-gift",
        label: "The door of offerings",
        detail: "Take a relic now",
        outcomes: [{ type: "grantRelic" }],
        resultText: "A relic rests on a pedestal of bone. You take it and wake.",
      },
      {
        id: "door-rest",
        label: "The door of stillness",
        detail: "Wake fully restored",
        outcomes: [{ type: "healToFull" }, { type: "grantShield", amount: 4 }],
        resultText: "You sleep a dreamless sleep and wake whole.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-beacon-lost",
    kind: "shrine",
    name: "Beacon of the Lost",
    text: "A memorial beacon for a fallen expedition. Its light soothes wounds — but something clings to those who linger.",
    minColumn: 3,
    choices: [
      {
        id: "bask",
        label: "Bask in the light",
        detail: "Heal to full, but the dead mark you (-2 max health)",
        outcomes: [{ type: "healToFull" }, { type: "maxHealth", delta: -2 }],
        resultText: "Your wounds close as a cold weight settles permanently on your chest.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-cryo",
    kind: "shrine",
    name: "Cryo Shrine",
    text: "A cracked stasis pod breathes frost across the floor. Step inside and it will burn every scar off you at once.",
    minColumn: 3,
    choices: [
      {
        id: "step-in",
        label: "Step into the frost",
        detail: "Heal to full and undo any permanent max-health cost paid so far",
        outcomes: [{ type: "fullCleanse" }],
        resultText: "The frost bites once, hard, then lifts — every old wound sealed over clean.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-forge-fallen",
    kind: "shrine",
    name: "Forge of the Fallen",
    text: "A war-forge fed by the wrecks of a hundred dead Bastion units. Feed it a weapon and it remakes something stranger.",
    minColumn: 3,
    choices: [
      {
        id: "sacrifice-weapon",
        label: "Feed the forge a weapon",
        detail: "Sacrifice your last weapon for a random higher-tier replacement",
        requirement: { minWeapons: 1 },
        randomOutcomes: [
          { weight: 1, resultText: "The forge spits out a rotary cannon, still glowing.", outcomes: [{ type: "transmogrifyWeapon", resultWeaponId: "bulwark-rotary-cannon", resultTier: 2, consumeCount: 1 }] },
          { weight: 1, resultText: "The forge spits out a grenade tube, still glowing.", outcomes: [{ type: "transmogrifyWeapon", resultWeaponId: "grenade-tube", resultTier: 2, consumeCount: 1 }] },
          { weight: 1, resultText: "The forge spits out an arc carbine, still glowing.", outcomes: [{ type: "transmogrifyWeapon", resultWeaponId: "arc-carbine", resultTier: 2, consumeCount: 1 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-duplication-vat",
    kind: "shrine",
    name: "Duplication Vat",
    text: "A cracked cloning tank, still humming. It only knows how to make one more of whatever you put in.",
    minColumn: 3,
    choices: [
      {
        id: "duplicate-weapon",
        label: "Feed it a weapon",
        detail: "Add a second copy of your last-equipped weapon",
        requirement: { minWeapons: 1 },
        outcomes: [{ type: "duplicateWeapon" }],
        resultText: "The vat shudders and drops a twin of your weapon onto the rack.",
      },
      {
        id: "duplicate-relic",
        label: "Feed it a relic",
        detail: "Add a second copy of your most recently owned relic",
        outcomes: [{ type: "duplicateRelic" }],
        resultText: "The vat copies the relic down to the last scratch.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "shrine-purifier",
    kind: "shrine",
    name: "Purifier Station",
    text: "An old med-bay terminal offers to strip something out of you — for scrap, whatever you can spare.",
    minColumn: 2,
    choices: [
      {
        id: "purge-upgrade",
        label: "Purge an upgrade",
        detail: "Drop a level off your most recently taken upgrade → +20 scrap",
        outcomes: [{ type: "removeUpgrade" }, { type: "scrap", delta: 20 }],
        resultText: "The terminal draws the upgrade back out of you, and pays you for the trouble.",
      },
      {
        id: "purge-relic",
        label: "Purge a relic",
        detail: "Remove your most recently owned relic → +20 scrap",
        outcomes: [{ type: "purifyRelic" }, { type: "scrap", delta: 20 }],
        resultText: "The terminal unpicks the relic's hooks and hands back the scrap.",
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
  {
    id: "event-black-market-fence",
    kind: "event",
    name: "Black Market Fence",
    text: "A hooded fence works out of a gutted APC, one hand always near a hidden weapon.",
    minColumn: 3,
    choices: [
      {
        id: "buy-hot-relic",
        label: "Buy the relic under the counter",
        detail: "-55 scrap → a relic",
        requirement: { minScrap: 55 },
        outcomes: [{ type: "scrap", delta: -55 }, { type: "grantRelic" }],
        resultText: "No questions asked. The relic changes hands.",
      },
      {
        id: "fence-goods",
        label: "Fence a weapon you're not using",
        detail: "Sell a weapon for scrap",
        requirement: { minWeapons: 2 },
        outcomes: [{ type: "loseWeapon" }, { type: "scrap", delta: 40 }],
        resultText: "The fence takes the weapon and counts out your scrap.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-scrap-broker",
    kind: "event",
    name: "Scrap Broker",
    text: "An automated broker cart offers a grim exchange rate: flesh for salvage, or salvage for repairs.",
    minColumn: 2,
    choices: [
      {
        id: "sell-blood-broker",
        label: "Sell blood for scrap",
        detail: "-4 health → +45 scrap",
        requirement: { minHealth: 5 },
        outcomes: [{ type: "damage", amount: 4 }, { type: "scrap", delta: 45 }],
        resultText: "The cart drains a little of you and pays out.",
      },
      {
        id: "buy-repairs",
        label: "Buy field repairs",
        detail: "-50 scrap → heal to full",
        requirement: { minScrap: 50 },
        outcomes: [{ type: "scrap", delta: -50 }, { type: "healToFull" }],
        resultText: "Nanite paste seals your wounds.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-stranded-squad",
    kind: "event",
    name: "Stranded Squad",
    text: "A pinned-down squad waves you over from a shell crater — or someone wants you to think so.",
    minColumn: 2,
    choices: [
      {
        id: "rescue-squad",
        label: "Break them out",
        randomOutcomes: [
          { weight: 4, resultText: "Grateful, they share salvage and intel.", outcomes: [{ type: "scrap", delta: 35 }, { type: "experience", amount: 20 }] },
          { weight: 3, resultText: "One of them presses a relic into your hand.", outcomes: [{ type: "grantRelic" }] },
          { weight: 3, resultText: "It was a lure wearing their uniforms.", outcomes: [{ type: "ambush", threatBudget: 60 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-deserter-cache",
    kind: "event",
    name: "Deserter's Cache",
    text: "A deserter's corpse slumps over a stuffed rucksack. Its fingers twitch — or the wind moved them.",
    minColumn: 2,
    choices: [
      {
        id: "loot-corpse",
        label: "Loot the rucksack",
        randomOutcomes: [
          { weight: 4, resultText: "Hoarded salvage, all yours.", outcomes: [{ type: "scrap", delta: 40 }] },
          { weight: 3, resultText: "A relic he died protecting.", outcomes: [{ type: "grantRelic" }] },
          { weight: 3, resultText: "He wasn't dead. Not really.", outcomes: [{ type: "ambush", threatBudget: 55 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-field-chaplain",
    kind: "event",
    name: "The Field Chaplain",
    text: "A battle-chaplain tends a makeshift aid post, asking only a donation to the fallen's fund.",
    minColumn: 2,
    choices: [
      {
        id: "donate-heal",
        label: "Donate and be tended",
        detail: "-40 scrap → heal to full and gain 4 shield",
        requirement: { minScrap: 40 },
        outcomes: [{ type: "scrap", delta: -40 }, { type: "healToFull" }, { type: "grantShield", amount: 4 }],
        resultText: "The chaplain patches you and murmurs a blessing.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-old-sergeant",
    kind: "event",
    name: "Old Sergeant",
    text: "A grizzled sergeant shares his fire. He'll trade war stories, or mark the hunt for you.",
    minColumn: 3,
    choices: [
      {
        id: "hear-stories",
        label: "Listen to his war stories",
        detail: "Free — hard-won insight",
        outcomes: [{ type: "experience", amount: 35 }],
        resultText: "His stories teach you how the next fight will move.",
      },
      {
        id: "buy-hunt-mark",
        label: "Buy his hunting mark",
        detail: "-30 scrap → next node gains an elite and a guaranteed relic",
        requirement: { minScrap: 30 },
        outcomes: [{ type: "scrap", delta: -30 }, { type: "guaranteedEliteRelicNextNode" }],
        resultText: "He carves a sigil on your pauldron. The hunt is on.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-trapped-engineer",
    kind: "event",
    name: "Trapped Engineer",
    text: "An engineer is pinned under a collapsed gantry, tools scattered just out of reach.",
    minColumn: 3,
    choices: [
      {
        id: "free-engineer",
        label: "Lift the gantry and free them",
        randomOutcomes: [
          { weight: 4, resultText: "In thanks, they tune a weapon to a higher spec.", outcomes: [{ type: "strengthenWeapon", tiers: 1 }] },
          { weight: 3, resultText: "They rig you a spare mount before parting.", outcomes: [{ type: "grantWeaponSlot" }] },
          { weight: 3, resultText: "“Engineer” was a costume. Ambush.", outcomes: [{ type: "ambush", threatBudget: 60 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-refugee-column",
    kind: "event",
    name: "Refugee Column",
    text: "A ragged column of survivors begs for an armed escort across the open ground ahead.",
    minColumn: 3,
    choices: [
      {
        id: "escort",
        label: "Escort them through",
        detail: "Draws a fight, but they reward you",
        outcomes: [{ type: "ambush", threatBudget: 65 }, { type: "grantRelic" }],
        resultText: "You fight off the ambush; the survivors press a relic on you before scattering.",
      },
      {
        id: "wave-past",
        label: "Wave them past and move on",
        outcomes: [{ type: "nothing" }],
        resultText: "You point them to cover and keep your own road.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-power-grid",
    kind: "event",
    name: "Overloaded Power Grid",
    text: "A humming grid junction sparks with more charge than it can hold. You could tap it — carefully.",
    minColumn: 2,
    choices: [
      {
        id: "tap-grid",
        label: "Tap the grid for salvage",
        randomOutcomes: [
          { weight: 3, resultText: "You bleed off a clean charge and cash it in.", outcomes: [{ type: "scrap", delta: 40 }] },
          { weight: 2, resultText: "Overflow floods your shield capacitor.", outcomes: [{ type: "grantShield", amount: 6 }] },
          { weight: 3, resultText: "The grid arcs through your armour.", outcomes: [{ type: "damage", amount: 3 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-sentry-standoff",
    kind: "event",
    name: "Sentry Standoff",
    text: "A dormant Bastion sentry gun tracks you across a doorway, its threat light pulsing amber.",
    minColumn: 3,
    choices: [
      {
        id: "hack-sentry",
        label: "Hack its authorisation",
        detail: "Risky — it may reward or wake",
        randomOutcomes: [
          { weight: 4, resultText: "It accepts your codes and dumps its cache.", outcomes: [{ type: "scrap", delta: 45 }] },
          { weight: 3, resultText: "It grants you its spare targeting relic.", outcomes: [{ type: "grantRelic" }] },
          { weight: 3, resultText: "Wrong codes. It calls in a patrol.", outcomes: [{ type: "ambush", threatBudget: 60 }] },
        ],
      },
      {
        id: "fight-sentry",
        label: "Blow it and take the room",
        detail: "A guaranteed fight, guaranteed salvage",
        outcomes: [{ type: "ambush", threatBudget: 55 }, { type: "scrap", delta: 25 }],
        resultText: "You trigger the fight on your terms and strip the wreckage.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-salvage-swarm",
    kind: "event",
    name: "Salvage Drone Swarm",
    text: "A swarm of skittering salvage drones is stripping a downed dropship — salvage you could use.",
    minColumn: 2,
    choices: [
      {
        id: "fight-swarm",
        label: "Fight them for the wreck",
        detail: "A scrappy fight for good salvage",
        outcomes: [{ type: "ambush", threatBudget: 55 }, { type: "scrap", delta: 40 }],
        resultText: "You scatter the drones and claim the dropship's guts.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-stars-edge",
    kind: "event",
    name: "Star's Edge",
    text: "A collapsed reactor bathes a shortcut in hard radiation. Crossing would save hours — and cost skin.",
    minColumn: 4,
    choices: [
      {
        id: "cross-radiation",
        label: "Cross the hot zone",
        detail: "-4 health → salvage and a relic on the far side",
        requirement: { minHealth: 5 },
        outcomes: [{ type: "damage", amount: 4 }, { type: "scrap", delta: 35 }, { type: "grantRelic" }],
        resultText: "You sprint through the glow, skin crawling, and loot the far cache.",
      },
      {
        id: "go-long",
        label: "Take the long way",
        outcomes: [{ type: "nothing" }],
        resultText: "You give the reactor a wide, healthy berth.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-wheel-fates",
    kind: "event",
    name: "Wheel of Fates",
    text: "A salvaged fortune-machine offers one free spin. Its needle has a mind of its own.",
    minColumn: 3,
    choices: [
      {
        id: "spin",
        label: "Spin the wheel",
        detail: "One of six fates",
        randomOutcomes: [
          { weight: 2, resultText: "Fortune: a relic drops into the tray.", outcomes: [{ type: "grantRelic" }] },
          { weight: 2, resultText: "Fortune: a pile of scrap.", outcomes: [{ type: "scrap", delta: 45 }] },
          { weight: 2, resultText: "Fortune: a surge of clarity.", outcomes: [{ type: "experience", amount: 35 }] },
          { weight: 2, resultText: "Fortune: a protective charge.", outcomes: [{ type: "grantShield", amount: 6 }] },
          { weight: 2, resultText: "Misfortune: a jolt of feedback.", outcomes: [{ type: "damage", amount: 3 }] },
          { weight: 2, resultText: "The wheel stops between fates. Nothing.", outcomes: [{ type: "nothing" }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-gravity-well",
    kind: "event",
    name: "Gravity Well",
    text: "The floor gives way to a collapsing gravity anomaly. Something has to be let go to climb out.",
    minColumn: 4,
    choices: [
      {
        id: "drop-weapon",
        label: "Ditch a weapon to escape clean",
        detail: "Lose a weapon, take no harm",
        requirement: { minWeapons: 2 },
        outcomes: [{ type: "loseWeapon" }],
        resultText: "You let the weapon fall into the dark and haul yourself free.",
      },
      {
        id: "hold-everything",
        label: "Hold onto everything and climb",
        detail: "Keep your gear, take a beating (-4 health)",
        requirement: { minHealth: 5 },
        outcomes: [{ type: "damage", amount: 4 }],
        resultText: "You claw out battered but with every weapon still strapped on.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-anomaly-reading",
    kind: "event",
    name: "Anomaly Reading",
    text: "A cracked survey obelisk still streams alien telemetry. A few minutes of study could teach you plenty.",
    minColumn: 1,
    choices: [
      {
        id: "study",
        label: "Study the telemetry",
        detail: "Free insight",
        outcomes: [{ type: "experience", amount: 40 }],
        resultText: "Patterns resolve; you read the coming fights a little better.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-field-hospital",
    kind: "event",
    name: "Field Hospital",
    text: "A still-powered field hospital, mercifully empty. The autodocs are clean and the beds are soft.",
    minColumn: 2,
    choices: [
      {
        id: "rest",
        label: "Rest and be treated",
        detail: "Heal to full and gain 5 shield",
        outcomes: [{ type: "healToFull" }, { type: "grantShield", amount: 5 }],
        resultText: "You sleep an hour in a real bed and wake mended.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-golden-idol",
    kind: "event",
    name: "Golden Idol",
    text: "An alien reliquary idol sits on a pressure plate, gleaming. Taking it will not be quiet.",
    minColumn: 3,
    choices: [
      {
        id: "grab-idol",
        label: "Grab the idol and run",
        detail: "A relic and salvage — but it springs a trap",
        randomOutcomes: [
          { weight: 3, resultText: "You snatch it as darts scythe past — a shallow hit.", outcomes: [{ type: "grantRelic" }, { type: "damage", amount: 3 }] },
          { weight: 3, resultText: "You grab it clean and the vault pays out.", outcomes: [{ type: "grantRelic" }, { type: "scrap", delta: 30 }] },
          { weight: 2, resultText: "The plate summons the vault's guardians.", outcomes: [{ type: "grantRelic" }, { type: "ambush", threatBudget: 60 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-joust",
    kind: "event",
    name: "The Joust",
    text: "Two salvage crews are running a betting ring on drone duels. The odds are even, they swear.",
    minColumn: 3,
    choices: [
      {
        id: "place-bet",
        label: "Bet 30 scrap on a duel",
        detail: "Win double, or lose it",
        requirement: { minScrap: 30 },
        randomOutcomes: [
          { weight: 1, resultText: "Your drone wins clean. Pay out, double.", outcomes: [{ type: "scrap", delta: 30 }] },
          { weight: 1, resultText: "Your drone loses in a shower of sparks.", outcomes: [{ type: "scrap", delta: -30 }] },
        ],
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-abandoned-lab",
    kind: "event",
    name: "Abandoned Lab",
    text: "A research annex, evacuated in a hurry. Half-packed crates of prototype kit still line the benches.",
    minColumn: 3,
    choices: [
      {
        id: "grab-prototype",
        label: "Pocket a prototype",
        detail: "A relic left on the bench",
        outcomes: [{ type: "grantRelic" }],
        resultText: "You wrap a prototype and slip it into your pack.",
      },
      {
        id: "raid-stores",
        label: "Raid the supply stores",
        detail: "Salvage and a shield charge",
        outcomes: [{ type: "scrap", delta: 30 }, { type: "grantShield", amount: 5 }],
        resultText: "You strip the stores for scrap and a spare capacitor.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-weapon-smuggler",
    kind: "event",
    name: "Weapon Smuggler",
    text: "A jury-rigged rover flags you down. Its owner deals in guns, not questions: two in, one better one out.",
    minColumn: 3,
    choices: [
      {
        id: "trade-up",
        label: "Trade two weapons for one",
        detail: "-2 weapons → 1 higher-tier rotary cannon",
        requirement: { minWeapons: 2 },
        outcomes: [{ type: "transmogrifyWeapon", resultWeaponId: "bulwark-rotary-cannon", resultTier: 2, consumeCount: 2 }],
        resultText: "The smuggler strips your guns for parts and hands over something heavier.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-rogue-server",
    kind: "event",
    name: "Rogue Server",
    text: "A live Bastion data node, cut off from command and still answering queries. It offers you a choice of doctrine.",
    minColumn: 2,
    choices: [
      {
        id: "download",
        label: "Download the doctrine set",
        detail: "Take one of three offered upgrades",
        outcomes: [{ type: "pickUpgradeFromSet", upgradeIds: ["rapid-cycling", "heavy-calibre", "composite-plating"] }],
        resultText: "The server picks one of its remaining doctrines and burns it into your gear.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-whispering-cargo",
    kind: "event",
    name: "Whispering Cargo",
    text: "A drifting cargo pod murmurs in a language that isn't quite words. It wants to trade — something for something better.",
    minColumn: 4,
    choices: [
      {
        id: "trade-relic",
        label: "Offer up a relic",
        detail: "Give up your most recently owned relic for a different one",
        outcomes: [{ type: "purifyRelic" }, { type: "grantRelic" }],
        resultText: "The pod swallows your offering and returns something that wasn't there before.",
      },
      LEAVE_CHOICE,
    ],
  },
  {
    id: "event-chimera-experiment",
    kind: "event",
    name: "Chimera Experiment",
    text: "A masked trader runs a stall of half-finished augments. \"Everything's a trade,\" they say. \"Pick your price.\"",
    minColumn: 4,
    choices: [
      {
        id: "flesh-for-scrap",
        label: "Sell flesh for scrap",
        detail: "-10 health → +10 scrap",
        requirement: { minHealth: 11 },
        outcomes: [{ type: "swapStat", from: "health", to: "scrap", amount: 10 }],
        resultText: "The trader takes their cut in blood and pays out in salvage.",
      },
      {
        id: "scrap-for-flesh",
        label: "Buy flesh with scrap",
        detail: "-20 scrap → +20 max health",
        requirement: { minScrap: 20 },
        outcomes: [{ type: "swapStat", from: "scrap", to: "maxHealth", amount: 20 }],
        resultText: "The trader grafts something sturdier where the scrap used to be.",
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
  /** Field-drop kits (Phase 2) carried forward to the next combat node's rotation. */
  consumables: PowerupType[];
  /** Bonus lifesteal-per-kill (Phase 2) granted on top of any relic/artifact source. */
  bonusLifestealPerKill: number;
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
    consumables: [],
    bonusLifestealPerKill: 0,
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
  let upgrades = build.upgrades.map((upgrade) => ({ ...upgrade }));
  let relicIds = [...(build.relicIds ?? [])];

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
      case "grantConsumable":
        effects.consumables.push(outcome.powerupType);
        break;
      case "pickUpgradeFromSet":
        upgrades = grantUpgrade(upgrades, pickUpgrade(outcome.upgradeIds, roll));
        break;
      case "removeUpgrade":
        upgrades = removeUpgrade(upgrades, outcome.upgradeId);
        break;
      case "purifyRelic":
        relicIds = removeRelic(relicIds, outcome.relicId);
        break;
      case "fullCleanse": {
        const currentBonus = build.maxHealthBonus ?? 0;
        if (currentBonus < 0) effects.maxHealthDelta -= currentBonus;
        health = effectiveMax();
        break;
      }
      case "transmogrifyWeapon":
        weapons = weapons.slice(0, Math.max(0, weapons.length - (outcome.consumeCount ?? 1)));
        weapons.push({ weaponId: outcome.resultWeaponId, tier: outcome.resultTier ?? 1 });
        break;
      case "duplicateWeapon":
        if (weapons.length > 0) weapons.push({ ...weapons[weapons.length - 1]! });
        break;
      case "duplicateRelic": {
        const source = outcome.relicId ?? relicIds[relicIds.length - 1];
        if (source) relicIds = [...relicIds, source];
        break;
      }
      case "swapStat":
        ({ health, scrap, experience } = applyStatSwap(
          { health, scrap, experience },
          outcome.from,
          outcome.to,
          outcome.amount,
          effectiveMax(),
          effects,
        ));
        break;
      case "grantLifesteal":
        effects.bonusLifestealPerKill += outcome.amount;
        break;
    }
  }

  return {
    build: {
      ...build,
      health, shield, scrap, experience, weapons, upgrades,
      // Only surface `relicIds` when it existed already or this resolution touched
      // it, so an untouched build (e.g. the Leave choice) round-trips unchanged.
      ...(build.relicIds !== undefined || relicIds.length > 0 ? { relicIds } : {}),
    },
    effects,
    resultText,
  };
}

/** Picks one upgrade id from a small offered set, deterministic by roll. */
function pickUpgrade(pool: readonly string[], roll: number): string {
  const index = Math.min(pool.length - 1, Math.floor(roll * pool.length));
  return pool[index]!;
}

/** Levels up an owned upgrade, or takes it fresh at level 1. */
function grantUpgrade(
  upgrades: { upgradeId: string; level: number }[],
  upgradeId: string,
): { upgradeId: string; level: number }[] {
  const existing = upgrades.find((upgrade) => upgrade.upgradeId === upgradeId);
  if (existing) {
    existing.level += 1;
    return upgrades;
  }
  return [...upgrades, { upgradeId, level: 1 }];
}

/** Drops one level off a named upgrade (or the most recently taken one), removing it at zero. */
function removeUpgrade(
  upgrades: { upgradeId: string; level: number }[],
  upgradeId?: string,
): { upgradeId: string; level: number }[] {
  const index = upgradeId
    ? upgrades.findIndex((upgrade) => upgrade.upgradeId === upgradeId)
    : upgrades.length - 1;
  if (index < 0) return upgrades;
  const target = upgrades[index]!;
  const next = [...upgrades];
  if (target.level > 1) {
    next[index] = { ...target, level: target.level - 1 };
  } else {
    next.splice(index, 1);
  }
  return next;
}

/** Removes a named relic id (or the most recently owned one) from the owned list. */
function removeRelic(relicIds: RelicId[], relicId?: RelicId): RelicId[] {
  const index = relicId ? relicIds.lastIndexOf(relicId) : relicIds.length - 1;
  if (index < 0) return relicIds;
  const next = [...relicIds];
  next.splice(index, 1);
  return next;
}

/** Converts `amount` of one resource into another; `to: "maxHealth"` folds into `effects`. */
function applyStatSwap(
  current: { health: number; scrap: number; experience: number },
  from: "scrap" | "health" | "experience",
  to: "scrap" | "maxHealth" | "experience",
  amount: number,
  effectiveMax: number,
  effects: EventSideEffects,
): { health: number; scrap: number; experience: number } {
  const next = { ...current };
  const spend = from === "health" ? Math.min(amount, Math.max(0, next.health - 1)) : amount;
  if (from === "scrap") next.scrap = Math.max(0, next.scrap - spend);
  else if (from === "health") next.health = Math.max(1, next.health - spend);
  else if (from === "experience") next.experience = Math.max(0, next.experience - spend);

  if (to === "scrap") next.scrap += spend;
  else if (to === "experience") next.experience += spend;
  else if (to === "maxHealth") {
    effects.maxHealthDelta += spend;
    next.health = Math.min(effectiveMax + spend, next.health + spend);
  }
  return next;
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
    carriedConsumables: [...(build.carriedConsumables ?? []), ...effects.consumables],
    bonusLifestealPerKill: (build.bonusLifestealPerKill ?? 0) + effects.bonusLifestealPerKill,
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
