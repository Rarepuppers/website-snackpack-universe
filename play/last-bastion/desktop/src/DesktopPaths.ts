import { resolve } from "node:path";

export interface DesktopWebRootInput {
  configuredRoot?: string;
  isPackaged: boolean;
  appPath: string;
  resourcesPath: string;
}

export function desktopWebRoot(input: DesktopWebRootInput): string {
  if (input.configuredRoot) return resolve(input.configuredRoot);
  return input.isPackaged
    ? resolve(input.resourcesPath, "game")
    : resolve(input.appPath, "..");
}
