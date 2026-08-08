import { describe, expect, it } from "vitest";
import {
  TETHER_BLOOM_BREAK_DAMAGE,
  TETHER_BLOOM_DURATION_SECONDS,
  TETHER_BLOOM_RECOVERY_SECONDS,
  TETHER_BLOOM_WINDUP_SECONDS,
  applyTetherBloomDamage,
  stepTetherBloomBehavior,
  type TetherBloomState,
  type TetherBloomStepInput,
} from "./TetherBloomBehavior";

describe("TetherBloomBehavior", () => {
  it("claims the shared tether and locks a target when acquisition becomes valid", () => {
    const result = stepTetherBloomBehavior(
      state({ phaseRemainingSeconds: 0.05 }),
      input({ deltaSeconds: 0.05, playerPosition: { x: 7, y: 4 } }),
    );

    expect(result.state).toMatchObject({
      phase: "windup",
      phaseRemainingSeconds: TETHER_BLOOM_WINDUP_SECONDS,
      target: { x: 7, y: 4 },
    });
    expect(result.event).toBe("windup");
    expect(result.claimTether).toBe(true);
  });

  it("cannot acquire while another enemy owns the shared tether", () => {
    const result = stepTetherBloomBehavior(
      state({ phaseRemainingSeconds: 0 }),
      input({ tetherAvailable: false }),
    );

    expect(result.state.phase).toBe("idle");
    expect(result.claimTether).toBe(false);
    expect(result.event).toBeNull();
  });

  it("latches after the warning and resets accumulated break damage", () => {
    const result = stepTetherBloomBehavior(
      state({
        phase: "windup",
        phaseRemainingSeconds: 0.05,
        damageDuringGrab: 4,
      }),
      input({ deltaSeconds: 0.05, ownsTether: true }),
    );

    expect(result.state).toMatchObject({
      phase: "tethering",
      phaseRemainingSeconds: TETHER_BLOOM_DURATION_SECONDS,
      damageDuringGrab: 0,
    });
    expect(result.event).toBe("latched");
  });

  it("breaks immediately when the hero evades or leaves the hard range", () => {
    const evasive = stepTetherBloomBehavior(
      state({ phase: "windup" }),
      input({ ownsTether: true, heroEvading: true }),
    );
    const range = stepTetherBloomBehavior(
      state({ phase: "tethering" }),
      input({ ownsTether: true, playerDistanceMetres: 5.01 }),
    );

    expect(evasive).toMatchObject({
      state: { phase: "recovery", phaseRemainingSeconds: TETHER_BLOOM_RECOVERY_SECONDS },
      event: "broken-evasive",
      releaseTether: true,
    });
    expect(range).toMatchObject({
      state: { phase: "recovery", phaseRemainingSeconds: TETHER_BLOOM_RECOVERY_SECONDS },
      event: "broken-range",
      releaseTether: true,
    });
  });

  it("falls back silently when its shared ownership has already been displaced", () => {
    const result = stepTetherBloomBehavior(
      state({ phase: "tethering" }),
      input({ ownsTether: false }),
    );

    expect(result.state.phase).toBe("recovery");
    expect(result.event).toBe("ownership-lost");
    expect(result.releaseTether).toBe(false);
  });

  it("preserves the final pull before releasing an expired tether", () => {
    const result = stepTetherBloomBehavior(
      state({ phase: "tethering", phaseRemainingSeconds: 0.05 }),
      input({
        deltaSeconds: 0.05,
        ownsTether: true,
        playerDistanceMetres: 3,
        minimumPullDistanceMetres: 1.2,
      }),
    );

    expect(result.pullDistanceMetres).toBeGreaterThan(0);
    expect(result.event).toBe("released");
    expect(result.releaseTether).toBe(true);
    expect(result.state.phase).toBe("recovery");
  });

  it("accumulates mitigated damage and breaks exactly at the authored threshold", () => {
    const tethering = state({ phase: "tethering", damageDuringGrab: 0 });
    const below = applyTetherBloomDamage(tethering, TETHER_BLOOM_BREAK_DAMAGE - 0.01, true);
    const broken = applyTetherBloomDamage(
      below.state,
      0.01,
      true,
    );

    expect(below.event).toBeNull();
    expect(broken).toMatchObject({
      state: { phase: "recovery", damageDuringGrab: TETHER_BLOOM_BREAK_DAMAGE },
      event: "broken-damage",
      releaseTether: true,
    });
  });
});

function state(overrides: Partial<TetherBloomState> = {}): TetherBloomState {
  return {
    phase: "idle",
    phaseRemainingSeconds: 0.5,
    target: { x: 0, y: 0 },
    damageDuringGrab: 0,
    ...overrides,
  };
}

function input(overrides: Partial<TetherBloomStepInput> = {}): TetherBloomStepInput {
  return {
    deltaSeconds: 0.05,
    playerPosition: { x: 3, y: 0 },
    playerDistanceMetres: 3,
    hasClearPath: true,
    heroEvading: false,
    tetherAvailable: true,
    ownsTether: false,
    minimumPullDistanceMetres: 1.2,
    ...overrides,
  };
}
