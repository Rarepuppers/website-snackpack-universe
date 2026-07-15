import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";
import type { HeroDefinition } from "./HeroDefinition";
import { HeroStateMachine, type HeroState } from "./HeroStateMachine";

export interface HeroMotionFrame {
  state: HeroState;
  displacementMetres: Vector2Data;
  isInvulnerable: boolean;
  evasiveProgress: number;
}

export class HeroMotionController {
  private readonly stateMachine = new HeroStateMachine();
  private lastMoveDirection: Vector2Data = { x: 1, y: 0 };

  constructor(private readonly hero: HeroDefinition) {}

  update(intent: PlayerIntent, deltaSeconds: number): HeroMotionFrame {
    if (intent.move.x !== 0 || intent.move.y !== 0) {
      this.lastMoveDirection = { ...intent.move };
    }

    if (intent.evasiveMovePressed) {
      this.stateMachine.startEvasiveMove(this.lastMoveDirection, this.hero.evasiveMove);
    }

    const frame = this.stateMachine.update(deltaSeconds, intent.move);

    if (frame.state === "evading" || frame.evasiveProgress > 0) {
      return frame;
    }

    const movementDistance = this.hero.movementSpeedMetresPerSecond * Math.max(deltaSeconds, 0);

    return {
      ...frame,
      displacementMetres: {
        x: intent.move.x * movementDistance,
        y: intent.move.y * movementDistance,
      },
    };
  }
}
