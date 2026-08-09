import { normalizeVector, type Vector2Data } from "../math/Vector2Data";
import { fixedDirection, NO_MOVEMENT, type EnemyMovementIntent } from "./EnemyMovementIntent";

export type BastionEaterPhase = "breach" | "brood" | "last-stand";
export type BastionEaterAction =
  | "entrance" | "stalk" | "claw-windup" | "claw" | "charge-windup" | "charge"
  | "tendril-windup" | "tendril" | "egg-windup" | "eggs"
  | "breach-windup" | "breach" | "recovery";

export interface BastionEaterState {
  readonly phase: BastionEaterPhase;
  readonly action: BastionEaterAction;
  readonly actionRemainingSeconds: number;
  readonly direction: Vector2Data;
  readonly target: Vector2Data;
  readonly attackCount: number;
}

export type BastionEaterWorldAction =
  | { readonly kind: "phase-change"; readonly phase: BastionEaterPhase }
  | { readonly kind: "claw-warning" }
  | { readonly kind: "tendril-warning"; readonly radiusMetres: number }
  | { readonly kind: "breach-warning"; readonly radiusMetres: number }
  | { readonly kind: "claw-strike" }
  | { readonly kind: "charge-start" }
  | { readonly kind: "charge-impact" }
  | { readonly kind: "tendril-strike"; readonly radiusMetres: number }
  | { readonly kind: "lay-eggs"; readonly count: number }
  | { readonly kind: "breach-strike"; readonly radiusMetres: number }
  | null;

export interface BastionEaterStepResult {
  readonly state: BastionEaterState;
  readonly movement: EnemyMovementIntent;
  readonly facingDirection: Vector2Data | null;
  readonly action: BastionEaterWorldAction;
  readonly requestsActionChoice: boolean;
}

export function bastionEaterPhase(health: number, maxHealth: number): BastionEaterPhase {
  const ratio = maxHealth > 0 ? health / maxHealth : 0;
  return ratio <= 0.33 ? "last-stand" : ratio <= 0.66 ? "brood" : "breach";
}

export function bastionEaterChargeDestination(
  state: BastionEaterState,
  position: Vector2Data,
  deltaSeconds: number,
): Vector2Data {
  const speed = state.phase === "last-stand" ? 9.2 : 7.8;
  return {
    x: position.x + state.direction.x * speed * deltaSeconds,
    y: position.y + state.direction.y * speed * deltaSeconds,
  };
}

export function stepBastionEaterBehavior(
  state: BastionEaterState,
  input: {
    readonly deltaSeconds: number;
    readonly health: number;
    readonly maxHealth: number;
    readonly position: Vector2Data;
    readonly playerPosition: Vector2Data;
    readonly baseMovementSpeedMetresPerSecond: number;
    readonly chargeBlocked: boolean;
  },
): BastionEaterStepResult {
  const phase = bastionEaterPhase(input.health, input.maxHealth);
  if (phase !== state.phase) {
    return {
      state: { ...state, phase, action: "entrance", actionRemainingSeconds: 0.8 },
      movement: NO_MOVEMENT,
      facingDirection: null,
      action: { kind: "phase-change", phase },
      requestsActionChoice: false,
    };
  }

  const remaining = state.actionRemainingSeconds - input.deltaSeconds;
  const recoverySeconds = phase === "last-stand" ? 0.55 : phase === "brood" ? 0.78 : 1;
  let next: BastionEaterState = { ...state, actionRemainingSeconds: remaining };
  let movement: EnemyMovementIntent = NO_MOVEMENT;
  let facingDirection: Vector2Data | null = null;
  let action: BastionEaterWorldAction = null;
  let requestsActionChoice = false;

  switch (state.action) {
    case "entrance":
      if (remaining <= 0) {
        next = { ...next, action: "stalk", actionRemainingSeconds: phase === "last-stand" ? 0.38 : 0.65 };
      }
      break;
    case "stalk":
      facingDirection = normalizeVector({
        x: input.playerPosition.x - input.position.x,
        y: input.playerPosition.y - input.position.y,
      });
      movement = fixedDirection(
        facingDirection,
        phase === "last-stand" ? 1.25 : phase === "brood" ? 1.1 : input.baseMovementSpeedMetresPerSecond,
      );
      requestsActionChoice = remaining <= 0;
      break;
    case "claw-windup":
      if (remaining <= 0) {
        next = { ...next, action: "claw", actionRemainingSeconds: 0.28 };
        action = { kind: "claw-strike" };
      }
      break;
    case "charge-windup":
      if (remaining <= 0) {
        next = { ...next, action: "charge", actionRemainingSeconds: 0.85 };
        action = { kind: "charge-start" };
      }
      break;
    case "charge":
      if (input.chargeBlocked) {
        next = { ...next, action: "recovery", actionRemainingSeconds: recoverySeconds };
        action = { kind: "charge-impact" };
      } else {
        movement = fixedDirection(state.direction, phase === "last-stand" ? 9.2 : 7.8);
        if (remaining <= 0) next = { ...next, action: "recovery", actionRemainingSeconds: recoverySeconds };
      }
      break;
    case "tendril-windup":
      if (remaining <= 0) {
        const radiusMetres = phase === "last-stand" ? 5.6 : 5;
        next = { ...next, action: "tendril", actionRemainingSeconds: 0.32 };
        action = { kind: "tendril-strike", radiusMetres };
      }
      break;
    case "egg-windup":
      if (remaining <= 0) {
        next = { ...next, action: "eggs", actionRemainingSeconds: 0.35 };
        action = { kind: "lay-eggs", count: phase === "last-stand" ? 1 : 2 };
      }
      break;
    case "breach-windup":
      if (remaining <= 0) {
        next = { ...next, action: "breach", actionRemainingSeconds: 0.3 };
        action = { kind: "breach-strike", radiusMetres: 2.15 };
      }
      break;
    case "claw":
    case "tendril":
    case "eggs":
    case "breach":
      if (remaining <= 0) next = { ...next, action: "recovery", actionRemainingSeconds: recoverySeconds };
      break;
    case "recovery":
      if (remaining <= 0) {
        next = { ...next, action: "stalk", actionRemainingSeconds: phase === "last-stand" ? 0.32 : 0.58 };
      }
      break;
  }

  return { state: next, movement, facingDirection, action, requestsActionChoice };
}

/** Called after the final stalk movement so the locked attack vector retains its authored tick order. */
export function resolveBastionEaterActionChoice(
  state: BastionEaterState,
  position: Vector2Data,
  playerPosition: Vector2Data,
): { readonly state: BastionEaterState; readonly action: BastionEaterWorldAction } {
  const attackCount = state.attackCount + 1;
  let nextAction: BastionEaterAction;
  if (state.phase === "breach") {
    nextAction = attackCount % 2 === 0 ? "charge-windup" : "claw-windup";
  } else if (state.phase === "brood") {
    const cycle = attackCount % 3;
    nextAction = cycle === 0 ? "egg-windup" : cycle === 1 ? "tendril-windup" : "charge-windup";
  } else {
    const cycle = attackCount % 4;
    nextAction = cycle === 0
      ? "breach-windup"
      : cycle === 1 ? "claw-windup" : cycle === 2 ? "tendril-windup" : "charge-windup";
  }
  const direction = normalizeVector({ x: playerPosition.x - position.x, y: playerPosition.y - position.y });
  const target = { ...playerPosition };
  const next: BastionEaterState = {
    ...state,
    action: nextAction,
    actionRemainingSeconds: state.phase === "last-stand" ? 0.5 : 0.72,
    direction,
    target,
    attackCount,
  };
  if (nextAction === "claw-windup") return { state: next, action: { kind: "claw-warning" } };
  if (nextAction === "tendril-windup") {
    return { state: next, action: { kind: "tendril-warning", radiusMetres: state.phase === "last-stand" ? 5.6 : 5 } };
  }
  if (nextAction === "breach-windup") return { state: next, action: { kind: "breach-warning", radiusMetres: 2.15 } };
  return { state: next, action: null };
}
