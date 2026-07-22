import { describe, expect, it } from "vitest";
import {
  ABOMINATION_ATTACK_COOLDOWN_SECONDS,
  ABOMINATION_RECOVERY_SECONDS,
  ABOMINATION_SLAM_IMPACT_SECONDS,
  ABOMINATION_SLAM_RANGE_METRES,
  ABOMINATION_SLAM_WINDUP_SECONDS,
  createAbominationBehavior,
  stepAbominationBehavior,
} from "./AbominationBehavior";

describe("Abomination behavior gate", () => {
  it("shambles outside range and locks the target on windup entry", () => {
    const initial = createAbominationBehavior();
    expect(stepAbominationBehavior(initial, 1 / 60, ABOMINATION_SLAM_RANGE_METRES + 0.1, { x: 4, y: 5 }))
      .toMatchObject({ state: { phase: "shamble", lockedTarget: null }, movementScale: 1 });
    const windup = stepAbominationBehavior(initial, 1 / 60, ABOMINATION_SLAM_RANGE_METRES, { x: 4, y: 5 });
    expect(windup).toMatchObject({
      state: { phase: "slam-windup", phaseRemainingSeconds: ABOMINATION_SLAM_WINDUP_SECONDS, lockedTarget: { x: 4, y: 5 } },
      slamTriggered: false,
      movementScale: 0,
    });
  });

  it("triggers exactly one committed impact at the original target", () => {
    let state = stepAbominationBehavior(createAbominationBehavior(), 0, 1, { x: 2, y: 3 }).state;
    const impact = stepAbominationBehavior(state, ABOMINATION_SLAM_WINDUP_SECONDS, 8, { x: 9, y: 9 });
    expect(impact.slamTriggered).toBe(true);
    expect(impact.state).toMatchObject({
      phase: "slam-impact", phaseRemainingSeconds: ABOMINATION_SLAM_IMPACT_SECONDS, lockedTarget: { x: 2, y: 3 },
    });
    state = impact.state;
    expect(stepAbominationBehavior(state, ABOMINATION_SLAM_IMPACT_SECONDS / 2, 1, { x: 9, y: 9 }).slamTriggered).toBe(false);
  });

  it("holds a vulnerable recovery and prevents immediate repeats", () => {
    let state = stepAbominationBehavior(createAbominationBehavior(), 0, 1, { x: 0, y: 0 }).state;
    state = stepAbominationBehavior(state, ABOMINATION_SLAM_WINDUP_SECONDS, 1, { x: 0, y: 0 }).state;
    state = stepAbominationBehavior(state, ABOMINATION_SLAM_IMPACT_SECONDS, 1, { x: 0, y: 0 }).state;
    expect(state).toMatchObject({ phase: "recovery", phaseRemainingSeconds: ABOMINATION_RECOVERY_SECONDS });
    state = stepAbominationBehavior(state, ABOMINATION_RECOVERY_SECONDS, 1, { x: 0, y: 0 }).state;
    expect(state).toMatchObject({ phase: "shamble", attackCooldownSeconds: ABOMINATION_ATTACK_COOLDOWN_SECONDS });
    expect(stepAbominationBehavior(state, ABOMINATION_ATTACK_COOLDOWN_SECONDS / 2, 1, { x: 0, y: 0 }).state.phase)
      .toBe("shamble");
  });
});
