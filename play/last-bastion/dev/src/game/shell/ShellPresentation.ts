import type { KeyboardBindableAction } from "../input/ControlBindings";
import type { GameProgress } from "../save/LocalSaveStore";

/** Shared copy for the native foreground and retained canvas fallback. */
export function controlActionLabel(action: KeyboardBindableAction): string {
  return ({
    moveUp: "MOVE UP", moveDown: "MOVE DOWN", moveLeft: "MOVE LEFT", moveRight: "MOVE RIGHT",
    evade: "ROLL / EVADE", interact: "INTERACT", ultimate: "ULTIMATE", kit: "USE KIT",
    toggleFireMode: "FIRE MODE", pause: "PAUSE",
  })[action];
}

export function careerRecordRows(progress: GameProgress): readonly (readonly [string, string])[] {
  const format = (value: number): string => value.toFixed(1).replace(/\.0$/, "");
  return [
    ["RUNS FINISHED", String(progress.runsFinished)],
    ["VICTORIES", String(progress.victories)],
    ["BEST WAVE / COLUMN", String(progress.bestWaveReached)],
    ["BEST EXPEDITION NODES", String(progress.bestNodesCleared)],
    ["LIFETIME NODES CLEARED", String(progress.nodesCleared)],
    ["ENEMIES DEFEATED", String(progress.totalKills)],
    ["TOTAL DAMAGE", format(progress.totalDamage)],
    ["SCRAP EARNED", format(progress.totalScrapEarned)],
  ];
}
