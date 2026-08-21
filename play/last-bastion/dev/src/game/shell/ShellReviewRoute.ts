import type { ShellScreen } from "./ScreenFlow";

export const REVIEW_SHELL_SCREENS: readonly ShellScreen[] = Object.freeze([
  "title",
  "menu",
  "how-to-play",
  "settings",
  "controls",
  "lab",
  "records",
  "armory",
  "character-select",
  "threat-select",
]);

export function requestedShellScreen(search: string): ShellScreen {
  const requested = new URLSearchParams(search).get("flow");
  return REVIEW_SHELL_SCREENS.includes(requested as ShellScreen) ? requested as ShellScreen : "title";
}
