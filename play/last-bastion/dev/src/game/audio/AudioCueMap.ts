import type { CombatEvent } from "../combat/CombatSimulation";

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
  "enemy-defeated": cue("alien-death", 240, 0.18, 0.09, "sawtooth", 90),
  explosion: cue("explosion", 130, 0.3, 0.12, "sawtooth", 45),
  "player-hit": cue("player-hit", 180, 0.22, 0.14, "square", 110),
  "xp-collected": cue("xp", 900, 0.06, 0.05, "sine", 1250),
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
/** UI confirm for decision buttons. */
export const UI_CONFIRM_CUE: Readonly<AudioCue> = cue("ui-confirm", 660, 0.09, 0.07, "sine", 880);

export function cueForEvent(eventType: CombatEvent["type"]): AudioCue | null {
  return CUES[eventType] ?? null;
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
