import type { CombatSnapshot, EquippedWeaponSnapshot } from "../combat/CombatSimulation";
import { WEAPON_CATALOG, type WeaponAttackPattern, type WeaponId } from "../content/weaponCatalog";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";

export interface WeaponBuildView { instanceId: number; weaponId: WeaponId; name: string; tier: number; weaponClass: string; attackPattern: WeaponAttackPattern; damageType: string; effectiveDamage: number; cadenceSeconds: number; estimatedDps: number; dpsLabel: "estimated"; reachMetres: number; projectileCount: number; critExpectation: number; statusRole: string; }
export interface BuildViewModel { hero: { id: string; name: string }; perkId: string | null; rack: readonly (WeaponBuildView | null)[]; stash: readonly (WeaponBuildView | null)[]; rawStats: PlayerStatBlock; effectiveStats: PlayerStatBlock; cappedStats: readonly string[]; upgrades: readonly { id: string; level: number; used: number; capacity: number }[]; relicIds: readonly string[]; artifactId: string | null; transformation: CombatSnapshot["transformation"]; activeBuffs: CombatSnapshot["activeBuffs"]; synergyTags: readonly string[]; }
export interface ShopPreview { scrapBefore: number; scrapAfter: number; playerHealthBefore: number; playerHealthAfter: number; playerShieldBefore: number; playerShieldAfter: number; statDelta: Partial<Record<keyof PlayerStatBlock, number>>; capLoss: readonly string[]; duplicateCount: number; cumulativeItemCount: number; helpsCurrentBuild: readonly string[]; irreversibleWarning: string | null; }

function effectiveWeaponDamage(weapon: EquippedWeaponSnapshot, stats: PlayerStatBlock): number {
  const ranged = weapon.stats.attackPattern !== "melee-sweep" && weapon.stats.attackPattern !== "orbit-blade";
  const elemental = weapon.stats.damageType !== "physical";
  const percent = stats.damagePercent + (ranged ? stats.rangedDamagePercent : stats.meleeDamagePercent) + (elemental ? stats.elementalDamagePercent : 0);
  return weapon.stats.projectileDamage * Math.max(0.1, 1 + percent / 100);
}

function weaponView(weapon: EquippedWeaponSnapshot, tier: number, snapshot: CombatSnapshot): WeaponBuildView {
  const stats = snapshot.playerStats.effective;
  const effectiveDamage = effectiveWeaponDamage(weapon, stats);
  const perSecond = weapon.stats.attackPattern === "beam" || weapon.stats.attackPattern === "orbit-blade"
    ? weapon.stats.beamDamagePerSecond * Math.max(0.1, 1 + stats.damagePercent / 100)
    : effectiveDamage * Math.max(1, weapon.stats.projectileCount) / Math.max(0.01, weapon.stats.fireIntervalSeconds);
  return { instanceId: weapon.instanceId, weaponId: weapon.weaponId, name: weapon.stats.displayName, tier, weaponClass: weapon.stats.weaponClass, attackPattern: weapon.stats.attackPattern, damageType: weapon.stats.damageType, effectiveDamage, cadenceSeconds: weapon.stats.fireIntervalSeconds, estimatedDps: perSecond, dpsLabel: "estimated", reachMetres: weapon.stats.rangeMetres, projectileCount: weapon.stats.projectileCount, critExpectation: stats.critChancePercent * stats.critMultiplier / 100, statusRole: weapon.stats.damageType === "physical" ? "impact" : `${weapon.stats.damageType} status` };
}

export function createBuildViewModel(snapshot: CombatSnapshot): BuildViewModel {
  const allTiles = [...snapshot.weaponInventory.rack.map((slot) => slot.tile), ...snapshot.weaponInventory.stash].filter((tile): tile is NonNullable<typeof tile> => tile !== null);
  const tierFor = (instanceId: number) => allTiles.find((tile) => tile.instanceId === instanceId)?.tier ?? 1;
  const byId = new Map(snapshot.equippedWeapons.map((weapon) => [weapon.instanceId, weapon]));
  const tileView = (tile: NonNullable<typeof allTiles[number]>) => { const weapon = byId.get(tile.instanceId); return weapon ? weaponView(weapon, tile.tier, snapshot) : null; };
  const tags = new Set<string>();
  for (const weapon of snapshot.equippedWeapons) {
    if (weapon.stats.damageType !== "physical") tags.add(`${weapon.stats.damageType} status pressure`);
    if (weapon.stats.attackPattern === "melee-sweep" || weapon.stats.attackPattern === "orbit-blade") tags.add("close-range coverage");
    if (weapon.stats.attackPattern === "beam") tags.add("sustained beam coverage");
  }
  if (snapshot.playerStats.effective.lifestealPercent > 0) tags.add("lifesteal sustain");
  if (snapshot.playerStats.effective.harvestingPercent > 0) tags.add("harvesting economy");
  return {
    hero: { id: snapshot.heroId, name: snapshot.heroPresentation.displayName }, perkId: snapshot.activePerkId,
    rack: snapshot.weaponInventory.rack.map((slot) => slot.tile ? tileView(slot.tile) : null),
    stash: snapshot.weaponInventory.stash.map((tile) => tile ? tileView(tile) : null),
    rawStats: { ...snapshot.playerStats.raw }, effectiveStats: { ...snapshot.playerStats.effective }, cappedStats: [...snapshot.playerStats.capped],
    upgrades: snapshot.upgradeLevels.map((upgrade) => ({ ...upgrade, used: snapshot.upgradeSlots.find((slot) => slot.category === "offensive")?.used ?? 0, capacity: snapshot.upgradeSlots.find((slot) => slot.category === "offensive")?.capacity ?? 0 })),
    relicIds: [...snapshot.relicIds], artifactId: snapshot.equippedArtifactId, transformation: snapshot.transformation, activeBuffs: snapshot.activeBuffs, synergyTags: [...tags].sort(),
  };
}

export function previewShopPurchase(snapshot: CombatSnapshot, candidate: { cost?: number; itemId?: string; statDelta?: Partial<PlayerStatBlock>; repairs?: { health?: number; shield?: number }; duplicate?: boolean; irreversibleWarning?: string }): ShopPreview {
  const delta = candidate.statDelta ?? {};
  const statDelta: Partial<Record<keyof PlayerStatBlock, number>> = {};
  for (const key of Object.keys(delta) as (keyof PlayerStatBlock)[]) statDelta[key] = (delta[key] ?? 0);
  return { scrapBefore: snapshot.securedScrap, scrapAfter: Math.max(0, snapshot.securedScrap - Math.max(0, candidate.cost ?? 0)), playerHealthBefore: snapshot.playerHealth, playerHealthAfter: Math.min(snapshot.playerMaxHealth, snapshot.playerHealth + (candidate.repairs?.health ?? 0)), playerShieldBefore: snapshot.playerShield, playerShieldAfter: Math.min(snapshot.playerMaxShield, snapshot.playerShield + (candidate.repairs?.shield ?? 0)), statDelta, capLoss: [], duplicateCount: candidate.duplicate ? 1 : 0, cumulativeItemCount: candidate.itemId && snapshot.ownedItemIds.includes(candidate.itemId) ? 2 : 1, helpsCurrentBuild: Object.keys(delta).filter((key) => (delta[key as keyof PlayerStatBlock] ?? 0) > 0), irreversibleWarning: candidate.irreversibleWarning ?? null };
}
