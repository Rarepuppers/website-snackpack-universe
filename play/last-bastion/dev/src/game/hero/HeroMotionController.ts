import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";
import type { HeroDefinition } from "./HeroDefinition";
import { HeroStateMachine, type HeroState } from "./HeroStateMachine";

export interface HeroMotionFrame {
  state: HeroState;
  displacementMetres: Vector2Data;
  isInvulnerable: boolean;
  evasiveProgress: number;
  evasiveReady: boolean;
  evasiveCooldownRemainingSeconds: number;
}

export const PROTOTYPE_EVASIVE_RECOVERY_SECONDS = 0.75;

/**
 * Run-long scaling applied to the evasive move. Kinetic Greaves trades reach for
 * recovery, so both knobs move together and both default to neutral.
 */
export interface EvasiveMoveModifiers {
  distanceMultiplier: number;
  recoveryMultiplier: number;
}

export const NEUTRAL_EVASIVE_MODIFIERS: Readonly<EvasiveMoveModifiers> = Object.freeze({
  distanceMultiplier: 1,
  recoveryMultiplier: 1,
});

export class HeroMotionController {
  private readonly stateMachine = new HeroStateMachine();
  private lastMoveDirection: Vector2Data = { x: 1, y: 0 };
  private evasiveCooldownRemainingSeconds = 0;
  private evasiveModifiers: EvasiveMoveModifiers = { ...NEUTRAL_EVASIVE_MODIFIERS };

  constructor(private readonly hero: HeroDefinition) {}

  /**
   * Chrono Capacitor: a successful dodge hands back part of the evasive
   * cooldown. A no-op at zero, so the ordinary case is untouched.
   */
  refundEvasiveCooldown(fraction: number): void {
    if (fraction <= 0 || this.evasiveCooldownRemainingSeconds <= 0) return;
    const kept = 1 - Math.min(1, fraction);
    this.evasiveCooldownRemainingSeconds *= kept;
  }

  /** Applied by `CombatSimulation` once the run's relics are resolved. */
  setEvasiveModifiers(modifiers: EvasiveMoveModifiers): void {
    this.evasiveModifiers = {
      distanceMultiplier: Math.max(0.1, modifiers.distanceMultiplier),
      recoveryMultiplier: Math.max(0.1, modifiers.recoveryMultiplier),
    };
  }

  update(intent: PlayerIntent, deltaSeconds: number): HeroMotionFrame {
    this.evasiveCooldownRemainingSeconds = Math.max(
      0,
      this.evasiveCooldownRemainingSeconds - Math.max(deltaSeconds, 0),
    );

    if (intent.move.x !== 0 || intent.move.y !== 0) {
      this.lastMoveDirection = { ...intent.move };
    }

    if (intent.evasiveMovePressed && this.evasiveCooldownRemainingSeconds <= 0) {
      const started = this.stateMachine.startEvasiveMove(this.lastMoveDirection, {
        ...this.hero.evasiveMove,
        distanceMetres: this.hero.evasiveMove.distanceMetres * this.evasiveModifiers.distanceMultiplier,
      });
      if (started) {
        this.evasiveCooldownRemainingSeconds = this.hero.evasiveMove.durationSeconds
          + PROTOTYPE_EVASIVE_RECOVERY_SECONDS * this.evasiveModifiers.recoveryMultiplier;
      }
    }

    const frame = this.stateMachine.update(deltaSeconds, intent.move);

    if (frame.state === "evading" || frame.evasiveProgress > 0) {
      return {
        ...frame,
        evasiveReady: false,
        evasiveCooldownRemainingSeconds: this.evasiveCooldownRemainingSeconds,
      };
    }

    const movementDistance = this.hero.movementSpeedMetresPerSecond * Math.max(deltaSeconds, 0);

    return {
      ...frame,
      displacementMetres: {
        x: intent.move.x * movementDistance,
        y: intent.move.y * movementDistance,
      },
      evasiveReady: this.evasiveCooldownRemainingSeconds <= 0,
      evasiveCooldownRemainingSeconds: this.evasiveCooldownRemainingSeconds,
    };
  }
}
