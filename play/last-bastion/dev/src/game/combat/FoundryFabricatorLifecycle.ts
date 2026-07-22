import type { Vector2Data } from "../math/Vector2Data";

export const FOUNDRY_FABRICATION_CHARGES = 3;
export const FOUNDRY_MAX_LIVE_CHILDREN = 2;
export const FOUNDRY_CHANNEL_SECONDS = 1.6;
export const FOUNDRY_RECOVERY_SECONDS = 1.4;
export const FOUNDRY_PAD_HEALTH = 6;
export const FOUNDRY_DRONE_LIFETIME_SECONDS = 12;
export const FOUNDRY_TURRET_LIFETIME_SECONDS = 16;

export type FoundryChildType = "foundry-drone" | "foundry-turret";
export type FoundryPhase = "positioning" | "channel" | "recovery";

export const FOUNDRY_CHILD_THREAT: Readonly<Record<FoundryChildType, number>> = Object.freeze({
  "foundry-drone": 2,
  "foundry-turret": 3,
});

export interface FoundryReservationContext {
  readonly childType: FoundryChildType;
  readonly activeChildrenForOwner: number;
  readonly ownerChargesRemaining: number;
  readonly liveUnits: number;
  readonly reservedLiveSlots: number;
  readonly liveCap: number;
  readonly remainingThreat: number;
}

export interface FoundryChildReservation {
  readonly childType: FoundryChildType;
  readonly reservedThreat: number;
  readonly reservedLiveSlots: 1;
}

export type FoundryReservationResult =
  | { readonly accepted: true; readonly reservation: FoundryChildReservation }
  | { readonly accepted: false; readonly reason: "charges" | "owner-child-cap" | "live-cap" | "threat-budget" };

export interface FoundryFabricatorState {
  readonly phase: FoundryPhase;
  readonly phaseRemainingSeconds: number;
  readonly chargesRemaining: number;
  readonly target: Vector2Data | null;
  readonly padHealth: number;
  readonly pendingReservation: FoundryChildReservation | null;
}

export interface FoundryChildPayload {
  readonly type: FoundryChildType;
  readonly position: Vector2Data;
  readonly remainingSeconds: number;
  readonly canFabricate: false;
}

export interface FoundryStepResult {
  readonly state: FoundryFabricatorState;
  readonly spawnedChild: FoundryChildPayload | null;
  readonly releasedReservation: FoundryChildReservation | null;
  readonly interrupted: boolean;
}

export function createFoundryFabricatorBehavior(): FoundryFabricatorState {
  return {
    phase: "positioning",
    phaseRemainingSeconds: 0,
    chargesRemaining: FOUNDRY_FABRICATION_CHARGES,
    target: null,
    padHealth: 0,
    pendingReservation: null,
  };
}

export function tryReserveFoundryChild(context: FoundryReservationContext): FoundryReservationResult {
  if (context.ownerChargesRemaining <= 0) return { accepted: false, reason: "charges" };
  if (context.activeChildrenForOwner >= FOUNDRY_MAX_LIVE_CHILDREN) {
    return { accepted: false, reason: "owner-child-cap" };
  }
  if (context.liveUnits + context.reservedLiveSlots + 1 > context.liveCap) {
    return { accepted: false, reason: "live-cap" };
  }
  const reservedThreat = FOUNDRY_CHILD_THREAT[context.childType];
  if (context.remainingThreat < reservedThreat) return { accepted: false, reason: "threat-budget" };
  return {
    accepted: true,
    reservation: { childType: context.childType, reservedThreat, reservedLiveSlots: 1 },
  };
}

export function beginFoundryFabrication(
  state: FoundryFabricatorState,
  target: Readonly<Vector2Data>,
  reservation: FoundryChildReservation,
): FoundryFabricatorState {
  if (state.phase !== "positioning" || state.chargesRemaining <= 0) return state;
  return {
    ...state,
    phase: "channel",
    phaseRemainingSeconds: FOUNDRY_CHANNEL_SECONDS,
    target: { ...target },
    padHealth: FOUNDRY_PAD_HEALTH,
    pendingReservation: reservation,
  };
}

export function damageFoundryPad(
  state: FoundryFabricatorState,
  damage: number,
): FoundryFabricatorState {
  if (state.phase !== "channel" || damage <= 0) return state;
  return { ...state, padHealth: Math.max(0, state.padHealth - damage) };
}

export function stepFoundryFabrication(
  state: FoundryFabricatorState,
  deltaSeconds: number,
  ownerWasDamaged: boolean,
): FoundryStepResult {
  const delta = Math.max(0, deltaSeconds);
  if (state.phase === "positioning") return idleResult(state);
  if (state.phase === "channel") {
    if (ownerWasDamaged || state.padHealth <= 0 || !state.pendingReservation || !state.target) {
      return {
        state: enterRecovery(state, false),
        spawnedChild: null,
        releasedReservation: state.pendingReservation,
        interrupted: true,
      };
    }
    const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - delta);
    if (phaseRemainingSeconds > 0) return idleResult({ ...state, phaseRemainingSeconds });
    const reservation = state.pendingReservation;
    return {
      state: enterRecovery(state, true),
      spawnedChild: {
        type: reservation.childType,
        position: { ...state.target },
        remainingSeconds: reservation.childType === "foundry-drone"
          ? FOUNDRY_DRONE_LIFETIME_SECONDS
          : FOUNDRY_TURRET_LIFETIME_SECONDS,
        canFabricate: false,
      },
      releasedReservation: null,
      interrupted: false,
    };
  }
  const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - delta);
  if (phaseRemainingSeconds > 0) return idleResult({ ...state, phaseRemainingSeconds });
  return idleResult({
    ...state,
    phase: "positioning",
    phaseRemainingSeconds: 0,
    target: null,
    padHealth: 0,
    pendingReservation: null,
  });
}

export function powerDownFoundryChildren(
  ownerId: number,
  children: readonly ({ readonly id: number; readonly ownerId: number } & FoundryChildPayload)[],
): readonly number[] {
  return children.filter((child) => child.ownerId === ownerId).map((child) => child.id);
}

function enterRecovery(state: FoundryFabricatorState, consumeCharge: boolean): FoundryFabricatorState {
  return {
    ...state,
    phase: "recovery",
    phaseRemainingSeconds: FOUNDRY_RECOVERY_SECONDS,
    chargesRemaining: Math.max(0, state.chargesRemaining - (consumeCharge ? 1 : 0)),
    target: null,
    padHealth: 0,
    pendingReservation: null,
  };
}

function idleResult(state: FoundryFabricatorState): FoundryStepResult {
  return { state, spawnedChild: null, releasedReservation: null, interrupted: false };
}
