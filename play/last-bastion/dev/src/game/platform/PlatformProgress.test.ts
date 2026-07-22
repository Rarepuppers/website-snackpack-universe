import { describe, expect, it } from "vitest";
import { createRunSummary } from "../run/RunSummary";
import { DEFAULT_SAVE } from "../save/LocalSaveStore";
import { achievementUnlockEvents } from "./PlatformProgress";

describe("platform achievement events", () => {
  it("emits only newly crossed canonical milestones", () => {
    const before = { ...DEFAULT_SAVE.progress, runsFinished: 0, victories: 0, totalKills: 99 };
    const after = { ...before, runsFinished: 1, victories: 1, totalKills: 100 };
    expect(achievementUnlockEvents(before, after, null).map((event) => event.id))
      .toEqual(["first-drop", "first-victory", "hundred-kills"]);
    expect(achievementUnlockEvents(after, after, null)).toEqual([]);
  });

  it("keeps expedition victory distinct from ordinary victory", () => {
    const progress = { ...DEFAULT_SAVE.progress, runsFinished: 1, victories: 1 };
    const summary = createRunSummary({
      mode: "expedition", outcome: "victory", heroId: "marine", perkId: null,
      waveReached: 10, nodesCleared: 6, kills: 100, scrapEarned: 20, scrapBanked: 20,
      level: 5, damageByWeapon: {}, weapons: [], upgrades: [],
    });
    const firstEvents = achievementUnlockEvents(DEFAULT_SAVE.progress, progress, summary);
    expect(firstEvents.map((event) => event.id)).toContain("expedition-victory");
    expect(achievementUnlockEvents(
      DEFAULT_SAVE.progress,
      progress,
      summary,
      firstEvents.map((event) => event.id),
    )).toEqual([]);
  });
});
