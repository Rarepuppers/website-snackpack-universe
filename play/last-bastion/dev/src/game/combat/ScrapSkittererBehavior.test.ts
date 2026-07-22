import { describe, expect, it } from "vitest";
import {
  SCRAP_SKITTERER_BRAKE_SECONDS,
  SCRAP_SKITTERER_COOLDOWN_SECONDS,
  SCRAP_SKITTERER_RUSH_SECONDS,
  SCRAP_SKITTERER_WINDUP_SECONDS,
  createScrapSkittererBehavior,
  createScrapSkittererWreck,
  brakeScrapSkitterer,
  stepScrapSkittererBehavior,
  stepScrapSkittererWreck,
} from "./ScrapSkittererBehavior";

describe("Scrap Skitterer behavior gate", () => {
  it("announces its rush and locks the direction before acceleration", () => {
    let state = createScrapSkittererBehavior();
    state = stepScrapSkittererBehavior(state, 0.6, { x: 0, y: 0 }, { x: 5, y: 0 }).state;
    expect(state).toMatchObject({
      phase: "rush-windup",
      phaseRemainingSeconds: SCRAP_SKITTERER_WINDUP_SECONDS,
      lockedDirection: { x: 1, y: 0 },
    });
    const rush = stepScrapSkittererBehavior(state, SCRAP_SKITTERER_WINDUP_SECONDS, { x: 0, y: 0 }, { x: 0, y: 5 });
    expect(rush).toMatchObject({
      state: { phase: "rush", phaseRemainingSeconds: SCRAP_SKITTERER_RUSH_SECONDS },
      movementDirection: { x: 1, y: 0 },
      rushStarted: true,
    });
  });

  it("never retargets during rush and must brake before another approach", () => {
    let state = createScrapSkittererBehavior();
    state = stepScrapSkittererBehavior(state, 0.6, { x: 0, y: 0 }, { x: 5, y: 0 }).state;
    state = stepScrapSkittererBehavior(state, SCRAP_SKITTERER_WINDUP_SECONDS, { x: 0, y: 0 }, { x: 5, y: 0 }).state;
    const rushing = stepScrapSkittererBehavior(state, 0.2, { x: 1, y: 0 }, { x: -4, y: 0 });
    expect(rushing.movementDirection).toEqual({ x: 1, y: 0 });
    const braking = stepScrapSkittererBehavior(rushing.state, SCRAP_SKITTERER_RUSH_SECONDS, { x: 4, y: 0 }, { x: -4, y: 0 });
    expect(braking).toMatchObject({ state: { phase: "brake", phaseRemainingSeconds: SCRAP_SKITTERER_BRAKE_SECONDS }, movementSpeedMetresPerSecond: 0 });
    const approach = stepScrapSkittererBehavior(braking.state, SCRAP_SKITTERER_BRAKE_SECONDS, { x: 4, y: 0 }, { x: -4, y: 0 });
    expect(approach.state).toMatchObject({ phase: "approach", cooldownSeconds: SCRAP_SKITTERER_COOLDOWN_SECONDS });
  });

  it("leaves a short visible wreck that can never damage the player", () => {
    const wreck = createScrapSkittererWreck({ x: 2, y: 3 });
    expect(wreck).toMatchObject({ damagesPlayer: false, remainingSeconds: 1.8 });
    expect(stepScrapSkittererWreck(wreck, 1)?.damagesPlayer).toBe(false);
    expect(stepScrapSkittererWreck(wreck, 1.8)).toBeNull();
  });

  it("supports immediate hard braking on player or cover impact", () => {
    const rushing = {
      ...createScrapSkittererBehavior(),
      phase: "rush" as const,
      lockedDirection: { x: 1, y: 0 },
    };
    expect(brakeScrapSkitterer(rushing)).toMatchObject({
      phase: "brake",
      phaseRemainingSeconds: SCRAP_SKITTERER_BRAKE_SECONDS,
      lockedDirection: { x: 1, y: 0 },
    });
  });
});
