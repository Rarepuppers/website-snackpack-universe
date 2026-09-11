import type { DecisionKind } from "../combat/CombatSimulation";

export function decisionPanelHeight(kind: DecisionKind, optionCount: number, shopColumns = 1): number {
  if (kind === "scrap-shop") return Math.max(520, 190 + Math.ceil(optionCount / shopColumns) * 70);
  if (kind === "weapon-placement") return 520;
  if (kind === "level-stat") return Math.max(360, 176 + Math.ceil(optionCount / 2) * 132);
  return 130 + optionCount * 92;
}

export function decisionHintY(kind: DecisionKind, panelHeight: number, titleY: number): number {
  if (kind === "scrap-shop") return titleY + 38;
  if (kind === "weapon-placement") return 225;
  return panelHeight / 2 - 24;
}
