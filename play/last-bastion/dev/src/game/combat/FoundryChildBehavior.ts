import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";

export const FOUNDRY_TURRET_RANGE_METRES = 9.5;
export const FOUNDRY_TURRET_WARNING_SECONDS = 0.55;
export const FOUNDRY_TURRET_RECOVERY_SECONDS = 0.5;
export const FOUNDRY_TURRET_COOLDOWN_SECONDS = 1.2;

export type FoundryTurretPhase = "tracking" | "warning" | "recovery";

export interface FoundryChildBehaviorState {
  readonly remainingSeconds: number;
  readonly turretPhase: FoundryTurretPhase;
  readonly turretPhaseRemainingSeconds: number;
  readonly turretTarget: Vector2Data;
  readonly attackCooldownSeconds: number;
}

export interface FoundryChildStepInput {
  readonly deltaSeconds: number;
  readonly ownerAlive: boolean;
  readonly mobile: boolean;
  readonly position: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly movementSpeedMetresPerSecond: number;
}

export interface FoundryChildStepResult {
  readonly state: FoundryChildBehaviorState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly powerDownReason: "expired" | "owner-defeated" | null;
  readonly warningStarted: boolean;
  readonly firesTurret: boolean;
}

export function stepFoundryChildBehavior(
  state: FoundryChildBehaviorState,
  input: FoundryChildStepInput,
): FoundryChildStepResult {
  const remainingSeconds = Math.max(0, state.remainingSeconds - input.deltaSeconds);
  const towardPlayer = normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });
  if (!input.ownerAlive || remainingSeconds <= 0) {
    return result(
      { ...state, remainingSeconds },
      NO_MOVEMENT,
      towardPlayer,
      input.ownerAlive ? "expired" : "owner-defeated",
    );
  }
  if (input.mobile) {
    return result(
      { ...state, remainingSeconds },
      fixedDirection(towardPlayer, input.movementSpeedMetresPerSecond),
      towardPlayer,
      null,
    );
  }
  if (state.turretPhase === "warning") {
    const turretPhaseRemainingSeconds = Math.max(0, state.turretPhaseRemainingSeconds - input.deltaSeconds);
    const facing = normalizeVector({
      x: state.turretTarget.x - input.position.x,
      y: state.turretTarget.y - input.position.y,
    });
    if (turretPhaseRemainingSeconds > 0) {
      return result({ ...state, remainingSeconds, turretPhaseRemainingSeconds }, NO_MOVEMENT, facing, null);
    }
    return {
      ...result({
        ...state,
        remainingSeconds,
        turretPhase: "recovery",
        turretPhaseRemainingSeconds: FOUNDRY_TURRET_RECOVERY_SECONDS,
        attackCooldownSeconds: FOUNDRY_TURRET_COOLDOWN_SECONDS,
      }, NO_MOVEMENT, facing, null),
      firesTurret: true,
    };
  }
  if (state.turretPhase === "recovery") {
    const turretPhaseRemainingSeconds = Math.max(0, state.turretPhaseRemainingSeconds - input.deltaSeconds);
    return result({
      ...state,
      remainingSeconds,
      turretPhase: turretPhaseRemainingSeconds <= 0 ? "tracking" : "recovery",
      turretPhaseRemainingSeconds,
    }, NO_MOVEMENT, towardPlayer, null);
  }
  if (
    state.attackCooldownSeconds <= 0
    && distance(input.position, input.playerPosition) <= FOUNDRY_TURRET_RANGE_METRES
  ) {
    return {
      ...result({
        ...state,
        remainingSeconds,
        turretPhase: "warning",
        turretPhaseRemainingSeconds: FOUNDRY_TURRET_WARNING_SECONDS,
        turretTarget: { ...input.playerPosition },
      }, NO_MOVEMENT, towardPlayer, null),
      warningStarted: true,
    };
  }
  return result({ ...state, remainingSeconds }, NO_MOVEMENT, towardPlayer, null);
}

function result(
  state: FoundryChildBehaviorState,
  movement: EnemyMovementIntent,
  facingDirection: Vector2Data,
  powerDownReason: FoundryChildStepResult["powerDownReason"],
): FoundryChildStepResult {
  return { state, movement, facingDirection, powerDownReason, warningStarted: false, firesTurret: false };
}
