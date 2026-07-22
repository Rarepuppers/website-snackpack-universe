import type { GameProgress } from "../save/LocalSaveStore";
import type { RunSummary } from "../run/RunSummary";

export const ACHIEVEMENT_IDS = [
  "first-drop", "first-victory", "wave-ten", "expedition-victory", "hundred-kills", "thousand-kills",
] as const;
export type AchievementId = typeof ACHIEVEMENT_IDS[number];

export interface AchievementUnlockEvent {
  readonly type: "achievement-unlocked";
  readonly id: AchievementId;
}

export function achievementUnlockEvents(
  before: GameProgress,
  after: GameProgress,
  summary: RunSummary | null,
): readonly AchievementUnlockEvent[] {
  return ACHIEVEMENT_IDS.filter((id) => !isAchievementEarned(id, before, null) && isAchievementEarned(id, after, summary))
    .map((id) => ({ type: "achievement-unlocked" as const, id }));
}

export function isAchievementEarned(id: AchievementId, progress: GameProgress, summary: RunSummary | null): boolean {
  switch (id) {
    case "first-drop": return progress.runsFinished >= 1;
    case "first-victory": return progress.victories >= 1;
    case "wave-ten": return progress.bestWaveReached >= 10;
    case "expedition-victory": return Boolean(summary?.mode === "expedition" && summary.outcome === "victory");
    case "hundred-kills": return progress.totalKills >= 100;
    case "thousand-kills": return progress.totalKills >= 1_000;
  }
}
