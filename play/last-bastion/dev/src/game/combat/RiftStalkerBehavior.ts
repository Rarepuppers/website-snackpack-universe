import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import { miniBossRepositionDirection, riftStalkerFrenzyTier } from "./MiniBossBehaviorShared";
import { SWEEPING_ARC_TELL_SECONDS } from "./TelegraphRules";

export const RIFT_STALKER_SLASH_REACH_METRES = 2.3;
export const RIFT_STALKER_WARP_SECONDS = 0.35;

export type RiftStalkerPhase =
  | "entrance" | "cloak" | "mark" | "warp" | "pounce"
  | "slash-windup" | "slash" | "recovery";

export interface RiftStalkerState {
  readonly phase: RiftStalkerPhase;
  readonly phaseRemainingSeconds: number;
  readonly direction: Vector2Data;
  readonly markTarget: Vector2Data;
  readonly chainedThisCycle: boolean;
}

export type RiftStalkerAction =
  | { readonly kind: "mark" }
  | { readonly kind: "warp-out" }
  | { readonly kind: "pounce"; readonly frenzyTier: 0 | 1 | 2 }
  | { readonly kind: "slash"; readonly frenzyTier: 0 | 1 | 2 }
  | null;

export interface RiftStalkerStepResult {
  readonly state: RiftStalkerState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  readonly action: RiftStalkerAction;
}

export function stepRiftStalkerBehavior(
  state: RiftStalkerState,
  input: {
    readonly deltaSeconds: number;
    readonly enemyId: number;
    readonly health: number;
    readonly maxHealth: number;
    readonly position: Vector2Data;
    readonly playerPosition: Vector2Data;
  },
): RiftStalkerStepResult {
  const remaining = state.phaseRemainingSeconds - input.deltaSeconds;
  const tier = riftStalkerFrenzyTier(input.health, input.maxHealth);
  const facingDirection = state.phase === "warp" ? null : normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });
  let next: RiftStalkerState = { ...state, phaseRemainingSeconds: remaining };
  let movement: EnemyMovementIntent = NO_MOVEMENT;
  let action: RiftStalkerAction = null;

  switch (state.phase) {
    case "entrance":
      if (remaining <= 0) {
        next = { ...next, phase: "cloak", phaseRemainingSeconds: [1.5, 1.2, 0.9][tier]! };
      }
      break;
    case "cloak":
      movement = fixedDirection(
        miniBossRepositionDirection(
          input.position,
          input.playerPosition,
          3.8,
          (input.enemyId + (state.chainedThisCycle ? 1 : 0)) % 2 === 0 ? 1 : -1,
        ),
        [2.1, 2.45, 2.8][tier]!,
      );
      if (remaining <= 0) {
        next = {
          ...next,
          phase: "mark",
          phaseRemainingSeconds: [0.85, 0.72, 0.55][tier]!,
          markTarget: { ...input.playerPosition },
        };
        action = { kind: "mark" };
      }
      break;
    case "mark":
      if (remaining <= 0) {
        next = { ...next, phase: "warp", phaseRemainingSeconds: RIFT_STALKER_WARP_SECONDS };
        action = { kind: "warp-out" };
      }
      break;
    case "warp":
      if (remaining <= 0) {
        next = { ...next, phase: "pounce", phaseRemainingSeconds: 0.28 };
        action = { kind: "pounce", frenzyTier: tier };
      }
      break;
    case "pounce":
      if (remaining <= 0) {
        if (tier === 2 && !state.chainedThisCycle) {
          next = {
            ...next,
            phase: "mark",
            phaseRemainingSeconds: 0.5,
            markTarget: { ...input.playerPosition },
            chainedThisCycle: true,
          };
          action = { kind: "mark" };
        } else if (distance(input.position, input.playerPosition) <= RIFT_STALKER_SLASH_REACH_METRES) {
          next = {
            ...next,
            phase: "slash-windup",
            phaseRemainingSeconds: SWEEPING_ARC_TELL_SECONDS,
            direction: { ...(facingDirection ?? state.direction) },
          };
        } else {
          next = { ...next, phase: "recovery", phaseRemainingSeconds: [1.15, 0.95, 0.7][tier]! };
        }
      }
      break;
    case "slash-windup":
      if (remaining <= 0) {
        next = { ...next, phase: "slash", phaseRemainingSeconds: 0.25 };
        action = { kind: "slash", frenzyTier: tier };
      }
      break;
    case "slash":
      if (remaining <= 0) {
        next = { ...next, phase: "recovery", phaseRemainingSeconds: [1.15, 0.95, 0.7][tier]! };
      }
      break;
    case "recovery":
      next = { ...next, chainedThisCycle: false };
      if (remaining <= 0) {
        next = { ...next, phase: "cloak", phaseRemainingSeconds: [1.5, 1.2, 0.9][tier]! };
      }
      break;
  }
  return { state: next, movement, facingDirection, action };
}
