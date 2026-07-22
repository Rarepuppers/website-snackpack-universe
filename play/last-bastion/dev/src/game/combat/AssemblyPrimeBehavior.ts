import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import {
  FOUNDRY_DRONE_LIFETIME_SECONDS,
  FOUNDRY_FABRICATION_CHARGES,
  FOUNDRY_PAD_HEALTH,
  FOUNDRY_TURRET_LIFETIME_SECONDS,
  tryReserveFoundryChild,
  type FoundryChildPayload,
  type FoundryChildReservation,
  type FoundryChildType,
} from "./FoundryFabricatorLifecycle";

export const ASSEMBLY_PRIME_ENTRANCE_SECONDS = 1;
export const ASSEMBLY_PRIME_SETUP_SECONDS = 0.75;
export const ASSEMBLY_PRIME_PAD_HEALTH = FOUNDRY_PAD_HEALTH + 4;
export const ASSEMBLY_PRIME_RECALL_CHARGES = 1;
export const ASSEMBLY_PRIME_LANE_COUNT = 3;

export type AssemblyPrimeMove = "rotating-lanes" | "fabrication" | "drone-recall";
export type AssemblyPrimePhase = "entrance" | "setup" | "windup" | "action" | "recovery";

export interface AssemblyPrimeChild {
  readonly id: number;
  readonly ownerId: number;
  readonly type: FoundryChildType;
  readonly position: Vector2Data;
  readonly remainingSeconds: number;
  readonly dead: boolean;
}

export interface AssemblyPrimeLane {
  readonly origin: Vector2Data;
  readonly direction: Vector2Data;
}

export interface AssemblyPrimeContext {
  readonly ownerId: number;
  readonly ownerPosition: Vector2Data;
  readonly playerPosition: Vector2Data;
  readonly ownerHealth: number;
  readonly ownerMaxHealth: number;
  readonly liveUnits: number;
  readonly reservedLiveSlots: number;
  readonly liveCap: number;
  readonly remainingThreat: number;
  readonly children: readonly AssemblyPrimeChild[];
  readonly ownerWasDamaged: boolean;
}

export interface AssemblyPrimeState {
  readonly phase: AssemblyPrimePhase;
  readonly phaseRemainingSeconds: number;
  readonly move: AssemblyPrimeMove | null;
  readonly previousMove: AssemblyPrimeMove | null;
  readonly attackIndex: number;
  readonly seedOffset: number;
  readonly fabricationChargesRemaining: number;
  readonly recallChargesRemaining: number;
  readonly pendingReservation: FoundryChildReservation | null;
  readonly fabricationTarget: Vector2Data | null;
  readonly padHealth: number;
  readonly lockedLanes: readonly AssemblyPrimeLane[];
  readonly recallTargetId: number | null;
}

export interface AssemblyPrimeStepResult {
  readonly state: AssemblyPrimeState;
  readonly moveStarted: AssemblyPrimeMove | null;
  readonly actionStarted: AssemblyPrimeMove | null;
  readonly moveResolved: AssemblyPrimeMove | null;
  readonly spawnedChild: FoundryChildPayload | null;
  readonly releasedReservation: FoundryChildReservation | null;
  readonly recalledChildId: number | null;
  readonly interrupted: boolean;
}

const MOVE_ORDER: readonly AssemblyPrimeMove[] = Object.freeze([
  "rotating-lanes",
  "fabrication",
  "drone-recall",
]);

export function createAssemblyPrimeBehavior(seed: number): AssemblyPrimeState {
  return {
    phase: "entrance",
    phaseRemainingSeconds: ASSEMBLY_PRIME_ENTRANCE_SECONDS,
    move: null,
    previousMove: null,
    attackIndex: 0,
    seedOffset: Math.abs(Math.floor(seed)) % MOVE_ORDER.length,
    fabricationChargesRemaining: FOUNDRY_FABRICATION_CHARGES,
    recallChargesRemaining: ASSEMBLY_PRIME_RECALL_CHARGES,
    pendingReservation: null,
    fabricationTarget: null,
    padHealth: 0,
    lockedLanes: [],
    recallTargetId: null,
  };
}

export function damageAssemblyPrimePad(state: AssemblyPrimeState, damage: number): AssemblyPrimeState {
  if (state.move !== "fabrication" || state.phase !== "windup" || damage <= 0) return state;
  return { ...state, padHealth: Math.max(0, state.padHealth - damage) };
}

export function selectAssemblyPrimeMove(
  state: AssemblyPrimeState,
  context: AssemblyPrimeContext,
): AssemblyPrimeMove | null {
  const start = (state.seedOffset + state.attackIndex) % MOVE_ORDER.length;
  for (let offset = 0; offset < MOVE_ORDER.length; offset += 1) {
    const candidate = MOVE_ORDER[(start + offset) % MOVE_ORDER.length]!;
    if (candidate === state.previousMove || !moveIsAvailable(candidate, state, context)) continue;
    return candidate;
  }
  return null;
}

export function stepAssemblyPrimeBehavior(
  state: AssemblyPrimeState,
  deltaSeconds: number,
  context: AssemblyPrimeContext,
): AssemblyPrimeStepResult {
  if (
    state.phase === "windup"
    && state.move === "fabrication"
    && (context.ownerWasDamaged || state.padHealth <= 0 || !state.pendingReservation)
  ) {
    const releasedReservation = state.pendingReservation;
    return result(enterRecovery(state, context, false), {
      moveResolved: "fabrication",
      releasedReservation,
      interrupted: true,
    });
  }

  const remaining = Math.max(0, state.phaseRemainingSeconds - Math.max(0, deltaSeconds));
  if (remaining > 0) return result({ ...state, phaseRemainingSeconds: remaining });

  switch (state.phase) {
    case "entrance":
      return result({ ...state, phase: "setup", phaseRemainingSeconds: ASSEMBLY_PRIME_SETUP_SECONDS });
    case "setup": {
      const move = selectAssemblyPrimeMove(state, context);
      if (!move) return result({ ...state, phaseRemainingSeconds: ASSEMBLY_PRIME_SETUP_SECONDS });
      return result(beginMove(state, move, context), { moveStarted: move });
    }
    case "windup":
      return beginAction(state, context);
    case "action":
      return result(enterRecovery(state, context, true), { moveResolved: state.move });
    case "recovery":
      return result({
        ...state,
        phase: "setup",
        phaseRemainingSeconds: ASSEMBLY_PRIME_SETUP_SECONDS,
        move: null,
        pendingReservation: null,
        fabricationTarget: null,
        padHealth: 0,
        lockedLanes: [],
        recallTargetId: null,
      });
  }
}

function beginMove(
  state: AssemblyPrimeState,
  move: AssemblyPrimeMove,
  context: AssemblyPrimeContext,
): AssemblyPrimeState {
  const childType = nextChildType(state);
  const reservation = move === "fabrication" ? reserveChild(state, context, childType) : null;
  const recallTarget = move === "drone-recall" ? selectRecallTarget(context) : null;
  return {
    ...state,
    phase: "windup",
    phaseRemainingSeconds: windupSeconds(move, enrageTier(context)),
    move,
    attackIndex: state.attackIndex + 1,
    pendingReservation: reservation,
    fabricationTarget: move === "fabrication" ? lockedFabricationTarget(state, context) : null,
    padHealth: move === "fabrication" ? ASSEMBLY_PRIME_PAD_HEALTH : 0,
    lockedLanes: move === "rotating-lanes" ? buildLockedLanes(context) : [],
    recallTargetId: recallTarget?.id ?? null,
  };
}

function beginAction(
  state: AssemblyPrimeState,
  context: AssemblyPrimeContext,
): AssemblyPrimeStepResult {
  if (state.move === "fabrication" && state.pendingReservation && state.fabricationTarget) {
    const childType = state.pendingReservation.childType;
    const spawnedChild: FoundryChildPayload = {
      type: childType,
      position: { ...state.fabricationTarget },
      remainingSeconds: childType === "foundry-drone"
        ? FOUNDRY_DRONE_LIFETIME_SECONDS
        : FOUNDRY_TURRET_LIFETIME_SECONDS,
      canFabricate: false,
    };
    return result({
      ...state,
      phase: "action",
      phaseRemainingSeconds: actionSeconds(state.move, enrageTier(context)),
      fabricationChargesRemaining: state.fabricationChargesRemaining - 1,
      pendingReservation: null,
      padHealth: 0,
    }, { actionStarted: state.move, spawnedChild });
  }
  if (state.move === "drone-recall" && state.recallTargetId !== null) {
    return result({
      ...state,
      phase: "action",
      phaseRemainingSeconds: actionSeconds(state.move, enrageTier(context)),
      recallChargesRemaining: state.recallChargesRemaining - 1,
    }, { actionStarted: state.move, recalledChildId: state.recallTargetId });
  }
  return result({
    ...state,
    phase: "action",
    phaseRemainingSeconds: actionSeconds(state.move!, enrageTier(context)),
  }, { actionStarted: state.move });
}

function enterRecovery(
  state: AssemblyPrimeState,
  context: AssemblyPrimeContext,
  completed: boolean,
): AssemblyPrimeState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: recoverySeconds(enrageTier(context)),
    previousMove: state.move,
    pendingReservation: completed ? state.pendingReservation : null,
    fabricationTarget: null,
    padHealth: 0,
    recallTargetId: null,
  };
}

function moveIsAvailable(
  move: AssemblyPrimeMove,
  state: AssemblyPrimeState,
  context: AssemblyPrimeContext,
): boolean {
  if (move === "rotating-lanes") return true;
  if (move === "drone-recall") {
    return state.recallChargesRemaining > 0 && selectRecallTarget(context) !== null;
  }
  return reserveChild(state, context, nextChildType(state)) !== null;
}

function reserveChild(
  state: AssemblyPrimeState,
  context: AssemblyPrimeContext,
  childType: FoundryChildType,
): FoundryChildReservation | null {
  const accepted = tryReserveFoundryChild({
    childType,
    activeChildrenForOwner: activeChildren(context).length,
    ownerChargesRemaining: state.fabricationChargesRemaining,
    liveUnits: context.liveUnits,
    reservedLiveSlots: context.reservedLiveSlots,
    liveCap: context.liveCap,
    remainingThreat: context.remainingThreat,
  });
  return accepted.accepted ? accepted.reservation : null;
}

function selectRecallTarget(context: AssemblyPrimeContext): AssemblyPrimeChild | null {
  return activeChildren(context).filter((child) => child.type === "foundry-drone").sort((left, right) => (
    left.remainingSeconds - right.remainingSeconds || left.id - right.id
  ))[0] ?? null;
}

function activeChildren(context: AssemblyPrimeContext): readonly AssemblyPrimeChild[] {
  return context.children.filter((child) => child.ownerId === context.ownerId && !child.dead);
}

function nextChildType(state: AssemblyPrimeState): FoundryChildType {
  return state.fabricationChargesRemaining % 2 === 1 ? "foundry-drone" : "foundry-turret";
}

function lockedFabricationTarget(state: AssemblyPrimeState, context: AssemblyPrimeContext): Vector2Data {
  const direction = normalizeVector({
    x: context.playerPosition.x - context.ownerPosition.x,
    y: context.playerPosition.y - context.ownerPosition.y,
  });
  const side = (state.seedOffset + state.attackIndex) % 2 === 0 ? 1 : -1;
  return {
    x: context.ownerPosition.x - direction.y * side * 2.6,
    y: context.ownerPosition.y + direction.x * side * 2.6,
  };
}

function buildLockedLanes(context: AssemblyPrimeContext): readonly AssemblyPrimeLane[] {
  const forward = normalizeVector({
    x: context.playerPosition.x - context.ownerPosition.x,
    y: context.playerPosition.y - context.ownerPosition.y,
  });
  const baseAngle = Math.atan2(forward.y, forward.x);
  return [-0.52, 0, 0.52].map((offset) => ({
    origin: { ...context.ownerPosition },
    direction: { x: Math.cos(baseAngle + offset), y: Math.sin(baseAngle + offset) },
  }));
}

function windupSeconds(move: AssemblyPrimeMove, tier: 0 | 1 | 2): number {
  const base = move === "rotating-lanes" ? 1.25 : move === "fabrication" ? 1.6 : 0.9;
  return base * [1, 0.9, 0.76][tier]!;
}

function actionSeconds(move: AssemblyPrimeMove, tier: 0 | 1 | 2): number {
  if (move === "rotating-lanes") return [1.35, 1.18, 1][tier]!;
  return move === "fabrication" ? 0.2 : 0.45;
}

function recoverySeconds(tier: 0 | 1 | 2): number {
  return [1.35, 1.12, 0.9][tier]!;
}

function enrageTier(context: AssemblyPrimeContext): 0 | 1 | 2 {
  const ratio = context.ownerMaxHealth > 0 ? context.ownerHealth / context.ownerMaxHealth : 0;
  return ratio <= 0.2 ? 2 : ratio <= 0.5 ? 1 : 0;
}

function result(
  state: AssemblyPrimeState,
  values: Partial<Omit<AssemblyPrimeStepResult, "state">> = {},
): AssemblyPrimeStepResult {
  return {
    state,
    moveStarted: null,
    actionStarted: null,
    moveResolved: null,
    spawnedChild: null,
    releasedReservation: null,
    recalledChildId: null,
    interrupted: false,
    ...values,
  };
}
