import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { ENEMY_CATALOG } from "../content/enemyCatalog";
import { buildBudgetDensityWave } from "../combat/DensityDirector";
import { experienceThreshold } from "../hero/LevelGrowth";
import { expeditionEncounterForNode } from "./ExpeditionEncounter";
import { expeditionNodeById, type ExpeditionMapData, type ExpeditionNode } from "./ExpeditionMap";

/** Every route crosses these columns, so the campaign always exposes two spend decisions. */
export const CAMPAIGN_SHOP_COLUMNS = Object.freeze([3, 5] as const);
export const CAMPAIGN_SAFE_NODE_SCRAP = 10;
export const CAMPAIGN_TIMED_WAVE_KILL_FRACTION = 0.7;

export function campaignOffersShop(column: number): boolean {
  return CAMPAIGN_SHOP_COLUMNS.includes(Math.floor(column) as 3 | 5);
}

/** Guaranteed node-clear income; random drops and treasure enemies remain upside. */
export function campaignNodeClearScrap(type: ExpeditionNode["type"], column: number): number {
  if (type === "combat" || type === "elite") return 15 + 5 * Math.max(0, Math.floor(column));
  if (type === "supply-depot" || type === "weapon-cache") return CAMPAIGN_SAFE_NODE_SCRAP;
  return 0;
}

export interface CampaignRouteProjection {
  nodeIds: readonly number[];
  nodeTypes: readonly ExpeditionNode["type"][];
  ordinaryThreat: number;
  projectedExperience: number;
  projectedBossEntryLevel: number;
  guaranteedScrap: number;
  shopVisits: number;
  depotVisits: number;
  weaponCaches: number;
  healingOpportunities: number;
}

/**
 * Enumerates every route on one chart and projects only deterministic or
 * explicitly modelled campaign income. Timed-wave XP assumes the documented
 * 70% reference clear; untimed and authored targets assume a full clear.
 */
export function projectCampaignRoutes(map: ExpeditionMapData): readonly CampaignRouteProjection[] {
  return allRoutes(map).map((route) => {
    let ordinaryThreat = 0;
    let projectedExperience = 0;
    let guaranteedScrap = 0;
    let shopVisits = 0;
    let depotVisits = 0;
    let weaponCaches = 0;
    let healingOpportunities = 0;

    for (const node of route) {
      const encounter = expeditionEncounterForNode(map.seed, node);
      guaranteedScrap += campaignNodeClearScrap(node.type, node.column);
      if (node.type === "elite") guaranteedScrap += 15;
      if (node.type === "mini-boss") guaranteedScrap += 40;
      if (campaignOffersShop(node.column)) {
        shopVisits += 1;
        healingOpportunities += 1;
      }
      if (node.type === "supply-depot") {
        depotVisits += 1;
        healingOpportunities += 1;
      }
      if (node.type === "weapon-cache") weaponCaches += 1;
      if (node.type === "mini-boss") healingOpportunities += 1;

      for (const wave of encounter.waves) {
        if (wave.kind === "ordinary") {
          ordinaryThreat += wave.threatBudget;
          const density = buildBudgetDensityWave(
            wave.threatBudget,
            wave.directorWaveIndex,
            wave.timerEndsWave,
            encounter.kind === "combat",
          );
          const rawExperience = density.plans.reduce((sum, spawn) => {
            if (spawn.rank === "elite") {
              return sum + (spawn.eliteKind === "razorlord" || spawn.eliteKind === "blightspitter" ? 30 : 25);
            }
            return sum + ENEMY_CATALOG[spawn.type].experienceValue;
          }, 0);
          projectedExperience += rawExperience * (wave.timerEndsWave ? CAMPAIGN_TIMED_WAVE_KILL_FRACTION : 1);
        } else if (wave.kind === "elite") {
          projectedExperience += wave.eliteKind === "razorlord" || wave.eliteKind === "blightspitter" ? 30 : 25;
        } else if (wave.kind === "mini-boss") {
          projectedExperience += 60;
        }
      }
    }

    const wholeExperience = Math.floor(projectedExperience);
    return Object.freeze({
      nodeIds: Object.freeze(route.map((node) => node.id)),
      nodeTypes: Object.freeze(route.map((node) => node.type)),
      ordinaryThreat,
      projectedExperience: wholeExperience,
      projectedBossEntryLevel: levelAfterExperience(wholeExperience),
      guaranteedScrap,
      shopVisits,
      depotVisits,
      weaponCaches,
      healingOpportunities,
    });
  });
}

export interface CampaignReferenceBuild {
  id: "precision" | "suppression" | "tech-control";
  weapons: readonly { id: WeaponId; tier: 1 | 2 | 3 }[];
  damageMultiplier: number;
}

export const CAMPAIGN_REFERENCE_BUILDS: readonly CampaignReferenceBuild[] = Object.freeze([
  Object.freeze({
    id: "precision" as const,
    weapons: Object.freeze([
      { id: "bastion-service-rifle" as const, tier: 2 as const },
      { id: "bolt-carbine" as const, tier: 2 as const },
      { id: "grenade-tube" as const, tier: 1 as const },
    ]),
    damageMultiplier: 1.3,
  }),
  Object.freeze({
    id: "suppression" as const,
    weapons: Object.freeze([
      { id: "bulwark-rotary-cannon" as const, tier: 2 as const },
      { id: "scattergun" as const, tier: 2 as const },
      { id: "patrol-blade" as const, tier: 1 as const },
    ]),
    damageMultiplier: 1.25,
  }),
  Object.freeze({
    id: "tech-control" as const,
    weapons: Object.freeze([
      { id: "arc-carbine" as const, tier: 2 as const },
      { id: "injector-carbine" as const, tier: 2 as const },
      { id: "grenade-tube" as const, tier: 2 as const },
    ]),
    damageMultiplier: 1.35,
  }),
]);

/** Stationary single-target reference, deliberately excluding chains and blast splash. */
export function referenceBuildBossSeconds(build: CampaignReferenceBuild, bossHealth = 2_400): number {
  const damagePerSecond = build.weapons.reduce((sum, weapon) => {
    const stats = WEAPON_CATALOG[weapon.id];
    const tierMultiplier = 1.6 ** (weapon.tier - 1);
    return sum + stats.projectileDamage * stats.projectileCount * tierMultiplier / stats.fireIntervalSeconds;
  }, 0) * build.damageMultiplier;
  return bossHealth / damagePerSecond;
}

function levelAfterExperience(totalExperience: number): number {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalExperience));
  while (remaining >= experienceThreshold(level) && level < 99) {
    remaining -= experienceThreshold(level);
    level += 1;
  }
  return level;
}

function allRoutes(map: ExpeditionMapData): ExpeditionNode[][] {
  const routes: ExpeditionNode[][] = [];
  const walk = (node: ExpeditionNode, path: ExpeditionNode[]): void => {
    const next = [...path, node];
    if (node.next.length === 0) {
      routes.push(next);
      return;
    }
    for (const id of node.next) walk(expeditionNodeById(map, id)!, next);
  };
  walk(expeditionNodeById(map, map.startNodeId)!, []);
  return routes;
}
