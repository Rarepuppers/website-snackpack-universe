import { describe, expect, it } from "vitest";
import type { EnemySnapshot } from "../combat/CombatSimulation";
import {
  bossHudPresentation,
  statusAbbreviation,
  statusHudTiming,
} from "./CombatReadability";

describe("combat readability presentation", () => {
  it("clamps timed status progress and marks the final three seconds urgent", () => {
    expect(statusHudTiming(7.5, 10)).toEqual({
      fraction: 0.75,
      urgent: false,
      timerLabel: "7.5",
    });
    expect(statusHudTiming(2.95, 10)).toEqual({
      fraction: 0.29500000000000004,
      urgent: true,
      timerLabel: "3.0",
    });
    expect(statusHudTiming(-1, 10)).toEqual({
      fraction: 0,
      urgent: true,
      timerLabel: "0.0",
    });
    expect(statusAbbreviation("uranium-core-rounds")).toBe("U25");
  });

  it("presents readable boss names, phases, health, and critical state", () => {
    const boss = {
      type: "bastion-eater",
      rank: "boss",
      health: 149.2,
      maxHealth: 1000,
      bastionEaterPhase: "last-stand",
    } as EnemySnapshot;
    expect(bossHudPresentation([boss])).toEqual({
      name: "THE BASTION EATER",
      phaseLabel: "LAST STAND  /  FRENZY",
      healthLabel: "150 / 1000",
      healthRatio: 0.1492,
      critical: true,
    });
    expect(bossHudPresentation([])).toBeNull();
  });

  it("names and phases both regional finales", () => {
    expect(bossHudPresentation([{
      type: "the-choir", rank: "boss", health: 900, maxHealth: 1800, choirPhase: "merged",
    } as EnemySnapshot])).toMatchObject({ name: "THE CHOIR", phaseLabel: "MERGED  /  ENRAGED" });
    expect(bossHudPresentation([{
      type: "foundry-sovereign", rank: "boss", health: 2100, maxHealth: 2100, sovereignPhase: "warning",
    } as EnemySnapshot])).toMatchObject({ name: "FOUNDRY SOVEREIGN", phaseLabel: "WARNING" });
  });
});
