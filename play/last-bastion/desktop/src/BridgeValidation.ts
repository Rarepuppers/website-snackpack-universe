import type { AchievementId } from "./BridgeContract.js";

const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set([
  "first-drop",
  "first-victory",
  "wave-ten",
  "expedition-victory",
  "hundred-kills",
  "thousand-kills",
]);

export const CLOUD_SAVE_SLOT = "last-bastion-save-v7.json";
export const MAX_CLOUD_SAVE_BYTES = 8 * 1024 * 1024;

export function assertAchievementId(value: unknown): asserts value is AchievementId {
  if (typeof value !== "string" || !ACHIEVEMENT_IDS.has(value)) {
    throw new TypeError("Invalid Last Bastion achievement id");
  }
}

export function assertCloudPath(value: unknown): asserts value is typeof CLOUD_SAVE_SLOT {
  if (value !== CLOUD_SAVE_SLOT) {
    throw new TypeError("Invalid Last Bastion cloud path");
  }
}

export function assertCloudContents(value: unknown): asserts value is string {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") > MAX_CLOUD_SAVE_BYTES) {
    throw new TypeError("Invalid Last Bastion cloud contents");
  }
}
