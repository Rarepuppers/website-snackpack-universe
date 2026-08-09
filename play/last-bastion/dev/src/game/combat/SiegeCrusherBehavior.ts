import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import { miniBossRepositionDirection, siegeCrusherEnrageTier } from "./MiniBossBehaviorShared";
import { GROUND_SLAM_RECOVERY_SECONDS, GROUND_SLAM_TELL_SECONDS } from "./TelegraphRules";

export type SiegeCrusherPhase =
  | "entrance" | "stalk" | "charge-windup" | "charge"
  | "sweep-windup" | "sweep" | "slam-windup" | "slam" | "recovery";

export interface SiegeCrusherState {
  readonly phase: SiegeCrusherPhase;
  readonly phaseRemainingSeconds: number;
  readonly direction: Vector2Data;
  readonly attackCount: number;
}

export type SiegeCrusherAction =
  | { readonly kind: "charge-impact" }
  | { readonly kind: "sweep"; readonly radiusMetres: number; readonly enrageTier: 0 | 1 | 2 }
  | { readonly kind: "slam"; readonly radiusMetres: number; readonly enrageTier: 0 | 1 | 2 }
  | null;

export interface SiegeCrusherStepResult {
  readonly state: SiegeCrusherState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  readonly action: SiegeCrusherAction;
}

export function siegeCrusherChargeDestination(
  state: SiegeCrusherState,
  input: {
    readonly deltaSeconds: number;
    readonly health: number;
    readonly maxHealth: number;
    readonly position: Vector2Data;
  },
): Vector2Data {
  const tier = siegeCrusherEnrageTier(input.health, input.maxHealth);
  const travel = [8.8, 9.8, 10.8][tier]! * input.deltaSeconds;
  return {
    x: input.position.x + state.direction.x * travel,
    y: input.position.y + state.direction.y * travel,
  };
}

export function stepSiegeCrusherBehavior(
  state: SiegeCrusherState,
  input: {
    readonly deltaSeconds: number;
    readonly enemyId: number;
    readonly health: number;
    readonly maxHealth: number;
    readonly position: Vector2Data;
    readonly playerPosition: Vector2Data;
    readonly chargeBlocked: boolean;
  },
): SiegeCrusherStepResult {
  const remaining = state.phaseRemainingSeconds - input.deltaSeconds;
  const tier = siegeCrusherEnrageTier(input.health, input.maxHealth);
  const recoverySeconds = [1.05, 0.88, 0.7][tier]!;
  let next: SiegeCrusherState = { ...state, phaseRemainingSeconds: remaining };
  let movement: EnemyMovementIntent = NO_MOVEMENT;
  let facingDirection: Vector2Data | null = null;
  let action: SiegeCrusherAction = null;

  switch (state.phase) {
    case "entrance":
      if (remaining <= 0) next = { ...next, phase: "stalk", phaseRemainingSeconds: 1.1 };
      break;
    case "stalk": {
      facingDirection = normalizeVector({
        x: input.playerPosition.x - input.position.x,
        y: input.playerPosition.y - input.position.y,
      });
      movement = fixedDirection(
        miniBossRepositionDirection(
          input.position,
          input.playerPosition,
          4.8,
          (input.enemyId + state.attackCount) % 2 === 0 ? 1 : -1,
        ),
        [1.4, 1.62, 1.85][tier]!,
      );
      if (remaining > 0) break;
      const attackCount = state.attackCount + 1;
      next = { ...next, attackCount };
      const slamFrequency = tier === 2 ? 2 : 3;
      if (tier >= 1 && attackCount % slamFrequency === 0) {
        next = { ...next, phase: "slam-windup", phaseRemainingSeconds: GROUND_SLAM_TELL_SECONDS };
      } else if (distance(input.position, input.playerPosition) > 3.4) {
        next = {
          ...next,
          phase: "charge-windup",
          phaseRemainingSeconds: [0.65, 0.54, 0.44][tier]!,
          direction: { ...facingDirection },
        };
      } else {
        next = { ...next, phase: "sweep-windup", phaseRemainingSeconds: [0.52, 0.44, 0.36][tier]! };
      }
      break;
    }
    case "charge-windup":
      if (remaining <= 0) next = { ...next, phase: "charge", phaseRemainingSeconds: 0.72 };
      break;
    case "charge":
      if (input.chargeBlocked) {
        next = { ...next, phase: "recovery", phaseRemainingSeconds: recoverySeconds };
        action = { kind: "charge-impact" };
      } else {
        movement = fixedDirection(state.direction, [8.8, 9.8, 10.8][tier]!);
        if (remaining <= 0) next = { ...next, phase: "recovery", phaseRemainingSeconds: recoverySeconds };
      }
      break;
    case "sweep-windup":
      if (remaining <= 0) {
        const radiusMetres = [2.7, 2.9, 3.1][tier]!;
        next = { ...next, phase: "sweep", phaseRemainingSeconds: 0.28 };
        action = { kind: "sweep", radiusMetres, enrageTier: tier };
      }
      break;
    case "sweep":
      if (remaining <= 0) next = { ...next, phase: "recovery", phaseRemainingSeconds: recoverySeconds };
      break;
    case "slam-windup":
      if (remaining <= 0) {
        next = { ...next, phase: "slam", phaseRemainingSeconds: 0.3 };
        action = { kind: "slam", radiusMetres: tier === 2 ? 4 : 3.4, enrageTier: tier };
      }
      break;
    case "slam":
      if (remaining <= 0) {
        next = { ...next, phase: "recovery", phaseRemainingSeconds: GROUND_SLAM_RECOVERY_SECONDS };
      }
      break;
    case "recovery":
      if (remaining <= 0) {
        next = { ...next, phase: "stalk", phaseRemainingSeconds: [0.95, 0.78, 0.62][tier]! };
      }
      break;
  }

  return { state: next, movement, facingDirection, action };
}
