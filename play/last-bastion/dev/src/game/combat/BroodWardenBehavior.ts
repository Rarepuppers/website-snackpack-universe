import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";
import { broodWardenEnrageTier, miniBossRepositionDirection } from "./MiniBossBehaviorShared";
import { SWEEPING_ARC_TELL_SECONDS } from "./TelegraphRules";

export type BroodWardenPhase =
  | "entrance" | "stalk" | "cleave-windup" | "cleave"
  | "acid-windup" | "acid-volley" | "egg-windup" | "egg-lay"
  | "rush-windup" | "swarm-rush" | "recovery";

export interface BroodWardenState {
  readonly phase: BroodWardenPhase;
  readonly phaseRemainingSeconds: number;
  readonly direction: Vector2Data;
  readonly attackCount: number;
  readonly rushUsed: boolean;
}

export type BroodWardenAction =
  | { readonly kind: "cleave"; readonly radiusMetres: number; readonly enrageTier: 0 | 1 | 2 }
  | { readonly kind: "acid-volley"; readonly count: number }
  | { readonly kind: "lay-eggs"; readonly count: number }
  | { readonly kind: "swarm-rush"; readonly count: number }
  | null;

export interface BroodWardenStepResult {
  readonly state: BroodWardenState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data;
  readonly action: BroodWardenAction;
}

export function stepBroodWardenBehavior(
  state: BroodWardenState,
  input: {
    readonly deltaSeconds: number;
    readonly enemyId: number;
    readonly health: number;
    readonly maxHealth: number;
    readonly position: Vector2Data;
    readonly playerPosition: Vector2Data;
  },
): BroodWardenStepResult {
  const remaining = state.phaseRemainingSeconds - input.deltaSeconds;
  const tier = broodWardenEnrageTier(input.health, input.maxHealth);
  const facingDirection = normalizeVector({
    x: input.playerPosition.x - input.position.x,
    y: input.playerPosition.y - input.position.y,
  });
  let next: BroodWardenState = { ...state, phaseRemainingSeconds: remaining };
  let movement: EnemyMovementIntent = NO_MOVEMENT;
  let action: BroodWardenAction = null;
  const recoverySeconds = [1.05, 0.82, 0.62][tier]!;

  switch (state.phase) {
    case "entrance":
      if (remaining <= 0) next = { ...next, phase: "stalk", phaseRemainingSeconds: 0.8 };
      break;
    case "stalk": {
      movement = fixedDirection(
        miniBossRepositionDirection(
          input.position,
          input.playerPosition,
          2.6,
          (input.enemyId + state.attackCount) % 2 === 0 ? 1 : -1,
        ),
        [1.55, 1.82, 2.08][tier]!,
      );
      if (remaining > 0) break;
      const attackCount = state.attackCount + 1;
      next = { ...next, attackCount };
      if (tier >= 1 && !state.rushUsed) {
        next = {
          ...next,
          phase: "rush-windup",
          phaseRemainingSeconds: tier === 2 ? 0.4 : 0.55,
          direction: { ...facingDirection },
        };
      } else if (distance(input.position, input.playerPosition) <= 2.8 && attackCount % 3 === 1) {
        next = {
          ...next,
          phase: "cleave-windup",
          phaseRemainingSeconds: SWEEPING_ARC_TELL_SECONDS,
          direction: { ...facingDirection },
        };
      } else if (attackCount % 3 === 2) {
        next = { ...next, phase: "acid-windup", phaseRemainingSeconds: [0.7, 0.58, 0.46][tier]! };
      } else {
        next = { ...next, phase: "egg-windup", phaseRemainingSeconds: [0.72, 0.58, 0.45][tier]! };
      }
      break;
    }
    case "cleave-windup":
      if (remaining <= 0) {
        const radiusMetres = [2.5, 2.75, 3][tier]!;
        next = { ...next, phase: "cleave", phaseRemainingSeconds: 0.25 };
        action = { kind: "cleave", radiusMetres, enrageTier: tier };
      }
      break;
    case "acid-windup":
      if (remaining <= 0) {
        next = { ...next, phase: "acid-volley", phaseRemainingSeconds: 0.3 };
        action = { kind: "acid-volley", count: [3, 4, 5][tier]! };
      }
      break;
    case "egg-windup":
      if (remaining <= 0) {
        next = { ...next, phase: "egg-lay", phaseRemainingSeconds: 0.32 };
        action = { kind: "lay-eggs", count: [2, 2, 3][tier]! };
      }
      break;
    case "rush-windup":
      if (remaining <= 0) {
        next = {
          ...next,
          phase: "swarm-rush",
          phaseRemainingSeconds: tier === 2 ? 0.75 : 0.65,
          rushUsed: true,
        };
        action = { kind: "swarm-rush", count: tier === 2 ? 6 : 4 };
      }
      break;
    case "swarm-rush":
      movement = fixedDirection(state.direction, tier === 2 ? 7.8 : 6.8);
      if (remaining <= 0) next = { ...next, phase: "recovery", phaseRemainingSeconds: recoverySeconds };
      break;
    case "cleave":
    case "acid-volley":
    case "egg-lay":
      if (remaining <= 0) next = { ...next, phase: "recovery", phaseRemainingSeconds: recoverySeconds };
      break;
    case "recovery":
      if (remaining <= 0) {
        next = { ...next, phase: "stalk", phaseRemainingSeconds: [0.9, 0.72, 0.55][tier]! };
      }
      break;
  }
  return { state: next, movement, facingDirection, action };
}
