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

export class HeroMotionController {
  private readonly stateMachine = new HeroStateMachine();
  private lastMoveDirection: Vector2Data = { x: 1, y: 0 };
  private evasiveCooldownRemainingSeconds = 0;

  constructor(private readonly hero: HeroDefinition) {}

  update(intent: PlayerIntent, deltaSeconds: number): HeroMotionFrame {
    this.evasiveCooldownRemainingSeconds = Math.max(
      0,
      this.evasiveCooldownRemainingSeconds - Math.max(deltaSeconds, 0),
    );

    if (intent.move.x !== 0 || intent.move.y !== 0) {
      this.lastMoveDirection = { ...intent.move };
    }

    if (intent.evasiveMovePressed && this.evasiveCooldownRemainingSeconds <= 0) {
      const started = this.stateMachine.startEvasiveMove(this.lastMoveDirection, this.hero.evasiveMove);
      if (started) {
        this.evasiveCooldownRemainingSeconds = this.hero.evasiveMove.durationSeconds
          + PROTOTYPE_EVASIVE_RECOVERY_SECONDS;
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
