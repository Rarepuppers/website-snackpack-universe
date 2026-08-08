import { normalizeVector, type Vector2Data } from "../math/Vector2Data";

export const INFECTED_SURVIVOR_MAX_STAMINA_SECONDS = 1.2;
export const INFECTED_SURVIVOR_SPRINT_SPEED = 5.15;
export const INFECTED_SURVIVOR_ACCELERATION = 11;
export const INFECTED_SURVIVOR_DECELERATION = 14;
export const INFECTED_SURVIVOR_RECOVERY_SECONDS = 0.68;
export const INFECTED_SURVIVOR_STAMINA_RECOVERY_PER_SECOND = 1.8;

export type InfectedSurvivorPhase = "hesitate" | "sprint" | "recover";

export interface InfectedSurvivorState {
  readonly phase: InfectedSurvivorPhase;
  readonly phaseRemainingSeconds: number;
  readonly staminaSeconds: number;
  readonly velocity: Vector2Data;
}

export interface InfectedSurvivorStepInput {
  readonly deltaSeconds: number;
  readonly towardPlayer: Vector2Data;
  readonly separation: Vector2Data;
  readonly laneBias: number;
}

export interface InfectedSurvivorStepResult {
  readonly state: InfectedSurvivorState;
  readonly facingDirection: Vector2Data;
  readonly movementSpeedMetresPerSecond: number;
  readonly rushStarted: boolean;
}

/** Accelerates toward a target velocity without frame-rate-dependent overshoot. */
export function approachVelocity(
  current: Vector2Data,
  target: Vector2Data,
  maximumDelta: number,
): Vector2Data {
  const delta = { x: target.x - current.x, y: target.y - current.y };
  const magnitude = Math.hypot(delta.x, delta.y);
  if (magnitude <= Math.max(0, maximumDelta) || magnitude === 0) return { ...target };
  const scale = Math.max(0, maximumDelta) / magnitude;
  return { x: current.x + delta.x * scale, y: current.y + delta.y * scale };
}

/**
 * Pack steering with a guaranteed pursuit component. Separation opens gaps,
 * while the forward floor prevents an evenly spaced crowd ring from forming.
 */
export function infectedSurvivorSteeringDirection(
  towardPlayer: Vector2Data,
  separation: Vector2Data,
  laneBias: number,
): Vector2Data {
  const forward = normalizeVector(towardPlayer);
  if (forward.x === 0 && forward.y === 0) return { x: 0, y: 0 };
  const tangent = { x: -forward.y, y: forward.x };
  const candidate = normalizeVector({
    x: forward.x + separation.x * 0.72 + tangent.x * laneBias,
    y: forward.y + separation.y * 0.72 + tangent.y * laneBias,
  });
  const dot = candidate.x * forward.x + candidate.y * forward.y;
  const forwardFloor = 0.55;
  if (dot >= forwardFloor) return candidate;
  const lateral = {
    x: candidate.x - forward.x * dot,
    y: candidate.y - forward.y * dot,
  };
  const lateralDirection = normalizeVector(lateral);
  const lateralMagnitude = Math.sqrt(1 - forwardFloor * forwardFloor);
  return {
    x: forward.x * forwardFloor + lateralDirection.x * lateralMagnitude,
    y: forward.y * forwardFloor + lateralDirection.y * lateralMagnitude,
  };
}

/**
 * Advances the survivor's stamina/phase machine and returns a movement intent.
 * Collision and position resolution stay in `CombatSimulation` so extracting
 * the behaviour cannot change the deterministic simulation contract.
 */
export function stepInfectedSurvivorBehavior(
  state: InfectedSurvivorState,
  input: InfectedSurvivorStepInput,
): InfectedSurvivorStepResult {
  const deltaSeconds = input.deltaSeconds;
  const towardPlayer = normalizeVector(input.towardPlayer);
  const sprintDirection = infectedSurvivorSteeringDirection(
    towardPlayer,
    input.separation,
    input.laneBias,
  );
  let phase = state.phase;
  let phaseRemainingSeconds = state.phaseRemainingSeconds - deltaSeconds;
  let staminaSeconds = state.staminaSeconds;
  let velocity = state.velocity;
  let rushStarted = false;

  if (phase === "sprint") {
    staminaSeconds = Math.max(0, staminaSeconds - deltaSeconds);
    velocity = approachVelocity(
      velocity,
      {
        x: sprintDirection.x * INFECTED_SURVIVOR_SPRINT_SPEED,
        y: sprintDirection.y * INFECTED_SURVIVOR_SPRINT_SPEED,
      },
      INFECTED_SURVIVOR_ACCELERATION * deltaSeconds,
    );
    if (staminaSeconds <= 0) {
      phase = "recover";
      phaseRemainingSeconds = INFECTED_SURVIVOR_RECOVERY_SECONDS;
    }
  } else {
    staminaSeconds = Math.min(
      INFECTED_SURVIVOR_MAX_STAMINA_SECONDS,
      staminaSeconds + INFECTED_SURVIVOR_STAMINA_RECOVERY_PER_SECOND * deltaSeconds,
    );
    velocity = approachVelocity(
      velocity,
      { x: 0, y: 0 },
      INFECTED_SURVIVOR_DECELERATION * deltaSeconds,
    );
    if (phaseRemainingSeconds <= 0 && staminaSeconds >= 0.55) {
      phase = "sprint";
      phaseRemainingSeconds = staminaSeconds;
      rushStarted = true;
    }
  }

  const movementSpeedMetresPerSecond = Math.hypot(velocity.x, velocity.y);
  return {
    state: { phase, phaseRemainingSeconds, staminaSeconds, velocity },
    facingDirection: movementSpeedMetresPerSecond > 0.08
      ? normalizeVector(velocity)
      : towardPlayer,
    movementSpeedMetresPerSecond,
    rushStarted,
  };
}
