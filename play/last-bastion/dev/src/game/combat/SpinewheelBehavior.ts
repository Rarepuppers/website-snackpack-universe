import type { ArenaDefinition } from "../arena/ArenaDefinition";
import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import { stepSpinewheelReflection } from "./SpinewheelPhysics";

export const SPINEWHEEL_BASE_ROLL_SPEED = 7;
export const SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER = 0.85;
export const SPINEWHEEL_MAX_REBOUNDS = 2;
export const SPINEWHEEL_REPEAT_HIT_LOCKOUT_SECONDS = 0.75;
export const SPINEWHEEL_WINDUP_SECONDS = 0.7;
export const SPINEWHEEL_MAX_ROLL_SECONDS = 3.2;
export const SPINEWHEEL_RECOVERY_SECONDS = 1.5;
export const SPINEWHEEL_POSITIONING_SECONDS = 0.65;
export const SPINEWHEEL_APPROACH_RANGE_METRES = 6.5;

export type SpinewheelPhase = "positioning" | "windup" | "rolling" | "recovery";

export interface SpinewheelState {
  readonly phase: SpinewheelPhase;
  readonly phaseRemainingSeconds: number;
  readonly direction: Vector2Data;
  readonly speedMetresPerSecond: number;
  readonly bouncesRemaining: number;
  readonly playerHitCooldownSeconds: number;
}

export interface SpinewheelStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly positioningSpeedMetresPerSecond: number;
  readonly statusSpeedMultiplier: number;
  readonly radiusMetres: number;
  readonly playerRadiusMetres: number;
  readonly arena: ArenaDefinition;
}

export interface SpinewheelStepResult {
  readonly state: SpinewheelState;
  /** Rolling uses bespoke reflection physics and returns its resolved position here. */
  readonly position: Vector2Data;
  /** Positioning still resolves through CombatSimulation's standard collision path. */
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  readonly warningFired: boolean;
  readonly bounceFired: boolean;
  readonly crossedPlayer: boolean;
  readonly recoveryFired: boolean;
}

export function stepSpinewheelBehavior(
  state: SpinewheelState,
  input: SpinewheelStepInput,
): SpinewheelStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const playerHitCooldownSeconds = Math.max(
    0,
    state.playerHitCooldownSeconds - input.deltaSeconds,
  );
  const towardPlayer = normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });
  const baseState = { ...state, phaseRemainingSeconds, playerHitCooldownSeconds };

  switch (state.phase) {
    case "positioning": {
      const committing = phaseRemainingSeconds <= 0;
      return {
        state: committing
          ? {
              ...baseState,
              phase: "windup",
              phaseRemainingSeconds: SPINEWHEEL_WINDUP_SECONDS,
              direction: towardPlayer,
            }
          : baseState,
        position: input.position,
        movement: distance(input.position, input.playerPosition) > SPINEWHEEL_APPROACH_RANGE_METRES
          ? fixedDirection(towardPlayer, input.positioningSpeedMetresPerSecond)
          : NO_MOVEMENT,
        facingDirection: towardPlayer,
        warningFired: committing,
        bounceFired: false,
        crossedPlayer: false,
        recoveryFired: false,
      };
    }

    case "windup":
      return {
        state: phaseRemainingSeconds <= 0
          ? {
              ...baseState,
              phase: "rolling",
              phaseRemainingSeconds: SPINEWHEEL_MAX_ROLL_SECONDS,
              speedMetresPerSecond: SPINEWHEEL_BASE_ROLL_SPEED,
              bouncesRemaining: SPINEWHEEL_MAX_REBOUNDS,
            }
          : baseState,
        position: input.position,
        movement: NO_MOVEMENT,
        facingDirection: null,
        warningFired: false,
        bounceFired: false,
        crossedPlayer: false,
        recoveryFired: false,
      };

    case "rolling": {
      const reflection = stepSpinewheelReflection(
        input.position,
        state.direction,
        state.speedMetresPerSecond * input.statusSpeedMultiplier * input.deltaSeconds,
        input.radiusMetres,
        input.arena,
      );
      let nextState: SpinewheelState = {
        ...baseState,
        direction: reflection.direction,
      };

      if (reflection.bounced && state.bouncesRemaining <= 0) {
        return {
          state: enterSpinewheelRecovery(nextState),
          position: reflection.position,
          movement: NO_MOVEMENT,
          facingDirection: reflection.direction,
          warningFired: false,
          bounceFired: false,
          crossedPlayer: false,
          recoveryFired: true,
        };
      }

      let bounceFired = false;
      if (reflection.bounced) {
        nextState = {
          ...nextState,
          bouncesRemaining: state.bouncesRemaining - 1,
          speedMetresPerSecond:
            state.speedMetresPerSecond * SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER,
        };
        bounceFired = true;
      }

      const crossedPlayer = distanceToSegment(
        input.playerPosition,
        input.position,
        reflection.position,
      ) <= input.radiusMetres + input.playerRadiusMetres;
      const recoveryFired = phaseRemainingSeconds <= 0;
      return {
        state: recoveryFired ? enterSpinewheelRecovery(nextState) : nextState,
        position: reflection.position,
        movement: NO_MOVEMENT,
        facingDirection: reflection.direction,
        warningFired: false,
        bounceFired,
        crossedPlayer,
        recoveryFired,
      };
    }

    case "recovery":
      return {
        state: phaseRemainingSeconds <= 0
          ? {
              ...baseState,
              phase: "positioning",
              phaseRemainingSeconds: SPINEWHEEL_POSITIONING_SECONDS,
            }
          : baseState,
        position: input.position,
        movement: NO_MOVEMENT,
        facingDirection: null,
        warningFired: false,
        bounceFired: false,
        crossedPlayer: false,
        recoveryFired: false,
      };
  }
}

export function lockSpinewheelPlayerHit(state: SpinewheelState): SpinewheelState {
  return { ...state, playerHitCooldownSeconds: SPINEWHEEL_REPEAT_HIT_LOCKOUT_SECONDS };
}

function enterSpinewheelRecovery(state: SpinewheelState): SpinewheelState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: SPINEWHEEL_RECOVERY_SECONDS,
  };
}

function distanceToSegment(point: Vector2Data, from: Vector2Data, to: Vector2Data): number {
  const segment = { x: to.x - from.x, y: to.y - from.y };
  const lengthSquared = segment.x * segment.x + segment.y * segment.y;
  if (lengthSquared <= 0) return distance(point, from);
  const offset = { x: point.x - from.x, y: point.y - from.y };
  const projection = Math.max(
    0,
    Math.min(1, (offset.x * segment.x + offset.y * segment.y) / lengthSquared),
  );
  return distance(point, {
    x: from.x + segment.x * projection,
    y: from.y + segment.y * projection,
  });
}
