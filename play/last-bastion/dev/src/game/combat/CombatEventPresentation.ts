import type { CombatEvent } from "./CombatSimulation";

/**
 * Which surface is responsible for making each combat event perceivable.
 *
 * The simulation's event union has grown to 152 members and nothing ever
 * checked that a new one reached the player. Twenty-one of them did not: the
 * completion and failure of all three objective modes, two boss telegraphs, and
 * every deployable lifecycle event fired into a void. Not one of those was a
 * bug anybody could see in a diff, because the omission is the absence of code.
 *
 * Declaring the map as `Record<CombatEvent["type"], ...>` is what fixes that
 * class rather than the twenty-one instances: add a member to the union without
 * a row here and `tsc` names it; delete a member and `tsc` names the stale row.
 * `CombatEventPresentation.test.ts` then checks the claim each row makes against
 * the code that would have to be there for it to be true.
 *
 * The list is not a wishlist. Shrinking `unpresented` is presentation-defect
 * plan §5.3; a row only moves when the handler is actually written.
 */
export type PresentationSurface =
  /** `PrototypeScene.playCombatEvents` has a `case` for it: a visible response. */
  | "scene"
  /**
   * A cue plays but nothing is drawn. Acceptable where the world state the event
   * describes is already on screen from the snapshot; a gap where it is not.
   */
  | "audio-only"
  /**
   * Known backlog: no visual, no cue, anywhere. The underlying state is mostly
   * still drawn from the snapshot — deployables, telegraphs and objective
   * progress all render — so what is missing is the *moment*, not the system.
   * That makes these S2, not S1, and it is why they are tracked rather than
   * treated as an outage.
   */
  | "unpresented"
  /** Consumed by `CombatHud` rather than the scene — a readout, not an effect. */
  | "hud"
  /**
   * Deliberately silent, with a reason recorded at the row. This is the
   * difference between "we have not done it" and "we decided not to", and the
   * list is worthless without it: four rows that looked like debt turned out to
   * be three decisions and one detector gap.
   */
  | "exempt";

export const COMBAT_EVENT_PRESENTATION: Readonly<Record<CombatEvent["type"], PresentationSurface>> = {
  "weapon-fired": "scene",
  "enemy-hit": "scene",
  "bolt-impact": "scene",
  "projectile-impact": "scene",
  "enemy-defeated": "scene",
  "explosion": "scene",
  "player-hit": "scene",
  "player-shield-hit": "scene",
  "player-healed": "scene",
  "xp-collected": "scene",
  "level-up": "scene",
  "enemy-spawned": "scene",
  "egg-hatched": "scene",
  "projectile-blocked": "scene",
  "chain-arc": "scene",
  "slime-spit-windup": "scene",
  "slime-glob-fired": "scene",
  "slime-impact": "scene",
  "elite-armour-hit": "scene",
  "elite-reward-dropped": "scene",
  "elite-reward-collected": "scene",
  "escort-objective-damaged": "scene",
  "escort-objective-completed": "scene",
  "escort-objective-failed": "scene",
  "deny-objective-completed": "scene",
  "deny-objective-failed": "scene",
  "collect-objective-picked-up": "scene",
  "collect-objective-completed": "scene",
  "collect-objective-failed": "scene",
  "mini-boss-sweep": "scene",
  "mini-boss-shockwave": "scene",
  "rain-of-spines-impact": "scene",
  "brood-cleave": "scene",
  "brood-acid-volley": "scene",
  "brood-acid-impact": "scene",
  "brood-eggs-laid": "scene",
  "brood-swarm-rush": "scene",
  "corrupted-marine-warning": "scene",
  "corrupted-marine-knife-fired": "scene",
  "corrupted-marine-knife-impact": "scene",
  "infected-survivor-rush": "audio-only",
  "abomination-recovery": "audio-only",
  "abomination-slam-warning": "scene",
  "abomination-slam-impact": "scene",
  "nest-weaver-placement-warning": "scene",
  "nest-pod-laid": "scene",
  "nest-pod-hatched": "scene",
  "nest-pod-destroyed": "scene",
  "storm-chain-warning": "scene",
  "storm-chain-discharged": "scene",
  "storm-chain-interrupted": "scene",
  "scrap-skitterer-warning": "scene",
  "scrap-skitterer-rush": "scene",
  "scrap-skitterer-impact": "scene",
  "scrap-skitterer-wreck": "scene",
  "arc-warden-warning": "scene",
  "arc-warden-discharged": "scene",
  "ironhide-adapted": "scene",
  "foundry-fabrication-started": "scene",
  "foundry-fabrication-completed": "scene",
  "foundry-fabrication-interrupted": "scene",
  "foundry-turret-warning": "scene",
  "foundry-turret-fired": "scene",
  "foundry-child-powered-down": "scene",
  "synapse-herald-warning": "scene",
  "synapse-herald-lunge": "scene",
  "synapse-herald-zones-erupted": "scene",
  "synapse-herald-link-started": "scene",
  "synapse-herald-link-broken": "scene",
  "assembly-prime-warning": "scene",
  "assembly-prime-lane-fired": "scene",
  "assembly-prime-fabrication-completed": "scene",
  "assembly-prime-fabrication-interrupted": "scene",
  "assembly-prime-drone-recalled": "scene",
  "storm-regent-warning": "scene",
  "storm-regent-discharged": "scene",
  "storm-regent-interrupted": "scene",
  "abomination-prime-warning": "scene",
  "abomination-prime-slam": "scene",
  "abomination-prime-grab-latched": "scene",
  "abomination-prime-grab-broken": "scene",
  "abomination-prime-biomass-thrown": "scene",
  "abomination-prime-biomass-landed": "scene",
  "abomination-prime-hazard-tick": "scene",
  "reclaimer-link-started": "scene",
  "reclaimer-repair-completed": "scene",
  "reclaimer-link-interrupted": "scene",
  "rift-stalker-mark": "scene",
  "rift-stalker-warp-out": "scene",
  "rift-stalker-pounce": "scene",
  "rift-stalker-fan": "scene",
  "rift-stalker-slash": "scene",
  "obstacle-damaged": "scene",
  "obstacle-destroyed": "scene",
  "mini-boss-reward-dropped": "scene",
  "item-granted": "scene",
  "brace-formation": "scene",
  "player-revived": "scene",
  "status-applied": "scene",
  "powerup-collected": "scene",
  "deployable-placed": "scene",
  // Fires once per turret shot. The projectile it creates is already drawn, and
  // a flash per shot would be strobing within a second of placing one.
  "deployable-fired": "exempt",
  "deployable-expired": "scene",
  "world-interaction-completed": "scene",
  "kit-activated": "scene",
  "warp-arrival": "scene",
  "ripper-sweep": "scene",
  "razor-scuttler-warning": "scene",
  "razor-scuttler-dash": "scene",
  "razor-scuttler-impact": "scene",
  "quillback-windup": "scene",
  "quillback-volley": "scene",
  "quillback-spike-impact": "scene",
  "spinewheel-windup": "scene",
  "spinewheel-bounce": "scene",
  "spinewheel-hit": "scene",
  "spinewheel-recovery": "scene",
  "tether-bloom-windup": "scene",
  "tether-bloom-latched": "scene",
  "tether-bloom-broken": "scene",
  "tether-bloom-released": "scene",
  "aurum-arrived": "scene",
  "aurum-fleeing": "scene",
  "aurum-armour-broken": "scene",
  "aurum-escaped": "scene",
  "aurum-supply-cache-dropped": "scene",
  "scrap-secured": "scene",
  // The HUD flashes the scrap readout off this event; an effect as well would
  // double-report a number the player is already looking at.
  "scrap-spent": "hud",
  // Happens inside the shop overlay, which redraws the rack and the balance in
  // the same frame. The confirmation is the UI changing, not a flash.
  "weapon-sold": "exempt",
  "bastion-eater-phase": "scene",
  "bastion-eater-claw-warning": "scene",
  "bastion-eater-claw-strike": "scene",
  "bastion-eater-charge": "scene",
  "bastion-eater-tendril": "scene",
  "bastion-eater-eggs": "scene",
  "bastion-eater-breach": "scene",
  "bastion-eater-vault": "scene",
  "choir-voice-collapsed": "scene",
  "choir-merged": "scene",
  "choir-pulse-warning": "scene",
  "choir-pulse": "scene",
  "choir-flood-hit": "scene",
  "sovereign-fabrication-warning": "scene",
  "sovereign-fabricated": "scene",
  "ultimate-fired": "scene",
  "medic-triage": "scene",
  "medic-surge": "scene",
  "fence-activated": "scene",
  "supply-chest-spawned": "scene",
  "supply-chest-hit": "audio-only",
  "supply-chest-opened": "scene",
  "supply-chest-destroyed": "scene",};

/** Events whose `case` the presentation test must find in the combat scene. */
export function sceneHandledEvents(): readonly string[] {
  return entriesWithSurface("scene");
}

/** The §5.3 backlog, in one place, so its size is a number and not a feeling. */
export function unpresentedEvents(): readonly string[] {
  return entriesWithSurface("unpresented");
}

export function hudEvents(): readonly string[] {
  return entriesWithSurface("hud");
}

export function exemptEvents(): readonly string[] {
  return entriesWithSurface("exempt");
}

export function audioOnlyEvents(): readonly string[] {
  return entriesWithSurface("audio-only");
}

function entriesWithSurface(surface: PresentationSurface): readonly string[] {
  return Object.entries(COMBAT_EVENT_PRESENTATION)
    .filter(([, value]) => value === surface)
    .map(([key]) => key);
}
