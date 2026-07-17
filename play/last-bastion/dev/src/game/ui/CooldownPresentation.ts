import type { EquippedWeaponSnapshot } from "../combat/CombatSimulation";

export const PASSIVE_CADENCE_THRESHOLD_SECONDS = 1.5;

export function cooldownRemainingFraction(remainingSeconds: number, durationSeconds: number): number {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) return 0;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  return Math.min(remainingSeconds / durationSeconds, 1);
}

export function formatCooldownSeconds(remainingSeconds: number): string {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) return "";
  return remainingSeconds >= 10
    ? String(Math.ceil(remainingSeconds))
    : remainingSeconds.toFixed(1);
}

export function cadenceWeapons(
  weapons: readonly Readonly<EquippedWeaponSnapshot>[],
): readonly Readonly<EquippedWeaponSnapshot>[] {
  return weapons.filter((weapon) => (
    weapon.stats.fireIntervalSeconds >= PASSIVE_CADENCE_THRESHOLD_SECONDS
  ));
}

export function weaponTileAbbreviation(weaponId: string): string {
  switch (weaponId) {
    case "patrol-blade": return "PB";
    case "bolt-carbine": return "BC";
    case "grenade-tube": return "GT";
    case "guard-drone": return "GD";
    default: return weaponId.slice(0, 2).toUpperCase();
  }
}
