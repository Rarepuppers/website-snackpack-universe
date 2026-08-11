import { describe, expect, it } from "vitest";
import {
  CHOIR_FLOOD_SAFE_RADIUS_METRES,
  createChoirBossState,
  stepChoirBoss,
} from "./ChoirBoss";

const point = { x: 10, y: 10 };

describe("ChoirBoss", () => {
  it("collapses one voice before merging the survivors at half health", () => {
    const collapsed = stepChoirBoss({ state: createChoirBossState(), deltaSeconds: 0, health: 74, maxHealth: 100, ownerPosition: point, playerPosition: point });
    expect(collapsed.voiceCollapsed).toBe(true);
    expect(collapsed.state.voicesActive).toBe(2);
    const merged = stepChoirBoss({ state: collapsed.state, deltaSeconds: 0, health: 50, maxHealth: 100, ownerPosition: point, playerPosition: point });
    expect(merged.merged).toBe(true);
    expect(merged.state).toMatchObject({ phase: "merged", voicesActive: 1, attackPhase: "warning" });
  });

  it("telegraphs before pulsing and accelerates as voices collapse", () => {
    const base = { ...createChoirBossState(), phaseRemainingSeconds: 0 };
    const warning = stepChoirBoss({ state: base, deltaSeconds: 0, health: 70, maxHealth: 100, ownerPosition: point, playerPosition: point });
    expect(warning.warning).toBe(true);
    const pulse = stepChoirBoss({ state: { ...warning.state, phaseRemainingSeconds: 0 }, deltaSeconds: 0, health: 70, maxHealth: 100, ownerPosition: point, playerPosition: point });
    expect(pulse.pulse).toBe(true);
    expect(pulse.pulseHitPlayer).toBe(true);
    expect(pulse.state.phaseRemainingSeconds).toBeLessThan(2.5);
  });

  it("damages only players outside the merged safe radius on a flood tick", () => {
    const state = { ...createChoirBossState(), phase: "merged" as const, voicesActive: 1 as const, floodTickRemainingSeconds: 0 };
    const outside = stepChoirBoss({ state, deltaSeconds: 0, health: 40, maxHealth: 100, ownerPosition: point, playerPosition: { x: point.x + CHOIR_FLOOD_SAFE_RADIUS_METRES + 1, y: point.y } });
    const inside = stepChoirBoss({ state, deltaSeconds: 0, health: 40, maxHealth: 100, ownerPosition: point, playerPosition: point });
    expect(outside.floodHitPlayer).toBe(true);
    expect(inside.floodHitPlayer).toBe(false);
  });
});
