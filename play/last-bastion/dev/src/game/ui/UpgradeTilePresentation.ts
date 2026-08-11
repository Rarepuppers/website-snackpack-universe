import type { UpgradeId } from "../content/upgradeCatalog";

export interface UpgradeTilePresentation {
  readonly texture: "elemental-upgrade-tiles-v1";
  readonly frame: number;
}

const ELEMENTAL_UPGRADE_FRAMES: Readonly<Partial<Record<UpgradeId, number>>> = Object.freeze({
  "incendiary-rounds": 0,
  "cryo-coating": 1,
  "chain-lightning": 2,
  "corrosive-rounds": 3,
});

/** Resolves both level-up ids and `shop-upgrade:<id>` offer ids. */
export function upgradeTilePresentation(optionId: string): UpgradeTilePresentation | null {
  const upgradeId = optionId.startsWith("shop-upgrade:")
    ? optionId.slice("shop-upgrade:".length)
    : optionId;
  const frame = ELEMENTAL_UPGRADE_FRAMES[upgradeId as UpgradeId];
  return frame === undefined ? null : { texture: "elemental-upgrade-tiles-v1", frame };
}
