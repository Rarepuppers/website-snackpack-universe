export type AchievementId =
  | "first-drop"
  | "first-victory"
  | "wave-ten"
  | "expedition-victory"
  | "hundred-kills"
  | "thousand-kills";

/** Kept structurally identical to the renderer's existing SteamworksBridge. */
export interface SteamworksBridge {
  getControllerType?(): string | null | Promise<string | null>;
  getAchievement(id: AchievementId): boolean | Promise<boolean>;
  setAchievement(id: AchievementId): void | Promise<void>;
  storeStats(): void | Promise<void>;
  readCloudFile(path: string): string | null | Promise<string | null>;
  writeCloudFile(path: string, contents: string): void | Promise<void>;
}

/** Synchronous by design: LocalSaveStore's public contract is synchronous. */
export interface DesktopSaveBridge {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DesktopDisplayInfo {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
}

export interface DesktopDisplayRequest {
  fullscreenMode: "windowed" | "borderless";
  selectedDisplayId: string | null;
}

export interface DesktopDisplaySnapshot extends DesktopDisplayRequest {
  displays: readonly DesktopDisplayInfo[];
}

export interface DesktopDisplayBridge {
  getSnapshot(): Promise<DesktopDisplaySnapshot>;
  apply(request: DesktopDisplayRequest): Promise<DesktopDisplaySnapshot>;
}

export const STEAMWORKS_CHANNELS = Object.freeze({
  /** Host-only handshake; not exposed on SteamworksBridge. */
  isAvailable: "steamworks:is-available",
  getControllerType: "steamworks:get-controller-type",
  getAchievement: "steamworks:get-achievement",
  setAchievement: "steamworks:set-achievement",
  storeStats: "steamworks:store-stats",
  readCloudFile: "steamworks:read-cloud-file",
  writeCloudFile: "steamworks:write-cloud-file",
});

export const DESKTOP_SAVE_CHANNELS = Object.freeze({
  getItem: "desktop-save:get-item",
  setItem: "desktop-save:set-item",
});

export const DESKTOP_DISPLAY_CHANNELS = Object.freeze({
  getSnapshot: "desktop-display:get-snapshot",
  apply: "desktop-display:apply",
});
