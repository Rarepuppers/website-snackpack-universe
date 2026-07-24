import type { CombatEvent } from "../combat/CombatSimulation";
import type { WeaponId } from "../content/weaponCatalog";

/**
 * Representative audio cues for combat events. Each cue currently describes a
 * short synthesized placeholder tone; when production audio files exist, the
 * same event → cue ids become the lookup for real samples.
 */
export interface AudioCue {
  id: string;
  frequencyHz: number;
  durationSeconds: number;
  /** 0..1, kept low so overlapping placeholder tones never clip. */
  volume: number;
  oscillator: OscillatorType;
  /** Optional pitch slide destination for simple falling/rising effects. */
  endFrequencyHz?: number;
}

const CUES: Readonly<Partial<Record<CombatEvent["type"], AudioCue>>> = Object.freeze({
  "weapon-fired": cue("rifle-fire", 720, 0.05, 0.05, "square", 520),
  "enemy-hit": cue("impact", 300, 0.05, 0.06, "triangle"),
  "bolt-impact": cue("bolt-impact", 470, 0.07, 0.07, "square", 240),
  "enemy-defeated": cue("alien-death", 240, 0.18, 0.09, "sawtooth", 90),
  explosion: cue("explosion", 130, 0.3, 0.12, "sawtooth", 45),
  "player-hit": cue("player-hit", 180, 0.22, 0.14, "square", 110),
  "xp-collected": cue("xp", 900, 0.06, 0.05, "sine", 1250),
  "supply-chest-hit": cue("chest-hit", 340, 0.06, 0.07, "square", 220),
  "supply-chest-opened": cue("chest-open", 480, 0.22, 0.1, "sine", 880),
  "supply-chest-destroyed": cue("chest-destroyed", 220, 0.24, 0.11, "sawtooth", 90),
  "level-up": cue("level-up", 620, 0.34, 0.11, "sine", 1150),
  "egg-hatched": cue("hatch", 380, 0.2, 0.08, "triangle", 200),
  "slime-glob-fired": cue("glob", 420, 0.1, 0.06, "sine", 260),
  "slime-impact": cue("glob-impact", 220, 0.14, 0.07, "sine", 120),
  "chain-arc": cue("chain-arc", 1400, 0.06, 0.05, "sawtooth", 700),
  "elite-armour-hit": cue("armour-clank", 520, 0.07, 0.07, "square", 480),
  "elite-reward-collected": cue("cache", 760, 0.24, 0.1, "sine", 1300),
  "mini-boss-sweep": cue("sweep", 160, 0.24, 0.12, "sawtooth", 80),
  "mini-boss-shockwave": cue("shockwave", 100, 0.32, 0.13, "sawtooth", 40),
  "brood-cleave": cue("brood-cleave", 190, 0.2, 0.11, "sawtooth", 90),
  "brood-acid-volley": cue("brood-acid", 520, 0.14, 0.08, "sine", 250),
  "brood-eggs-laid": cue("brood-eggs", 310, 0.2, 0.08, "triangle", 180),
  "brood-swarm-rush": cue("brood-rush", 240, 0.34, 0.12, "sawtooth", 480),
  "corrupted-marine-warning": cue("marine-knife-warning", 540, 0.22, 0.07, "triangle", 760),
  "corrupted-marine-knife-fired": cue("marine-knife-throw", 880, 0.1, 0.07, "sawtooth", 330),
  "corrupted-marine-knife-impact": cue("marine-knife-impact", 260, 0.1, 0.08, "square", 120),
  "abomination-slam-warning": cue("abomination-slam-warning", 150, 0.38, 0.09, "triangle", 85),
  "abomination-slam-impact": cue("abomination-slam-impact", 85, 0.34, 0.13, "sawtooth", 35),
  "ripper-sweep": cue("ripper-sweep", 210, 0.22, 0.1, "sawtooth", 80),
  "razor-scuttler-warning": cue("razor-warning", 520, 0.16, 0.07, "triangle", 760),
  "razor-scuttler-dash": cue("razor-dash", 680, 0.14, 0.08, "sawtooth", 240),
  "razor-scuttler-impact": cue("razor-impact", 220, 0.16, 0.09, "square", 90),
  "quillback-volley": cue("quillback-volley", 680, 0.12, 0.08, "square", 260),
  "quillback-spike-impact": cue("quill-impact", 420, 0.07, 0.05, "triangle", 180),
  "spinewheel-windup": cue("spinewheel-windup", 360, 0.18, 0.07, "triangle", 620),
  "spinewheel-bounce": cue("spinewheel-bounce", 190, 0.12, 0.09, "square", 110),
  "spinewheel-hit": cue("spinewheel-hit", 120, 0.2, 0.11, "sawtooth", 55),
  "spinewheel-recovery": cue("spinewheel-recovery", 500, 0.18, 0.06, "sine", 260),
  "tether-bloom-windup": cue("tether-warning", 440, 0.2, 0.06, "sine", 680),
  "tether-bloom-latched": cue("tether-latched", 260, 0.22, 0.08, "triangle", 520),
  "tether-bloom-broken": cue("tether-break", 720, 0.12, 0.07, "square", 280),
  "tether-bloom-released": cue("tether-release", 310, 0.16, 0.05, "sine", 180),
  "bastion-eater-phase": cue("bastion-phase", 120, 0.48, 0.13, "sawtooth", 420),
  "bastion-eater-claw-warning": cue("bastion-claw-warning", 260, 0.28, 0.08, "triangle", 520),
  "bastion-eater-claw-strike": cue("bastion-claw", 105, 0.3, 0.13, "sawtooth", 45),
  "bastion-eater-charge": cue("bastion-charge", 160, 0.38, 0.12, "square", 70),
  "bastion-eater-tendril": cue("bastion-tendril", 340, 0.3, 0.09, "sine", 120),
  "bastion-eater-eggs": cue("bastion-brood", 280, 0.32, 0.09, "triangle", 150),
  "bastion-eater-breach": cue("bastion-breach", 90, 0.44, 0.13, "sawtooth", 35),
  "bastion-eater-vault": cue("victory-vault", 420, 0.8, 0.12, "sine", 1080),
  "obstacle-destroyed": cue("cover-break", 150, 0.26, 0.11, "square", 60),
  "status-applied": cue("status", 980, 0.12, 0.07, "triangle", 660),
  "powerup-collected": cue("powerup", 540, 0.26, 0.1, "sine", 1080),
  "warp-arrival": cue("warp", 1200, 0.18, 0.08, "sine", 300),
  "ultimate-fired": cue("ultimate", 320, 0.4, 0.13, "sawtooth", 640),
  "fence-activated": cue("fence-on", 220, 0.3, 0.1, "square", 880),
});

/** Roll/dodge feedback is driven by hero state, not a combat event. */
export const EVASIVE_MOVE_CUE: Readonly<AudioCue> = cue("dodge", 460, 0.1, 0.06, "sine", 700);
/**
 * Medkit/chest heal feedback. Not wired through `cueForEvent`: `player-healed`
 * also fires on every passive regen tick, and that must stay silent so the
 * cue reads as "you picked something up", not a metronome.
 */
export const MEDKIT_HEAL_CUE: Readonly<AudioCue> = cue("heal", 560, 0.16, 0.09, "sine", 940);
/** UI confirm for decision buttons. */
export const UI_CONFIRM_CUE: Readonly<AudioCue> = cue("ui-confirm", 660, 0.09, 0.07, "sine", 880);

export function cueForEvent(eventType: CombatEvent["type"]): AudioCue | null {
  return CUES[eventType] ?? null;
}

const WEAPON_CUES: Readonly<Record<WeaponId, AudioCue>> = Object.freeze({
  "bastion-service-rifle": cue("service-rifle-fire", 720, 0.05, 0.05, "square", 520),
  scattergun: cue("scattergun-fire", 210, 0.12, 0.09, "sawtooth", 95),
  "arc-carbine": cue("arc-carbine-fire", 1250, 0.08, 0.06, "sawtooth", 620),
  "patrol-blade": cue("patrol-blade-swing", 440, 0.14, 0.07, "triangle", 120),
  "bolt-carbine": cue("bolt-carbine-fire", 880, 0.11, 0.08, "square", 360),
  "bulwark-rotary-cannon": cue("bulwark-rotary-fire", 190, 0.045, 0.045, "square", 145),
  "grenade-tube": cue("grenade-tube-fire", 170, 0.16, 0.08, "triangle", 80),
  "injector-carbine": cue("injector-carbine-fire", 630, 0.07, 0.05, "square", 410),
  railspike: cue("railspike-fire", 140, 0.26, 0.13, "sawtooth", 50),
  "seeker-swarm": cue("seeker-swarm-fire", 900, 0.09, 0.06, "sine", 1400),
  "cryo-lance": cue("cryo-lance-beam", 320, 0.05, 0.05, "sine", 340),
  "tesla-coil": cue("tesla-coil-arc", 1400, 0.07, 0.07, "sawtooth", 2200),
  flamethrower: cue("flamethrower-jet", 130, 0.09, 0.08, "sawtooth", 90),
  sawblade: cue("sawblade-spin", 210, 0.04, 0.05, "sawtooth", 240),
  "event-horizon": cue("event-horizon-charge", 90, 0.4, 0.16, "sine", 40),
});

export function cueForCombatEvent(event: CombatEvent): AudioCue | null {
  return event.type === "weapon-fired" ? WEAPON_CUES[event.weaponId] : cueForEvent(event.type);
}

function cue(
  id: string,
  frequencyHz: number,
  durationSeconds: number,
  volume: number,
  oscillator: OscillatorType,
  endFrequencyHz?: number,
): AudioCue {
  return Object.freeze({ id, frequencyHz, durationSeconds, volume, oscillator, endFrequencyHz });
}
