import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import {
  RAZOR_SCUTTLER_DASH_SECONDS,
  RAZOR_SCUTTLER_MAX_DASH_RANGE,
  RAZOR_SCUTTLER_MIN_DASH_RANGE,
  RAZOR_SCUTTLER_RECOVERY_SECONDS,
  RAZOR_SCUTTLER_WINDUP_SECONDS,
  resolveRazorScuttlerAfterMovement,
  stepRazorScuttlerBehavior,
  type RazorScuttlerState,
} from "./RazorScuttlerBehavior";

const OPEN_ARENA: ArenaDefinition = {
  id: "test-arena",
  widthMetres: 30,
  heightMetres: 16.875,
  tileSizeMetres: 1,
  obstacles: [],
};

/** Well clear of every wall, so only the case under test can trip a boundary. */
const INTERIOR = { x: 10, y: 8 };

function pursuitState(): RazorScuttlerState {
  return { phase: "pursuit", phaseRemainingSeconds: 1, direction: { x: 1, y: 0 }, hitPlayer: false };
}

function baseInput(overrides: Partial<Parameters<typeof stepRazorScuttlerBehavior>[1]> = {}) {
  return {
    deltaSeconds: 0.05,
    position: { ...INTERIOR },
    playerPosition: { x: INTERIOR.x + 5, y: INTERIOR.y },
    pursuitSpeedMetresPerSecond: 1.4,
    dashSpeedMetresPerSecond: 9.5,
    radiusMetres: 0.4,
    playerRadiusMetres: 0.55,
    widthMetres: 30,
    heightMetres: 16.875,
    arena: OPEN_ARENA,
    ...overrides,
  };
}

describe("stepRazorScuttlerBehavior — pursuit", () => {
  it("closes distance when beyond the max dash range", () => {
    const result = stepRazorScuttlerBehavior(pursuitState(), baseInput({ playerPosition: { x: INTERIOR.x + 10, y: INTERIOR.y } }));
    expect(result.movement).toEqual({ kind: "fixed", direction: { x: 1, y: 0 }, speedMetresPerSecond: 1.4 });
  });

  it("retreats when closer than the min dash range", () => {
    const result = stepRazorScuttlerBehavior(pursuitState(), baseInput({ playerPosition: { x: INTERIOR.x + 1, y: INTERIOR.y } }));
    expect(result.movement.kind).toBe("fixed");
    if (result.movement.kind === "fixed") {
      expect(result.movement.direction.x).toBeCloseTo(-1, 10);
      expect(result.movement.direction.y).toBeCloseTo(0, 10);
      expect(result.movement.speedMetresPerSecond).toBe(1.4);
    }
  });

  it("holds still inside the engagement band", () => {
    const midBand = (RAZOR_SCUTTLER_MIN_DASH_RANGE + RAZOR_SCUTTLER_MAX_DASH_RANGE) / 2;
    const result = stepRazorScuttlerBehavior(pursuitState(), baseInput({ playerPosition: { x: INTERIOR.x + midBand, y: INTERIOR.y } }));
    expect(result.movement).toEqual({ kind: "none" });
  });

  it("commits to windup only once the timer expires inside the band", () => {
    const midBand = (RAZOR_SCUTTLER_MIN_DASH_RANGE + RAZOR_SCUTTLER_MAX_DASH_RANGE) / 2;
    const bandPlayer = { x: INTERIOR.x + midBand, y: INTERIOR.y };
    const notYet = stepRazorScuttlerBehavior(
      { ...pursuitState(), phaseRemainingSeconds: 1 },
      baseInput({ playerPosition: bandPlayer }),
    );
    expect(notYet.state.phase).toBe("pursuit");
    expect(notYet.warningFired).toBe(false);

    const committing = stepRazorScuttlerBehavior(
      { ...pursuitState(), phaseRemainingSeconds: 0.01 },
      baseInput({ playerPosition: bandPlayer, deltaSeconds: 0.05 }),
    );
    expect(committing.state.phase).toBe("windup");
    expect(committing.state.phaseRemainingSeconds).toBe(RAZOR_SCUTTLER_WINDUP_SECONDS);
    expect(committing.warningFired).toBe(true);
    expect(committing.state).toMatchObject({ hitPlayer: false });
  });

  it("does not commit when the expired timer lands outside the band", () => {
    const result = stepRazorScuttlerBehavior(
      { ...pursuitState(), phaseRemainingSeconds: 0.01 },
      baseInput({ playerPosition: { x: INTERIOR.x + 1, y: INTERIOR.y }, deltaSeconds: 0.05 }),
    );
    expect(result.state.phase).toBe("pursuit");
    expect(result.warningFired).toBe(false);
  });
});

describe("stepRazorScuttlerBehavior — windup and dash entry", () => {
  it("does not move during windup and fires the dash event on expiry", () => {
    const windupState: RazorScuttlerState = {
      phase: "windup", phaseRemainingSeconds: 0.01, direction: { x: 1, y: 0 }, hitPlayer: false,
    };
    const result = stepRazorScuttlerBehavior(windupState, baseInput());
    expect(result.movement).toEqual({ kind: "none" });
    expect(result.state.phase).toBe("dash");
    expect(result.state.phaseRemainingSeconds).toBe(RAZOR_SCUTTLER_DASH_SECONDS);
    expect(result.dashFired).toBe(true);
  });

  it("keeps waiting mid-windup", () => {
    const windupState: RazorScuttlerState = {
      phase: "windup", phaseRemainingSeconds: 1, direction: { x: 1, y: 0 }, hitPlayer: false,
    };
    const result = stepRazorScuttlerBehavior(windupState, baseInput());
    expect(result.state.phase).toBe("windup");
    expect(result.dashFired).toBe(false);
  });
});

describe("stepRazorScuttlerBehavior — dash", () => {
  function dashState(overrides: Partial<RazorScuttlerState> = {}): RazorScuttlerState {
    return { phase: "dash", phaseRemainingSeconds: 0.3, direction: { x: 1, y: 0 }, hitPlayer: false, ...overrides };
  }

  it("moves forward when the desired position is clear", () => {
    const result = stepRazorScuttlerBehavior(dashState(), baseInput());
    expect(result.movement).toEqual({ kind: "fixed", direction: { x: 1, y: 0 }, speedMetresPerSecond: 9.5 });
    expect(result.impact).toBeNull();
    expect(result.state.phase).toBe("dash");
  });

  it("stops and enters cover recovery instead of moving into an obstacle", () => {
    const arena: ArenaDefinition = {
      ...OPEN_ARENA,
      // Sits directly ahead of INTERIOR on the +x heading used by dashState().
      obstacles: [{ id: "wall", kind: "cargo-crate", x: INTERIOR.x + 0.3, y: INTERIOR.y - 1, width: 1, height: 2 }],
    };
    const result = stepRazorScuttlerBehavior(dashState(), baseInput({ arena }));
    expect(result.movement).toEqual({ kind: "none" });
    expect(result.impact).toBe("cover");
    expect(result.state).toMatchObject({ phase: "recovery", phaseRemainingSeconds: 1.4 });
  });

  it("stops and enters cover recovery at the arena boundary", () => {
    const result = stepRazorScuttlerBehavior(
      dashState({ direction: { x: -1, y: 0 } }),
      baseInput({ position: { x: 0.41, y: INTERIOR.y }, radiusMetres: 0.4 }),
    );
    expect(result.impact).toBe("cover");
    expect(result.state.phase).toBe("recovery");
  });

  it("resolveRazorScuttlerAfterMovement is a no-op outside the dash phase", () => {
    const state = pursuitState();
    const resolved = resolveRazorScuttlerAfterMovement(state, INTERIOR, INTERIOR, 0.4, 0.55);
    expect(resolved.impact).toBeNull();
    expect(resolved.state).toBe(state);
  });

  it("resolves a player hit from the post-movement position, once per dash", () => {
    const resolved = resolveRazorScuttlerAfterMovement(
      dashState({ phaseRemainingSeconds: 0.2 }),
      { x: INTERIOR.x + 0.9, y: INTERIOR.y },
      { x: INTERIOR.x + 1, y: INTERIOR.y },
      0.4,
      0.55,
    );
    expect(resolved.impact).toBe("player");
    expect(resolved.state).toMatchObject({ phase: "recovery", phaseRemainingSeconds: 1, hitPlayer: true });
  });

  it("does not re-fire a hit once hitPlayer is already set", () => {
    const resolved = resolveRazorScuttlerAfterMovement(
      dashState({ hitPlayer: true, phaseRemainingSeconds: 0.2 }),
      { x: INTERIOR.x + 0.9, y: INTERIOR.y },
      { x: INTERIOR.x + 1, y: INTERIOR.y },
      0.4,
      0.55,
    );
    expect(resolved.impact).toBeNull();
    expect(resolved.state.phase).toBe("dash");
  });

  it("times out into a miss when the dash duration expires without a hit", () => {
    const resolved = resolveRazorScuttlerAfterMovement(
      dashState({ phaseRemainingSeconds: 0 }),
      INTERIOR,
      { x: 200, y: 200 },
      0.4,
      0.55,
    );
    expect(resolved.impact).toBe("miss");
    expect(resolved.state).toMatchObject({ phase: "recovery", phaseRemainingSeconds: RAZOR_SCUTTLER_RECOVERY_SECONDS });
  });

  it("keeps dashing when neither hit nor timed out", () => {
    const resolved = resolveRazorScuttlerAfterMovement(
      dashState({ phaseRemainingSeconds: 0.2 }),
      INTERIOR,
      { x: 200, y: 200 },
      0.4,
      0.55,
    );
    expect(resolved.impact).toBeNull();
    expect(resolved.state.phase).toBe("dash");
  });
});

describe("stepRazorScuttlerBehavior — recovery", () => {
  it("returns to pursuit once recovery expires", () => {
    const recoveringState: RazorScuttlerState = {
      phase: "recovery", phaseRemainingSeconds: 0.01, direction: { x: 1, y: 0 }, hitPlayer: true,
    };
    const result = stepRazorScuttlerBehavior(recoveringState, baseInput());
    expect(result.state.phase).toBe("pursuit");
    expect(result.state.phaseRemainingSeconds).toBe(0.55);
    expect(result.movement).toEqual({ kind: "none" });
  });

  it("stays in recovery while the timer has not expired", () => {
    const recoveringState: RazorScuttlerState = {
      phase: "recovery", phaseRemainingSeconds: 1, direction: { x: 1, y: 0 }, hitPlayer: true,
    };
    const result = stepRazorScuttlerBehavior(recoveringState, baseInput());
    expect(result.state.phase).toBe("recovery");
  });
});
