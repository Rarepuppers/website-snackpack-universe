import type { Vector2Data } from "../math/Vector2Data";

export type AbominationPhase = "shamble" | "slam-windup" | "slam-impact" | "recovery";

export interface AbominationBehaviorState {
  readonly phase: AbominationPhase;
  readonly phaseRemainingSeconds: number;
  readonly attackCooldownSeconds: number;
  readonly lockedTarget: Vector2Data | null;
}

export interface AbominationBehaviorStep {
  readonly state: AbominationBehaviorState;
  readonly slamTriggered: boolean;
  readonly movementScale: number;
}

export const ABOMINATION_SLAM_RANGE_METRES = 2.25;
export const ABOMINATION_SLAM_WINDUP_SECONDS = 0.9;
export const ABOMINATION_SLAM_IMPACT_SECONDS = 0.18;
export const ABOMINATION_RECOVERY_SECONDS = 1.35;
export const ABOMINATION_ATTACK_COOLDOWN_SECONDS = 1.1;

export function createAbominationBehavior(): AbominationBehaviorState {
  return { phase: "shamble", phaseRemainingSeconds: 0, attackCooldownSeconds: 0, lockedTarget: null };
}

/** Pure fixed-step phase rule. Hit geometry remains simulation-owned. */
export function stepAbominationBehavior(
  state: AbominationBehaviorState,
  deltaSeconds: number,
  distanceToPlayer: number,
  playerPosition: Readonly<Vector2Data>,
): AbominationBehaviorStep {
  const delta = Math.max(0, deltaSeconds);
  const cooldown = Math.max(0, state.attackCooldownSeconds - delta);
  if (state.phase === "shamble") {
    if (cooldown <= 0 && distanceToPlayer <= ABOMINATION_SLAM_RANGE_METRES) {
      return {
        state: {
          phase: "slam-windup",
          phaseRemainingSeconds: ABOMINATION_SLAM_WINDUP_SECONDS,
          attackCooldownSeconds: 0,
          lockedTarget: { ...playerPosition },
        },
        slamTriggered: false,
        movementScale: 0,
      };
    }
    return {
      state: { ...state, attackCooldownSeconds: cooldown, lockedTarget: null },
      slamTriggered: false,
      movementScale: 1,
    };
  }

  const remaining = state.phaseRemainingSeconds - delta;
  if (remaining > 0) {
    return { state: { ...state, phaseRemainingSeconds: remaining }, slamTriggered: false, movementScale: 0 };
  }
  if (state.phase === "slam-windup") {
    return {
      state: { ...state, phase: "slam-impact", phaseRemainingSeconds: ABOMINATION_SLAM_IMPACT_SECONDS },
      slamTriggered: true,
      movementScale: 0,
    };
  }
  if (state.phase === "slam-impact") {
    return {
      state: { ...state, phase: "recovery", phaseRemainingSeconds: ABOMINATION_RECOVERY_SECONDS },
      slamTriggered: false,
      movementScale: 0,
    };
  }
  return {
    state: {
      phase: "shamble",
      phaseRemainingSeconds: 0,
      attackCooldownSeconds: ABOMINATION_ATTACK_COOLDOWN_SECONDS,
      lockedTarget: null,
    },
    slamTriggered: false,
    movementScale: 1,
  };
}
