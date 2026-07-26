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

/**
 * Two-letter code on the cooldown tile — the only per-weapon text the HUD has,
 * and the tiebreaker while thirteen weapons share eight placeholder tiles. The
 * default (`weaponId.slice(0, 2)`) collapses every `bastion-*` and `-carbine`
 * family onto the same pair, so every id gets an explicit entry.
 */
export function weaponTileAbbreviation(weaponId: string): string {
  switch (weaponId) {
    case "bastion-service-rifle": return "SR";
    case "scattergun": return "SG";
    case "arc-carbine": return "AC";
    case "patrol-blade": return "PB";
    case "bolt-carbine": return "BC";
    case "bulwark-rotary-cannon": return "RC";
    case "grenade-tube": return "GT";
    case "injector-carbine": return "IC";
    case "railspike": return "RS";
    case "seeker-swarm": return "SS";
    case "cryo-lance": return "CL";
    case "tesla-coil": return "TC";
    case "flamethrower": return "FT";
    case "sawblade": return "SW";
    case "event-horizon": return "EH";
    case "combat-knife": return "CK";
    case "machete": return "MC";
    case "fire-axe": return "FA";
    case "shock-baton": return "SB";
    case "breaching-maul": return "BM";
    case "plasma-saber": return "PS";
    case "guard-drone": return "GD";
    default: return weaponId.slice(0, 2).toUpperCase();
  }
}
