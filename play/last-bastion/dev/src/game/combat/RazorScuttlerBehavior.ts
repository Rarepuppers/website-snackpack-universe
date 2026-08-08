import type { ArenaDefinition } from "../arena/ArenaDefinition";
import { collidesWithObstacle } from "../arena/ArenaDefinition";
import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import {
  fixedDirection,
  NO_MOVEMENT,
  type EnemyMovementIntent,
} from "./EnemyMovementIntent";

export const RAZOR_SCUTTLER_WINDUP_SECONDS = 0.48;
export const RAZOR_SCUTTLER_DASH_SPEED = 9.5;
export const RAZOR_SCUTTLER_DASH_SECONDS = 0.55;
export const RAZOR_SCUTTLER_RECOVERY_SECONDS = 1.15;
export const RAZOR_SCUTTLER_MIN_DASH_RANGE = 2.6;
export const RAZOR_SCUTTLER_MAX_DASH_RANGE = 7.5;
/** Razorlord elite: faster pursuit and a noticeably faster dash than the base scuttler. */
export const RAZORLORD_PURSUIT_SPEED = 4.6;
export const RAZORLORD_DASH_SPEED = 11;

export type RazorScuttlerPhase = "pursuit" | "windup" | "dash" | "recovery";
export type RazorScuttlerImpactReason = "player" | "cover" | "miss";

export interface RazorScuttlerState {
  readonly phase: RazorScuttlerPhase;
  readonly phaseRemainingSeconds: number;
  readonly direction: Vector2Data;
  readonly hitPlayer: boolean;
}

export interface RazorScuttlerStepInput {
  readonly deltaSeconds: number;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly pursuitSpeedMetresPerSecond: number;
  readonly dashSpeedMetresPerSecond: number;
  readonly radiusMetres: number;
  readonly playerRadiusMetres: number;
  readonly widthMetres: number;
  readonly heightMetres: number;
  readonly arena: ArenaDefinition;
}

export interface RazorScuttlerStepResult {
  readonly state: RazorScuttlerState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  /** Set on the pursuit -> windup transition; the caller emits the warning event. */
  readonly warningFired: boolean;
  /** Set on the windup -> dash transition; the caller emits the dash event. */
  readonly dashFired: boolean;
  /**
   * Set the frame an impact ends the dash (cover, a player hit, or a timeout
   * miss). `null` on every other frame. The caller emits the impact event and,
   * for `"player"`, applies damage — this module states the reason only.
   */
  readonly impact: RazorScuttlerImpactReason | null;
}

/**
 * `pursuit` holds a preferred engagement band (retreat inside the minimum
 * range, close inside the maximum, hold and just face the player in between)
 * rather than the generic `range-band` movement intent — the band and speed
 * here are the scuttler's own tuned constants, not a shared steering profile,
 * and the two must not be conflated.
 *
 * `dash`'s cover/boundary check runs against the *desired* position for this
 * tick, using data already available before movement resolves — unlike the
 * player-hit check, which needs where the scuttler actually ended up, so it
 * lives in `resolveRazorScuttlerAfterMovement` instead.
 */
export function stepRazorScuttlerBehavior(
  state: RazorScuttlerState,
  input: RazorScuttlerStepInput,
): RazorScuttlerStepResult {
  const phaseRemainingSeconds = state.phaseRemainingSeconds - input.deltaSeconds;
  const expired = phaseRemainingSeconds <= 0;
  const playerDistance = distance(input.position, input.playerPosition);

  switch (state.phase) {
    case "pursuit": {
      const towardPlayer = normalizeVector({
        x: input.playerPosition.x - input.position.x,
        y: input.playerPosition.y - input.position.y,
      });
      const movement: EnemyMovementIntent = playerDistance < RAZOR_SCUTTLER_MIN_DASH_RANGE
        ? fixedDirection({ x: -towardPlayer.x, y: -towardPlayer.y }, input.pursuitSpeedMetresPerSecond)
        : playerDistance > RAZOR_SCUTTLER_MAX_DASH_RANGE
          ? fixedDirection(towardPlayer, input.pursuitSpeedMetresPerSecond)
          : NO_MOVEMENT;
      const committing = expired
        && playerDistance >= RAZOR_SCUTTLER_MIN_DASH_RANGE
        && playerDistance <= RAZOR_SCUTTLER_MAX_DASH_RANGE;
      return {
        state: committing
          ? {
              phase: "windup",
              phaseRemainingSeconds: RAZOR_SCUTTLER_WINDUP_SECONDS,
              direction: { ...towardPlayer },
              hitPlayer: false,
            }
          : { ...state, phaseRemainingSeconds },
        movement,
        facingDirection: towardPlayer,
        warningFired: committing,
        dashFired: false,
        impact: null,
      };
    }

    case "windup":
      return {
        state: expired
          ? { ...state, phase: "dash", phaseRemainingSeconds: RAZOR_SCUTTLER_DASH_SECONDS }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        facingDirection: null,
        warningFired: false,
        dashFired: expired,
        impact: null,
      };

    case "dash": {
      const travel = input.dashSpeedMetresPerSecond * input.deltaSeconds;
      const desired = {
        x: input.position.x + state.direction.x * travel,
        y: input.position.y + state.direction.y * travel,
      };
      const hitBoundary = desired.x <= input.radiusMetres || desired.x >= input.widthMetres - input.radiusMetres
        || desired.y <= input.radiusMetres || desired.y >= input.heightMetres - input.radiusMetres;
      const hitCover = collidesWithObstacle(desired, input.radiusMetres, input.arena.obstacles);
      if (hitBoundary || hitCover) {
        return {
          state: { ...state, phase: "recovery", phaseRemainingSeconds: 1.4 },
          movement: NO_MOVEMENT,
          facingDirection: null,
          warningFired: false,
          dashFired: false,
          impact: "cover",
        };
      }
      return {
        state: { ...state, phaseRemainingSeconds },
        movement: fixedDirection(state.direction, input.dashSpeedMetresPerSecond),
        facingDirection: null,
        warningFired: false,
        dashFired: false,
        impact: null,
      };
    }

    case "recovery":
      return {
        state: expired
          ? { ...state, phase: "pursuit", phaseRemainingSeconds: 0.55 }
          : { ...state, phaseRemainingSeconds },
        movement: NO_MOVEMENT,
        facingDirection: null,
        warningFired: false,
        dashFired: false,
        impact: null,
      };
  }
}

/**
 * Call with the post-movement position. Only mid-dash resolves here: did this
 * step's movement land on the player, and — if not, and no cover was hit this
 * tick either — has the dash's own timer run out.
 */
export function resolveRazorScuttlerAfterMovement(
  state: RazorScuttlerState,
  position: Vector2Data,
  playerPosition: Vector2Data,
  radiusMetres: number,
  playerRadiusMetres: number,
): { readonly state: RazorScuttlerState; readonly impact: RazorScuttlerImpactReason | null } {
  if (state.phase !== "dash") return { state, impact: null };
  if (!state.hitPlayer && distance(position, playerPosition) <= radiusMetres + playerRadiusMetres + 0.12) {
    return {
      state: { ...state, hitPlayer: true, phase: "recovery", phaseRemainingSeconds: 1 },
      impact: "player",
    };
  }
  if (state.phaseRemainingSeconds <= 0) {
    return {
      state: { ...state, phase: "recovery", phaseRemainingSeconds: RAZOR_SCUTTLER_RECOVERY_SECONDS },
      impact: "miss",
    };
  }
  return { state, impact: null };
}
