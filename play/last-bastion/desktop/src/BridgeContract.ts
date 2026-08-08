export type AchievementId =
  | "first-drop"
  | "first-victory"
  | "wave-ten"
  | "expedition-victory"
  | "hundred-kills"
  | "thousand-kills";

/** Kept structurally identical to the renderer's existing SteamworksBridge. */
export interface SteamworksBridge {
  getAchievement(id: AchievementId): boolean | Promise<boolean>;
  setAchievement(id: AchievementId): void | Promise<void>;
  storeStats(): void | Promise<void>;
  readCloudFile(path: string): string | null | Promise<string | null>;
  writeCloudFile(path: string, contents: string): void | Promise<void>;
}

export const STEAMWORKS_CHANNELS = Object.freeze({
  getAchievement: "steamworks:get-achievement",
  setAchievement: "steamworks:set-achievement",
  storeStats: "steamworks:store-stats",
  readCloudFile: "steamworks:read-cloud-file",
  writeCloudFile: "steamworks:write-cloud-file",
});
