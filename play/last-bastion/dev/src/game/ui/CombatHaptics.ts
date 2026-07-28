import type { CombatEvent } from "../combat/CombatSimulation";

export interface HapticPattern {
  readonly durationMilliseconds: number;
  readonly strongMagnitude: number;
  readonly weakMagnitude: number;
}

type HapticActuator = Pick<GamepadHapticActuator, "playEffect">;

const DAMAGE: HapticPattern = {
  durationMilliseconds: 110,
  strongMagnitude: 0.65,
  weakMagnitude: 0.25,
};
const SHIELD: HapticPattern = {
  durationMilliseconds: 70,
  strongMagnitude: 0.12,
  weakMagnitude: 0.38,
};
const REWARD: HapticPattern = {
  durationMilliseconds: 85,
  strongMagnitude: 0.12,
  weakMagnitude: 0.5,
};
const ULTIMATE: HapticPattern = {
  durationMilliseconds: 170,
  strongMagnitude: 0.58,
  weakMagnitude: 0.7,
};
const REVIVAL: HapticPattern = {
  durationMilliseconds: 280,
  strongMagnitude: 0.38,
  weakMagnitude: 0.78,
};

/** Sparse feedback policy: routine attacks and kills deliberately produce no rumble. */
export function hapticPatternForCombatEvent(event: CombatEvent): HapticPattern | null {
  switch (event.type) {
    case "player-hit":
      return DAMAGE;
    case "player-shield-hit":
      return SHIELD;
    case "ultimate-fired":
      return ULTIMATE;
    case "player-revived":
      return REVIVAL;
    case "level-up":
    case "elite-reward-collected":
    case "item-granted":
    case "powerup-collected":
    case "kit-activated":
      return REWARD;
    default:
      return null;
  }
}

export class CombatHaptics {
  private strength: number;

  constructor(
    private readonly actuator: () => HapticActuator | null,
    strength: number,
  ) {
    this.strength = clamp01(strength);
  }

  setStrength(strength: number): void {
    this.strength = clamp01(strength);
  }

  playForEvent(event: CombatEvent): void {
    const pattern = hapticPatternForCombatEvent(event);
    if (!pattern || this.strength <= 0) return;
    const target = this.actuator();
    if (!target) return;
    void target.playEffect("dual-rumble", {
      duration: pattern.durationMilliseconds,
      strongMagnitude: pattern.strongMagnitude * this.strength,
      weakMagnitude: pattern.weakMagnitude * this.strength,
    }).catch(() => {
      // Haptics are optional hardware feedback; unsupported effects must never
      // interrupt the simulation or flood the console.
    });
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, 1));
}
