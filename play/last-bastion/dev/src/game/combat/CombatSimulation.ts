import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import { HeroMotionController } from "../hero/HeroMotionController";
import { heroDefinition } from "../hero/HeroCatalog";
import { experienceThreshold, heroGrowthAtLevel } from "../hero/LevelGrowth";
import type { HeroDefinition, WeaponClass } from "../hero/HeroDefinition";
import { ENEMY_CATALOG, type EnemyType } from "../content/enemyCatalog";
import {
  BASTION_SERVICE_RIFLE,
  shouldWeaponFire,
  WEAPON_CATALOG,
  weaponPoolFor,
  type WeaponId,
  type WeaponRuntimeStats,
} from "../content/weaponCatalog";
import {
  clampWeaponCount,
  createWeaponLoadout,
  MAX_EQUIPPED_WEAPONS,
  type EquippedWeapon,
} from "../equipment/WeaponLoadout";
import {
  createWeaponInventory,
  findMergePair,
  placeWeapon,
  type WeaponInventoryState,
  type WeaponPlacementTarget,
  type WeaponTile,
} from "../equipment/WeaponInventory";
import {
  UPGRADE_CATALOG,
  UPGRADE_CATEGORY_LABELS,
  UPGRADE_ORDER,
  UPGRADE_SLOT_HARD_CAP,
  upgradeLevelName,
  type UpgradeCategory,
  type UpgradeId,
} from "../content/upgradeCatalog";
import {
  BASTION_ARENA,
  pointHitsObstacle,
  pointInsideHazard,
  obstacleMaxDurability,
  resolveCircleMovement,
  type ArenaDefinition,
  type ArenaHazard,
  type ArenaObstacle,
} from "../arena/ArenaDefinition";
import { worldObjectById, type InteractionEffect } from "../arena/WorldObjectCatalog";
import { placeWorldObjects, SPAWN_CLEARANCE_METRES } from "../arena/WorldObjectPlacement";
import {
  chooseWorldInteractionCandidate,
  INTERACTION_PROMPT_MARGIN_METRES,
  stepWorldInteraction,
  type WorldInteractionState,
} from "../interaction/WorldInteraction";
import {
  STATUS_BY_DAMAGE_TYPE,
  STATUS_BUILDUP_THRESHOLD,
  STATUS_RULES,
  type DamageType,
  type StatusEffectType,
} from "./damageTypes";
import {
  absorbWithShield,
  mitigateDamage,
  resolveSlowedMultiplier,
} from "../stats/DefenceStats";
import {
  buildDensityCapacityRoster,
  buildBudgetDensityWave,
  buildDensityWave,
  ENEMY_PROJECTILE_BUDGET,
  MAX_RANGED_WINDUPS,
  pressureRoleOf,
  type DirectorSpawnPlan,
  type EnemyPressureRole,
} from "./DensityDirector";
import {
  blendSteering,
  ENEMY_STEERING_PROFILES,
  rangeBandIntent,
  type EnemySteeringProfileId,
} from "./EnemySteeringProfiles";
import {
  AURUM_HOARDER_BREAK_SCRAP,
  AURUM_HOARDER_ESCAPE_SECONDS,
  AURUM_HOARDER_FORAGE_SECONDS,
  AURUM_HOARDER_KILL_SCRAP,
  crossedAurumThresholds,
  selectAurumExit,
  shouldSpawnAurumHoarder,
} from "./AurumHoarder";
import {
  beginAurumHoarderFlee,
  shouldAurumHoarderEscape,
  stepAurumHoarderBehavior,
} from "./AurumHoarderBehavior";
import {
  CORRUPTED_MARINE_KNIFE_DAMAGE,
  CORRUPTED_MARINE_KNIFE_SPEED,
  resolveCorruptedMarineAfterMovement,
  stepCorruptedMarineBehavior,
  type CorruptedMarinePhase,
} from "./CorruptedMarineBehavior";
import { stepFoundryChildBehavior } from "./FoundryChildBehavior";
export {
  CORRUPTED_MARINE_COOLDOWN_SECONDS,
  CORRUPTED_MARINE_KNIFE_SPEED,
  CORRUPTED_MARINE_RECOVERY_SECONDS,
  CORRUPTED_MARINE_WINDUP_SECONDS,
  type CorruptedMarinePhase,
} from "./CorruptedMarineBehavior";
import { initialProjectileCarry, resolveFractionalProjectiles } from "./FractionalProjectiles";
import { FriendlyProjectileBudget } from "./FriendlyProjectileBudget";
import {
  createAbominationBehavior,
  stepAbominationBehavior,
  type AbominationBehaviorState,
  type AbominationPhase,
} from "./AbominationBehavior";
import {
  createNestPod,
  damageNestPod,
  NEST_HATCHLING_COUNT,
  NEST_POD_HATCH_SECONDS,
  NEST_WEAVER_PLACEMENT_CHARGES,
  tryReserveNestPod,
  type NestPodReservation,
  type NestPodState,
} from "./NestWeaverLifecycle";
import { stepNestPodBehavior } from "./NestPodBehavior";
import { planProjectileVolley } from "./WeaponProjectileVolley";
import { planOrdinaryProjectilePayload } from "./WeaponProjectilePayload";
import { pointInsideWeaponArc, selectForwardArcTargets } from "./WeaponTargetGeometry";
import { selectOrbitChainTarget, selectOrbitContactTargets } from "./WeaponOrbitTargeting";
import { selectWeaponAimDirection } from "./WeaponAimSelection";
import { planWeaponFire } from "./WeaponFirePlan";
import { planStructurePlacement } from "./DeployablePlacement";
import { commitDeployableFire, stepDeployableBehavior } from "./DeployableBehavior";
import { planDeployableProjectile } from "./DeployableProjectilePayload";
import { advanceOrbitBladeMotion } from "./OrbitBladeMotion";
import { selectDeployableTarget } from "./DeployableTargetSelection";
import { planMeleeTerrainImpact } from "./MeleeTerrainImpact";
import { composeWeaponHitDamage } from "./WeaponHitDamage";
import { steerProjectileVelocity } from "./ProjectileHoming";
import { stepProjectileKinematics } from "./ProjectileKinematics";
import { planProjectileWorldCollision } from "./ProjectileWorldCollision";
import { projectileContactsEnemy } from "./ProjectileEnemyContact";
import { planProjectileSpecialImpact } from "./ProjectileSpecialImpact";
import { resolveProjectilePierceContinuation } from "./ProjectilePierce";
import { composeProjectileHitDamage } from "./ProjectileHitDamage";
import { planProjectileKnockback } from "./ProjectileKnockback";
import { planProjectileChainHop } from "./ProjectileChain";
import { planProjectileArmourImpact } from "./ProjectileArmourImpact";
import { planProjectileExplosionRoute } from "./ProjectileExplosionRoute";
import { planProjectileSplashImpact } from "./ProjectileSplashImpact";
import {
  bastionEaterChargeDestination,
  resolveBastionEaterActionChoice,
  stepBastionEaterBehavior,
  type BastionEaterAction,
  type BastionEaterPhase,
  type BastionEaterWorldAction,
} from "./BastionEaterBehavior";
export type { BastionEaterAction, BastionEaterPhase } from "./BastionEaterBehavior";
import {
  resolveNestWeaverPlacement,
  stepNestWeaverBehavior,
  type NestWeaverPhase,
} from "./NestWeaverBehavior";
export type { NestWeaverPhase } from "./NestWeaverBehavior";
import {
  createConductiveNode,
  createIdleStormChain,
  clipStormChainToCover,
  damageConductiveNode,
  lockStormChain,
  planStormNodePlacement,
  pointInsideStormChain,
  type ConductiveNodeState,
  type StormChainState,
} from "./StormSavantLightning";
import {
  resolveStormSavantChainStart,
  stepStormSavantBehavior,
} from "./StormSavantBehavior";
import {
  brakeScrapSkitterer,
  createScrapSkittererBehavior,
  SCRAP_SKITTERER_WRECK_SECONDS,
  stepScrapSkittererBehavior,
  type ScrapSkittererState,
} from "./ScrapSkittererBehavior";
import {
  ARC_WARDEN_CHARGE_SECONDS,
  createArcWardenBehavior,
  lockArcWardenLane,
  pointInsideArcWardenLane,
  type ArcWardenState,
} from "./ArcWardenBeam";
import { stepArcWardenCombatBehavior } from "./ArcWardenBehavior";
import {
  createReclaimerRepairBehavior,
  type ReclaimerRepairState,
  type ReclaimerRepairTarget,
} from "./CyborgReclaimerRepair";
import { stepCyborgReclaimerBehavior } from "./CyborgReclaimerBehavior";
import {
  createFoundryFabricatorBehavior,
  damageFoundryPad,
  FOUNDRY_MAX_LIVE_CHILDREN,
  tryReserveFoundryChild,
  type FoundryChildType,
  type FoundryFabricatorState,
} from "./FoundryFabricatorLifecycle";
import {
  resolveFoundryFabricationRequest,
  stepFoundryFabricatorBehavior,
} from "./FoundryFabricatorBehavior";
import {
  createSynapseHeraldBehavior,
  stepSynapseHeraldBehavior,
  type SynapseHeraldMove,
  type SynapseHeraldState,
} from "./SynapseHeraldBehavior";
import {
  createAssemblyPrimeBehavior,
  damageAssemblyPrimePad,
  stepAssemblyPrimeBehavior,
  type AssemblyPrimeLane,
  type AssemblyPrimeMove,
  type AssemblyPrimeState,
} from "./AssemblyPrimeBehavior";
import {
  createStormRegentBehavior,
  stepStormRegentBehavior,
  STORM_REGENT_COIL_RADIUS_METRES,
  STORM_REGENT_NODE_OVERCHARGE_RADIUS_METRES,
  type StormRegentMove,
  type StormRegentState,
} from "./StormRegentBehavior";
import {
  ABOMINATION_PRIME_GRAB_BREAK_DAMAGE,
  ABOMINATION_PRIME_GRAB_HARD_RANGE_METRES,
  ABOMINATION_PRIME_HAZARD_SECONDS,
  ABOMINATION_PRIME_SLAM_RADIUS_METRES,
  ABOMINATION_PRIME_THROW_RADIUS_METRES,
  createAbominationPrimeBehavior,
  damageAbominationPrimeGrab,
  stepAbominationPrimeBehavior,
  type AbominationPrimeMove,
  type AbominationPrimeState,
} from "./AbominationPrimeBehavior";
import {
  ENEMY_HIT_CAP,
  RANKED_ENEMY_HIT_CAP,
  scaleEnemyHealth,
  scaleEnemyHit,
  waveScaling,
} from "./WaveScaling";
import type { EliteKind } from "./EliteCadence";
export type { EliteKind } from "./EliteCadence";
import {
  DENSITY_PRESSURE_RESET,
  populateScenario,
  type ScenarioPopulationContext,
} from "./scenarios/ScenarioPopulation";
import { stepBrainBlobBehavior } from "./BrainBlobBehavior";
import { armBlastMiteIfInRange, stepBlastMiteBehavior } from "./BlastMiteBehavior";
import { resolveWarpFlankerAfterMovement, stepWarpFlankerBehavior } from "./WarpFlankerBehavior";
import {
  resolveCarapaceScuttlerAfterMovement,
  stepCarapaceScuttlerBehavior,
} from "./CarapaceScuttlerBehavior";
import { commitSlimeSpitterWindup, stepSlimeSpitterBehavior } from "./SlimeSpitterBehavior";
import { stepEggClusterBehavior } from "./EggClusterBehavior";
import { RIPPER_REACH_METRES, stepRipperBehavior } from "./RipperBehavior";
import {
  RAZORLORD_DASH_SPEED,
  RAZORLORD_PURSUIT_SPEED,
  RAZOR_SCUTTLER_DASH_SECONDS,
  RAZOR_SCUTTLER_DASH_SPEED,
  RAZOR_SCUTTLER_RECOVERY_SECONDS,
  RAZOR_SCUTTLER_WINDUP_SECONDS,
  resolveRazorScuttlerAfterMovement,
  stepRazorScuttlerBehavior,
} from "./RazorScuttlerBehavior";
import { commitQuillbackWindup, stepQuillbackBehavior } from "./QuillbackBehavior";
import type { EnemyMovementIntent } from "./EnemyMovementIntent";
import {
  INFECTED_SURVIVOR_MAX_STAMINA_SECONDS,
  stepInfectedSurvivorBehavior,
  type InfectedSurvivorPhase,
} from "./InfectedSurvivorBehavior";
import {
  lockSpinewheelPlayerHit,
  SPINEWHEEL_BASE_ROLL_SPEED,
  SPINEWHEEL_MAX_REBOUNDS,
  stepSpinewheelBehavior,
  type SpinewheelPhase,
  type SpinewheelState,
} from "./SpinewheelBehavior";
import {
  applyTetherBloomDamage,
  stepTetherBloomBehavior,
  type TetherBloomBreakReason,
  type TetherBloomPhase,
  type TetherBloomState,
  type TetherBloomStepResult,
} from "./TetherBloomBehavior";
import {
  stepBroodWardenBehavior,
  type BroodWardenPhase,
} from "./BroodWardenBehavior";
import {
  RIFT_STALKER_SLASH_REACH_METRES,
  RIFT_STALKER_WARP_SECONDS,
  stepRiftStalkerBehavior,
  type RiftStalkerPhase,
} from "./RiftStalkerBehavior";
import {
  siegeCrusherChargeDestination,
  stepSiegeCrusherBehavior,
  type SiegeCrusherPhase,
} from "./SiegeCrusherBehavior";
export type { SiegeCrusherPhase } from "./SiegeCrusherBehavior";
export {
  RIFT_STALKER_SLASH_REACH_METRES,
  RIFT_STALKER_WARP_SECONDS,
  type RiftStalkerPhase,
} from "./RiftStalkerBehavior";
import {
  broodWardenEnrageTier,
  miniBossRepositionDirection,
  riftStalkerFrenzyTier,
  siegeCrusherEnrageTier,
} from "./MiniBossBehaviorShared";
export type { BroodWardenPhase } from "./BroodWardenBehavior";
export {
  broodWardenEnrageTier,
  miniBossRepositionDirection,
  riftStalkerFrenzyTier,
  siegeCrusherEnrageTier,
} from "./MiniBossBehaviorShared";
// Re-exported from the modules that own them so existing importers keep
// working; the definitions moved out to break a cycle with scenario setup.
export { ARC_WARDEN_LAB_CAP } from "./ArcWardenBeam";
export { SCRAP_SKITTERER_PACK_CAP } from "./ScrapSkittererBehavior";
export { INFECTED_SURVIVOR_PACK_CAP } from "./CorruptedHumanWaves";
export {
  approachVelocity,
  infectedSurvivorSteeringDirection,
  INFECTED_SURVIVOR_ACCELERATION,
  INFECTED_SURVIVOR_DECELERATION,
  INFECTED_SURVIVOR_MAX_STAMINA_SECONDS,
  INFECTED_SURVIVOR_RECOVERY_SECONDS,
  INFECTED_SURVIVOR_SPRINT_SPEED,
  INFECTED_SURVIVOR_STAMINA_RECOVERY_PER_SECOND,
  type InfectedSurvivorPhase,
} from "./InfectedSurvivorBehavior";
export {
  SPINEWHEEL_APPROACH_RANGE_METRES,
  SPINEWHEEL_BASE_ROLL_SPEED,
  SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER,
  SPINEWHEEL_MAX_REBOUNDS,
  SPINEWHEEL_MAX_ROLL_SECONDS,
  SPINEWHEEL_POSITIONING_SECONDS,
  SPINEWHEEL_RECOVERY_SECONDS,
  SPINEWHEEL_REPEAT_HIT_LOCKOUT_SECONDS,
  SPINEWHEEL_WINDUP_SECONDS,
  type SpinewheelPhase,
} from "./SpinewheelBehavior";
export {
  TETHER_BLOOM_ACQUISITION_RANGE_METRES,
  TETHER_BLOOM_BREAK_DAMAGE,
  TETHER_BLOOM_DURATION_SECONDS,
  TETHER_BLOOM_HARD_RANGE_METRES,
  TETHER_BLOOM_IDLE_SECONDS,
  TETHER_BLOOM_PULL_SPEED_METRES_PER_SECOND,
  TETHER_BLOOM_RECOVERY_SECONDS,
  TETHER_BLOOM_WINDUP_SECONDS,
  type TetherBloomBreakReason,
  type TetherBloomPhase,
} from "./TetherBloomBehavior";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import {
  cloneTransformationAffinityState,
  createTransformationAffinityState,
  type TransformationAffinityState,
} from "../transformations/TransformationAffinity";
import {
  resolveTransformationModifiers,
  NEARBY_KILL_HEAL_RADIUS_METRES,
  NEARBY_KILL_HEAL_WINDOW_CAP,
  NEARBY_KILL_HEAL_WINDOW_SECONDS,
  RETALIATION_COOLDOWN_SECONDS,
  RETALIATION_RADIUS_METRES,
  GRAVITY_PULSE_EVERY_NTH_ATTACK,
  TELEKINETIC_PUSH_EVERY_NTH_ATTACK,
  TRANSFORMATION_CLOSE_RANGE_METRES,
  TRANSFORMATION_LONG_RANGE_METRES,
  type TransformationRunModifiers,
} from "../transformations/TransformationRunModifiers";
import {
  outgoingDamageMultiplier,
  resolvePlayerStats,
  type PlayerStatBlock,
} from "../stats/PlayerStatBlock";
import {
  applyPlayerStatLimits,
  finalAttackSpeedFactor,
  PLAYER_STAT_LIMITS,
  type EffectivePlayerStats,
} from "../stats/PlayerStatLimits";
import { collectItemEffects, foldItemStats, itemById, ITEM_CATALOG, type ItemEffectTrigger } from "../content/itemCatalog";
import type { EnemyThreatClass } from "../rendering/EnemyHealthBars";
import {
  DEFAULT_SHOP_PROFILE_ID,
  NON_ITEM_DRAW_WEIGHT,
  profileStocksItem,
  rarityDrawWeight,
  shopProfileById,
  type ShopProfileId,
} from "../content/shopProfiles";
import {
  LEVEL_STAT_ORDER,
  isLevelStatCardId,
  levelStatCardById,
  levelStatCardDescription,
} from "../content/levelStatCatalog";
import { resolvePerkModifiers, type PerkId, type PerkRunModifiers } from "../perks/perkCatalog";
import {
  resolveRelicModifiers,
  type ArtifactId,
  type RelicId,
  type RelicRunModifiers,
} from "../content/relicCatalog";
import type { ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import type { ExpeditionWavePlan } from "../expedition/ExpeditionNodeDirector";
import { campaignNodeClearScrap, campaignOffersShop, rankDefeatScrap } from "../expedition/CampaignTuning";
import {
  buildRainOfSpinesTargets,
  GROUND_SLAM_RECOVERY_SECONDS,
  GROUND_SLAM_TELL_SECONDS,
  limitMajorTelegraphs,
  pointInsideTelegraphedArc,
  RADIAL_PULSE_TELL_SECONDS,
  rainRadiusMetres,
  RAIN_OF_SPINES_TELL_SECONDS,
  SWEEPING_ARC_TELL_SECONDS,
  type CombatTelegraphSnapshot,
} from "./TelegraphRules";
export type { CombatTelegraphSnapshot } from "./TelegraphRules";

export type EncounterStatus = "combat" | "intermission" | "victory" | "defeat";
export type BrainPhase = "drift" | "windup" | "lunge" | "recover";
export type SlimeSpitterPhase = "positioning" | "windup" | "recover";
export type BlastMitePhase = "chase" | "armed";
export type WarpFlankerPhase = "stalk" | "warp-windup" | "materialize";
export type RipperPhase = "pursuit" | "windup" | "sweep" | "recovery";
export type RazorScuttlerPhase = "pursuit" | "windup" | "dash" | "recovery";
export type QuillbackPhase = "positioning" | "windup" | "launch" | "recover";
export type AurumHoarderPhase = "forage" | "flee";
export type EnemyRank = "standard" | "treasure" | "elite" | "mini-boss" | "boss";
export type CarapacePhase = "pursuit" | "windup" | "charge" | "recovery";
export type MiniBossKind = "siege-crusher" | "brood-warden" | "rift-stalker" | "synapse-herald" | "assembly-prime" | "storm-regent" | "abomination-prime";

/** Every mini-boss kind, so the spawn path can't drift out of sync with the union again. */
export const MINI_BOSS_KINDS: readonly MiniBossKind[] = Object.freeze([
  "siege-crusher", "brood-warden", "rift-stalker",
  "synapse-herald", "assembly-prime", "storm-regent", "abomination-prime",
]);

export function isMiniBossKind(value: string): value is MiniBossKind {
  return (MINI_BOSS_KINDS as readonly string[]).includes(value);
}

/**
 * Draw weight for one shop offer. Item offers (`shop-item:<id>`) are weighted by
 * rarity and bent by luck/curse; every other stock line (repair, kits,
 * upgrades, weapons) takes the flat non-item weight so the rest of the shop
 * isn't crowded out by the item catalogue's size.
 */
export function shopOfferDrawWeight(offerId: string, luck: number, curse: number): number {
  if (!offerId.startsWith("shop-item:")) return NON_ITEM_DRAW_WEIGHT;
  const definition = itemById(offerId.slice("shop-item:".length));
  return definition ? rarityDrawWeight(definition.rarity, luck, curse) : NON_ITEM_DRAW_WEIGHT;
}

/**
 * The one place a live enemy's body radius is resolved. `radiusMetres` lives on
 * the frozen catalog, so a per-entity size multiplier has nowhere else to
 * apply — routing every read through here keeps collision, separation, contact
 * reach and the rendered silhouette in agreement.
 */
export function enemyRadius(enemy: { type: EnemyType; radiusScale?: number }): number {
  return ENEMY_CATALOG[enemy.type].radiusMetres * (enemy.radiusScale ?? 1);
}
export type CombatScenario = "slime-spitter" | "carapace-elite" | "siege-crusher" | "brood-warden" | "rift-stalker" | "synapse-herald" | "assembly-prime" | "storm-regent" | "abomination-prime" | "infected-survivor" | "corrupted-marine" | "abomination" | "corrupted-human" | "nest-weaver" | "storm-savant" | "scrap-skitterer" | "arc-warden" | "cyborg-reclaimer" | "foundry-fabricator" | "ripper" | "razor-scuttler" | "quillback" | "spinewheel" | "tether-bloom" | "bastion-eater" | "density-capacity" | "aurum-hoarder" | "scrap-shop" | "weapon-gate" | "batch-j";
export type PowerupType = "overcharge" | "aegis" | "adrenaline" | "magnet-pulse" | "uranium-core-rounds" | "medkit" | "siege-loader" | "phase-jacket" | "hunter-optics" | "last-stand-stimulant" | "emp-charge" | "butchers-serum";
export type SupplyChestVariant = "sealed" | "armored";
export type DecisionKind = "upgrade" | "level-stat" | "weapon-chest" | "supply-depot" | "slot-requisition" | "scrap-shop" | "weapon-placement";
export type ScrapSource = "ordinary-drop" | "specialist-defeat" | "elite-defeat" | "mini-boss-defeat" | "boss-defeat" | "wave-clear" | "aurum-armour" | "aurum-defeat" | "supply-chest" | "world-object";

export type TerrainDamageSource = "player-projectile" | "player-melee" | "mini-boss-charge" | "mini-boss-impact" | "enemy-slam" | "enemy-biomass";

/** How the player took a hit. Blast Baffle mitigates the explosive kind. */
/**
 * `hazard` is standing damage from a persistent floor hazard. It deliberately
 * ignores the post-hit invulnerability window in both directions: a hazard tick
 * neither waits for the window nor opens one. Otherwise standing in lava while a
 * swarm chewed on you would deal *no* lava damage, and — worse — parking in fire
 * would grant permanent i-frames against everything else.
 */
export type PlayerDamageSource = "generic" | "contact" | "projectile" | "explosive" | "hazard";

export interface TerrainSnapshot {
  id: string;
  kind: ArenaObstacle["kind"];
  health: number;
  maxHealth: number;
  hitRemainingSeconds: number;
}

export interface UpgradeSlotSnapshot {
  category: UpgradeCategory;
  used: number;
  capacity: number;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  cost?: number;
  affordable?: boolean;
}

/** A player-owned structure on the floor, e.g. a planted Sentry Stake. */
interface DeployableState {
  id: number;
  weaponId: WeaponId;
  kind: "structure" | "auxiliary-drone";
  position: Vector2Data;
  health: number;
  maxHealth: number;
  remainingSeconds: number;
  cooldownSeconds: number;
  shotDamage: number;
  orbitAngleRadians: number;
  dead: boolean;
}

export interface DeployableSnapshot {
  id: number;
  weaponId: WeaponId;
  kind: "structure" | "auxiliary-drone";
  position: Vector2Data;
  health: number;
  maxHealth: number;
  remainingSeconds: number;
}

export interface WorldInteractionPrompt {
  objectId: string;
  worldObjectId: string;
  /** Imperative label, e.g. "OPEN" or "HARVEST". */
  verb: string;
  position: Vector2Data;
  /** 0..1 hold progress, so the HUD can draw a ring without recomputing it. */
  progress: number;
  holding: boolean;
}

export interface PendingDecision {
  kind: DecisionKind;
  title: string;
  options: readonly DecisionOption[];
  weaponId?: WeaponId;
  shopMode?: "offers" | "manage" | "sell";
  shopLockedOfferId?: string | null;
  shopRerollUsed?: boolean;
  shopRerollCost?: number;
}

export type CombatEvent =
  | {
    type: "weapon-fired";
    weaponInstanceId: number;
    weaponId: WeaponId;
    position: Vector2Data;
    direction: Vector2Data;
  }
  | { type: "enemy-hit"; position: Vector2Data; damage: number; damageType: DamageType; enemyId: number }
  | { type: "bolt-impact"; position: Vector2Data; hitIndex: 1 | 2 }
  | { type: "projectile-impact"; position: Vector2Data; weaponId: WeaponId }
  | { type: "enemy-defeated"; position: Vector2Data; enemyType: EnemyType; bestiaryKey: string }
  | { type: "explosion"; position: Vector2Data; radiusMetres: number; weaponId?: WeaponId }
  | { type: "player-hit"; position: Vector2Data; damage: number }
  | { type: "player-shield-hit"; position: Vector2Data; damage: number }
  | { type: "player-healed"; position: Vector2Data; amount: number }
  | { type: "xp-collected"; position: Vector2Data; value: number }
  | { type: "level-up"; level: number }
  | { type: "enemy-spawned"; position: Vector2Data; enemyType: EnemyType; bestiaryKey: string }
  | { type: "egg-hatched"; position: Vector2Data }
  | { type: "projectile-blocked"; position: Vector2Data; weaponId?: WeaponId }
  | { type: "chain-arc"; from: Vector2Data; to: Vector2Data; weaponId: WeaponId }
  | { type: "slime-spit-windup"; position: Vector2Data; target: Vector2Data }
  | { type: "slime-glob-fired"; position: Vector2Data; target: Vector2Data }
  | { type: "slime-impact"; position: Vector2Data; createdPuddle: boolean }
  | { type: "elite-armour-hit"; position: Vector2Data; eliteKind: EliteKind }
  | { type: "elite-reward-dropped"; position: Vector2Data; eliteKind: EliteKind }
  | { type: "elite-reward-collected"; position: Vector2Data }
  | { type: "mini-boss-sweep"; position: Vector2Data; radiusMetres: number }
  | { type: "mini-boss-shockwave"; position: Vector2Data; radiusMetres: number }
  | { type: "rain-of-spines-impact"; position: Vector2Data }
  | { type: "brood-cleave"; position: Vector2Data; radiusMetres: number }
  | { type: "brood-acid-volley"; position: Vector2Data; target: Vector2Data; count: number }
  | { type: "brood-acid-impact"; position: Vector2Data }
  | { type: "brood-eggs-laid"; position: Vector2Data; count: number }
  | { type: "brood-swarm-rush"; position: Vector2Data; count: number }
  | { type: "corrupted-marine-warning"; position: Vector2Data; target: Vector2Data; enemyId: number }
  | { type: "corrupted-marine-knife-fired"; position: Vector2Data; direction: Vector2Data; enemyId: number }
  | { type: "corrupted-marine-knife-impact"; position: Vector2Data; reason: "player" | "cover" | "expired"; damage: number; enemyId: number }
  | { type: "infected-survivor-rush"; position: Vector2Data; enemyId: number }
  | { type: "abomination-recovery"; position: Vector2Data; enemyId: number }
  | { type: "abomination-slam-warning"; position: Vector2Data; target: Vector2Data; radiusMetres: number; enemyId: number }
  | { type: "abomination-slam-impact"; position: Vector2Data; radiusMetres: number; damage: number; hitPlayer: boolean; enemyId: number }
  | { type: "nest-weaver-placement-warning"; position: Vector2Data; target: Vector2Data; enemyId: number }
  | { type: "nest-pod-laid"; position: Vector2Data; ownerId: number; podId: number; hatchSeconds: number }
  | { type: "nest-pod-hatched"; position: Vector2Data; podId: number; count: number }
  | { type: "nest-pod-destroyed"; position: Vector2Data; podId: number }
  | { type: "storm-chain-warning"; position: Vector2Data; enemyId: number; segments: StormChainState["segments"] }
  | { type: "storm-chain-discharged"; position: Vector2Data; enemyId: number; hitPlayer: boolean; damage: number }
  | { type: "storm-chain-interrupted"; position: Vector2Data; enemyId: number }
  | { type: "scrap-skitterer-warning"; position: Vector2Data; direction: Vector2Data; enemyId: number }
  | { type: "scrap-skitterer-rush"; position: Vector2Data; direction: Vector2Data; enemyId: number }
  | { type: "scrap-skitterer-impact"; position: Vector2Data; reason: "player" | "cover" | "miss"; enemyId: number }
  | { type: "scrap-skitterer-wreck"; position: Vector2Data; wreckId: number; durationSeconds: number }
  | { type: "arc-warden-warning"; position: Vector2Data; enemyId: number; lane: NonNullable<ArcWardenState["lockedLane"]> }
  | { type: "arc-warden-discharged"; position: Vector2Data; endpoint: Vector2Data; enemyId: number; hitPlayer: boolean; damage: number; blockedByObstacleId?: string }
  | { type: "foundry-fabrication-started"; position: Vector2Data; enemyId: number; padId: number; childType: FoundryChildType }
  | { type: "foundry-fabrication-completed"; position: Vector2Data; enemyId: number; childId: number; childType: FoundryChildType }
  | { type: "foundry-fabrication-interrupted"; position: Vector2Data; enemyId: number; reason: "owner-damage" | "pad-destroyed" }
  | { type: "foundry-turret-warning"; position: Vector2Data; target: Vector2Data; enemyId: number }
  | { type: "foundry-turret-fired"; position: Vector2Data; target: Vector2Data; enemyId: number; damage: number; hitPlayer: boolean }
  | { type: "foundry-child-powered-down"; position: Vector2Data; enemyId: number; ownerId: number; reason: "expired" | "owner-defeated" }
  | { type: "synapse-herald-warning"; position: Vector2Data; enemyId: number; move: SynapseHeraldMove; targets: readonly Vector2Data[]; linkTargetId?: number }
  | { type: "synapse-herald-lunge"; position: Vector2Data; enemyId: number; target: Vector2Data; chainIndex: number }
  | { type: "synapse-herald-zones-erupted"; position: Vector2Data; enemyId: number; zones: readonly Vector2Data[]; hitPlayer: boolean }
  | { type: "synapse-herald-link-started"; position: Vector2Data; enemyId: number; targetId: number }
  | { type: "synapse-herald-link-broken"; position: Vector2Data; enemyId: number; targetId: number; reason: "target" | "expired" }
  | { type: "assembly-prime-warning"; position: Vector2Data; enemyId: number; move: AssemblyPrimeMove; lanes: readonly AssemblyPrimeLane[]; target?: Vector2Data; recallTargetId?: number }
  | { type: "assembly-prime-lane-fired"; position: Vector2Data; enemyId: number; laneIndex: number; endpoint: Vector2Data; hitPlayer: boolean; damage: number }
  | { type: "assembly-prime-fabrication-completed"; position: Vector2Data; enemyId: number; childId: number; childType: FoundryChildType }
  | { type: "assembly-prime-fabrication-interrupted"; position: Vector2Data; enemyId: number; reason: "owner-damage" | "pad-destroyed" }
  | { type: "assembly-prime-drone-recalled"; position: Vector2Data; enemyId: number; childId: number }
  | { type: "storm-regent-warning"; position: Vector2Data; enemyId: number; move: StormRegentMove; segments: StormChainState["segments"]; centre?: Vector2Data; radiusMetres?: number; nodeId?: number }
  | { type: "storm-regent-discharged"; position: Vector2Data; enemyId: number; move: StormRegentMove; hitPlayer: boolean; damage: number; centre?: Vector2Data }
  | { type: "storm-regent-interrupted"; position: Vector2Data; enemyId: number; move: StormRegentMove; nodePosition?: Vector2Data }
  | { type: "abomination-prime-warning"; position: Vector2Data; enemyId: number; move: AbominationPrimeMove; target: Vector2Data; radiusMetres?: number }
  | { type: "abomination-prime-slam"; position: Vector2Data; enemyId: number; hitPlayer: boolean; damage: number; radiusMetres: number }
  | { type: "abomination-prime-grab-latched"; position: Vector2Data; enemyId: number; damage: number }
  | { type: "abomination-prime-grab-broken"; position: Vector2Data; enemyId: number; reason: "evasive" | "damage" | "range" | "cover" | "expired" }
  | { type: "abomination-prime-biomass-thrown"; position: Vector2Data; enemyId: number; target: Vector2Data }
  | { type: "abomination-prime-biomass-landed"; position: Vector2Data; enemyId: number; hitPlayer: boolean; damage: number; radiusMetres: number }
  | { type: "abomination-prime-hazard-tick"; position: Vector2Data; enemyId: number; damage: number }
  | { type: "reclaimer-link-started"; position: Vector2Data; target: Vector2Data; enemyId: number; targetId: number }
  | { type: "reclaimer-repair-completed"; position: Vector2Data; target: Vector2Data; enemyId: number; targetId: number; amount: number }
  | { type: "reclaimer-link-interrupted"; position: Vector2Data; enemyId: number; targetId: number | null; reason: "damage" | "target" }
  | { type: "rift-stalker-mark"; position: Vector2Data; target: Vector2Data }
  | { type: "rift-stalker-warp-out"; position: Vector2Data }
  | { type: "rift-stalker-pounce"; position: Vector2Data; radiusMetres: number; hitPlayer: boolean }
  | { type: "rift-stalker-fan"; position: Vector2Data; direction: Vector2Data; count: number }
  | { type: "rift-stalker-slash"; position: Vector2Data; direction: Vector2Data; reachMetres: number }
  | { type: "obstacle-damaged"; obstacleId: string; position: Vector2Data; damage: number; remainingHealth: number; source: TerrainDamageSource }
  | { type: "obstacle-destroyed"; obstacleId: string; position: Vector2Data; damage: number; remainingHealth: 0; source: TerrainDamageSource }
  | { type: "mini-boss-reward-dropped"; position: Vector2Data; miniBossKind: MiniBossKind }
  | { type: "item-granted"; position: Vector2Data; itemId: string }
  | { type: "brace-formation"; position: Vector2Data }
  | { type: "player-revived"; position: Vector2Data }
  | { type: "status-applied"; position: Vector2Data; status: StatusEffectType }
  | { type: "powerup-collected"; position: Vector2Data; powerupType: PowerupType }
  | { type: "deployable-placed"; position: Vector2Data; weaponId: WeaponId }
  | { type: "deployable-fired"; position: Vector2Data; weaponId: WeaponId }
  | { type: "deployable-expired"; position: Vector2Data; weaponId: WeaponId }
  | {
    type: "world-interaction-completed";
    objectId: string;
    worldObjectId: string;
    effect: InteractionEffect["type"];
    position: Vector2Data;
  }
  | { type: "kit-activated"; position: Vector2Data; powerupType: "uranium-core-rounds" }
  | { type: "warp-arrival"; position: Vector2Data }
  | { type: "ripper-sweep"; position: Vector2Data; direction: Vector2Data; reachMetres: number }
  | { type: "razor-scuttler-warning"; position: Vector2Data; direction: Vector2Data }
  | { type: "razor-scuttler-dash"; position: Vector2Data; direction: Vector2Data }
  | { type: "razor-scuttler-impact"; position: Vector2Data; reason: "player" | "cover" | "miss" }
  | { type: "quillback-windup"; position: Vector2Data; direction: Vector2Data; count: 1 | 3 | 5 }
  | { type: "quillback-volley"; position: Vector2Data; direction: Vector2Data; count: 1 | 3 | 5 }
  | { type: "quillback-spike-impact"; position: Vector2Data; hitPlayer: boolean }
  | { type: "spinewheel-windup"; position: Vector2Data; direction: Vector2Data }
  | { type: "spinewheel-bounce"; position: Vector2Data; direction: Vector2Data; bouncesRemaining: number }
  | { type: "spinewheel-hit"; position: Vector2Data }
  | { type: "spinewheel-recovery"; position: Vector2Data }
  | { type: "tether-bloom-windup"; position: Vector2Data; target: Vector2Data }
  | { type: "tether-bloom-latched"; position: Vector2Data }
  | { type: "tether-bloom-broken"; position: Vector2Data; reason: "evasive" | "damage" | "range" }
  | { type: "tether-bloom-released"; position: Vector2Data }
  | { type: "aurum-arrived"; position: Vector2Data }
  | { type: "aurum-fleeing"; position: Vector2Data; target: Vector2Data; remainingSeconds: number }
  | { type: "aurum-armour-broken"; position: Vector2Data; threshold: number; scrap: number; totalScrap: number }
  | { type: "aurum-escaped"; position: Vector2Data }
  | { type: "aurum-supply-cache-dropped"; position: Vector2Data }
  | { type: "scrap-secured"; position: Vector2Data; amount: number; total: number; source: ScrapSource }
  | { type: "scrap-spent"; amount: number; remaining: number; offerId: string }
  | { type: "weapon-sold"; weaponId: WeaponId; amount: number; total: number }
  | { type: "bastion-eater-phase"; position: Vector2Data; phase: BastionEaterPhase }
  | { type: "bastion-eater-claw-warning"; position: Vector2Data; direction: Vector2Data }
  | { type: "bastion-eater-claw-strike"; position: Vector2Data; direction: Vector2Data }
  | { type: "bastion-eater-charge"; position: Vector2Data; direction: Vector2Data }
  | { type: "bastion-eater-tendril"; position: Vector2Data; radiusMetres: number; warning: boolean }
  | { type: "bastion-eater-eggs"; position: Vector2Data; count: number }
  | { type: "bastion-eater-breach"; position: Vector2Data; radiusMetres: number; warning: boolean }
  | { type: "bastion-eater-vault"; position: Vector2Data }
  | { type: "ultimate-fired"; position: Vector2Data }
  | { type: "medic-triage"; position: Vector2Data; healed: number; shieldGained: number }
  | { type: "medic-surge"; position: Vector2Data; healed: number; shieldGained: number }
  | { type: "fence-activated"; from: Vector2Data; to: Vector2Data }
  | { type: "supply-chest-spawned"; position: Vector2Data; variant: SupplyChestVariant }
  | { type: "supply-chest-hit"; position: Vector2Data; remainingHealth: number }
  | { type: "supply-chest-opened"; position: Vector2Data }
  | { type: "supply-chest-destroyed"; position: Vector2Data };

export interface EnemySnapshot {
  id: number;
  type: EnemyType;
  position: Vector2Data;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  armour: number;
  movementSpeedMultiplier: number;
  damageMultiplier: number;
  radiusMetres: number;
  hatchProgress: number;
  brainPhase?: BrainPhase;
  spitterPhase?: SlimeSpitterPhase;
  spitterTarget?: Vector2Data;
  mitePhase?: BlastMitePhase;
  survivorPhase?: InfectedSurvivorPhase;
  survivorStaminaSeconds?: number;
  survivorVelocity?: Vector2Data;
  corruptedMarinePhase?: CorruptedMarinePhase;
  corruptedMarineTarget?: Vector2Data;
  abominationPhase?: AbominationPhase;
  abominationTarget?: Vector2Data;
  nestWeaverPhase?: NestWeaverPhase;
  nestWeaverTarget?: Vector2Data;
  nestWeaverChargesRemaining?: number;
  nestPodRemainingSeconds?: number;
  nestPodOwnerId?: number;
  stormPhase?: StormChainState["phase"];
  stormSegments?: StormChainState["segments"];
  stormNodeOwnerId?: number;
  scrapSkittererPhase?: ScrapSkittererState["phase"];
  scrapSkittererDirection?: Vector2Data;
  arcWardenPhase?: ArcWardenState["phase"];
  arcWardenLane?: ArcWardenState["lockedLane"];
  reclaimerPhase?: ReclaimerRepairState["phase"];
  reclaimerTargetId?: number;
  reclaimerChargesRemaining?: number;
  foundryPhase?: FoundryFabricatorState["phase"];
  foundryTarget?: Vector2Data;
  foundryChargesRemaining?: number;
  foundryPadHealth?: number;
  foundryOwnerId?: number;
  foundryRemainingSeconds?: number;
  foundryTurretPhase?: "tracking" | "warning" | "recovery";
  foundryTurretTarget?: Vector2Data;
  warpPhase?: WarpFlankerPhase;
  warpTarget?: Vector2Data;
  ripperPhase?: RipperPhase;
  ripperDirection?: Vector2Data;
  razorScuttlerPhase?: RazorScuttlerPhase;
  razorScuttlerDirection?: Vector2Data;
  quillbackPhase?: QuillbackPhase;
  quillbackDirection?: Vector2Data;
  quillbackShotCount?: 1 | 3 | 5;
  spinewheelPhase?: SpinewheelPhase;
  spinewheelDirection?: Vector2Data;
  spinewheelSpeedMetresPerSecond?: number;
  spinewheelBouncesRemaining?: number;
  tetherBloomPhase?: TetherBloomPhase;
  tetherBloomTarget?: Vector2Data;
  tetherBloomBreakDamage?: number;
  aurumPhase?: AurumHoarderPhase;
  aurumExitTarget?: Vector2Data;
  aurumEscapeRemainingSeconds?: number;
  aurumArmourBreaksPaid?: number;
  bastionEaterPhase?: BastionEaterPhase;
  bastionEaterAction?: BastionEaterAction;
  bastionEaterDirection?: Vector2Data;
  bastionEaterTarget?: Vector2Data;
  bastionEaterNodeExposed?: boolean;
  rank: EnemyRank;
  threatClass: EnemyThreatClass;
  recentDamageRemainingSeconds: number;
  hasActiveStatus: boolean;
  majorAttackWindup: boolean;
  /**
   * Body-radius multiplier on top of the catalog `radiusMetres`. Only ranked
   * enemies set it (see `spawnMiniBoss`); absent means 1. Read through
   * `enemyRadius()` so hitbox, separation and rendering never disagree.
   */
  radiusScale?: number;
  eliteKind?: EliteKind;
  carapacePhase?: CarapacePhase;
  miniBossKind?: MiniBossKind;
  siegeCrusherPhase?: SiegeCrusherPhase;
  siegeCrusherDirection?: Vector2Data;
  broodWardenPhase?: BroodWardenPhase;
  broodWardenDirection?: Vector2Data;
  riftStalkerPhase?: RiftStalkerPhase;
  riftStalkerMarkTarget?: Vector2Data;
  riftStalkerDirection?: Vector2Data;
  synapseHeraldPhase?: SynapseHeraldState["phase"];
  synapseHeraldMove?: SynapseHeraldMove;
  synapseHeraldTargets?: readonly Vector2Data[];
  synapseHeraldLinkTargetId?: number;
  assemblyPrimePhase?: AssemblyPrimeState["phase"];
  assemblyPrimeMove?: AssemblyPrimeMove;
  assemblyPrimeProgress?: number;
  assemblyPrimeLanes?: readonly AssemblyPrimeLane[];
  assemblyPrimeTarget?: Vector2Data;
  assemblyPrimeRecallTargetId?: number;
  stormRegentPhase?: StormRegentState["phase"];
  stormRegentMove?: StormRegentMove;
  stormRegentSegments?: StormChainState["segments"];
  stormRegentCentre?: Vector2Data;
  stormRegentRadiusMetres?: number;
  stormRegentNodeId?: number;
  abominationPrimePhase?: AbominationPrimeState["phase"];
  abominationPrimeMove?: AbominationPrimeMove;
  abominationPrimeTarget?: Vector2Data;
  abominationPrimeHazard?: AbominationPrimeState["hazard"];
  abominationPrimeGrabDamage?: number;
  facingDirection: Vector2Data;
  statuses: readonly StatusEffectType[];
  /**
   * Progress toward `STATUS_BUILDUP_THRESHOLD` per status, so the HUD can show
   * that an elemental build is working before the status actually fires.
   * Exposed 8 Aug 2026; buildup was previously invisible to the player.
   */
  statusBuildup: Readonly<Partial<Record<StatusEffectType, number>>>;
  steeringProfile: EnemySteeringProfileId;
}

export interface DensityTelemetrySnapshot {
  liveCap: number;
  currentLiveEnemies: number;
  peakLiveEnemies: number;
  spawnedThisWave: number;
  threatBudget: number;
  threatSpawned: number;
  reservedLiveSlots: number;
  reservedThreat: number;
  waveElapsedSeconds: number;
  waveDurationSeconds: number | null;
  timerEndsWave: boolean;
  queuedSpawns: number;
  spawnCapBlockedSeconds: number;
  pressureSpawned: Readonly<Record<EnemyPressureRole, number>>;
  activeEnemyProjectiles: number;
  peakEnemyProjectiles: number;
  projectileBudget: number;
  activeFriendlyProjectiles: number;
  peakFriendlyProjectiles: number;
  friendlyProjectileBudget: number;
}

export interface ProjectileSnapshot {
  id: number;
  weaponId: WeaponId;
  position: Vector2Data;
  rotationRadians: number;
  /** Remaining extra targets this projectile may pass through; exposed for combat telemetry and contract tests. */
  pierceRemaining: number;
}

export interface ExperiencePickupSnapshot {
  id: number;
  position: Vector2Data;
  value: number;
}

export interface PowerupPickupSnapshot {
  id: number;
  type: PowerupType;
  position: Vector2Data;
  remainingSeconds: number;
}

export interface SupplyChestSnapshot {
  id: number;
  variant: SupplyChestVariant;
  position: Vector2Data;
  health: number;
  maxHealth: number;
  /** True when the Marine stands close enough to open a sealed chest. */
  playerInRange: boolean;
}

export interface ActiveBuffSnapshot {
  type: PowerupType;
  remainingSeconds: number;
  durationSeconds: number;
}

export interface FenceSnapshot {
  switchPosition: Vector2Data;
  from: Vector2Data;
  to: Vector2Data;
  active: boolean;
  activeRemainingSeconds: number;
  ready: boolean;
  cooldownRemainingSeconds: number;
  playerNearSwitch: boolean;
}

export interface EnemyProjectileSnapshot {
  id: number;
  type: "slime-glob" | "brood-acid" | "quill-spike" | "corrupted-knife" | "prime-biomass";
  position: Vector2Data;
  rotationRadians: number;
}

export interface GroundHazardSnapshot {
  id: number;
  type: "slowing-slime" | "machine-wreck" | "prime-biomass";
  position: Vector2Data;
  radiusMetres: number;
  remainingSeconds: number;
  durationSeconds: number;
}

export interface EliteRewardSnapshot {
  id: number;
  type: "elite-upgrade-cache" | "mini-boss-arsenal-cache" | "aurum-supply-cache";
  position: Vector2Data;
}

export interface EquippedWeaponSnapshot extends EquippedWeapon {
  cooldownRemainingSeconds: number;
  cooldownDurationSeconds: number;
}

export interface HeroCombatPresentation {
  id: HeroDefinition["id"];
  displayName: string;
  passiveId: string;
  passiveName: string;
  evasiveName: string;
  evasiveDurationSeconds: number;
  evasiveRecoverySeconds: number;
  ultimateName: string;
  ultimateCooldownSeconds: number;
}

export interface WeaponInventorySnapshot {
  rack: readonly {
    id: string;
    weaponClass: "light" | "medium" | "heavy" | "unique" | "all";
    tile: WeaponTile | null;
  }[];
  stash: readonly (WeaponTile | null)[];
  capacity: number;
}

export interface CombatSnapshot {
  status: EncounterStatus;
  autoFireEnabled: boolean;
  heroId: HeroDefinition["id"];
  heroPresentation: HeroCombatPresentation;
  activePerkId: PerkId | null;
  transformation: TransformationAffinityState;
  /** Run-long reward items carried through combat so they survive a node. */
  relicIds: readonly RelicId[];
  /** Owned shop items (Brotato overhaul), carried so purchases survive a node. */
  ownedItemIds: readonly string[];
  /** Raw non-catalogue stat grants (level-up cards, shrine grants), carried so they survive a node. */
  itemStats: Partial<PlayerStatBlock>;
  playerStats: EffectivePlayerStats;
  /** Shop stock banned this run; the ban verb is run-long, so it rides the snapshot across nodes. */
  bannedShopIds: readonly string[];
  equippedArtifactId: ArtifactId | null;
  rewardMaxHealthBonus: number;
  rewardWeaponSlotBonus: number;
  waveNumber: number;
  totalWaves: number;
  playerPosition: Vector2Data;
  playerHealth: number;
  playerMaxHealth: number;
  /** Overheal pool, spent before health. Zero unless a heal overflowed. */
  playerBonusHealth: number;
  /** Ceiling on the above, so the HUD can size the overlay. */
  playerMaxBonusHealth: number;
  playerShield: number;
  playerMaxShield: number;
  playerArmour: number;
  /** Rare flat reduction, subtracted after the armour percentage. Reactive Plating grants it. */
  playerFlatDamageReduction: number;
  playerDamageMultiplier: number;
  playerMoveSpeedMultiplier: number;
  weaponProficiencies: Readonly<Record<WeaponClass, number>>;
  playerInvulnerable: boolean;
  playerEntrenched: boolean;
  assaultMomentumStacks: number;
  tacticianDesignatedTargetCount: number;
  evasiveReady: boolean;
  evasiveCooldownRemainingSeconds: number;
  ultimateReady: boolean;
  ultimateCooldownRemainingSeconds: number;
  fence: FenceSnapshot | null;
  heroState: string;
  level: number;
  experience: number;
  experienceForNextLevel: number;
  /** The interactable the player is close enough to act on, if any. */
  worldInteractionPrompt: WorldInteractionPrompt | null;
  /** Player-owned structures currently standing. */
  deployables: readonly DeployableSnapshot[];
  upgradeLevels: readonly { id: UpgradeId; level: number }[];
  upgradeSlots: readonly UpgradeSlotSnapshot[];
  pendingDecision: PendingDecision | null;
  enemies: readonly EnemySnapshot[];
  projectiles: readonly ProjectileSnapshot[];
  enemyProjectiles: readonly EnemyProjectileSnapshot[];
  groundHazards: readonly GroundHazardSnapshot[];
  eventHorizonFields: readonly EventHorizonFieldSnapshot[];
  combatTelegraphs: readonly CombatTelegraphSnapshot[];
  eliteRewards: readonly EliteRewardSnapshot[];
  pickups: readonly ExperiencePickupSnapshot[];
  powerups: readonly PowerupPickupSnapshot[];
  supplyChests: readonly SupplyChestSnapshot[];
  activeBuffs: readonly ActiveBuffSnapshot[];
  uraniumKitAvailable: boolean;
  securedScrap: number;
  weapon: Readonly<WeaponRuntimeStats>;
  equippedWeapons: readonly Readonly<EquippedWeaponSnapshot>[];
  weaponInventory: WeaponInventorySnapshot;
  events: readonly CombatEvent[];
  arena: Readonly<ArenaDefinition>;
  stressProfile: 4 | 12 | null;
  scenario: CombatScenario | null;
  playerSlowed: boolean;
  damagedObstacleIds: readonly string[];
  destroyedObstacleIds: readonly string[];
  terrain: readonly TerrainSnapshot[];
  playerTethered: boolean;
  activeTetherEnemyId: number | null;
  density: DensityTelemetrySnapshot;
  medicTriageHits: number;
  runMetrics: CombatRunMetricsSnapshot;
}

export interface CombatRunMetricsSnapshot {
  kills: number;
  scrapEarned: number;
  damageByWeapon: Readonly<Partial<Record<WeaponId, number>>>;
  damageBySecond: readonly number[];
  suppressedProjectilesByWeapon: Readonly<Partial<Record<WeaponId, number>>>;
  elapsedSeconds: number;
  damageTaken: number;
  eliteKills: number;
  bossDamage: number;
  highestHit: number;
  criticalHits: number;
  damageTakenBySource: Readonly<Record<string, number>>;
  defeatCause: string | null;
}

export interface EnemyState {
  id: number;
  type: EnemyType;
  position: Vector2Data;
  health: number;
  attackCooldownSeconds: number;
  dead: boolean;
  recentDamageRemainingSeconds: number;
  hatchRemainingSeconds: number;
  hatchDurationSeconds: number;
  brainPhase: BrainPhase;
  brainPhaseRemainingSeconds: number;
  brainLungeDirection: Vector2Data;
  spitterPhase: SlimeSpitterPhase;
  spitterPhaseRemainingSeconds: number;
  spitterTarget: Vector2Data;
  mitePhase: BlastMitePhase;
  mitePhaseRemainingSeconds: number;
  survivorPhase: InfectedSurvivorPhase;
  survivorPhaseRemainingSeconds: number;
  survivorStaminaSeconds: number;
  survivorVelocity: Vector2Data;
  corruptedMarinePhase: CorruptedMarinePhase;
  corruptedMarinePhaseRemainingSeconds: number;
  corruptedMarineTarget: Vector2Data;
  abominationBehavior: AbominationBehaviorState;
  nestWeaverPhase: NestWeaverPhase;
  nestWeaverPhaseRemainingSeconds: number;
  nestWeaverTarget: Vector2Data;
  nestWeaverChargesRemaining: number;
  nestWeaverThreatRemaining: number;
  nestPendingReservation: NestPodReservation | null;
  nestPod: NestPodState | null;
  stormChain: StormChainState;
  stormCooldownSeconds: number;
  stormNodeOwnerId: number | null;
  conductiveNode: ConductiveNodeState | null;
  scrapSkittererBehavior: ScrapSkittererState;
  arcWardenBehavior: ArcWardenState;
  reclaimerBehavior: ReclaimerRepairState;
  reclaimerDamagedSinceLastStep: boolean;
  foundryBehavior: FoundryFabricatorState;
  foundryDamagedSinceLastStep: boolean;
  foundryThreatRemaining: number;
  foundryPadOwnerId: number | null;
  foundryChildOwnerId: number | null;
  foundryChildRemainingSeconds: number;
  foundryTurretPhase: "tracking" | "warning" | "recovery";
  foundryTurretPhaseRemainingSeconds: number;
  foundryTurretTarget: Vector2Data;
  warpPhase: WarpFlankerPhase;
  warpPhaseRemainingSeconds: number;
  warpTarget: Vector2Data;
  ripperPhase: RipperPhase;
  ripperPhaseRemainingSeconds: number;
  ripperDirection: Vector2Data;
  razorScuttlerPhase: RazorScuttlerPhase;
  razorScuttlerPhaseRemainingSeconds: number;
  razorScuttlerDirection: Vector2Data;
  razorScuttlerHitPlayer: boolean;
  quillbackPhase: QuillbackPhase;
  quillbackPhaseRemainingSeconds: number;
  quillbackDirection: Vector2Data;
  quillbackAttackCount: number;
  quillbackShotCount: 1 | 3 | 5;
  spinewheelPhase: SpinewheelPhase;
  spinewheelPhaseRemainingSeconds: number;
  spinewheelDirection: Vector2Data;
  spinewheelSpeedMetresPerSecond: number;
  spinewheelBouncesRemaining: number;
  spinewheelPlayerHitCooldownSeconds: number;
  tetherBloomPhase: TetherBloomPhase;
  tetherBloomPhaseRemainingSeconds: number;
  tetherBloomTarget: Vector2Data;
  tetherBloomDamageDuringGrab: number;
  aurumPhase: AurumHoarderPhase;
  aurumPhaseRemainingSeconds: number;
  aurumExitTarget: Vector2Data;
  aurumArmourBreaksPaid: number;
  bastionEaterPhase: BastionEaterPhase;
  bastionEaterAction: BastionEaterAction;
  bastionEaterActionRemainingSeconds: number;
  bastionEaterDirection: Vector2Data;
  bastionEaterTarget: Vector2Data;
  bastionEaterAttackCount: number;
  rank: EnemyRank;
  /**
   * Body-radius multiplier on top of the catalog `radiusMetres`. Only ranked
   * enemies set it (see `spawnMiniBoss`); absent means 1. Always read through
   * `enemyRadius()` so hitbox, separation and silhouette never disagree.
   */
  radiusScale?: number;
  /** Broodbreaker Seal: this egg has already spent its one crack-window stall. */
  broodbreakerStalled?: boolean;
  /** Hunter's Beacon: seconds left in the punish window after a telegraphed miss. */
  missWindowRemainingSeconds?: number;
  eliteKind?: EliteKind;
  carapacePhase: CarapacePhase;
  carapacePhaseRemainingSeconds: number;
  facingDirection: Vector2Data;
  maxHealth: number;
  shield: number;
  maxShield: number;
  armour: number;
  flatDamageReduction: number;
  movementSpeedMultiplier: number;
  damageMultiplier: number;
  miniBossKind?: MiniBossKind;
  siegeCrusherPhase: SiegeCrusherPhase;
  siegeCrusherPhaseRemainingSeconds: number;
  siegeCrusherDirection: Vector2Data;
  siegeCrusherAttackCount: number;
  broodWardenPhase: BroodWardenPhase;
  broodWardenPhaseRemainingSeconds: number;
  broodWardenDirection: Vector2Data;
  broodWardenAttackCount: number;
  broodWardenRushUsed: boolean;
  riftStalkerPhase: RiftStalkerPhase;
  riftStalkerPhaseRemainingSeconds: number;
  riftStalkerMarkTarget: Vector2Data;
  riftStalkerDirection: Vector2Data;
  riftStalkerChainedThisCycle: boolean;
  synapseHeraldBehavior: SynapseHeraldState;
  synapseHeraldLungeIndex: number;
  synapseHeraldHitThisLunge: boolean;
  assemblyPrimeBehavior: AssemblyPrimeState;
  assemblyPrimeDamagedSinceLastStep: boolean;
  assemblyPrimeLaneIndex: number;
  assemblyPrimeLaneCooldownSeconds: number;
  stormRegentBehavior: StormRegentState;
  abominationPrimeBehavior: AbominationPrimeState;
  statusBuildup: Partial<Record<StatusEffectType, number>>;
  statusTimers: Partial<Record<StatusEffectType, number>>;
}

interface ProjectileState {
  id: number;
  weaponId: WeaponId;
  damageType: DamageType;
  position: Vector2Data;
  velocity: Vector2Data;
  damage: number;
  uraniumEligible: boolean;
  remainingSeconds: number;
  pierceRemaining: number;
  explosionRadiusMetres: number;
  knockbackMetres: number;
  chainRemaining: number;
  chainRadiusMetres: number;
  hitEnemyIds: Set<number>;
  dead: boolean;
  /** Seeker Swarm: non-zero steers this projectile toward the nearest live enemy each frame. */
  homingTurnRateRadiansPerSecond: number;
  /** Event Horizon: true trades this projectile's instant explosion for a delayed pull-field + implosion. */
  spawnsGravityWellOnImpact: boolean;
  pullFieldDurationSeconds: number;
  pullStrengthMetresPerSecond: number;
  pullRadiusMetres: number;
  /** Gravity Adept: the first impact of this qualifying attack owns the pulse. */
  triggersGravityPulse?: boolean;
}

/** Event Horizon: a delayed pull-then-implode field left behind by a spent gravity-well projectile. */
interface EventHorizonFieldState {
  id: number;
  position: Vector2Data;
  remainingSeconds: number;
  durationSeconds: number;
  pullStrengthMetresPerSecond: number;
  pullRadiusMetres: number;
  implosionRadiusMetres: number;
  implosionDamage: number;
  damageType: DamageType;
  weaponId: WeaponId;
  kind: "event-horizon" | "gravity-pulse";
}

export interface EventHorizonFieldSnapshot {
  id: number;
  position: Vector2Data;
  remainingSeconds: number;
  durationSeconds: number;
  pullRadiusMetres: number;
  kind: "event-horizon" | "gravity-pulse";
}

interface ExperiencePickupState {
  id: number;
  position: Vector2Data;
  value: number;
  collected: boolean;
}

interface PowerupPickupState {
  id: number;
  type: PowerupType;
  position: Vector2Data;
  remainingSeconds: number;
  collected: boolean;
}

interface SupplyChestState {
  id: number;
  variant: SupplyChestVariant;
  position: Vector2Data;
  health: number;
  maxHealth: number;
  resolved: boolean;
}

interface EnemyProjectileState {
  id: number;
  type: "slime-glob" | "brood-acid" | "quill-spike" | "corrupted-knife" | "prime-biomass";
  sourceEnemyId?: number;
  position: Vector2Data;
  velocity: Vector2Data;
  target: Vector2Data;
  remainingSeconds: number;
  damage: number;
  createsPuddle: boolean;
  dead: boolean;
}

interface GroundHazardState {
  id: number;
  type: "slowing-slime" | "machine-wreck" | "prime-biomass";
  position: Vector2Data;
  radiusMetres: number;
  remainingSeconds: number;
  durationSeconds: number;
  ownerId?: number;
  damageCooldownSeconds?: number;
}

interface RainOfSpinesState {
  id: number;
  ownerId: number;
  targets: readonly Vector2Data[];
  remainingSeconds: number;
  damage: number;
}

interface EliteRewardState {
  id: number;
  type: "elite-upgrade-cache" | "mini-boss-arsenal-cache" | "aurum-supply-cache";
  position: Vector2Data;
  collected: boolean;
}

export interface CombatSimulationOptions {
  widthMetres?: number;
  heightMetres?: number;
  autoStartWaves?: boolean;
  seed?: number;
  startingWeaponCount?: number;
  startingWeaponIds?: readonly WeaponId[];
  arena?: ArenaDefinition;
  stressProfile?: 4 | 12;
  scenario?: CombatScenario;
  startingUraniumKit?: boolean;
  startWithUraniumBuff?: boolean;
  startingScrap?: number;
  expeditionEncounter?: ExpeditionEncounterDescriptor;
  startingBuild?: ExpeditionBuildSnapshot | null;
  /** Deterministic review/test carrier when no expedition build exists. */
  startingTransformation?: TransformationAffinityState;
  perkId?: PerkId | null;
  heroId?: HeroDefinition["id"];
  /** Scene-owned persisted accessibility setting; false keeps pure harnesses explicit. */
  autoFireEnabled?: boolean;
  /**
   * Furnish the arena with themed world objects instead of using the authored
   * Bastion yard's props. Expedition encounters set this from their node theme
   * automatically; passing it directly is the debug/harness route.
   */
  worldObjectTheme?: string;
}

interface EquippedWeaponState extends EquippedWeapon {
  cooldownSeconds: number;
  cooldownDurationSeconds: number;
  projectileCarry: number;
  /** Sawblade: current orbit angle around the player, advanced every frame it's active. */
  orbitAngleRadians: number;
}

const TOTAL_WAVES = 10;
export const PLAYER_MAX_HEALTH = 10;
// Deliberately weak passive regen (0.5 HP per 10s tick = 0.05 HP/s) so active
// healing — Supply Depots, healing shrines/events, the Medic — is worth
// seeking out. Support-effect and Regeneration upgrades scale the per-tick
// amount, never the 10s cadence, so healing always reads as discrete ticks.
export const PLAYER_REGEN_INTERVAL_SECONDS = 10;
export const PLAYER_REGEN_PER_SECOND = 0.05;
/** Authored raw hits against the Marine; exported so the no-one-shot rule is testable. */
export const PLAYER_ATTACK_DAMAGE_BASELINES = Object.freeze({
  slimeGlob: 1.5,
  quillbackSpike: 1.2,
  razorDash: 2.5,
  spinewheelRoll: 2.8,
  blastMiteExplosion: 3,
  ripperSweep: 3,
  crusherCharge: 3.5,
  crusherSweep: 4,
  crusherSweepEnraged: 4.5,
  crusherSweepLastStand: 5,
  crusherSlam: 4.4,
  crusherSlamLastStand: 5,
  broodCleave: 3,
  broodCleaveEnraged: 4,
  broodCleaveLastStand: 5,
  broodAcid: 1.6,
  riftPounce: 3.5,
  riftSlash: 3,
  riftSlashFrenzy: 4,
  riftSpike: 1.4,
  bastionEaterClaw: 5,
  bastionEaterTendril: 4,
  bastionEaterTendrilLastStand: 5,
  bastionEaterBreach: 5,
  stormChain: 2.5,
  scrapSkittererRush: 2.2,
  arcWardenBeam: 2.6,
} as const);
const PLAYER_RADIUS_METRES = 0.55;
const INTERMISSION_SECONDS = 2;
const MAX_SLOWING_PUDDLES = 5;
const SLOWING_PUDDLE_DURATION_SECONDS = 4;
const SLOWING_PUDDLE_RADIUS_METRES = 1.25;
const SLIME_MOVEMENT_MULTIPLIER = 0.55;
/** Field Lattice relic: radius of the chill pulse emitted on a health pickup. */
const FIELD_LATTICE_PULSE_RADIUS_METRES = 3.5;
/** Event Horizon Core artifact: shape of the implosion it arms periodically. */
const ARTIFACT_IMPLOSION_DURATION_SECONDS = 1.1;
const ARTIFACT_IMPLOSION_PULL_SPEED = 5.5;
const ARTIFACT_IMPLOSION_PULL_RADIUS_METRES = 3.4;
const ARTIFACT_IMPLOSION_RADIUS_METRES = 2.4;
/** EMP Charge consumable: stun radius on pickup. */
/** Health fraction at which `on-low-health` item effects fire. */
const LOW_HEALTH_EFFECT_FRACTION = 0.25;
const EMP_CHARGE_RADIUS_METRES = 5;
/** Butcher's Serum consumable: melee damage bonus and how long it lasts. */
const BUTCHERS_SERUM_DURATION_SECONDS = 12;
const BUTCHERS_SERUM_MELEE_MULTIPLIER = 1.6;
/** Riot Plating relic: how close an enemy must be for its armour to count. */
const RIOT_PLATING_RANGE_METRES = 2;
/** Executioner's Mark relic: health fraction at or below which the bonus applies. */
const EXECUTE_HEALTH_FRACTION = 0.3;
/** Overclock Core artifact: seconds a kill stack survives without another kill. */
const OVERCLOCK_STACK_DECAY_SECONDS = 3;
/** Hunter's Beacon relic: punish window after an elite's telegraphed attack misses. */
const ELITE_MISS_WINDOW_SECONDS = 1.5;
/** Broodbreaker Seal artifact: how long a cracking egg is held from hatching. */
/** Broodbreaker Seal artifact: radius of the burst a destroyed egg leaves. */
const BROODBREAKER_BURST_RADIUS_METRES = 2.2;
/** Last Bastion Protocol artifact: brace threshold, duration and cooldown. */
const BRACE_HEALTH_FRACTION = 0.3;
const BRACE_DURATION_SECONDS = 6;
const BRACE_COOLDOWN_SECONDS = 40;
const BRACE_SPREAD_MULTIPLIER = 0.5;
const BRACE_ATTACK_SPEED_MULTIPLIER = 1.35;
/** Salvaged Capacitor relic: how far its every-Nth-hit arc can reach. */
const RELIC_ARC_RADIUS_METRES = 3.2;
const SLIME_GLOB_DAMAGE = PLAYER_ATTACK_DAMAGE_BASELINES.slimeGlob;
const QUILLBACK_SPIKE_DAMAGE = PLAYER_ATTACK_DAMAGE_BASELINES.quillbackSpike;
const QUILLBACK_PROJECTILE_SPEED = 7.5;
const QUILLBACK_PROJECTILE_RANGE_METRES = 11;
const QUILLBACK_FAN_ARC_RADIANS = Math.PI * 64 / 180;
const RAZOR_SCUTTLER_DASH_DAMAGE = PLAYER_ATTACK_DAMAGE_BASELINES.razorDash;
export const ABOMINATION_SLAM_RADIUS_METRES = 1.55;
export const ABOMINATION_SLAM_DAMAGE = 2.6;
export const ABOMINATION_SLAM_TERRAIN_DAMAGE = 5;
const SPINEWHEEL_ROLL_DAMAGE = PLAYER_ATTACK_DAMAGE_BASELINES.spinewheelRoll;
const POWERUP_LIFETIME_SECONDS = 18;
const POWERUP_COLLECT_RADIUS_METRES = 0.7;
export const MEDKIT_HEAL_AMOUNT = 2.5;
/** Ordinary enemies only; specialists and above pay in Scrap instead. */
export const MEDKIT_DROP_CHANCE = 0.06;
/** Medkits linger longer than timed powerups so a hard wave can bank one. */
const MEDKIT_LIFETIME_SECONDS = 30;
export const SUPPLY_CHEST_BASE_HEALTH = 50;
export const SUPPLY_CHEST_HEALTH_PER_WAVE = 8;
const SUPPLY_CHEST_SPAWN_CHANCE = 0.4;
const SUPPLY_CHEST_RADIUS_METRES = 0.6;
const SUPPLY_CHEST_OPEN_RANGE_METRES = 1.4;
const SUPPLY_CHEST_SCRAP = 10;
const OVERCHARGE_ATTACK_SPEED_MULTIPLIER = 1.6;
const ADRENALINE_MOVE_MULTIPLIER = 1.35;
const MAGNET_PULSE_MULTIPLIER = 2.5;
const AEGIS_SHIELD_AMOUNT = 2.5;
export const URANIUM_CORE_ROUNDS_DURATION_SECONDS = 18;
export const URANIUM_CORE_ROUNDS_DAMAGE_MULTIPLIER = 1.25;
export const SIEGE_LOADER_DURATION_SECONDS = 15;
export const SIEGE_LOADER_ATTACK_SPEED_MULTIPLIER = 1.3;
/** A weapon counts as "slow" (and benefits from Siege Loader) once its base cycle is at least this long. */
export const SIEGE_LOADER_SLOW_FIRE_INTERVAL_SECONDS = 1;
export const PHASE_JACKET_DURATION_SECONDS = 12;
export const HUNTER_OPTICS_DURATION_SECONDS = 22;
export const HUNTER_OPTICS_ELITE_DAMAGE_MULTIPLIER = 1.15;
export const LAST_STAND_STIMULANT_DURATION_SECONDS = 9;
export const LAST_STAND_STIMULANT_MOVE_MULTIPLIER = 1.25;
export const LAST_STAND_STIMULANT_ATTACK_SPEED_MULTIPLIER = 1.25;
/** Sawblade: how close an enemy must be to the orbiting blade's current position to take contact damage. */
const ORBIT_BLADE_CONTACT_RADIUS_METRES = 0.35;
const BLAST_MITE_EXPLOSION_RADIUS_METRES = 1.6;
const BLAST_MITE_EXPLOSION_DAMAGE = PLAYER_ATTACK_DAMAGE_BASELINES.blastMiteExplosion;
const COMBUSTION_RADIUS_METRES = 1.3;
const COMBUSTION_DAMAGE = 2.5;
const SUPPLY_DEPOT_HEAL = 4.5;
export const SCRAP_SHOP_PRICES = Object.freeze({
  uraniumKit: 35,
  fieldRepair: 40,
  upgrade: 45,
  armourRetrofit: 50,
  weapon: 60,
} as const);
/** Offers shown per shop visit (Brotato overhaul raised this from 3 to 4). */
export const SCRAP_SHOP_OFFER_COUNT = 4;

export function scrapShopRerollCost(depth: number): number {
  return 10 + Math.max(1, Math.floor(depth)) * 5;
}

export function scrapShopWeaponSaleValue(tier: 1 | 2 | 3, fraction = 0.5): number {
  return Math.floor(SCRAP_SHOP_PRICES.weapon * (2 ** (tier - 1)) * fraction);
}
/**
 * How many weapon lines the shop may stock at once, out of everything unowned.
 * Caps the weapon share of the offer draw now that the pool is 20 rather than 8.
 */
export const SHOP_WEAPON_CANDIDATE_COUNT = 3;
/** A Unique is a real decision against a tier-up, not another Tier I purchase. */
export const SHOP_UNIQUE_WEAPON_PRICE_MULTIPLIER = 3;
const SCRAP_SHOP_REPAIR = 3.5;
/**
 * Overheal ceiling as a fraction of maximum health (§11.3). Half is generous
 * enough to be worth taking a heal at full and small enough that it cannot
 * become a second health bar. Balance-affecting — see wave_balance.md.
 */
const BONUS_HEALTH_CAP_FRACTION = 0.5;
const SCRAP_SHOP_ARMOUR = 3;
const ORDINARY_SCRAP_DROP_CHANCE = 0.25;
const FENCE_ACTIVE_SECONDS = 6;
const FENCE_COOLDOWN_SECONDS = 18;
const FENCE_DAMAGE_PER_SECOND = 4.4;
const FENCE_CONTACT_RANGE_METRES = 0.6;
const FENCE_SWITCH_RANGE_METRES = 1.4;
const ULTIMATE_PROJECTILE_SPEED = 12;
const ULTIMATE_PROJECTILE_LIFETIME_SECONDS = 0.9;
export const MINI_BOSS_POOL: readonly MiniBossKind[] = Object.freeze(["siege-crusher", "brood-warden", "rift-stalker"]);
export const RIFT_STALKER_POUNCE_RADIUS_METRES = 1.6;
/** Cloaked stalk and warp travel take reduced damage; every other phase is a punish window. */
export const RIFT_STALKER_CLOAK_DAMAGE_MULTIPLIER = 0.55;
const RIFT_STALKER_SLASH_HALF_ARC_RADIANS = Math.PI * 50 / 180;
const RIFT_STALKER_SPIKE_SPEED = 8;
const RIFT_STALKER_SPIKE_RANGE_METRES = 9;

const POWERUP_DURATION_SECONDS: Readonly<Record<PowerupType, number>> = Object.freeze({
  overcharge: 9,
  aegis: 0,
  adrenaline: 8,
  "magnet-pulse": 9,
  "uranium-core-rounds": URANIUM_CORE_ROUNDS_DURATION_SECONDS,
  medkit: 0,
  "siege-loader": SIEGE_LOADER_DURATION_SECONDS,
  "phase-jacket": PHASE_JACKET_DURATION_SECONDS,
  "hunter-optics": HUNTER_OPTICS_DURATION_SECONDS,
  "last-stand-stimulant": LAST_STAND_STIMULANT_DURATION_SECONDS,
  // Instant: detonates on pickup rather than running as a buff.
  "emp-charge": 0,
  "butchers-serum": BUTCHERS_SERUM_DURATION_SECONDS,
});

/**
 * Wave-drop rotation. `medkit` is deliberately absent — supply chests and the
 * Symbiote Heart drop it, so cycling it here too would flood healing.
 *
 * Ordering alternates offence with defence/utility so two consecutive waves
 * never hand out the same flavour of buff.
 */
const POWERUP_WAVE_CYCLE: readonly PowerupType[] = Object.freeze([
  "overcharge", "magnet-pulse", "adrenaline", "aegis",
  "uranium-core-rounds", "phase-jacket", "siege-loader", "emp-charge",
  "hunter-optics", "last-stand-stimulant", "butchers-serum",
]);

const GRAVITY_PULSE_DURATION_SECONDS = 0.35;
const GRAVITY_PULSE_PULL_SPEED_METRES_PER_SECOND = 5;

export class CombatSimulation {
  readonly widthMetres: number;
  readonly heightMetres: number;
  readonly arena: Readonly<ArenaDefinition>;

  private readonly hero: HeroDefinition;
  private readonly heroMotion: HeroMotionController;
  private defence: HeroDefinition["defence"];
  private moveSpeedMultiplier = 1;
  private levelDamageMultiplier = 1;
  private levelSpeedMultiplier = 1;
  private supportEffectMultiplier = 1;
  private weaponProficiencies: Record<WeaponClass, number>;
  private readonly upgradeLevels = new Map<UpgradeId, number>();
  private readonly upgradeSlotCapacity: Record<UpgradeCategory, number>;
  private explosionSplashMultiplier = 0.5;
  /** Player-side elemental tuning advanced by upgrade path levels. */
  private readonly statusTuning = {
    buildupMultiplier: {} as Partial<Record<DamageType, number>>,
    blazeBonusDamagePerSecond: 0,
    corrodeBonusDamagePerSecond: 0,
    freezeSpeedMultiplierOverride: null as number | null,
    freezeDurationBonusSeconds: 0,
    combustionOnDeath: false,
  };
  private stationarySeconds = 0;
  private ultimateCooldownRemainingSeconds = 0;
  private fenceActiveRemainingSeconds = 0;
  private fenceCooldownRemainingSeconds = 0;
  private playerPosition: Vector2Data;
  private playerHealth = PLAYER_MAX_HEALTH;
  private playerMaxHealth = PLAYER_MAX_HEALTH;
  /**
   * Overheal as a separate pool (§11.3 option B) rather than by letting
   * `playerHealth` exceed its maximum. Nothing else changes: the six
   * `Math.min(playerMaxHealth, ...)` clamps stay exactly as they are, and
   * `maxHpFlat`/`maxHpPercent` keep meaning what they mean now.
   */
  private playerBonusHealth = 0;
  private regenerationRemainingSeconds = PLAYER_REGEN_INTERVAL_SECONDS;
  private playerShield: number;
  private medicTriageHits = 0;
  private assaultMomentumTargetId: number | null = null;
  private assaultMomentumStacks = 0;
  private assaultMomentumRemainingSeconds = 0;
  private readonly tacticianDesignations = new Map<number, number>();
  private scoutSlipstreamRemainingSeconds = 0;
  private shieldRechargeCooldownSeconds = 0;
  private playerInvulnerable = false;
  private heroState = "idle";
  private playerHurtCooldownSeconds = 0;
  private evasiveReady = true;
  private evasiveCooldownRemainingSeconds = 0;
  private readonly equippedWeapons: EquippedWeaponState[];
  private weaponInventory: WeaponInventoryState;
  private readonly perkModifiers: PerkRunModifiers;
  private readonly activePerkId: PerkId | null;
  private readonly transformation: TransformationAffinityState;
  private readonly transformationModifiers: TransformationRunModifiers;
  /** Unified resolved player stat vector (Brotato overhaul); read for damage, crit, and economy. */
  /**
   * Unified resolved stat vector. Mutable because shop purchases change it
   * mid-run: `refreshPlayerStats()` re-resolves it and reconciles the two stats
   * that are applied once rather than read live (armour, max health).
   */
  private playerStats: PlayerStatBlock;
  private rawPlayerStats: PlayerStatBlock;
  private cappedPlayerStatKeys: readonly (keyof PlayerStatBlock)[] = [];
  private lifestealWindowRemainingSeconds = 0;
  private lifestealWindowPaid = 0;
  /** Owned shop item ids; the source of truth folded into `playerStats`. */
  private ownedItemIds: string[] = [];
  /** Item armour already added to `defence.armour`, so refreshes apply only the delta. */
  private appliedItemArmour = 0;
  /** Non-melee hit counter driving Salvaged Capacitor's every-Nth chain arc. */
  private relicArcAttackCount = 0;
  /** Event Horizon Core: seconds until the next impact is armed as an implosion. */
  private eventHorizonCoreCooldownSeconds = 0;
  private eventHorizonCoreArmed = false;
  /** Last Bastion Protocol: brace window and its long cooldown. */
  private braceRemainingSeconds = 0;
  private braceCooldownSeconds = 0;
  /** Null Field: whether this wave's free hit has been spent. */
  private nullFieldSpentThisWave = false;
  /** Bastion Beacon: the one revive per run. */
  private bastionBeaconSpent = false;
  /** Overclock Core: current kill stacks and the decay timer. */
  private overclockStacks = 0;
  private overclockDecaySeconds = 0;
  /** Psionic "Telekinetic Focus": qualifying-hit counter. */
  private telekineticAttackCount = 0;
  /** Void "Gravity Adept": counts discrete projectile attacks, not pellets/hits. */
  private gravityPulseAttackCount = 0;
  /** Mutagenic "Reactive Blood": retaliation burst cooldown. */
  private retaliationCooldownSeconds = 0;
  /** Alien "Feeding Tendrils": rolling heal window and the amount already paid in it. */
  private nearbyKillHealWindowSeconds = 0;
  private nearbyKillHealPaid = 0;
  /** Raw non-item stat grants carried on the build (level-up cards, shrine grants, tests). */
  private baseItemStats: Partial<PlayerStatBlock>;
  /** Run-long reward items (Task 94), resolved into combat effects and carried through the snapshot. */
  private readonly relicModifiers: RelicRunModifiers;
  private readonly ownedRelicIds: readonly RelicId[];
  private readonly equippedArtifactId: ArtifactId | null;
  private readonly rewardMaxHealthBonus: number;
  private readonly rewardWeaponSlotBonus: number;
  private experienceCarry = 0;
  private magnetMultiplier = 1;
  /** Scrap gain from upgrades; multiplies with the relic and harvesting paths. */
  private upgradeScrapMultiplier = 1;
  private lastAimDirection: Vector2Data = { x: 1, y: 0 };
  private enemies: EnemyState[] = [];
  private projectiles: ProjectileState[] = [];
  private enemyProjectiles: EnemyProjectileState[] = [];
  private readonly friendlyProjectilePool: ProjectileState[] = [];
  private readonly friendlyProjectileBudget = new FriendlyProjectileBudget();
  private readonly hostileProjectilePool: EnemyProjectileState[] = [];
  private groundHazards: GroundHazardState[] = [];
  private eventHorizonFields: EventHorizonFieldState[] = [];
  private rainOfSpines: RainOfSpinesState[] = [];
  private eliteRewards: EliteRewardState[] = [];
  private powerups: PowerupPickupState[] = [];
  private supplyChests: SupplyChestState[] = [];
  private readonly activeBuffs = new Map<PowerupType, number>();
  private uraniumKitAvailable: boolean;
  /**
   * Unique-class weapons are earned, not drawn (`weaponPoolFor`). The first
   * ranked kill of the run — mini-boss or boss — opens them to both the Weapon
   * Chest and the shop's weapon line. Deliberately a flag rather than an extra
   * `random()` draw: the RNG stream position is part of the replay digest.
   */
  private uniqueWeaponsUnlocked = false;
  private readonly obstacleHealth = new Map<string, number>();
  /** Hold-to-act state per placed interactable, keyed by obstacle id. */
  private readonly worldInteractions = new Map<string, WorldInteractionState>();
  /** Player-owned structures placed by `attackPattern: "deployable"` weapons. */
  private deployables: DeployableState[] = [];
  /** Kills so far this run, for behavioural items that fire every Nth kill. */
  private itemEffectKillCount = 0;
  /** Remaining seconds and size of the current behavioural damage window. */
  private itemDamageWindowSeconds = 0;
  private itemDamageWindowFraction = 0;
  /** `on-low-health` fires once per wave, so a dip cannot be farmed. */
  private lowHealthEffectSpentThisWave = false;
  /** Fractional carry so hazard damage-per-second lands in whole, readable ticks. */
  private hazardDamageAccumulator = 0;
  private readonly obstacleHitRemainingSeconds = new Map<string, number>();
  private pickups: ExperiencePickupState[] = [];
  private nextEntityId = 1;
  private status: EncounterStatus = "combat";
  private waveIndex = 0;
  private waveElapsedSeconds = 0;
  private intermissionRemainingSeconds = 0;
  private spawnQueue: DirectorSpawnPlan[] = [];
  private waveLiveCap = 0;
  private waveThreatBudget = 0;
  private waveThreatSpawned = 0;
  private waveDurationSeconds: number | null = null;
  private waveEndsOnTimer = false;
  private densityPeakLiveEnemies = 0;
  private densitySpawnedThisWave = 0;
  private densitySpawnCapBlockedSeconds = 0;
  private densityPeakEnemyProjectiles = 0;
  private densityPeakFriendlyProjectiles = 0;
  private densityPressureSpawned: Record<EnemyPressureRole, number> = {
    pursuit: 0, ranged: 0, specialist: 0, boss: 0,
  };
  private securedScrap = 0;
  private runKills = 0;
  private runScrapEarned = 0;
  private readonly runDamageByWeapon: Partial<Record<WeaponId, number>> = {};
  private readonly runDamageBySecond: number[] = [];
  private runElapsedSeconds = 0;
  private runDamageTaken = 0;
  private runEliteKills = 0;
  private runBossDamage = 0;
  private runHighestHit = 0;
  private runCriticalHits = 0;
  private readonly runDamageTakenBySource: Record<PlayerDamageSource, number> = {
    generic: 0,
    contact: 0,
    projectile: 0,
    explosive: 0,
    hazard: 0,
  };
  private runDefeatCause: string | null = null;
  private aurumSpawnedThisWave = false;
  private level = 1;
  private experience = 0;
  private decisionQueue: PendingDecision[] = [];
  private shopOffers: DecisionOption[] | null = null;
  private shopLockedOfferId: string | null = null;
  /** Offers banned from restocking for the rest of the run (Brotato's ban verb). */
  private readonly shopBannedIds = new Set<string>();
  private shopRerollUsed = false;
  private shopMode: "offers" | "manage" | "sell" = "offers";
  /** Which themed stock the open shop is drawing from (Phase 4 liberation nodes). */
  private shopProfileId: ShopProfileId = DEFAULT_SHOP_PROFILE_ID;
  private randomState: number;
  private readonly wavesEnabled: boolean;
  private frameEvents: CombatEvent[] = [];
  private readonly stressProfile: 4 | 12 | null;
  private readonly scenario: CombatScenario | null;
  private readonly expeditionEncounter: ExpeditionEncounterDescriptor | null;
  private expeditionWaveIndex = 0;
  private readonly expeditionRewardedWaves = new Set<number>();
  private expeditionPostEncounterShopQueued = false;
  private activeTetherEnemyId: number | null = null;
  private nestReservedLiveSlots = 0;
  private nestReservedThreat = 0;
  private foundryReservedLiveSlots = 0;
  private foundryReservedThreat = 0;
  private pendingWeaponTile: WeaponTile | null = null;
  private autoFireEnabled: boolean;

  constructor(options: CombatSimulationOptions = {}) {
    this.autoFireEnabled = options.autoFireEnabled ?? false;
    this.hero = heroDefinition(options.heroId ?? "marine");
    this.heroMotion = new HeroMotionController(this.hero);
    this.defence = { ...this.hero.defence };
    this.weaponProficiencies = { ...this.hero.weaponProficiencies };
    this.upgradeSlotCapacity = { ...this.hero.upgradeSlots };
    this.playerShield = this.hero.defence.maxShield;
    this.playerMaxHealth = Math.round(this.hero.baseMaxHealth);
    this.playerHealth = this.playerMaxHealth;
    this.arena = options.arena ?? furnishArena(BASTION_ARENA, options);
    this.seedWorldInteractions();
    this.widthMetres = options.widthMetres ?? this.arena.widthMetres;
    this.heightMetres = options.heightMetres ?? this.arena.heightMetres;
    this.playerPosition = {
      x: this.widthMetres / 2,
      y: this.heightMetres / 2,
    };
    this.randomState = options.seed ?? 0x5a17b45;
    this.stressProfile = options.stressProfile ?? null;
    this.scenario = options.scenario ?? null;
    this.expeditionEncounter = options.expeditionEncounter ?? null;
    this.activePerkId = options.perkId ?? null;
    this.transformation = options.startingBuild?.transformation || options.startingTransformation
      ? cloneTransformationAffinityState(options.startingBuild?.transformation ?? options.startingTransformation)
      : createTransformationAffinityState();
    this.transformationModifiers = resolveTransformationModifiers(this.transformation);
    this.perkModifiers = resolvePerkModifiers(this.activePerkId);
    this.ownedRelicIds = options.startingBuild?.relicIds ? [...options.startingBuild.relicIds] : [];
    this.equippedArtifactId = options.startingBuild?.equippedArtifactId ?? null;
    this.rewardMaxHealthBonus = Number.isFinite(options.startingBuild?.maxHealthBonus)
      ? options.startingBuild!.maxHealthBonus!
      : 0;
    this.rewardWeaponSlotBonus = Math.max(0, Math.floor(options.startingBuild?.weaponSlotBonus ?? 0));
    const resolvedRelicModifiers = resolveRelicModifiers(this.ownedRelicIds, this.equippedArtifactId);
    const bonusLifestealPerKill = Math.max(0, options.startingBuild?.bonusLifestealPerKill ?? 0);
    this.relicModifiers = bonusLifestealPerKill > 0
      ? { ...resolvedRelicModifiers, lifestealPerKill: resolvedRelicModifiers.lifestealPerKill + bonusLifestealPerKill }
      : resolvedRelicModifiers;
    // Kinetic Greaves: further evasive travel, slightly longer recovery. Set
    // here rather than at construction because the relic bag resolves above.
    // Kinetic Greaves and the Psionic "Rift Step" / Cybernetic "Rigid Shell"
    // transformation traits both land here and compose multiplicatively.
    this.heroMotion.setEvasiveModifiers({
      distanceMultiplier: this.relicModifiers.evasiveDistanceMultiplier
        * this.transformationModifiers.evasiveDistanceMultiplier,
      recoveryMultiplier: this.relicModifiers.evasiveRecoveryMultiplier
        * this.transformationModifiers.evasiveCooldownMultiplier,
    });
    this.baseItemStats = { ...(options.startingBuild?.itemStats ?? {}) };
    this.ownedItemIds = [...(options.startingBuild?.ownedItemIds ?? [])];
    // The ban verb's contract is run-long, so bans arrive from the build rather
    // than starting empty at every node.
    for (const bannedId of options.startingBuild?.bannedShopIds ?? []) this.shopBannedIds.add(bannedId);
    this.rawPlayerStats = this.resolveCurrentPlayerStats();
    this.playerStats = applyPlayerStatLimits(this.rawPlayerStats).effective;
    this.securedScrap = Math.max(0, Math.floor(
      options.startingBuild?.scrap ?? options.startingScrap ?? (this.scenario === "scrap-shop" ? 150 : 0),
    ));
    this.uraniumKitAvailable = options.startingUraniumKit ?? false;
    if (options.startWithUraniumBuff) {
      this.activeBuffs.set("uranium-core-rounds", URANIUM_CORE_ROUNDS_DURATION_SECONDS);
    }
    // Kits carried in from a Shrine/Event's grantConsumable outcome (Phase 2) become
    // immediately active for this combat; the next build snapshot naturally drops
    // the field, so this is a one-fight grant, not a standing buff.
    for (const carriedType of options.startingBuild?.carriedConsumables ?? []) {
      this.activeBuffs.set(
        carriedType,
        Math.max(this.activeBuffs.get(carriedType) ?? 0, POWERUP_DURATION_SECONDS[carriedType]),
      );
    }
    this.wavesEnabled = options.autoStartWaves !== false
      && this.stressProfile === null
      && this.scenario === null
      && this.expeditionEncounter === null;
    const carriedWeaponIds = options.startingBuild?.weapons
      .map((weapon) => weapon.weaponId)
      .filter((weaponId): weaponId is WeaponId => weaponId in WEAPON_CATALOG);
    const heroStartingWeaponId = this.hero.startingWeaponId in WEAPON_CATALOG
      ? this.hero.startingWeaponId as WeaponId
      : "bastion-service-rifle";
    const initialLoadout = carriedWeaponIds && carriedWeaponIds.length > 0
      ? createWeaponLoadout(carriedWeaponIds)
      : options.startingWeaponIds
      ? createWeaponLoadout(options.startingWeaponIds)
      : createWeaponLoadout(Array.from(
        { length: clampWeaponCount(options.startingWeaponCount ?? 1) },
        () => heroStartingWeaponId,
      ));
    this.equippedWeapons = initialLoadout.map((weapon) => ({
      ...weapon,
      cooldownSeconds: 0,
      cooldownDurationSeconds: 0,
      projectileCarry: initialProjectileCarry(weapon.instanceId),
      orbitAngleRadians: 0,
    }));
    const rackClasses: ("light" | "medium" | "heavy" | "unique" | "all")[] = [...this.hero.rackClasses];
    while (rackClasses.length < this.equippedWeapons.length) rackClasses.push("all");
    // Weapon slots granted by Shrine/Event rewards are flexible "all" mounts.
    for (let slot = 0; slot < this.rewardWeaponSlotBonus; slot += 1) rackClasses.push("all");
    this.weaponInventory = createWeaponInventory(rackClasses, this.equippedWeapons.map((weapon) => ({
      instanceId: weapon.instanceId,
      weaponId: weapon.weaponId,
      weaponClass: weapon.stats.weaponClass,
      tier: 1,
    })), 4 + this.perkModifiers.inventoryBonusSlots);

    if (options.startingBuild) {
      this.restoreExpeditionBuild(options.startingBuild);
    } else if (this.perkModifiers.startingLevel > 1) {
      this.level = this.perkModifiers.startingLevel;
      this.applyLevelGrowth();
    }
    // Committed transformation path effects (Phase 3) + item armour (Brotato
    // overhaul), applied once on top of whichever base defence/health the branch
    // above resolved. `rewardAdjustedMaxHealth` already folded item max-HP stats
    // into `playerMaxHealth`, so only the transformation multiplier lands here.
    this.defence.armour += this.transformationModifiers.armourBonus + this.playerStats.armourFlat;
    this.appliedItemArmour = this.playerStats.armourFlat;
    this.defence.maxShield += this.transformationModifiers.maxShieldBonus;
    this.playerMaxHealth = Math.max(
      3,
      Math.round(this.playerMaxHealth * this.transformationModifiers.maxHealthMultiplier),
    );
    this.applyEffectivePlayerStatLimits();
    this.playerHealth = Math.min(this.playerHealth, this.playerMaxHealth);
    if (this.transformationModifiers.droneShotDamage > 0) {
      this.spawnAuxiliaryDrone(this.transformationModifiers.droneShotDamage);
    }

    if (this.expeditionEncounter !== null) {
      this.populateExpeditionEncounter(this.expeditionEncounter);
    } else if (this.stressProfile !== null) {
      this.populateStressScenario(this.stressProfile);
    } else if (this.scenario !== null) {
      populateScenario(this.scenario, this.scenarioPopulationContext());
    } else if (this.wavesEnabled) {
      this.beginWave(0);
    }
  }

  step(intent: PlayerIntent, deltaSeconds: number): CombatSnapshot {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.05);
    this.frameEvents = [];
    for (const enemy of this.enemies) {
      enemy.recentDamageRemainingSeconds = Math.max(0, enemy.recentDamageRemainingSeconds - delta);
    }
    this.lifestealWindowRemainingSeconds = Math.max(0, this.lifestealWindowRemainingSeconds - delta);
    if (this.lifestealWindowRemainingSeconds <= 0) this.lifestealWindowPaid = 0;
    for (const [id, remaining] of this.obstacleHitRemainingSeconds) {
      const next = Math.max(0, remaining - delta);
      if (next === 0) this.obstacleHitRemainingSeconds.delete(id);
      else this.obstacleHitRemainingSeconds.set(id, next);
    }

    if (this.status === "defeat" || this.status === "victory" || this.decisionQueue.length > 0) {
      return this.snapshot();
    }
    this.runElapsedSeconds += delta;

    for (const weapon of this.equippedWeapons) {
      weapon.cooldownSeconds = Math.max(0, weapon.cooldownSeconds - delta);
    }
    this.playerHurtCooldownSeconds = Math.max(0, this.playerHurtCooldownSeconds - delta);
    this.ultimateCooldownRemainingSeconds = Math.max(0, this.ultimateCooldownRemainingSeconds - delta);
    this.scoutSlipstreamRemainingSeconds = Math.max(0, this.scoutSlipstreamRemainingSeconds - delta);
    this.updateAssaultMomentum(delta);
    this.updateTacticianDesignations(delta);
    this.updateArtifactTimers(delta);
    this.updateBuffs(delta);
    this.updateRegeneration(delta);
    this.updateShieldRecharge(delta);
    this.updateFence(intent, delta);
    this.updateArenaHazards(delta);

    const previousHeroState = this.heroState;
    const motionFrame = this.heroMotion.update(intent, delta);
    this.heroState = motionFrame.state;
    this.playerInvulnerable = motionFrame.isInvulnerable;
    this.evasiveReady = motionFrame.evasiveReady;
    this.evasiveCooldownRemainingSeconds = motionFrame.evasiveCooldownRemainingSeconds;
    if (this.hero.id === "scout" && previousHeroState !== "evading" && motionFrame.state === "evading") {
      this.scoutSlipstreamRemainingSeconds = this.hero.passive.postEvasiveAttackSpeedDurationSeconds ?? 0;
    }
    if (intent.move.x !== 0 || intent.move.y !== 0 || motionFrame.state === "evading") {
      this.stationarySeconds = 0;
    } else {
      this.stationarySeconds += delta;
    }
    let movementMultiplier = motionFrame.state !== "evading" && this.isPlayerSlowed()
      ? resolveSlowedMultiplier(SLIME_MOVEMENT_MULTIPLIER, this.defence.slowResistance)
      : 1;
    if (motionFrame.state !== "evading") {
      // Arena slime slows you through the same resistance stat enemy slime uses;
      // an evasive move still carries you clear of it.
      const hazardSlow = this.arenaHazardMovementMultiplier();
      if (hazardSlow < 1) {
        movementMultiplier *= resolveSlowedMultiplier(hazardSlow, this.defence.slowResistance);
      }
      movementMultiplier *= this.moveSpeedMultiplier * this.levelSpeedMultiplier;
      if (this.isBuffActive("adrenaline")) {
        movementMultiplier *= ADRENALINE_MOVE_MULTIPLIER;
      }
      if (this.isBuffActive("last-stand-stimulant")) {
        movementMultiplier *= LAST_STAND_STIMULANT_MOVE_MULTIPLIER;
      }
      movementMultiplier *= this.transformationModifiers.movementSpeedMultiplier;
      movementMultiplier *= 1 + this.playerStats.moveSpeedPercent / 100;
    }

    if (intent.ultimatePressed && this.ultimateCooldownRemainingSeconds <= 0) {
      this.fireUltimate();
    }
    if (intent.kitPressed && this.uraniumKitAvailable) {
      this.uraniumKitAvailable = false;
      this.applyPowerup("uranium-core-rounds");
      this.frameEvents.push({
        type: "kit-activated",
        position: { ...this.playerPosition },
        powerupType: "uranium-core-rounds",
      });
    }
    const previousPlayerPosition = { ...this.playerPosition };
    this.playerPosition = resolveCircleMovement(
      previousPlayerPosition,
      {
        x: previousPlayerPosition.x + motionFrame.displacementMetres.x * movementMultiplier,
        y: previousPlayerPosition.y + motionFrame.displacementMetres.y * movementMultiplier,
      },
      PLAYER_RADIUS_METRES,
      this.collisionArena(),
    );

    if (intent.aim.x !== 0 || intent.aim.y !== 0) {
      this.lastAimDirection = normalizeVector(intent.aim);
    }

    const attackSpeed = this.currentAttackSpeedMultiplier();
    const siegeLoaderActive = this.isBuffActive("siege-loader");
    for (const weapon of this.equippedWeapons) {
      if (shouldWeaponFire(weapon.stats, this.autoFireEnabled, intent.fireHeld) && weapon.cooldownSeconds <= 0) {
        const fireDirection = this.resolveWeaponAimDirection(weapon, this.lastAimDirection);
        if (fireDirection) {
          this.fireWeapon(weapon, fireDirection, delta);
          // Beam and orbit-blade weapons tick continuously every active frame; they never go on cooldown.
          if (weapon.stats.attackPattern !== "beam" && weapon.stats.attackPattern !== "orbit-blade") {
            const weaponAttackSpeed = attackSpeed
              * (siegeLoaderActive && weapon.stats.fireIntervalSeconds >= SIEGE_LOADER_SLOW_FIRE_INTERVAL_SECONDS
                ? SIEGE_LOADER_ATTACK_SPEED_MULTIPLIER
                : 1);
            weapon.cooldownDurationSeconds = weapon.stats.fireIntervalSeconds / weaponAttackSpeed;
            weapon.cooldownSeconds = weapon.cooldownDurationSeconds;
          }
        }
      }
    }

    if ((this.wavesEnabled || this.expeditionEncounter !== null) && this.status === "combat") {
      this.updateWaveSpawns(delta);
    }

    this.updateEnemies(delta);
    this.updateSupplyChests(intent);
    this.updateWorldInteractions(intent, delta);
    this.updateDeployables(delta);
    this.updateItemEffectWindows(delta);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);
    this.updateRainOfSpines(delta);
    this.updateGroundHazards(delta);
    this.updateEventHorizonFields(delta);
    this.updateExperiencePickups(delta);
    this.updatePowerups(delta);
    this.updateEliteRewards();
    this.resolveEnemyContactDamage();
    this.removeDeadEntities();
    this.densityPeakLiveEnemies = Math.max(
      this.densityPeakLiveEnemies,
      this.enemies.filter((enemy) => !enemy.dead && enemy.type !== "foundry-pad").length,
    );
    this.densityPeakEnemyProjectiles = Math.max(this.densityPeakEnemyProjectiles, this.enemyProjectiles.length);
    this.densityPeakFriendlyProjectiles = Math.max(this.densityPeakFriendlyProjectiles, this.projectiles.length);
    if (this.wavesEnabled || this.expeditionEncounter !== null) {
      this.updateEncounterProgress(delta);
    }

    return this.snapshot();
  }

  spawnEnemy(type: EnemyType, position?: Vector2Data): number {
    const definition = ENEMY_CATALOG[type];
    // Authored stat blocks own their own scaling: every mini-boss kind goes
    // through `spawnMiniBoss`, and the boss through `spawnBastionEater`, so the
    // generic path must not pre-scale them. This list previously omitted
    // synapse-herald / assembly-prime / storm-regent, which briefly took real
    // wave scaling here before being overwritten.
    const authoredBoss = isMiniBossKind(type) || type === "bastion-eater";
    const scaling = waveScaling(this.waveIndex + 1, type, { boss: authoredBoss });
    const scaledMaxHealth = scaleEnemyHealth(definition.maxHealth, scaling);
    const spawnPosition = position ? { ...position } : this.nextEdgeSpawn(definition.radiusMetres);
    const id = this.nextId();

    this.enemies.push({
      id,
      type,
      position: spawnPosition,
      health: scaledMaxHealth,
      maxHealth: scaledMaxHealth,
      shield: scaling.maxShield,
      maxShield: scaling.maxShield,
      armour: definition.armour + scaling.armourBonus,
      flatDamageReduction: definition.flatDamageReduction,
      movementSpeedMultiplier: scaling.speedMultiplier,
      damageMultiplier: scaling.damageMultiplier,
      attackCooldownSeconds: 0,
      dead: false,
      recentDamageRemainingSeconds: 0,
      hatchRemainingSeconds: type === "egg-cluster" ? 6 : 0,
      hatchDurationSeconds: type === "egg-cluster" ? 6 : 0,
      brainPhase: "drift",
      brainPhaseRemainingSeconds: type === "brain-blob" ? 1.5 + this.random() : 0,
      brainLungeDirection: { x: 0, y: 0 },
      spitterPhase: "positioning",
      spitterPhaseRemainingSeconds: type === "slime-spitter" ? 0.8 + this.random() * 0.5 : 0,
      spitterTarget: { ...this.playerPosition },
      mitePhase: "chase",
      mitePhaseRemainingSeconds: 0,
      survivorPhase: "hesitate",
      survivorPhaseRemainingSeconds: type === "infected-survivor" ? 0.3 + (id % 3) * 0.12 : 0,
      survivorStaminaSeconds: type === "infected-survivor" ? INFECTED_SURVIVOR_MAX_STAMINA_SECONDS : 0,
      survivorVelocity: { x: 0, y: 0 },
      corruptedMarinePhase: "positioning",
      corruptedMarinePhaseRemainingSeconds: type === "corrupted-marine" ? 0.55 + (id % 2) * 0.2 : 0,
      corruptedMarineTarget: { ...this.playerPosition },
      abominationBehavior: createAbominationBehavior(),
      nestWeaverPhase: "positioning",
      nestWeaverPhaseRemainingSeconds: type === "nest-weaver" ? 0.8 : 0,
      nestWeaverTarget: { ...spawnPosition },
      nestWeaverChargesRemaining: type === "nest-weaver" ? NEST_WEAVER_PLACEMENT_CHARGES : 0,
      nestWeaverThreatRemaining: type === "nest-weaver" ? 15 : 0,
      nestPendingReservation: null,
      nestPod: null,
      stormChain: createIdleStormChain(),
      stormCooldownSeconds: type === "storm-savant" ? 0.8 : 0,
      stormNodeOwnerId: null,
      conductiveNode: null,
      scrapSkittererBehavior: createScrapSkittererBehavior(),
      arcWardenBehavior: createArcWardenBehavior(),
      reclaimerBehavior: createReclaimerRepairBehavior(),
      reclaimerDamagedSinceLastStep: false,
      foundryBehavior: createFoundryFabricatorBehavior(),
      foundryDamagedSinceLastStep: false,
      foundryThreatRemaining: type === "foundry-fabricator" ? 7 : 0,
      foundryPadOwnerId: null,
      foundryChildOwnerId: null,
      foundryChildRemainingSeconds: 0,
      foundryTurretPhase: "tracking",
      foundryTurretPhaseRemainingSeconds: 0,
      foundryTurretTarget: { ...this.playerPosition },
      warpPhase: "stalk",
      warpPhaseRemainingSeconds: type === "warp-flanker" ? 1.2 : 0,
      warpTarget: { x: 0, y: 0 },
      ripperPhase: "pursuit",
      ripperPhaseRemainingSeconds: type === "ripper" ? 0.35 : 0,
      ripperDirection: { x: 0, y: 0 },
      razorScuttlerPhase: "pursuit",
      razorScuttlerPhaseRemainingSeconds: type === "razor-scuttler" ? 0.65 : 0,
      razorScuttlerDirection: normalizeVector({
        x: this.playerPosition.x - spawnPosition.x,
        y: this.playerPosition.y - spawnPosition.y,
      }),
      razorScuttlerHitPlayer: false,
      quillbackPhase: "positioning",
      quillbackPhaseRemainingSeconds: type === "quillback" ? 0.55 : 0,
      quillbackDirection: { x: 0, y: 0 },
      quillbackAttackCount: 0,
      quillbackShotCount: 1,
      spinewheelPhase: "positioning",
      spinewheelPhaseRemainingSeconds: type === "spinewheel" ? 0.6 : 0,
      spinewheelDirection: normalizeVector({
        x: this.playerPosition.x - spawnPosition.x,
        y: this.playerPosition.y - spawnPosition.y,
      }),
      spinewheelSpeedMetresPerSecond: SPINEWHEEL_BASE_ROLL_SPEED,
      spinewheelBouncesRemaining: SPINEWHEEL_MAX_REBOUNDS,
      spinewheelPlayerHitCooldownSeconds: 0,
      tetherBloomPhase: "idle",
      tetherBloomPhaseRemainingSeconds: type === "tether-bloom" ? 0.5 : 0,
      tetherBloomTarget: { ...this.playerPosition },
      tetherBloomDamageDuringGrab: 0,
      aurumPhase: "forage",
      aurumPhaseRemainingSeconds: type === "aurum-hoarder" ? AURUM_HOARDER_FORAGE_SECONDS : 0,
      aurumExitTarget: selectAurumExit(
        spawnPosition,
        this.playerPosition,
        this.widthMetres,
        this.heightMetres,
      ),
      aurumArmourBreaksPaid: 0,
      bastionEaterPhase: "breach",
      bastionEaterAction: "entrance",
      bastionEaterActionRemainingSeconds: type === "bastion-eater" ? 1.2 : 0,
      bastionEaterDirection: normalizeVector({
        x: this.playerPosition.x - spawnPosition.x,
        y: this.playerPosition.y - spawnPosition.y,
      }),
      bastionEaterTarget: { ...this.playerPosition },
      bastionEaterAttackCount: 0,
      rank: "standard",
      carapacePhase: "pursuit",
      carapacePhaseRemainingSeconds: 0,
      facingDirection: normalizeVector({
        x: this.playerPosition.x - spawnPosition.x,
        y: this.playerPosition.y - spawnPosition.y,
      }),
      siegeCrusherPhase: "entrance",
      siegeCrusherPhaseRemainingSeconds: 0,
      siegeCrusherDirection: { x: 0, y: 0 },
      siegeCrusherAttackCount: 0,
      broodWardenPhase: "entrance",
      broodWardenPhaseRemainingSeconds: 0,
      broodWardenDirection: { x: 0, y: 0 },
      broodWardenAttackCount: 0,
      broodWardenRushUsed: false,
      riftStalkerPhase: "entrance",
      riftStalkerPhaseRemainingSeconds: type === "rift-stalker" ? 0.9 : 0,
      riftStalkerMarkTarget: { ...this.playerPosition },
      riftStalkerDirection: normalizeVector({
        x: this.playerPosition.x - spawnPosition.x,
        y: this.playerPosition.y - spawnPosition.y,
      }),
      riftStalkerChainedThisCycle: false,
      synapseHeraldBehavior: createSynapseHeraldBehavior(id),
      synapseHeraldLungeIndex: 0,
      synapseHeraldHitThisLunge: false,
      assemblyPrimeBehavior: createAssemblyPrimeBehavior(id),
      assemblyPrimeDamagedSinceLastStep: false,
      assemblyPrimeLaneIndex: 0,
      assemblyPrimeLaneCooldownSeconds: 0,
      stormRegentBehavior: createStormRegentBehavior(id, {
        ownerPosition: spawnPosition,
        playerPosition: this.playerPosition,
        ownerHealth: scaledMaxHealth,
        ownerMaxHealth: scaledMaxHealth,
        arena: this.collisionArena(),
        playerRadiusMetres: PLAYER_RADIUS_METRES,
      }, this.nextEntityId),
      abominationPrimeBehavior: createAbominationPrimeBehavior(id, {
        ownerPosition: spawnPosition,
        playerPosition: this.playerPosition,
        ownerHealth: scaledMaxHealth,
        ownerMaxHealth: scaledMaxHealth,
        arena: this.collisionArena(),
        playerRadiusMetres: PLAYER_RADIUS_METRES,
        grabLineClear: true,
        playerDodged: false,
      }),
      statusBuildup: {},
      statusTimers: {},
    });
    this.frameEvents.push({
      type: "enemy-spawned",
      position: { ...spawnPosition },
      enemyType: type,
      bestiaryKey: type,
    });

    return id;
  }

  /** Forced event entry point for the behavior lab and future seeded director hook. */
  spawnAurumHoarder(position?: Vector2Data): number | null {
    if (this.aurumSpawnedThisWave || this.enemies.some((enemy) => !enemy.dead && enemy.type === "aurum-hoarder")) {
      return null;
    }
    const id = this.spawnEnemy("aurum-hoarder", position);
    const enemy = this.enemies.find((candidate) => candidate.id === id)!;
    enemy.rank = "treasure";
    this.aurumSpawnedThisWave = true;
    this.frameEvents.push({ type: "aurum-arrived", position: { ...enemy.position } });
    return id;
  }

  /** Dex identity: an elite or mini-boss is its own entry, not its base family. */
  private bestiaryKeyOf(enemy: EnemyState): string {
    return enemy.eliteKind ?? enemy.miniBossKind ?? enemy.type;
  }

  /**
   * `spawnEnemy` emits the spawn event before `spawnElite`/`spawnMiniBoss`
   * apply their rank, so those paths re-tag the event they just caused.
   * Without this a Carapace Scuttler would register as an ordinary Scuttler.
   */
  private retagLastSpawn(bestiaryKey: string): void {
    for (let index = this.frameEvents.length - 1; index >= 0; index -= 1) {
      const event = this.frameEvents[index]!;
      if (event.type === "enemy-spawned") {
        event.bestiaryKey = bestiaryKey;
        return;
      }
    }
  }

  spawnElite(eliteKind: EliteKind, position?: Vector2Data): number {
    const baseType: EnemyType = eliteKind === "carapace-scuttler"
      ? "scuttler"
      : eliteKind === "razorlord"
        ? "razor-scuttler"
        : eliteKind === "blightspitter"
          ? "slime-spitter"
          : "quillback";
    const id = this.spawnEnemy(baseType, position);
    const enemy = this.enemies.find((candidate) => candidate.id === id)!;
    enemy.rank = "elite";
    enemy.eliteKind = eliteKind;
    this.retagLastSpawn(eliteKind);
    const scaling = waveScaling(this.waveIndex + 1, enemy.type, { elite: true });
    const authoredHealth: Record<EliteKind, number> = {
      "carapace-scuttler": 45,
      razorlord: 30,
      blightspitter: 40,
      "quillback-matriarch": 50,
    };
    const authoredArmour: Record<EliteKind, number> = {
      "carapace-scuttler": ENEMY_CATALOG.scuttler.armour,
      razorlord: 1,
      blightspitter: 1,
      "quillback-matriarch": 2,
    };
    enemy.maxHealth = scaleEnemyHealth(authoredHealth[eliteKind], scaling);
    enemy.health = enemy.maxHealth;
    enemy.armour = authoredArmour[eliteKind] + scaling.armourBonus;
    enemy.maxShield = scaling.maxShield;
    enemy.shield = scaling.maxShield;
    enemy.movementSpeedMultiplier = scaling.speedMultiplier;
    enemy.damageMultiplier = scaling.damageMultiplier;
    if (eliteKind === "carapace-scuttler") {
      enemy.carapacePhase = "pursuit";
      enemy.carapacePhaseRemainingSeconds = 1.25;
    }
    return id;
  }

  spawnMiniBoss(miniBossKind: MiniBossKind, position?: Vector2Data): number {
    const id = this.spawnEnemy(miniBossKind, position);
    const enemy = this.enemies.find((candidate) => candidate.id === id)!;
    enemy.rank = "mini-boss";
    enemy.miniBossKind = miniBossKind;
    const definition = ENEMY_CATALOG[miniBossKind];
    // Phase 5: mini-bosses used to pin these to catalog values and `1`, which
    // made them the *least* threatening thing in the late game — an elite at
    // column 7 outscaled the mini-boss guarding it. They now scale like elites
    // do, on a gentler curve so the fixed windup telegraphs stay readable.
    // `spawnEnemy` already applied a boss-identity scaling, so this overwrites
    // rather than compounds.
    const scaling = waveScaling(this.waveIndex + 1, miniBossKind, { miniBoss: true });
    enemy.maxHealth = scaleEnemyHealth(definition.maxHealth, scaling);
    enemy.health = enemy.maxHealth;
    enemy.armour = definition.armour + scaling.armourBonus;
    enemy.flatDamageReduction = definition.flatDamageReduction;
    enemy.maxShield = 0;
    enemy.shield = 0;
    enemy.movementSpeedMultiplier = scaling.speedMultiplier;
    enemy.damageMultiplier = scaling.damageMultiplier;
    enemy.radiusScale = scaling.radiusMultiplier;
    this.retagLastSpawn(miniBossKind);
    enemy.siegeCrusherPhase = "entrance";
    enemy.siegeCrusherPhaseRemainingSeconds = 0.9;
    enemy.broodWardenPhase = "entrance";
    enemy.broodWardenPhaseRemainingSeconds = 0.9;
    enemy.riftStalkerPhase = "entrance";
    enemy.riftStalkerPhaseRemainingSeconds = 0.9;
    enemy.synapseHeraldBehavior = createSynapseHeraldBehavior(id);
    enemy.assemblyPrimeBehavior = createAssemblyPrimeBehavior(id);
    enemy.stormRegentBehavior = createStormRegentBehavior(id, {
      ownerPosition: enemy.position,
      playerPosition: this.playerPosition,
      ownerHealth: enemy.health,
      ownerMaxHealth: enemy.maxHealth,
      arena: this.collisionArena(),
      playerRadiusMetres: PLAYER_RADIUS_METRES,
    }, this.nextEntityId);
    enemy.abominationPrimeBehavior = createAbominationPrimeBehavior(id, {
      ownerPosition: enemy.position,
      playerPosition: this.playerPosition,
      ownerHealth: enemy.health,
      ownerMaxHealth: enemy.maxHealth,
      arena: this.collisionArena(),
      playerRadiusMetres: PLAYER_RADIUS_METRES,
      grabLineClear: true,
      playerDodged: false,
    });
    if (miniBossKind === "storm-regent") this.spawnStormRegentNodes(enemy);
    enemy.facingDirection = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    return id;
  }

  private spawnStormRegentNodes(owner: EnemyState): void {
    const nodes = owner.stormRegentBehavior.nodes.map((planned) => {
      const id = this.spawnEnemy("storm-node", planned.position);
      const nodeEnemy = this.enemies.find((candidate) => candidate.id === id)!;
      nodeEnemy.conductiveNode = createConductiveNode(id, planned.position);
      nodeEnemy.stormNodeOwnerId = owner.id;
      nodeEnemy.health = nodeEnemy.conductiveNode.health;
      nodeEnemy.maxHealth = nodeEnemy.conductiveNode.health;
      return nodeEnemy.conductiveNode;
    });
    owner.stormRegentBehavior = { ...owner.stormRegentBehavior, nodes };
  }

  /**
   * Picks the wave's powerup. An expedition node runs only 1-4 waves and each
   * node builds a fresh simulation, so reading the cycle from index 0 every
   * time meant the campaign could only ever hand out the first four entries —
   * the back half of the rotation was unreachable outside Quick Drop's ten-wave
   * run. Offsetting by the encounter seed spreads the whole cycle across a run
   * while staying deterministic: the same seed always yields the same drops.
   *
   * Quick Drop has no encounter and keeps offset 0, so its sequence is
   * unchanged.
   */
  private powerupForWave(index: number): PowerupType {
    const offset = this.expeditionEncounter?.seed ?? 0;
    const position = (offset + index) % POWERUP_WAVE_CYCLE.length;
    return POWERUP_WAVE_CYCLE[position]!;
  }

  spawnPowerup(type: PowerupType, position?: Vector2Data): number {
    const id = this.nextId();
    this.powerups.push({
      id,
      type,
      position: position ? { ...position } : this.nextPowerupPosition(),
      remainingSeconds: type === "medkit" ? MEDKIT_LIFETIME_SECONDS : POWERUP_LIFETIME_SECONDS,
      collected: false,
    });
    return id;
  }

  /** Forced entry point for labs and rules tests; ordinary spawns are seeded per wave. */
  spawnSupplyChest(variant: SupplyChestVariant, position?: Vector2Data): number {
    const id = this.nextId();
    const health = variant === "armored"
      ? SUPPLY_CHEST_BASE_HEALTH + SUPPLY_CHEST_HEALTH_PER_WAVE * this.waveIndex
      : 0;
    const chestPosition = position ? { ...position } : this.nextPowerupPosition();
    this.supplyChests.push({
      id,
      variant,
      position: chestPosition,
      health,
      maxHealth: health,
      resolved: false,
    });
    this.frameEvents.push({
      type: "supply-chest-spawned",
      position: { ...chestPosition },
      variant,
    });
    return id;
  }

  addExperience(amount: number): void {
    const multiplier = this.waveIndex < 3 ? this.perkModifiers.earlyExperienceMultiplier : 1;
    const scaled = Math.max(0, amount) * multiplier + this.experienceCarry;
    const whole = Math.floor(scaled);
    this.experienceCarry = scaled - whole;
    this.experience += whole;
    this.checkForLevelUp();
  }

  /** Applies typed damage to an enemy by id. Also used by rules tests. */
  dealDamage(enemyId: number, amount: number, damageType: DamageType = "physical"): boolean {
    const enemy = this.enemies.find((candidate) => candidate.id === enemyId && !candidate.dead);
    if (!enemy) {
      return false;
    }
    this.damageEnemy(enemy, amount, damageType);
    return true;
  }

  chooseOption(optionId: string): boolean {
    const decision = this.decisionQueue[0];
    const option = decision?.options.find((candidate) => candidate.id === optionId);
    if (!decision || !option || option.affordable === false) {
      return false;
    }

    this.decisionQueue.shift();
    switch (decision.kind) {
      case "upgrade": {
        // The level-up draw mixes authored upgrades with one stat card, so the
        // chosen id decides which system applies it.
        if (isLevelStatCardId(optionId)) {
          this.applyLevelStatCard(optionId);
          break;
        }
        const upgradeId = optionId as UpgradeId;
        const nextLevel = (this.upgradeLevels.get(upgradeId) ?? 0) + 1;
        this.upgradeLevels.set(upgradeId, nextLevel);
        this.applyUpgrade(upgradeId, nextLevel);
        break;
      }
      case "level-stat":
        this.applyLevelStatCard(optionId);
        break;
      case "weapon-chest":
        this.addWeapon(optionId as WeaponId);
        break;
      case "supply-depot":
        this.applySupplyChoice(optionId);
        break;
      case "slot-requisition": {
        const category = optionId.replace("slot-", "") as UpgradeCategory;
        if (category in this.upgradeSlotCapacity && this.totalSlotCapacity() < UPGRADE_SLOT_HARD_CAP) {
          this.upgradeSlotCapacity[category] += 1;
        }
        break;
      }
      case "scrap-shop":
        if (optionId === "shop-manage") {
          this.shopMode = "manage";
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId === "shop-back") {
          this.shopMode = "offers";
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId === "shop-sell-menu") {
          this.shopMode = "sell";
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId.startsWith("shop-lock:")) {
          const offerId = optionId.slice("shop-lock:".length);
          this.shopLockedOfferId = this.shopLockedOfferId === offerId ? null : offerId;
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId.startsWith("shop-ban:")) {
          const offerId = optionId.slice("shop-ban:".length);
          this.shopBannedIds.add(offerId);
          if (this.shopLockedOfferId === offerId) this.shopLockedOfferId = null;
          // Replace the banned offer in the current rack immediately, free of charge.
          const excluded = new Set(this.shopOffers?.map((offer) => offer.id) ?? []);
          const replacement = this.drawScrapShopOffers(excluded)[0] ?? null;
          this.shopOffers = (this.shopOffers ?? [])
            .filter((offer) => offer.id !== offerId)
            .concat(replacement ? [replacement] : []);
          this.shopMode = "offers";
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId === "shop-reroll") {
          const cost = this.currentShopRerollCost();
          if (this.shopRerollUsed || cost > this.securedScrap) {
            this.decisionQueue.unshift(decision);
            return false;
          }
          this.securedScrap -= cost;
          this.shopRerollUsed = true;
          this.rerollScrapShopOffers();
          this.frameEvents.push({ type: "scrap-spent", amount: cost, remaining: this.securedScrap, offerId: optionId });
          this.shopMode = "offers";
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId.startsWith("shop-sell:")) {
          const instanceId = Number(optionId.slice("shop-sell:".length));
          if (!this.sellWeapon(instanceId)) {
            this.decisionQueue.unshift(decision);
            return false;
          }
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else if (optionId !== "shop-leave") {
          const cost = Math.max(0, option.cost ?? 0);
          if (cost > this.securedScrap) {
            this.decisionQueue.unshift(decision);
            return false;
          }
          this.securedScrap -= cost;
          this.applyScrapShopPurchase(optionId);
          this.frameEvents.push({
            type: "scrap-spent",
            amount: cost,
            remaining: this.securedScrap,
            offerId: optionId,
          });
          if (this.shopLockedOfferId === optionId) this.shopLockedOfferId = null;
          this.shopOffers = null;
          this.decisionQueue.unshift(this.buildScrapShopDecision());
        } else {
          this.resetScrapShopVisit();
        }
        break;
      case "weapon-placement":
        this.applyWeaponPlacementChoice(optionId);
        break;
    }
    this.checkForLevelUp();
    return true;
  }

  chooseUpgrade(upgradeId: UpgradeId): boolean {
    if (this.decisionQueue[0]?.kind !== "upgrade") {
      return false;
    }
    return this.chooseOption(upgradeId);
  }

  setAutoFireEnabled(enabled: boolean): void {
    this.autoFireEnabled = enabled;
  }

  abandonRun(): CombatSnapshot {
    if (this.status === "combat" || this.status === "intermission") {
      this.status = "defeat";
      this.runDefeatCause = "Run abandoned";
      this.decisionQueue.length = 0;
    }
    return this.snapshot();
  }

  snapshot(): CombatSnapshot {
    const decision = this.decisionQueue[0] ?? null;
    const heroPresentation: HeroCombatPresentation = {
      id: this.hero.id,
      displayName: this.hero.displayName,
      passiveId: this.hero.passive.id,
      passiveName: this.hero.passive.name,
      evasiveName: titleCase(this.hero.evasiveMove.presentation),
      evasiveDurationSeconds: this.hero.evasiveMove.durationSeconds,
      evasiveRecoverySeconds: this.heroMotion.getEffectiveEvasiveRecoverySeconds(),
      ultimateName: this.hero.ultimate.name,
      ultimateCooldownSeconds: this.hero.ultimate.cooldownSeconds * this.transformationModifiers.ultimateCooldownMultiplier,
    };
    return {
      status: this.status,
      autoFireEnabled: this.autoFireEnabled,
      heroId: this.hero.id,
      heroPresentation,
      activePerkId: this.activePerkId,
      transformation: cloneTransformationAffinityState(this.transformation),
      relicIds: [...this.ownedRelicIds],
      ownedItemIds: [...this.ownedItemIds],
      itemStats: { ...this.baseItemStats },
      playerStats: {
        raw: { ...this.rawPlayerStats },
        effective: { ...this.playerStats },
        capped: [...this.cappedPlayerStatKeys],
      },
      bannedShopIds: [...this.shopBannedIds],
      equippedArtifactId: this.equippedArtifactId,
      rewardMaxHealthBonus: this.rewardMaxHealthBonus,
      rewardWeaponSlotBonus: this.rewardWeaponSlotBonus,
      waveNumber: this.expeditionEncounter ? this.expeditionWaveIndex + 1 : this.waveIndex + 1,
      totalWaves: this.expeditionEncounter ? Math.max(1, this.expeditionEncounter.waves.length) : TOTAL_WAVES,
      playerPosition: { ...this.playerPosition },
      playerHealth: this.playerHealth,
      playerMaxHealth: this.playerMaxHealth,
      playerBonusHealth: this.playerBonusHealth,
      playerMaxBonusHealth: this.bonusHealthCap(),
      playerShield: this.playerShield,
      playerMaxShield: this.defence.maxShield,
      playerArmour: this.defence.armour,
      playerFlatDamageReduction: this.defence.flatDamageReduction,
      playerDamageMultiplier: this.levelDamageMultiplier,
      playerMoveSpeedMultiplier: this.levelSpeedMultiplier,
      weaponProficiencies: { ...this.weaponProficiencies },
      playerInvulnerable: this.playerInvulnerable || this.playerHurtCooldownSeconds > 0,
      playerEntrenched: this.isPlayerEntrenched(),
      assaultMomentumStacks: this.assaultMomentumStacks,
      tacticianDesignatedTargetCount: this.tacticianDesignations.size,
      evasiveReady: this.evasiveReady,
      evasiveCooldownRemainingSeconds: this.evasiveCooldownRemainingSeconds,
      ultimateReady: this.ultimateCooldownRemainingSeconds <= 0,
      ultimateCooldownRemainingSeconds: this.ultimateCooldownRemainingSeconds,
      fence: this.fenceSnapshot(),
      heroState: this.heroState,
      level: this.level,
      experience: this.experience,
      experienceForNextLevel: this.experienceThreshold(),
      worldInteractionPrompt: this.worldInteractionPrompt(),
      deployables: this.deployables.filter((unit) => !unit.dead).map((unit) => ({
        id: unit.id,
        weaponId: unit.weaponId,
        kind: unit.kind,
        position: { ...unit.position },
        health: unit.health,
        maxHealth: unit.maxHealth,
        remainingSeconds: unit.remainingSeconds,
      })),
      upgradeLevels: [...this.upgradeLevels.entries()].map(([id, level]) => ({ id, level })),
      upgradeSlots: (Object.keys(this.upgradeSlotCapacity) as UpgradeCategory[]).map((category) => ({
        category,
        used: this.usedUpgradeSlots(category),
        capacity: this.upgradeSlotCapacity[category],
      })),
      pendingDecision: decision
        ? { ...decision, options: decision.options.map((option) => ({ ...option })) }
        : null,
      enemies: this.enemies.filter((enemy) => !enemy.dead).map((enemy) => this.enemySnapshot(enemy)),
      projectiles: this.projectiles.filter((projectile) => !projectile.dead).map((projectile) => ({
        id: projectile.id,
        weaponId: projectile.weaponId,
        position: { ...projectile.position },
        rotationRadians: Math.atan2(projectile.velocity.y, projectile.velocity.x),
        pierceRemaining: projectile.pierceRemaining,
      })),
      enemyProjectiles: this.enemyProjectiles.filter((projectile) => !projectile.dead).map((projectile) => ({
        id: projectile.id,
        type: projectile.type,
        position: { ...projectile.position },
        rotationRadians: Math.atan2(projectile.velocity.y, projectile.velocity.x),
      })),
      groundHazards: this.groundHazards.map((hazard) => ({
        id: hazard.id,
        type: hazard.type,
        position: { ...hazard.position },
        radiusMetres: hazard.radiusMetres,
        remainingSeconds: hazard.remainingSeconds,
        durationSeconds: hazard.durationSeconds,
      })),
      eventHorizonFields: this.eventHorizonFields.map((field) => ({
        id: field.id,
        position: { ...field.position },
        remainingSeconds: field.remainingSeconds,
        durationSeconds: field.durationSeconds,
        pullRadiusMetres: field.pullRadiusMetres,
        kind: field.kind,
      })),
      combatTelegraphs: this.combatTelegraphSnapshots(),
      eliteRewards: this.eliteRewards.filter((reward) => !reward.collected).map((reward) => ({
        id: reward.id,
        type: reward.type,
        position: { ...reward.position },
      })),
      pickups: this.pickups.filter((pickup) => !pickup.collected).map((pickup) => ({
        id: pickup.id,
        position: { ...pickup.position },
        value: pickup.value,
      })),
      powerups: this.powerups.filter((powerup) => !powerup.collected).map((powerup) => ({
        id: powerup.id,
        type: powerup.type,
        position: { ...powerup.position },
        remainingSeconds: powerup.remainingSeconds,
      })),
      supplyChests: this.supplyChests.filter((chest) => !chest.resolved).map((chest) => ({
        id: chest.id,
        variant: chest.variant,
        position: { ...chest.position },
        health: chest.health,
        maxHealth: chest.maxHealth,
        playerInRange: chest.variant === "sealed"
          && distance(chest.position, this.playerPosition) <= SUPPLY_CHEST_OPEN_RANGE_METRES,
      })),
      activeBuffs: [...this.activeBuffs.entries()].map(([type, remainingSeconds]) => ({
        type,
        remainingSeconds,
        durationSeconds: POWERUP_DURATION_SECONDS[type],
      })),
      uraniumKitAvailable: this.uraniumKitAvailable,
      securedScrap: this.securedScrap,
      weapon: { ...(this.equippedWeapons[0]?.stats ?? BASTION_SERVICE_RIFLE) },
      equippedWeapons: this.equippedWeapons.map((weapon) => ({
        instanceId: weapon.instanceId,
        weaponId: weapon.weaponId,
        stats: { ...weapon.stats },
        cooldownRemainingSeconds: weapon.cooldownSeconds,
        cooldownDurationSeconds: weapon.cooldownDurationSeconds || weapon.stats.fireIntervalSeconds,
      })),
      weaponInventory: {
        rack: this.weaponInventory.rack.map((slot) => ({
          id: slot.id,
          weaponClass: slot.weaponClass,
          tile: slot.tile ? { ...slot.tile } : null,
        })),
        stash: this.weaponInventory.stash.map((tile) => tile ? { ...tile } : null),
        capacity: this.weaponInventory.stash.length,
      },
      events: this.frameEvents.map((event) => ({ ...event })),
      arena: this.arena,
      stressProfile: this.stressProfile,
      scenario: this.scenario,
      playerSlowed: this.isPlayerSlowed(),
      terrain: this.arena.obstacles.map((obstacle) => {
        const maxHealth = obstacleMaxDurability(obstacle);
        return {
          id: obstacle.id,
          kind: obstacle.kind,
          health: this.obstacleHealth.get(obstacle.id) ?? maxHealth,
          maxHealth,
          hitRemainingSeconds: this.obstacleHitRemainingSeconds.get(obstacle.id) ?? 0,
        };
      }),
      damagedObstacleIds: this.arena.obstacles
        .filter((obstacle) => (this.obstacleHealth.get(obstacle.id) ?? obstacleMaxDurability(obstacle)) < obstacleMaxDurability(obstacle))
        .map(({ id }) => id),
      destroyedObstacleIds: this.arena.obstacles
        .filter((obstacle) => (this.obstacleHealth.get(obstacle.id) ?? obstacleMaxDurability(obstacle)) <= 0)
        .map(({ id }) => id),
      playerTethered: this.enemies.some((enemy) => (
        !enemy.dead
        && enemy.id === this.activeTetherEnemyId
        && (enemy.tetherBloomPhase === "tethering"
          || (enemy.type === "abomination-prime"
            && enemy.abominationPrimeBehavior.phase === "action"
            && enemy.abominationPrimeBehavior.move === "biomass-grab"))
      )),
      activeTetherEnemyId: this.activeTetherEnemyId,
      density: {
        liveCap: this.waveLiveCap,
        currentLiveEnemies: this.enemies.filter((enemy) => !enemy.dead && enemy.type !== "foundry-pad").length,
        peakLiveEnemies: this.densityPeakLiveEnemies,
        spawnedThisWave: this.densitySpawnedThisWave,
        threatBudget: this.waveThreatBudget,
        threatSpawned: this.waveThreatSpawned,
        reservedLiveSlots: this.nestReservedLiveSlots + this.foundryReservedLiveSlots,
        reservedThreat: this.nestReservedThreat + this.foundryReservedThreat,
        waveElapsedSeconds: this.waveElapsedSeconds,
        waveDurationSeconds: this.waveDurationSeconds,
        timerEndsWave: this.waveEndsOnTimer,
        queuedSpawns: this.spawnQueue.length,
        spawnCapBlockedSeconds: this.densitySpawnCapBlockedSeconds,
        pressureSpawned: { ...this.densityPressureSpawned },
        activeEnemyProjectiles: this.enemyProjectiles.filter((projectile) => !projectile.dead).length,
        peakEnemyProjectiles: this.densityPeakEnemyProjectiles,
        projectileBudget: ENEMY_PROJECTILE_BUDGET,
        activeFriendlyProjectiles: this.projectiles.filter((projectile) => !projectile.dead).length,
        peakFriendlyProjectiles: this.densityPeakFriendlyProjectiles,
        friendlyProjectileBudget: Number.POSITIVE_INFINITY,
      },
      medicTriageHits: this.medicTriageHits,
      runMetrics: {
        kills: this.runKills,
        scrapEarned: this.runScrapEarned,
        damageByWeapon: { ...this.runDamageByWeapon },
        damageBySecond: [...this.runDamageBySecond],
        suppressedProjectilesByWeapon: this.friendlyProjectileBudget.snapshot(),
        elapsedSeconds: this.runElapsedSeconds,
        damageTaken: this.runDamageTaken,
        eliteKills: this.runEliteKills,
        bossDamage: this.runBossDamage,
        highestHit: this.runHighestHit,
        criticalHits: this.runCriticalHits,
        damageTakenBySource: { ...this.runDamageTakenBySource },
        defeatCause: this.runDefeatCause,
      },
    };
  }

  /** Applies the effect of buying the given 1-based level of an upgrade. */
  private applyUpgrade(upgradeId: UpgradeId, level: number): void {
    switch (upgradeId) {
      case "rapid-cycling":
        this.modifyAllWeapons((weapon) => { weapon.fireIntervalSeconds *= 0.85; });
        break;
      case "twin-shot":
        this.modifyAllWeapons((weapon) => {
          weapon.projectileCount += 1;
          weapon.spreadRadians = Math.max(weapon.spreadRadians, 0.11);
        });
        break;
      case "piercing-rounds":
        this.modifyAllWeapons((weapon) => { weapon.pierceCount += 1; });
        break;
      case "explosive-payload": {
        const radius = level === 1 ? 1.4 : level === 2 ? 1.8 : 2.2;
        this.modifyAllWeapons((weapon) => {
          weapon.explosionRadiusMetres = Math.max(weapon.explosionRadiusMetres, radius);
        });
        this.explosionSplashMultiplier = Math.max(this.explosionSplashMultiplier, 0.4 + level * 0.1);
        break;
      }
      case "heavy-calibre":
        this.modifyAllWeapons((weapon) => {
          weapon.projectileDamage *= 1.35;
          weapon.fireIntervalSeconds *= 1.1;
        });
        break;
      case "field-magnet":
        this.magnetMultiplier *= 1.5;
        break;
      case "incendiary-rounds":
        if (level === 1) {
          this.modifyAllWeapons((weapon) => { weapon.damageType = "fire"; });
        } else if (level === 2) {
          this.statusTuning.buildupMultiplier.fire = 1.2;
          this.statusTuning.blazeBonusDamagePerSecond = 0.3;
        } else {
          this.statusTuning.combustionOnDeath = true;
        }
        break;
      case "cryo-coating":
        if (level === 1) {
          this.modifyAllWeapons((weapon) => { weapon.damageType = "cryo"; });
        } else if (level === 2) {
          this.statusTuning.buildupMultiplier.cryo = 1.2;
          this.statusTuning.freezeSpeedMultiplierOverride = 0.22;
        } else {
          this.statusTuning.freezeDurationBonusSeconds = 0.8;
          this.statusTuning.freezeSpeedMultiplierOverride = 0.15;
        }
        break;
      case "chain-lightning":
        // Each level adds one bounce (bounces decay per hop) plus a small
        // shock-buildup rate bonus from level 2 — both, in lesser amounts.
        this.modifyAllWeapons((weapon) => {
          weapon.chainCount += 1;
          weapon.chainRadiusMetres = Math.max(weapon.chainRadiusMetres, 2.1 + level * 0.4);
        });
        if (level >= 2) {
          this.statusTuning.buildupMultiplier.shock =
            (this.statusTuning.buildupMultiplier.shock ?? 1) + 0.1;
        }
        break;
      case "adrenal-servos":
        this.moveSpeedMultiplier *= 1.12;
        break;
      case "composite-plating":
        this.defence.armour += 3;
        break;
      case "shield-capacitor":
        this.defence.maxShield += 1.5;
        break;

      // --- Added 7 August 2026 ---
      case "corrosive-rounds":
        if (level === 1) {
          this.modifyAllWeapons((weapon) => { weapon.damageType = "toxic"; });
        } else if (level === 2) {
          this.statusTuning.buildupMultiplier.toxic = 1.2;
          this.statusTuning.corrodeBonusDamagePerSecond = 0.3;
        } else {
          this.statusTuning.corrodeBonusDamagePerSecond = 0.7;
        }
        break;
      case "catalyst-array":
        // Element-agnostic, so a mixed rack can still reach the threshold.
        for (const type of ["fire", "shock", "cryo", "toxic"] as const) {
          this.statusTuning.buildupMultiplier[type] =
            (this.statusTuning.buildupMultiplier[type] ?? 1) + 0.15;
        }
        break;
      case "marksman-barrels":
        // Reach is speed x lifetime, so both scale or cursor-aimed weapons see
        // no benefit — same reasoning as `rangePercent` in PlayerStatBlock.
        this.modifyAllWeapons((weapon) => {
          weapon.rangeMetres *= 1.2;
          weapon.projectileLifetimeSeconds *= 1.2;
        });
        break;
      case "reactive-plating":
        this.defence.flatDamageReduction += 0.3;
        break;
      case "kinetic-buffer":
        this.defence.hitInvulnerabilitySeconds += 0.05;
        this.defence.slowResistance = Math.min(1, this.defence.slowResistance + 0.25);
        break;
      case "capacitor-array":
        this.defence.shieldRechargePerSecond *= 1.4;
        this.defence.shieldRechargeDelaySeconds *= 0.8;
        break;
      case "field-transfusion":
        this.supportEffectMultiplier *= 1.25;
        break;
      case "salvage-drones":
        this.upgradeScrapMultiplier *= 1.2;
        break;
      default:
        // Exhaustiveness guard. Without it a new UpgradeId compiles cleanly and
        // silently does nothing, which is exactly what happened when the eight
        // 7 Aug upgrades were first added.
        assertUpgradeHandled(upgradeId);
    }
  }

  /**
   * Grants a catalogue item outside the shop — the path Shrine/Event rewards and
   * elite caches use to hand out items. Returns false for unknown ids. Stats take
   * effect immediately via `refreshPlayerStats`.
   */
  /**
   * Guaranteed item drop for a mini-boss or boss kill (Phase 5's reward half —
   * the scrap payout scaled with depth from the start, the drop did not).
   * Rarity-weighted through the same `luck`/`curse` curve the shop uses, so the
   * two economy stats read consistently wherever the player meets them.
   */
  private unlockUniqueWeapons(): void {
    this.uniqueWeaponsUnlocked = true;
  }

  /** Test/debug read: has this run earned access to Unique-class weapons yet. */
  hasUnlockedUniqueWeapons(): boolean {
    return this.uniqueWeaponsUnlocked;
  }

  private grantWeightedItem(position: Vector2Data): string | null {
    const luck = this.playerStats.luck;
    const curse = this.playerStats.curse;
    const weights = ITEM_CATALOG.map((entry) => rarityDrawWeight(entry.rarity, luck, curse));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = this.random() * total;
    let index = 0;
    while (index < ITEM_CATALOG.length - 1) {
      roll -= weights[index]!;
      if (roll <= 0) break;
      index += 1;
    }
    const chosen = ITEM_CATALOG[index]!;
    this.grantItem(chosen.id);
    this.frameEvents.push({ type: "item-granted", position: { ...position }, itemId: chosen.id });
    return chosen.id;
  }

  grantItem(itemId: string): boolean {
    if (!itemById(itemId)) return false;
    this.ownedItemIds.push(itemId);
    this.refreshPlayerStats();
    return true;
  }

  /** Folds the build's raw stat grants plus every owned shop item into one resolved vector. */
  private resolveCurrentPlayerStats(): PlayerStatBlock {
    const owned = foldItemStats(this.ownedItemIds);
    const combined: Partial<PlayerStatBlock> = { ...this.baseItemStats };
    for (const key of Object.keys(owned) as (keyof PlayerStatBlock)[]) {
      const value = owned[key];
      if (typeof value === "number") combined[key] = (combined[key] ?? 0) + value;
    }
    return resolvePlayerStats({
      perk: this.perkModifiers,
      relic: this.relicModifiers,
      transformation: this.transformationModifiers,
      itemStats: combined,
    });
  }

  /**
   * Re-resolves the stat vector after a mid-run purchase. Most stats are read
   * live every frame, so re-resolving is enough — but armour and max health are
   * applied once (constructor / level-up), so they are reconciled here: armour by
   * its delta, max health by recomputing the ceiling. Gained max HP also heals for
   * the same amount, so a +max-HP buy feels immediately useful.
   */
  private refreshPlayerStats(): void {
    this.rawPlayerStats = this.resolveCurrentPlayerStats();
    this.playerStats = applyPlayerStatLimits(this.rawPlayerStats).effective;

    const armourDelta = this.playerStats.armourFlat - this.appliedItemArmour;
    if (armourDelta !== 0) {
      this.defence.armour = Math.max(0, this.defence.armour + armourDelta);
      this.appliedItemArmour = this.playerStats.armourFlat;
    }

    const previousMax = this.playerMaxHealth;
    const growth = heroGrowthAtLevel(this.hero, this.level);
    this.playerMaxHealth = Math.max(
      3,
      Math.round(this.rewardAdjustedMaxHealth(growth.maxHealthBonus) * this.transformationModifiers.maxHealthMultiplier),
    );
    this.applyEffectivePlayerStatLimits();
    const gained = this.playerMaxHealth - previousMax;
    if (gained > 0) this.playerHealth += gained;
    this.playerHealth = Math.max(0.1, Math.min(this.playerHealth, this.playerMaxHealth));
  }

  private applyEffectivePlayerStatLimits(): void {
    const result = applyPlayerStatLimits(this.rawPlayerStats, this.playerMaxHealth);
    this.playerStats = result.effective;
    this.cappedPlayerStatKeys = result.capped;
  }

  /**
   * Base + level growth + Shrine/Event max-health reward + item max-HP stats,
   * floored so a costly shrine bargain can never drop the hero to an unplayable
   * ceiling. Item flat HP is added before the item percentage scales it (Brotato
   * order); the transformation max-health multiplier still applies on top in the
   * constructor.
   */
  private rewardAdjustedMaxHealth(growthBonus: number): number {
    const base = this.hero.baseMaxHealth + growthBonus + this.rewardMaxHealthBonus + this.playerStats.maxHpFlat;
    return Math.max(3, Math.round(base * (1 + this.playerStats.maxHpPercent / 100)));
  }

  private restoreExpeditionBuild(build: ExpeditionBuildSnapshot): void {
    this.level = Math.max(1, Math.floor(build.level));
    this.experience = Math.max(0, Math.floor(build.experience));
    const growth = heroGrowthAtLevel(this.hero, this.level);
    this.playerMaxHealth = this.rewardAdjustedMaxHealth(growth.maxHealthBonus);
    this.defence.armour = this.hero.defence.armour + growth.armourBonus;
    this.levelDamageMultiplier = growth.damageMultiplier;
    this.levelSpeedMultiplier = growth.speedMultiplier;
    this.supportEffectMultiplier = growth.supportMultiplier;
    for (const weaponClass of Object.keys(this.weaponProficiencies) as WeaponClass[]) {
      this.weaponProficiencies[weaponClass] =
        Math.round(((growth.proficiencyMultiplier[weaponClass] - 1) / 0.04) * 1_000) / 1_000;
    }

    for (const carried of build.upgrades) {
      if (!(carried.upgradeId in UPGRADE_CATALOG)) continue;
      const id = carried.upgradeId as UpgradeId;
      const targetLevel = Math.min(
        UPGRADE_CATALOG[id].maxLevel,
        Math.max(0, Math.floor(carried.level)),
      );
      for (let level = 1; level <= targetLevel; level += 1) {
        this.applyUpgrade(id, level);
      }
      if (targetLevel > 0) this.upgradeLevels.set(id, targetLevel);
    }

    const tiers = build.weapons.map((weapon) => Math.max(1, Math.min(3, Math.floor(weapon.tier))));
    let carriedIndex = 0;
    this.weaponInventory.rack.forEach((slot) => {
      if (!slot.tile) return;
      slot.tile.tier = (tiers[carriedIndex] ?? 1) as 1 | 2 | 3;
      carriedIndex += 1;
    });
    this.equippedWeapons.forEach((weapon, index) => {
      const tier = tiers[index] ?? 1;
      weapon.stats.projectileDamage *= tier === 1 ? 1 : tier === 2 ? 1.6 : 2.56;
    });

    this.playerHealth = Math.max(0.1, Math.min(this.playerMaxHealth, build.health));
    this.playerBonusHealth = 0;
    this.playerShield = Math.max(0, build.shield);
  }

  private addWeapon(weaponId: WeaponId): void {
    if (this.equippedWeapons.length >= MAX_EQUIPPED_WEAPONS) {
      return;
    }
    const nextInstanceId = this.weaponInventory.nextInstanceId++;
    const tile: WeaponTile = {
      instanceId: nextInstanceId,
      weaponId,
      weaponClass: WEAPON_CATALOG[weaponId].weaponClass,
      tier: 1,
    };
    const emptySlot = this.weaponInventory.rack.find((slot) => (
      slot.tile === null && (slot.weaponClass === "all" || slot.weaponClass === tile.weaponClass)
    ));
    if (emptySlot) {
      emptySlot.tile = tile;
      this.equippedWeapons.push({
        instanceId: nextInstanceId,
        weaponId,
        stats: { ...WEAPON_CATALOG[weaponId] },
        cooldownSeconds: 0,
        cooldownDurationSeconds: 0,
        projectileCarry: initialProjectileCarry(nextInstanceId),
        orbitAngleRadians: 0,
      });
    } else {
      const emptyStash = this.weaponInventory.stash.findIndex((candidate) => candidate === null);
      if (emptyStash >= 0) this.weaponInventory.stash[emptyStash] = tile;
    }
  }

  private applySupplyChoice(optionId: string): void {
    switch (optionId) {
      case "patch-up":
        this.grantHealing(SUPPLY_DEPOT_HEAL * this.supportEffectMultiplier * this.transformationModifiers.healingReceivedMultiplier);
        break;
      case "field-armoury": {
        const armoury = this.buildUpgradeDecision();
        if (armoury) {
          this.decisionQueue.unshift(armoury);
        } else {
          // Everything is maxed; fall back to the heal so the choice
          // is never wasted.
          this.grantHealing(SUPPLY_DEPOT_HEAL * this.supportEffectMultiplier * this.transformationModifiers.healingReceivedMultiplier);
        }
        break;
      }
      case "aegis-lattice":
        this.playerShield += AEGIS_SHIELD_AMOUNT * this.supportEffectMultiplier;
        break;
    }
  }

  /**
   * Deterministic three-option draw that skips maxed-out upgrades and locked
   * elemental paths, plus one stat card from the shared `PlayerStatBlock`
   * vocabulary (Phase 3C). Offering both in one decision keeps the authored
   * upgrades arriving at their old rate — the player spends a level on stats
   * only when they actually want to. Returns null only when every upgrade is
   * exhausted, in which case the caller falls back to an all-stat draw.
   */
  private buildUpgradeDecision(): PendingDecision | null {
    const start = (this.level - 2 + UPGRADE_ORDER.length * 2) % UPGRADE_ORDER.length;
    // Preserve the original spread-by-two offer pattern, then fall back to
    // the remaining slots so eligibility filtering can always fill options.
    //
    // Derived from the catalogue length rather than hard-coded. It used to be
    // the literal [0,2,4,6,8,10,1,3,5,7,9,11], which was a complete cover only
    // while there were exactly twelve upgrades; at twenty it could never see
    // the last eight from a given start, so they were systematically
    // under-offered.
    const scanOffsets = upgradeScanOffsets(UPGRADE_ORDER.length);
    const options: DecisionOption[] = [];
    for (const offset of scanOffsets) {
      if (options.length >= 3) break;
      const id = UPGRADE_ORDER[(start + offset) % UPGRADE_ORDER.length]!;
      if (options.some((option) => option.id === id) || !this.isUpgradeEligible(id)) {
        continue;
      }
      const nextLevel = (this.upgradeLevels.get(id) ?? 0) + 1;
      options.push({
        id,
        name: upgradeLevelName(id, nextLevel),
        description: `[${UPGRADE_CATEGORY_LABELS[UPGRADE_CATALOG[id].category]}] `
          + UPGRADE_CATALOG[id].levelDescriptions[nextLevel - 1]!,
      });
    }
    if (options.length === 0) {
      return null;
    }
    const statCard = this.levelStatCardForLevel(0);
    if (statCard) options.push(statCard);
    return {
      kind: "upgrade",
      title: "LEVEL UP — CHOOSE ONE",
      options,
    };
  }

  /**
   * The stat card offered at this level, `slot` steps along the interleaved
   * order. RNG-free on purpose: `this.random()` call order is part of the replay
   * digest, so drawing here would invalidate every fixture. Luck-weighted draws
   * are a deferred item.
   */
  private levelStatCardForLevel(slot: number): DecisionOption | null {
    const length = LEVEL_STAT_ORDER.length;
    const index = (this.level - 2 + slot * 4 + length * 2) % length;
    const entry = levelStatCardById(LEVEL_STAT_ORDER[index]!);
    if (!entry) return null;
    return { id: entry.id, name: entry.name, description: levelStatCardDescription(entry) };
  }

  /**
   * Deterministic four-card stat draw from the shared `PlayerStatBlock`
   * vocabulary. Deliberately RNG-free, exactly like `buildUpgradeDecision`:
   * `this.random()` call order is part of the replay digest, so drawing here
   * would invalidate every fixture. Luck-weighted draws are a deferred item.
   *
   * The stride walks the interleaved `LEVEL_STAT_ORDER` so consecutive levels
   * offer different cards, and every card is always eligible — a stat can be
   * taken any number of times.
   */
  private buildLevelStatDecision(): PendingDecision {
    const options: DecisionOption[] = [];
    for (let slot = 0; slot < LEVEL_STAT_ORDER.length && options.length < 4; slot += 1) {
      const option = this.levelStatCardForLevel(slot);
      if (!option || options.some((existing) => existing.id === option.id)) continue;
      options.push(option);
    }
    return {
      kind: "level-stat",
      title: "LEVEL UP — CHOOSE A STAT",
      options,
    };
  }

  /**
   * Applies a level-up stat card. Grants land in `baseItemStats` — the same bag
   * shop items fold into — so they persist on the run build and take effect
   * through the one resolver. `refreshPlayerStats` is mandatory rather than
   * optional: armour is reconciled by delta against `appliedItemArmour` and max
   * HP is recomputed there, so a card touching either is inert without it.
   */
  private applyLevelStatCard(cardId: string): void {
    const entry = levelStatCardById(cardId);
    if (!entry) return;
    this.baseItemStats = {
      ...this.baseItemStats,
      [entry.statKey]: (this.baseItemStats[entry.statKey] ?? 0) + entry.amount,
    };
    this.refreshPlayerStats();
  }

  private isUpgradeEligible(id: UpgradeId): boolean {
    const definition = UPGRADE_CATALOG[id];
    const ownedLevel = this.upgradeLevels.get(id) ?? 0;
    if (ownedLevel >= definition.maxLevel) {
      return false;
    }
    if (definition.excludes.some((excluded) => (this.upgradeLevels.get(excluded) ?? 0) > 0)) {
      return false;
    }
    // Breadth is slot-limited: a NEW upgrade needs a free slot in its
    // category, while leveling an owned upgrade never consumes one.
    return ownedLevel > 0
      || this.usedUpgradeSlots(definition.category) < this.upgradeSlotCapacity[definition.category];
  }

  private usedUpgradeSlots(category: UpgradeCategory): number {
    let used = 0;
    for (const [id, level] of this.upgradeLevels) {
      if (level > 0 && UPGRADE_CATALOG[id].category === category) {
        used += 1;
      }
    }
    return used;
  }

  private totalSlotCapacity(): number {
    return Object.values(this.upgradeSlotCapacity).reduce((sum, capacity) => sum + capacity, 0);
  }

  /**
   * Elite reward: choose which category gains one more upgrade slot. Returns
   * null once the shared hard cap is reached.
   */
  private buildSlotRequisitionDecision(): PendingDecision | null {
    if (this.totalSlotCapacity() >= UPGRADE_SLOT_HARD_CAP) {
      return null;
    }
    const categories = Object.keys(this.upgradeSlotCapacity) as UpgradeCategory[];
    const options: DecisionOption[] = categories.map((category) => ({
      id: `slot-${category}`,
      name: `${UPGRADE_CATEGORY_LABELS[category]} Slot`,
      description: `Unlock one more ${UPGRADE_CATEGORY_LABELS[category]} upgrade slot `
        + `(now ${this.usedUpgradeSlots(category)}/${this.upgradeSlotCapacity[category]}).`,
    }));
    // Keep the overlay at three options: drop a seeded entry when all four
    // categories still have room.
    while (options.length > 3) {
      const dropIndex = Math.min(
        Math.floor(this.random() * options.length),
        options.length - 1,
      );
      options.splice(dropIndex, 1);
    }
    return {
      kind: "slot-requisition",
      title: "REQUISITION — UNLOCK AN UPGRADE SLOT",
      options,
    };
  }

  /** Everything this run may still be offered, uniques included once earned. */
  private offerableWeapons(): readonly WeaponId[] {
    return weaponPoolFor({ uniqueUnlocked: this.uniqueWeaponsUnlocked });
  }

  private buildWeaponChestDecision(): PendingDecision | null {
    if (this.equippedWeapons.length >= MAX_EQUIPPED_WEAPONS) {
      return null;
    }
    const ownedIds = new Set(this.equippedWeapons.map((weapon) => weapon.weaponId));
    const unowned = this.offerableWeapons().filter((weaponId) => !ownedIds.has(weaponId));
    if (unowned.length === 0) {
      return null;
    }
    // Seeded draw of up to three distinct unowned weapons so the decision
    // overlay stays readable and successive runs offer different chests.
    const candidates = [...unowned];
    const options: DecisionOption[] = [];
    while (options.length < 3 && candidates.length > 0) {
      const index = Math.min(
        Math.floor(this.random() * candidates.length),
        candidates.length - 1,
      );
      const weaponId = candidates.splice(index, 1)[0]!;
      options.push({
        id: weaponId,
        name: WEAPON_CATALOG[weaponId].displayName,
        description: WEAPON_CATALOG[weaponId].description,
      });
    }
    return {
      kind: "weapon-chest",
      title: "WEAPON CHEST — CHOOSE A WEAPON",
      options,
    };
  }

  private buildWeaponPlacementDecision(tile: WeaponTile): PendingDecision {
    const options: DecisionOption[] = [];
    for (const slot of this.weaponInventory.rack) {
      if (slot.tile === null && (slot.weaponClass === "all" || slot.weaponClass === tile.weaponClass)) {
        options.push({ id: `place:rack:${slot.id}`, name: `Equip in ${slot.weaponClass.toUpperCase()} slot`, description: "Add to the firing rack." });
      }
    }
    this.weaponInventory.stash.forEach((candidate, index) => {
      if (candidate === null) options.push({ id: `place:inventory:${index}`, name: `Store in stash ${index + 1}`, description: "Hold for a later swap or merge. It does not fire." });
    });
    const merge = findMergePair(this.weaponInventory, tile);
    if (merge) options.push({ id: placementTargetId(merge), name: "Merge duplicate", description: "Combine identical tiles into the next tier and free one tile." });
    options.push({ id: "place:discard", name: "Discard", description: "Refuse this tile. Nothing else changes." });
    return { kind: "weapon-placement", title: `PLACE WEAPON — ${WEAPON_CATALOG[tile.weaponId].displayName}`, options, weaponId: tile.weaponId };
  }

  private applyWeaponPlacementChoice(optionId: string): void {
    const tile = this.pendingWeaponTile;
    if (!tile) return;
    const target = parsePlacementTarget(optionId);
    if (!target) return;
    const mergeInstanceId = target.kind === "merge" && target.slotId
      ? this.weaponInventory.rack.find((slot) => slot.id === target.slotId)?.tile?.instanceId ?? null
      : null;
    const result = placeWeapon(this.weaponInventory, tile, target);
    if (!result.ok) return;
    this.weaponInventory = result.state;
    if (target.kind === "rack" && result.state.rack.find((slot) => slot.id === target.slotId)?.tile?.instanceId === tile.instanceId) {
      this.equippedWeapons.push({
        instanceId: tile.instanceId,
        weaponId: tile.weaponId,
        stats: { ...WEAPON_CATALOG[tile.weaponId] },
        cooldownSeconds: 0,
        cooldownDurationSeconds: 0,
        projectileCarry: initialProjectileCarry(tile.instanceId),
        orbitAngleRadians: 0,
      });
    }
    if (result.merged && target.kind === "merge" && target.slotId) {
      const slot = this.weaponInventory.rack.find((candidate) => candidate.id === target.slotId);
      const weapon = this.equippedWeapons.find((candidate) => candidate.instanceId === mergeInstanceId);
      if (slot?.tile && weapon && mergeInstanceId !== null) {
        slot.tile.instanceId = mergeInstanceId;
        weapon.stats.projectileDamage *= 1.6 * this.perkModifiers.mergeDamageMultiplier;
      }
    }
    this.pendingWeaponTile = null;
  }

  private buildSupplyDepotDecision(): PendingDecision {
    return {
      kind: "supply-depot",
      title: "SUPPLY DEPOT — CHOOSE ONE",
      options: [
        {
          id: "patch-up",
          name: "Patch Up",
          description: `Restore ${SUPPLY_DEPOT_HEAL} health.`,
        },
        {
          id: "field-armoury",
          name: "Field Armoury",
          description: "Choose one upgrade immediately.",
        },
        {
          id: "aegis-lattice",
          name: "Aegis Lattice",
          description: `Gain a ${AEGIS_SHIELD_AMOUNT}-point shield that absorbs damage before health.`,
        },
      ],
    };
  }

  /** Same-run economy v2: stock, one depth-priced reroll, one protected offer, and 50% weapon resale. */
  private buildScrapShopCandidates(): DecisionOption[] {
    const candidates: DecisionOption[] = [];
    // Liberation nodes (Phase 4) open a themed shop instead of the plain scrap
    // market. The profile decides which stock lines exist, filters items by tag
    // and rarity floor, and scales prices — so a themed shop is a data row, not
    // a second shop implementation.
    const profile = shopProfileById(this.shopProfileId);
    const price = (base: number): number => Math.max(1, Math.round(base * profile.priceMultiplier));
    const add = (option: Omit<DecisionOption, "affordable"> & { cost: number }): void => {
      // Banned stock never returns for the rest of the run (Brotato's ban verb).
      if (this.shopBannedIds.has(option.id)) return;
      candidates.push({ ...option, affordable: option.cost <= this.securedScrap });
    };

    if (profile.stock.repair && this.playerHealth < this.playerMaxHealth) {
      add({
        id: "shop-repair",
        name: "Field Repair",
        description: `Restore ${SCRAP_SHOP_REPAIR} health.`,
        cost: price(SCRAP_SHOP_PRICES.fieldRepair),
      });
    }
    if (profile.stock.utility && !this.uraniumKitAvailable) {
      add({
        id: "shop-uranium-kit",
        name: "Uranium-Core Kit",
        description: "Carry one activatable 12-second +25% damage kit.",
        cost: price(SCRAP_SHOP_PRICES.uraniumKit),
      });
    }
    if (profile.stock.utility) {
      add({
        id: "shop-armour-retrofit",
        name: "Armour Retrofit",
        description: `Gain ${SCRAP_SHOP_ARMOUR} armour for this run.`,
        cost: price(SCRAP_SHOP_PRICES.armourRetrofit),
      });
    }

    if (profile.stock.upgrades) {
      const eligibleUpgrades = UPGRADE_ORDER.filter((id) => this.isUpgradeEligible(id));
      for (const upgradeId of eligibleUpgrades) {
        const nextLevel = (this.upgradeLevels.get(upgradeId) ?? 0) + 1;
        add({
          id: `shop-upgrade:${upgradeId}`,
          name: upgradeLevelName(upgradeId, nextLevel),
          description: `Install immediately. ${UPGRADE_CATALOG[upgradeId].levelDescriptions[nextLevel - 1]!}`,
          cost: price(SCRAP_SHOP_PRICES.upgrade),
        });
      }
    }

    if (profile.stock.weapons && this.equippedWeapons.length < MAX_EQUIPPED_WEAPONS) {
      const owned = new Set(this.equippedWeapons.map((weapon) => weapon.weaponId));
      const availableWeapons = this.offerableWeapons().filter((id) => !owned.has(id));
      // The pool went 8 → 20 on the 26 July release. Every unowned weapon used to
      // become a candidate, which at 20 would push ~19 weapon entries into a draw
      // shared with ~26 items and visibly starve the item economy. Take a rotating
      // window instead. RNG-free on purpose, exactly like the level-stat draw:
      // this method is also called by `canRerollScrapShop`, so a `random()` here
      // would consume a variable number of draws and break the replay digest.
      for (const weaponId of rotatingWindow(availableWeapons, SHOP_WEAPON_CANDIDATE_COUNT, this.waveIndex)) {
        const isUnique = WEAPON_CATALOG[weaponId].weaponClass === "unique";
        add({
          id: `shop-weapon:${weaponId}`,
          name: WEAPON_CATALOG[weaponId].displayName,
          description: isUnique
            ? `Unique. ${WEAPON_CATALOG[weaponId].description}`
            : `Add this Tier I weapon to the active rack. ${WEAPON_CATALOG[weaponId].description}`,
          cost: price(SCRAP_SHOP_PRICES.weapon * (isUnique ? SHOP_UNIQUE_WEAPON_PRICE_MULTIPLIER : 1)),
        });
      }
    }

    // Shop items (Brotato overhaul). Items stack, so nothing is filtered by
    // ownership; the profile, rarity and price do the gating.
    for (const definition of ITEM_CATALOG) {
      if (!profileStocksItem(profile, definition)) continue;
      add({
        id: `shop-item:${definition.id}`,
        name: definition.name,
        description: `${definition.description} (${definition.rarity})`,
        cost: price(this.itemPrice(definition.basePrice)),
      });
    }

    return candidates;
  }

  /** Item prices drift up with depth so late shops stay meaningful purchases. */
  private itemPrice(basePrice: number): number {
    return Math.round(basePrice * (1 + Math.max(0, this.waveIndex) * 0.08));
  }

  private drawScrapShopOffers(excludedIds: ReadonlySet<string> = new Set()): DecisionOption[] {
    const allCandidates = this.buildScrapShopCandidates();
    const offers: DecisionOption[] = [];
    const campaignRepair = this.expeditionEncounter !== null
      && this.playerHealth < this.playerMaxHealth
      && this.shopLockedOfferId !== "shop-repair"
      ? allCandidates.find((candidate) => candidate.id === "shop-repair")
      : undefined;
    if (campaignRepair) offers.push(campaignRepair);
    const candidates = allCandidates.filter((candidate) => (
      candidate.id !== campaignRepair?.id && !excludedIds.has(candidate.id)
    ));
    // Rarity-weighted draw, bent by luck/curse. This deliberately spends
    // exactly one `random()` per offer, like the uniform draw it replaces —
    // the RNG stream position is part of the deterministic replay digest, so
    // changing *which* candidate is picked is safe but changing *how many*
    // draws happen is not.
    const luck = this.playerStats.luck;
    const curse = this.playerStats.curse;
    while (offers.length < SCRAP_SHOP_OFFER_COUNT && candidates.length > 0) {
      const weights = candidates.map((candidate) => shopOfferDrawWeight(candidate.id, luck, curse));
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      let roll = this.random() * total;
      let index = 0;
      while (index < candidates.length - 1) {
        roll -= weights[index]!;
        if (roll <= 0) break;
        index += 1;
      }
      offers.push(candidates.splice(index, 1)[0]!);
    }
    offers.sort((left, right) => Number(right.affordable) - Number(left.affordable));
    return offers;
  }

  private buildScrapShopDecision(): PendingDecision {
    if (this.shopOffers === null) this.shopOffers = this.drawScrapShopOffers();
    this.shopOffers = this.shopOffers.map((offer) => ({
      ...offer,
      affordable: (offer.cost ?? 0) <= this.securedScrap,
    }));

    if (this.shopMode === "manage") return this.buildScrapShopManagementDecision();
    if (this.shopMode === "sell") return this.buildScrapShopSellDecision();

    const offers = this.shopOffers.map((offer) => ({
      ...offer,
      name: offer.id === this.shopLockedOfferId ? `${offer.name} [LOCKED]` : offer.name,
    }));
    offers.push({
      id: "shop-manage",
      name: "Manage Stock",
      description: "Lock an offer, use this visit's reroll, or sell a weapon.",
      cost: 0,
      affordable: true,
    });
    offers.push({
      id: "shop-leave",
      name: "Leave Shop",
      description: "Bank remaining Scrap for the next terminal.",
      cost: 0,
      affordable: true,
    });
    return {
      kind: "scrap-shop",
      title: `${shopProfileById(this.shopProfileId).name.toUpperCase()} — ${this.securedScrap} SCRAP`,
      options: offers,
      shopMode: "offers",
      shopLockedOfferId: this.shopLockedOfferId,
      shopRerollUsed: this.shopRerollUsed,
      shopRerollCost: this.currentShopRerollCost(),
    };
  }

  private buildScrapShopManagementDecision(): PendingDecision {
    const options: DecisionOption[] = this.shopOffers!.map((offer, index) => ({
      id: `shop-lock:${offer.id}`,
      name: offer.id === this.shopLockedOfferId ? `Unlock Offer ${index + 1}` : `Lock Offer ${index + 1}`,
      description: `${offer.name}: ${offer.id === this.shopLockedOfferId ? "will reroll normally" : "survives the paid reroll"}.`,
      affordable: true,
    }));
    const rerollCost = this.currentShopRerollCost();
    const canReroll = this.canRerollScrapShop();
    options.push({
      id: "shop-reroll",
      name: this.shopRerollUsed ? "Reroll Used" : "Reroll Unlocked Stock",
      description: this.shopRerollUsed
        ? "Only one reroll is available per visit."
        : canReroll ? "Replace every offer except the locked one." : "No complete replacement rack is available.",
      cost: rerollCost,
      affordable: !this.shopRerollUsed && canReroll && rerollCost <= this.securedScrap,
    });
    for (const [index, offer] of this.shopOffers!.entries()) {
      options.push({
        id: `shop-ban:${offer.id}`,
        name: `Ban Offer ${index + 1}`,
        description: `${offer.name}: never restocks for the rest of this run.`,
        affordable: true,
      });
    }
    options.push({ id: "shop-sell-menu", name: "Sell Weapon", description: "Recover 50% of its total shop value.", affordable: true });
    options.push({ id: "shop-back", name: "Back to Offers", description: "Return to the salvage counter.", affordable: true });
    return {
      kind: "scrap-shop",
      title: `MANAGE STOCK — ${this.securedScrap} SCRAP`,
      options,
      shopMode: "manage",
      shopLockedOfferId: this.shopLockedOfferId,
      shopRerollUsed: this.shopRerollUsed,
      shopRerollCost: rerollCost,
    };
  }

  private buildScrapShopSellDecision(): PendingDecision {
    const tiles = [
      ...this.weaponInventory.rack.flatMap((slot) => slot.tile ? [slot.tile] : []),
      ...this.weaponInventory.stash.flatMap((tile) => tile ? [tile] : []),
    ];
    const options: DecisionOption[] = tiles.map((tile) => {
      const active = this.equippedWeapons.some((weapon) => weapon.instanceId === tile.instanceId);
      const canSell = !active || this.equippedWeapons.length > 1;
      const value = scrapShopWeaponSaleValue(tile.tier, this.perkModifiers.weaponSaleFraction);
      return {
        id: `shop-sell:${tile.instanceId}`,
        name: `${WEAPON_CATALOG[tile.weaponId].displayName} — Tier ${tile.tier}`,
        description: canSell ? `Sell for ${value} Scrap.` : "Keep at least one active weapon.",
        affordable: canSell,
      };
    });
    options.push({ id: "shop-back", name: "Back to Stock", description: "Return without selling.", affordable: true });
    return {
      kind: "scrap-shop",
      title: `SELL WEAPON — ${this.securedScrap} SCRAP`,
      options,
      shopMode: "sell",
      shopLockedOfferId: this.shopLockedOfferId,
      shopRerollUsed: this.shopRerollUsed,
      shopRerollCost: this.currentShopRerollCost(),
    };
  }

  private currentShopRerollCost(): number {
    return scrapShopRerollCost(this.waveIndex + 1);
  }

  private rerollScrapShopOffers(): void {
    const locked = this.shopOffers?.find((offer) => offer.id === this.shopLockedOfferId) ?? null;
    const excluded = new Set(this.shopOffers?.map((offer) => offer.id) ?? []);
    const replacements = this.drawScrapShopOffers(excluded)
      .slice(0, locked ? SCRAP_SHOP_OFFER_COUNT - 1 : SCRAP_SHOP_OFFER_COUNT);
    this.shopOffers = locked ? [locked, ...replacements] : replacements;
  }

  private canRerollScrapShop(): boolean {
    if (!this.shopOffers) return false;
    const excluded = new Set(this.shopOffers.map((offer) => offer.id));
    const unlockedCount = this.shopOffers.length - (this.shopLockedOfferId ? 1 : 0);
    return this.buildScrapShopCandidates().filter((candidate) => !excluded.has(candidate.id)).length >= unlockedCount;
  }

  private sellWeapon(instanceId: number): boolean {
    const rackSlot = this.weaponInventory.rack.find((slot) => slot.tile?.instanceId === instanceId);
    const stashIndex = this.weaponInventory.stash.findIndex((tile) => tile?.instanceId === instanceId);
    const tile = rackSlot?.tile ?? (stashIndex >= 0 ? this.weaponInventory.stash[stashIndex] : null);
    if (!tile) return false;
    const activeIndex = this.equippedWeapons.findIndex((weapon) => weapon.instanceId === instanceId);
    if (activeIndex >= 0 && this.equippedWeapons.length <= 1) return false;
    if (rackSlot) rackSlot.tile = null;
    if (stashIndex >= 0) this.weaponInventory.stash[stashIndex] = null;
    if (activeIndex >= 0) this.equippedWeapons.splice(activeIndex, 1);
    const amount = scrapShopWeaponSaleValue(tile.tier, this.perkModifiers.weaponSaleFraction);
    this.securedScrap += amount;
    this.frameEvents.push({ type: "weapon-sold", weaponId: tile.weaponId, amount, total: this.securedScrap });
    return true;
  }

  private resetScrapShopVisit(): void {
    this.shopOffers = null;
    this.shopLockedOfferId = null;
    this.shopRerollUsed = false;
    this.shopMode = "offers";
  }

  private openScrapShopVisit(profileId: ShopProfileId = DEFAULT_SHOP_PROFILE_ID): PendingDecision {
    this.resetScrapShopVisit();
    this.shopProfileId = profileId;
    return this.buildScrapShopDecision();
  }

  private applyScrapShopPurchase(optionId: string): void {
    if (optionId === "shop-repair") {
      this.grantHealing(SCRAP_SHOP_REPAIR * this.supportEffectMultiplier);
      return;
    }
    if (optionId === "shop-uranium-kit") {
      this.uraniumKitAvailable = true;
      return;
    }
    if (optionId === "shop-armour-retrofit") {
      this.defence.armour += SCRAP_SHOP_ARMOUR;
      return;
    }
    if (optionId.startsWith("shop-upgrade:")) {
      const upgradeId = optionId.slice("shop-upgrade:".length) as UpgradeId;
      if (upgradeId in UPGRADE_CATALOG && this.isUpgradeEligible(upgradeId)) {
        const nextLevel = (this.upgradeLevels.get(upgradeId) ?? 0) + 1;
        this.upgradeLevels.set(upgradeId, nextLevel);
        this.applyUpgrade(upgradeId, nextLevel);
      }
      return;
    }
    if (optionId.startsWith("shop-weapon:")) {
      const weaponId = optionId.slice("shop-weapon:".length) as WeaponId;
      if (weaponId in WEAPON_CATALOG) {
        this.addWeapon(weaponId);
      }
      return;
    }
    if (optionId.startsWith("shop-item:")) {
      const itemId = optionId.slice("shop-item:".length);
      if (itemById(itemId)) {
        this.ownedItemIds.push(itemId);
        this.refreshPlayerStats();
      }
    }
  }

  private fireWeapon(weapon: EquippedWeaponState, aimDirection: Vector2Data, deltaSeconds: number): void {
    const plan = planWeaponFire({
      equippedWeaponCount: this.equippedWeapons.length,
      weaponIndex: this.equippedWeapons.indexOf(weapon),
      playerPosition: this.playerPosition,
      aimDirection,
      attackPattern: weapon.stats.attackPattern,
    });
    const { anchor } = plan;

    if (plan.kind === "melee-sweep") {
      this.fireMeleeSweep(weapon, anchor, aimDirection);
      return;
    }

    if (plan.kind === "beam") {
      this.fireBeam(weapon, anchor, aimDirection, deltaSeconds);
      return;
    }

    if (plan.kind === "orbit") {
      this.fireOrbitZap(weapon, anchor);
      return;
    }

    if (plan.kind === "orbit-blade") {
      this.fireOrbitBlade(weapon, deltaSeconds);
      return;
    }

    if (plan.kind === "deployable") {
      this.deployStructure(weapon, anchor, aimDirection);
      return;
    }

    const triggersGravityPulse = this.nextProjectileAttackTriggersGravityPulse();
    const resolution = resolveFractionalProjectiles(weapon.stats.projectileCount, weapon.projectileCarry);
    weapon.projectileCarry = resolution.carry;
    const spreadRadians = weapon.stats.spreadRadians * this.movingSpreadFactor();
    const volley = planProjectileVolley({
      anchor,
      aimDirection,
      projectileCount: resolution.count,
      spreadRadians,
    });
    for (const [index, { direction, muzzlePosition }] of volley.entries()) {
      const payload = planOrdinaryProjectilePayload({
        stats: weapon.stats,
        muzzlePosition,
        direction,
        projectileSpeedMultiplier: this.transformationModifiers.projectileSpeedMultiplier,
        damageMultiplier: this.weaponDamageMultiplier(weapon.stats),
        rangeMultiplier: this.weaponRangeMultiplier(),
        relicExplosionRadiusMultiplier: this.relicModifiers.explosionRadiusMultiplier,
        transformationExplosionRadiusMultiplier: this.transformationModifiers.explosionRadiusMultiplier,
        triggersGravityPulse: triggersGravityPulse && index === 0,
      });
      this.spawnFriendlyProjectile({
        ...payload,
        hitEnemyIds: new Set<number>(),
      });

      this.frameEvents.push({
        type: "weapon-fired",
        weaponInstanceId: weapon.instanceId,
        weaponId: weapon.weaponId,
        position: muzzlePosition,
        direction,
      });
    }
  }

  private nextProjectileAttackTriggersGravityPulse(): boolean {
    if (this.transformationModifiers.gravityPulseRadiusMetres <= 0) return false;
    this.gravityPulseAttackCount += 1;
    return this.gravityPulseAttackCount % GRAVITY_PULSE_EVERY_NTH_ATTACK === 0;
  }

  /**
   * Deployable weapons (31 July 2026) — the first player-owned entity in the
   * game. The Sentry Stake plants a unit that fights on its own, so the weapon
   * fires once and the *structure* keeps firing.
   *
   * `engineering` is read here and nowhere else: it is the stat this pattern
   * was reserved for, and it scales all three of the levers that matter —
   * how long the stake lives, how much it can absorb, and how fast it shoots.
   */
  private deployStructure(
    weapon: EquippedWeaponState,
    anchor: Vector2Data,
    direction: Vector2Data,
  ): void {
    const placement = planStructurePlacement({
      stats: weapon.stats,
      existingDeployables: this.deployables,
      anchor,
      direction,
      widthMetres: this.widthMetres,
      heightMetres: this.heightMetres,
      engineeringScale: this.engineeringScale(),
      weaponDamageMultiplier: this.weaponDamageMultiplier(weapon.stats),
    });
    if (placement.retireDeployableId !== null) {
      const retired = this.deployables.find((unit) => unit.id === placement.retireDeployableId);
      if (retired) retired.dead = true;
    }
    this.deployables.push({
      id: this.nextId(),
      weaponId: weapon.weaponId,
      kind: "structure",
      position: placement.position,
      health: placement.health,
      maxHealth: placement.health,
      remainingSeconds: placement.remainingSeconds,
      cooldownSeconds: 0,
      shotDamage: placement.shotDamage,
      orbitAngleRadians: 0,
      dead: false,
    });
    this.frameEvents.push({ type: "deployable-placed", position: { ...placement.position }, weaponId: weapon.weaponId });
  }

  /** Cybernetic Ascension: one persistent support drone per committed run. */
  private spawnAuxiliaryDrone(shotDamage: number): void {
    this.deployables.push({
      id: this.nextId(),
      weaponId: "auxiliary-drone",
      kind: "auxiliary-drone",
      position: { x: this.playerPosition.x + 1.15, y: this.playerPosition.y - 0.45 },
      health: 1,
      maxHealth: 1,
      remainingSeconds: Number.MAX_SAFE_INTEGER,
      cooldownSeconds: 0,
      shotDamage,
      orbitAngleRadians: 0,
      dead: false,
    });
  }

  /**
   * Engineering's multiplier. 1 at zero engineering, so a run that never picks
   * the stat plays exactly as it did before deployables existed.
   */
  /**
   * Behavioural item effects (31 July 2026). Every trigger has exactly one
   * resolution point, so an item can only describe a moment combat has.
   */
  private fireItemEffects(trigger: ItemEffectTrigger): void {
    const effects = collectItemEffects(this.ownedItemIds);
    if (effects.length === 0) return;

    for (const effect of effects) {
      if (effect.trigger !== trigger) continue;
      // `everyNth` counts kills only; the other triggers are already discrete.
      if (effect.everyNth && effect.everyNth > 1) {
        if (trigger !== "on-kill" || this.itemEffectKillCount % effect.everyNth !== 0) continue;
      }
      switch (effect.type) {
        case "heal": {
          if (this.playerHealth >= this.playerMaxHealth) break;
          const healed = Math.min(effect.amount, this.playerMaxHealth - this.playerHealth);
          this.playerHealth += healed;
          this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount: healed });
          break;
        }
        case "scrap":
          this.secureScrap(effect.amount, "ordinary-drop", this.playerPosition);
          break;
        case "damage-window":
          // Refresh rather than stack: two Kill Clocks should not compound into
          // a permanent multiplier, the same rule powerup buffs already follow.
          this.itemDamageWindowSeconds = Math.max(this.itemDamageWindowSeconds, effect.seconds);
          this.itemDamageWindowFraction = Math.max(this.itemDamageWindowFraction, effect.fraction);
          break;
      }
    }
  }

  private updateItemEffectWindows(deltaSeconds: number): void {
    if (this.itemDamageWindowSeconds > 0) {
      this.itemDamageWindowSeconds -= deltaSeconds;
      if (this.itemDamageWindowSeconds <= 0) {
        this.itemDamageWindowSeconds = 0;
        this.itemDamageWindowFraction = 0;
      }
    }
    if (
      !this.lowHealthEffectSpentThisWave
      && this.playerMaxHealth > 0
      && this.playerHealth / this.playerMaxHealth <= LOW_HEALTH_EFFECT_FRACTION
    ) {
      this.lowHealthEffectSpentThisWave = true;
      this.fireItemEffects("on-low-health");
    }
  }

  private engineeringScale(): number {
    return 1 + Math.max(0, this.playerStats.engineering) / 100;
  }

  private updateDeployables(deltaSeconds: number): void {
    if (this.deployables.length === 0) return;

    for (const unit of this.deployables) {
      if (unit.dead) continue;
      const step = stepDeployableBehavior(unit, {
        deltaSeconds,
        playerPosition: this.playerPosition,
        widthMetres: this.widthMetres,
        heightMetres: this.heightMetres,
      });
      unit.position = step.state.position;
      unit.remainingSeconds = step.state.remainingSeconds;
      unit.cooldownSeconds = step.state.cooldownSeconds;
      unit.orbitAngleRadians = step.state.orbitAngleRadians;
      unit.dead = step.state.dead;
      if (step.expired) {
        this.frameEvents.push({ type: "deployable-expired", position: { ...unit.position }, weaponId: unit.weaponId });
        continue;
      }

      const stats = WEAPON_CATALOG[unit.weaponId];
      if (!step.requestsTarget) continue;

      const target = selectDeployableTarget({
        targets: this.enemies,
        origin: unit.position,
        rangeMetres: stats.rangeMetres,
      });
      if (!target) continue;

      unit.cooldownSeconds = commitDeployableFire(unit, {
        fireIntervalSeconds: stats.fireIntervalSeconds,
        deployFireIntervalSeconds: stats.deployFireIntervalSeconds,
        engineeringScale: this.engineeringScale(),
      }).cooldownSeconds;
      const shot = planDeployableProjectile({
        stats,
        position: unit.position,
        targetPosition: target.position,
        shotDamage: unit.shotDamage,
      });
      this.spawnFriendlyProjectile({
        ...shot.payload,
        hitEnemyIds: new Set<number>(),
      });
      this.frameEvents.push({ type: "deployable-fired", position: { ...unit.position }, weaponId: unit.weaponId });
    }

    this.deployables = this.deployables.filter((unit) => !unit.dead);
  }

  private fireMeleeSweep(
    weapon: EquippedWeaponState,
    anchor: Vector2Data,
    direction: Vector2Data,
  ): void {
    const facing = normalizeVector(direction);
    const terrainImpact = planMeleeTerrainImpact({
      obstacles: this.activeObstacles(),
      anchor,
      facing,
      reachMetres: this.weaponRange(weapon.stats),
      projectileDamage: weapon.stats.projectileDamage,
      weaponDamageMultiplier: () => this.weaponDamageMultiplier(weapon.stats),
      powerupDamageMultiplier: () => this.currentPowerupDamageMultiplier(),
      terrainDamageMultiplier: weapon.stats.terrainDamageMultiplier,
      relicTerrainDamageMultiplier: this.relicModifiers.terrainDamageMultiplier,
      intersects: segmentIntersectsRectangle,
    });
    if (terrainImpact) {
      this.damageObstacle(
        terrainImpact.obstacle.id,
        terrainImpact.damage,
        terrainImpact.impactPosition,
        "player-melee",
      );
    }
    const halfArc = weapon.stats.meleeArcRadians / 2;
    const targets = selectForwardArcTargets({
      targets: this.enemies,
      origin: anchor,
      facing,
      reachMetres: this.weaponRange(weapon.stats),
      halfAngleRadians: halfArc,
      isPathBlocked: (enemy) => segmentHitsArenaObstacle(anchor, enemy.position, this.activeObstacles()),
    });
    for (const enemy of targets) {
      if (enemy.dead) continue;
      this.damageEnemy(
        enemy,
        composeWeaponHitDamage({
          baseDamage: weapon.stats.projectileDamage,
          weaponDamageMultiplier: this.weaponDamageMultiplier(weapon.stats),
          powerupDamageMultiplier: this.currentPowerupDamageMultiplier(),
          eliteMarkDamageMultiplier: this.eliteMarkDamageMultiplier(enemy),
          rangeDamageMultiplier: this.transformationRangeDamageMultiplier(distance(anchor, enemy.position)),
          critMultiplier: this.rollCritMultiplier(),
        }),
        weapon.stats.damageType,
        weapon.weaponId,
      );
      if (!enemy.dead && weapon.stats.knockbackMetres > 0) {
        enemy.position = resolveCircleMovement(
          enemy.position,
          {
            x: enemy.position.x + facing.x * weapon.stats.knockbackMetres,
            y: enemy.position.y + facing.y * weapon.stats.knockbackMetres,
          },
          enemyRadius(enemy),
          this.collisionArena(),
        );
      }
    }
    this.frameEvents.push({
      type: "weapon-fired",
      weaponInstanceId: weapon.instanceId,
      weaponId: weapon.weaponId,
      position: { ...anchor },
      direction: { ...facing },
    });
  }

  /**
   * Continuous per-second tick damage to every enemy in a forward cone (Cryo
   * Lance's narrow beam, Flamethrower's wide cone — the same mechanic, just
   * `meleeArcRadians` sized differently per weapon). Called every frame the
   * weapon is held, not gated by a fire-interval cooldown — `deltaSeconds`
   * scales the tick to the frame.
   */
  private fireBeam(
    weapon: EquippedWeaponState,
    anchor: Vector2Data,
    direction: Vector2Data,
    deltaSeconds: number,
  ): void {
    const facing = normalizeVector(direction);
    const targets = selectForwardArcTargets({
      targets: this.enemies,
      origin: anchor,
      facing,
      reachMetres: this.weaponRange(weapon.stats),
      halfAngleRadians: weapon.stats.meleeArcRadians / 2,
      isPathBlocked: (enemy) => segmentHitsArenaObstacle(anchor, enemy.position, this.activeObstacles()),
    });
    for (const enemy of targets) {
      if (enemy.dead) continue;
      this.damageEnemy(
        enemy,
        composeWeaponHitDamage({
          baseDamage: weapon.stats.beamDamagePerSecond * deltaSeconds,
          weaponDamageMultiplier: this.weaponDamageMultiplier(weapon.stats),
          powerupDamageMultiplier: this.currentPowerupDamageMultiplier(),
          eliteMarkDamageMultiplier: this.eliteMarkDamageMultiplier(enemy),
          rangeDamageMultiplier: this.transformationRangeDamageMultiplier(distance(anchor, enemy.position)),
          critMultiplier: this.rollCritMultiplier(),
        }),
        weapon.stats.damageType,
        weapon.weaponId,
      );
    }
    this.frameEvents.push({
      type: "weapon-fired",
      weaponInstanceId: weapon.instanceId,
      weaponId: weapon.weaponId,
      position: { ...anchor },
      direction: { ...facing },
    });
  }

  /**
   * Passive orbiting emitter (Tesla Coil): no travelling projectile or aim
   * direction — on each `fireIntervalSeconds` tick it zaps the nearest live
   * enemy in range, then arcs to up to `chainCount` further nearby enemies,
   * each hop carrying less energy (70%, 49%, 34%…), mirroring the falloff
   * `resolveProjectileChain` already uses for a travelling projectile's chain.
   */
  private fireOrbitZap(weapon: EquippedWeaponState, anchor: Vector2Data): void {
    let current = selectOrbitChainTarget({
      targets: this.enemies,
      origin: anchor,
      maximumDistanceMetres: this.weaponRange(weapon.stats),
    });
    if (!current) return;

    const hitEnemyIds = new Set<number>();
    let fromPosition = anchor;
    const totalHops = 1 + weapon.stats.chainCount;
    for (let hop = 0; hop < totalHops && current; hop += 1) {
      hitEnemyIds.add(current.id);
      this.frameEvents.push({
        type: "chain-arc",
        from: { ...fromPosition },
        to: { ...current.position },
        weaponId: weapon.weaponId,
      });
      this.damageEnemy(
        current,
        composeWeaponHitDamage({
          baseDamage: weapon.stats.projectileDamage * Math.pow(0.7, hop),
          weaponDamageMultiplier: this.weaponDamageMultiplier(weapon.stats),
          powerupDamageMultiplier: this.currentPowerupDamageMultiplier(),
          eliteMarkDamageMultiplier: this.eliteMarkDamageMultiplier(current),
          rangeDamageMultiplier: this.transformationRangeDamageMultiplier(distance(anchor, current.position)),
          critMultiplier: this.rollCritMultiplier(),
        }),
        weapon.stats.damageType,
        weapon.weaponId,
      );
      fromPosition = current.position;

      current = selectOrbitChainTarget({
        targets: this.enemies,
        origin: fromPosition,
        maximumDistanceMetres: weapon.stats.chainRadiusMetres,
        excludedIds: hitEnemyIds,
      });
    }

    this.frameEvents.push({
      type: "weapon-fired",
      weaponInstanceId: weapon.instanceId,
      weaponId: weapon.weaponId,
      position: { ...anchor },
      direction: { x: 1, y: 0 },
    });
  }

  /**
   * Persistent orbiting contact hitbox (Sawblade): advances the weapon's own
   * orbit angle every active frame and deals continuous per-second contact
   * damage to any enemy the blade's current position touches. Unlike a beam
   * or the orbit-zap emitter, this has no cone/proximity-to-player check at
   * all — only proximity to the blade's own moving position.
   */
  private fireOrbitBlade(weapon: EquippedWeaponState, deltaSeconds: number): void {
    const motion = advanceOrbitBladeMotion({
      currentAngleRadians: weapon.orbitAngleRadians,
      angularSpeedRadiansPerSecond: weapon.stats.orbitAngularSpeedRadiansPerSecond,
      deltaSeconds,
      orbitRadiusMetres: weapon.stats.orbitRadiusMetres,
      playerPosition: this.playerPosition,
    });
    weapon.orbitAngleRadians = motion.angleRadians;
    const { bladePosition } = motion;
    const targets = selectOrbitContactTargets({
      targets: this.enemies,
      bladePosition,
      contactReachMetres: (enemy) => enemyRadius(enemy) + ORBIT_BLADE_CONTACT_RADIUS_METRES,
    });
    for (const enemy of targets) {
      if (enemy.dead) continue;
      this.damageEnemy(
        enemy,
        composeWeaponHitDamage({
          baseDamage: weapon.stats.beamDamagePerSecond * deltaSeconds,
          weaponDamageMultiplier: this.weaponDamageMultiplier(weapon.stats),
          powerupDamageMultiplier: this.currentPowerupDamageMultiplier(),
          eliteMarkDamageMultiplier: this.eliteMarkDamageMultiplier(enemy),
          rangeDamageMultiplier: this.transformationRangeDamageMultiplier(distance(this.playerPosition, enemy.position)),
          critMultiplier: this.rollCritMultiplier(),
        }),
        weapon.stats.damageType,
        weapon.weaponId,
      );
    }
    this.frameEvents.push({
      type: "weapon-fired",
      weaponInstanceId: weapon.instanceId,
      weaponId: weapon.weaponId,
      position: { ...bladePosition },
      direction: motion.direction,
    });
  }

  private resolveWeaponAimDirection(
    weapon: EquippedWeaponState,
    cursorDirection: Vector2Data,
  ): Vector2Data | null {
    return selectWeaponAimDirection({
      targetingMode: weapon.stats.targetingMode,
      cursorDirection,
      origin: this.playerPosition,
      rangeMetres: this.weaponRange(weapon.stats),
      targets: this.enemies,
      isDesignated: (enemy) => (this.tacticianDesignations.get(enemy.id) ?? 0) > 0,
    });
  }

  private modifyAllWeapons(modifier: (weapon: WeaponRuntimeStats) => void): void {
    for (const weapon of this.equippedWeapons) {
      modifier(weapon.stats);
    }
  }

  private isPlayerEntrenched(): boolean {
    return this.hero.id === "marine"
      && this.stationarySeconds >= this.hero.passive.stationarySecondsRequired;
  }

  private updateAssaultMomentum(deltaSeconds: number): void {
    if (this.hero.id !== "assault" || this.assaultMomentumRemainingSeconds <= 0) return;
    this.assaultMomentumRemainingSeconds = Math.max(0, this.assaultMomentumRemainingSeconds - deltaSeconds);
    if (this.assaultMomentumRemainingSeconds === 0) {
      this.assaultMomentumTargetId = null;
      this.assaultMomentumStacks = 0;
    }
  }

  private updateTacticianDesignations(deltaSeconds: number): void {
    for (const [enemyId, remainingSeconds] of this.tacticianDesignations) {
      const remaining = Math.max(0, remainingSeconds - deltaSeconds);
      const alive = this.enemies.some((enemy) => enemy.id === enemyId && !enemy.dead);
      if (remaining === 0 || !alive) this.tacticianDesignations.delete(enemyId);
      else this.tacticianDesignations.set(enemyId, remaining);
    }
  }

  private assaultMomentumMultiplier(enemyId: number, sourceWeaponId?: WeaponId): number {
    if (
      this.hero.id !== "assault"
      || sourceWeaponId === undefined
      || this.assaultMomentumTargetId !== enemyId
      || this.assaultMomentumRemainingSeconds <= 0
    ) return 1;
    return 1 + this.assaultMomentumStacks * (this.hero.passive.consecutiveHitDamageBonus ?? 0);
  }

  private registerAssaultMomentumHit(enemyId: number, sourceWeaponId?: WeaponId): void {
    if (this.hero.id !== "assault" || sourceWeaponId === undefined) return;
    const sameTarget = this.assaultMomentumTargetId === enemyId && this.assaultMomentumRemainingSeconds > 0;
    this.assaultMomentumTargetId = enemyId;
    this.assaultMomentumStacks = sameTarget
      ? Math.min(
        this.hero.passive.consecutiveHitMaxStacks ?? 0,
        this.assaultMomentumStacks + 1,
      )
      : 1;
    this.assaultMomentumRemainingSeconds = this.hero.passive.consecutiveHitResetSeconds ?? 0;
  }

  private fireUltimate(): void {
    const ultimate = this.hero.ultimate;
    this.ultimateCooldownRemainingSeconds = ultimate.cooldownSeconds * this.transformationModifiers.ultimateCooldownMultiplier;
    if (this.hero.id === "tactician" && ultimate.coordinatedStrike) {
      for (const weapon of this.equippedWeapons) {
        const direction = this.resolveWeaponAimDirection(weapon, this.lastAimDirection) ?? this.lastAimDirection;
        this.fireWeapon(weapon, direction, 0.05);
      }
      this.frameEvents.push({ type: "ultimate-fired", position: { ...this.playerPosition } });
      return;
    }
    if (this.hero.id === "medic") {
      const result = this.applyMedicHealing(
        (ultimate.healAmount ?? 0) * this.supportEffectMultiplier,
        (ultimate.shieldAmount ?? 0) * this.supportEffectMultiplier,
      );
      this.frameEvents.push({
        type: "medic-surge",
        position: { ...this.playerPosition },
        healed: result.healed,
        shieldGained: result.shieldGained,
      });
      return;
    }
    const forwardArc = ultimate.projectileArcRadians;
    for (let index = 0; index < ultimate.projectileCount; index += 1) {
      const angle = forwardArc === undefined
        ? (index / ultimate.projectileCount) * Math.PI * 2
        : Math.atan2(this.lastAimDirection.y, this.lastAimDirection.x)
          + (index / Math.max(1, ultimate.projectileCount - 1) - 0.5) * forwardArc;
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      this.spawnFriendlyProjectile({
        weaponId: this.hero.id === "assault"
          ? "marauder-ar"
          : this.hero.id === "scout" ? "arc-carbine" : "bastion-service-rifle",
        damageType: "physical",
        position: {
          x: this.playerPosition.x + direction.x * 0.6,
          y: this.playerPosition.y + direction.y * 0.6,
        },
        velocity: {
          x: direction.x * ULTIMATE_PROJECTILE_SPEED,
          y: direction.y * ULTIMATE_PROJECTILE_SPEED,
        },
        damage: ultimate.projectileDamage,
        uraniumEligible: false,
        remainingSeconds: ULTIMATE_PROJECTILE_LIFETIME_SECONDS,
        pierceRemaining: ultimate.projectilePierceCount ?? 0,
        explosionRadiusMetres: ultimate.explosionRadiusMetres,
        knockbackMetres: ultimate.projectileKnockbackMetres ?? 0.4,
        chainRemaining: 0,
        chainRadiusMetres: 0,
        hitEnemyIds: new Set<number>(),
        homingTurnRateRadiansPerSecond: 0,
        spawnsGravityWellOnImpact: false,
        pullFieldDurationSeconds: 0,
        pullStrengthMetresPerSecond: 0,
        pullRadiusMetres: 0,
      });
    }
    this.frameEvents.push({ type: "ultimate-fired", position: { ...this.playerPosition } });
  }

  private applyMedicHealing(amount: number, bonusShield = 0): { healed: number; shieldGained: number } {
    const missingHealth = Math.max(0, this.playerMaxHealth - this.playerHealth);
    const healed = Math.min(missingHealth, Math.max(0, amount));
    this.playerHealth += healed;
    const shieldBefore = this.playerShield;
    const overflow = Math.max(0, amount - healed);
    this.playerShield = Math.min(
      this.defence.maxShield + 2 * this.supportEffectMultiplier,
      this.playerShield + overflow + Math.max(0, bonusShield),
    );
    if (healed > 0) {
      this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount: healed });
    }
    return { healed, shieldGained: this.playerShield - shieldBefore };
  }

  /** Ceiling on the bonus pool: half of maximum health. */
  private bonusHealthCap(): number {
    return this.playerMaxHealth * BONUS_HEALTH_CAP_FRACTION;
  }

  /**
   * Heal to full, then bank what would have been thrown away as bonus health.
   *
   * This exists because a heal taken at full health used to do literally
   * nothing — a supply-depot choice or a paid shop repair could be silently
   * worth zero. Bonus health is deliberately weaker than shield per point: it
   * never recharges, so it is spent once and gone.
   *
   * Only player-facing *reward* heals route here. `applyLevelGrowth` is a
   * maximum-health increase rather than a heal, and `applyMedicHealing` already
   * spends its overflow on shield as the medic's identity — feeding both would
   * pay the same overflow twice.
   */
  private grantHealing(amount: number): number {
    const requested = Math.max(0, amount);
    if (requested <= 0) return 0;
    const missingHealth = Math.max(0, this.playerMaxHealth - this.playerHealth);
    const healed = Math.min(missingHealth, requested);
    this.playerHealth += healed;
    const overflow = requested - healed;
    if (overflow > 0) {
      this.playerBonusHealth = Math.min(this.bonusHealthCap(), this.playerBonusHealth + overflow);
    }
    return healed;
  }

  private registerInjectorHit(): void {
    if (this.hero.id !== "medic") return;
    this.medicTriageHits += 1;
    if (this.medicTriageHits < 6) return;
    this.medicTriageHits = 0;
    const result = this.applyMedicHealing(0.75 * this.supportEffectMultiplier);
    this.frameEvents.push({
      type: "medic-triage",
      position: { ...this.playerPosition },
      healed: result.healed,
      shieldGained: result.shieldGained,
    });
  }

  private updateFence(intent: PlayerIntent, deltaSeconds: number): void {
    const fence = this.arena.fence;
    if (!fence) {
      return;
    }
    this.fenceActiveRemainingSeconds = Math.max(0, this.fenceActiveRemainingSeconds - deltaSeconds);
    this.fenceCooldownRemainingSeconds = Math.max(0, this.fenceCooldownRemainingSeconds - deltaSeconds);

    if (
      intent.interactPressed
      && this.fenceCooldownRemainingSeconds <= 0
      && distance(this.playerPosition, fence.switchPosition) <= FENCE_SWITCH_RANGE_METRES
    ) {
      this.fenceActiveRemainingSeconds = FENCE_ACTIVE_SECONDS;
      this.fenceCooldownRemainingSeconds = FENCE_COOLDOWN_SECONDS;
      this.frameEvents.push({
        type: "fence-activated",
        from: { ...fence.from },
        to: { ...fence.to },
      });
    }

    if (this.fenceActiveRemainingSeconds <= 0) {
      return;
    }
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const reach = FENCE_CONTACT_RANGE_METRES + enemyRadius(enemy) * 0.5;
      if (distanceToSegment(enemy.position, fence.from, fence.to) <= reach) {
        this.damageEnemy(enemy, FENCE_DAMAGE_PER_SECOND * deltaSeconds, "shock");
      }
    }
  }

  private fenceSnapshot(): FenceSnapshot | null {
    const fence = this.arena.fence;
    if (!fence) {
      return null;
    }
    return {
      switchPosition: { ...fence.switchPosition },
      from: { ...fence.from },
      to: { ...fence.to },
      active: this.fenceActiveRemainingSeconds > 0,
      activeRemainingSeconds: this.fenceActiveRemainingSeconds,
      ready: this.fenceCooldownRemainingSeconds <= 0,
      cooldownRemainingSeconds: this.fenceCooldownRemainingSeconds,
      playerNearSwitch:
        distance(this.playerPosition, fence.switchPosition) <= FENCE_SWITCH_RANGE_METRES,
    };
  }

  private currentAttackSpeedMultiplier(): number {
    return finalAttackSpeedFactor(this.defence.attackSpeedMultiplier
      * (this.isBuffActive("overcharge") ? OVERCHARGE_ATTACK_SPEED_MULTIPLIER : 1)
      * (this.isBuffActive("last-stand-stimulant") ? LAST_STAND_STIMULANT_ATTACK_SPEED_MULTIPLIER : 1)
      * this.transformationModifiers.fireRateMultiplier
      * (this.isBraced() ? BRACE_ATTACK_SPEED_MULTIPLIER : 1)
      * (this.hero.id === "scout" && this.scoutSlipstreamRemainingSeconds > 0
        ? 1 + (this.hero.passive.postEvasiveAttackSpeedBonus ?? 0)
        : 1)
      * (1 + this.overclockStacks * this.relicModifiers.fireRatePerKill)
      * (1 + this.playerStats.attackSpeedPercent / 100));
  }

  private currentPowerupDamageMultiplier(): number {
    return this.isBuffActive("uranium-core-rounds") ? URANIUM_CORE_ROUNDS_DAMAGE_MULTIPLIER : 1;
  }

  /**
   * Drives the two timed artifacts. Both were granting their modifier to
   * nothing before this existed.
   *
   * Event Horizon Core arms the next impact every `implosionEverySeconds`.
   * Last Bastion Protocol braces the weapons when health drops to critical, then
   * sits on a long cooldown so it reads as an emergency, not a passive.
   */
  private updateArtifactTimers(deltaSeconds: number): void {
    this.retaliationCooldownSeconds = Math.max(0, this.retaliationCooldownSeconds - deltaSeconds);
    if (this.overclockStacks > 0) {
      this.overclockDecaySeconds -= deltaSeconds;
      if (this.overclockDecaySeconds <= 0) {
        this.overclockStacks -= 1;
        this.overclockDecaySeconds = OVERCLOCK_STACK_DECAY_SECONDS;
      }
    }
    this.nearbyKillHealWindowSeconds = Math.max(0, this.nearbyKillHealWindowSeconds - deltaSeconds);

    const implosionEvery = this.relicModifiers.implosionEverySeconds;
    if (implosionEvery !== null && implosionEvery > 0) {
      if (this.eventHorizonCoreArmed) {
        // Stay armed until it is spent on an impact.
      } else {
        this.eventHorizonCoreCooldownSeconds -= deltaSeconds;
        if (this.eventHorizonCoreCooldownSeconds <= 0) {
          this.eventHorizonCoreArmed = true;
          this.eventHorizonCoreCooldownSeconds = implosionEvery;
        }
      }
    }

    if (!this.relicModifiers.criticalHealthBraceFormation) return;
    this.braceCooldownSeconds = Math.max(0, this.braceCooldownSeconds - deltaSeconds);
    if (this.braceRemainingSeconds > 0) {
      this.braceRemainingSeconds = Math.max(0, this.braceRemainingSeconds - deltaSeconds);
      return;
    }
    const critical = this.playerHealth / Math.max(1, this.playerMaxHealth) <= BRACE_HEALTH_FRACTION;
    if (critical && this.braceCooldownSeconds <= 0) {
      this.braceRemainingSeconds = BRACE_DURATION_SECONDS;
      this.braceCooldownSeconds = BRACE_COOLDOWN_SECONDS;
      this.frameEvents.push({ type: "brace-formation", position: { ...this.playerPosition } });
    }
  }

  /** True while Last Bastion Protocol's brace window is open. */
  private isBraced(): boolean {
    return this.braceRemainingSeconds > 0;
  }

  /**
   * Broodbreaker Seal: a destroyed egg bursts, damaging nearby aliens. Called
   * from the defeat path so it fires when the player kills the egg, not when it
   * hatches on its own.
   */
  private applyBroodbreakerBurst(egg: EnemyState): void {
    const damage = this.relicModifiers.eggDeathDamage;
    if (damage <= 0) return;
    for (const nearby of this.enemies) {
      if (nearby.dead || nearby.id === egg.id) continue;
      if (distance(nearby.position, egg.position) > BROODBREAKER_BURST_RADIUS_METRES) continue;
      this.damageEnemy(nearby, damage, "physical");
    }
    this.frameEvents.push({
      type: "explosion",
      position: { ...egg.position },
      radiusMetres: BROODBREAKER_BURST_RADIUS_METRES,
    });
  }

  /**
   * Psionic "Telekinetic Focus": every Nth qualifying hit shoves an ordinary
   * enemy back without stunning it. Ranked enemies are exempt, matching the
   * trait's "elites and bosses use resistance" rule.
   */
  private tickTelekineticPush(enemy: EnemyState, projectile: ProjectileState): void {
    const push = this.transformationModifiers.telekineticPushMetres;
    if (push <= 0 || enemy.dead) return;
    this.telekineticAttackCount += 1;
    if (this.telekineticAttackCount % TELEKINETIC_PUSH_EVERY_NTH_ATTACK !== 0) return;
    if (enemy.rank !== "standard" && enemy.rank !== "treasure") return;
    const direction = normalizeVector(projectile.velocity);
    enemy.position = resolveCircleMovement(
      enemy.position,
      { x: enemy.position.x + direction.x * push, y: enemy.position.y + direction.y * push },
      enemyRadius(enemy),
      this.collisionArena(),
    );
  }

  /**
   * Warp Anchor: a hit throws you clear of the nearest attacker. Uses the same
   * collision resolution as every other displacement, so it cannot post you
   * inside a wall.
   */
  private applyWarpAnchorBlink(): void {
    const blink = this.relicModifiers.blinkOnHitMetres;
    if (blink <= 0) return;
    let nearest: EnemyState | null = null;
    let nearestDistance = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const candidate = distance(enemy.position, this.playerPosition);
      if (candidate < nearestDistance) {
        nearest = enemy;
        nearestDistance = candidate;
      }
    }
    if (!nearest) return;
    const away = normalizeVector({
      x: this.playerPosition.x - nearest.position.x,
      y: this.playerPosition.y - nearest.position.y,
    });
    if (away.x === 0 && away.y === 0) return;
    this.playerPosition = resolveCircleMovement(
      this.playerPosition,
      { x: this.playerPosition.x + away.x * blink, y: this.playerPosition.y + away.y * blink },
      PLAYER_RADIUS_METRES,
      this.collisionArena(),
    );
  }

  /** Overclock Core: kills stack fire rate; the stacks decay if you stop killing. */
  private addOverclockStack(): void {
    if (this.relicModifiers.fireRateKillStackCap <= 0) return;
    this.overclockStacks = Math.min(this.relicModifiers.fireRateKillStackCap, this.overclockStacks + 1);
    this.overclockDecaySeconds = OVERCLOCK_STACK_DECAY_SECONDS;
  }

  /**
   * Mutagenic "Reactive Blood": taking health damage releases a short acid
   * retaliation. Rate-limited exactly as the trait's own rule text states —
   * at most once every 5 seconds, within 1.5 metres.
   */
  private applyRetaliationBurst(): void {
    const damage = this.transformationModifiers.retaliationDamage;
    if (damage <= 0 || this.retaliationCooldownSeconds > 0) return;
    this.retaliationCooldownSeconds = RETALIATION_COOLDOWN_SECONDS;
    let hit = false;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (distance(enemy.position, this.playerPosition) > RETALIATION_RADIUS_METRES) continue;
      // "toxic" is the damage type; "corrode" is the status it builds.
      this.damageEnemy(enemy, damage, "toxic");
      hit = true;
    }
    if (hit) {
      this.frameEvents.push({
        type: "explosion",
        position: { ...this.playerPosition },
        radiusMetres: RETALIATION_RADIUS_METRES,
      });
    }
  }

  /**
   * Alien "Feeding Tendrils": nearby kills restore a sliver of health, capped
   * per rolling window by the trait's rule text (1.5 health per 10 seconds).
   */
  private applyNearbyKillHealing(position: Vector2Data): void {
    const heal = this.transformationModifiers.nearbyKillHealing;
    if (heal <= 0) return;
    if (distance(position, this.playerPosition) > NEARBY_KILL_HEAL_RADIUS_METRES) return;
    if (this.nearbyKillHealWindowSeconds <= 0) {
      this.nearbyKillHealWindowSeconds = NEARBY_KILL_HEAL_WINDOW_SECONDS;
      this.nearbyKillHealPaid = 0;
    }
    const allowance = Math.max(0, NEARBY_KILL_HEAL_WINDOW_CAP - this.nearbyKillHealPaid);
    const amount = Math.min(heal, allowance, this.playerMaxHealth - this.playerHealth);
    if (amount <= 0) return;
    this.nearbyKillHealPaid += amount;
    this.playerHealth += amount;
    this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount });
  }

  /**
   * Field Lattice: collecting health chills nearby aliens. Uses the existing
   * `freeze` status (0.35x speed) rather than inventing a second slow, and
   * respects `canStatusApply` so it can't stun-lock a mini-boss.
   */
  private applyHealthPickupSlowPulse(): void {
    if (!this.relicModifiers.healthPickupSlowPulse) return;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (distance(enemy.position, this.playerPosition) > FIELD_LATTICE_PULSE_RADIUS_METRES) continue;
      if (!this.canStatusApply(enemy, "freeze")) continue;
      enemy.statusTimers.freeze = STATUS_RULES.freeze.durationSeconds;
      this.frameEvents.push({
        type: "status-applied",
        position: { ...enemy.position },
        status: "freeze",
      });
    }
  }

  /**
   * Salvaged Capacitor: every Nth non-melee hit arcs a small chain to another
   * nearby alien. Reuses the `chain-arc` event the Tesla Coil already drives, so
   * the effect is visible with no new rendering.
   */
  private tickSalvagedCapacitorArc(source: EnemyState, weaponId: WeaponId): void {
    const every = this.relicModifiers.chainArcEveryNthAttack;
    if (every === null || every <= 0) return;
    this.relicArcAttackCount += 1;
    if (this.relicArcAttackCount % every !== 0) return;

    let nearest: EnemyState | null = null;
    let nearestDistance = RELIC_ARC_RADIUS_METRES;
    for (const candidate of this.enemies) {
      if (candidate.dead || candidate.id === source.id) continue;
      const candidateDistance = distance(source.position, candidate.position);
      if (candidateDistance < nearestDistance) {
        nearest = candidate;
        nearestDistance = candidateDistance;
      }
    }
    if (!nearest) return;
    this.frameEvents.push({
      type: "chain-arc",
      from: { ...source.position },
      to: { ...nearest.position },
      weaponId,
    });
    this.damageEnemy(nearest, this.relicModifiers.chainArcDamage, "shock", weaponId);
  }

  /**
   * Stabiliser Gyro: tighter weapon spread while the player is on the move.
   * `stationarySeconds` resets to 0 on any frame with movement input, so it
   * doubles as the "moving right now" signal.
   */
  private movingSpreadFactor(): number {
    const moving = this.stationarySeconds === 0 ? this.relicModifiers.movingSpreadMultiplier : 1;
    // Last Bastion Protocol braces the rack into a tighter formation; the
    // Cybernetic targeting trait tightens it permanently.
    return moving
      * (this.isBraced() ? BRACE_SPREAD_MULTIPLIER : 1)
      * this.transformationModifiers.weaponSpreadMultiplier;
  }

  /**
   * Hunter Optics: elites are marked and take bonus direct/weak-point damage.
   * Hunter's Beacon marks them without needing the buff active — that relic was
   * granting `eliteMarkedEarlier` to nothing before this read it.
   */
  private eliteMarkDamageMultiplier(enemy: EnemyState): number {
    if (enemy.rank !== "elite") return 1;
    const marked = this.isBuffActive("hunter-optics") || this.relicModifiers.eliteMarkedEarlier;
    // …and it punishes a telegraphed miss for a short window afterwards.
    const missBonus = (enemy.missWindowRemainingSeconds ?? 0) > 0
      ? this.relicModifiers.eliteBonusDamageAfterMiss
      : 0;
    return (marked ? HUNTER_OPTICS_ELITE_DAMAGE_MULTIPLIER : 1) * (1 + missBonus);
  }

  /**
   * `rangePercent` as a multiplier. Wired 26 July 2026 — the stat existed with
   * zero read sites, which blocked the whole range item axis.
   */
  private weaponRangeMultiplier(): number {
    return 1 + this.playerStats.rangePercent / 100;
  }

  /** A weapon's effective reach: melee arc, beam cone, and target acquisition. */
  private weaponRange(stats: WeaponRuntimeStats): number {
    return stats.rangeMetres * this.weaponRangeMultiplier();
  }

  private weaponDamageMultiplier(stats: WeaponRuntimeStats): number {
    const melee = stats.attackPattern === "melee-sweep" || stats.attackPattern === "orbit-blade";
    const elemental = stats.damageType !== "physical";
    return this.levelDamageMultiplier
      * (1 + this.weaponProficiencies[stats.weaponClass] * 0.04)
      * this.berserkerDamageMultiplier()
      * (stats.weaponClass === "heavy" ? this.transformationModifiers.heavyWeaponDamageMultiplier : 1)
      // Butcher's Rig rewards committing to the close-quarters rack; the serum
      // is its temporary, far louder version.
      * (melee ? this.relicModifiers.meleeDamageMultiplier : 1)
      * (melee && this.isBuffActive("butchers-serum") ? BUTCHERS_SERUM_MELEE_MULTIPLIER : 1)
      // Coolant Loop pays off only on sustained beams, so it reads the pattern
      // rather than the weapon class.
      * (stats.attackPattern === "beam" ? this.relicModifiers.beamDamageMultiplier : 1)
      * (melee ? 1 : this.overwatchRangedMultiplier())
      * (1 + this.itemDamageWindowFraction)
      * outgoingDamageMultiplier(this.playerStats, { melee, elemental });
  }

  /**
   * Overwatch Rig: holding a firing position sharpens ranged damage. Reuses the
   * existing `stationarySeconds` clock that Stabiliser Gyro already reads, so
   * this needs no new state — and it is deliberately the mirror of the Gyro,
   * which rewards the opposite habit.
   */
  private overwatchRangedMultiplier(): number {
    const threshold = this.relicModifiers.stationaryRangedBonusAfterSeconds;
    if (threshold === null || this.stationarySeconds < threshold) return 1;
    return 1 + this.relicModifiers.stationaryRangedBonusDamage;
  }

  /**
   * Per-hit crit roll for direct weapon damage (not status ticks or splash).
   * Guarded so a zero crit chance draws no RNG at all — that keeps runs with no
   * crit items byte-identical to today, so the deterministic `ReplayFixture`
   * digest is unaffected until a crit source actually exists.
   */
  private rollCritMultiplier(): number {
    const chance = this.playerStats.critChancePercent;
    if (chance <= 0) return 1;
    if (this.random() < chance / 100) {
      this.runCriticalHits += 1;
      return this.playerStats.critMultiplier;
    }
    return 1;
  }

  /** Psionic Sniper / Tunnel Focus-style transformation effects: damage scales with range to the target. */
  private transformationRangeDamageMultiplier(distanceMetres: number): number {
    if (distanceMetres > TRANSFORMATION_LONG_RANGE_METRES) return this.transformationModifiers.longRangeDamageMultiplier;
    if (distanceMetres < TRANSFORMATION_CLOSE_RANGE_METRES) return this.transformationModifiers.closeRangeDamageMultiplier;
    return 1;
  }

  /** Berserker's Chip artifact: outgoing damage rises as missing health grows. */
  private berserkerDamageMultiplier(): number {
    if (this.relicModifiers.berserkerMaxBonusDamage <= 0 || this.playerMaxHealth <= 0) return 1;
    const missingFraction = Math.max(0, 1 - this.playerHealth / this.playerMaxHealth);
    return 1 + this.relicModifiers.berserkerMaxBonusDamage * missingFraction;
  }

  private isBuffActive(type: PowerupType): boolean {
    return (this.activeBuffs.get(type) ?? 0) > 0;
  }

  private updateBuffs(deltaSeconds: number): void {
    for (const [type, remaining] of this.activeBuffs) {
      const next = remaining - deltaSeconds;
      if (next <= 0) {
        this.activeBuffs.delete(type);
      } else {
        this.activeBuffs.set(type, next);
      }
    }
  }

  private updateRegeneration(deltaSeconds: number): void {
    this.regenerationRemainingSeconds -= deltaSeconds;
    if (this.regenerationRemainingSeconds > 0) return;
    this.regenerationRemainingSeconds += PLAYER_REGEN_INTERVAL_SECONDS;
    if (this.playerHealth >= this.playerMaxHealth) return;
    const perSecondRate = Math.min(
      this.playerMaxHealth * PLAYER_STAT_LIMITS.passiveRegenerationMaxHealthFraction,
      this.hero.baseRegenerationPerSecond
        + this.transformationModifiers.regenerationPerSecondBonus
        + this.playerStats.hpRegenPerSecond,
    );
    const amount = Math.min(
      Math.max(0, perSecondRate) * PLAYER_REGEN_INTERVAL_SECONDS
        * this.supportEffectMultiplier * this.transformationModifiers.healingReceivedMultiplier,
      this.playerMaxHealth - this.playerHealth,
    );
    if (amount <= 0) return;
    this.playerHealth += amount;
    this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount });
  }

  private updateShieldRecharge(deltaSeconds: number): void {
    this.shieldRechargeCooldownSeconds = Math.max(0, this.shieldRechargeCooldownSeconds - deltaSeconds);
    if (
      this.shieldRechargeCooldownSeconds <= 0
      && this.playerShield < this.defence.maxShield
    ) {
      this.playerShield = Math.min(
        this.defence.maxShield,
        // Aegis Reactor artifact speeds the recharge rate.
        this.playerShield + this.defence.shieldRechargePerSecond
          * this.relicModifiers.shieldRechargeMultiplier * this.transformationModifiers.shieldRechargeMultiplier * deltaSeconds,
      );
    }
  }

  /**
   * The prompt the HUD draws. Reports the nearest actionable object in range,
   * which is the same object `updateWorldInteractions` advances — so what the
   * player is told and what the hold actually affects cannot disagree.
   */
  private worldInteractionPrompt(): WorldInteractionPrompt | null {
    let best: WorldInteractionPrompt | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const [objectId, state] of this.worldInteractions) {
      if (state.phase === "disabled" || state.phase === "completed") continue;
      const obstacle = this.arena.obstacles.find((candidate) => candidate.id === objectId);
      const definition = obstacle?.worldObjectId ? worldObjectById(obstacle.worldObjectId) : null;
      if (!obstacle || !definition?.interaction) continue;
      if ((this.obstacleHealth.get(objectId) ?? obstacleMaxDurability(obstacle)) <= 0) continue;

      const centre = obstacleCentre(obstacle);
      const separation = distance(this.playerPosition, centre);
      const reach = Math.max(obstacle.width, obstacle.height) / 2 + INTERACTION_PROMPT_MARGIN_METRES;
      if (separation > reach || separation >= bestDistance) continue;

      bestDistance = separation;
      best = {
        objectId,
        worldObjectId: definition.id,
        verb: interactionPromptVerb(definition.interaction.effect),
        position: { ...centre },
        progress: state.requiredSeconds > 0 ? state.progressSeconds / state.requiredSeconds : 0,
        holding: state.phase === "holding",
      };
    }
    return best;
  }

  /** One interaction state per placed object that carries an interaction. */
  private seedWorldInteractions(): void {
    this.worldInteractions.clear();
    for (const obstacle of this.arena.obstacles) {
      const definition = obstacle.worldObjectId ? worldObjectById(obstacle.worldObjectId) : null;
      if (!definition?.interaction) continue;
      this.worldInteractions.set(obstacle.id, {
        objectId: obstacle.id,
        definitionId: definition.id,
        phase: "available",
        progressSeconds: 0,
        requiredSeconds: definition.interaction.seconds,
        cooldownRemainingSeconds: 0,
        completionCount: 0,
      });
    }
  }

  /**
   * The world-object interaction verb (31 July 2026).
   *
   * `interaction/WorldInteraction.ts` had held a complete, tested hold-to-act
   * state machine since it was authored, imported by nothing. This is the
   * layer that drives it: one candidate at a time — the nearest valid object —
   * so holding the key never progresses two things at once.
   *
   * Objects whose durability has run out are reported destroyed, which the
   * state machine turns into `disabled`. A crate you blew open is not a crate
   * you can also unlock.
   */
  private updateWorldInteractions(intent: PlayerIntent, deltaSeconds: number): void {
    if (this.worldInteractions.size === 0) return;

    const candidates: { objectId: string; definitionId: string; distanceMetres: number; valid: boolean }[] = [];
    for (const [objectId, state] of this.worldInteractions) {
      const obstacle = this.arena.obstacles.find((candidate) => candidate.id === objectId);
      if (!obstacle) continue;
      candidates.push({
        objectId,
        definitionId: state.definitionId,
        distanceMetres: distance(this.playerPosition, obstacleCentre(obstacle)),
        valid: state.phase !== "disabled" && state.phase !== "completed",
      });
    }
    const focus = chooseWorldInteractionCandidate(candidates);

    for (const [objectId, state] of this.worldInteractions) {
      const obstacle = this.arena.obstacles.find((candidate) => candidate.id === objectId);
      const definition = obstacle?.worldObjectId ? worldObjectById(obstacle.worldObjectId) : null;
      if (!obstacle || !definition?.interaction) continue;

      const destroyed = (this.obstacleHealth.get(objectId) ?? obstacleMaxDurability(obstacle)) <= 0;
      const isFocus = focus?.objectId === objectId;
      const centre = obstacleCentre(obstacle);
      const result = stepWorldInteraction({
        state,
        definition: {
          id: definition.id,
          requiredSeconds: definition.interaction.seconds,
          repeatable: false,
          cooldownSeconds: 0,
          promptVerb: interactionPromptVerb(definition.interaction.effect),
        },
        distanceMetres: distance(this.playerPosition, centre),
        footprintMetres: Math.max(obstacle.width, obstacle.height) / 2,
        // Only the focused object advances, so two overlapping prompts cannot
        // both tick off one key press.
        interactHeld: isFocus && Boolean(intent.interactHeld),
        interactPressed: isFocus && intent.interactPressed,
        destroyed,
        paused: this.status !== "combat",
        deltaSeconds,
      });
      this.worldInteractions.set(objectId, result.state);
      if (result.completion) {
        this.applyInteractionEffect(definition.interaction.effect, obstacle, centre);
        this.frameEvents.push({
          type: "world-interaction-completed",
          objectId,
          worldObjectId: definition.id,
          effect: definition.interaction.effect.type,
          position: { ...centre },
        });
      }
    }
  }

  private applyInteractionEffect(
    effect: InteractionEffect,
    obstacle: ArenaDefinition["obstacles"][number],
    position: Vector2Data,
  ): void {
    switch (effect.type) {
      case "open-loot":
        // Same payout shape as a sealed supply chest, so the two read as one
        // idea rather than two economies.
        this.spawnPowerup("medkit", position);
        this.secureScrap(SUPPLY_CHEST_SCRAP, "supply-chest", position);
        break;
      case "harvest-scrap":
        this.secureScrap(effect.scrap, "world-object", position);
        break;
      case "open-gate":
        // Opening a gate is exactly destroying it as far as collision goes; the
        // distinction is that it costs no ammunition and leaves no rubble.
        this.obstacleHealth.set(obstacle.id, 0);
        break;
      default:
        // Unreachable: `IMPLEMENTED_INTERACTION_EFFECTS` gates placement, so an
        // object carrying an unimplemented verb never reaches a room.
        break;
    }
  }

  /** Sealed chests open with the interact key; armored chests only break to gunfire. */
  private updateSupplyChests(intent: PlayerIntent): void {
    if (!intent.interactPressed) {
      return;
    }
    for (const chest of this.supplyChests) {
      if (
        chest.resolved
        || chest.variant !== "sealed"
        || distance(chest.position, this.playerPosition) > SUPPLY_CHEST_OPEN_RANGE_METRES
      ) {
        continue;
      }
      chest.resolved = true;
      this.frameEvents.push({ type: "supply-chest-opened", position: { ...chest.position } });
      this.dropSupplyChestRewards(chest);
      return;
    }
  }

  private damageSupplyChest(chest: SupplyChestState, damage: number): void {
    chest.health = Math.max(0, chest.health - damage);
    if (chest.health > 0) {
      this.frameEvents.push({
        type: "supply-chest-hit",
        position: { ...chest.position },
        remainingHealth: chest.health,
      });
      return;
    }
    chest.resolved = true;
    this.frameEvents.push({ type: "supply-chest-destroyed", position: { ...chest.position } });
    this.dropSupplyChestRewards(chest);
  }

  private dropSupplyChestRewards(chest: SupplyChestState): void {
    const offset = () => (this.random() - 0.5) * 1.2;
    this.spawnPowerup("medkit", {
      x: clamp(chest.position.x + offset(), 0.6, this.widthMetres - 0.6),
      y: clamp(chest.position.y + offset(), 0.6, this.heightMetres - 0.6),
    });
    if (chest.variant === "armored") {
      this.spawnPowerup("medkit", {
        x: clamp(chest.position.x + offset(), 0.6, this.widthMetres - 0.6),
        y: clamp(chest.position.y + offset(), 0.6, this.heightMetres - 0.6),
      });
    } else {
      this.secureScrap(SUPPLY_CHEST_SCRAP, "supply-chest", chest.position);
    }
  }

  private updateProjectiles(deltaSeconds: number): void {
    for (const projectile of this.projectiles) {
      if (projectile.dead) {
        continue;
      }

      if (projectile.homingTurnRateRadiansPerSecond > 0) {
        projectile.velocity = steerProjectileVelocity({
          position: projectile.position,
          velocity: projectile.velocity,
          targets: this.enemies,
          turnRateRadiansPerSecond: projectile.homingTurnRateRadiansPerSecond,
          deltaSeconds,
        });
      }
      const kinematics = stepProjectileKinematics({
        position: projectile.position,
        velocity: projectile.velocity,
        remainingSeconds: projectile.remainingSeconds,
        deltaSeconds,
        widthMetres: this.widthMetres,
        heightMetres: this.heightMetres,
      });
      projectile.position = kinematics.position;
      projectile.remainingSeconds = kinematics.remainingSeconds;

      if (kinematics.outcome === "expired") {
        this.explodeProjectile(projectile, projectile.position);
        projectile.dead = true;
        continue;
      }

      if (kinematics.outcome === "out-of-bounds") {
        projectile.dead = true;
        continue;
      }

      const worldCollision = planProjectileWorldCollision({
        position: projectile.position,
        obstacles: this.activeObstacles(),
        chests: this.supplyChests,
        chestRadiusMetres: SUPPLY_CHEST_RADIUS_METRES,
        hitsObstacle: (position, obstacle) => pointHitsObstacle(position, [obstacle]),
      });
      if (worldCollision?.kind === "obstacle") {
        this.damageObstacle(
          worldCollision.obstacle.id,
          projectile.damage * WEAPON_CATALOG[projectile.weaponId].terrainDamageMultiplier
            * this.relicModifiers.terrainDamageMultiplier,
          projectile.position,
          "player-projectile",
        );
        this.explodeProjectile(projectile, projectile.position);
        projectile.dead = true;
        this.frameEvents.push({
          type: "projectile-blocked",
          position: { ...projectile.position },
          weaponId: projectile.weaponId,
        });
        continue;
      }

      if (worldCollision?.kind === "armored-chest") {
        this.damageSupplyChest(worldCollision.chest, projectile.damage);
        projectile.dead = true;
        continue;
      }

      for (const enemy of this.enemies) {
        if (!projectileContactsEnemy({
          projectilePosition: projectile.position,
          target: enemy,
          hitEnemyIds: projectile.hitEnemyIds,
          contactRadiusMetres: () => enemyRadius(enemy) + 0.14,
        })) {
          continue;
        }

        projectile.hitEnemyIds.add(enemy.id);
        this.frameEvents.push({
          type: "projectile-impact",
          position: { ...enemy.position },
          weaponId: projectile.weaponId,
        });
        const specialImpact = planProjectileSpecialImpact({
          triggersGravityPulse: projectile.triggersGravityPulse ?? false,
          spawnsGravityWellOnImpact: projectile.spawnsGravityWellOnImpact,
          weaponId: projectile.weaponId,
          hitCount: projectile.hitEnemyIds.size,
        });
        if (specialImpact.triggersGravityPulse) {
          projectile.triggersGravityPulse = false;
          this.spawnGravityPulse(enemy.position, projectile.weaponId);
        }

        // Event Horizon's orb never deals a direct hit — touching an enemy just
        // triggers its delayed pull-then-implode field at that position instead.
        if (specialImpact.routesToGravityWell) {
          this.explodeProjectile(projectile, enemy.position);
          projectile.dead = true;
          break;
        }

        if (specialImpact.boltHitIndex !== null) {
          this.frameEvents.push({
            type: "bolt-impact",
            position: { ...enemy.position },
            hitIndex: specialImpact.boltHitIndex,
          });
        }
        const damageMultiplier = this.projectileDamageMultiplier(projectile, enemy);
        const powerupDamageMultiplier = projectile.uraniumEligible
          ? this.currentPowerupDamageMultiplier()
          : 1;
        const eliteMarkDamageMultiplier = projectile.uraniumEligible
          ? this.eliteMarkDamageMultiplier(enemy)
          : 1;
        const rangeDamageMultiplier = this.transformationRangeDamageMultiplier(
          distance(this.playerPosition, enemy.position),
        );
        const critMultiplier = this.rollCritMultiplier();
        this.damageEnemy(
          enemy,
          composeProjectileHitDamage({
            baseDamage: projectile.damage,
            projectileDamageMultiplier: damageMultiplier,
            powerupDamageMultiplier,
            eliteMarkDamageMultiplier,
            rangeDamageMultiplier,
            critMultiplier,
          }),
          projectile.damageType,
          projectile.weaponId,
        );
        if (projectile.weaponId === "injector-carbine") this.registerInjectorHit();
        if (damageMultiplier >= 1) this.applyProjectileKnockback(projectile, enemy);
        this.tickSalvagedCapacitorArc(enemy, projectile.weaponId);
        this.tickTelekineticPush(enemy, projectile);
        this.resolveProjectileChain(projectile, enemy);

        this.explodeProjectile(projectile, enemy.position, enemy.id);

        const pierce = resolveProjectilePierceContinuation(projectile.pierceRemaining);
        projectile.pierceRemaining = pierce.pierceRemaining;
        if (!pierce.continues) {
          projectile.dead = true;
          break;
        }
      }
    }
  }

  private explodeProjectile(
    projectile: ProjectileState,
    position: Vector2Data,
    directEnemyId?: number,
  ): void {
    const route = planProjectileExplosionRoute({
      eventHorizonCoreArmed: this.eventHorizonCoreArmed,
      spawnsGravityWellOnImpact: projectile.spawnsGravityWellOnImpact,
      explosionRadiusMetres: projectile.explosionRadiusMetres,
      artifactDurationSeconds: ARTIFACT_IMPLOSION_DURATION_SECONDS,
      artifactPullStrengthMetresPerSecond: ARTIFACT_IMPLOSION_PULL_SPEED,
      artifactPullRadiusMetres: ARTIFACT_IMPLOSION_PULL_RADIUS_METRES,
      artifactImplosionRadiusMetres: ARTIFACT_IMPLOSION_RADIUS_METRES,
    });
    if (route.kind === "artifact-field") {
      this.eventHorizonCoreArmed = false;
      this.spawnEventHorizonField({
        ...projectile,
        pullFieldDurationSeconds: route.pullFieldDurationSeconds,
        pullStrengthMetresPerSecond: route.pullStrengthMetresPerSecond,
        pullRadiusMetres: route.pullRadiusMetres,
        explosionRadiusMetres: route.explosionRadiusMetres,
      }, position);
      return;
    }
    if (route.kind === "gravity-well") {
      this.spawnEventHorizonField(projectile, position);
      return;
    }
    if (route.kind === "none") return;
    this.frameEvents.push({
      type: "explosion",
      position: { ...position },
      radiusMetres: projectile.explosionRadiusMetres,
      weaponId: projectile.weaponId,
    });
    for (const nearby of this.enemies) {
      const splash = planProjectileSplashImpact({
        candidate: nearby,
        directEnemyId,
        explosionPosition: position,
        explosionRadiusMetres: projectile.explosionRadiusMetres,
        projectileDamage: projectile.damage,
        splashDamageMultiplier: () => this.explosionSplashMultiplier,
      });
      if (!splash) continue;
      this.damageEnemy(splash.target, splash.damage, projectile.damageType, projectile.weaponId);
    }
  }

  /** Event Horizon: a spent gravity-well projectile leaves a delayed pull-then-implode field instead of exploding instantly. */
  private spawnEventHorizonField(projectile: ProjectileState, position: Vector2Data): void {
    this.eventHorizonFields.push({
      id: this.nextId(),
      position: { ...position },
      remainingSeconds: projectile.pullFieldDurationSeconds,
      durationSeconds: projectile.pullFieldDurationSeconds,
      pullStrengthMetresPerSecond: projectile.pullStrengthMetresPerSecond,
      pullRadiusMetres: projectile.pullRadiusMetres,
      implosionRadiusMetres: projectile.explosionRadiusMetres,
      implosionDamage: projectile.damage,
      damageType: projectile.damageType,
      weaponId: projectile.weaponId,
      kind: "event-horizon",
    });
  }

  private spawnGravityPulse(position: Vector2Data, weaponId: WeaponId): void {
    this.eventHorizonFields.push({
      id: this.nextId(),
      position: { ...position },
      remainingSeconds: GRAVITY_PULSE_DURATION_SECONDS,
      durationSeconds: GRAVITY_PULSE_DURATION_SECONDS,
      pullStrengthMetresPerSecond: GRAVITY_PULSE_PULL_SPEED_METRES_PER_SECOND,
      pullRadiusMetres: this.transformationModifiers.gravityPulseRadiusMetres,
      implosionRadiusMetres: 0,
      implosionDamage: 0,
      damageType: "physical",
      weaponId,
      kind: "gravity-pulse",
    });
  }

  /**
   * Every active frame: drags live enemies within `pullRadiusMetres` toward
   * the field's centre at `pullStrengthMetresPerSecond`, without overshooting
   * past it. Once `remainingSeconds` runs out, the field implodes — one burst
   * of damage to everything still within `implosionRadiusMetres` — and is
   * removed.
   */
  private updateEventHorizonFields(deltaSeconds: number): void {
    for (const field of this.eventHorizonFields) {
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const toCentre = { x: field.position.x - enemy.position.x, y: field.position.y - enemy.position.y };
        const gap = Math.hypot(toCentre.x, toCentre.y);
        if (gap <= 0 || gap > field.pullRadiusMetres) continue;
        if (this.hero.id === "tactician" && field.kind === "event-horizon") {
          this.tacticianDesignations.set(enemy.id, this.hero.passive.designateDurationSeconds ?? 0);
        }
        const travel = Math.min(field.pullStrengthMetresPerSecond * deltaSeconds, gap);
        const definition = ENEMY_CATALOG[enemy.type];
        enemy.position = resolveCircleMovement(
          enemy.position,
          {
            x: enemy.position.x + (toCentre.x / gap) * travel,
            y: enemy.position.y + (toCentre.y / gap) * travel,
          },
          enemyRadius(enemy),
          this.collisionArena(),
        );
      }
      field.remainingSeconds -= deltaSeconds;
    }

    const detonating = this.eventHorizonFields.filter((field) => (
      field.remainingSeconds <= 0 && field.kind === "event-horizon"
    ));
    for (const field of detonating) {
      this.frameEvents.push({
        type: "explosion",
        position: { ...field.position },
        radiusMetres: field.implosionRadiusMetres,
        weaponId: field.weaponId,
      });
      for (const enemy of this.enemies) {
        if (enemy.dead || distance(enemy.position, field.position) > field.implosionRadiusMetres) continue;
        this.damageEnemy(enemy, field.implosionDamage, field.damageType, field.weaponId);
      }
    }
    this.eventHorizonFields = this.eventHorizonFields.filter((field) => field.remainingSeconds > 0);
  }

  private projectileDamageMultiplier(projectile: ProjectileState, enemy: EnemyState): number {
    const plan = planProjectileArmourImpact({
      eliteKind: enemy.eliteKind,
      carapacePhase: enemy.carapacePhase,
      projectileVelocity: projectile.velocity,
      enemyFacingDirection: enemy.facingDirection,
    });
    if (plan.emitsArmourHit && enemy.eliteKind === "carapace-scuttler") {
      this.frameEvents.push({
        type: "elite-armour-hit",
        position: { ...enemy.position },
        eliteKind: enemy.eliteKind,
      });
    }
    return plan.damageMultiplier;
  }

  private applyProjectileKnockback(projectile: ProjectileState, enemy: EnemyState): void {
    const destination = planProjectileKnockback({
      enemyPosition: enemy.position,
      enemyDead: enemy.dead,
      projectileVelocity: projectile.velocity,
      knockbackMetres: projectile.knockbackMetres,
    });
    if (!destination) return;
    enemy.position = resolveCircleMovement(
      enemy.position,
      destination,
      enemyRadius(enemy),
      this.collisionArena(),
    );
  }

  private resolveProjectileChain(projectile: ProjectileState, source: EnemyState): void {
    let from = source;
    let hop = 0;
    while (projectile.chainRemaining > 0) {
      const plan = planProjectileChainHop({
        targets: this.enemies,
        fromPosition: from.position,
        hitEnemyIds: projectile.hitEnemyIds,
        chainRemaining: projectile.chainRemaining,
        chainRadiusMetres: projectile.chainRadiusMetres,
        completedHops: hop,
        baseDamage: projectile.damage,
      });
      if (!plan) return;
      const { target } = plan;
      projectile.hitEnemyIds.add(target.id);
      projectile.chainRemaining = plan.chainRemaining;
      hop = plan.hop;
      this.frameEvents.push({
        type: "chain-arc",
        from: { ...from.position },
        to: { ...target.position },
        weaponId: projectile.weaponId,
      });
      // Each additional bounce carries less energy: 70%, 49%, 34%…
      this.damageEnemy(
        target,
        plan.damage,
        projectile.damageType,
        projectile.weaponId,
      );
      from = target;
    }
  }

  private updateEnemies(deltaSeconds: number): void {
    for (const enemy of [...this.enemies]) {
      if (enemy.dead) {
        continue;
      }

      this.tickEnemyStatuses(enemy, deltaSeconds);
      if (enemy.dead) {
        continue;
      }
      if (enemy.type === "aurum-hoarder") {
        this.updateAurumHoarder(enemy, deltaSeconds);
        continue;
      }
      if (this.isEnemyStunned(enemy)) continue;

      enemy.attackCooldownSeconds = Math.max(0, enemy.attackCooldownSeconds - deltaSeconds);
      if (enemy.missWindowRemainingSeconds !== undefined && enemy.missWindowRemainingSeconds > 0) {
        enemy.missWindowRemainingSeconds = Math.max(0, enemy.missWindowRemainingSeconds - deltaSeconds);
      }

      switch (enemy.type) {
        case "scuttler":
          if (enemy.eliteKind === "carapace-scuttler") this.updateCarapaceScuttler(enemy, deltaSeconds);
          else this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG.scuttler.movementSpeedMetresPerSecond, deltaSeconds);
          break;
        case "swarm-scuttler":
          this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG["swarm-scuttler"].movementSpeedMetresPerSecond, deltaSeconds);
          break;
        case "infected-survivor":
          this.updateInfectedSurvivor(enemy, deltaSeconds);
          break;
        case "corrupted-marine":
          this.updateCorruptedMarine(enemy, deltaSeconds);
          break;
        case "abomination":
          this.updateAbomination(enemy, deltaSeconds);
          break;
        case "nest-weaver":
          this.updateNestWeaver(enemy, deltaSeconds);
          break;
        case "nest-pod":
          this.updateNestPod(enemy, deltaSeconds);
          break;
        case "nest-hatchling":
          this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG["nest-hatchling"].movementSpeedMetresPerSecond, deltaSeconds);
          break;
        case "storm-savant":
          this.updateStormSavant(enemy, deltaSeconds);
          break;
        case "storm-node":
          break;
        case "scrap-skitterer":
          this.updateScrapSkitterer(enemy, deltaSeconds);
          break;
        case "arc-warden":
          this.updateArcWarden(enemy, deltaSeconds);
          break;
        case "cyborg-reclaimer":
          this.updateCyborgReclaimer(enemy, deltaSeconds);
          break;
        case "foundry-fabricator":
          this.updateFoundryFabricator(enemy, deltaSeconds);
          break;
        case "foundry-pad":
          break;
        case "foundry-drone":
          this.updateFoundryChild(enemy, deltaSeconds, true);
          break;
        case "foundry-turret":
          this.updateFoundryChild(enemy, deltaSeconds, false);
          break;
        case "egg-cluster":
          this.updateEggCluster(enemy, deltaSeconds);
          break;
        case "brain-blob":
          this.updateBrainBlob(enemy, deltaSeconds);
          break;
        case "slime-spitter":
          this.updateSlimeSpitter(enemy, deltaSeconds);
          break;
        case "blast-mite":
          this.updateBlastMite(enemy, deltaSeconds);
          break;
        case "warp-flanker":
          this.updateWarpFlanker(enemy, deltaSeconds);
          break;
        case "ripper":
          this.updateRipper(enemy, deltaSeconds);
          break;
        case "razor-scuttler":
          this.updateRazorScuttler(enemy, deltaSeconds);
          break;
        case "quillback":
          this.updateQuillback(enemy, deltaSeconds);
          break;
        case "spinewheel":
          this.updateSpinewheel(enemy, deltaSeconds);
          break;
        case "tether-bloom":
          this.updateTetherBloom(enemy, deltaSeconds);
          break;
        case "siege-crusher":
          this.updateSiegeCrusher(enemy, deltaSeconds);
          break;
        case "brood-warden":
          this.updateBroodWarden(enemy, deltaSeconds);
          break;
        case "rift-stalker":
          this.updateRiftStalker(enemy, deltaSeconds);
          break;
        case "synapse-herald":
          this.updateSynapseHerald(enemy, deltaSeconds);
          break;
        case "assembly-prime":
          this.updateAssemblyPrime(enemy, deltaSeconds);
          break;
        case "storm-regent":
          this.updateStormRegent(enemy, deltaSeconds);
          break;
        case "abomination-prime":
          this.updateAbominationPrime(enemy, deltaSeconds);
          break;
        case "bastion-eater":
          this.updateBastionEater(enemy, deltaSeconds);
          break;
      }
    }
  }

  private tickEnemyStatuses(enemy: EnemyState, deltaSeconds: number): void {
    for (const status of Object.keys(enemy.statusTimers) as StatusEffectType[]) {
      const remaining = enemy.statusTimers[status] ?? 0;
      if (remaining <= 0) {
        delete enemy.statusTimers[status];
        continue;
      }
      const rule = STATUS_RULES[status];
      const damagePerSecond = rule.damagePerSecond
        + (status === "blaze" ? this.statusTuning.blazeBonusDamagePerSecond : 0)
        + (status === "corrode" ? this.statusTuning.corrodeBonusDamagePerSecond : 0);
      if (damagePerSecond > 0) {
        this.applyRawDamage(enemy, damagePerSecond * deltaSeconds);
        if (enemy.dead) return;
      }
      const next = remaining - deltaSeconds;
      if (next <= 0) {
        delete enemy.statusTimers[status];
      } else {
        enemy.statusTimers[status] = next;
      }
    }
  }

  private isEnemyStunned(enemy: EnemyState): boolean {
    return (Object.keys(enemy.statusTimers) as StatusEffectType[])
      .some((status) => STATUS_RULES[status].stunned);
  }

  private enemyStatusSpeedMultiplier(enemy: EnemyState): number {
    let multiplier = 1;
    for (const status of Object.keys(enemy.statusTimers) as StatusEffectType[]) {
      const ruleMultiplier = status === "freeze" && this.statusTuning.freezeSpeedMultiplierOverride !== null
        ? this.statusTuning.freezeSpeedMultiplierOverride
        : STATUS_RULES[status].speedMultiplier;
      multiplier = Math.min(multiplier, ruleMultiplier);
    }
    return multiplier;
  }

  private activeStatuses(enemy: EnemyState): StatusEffectType[] {
    return (Object.keys(enemy.statusTimers) as StatusEffectType[])
      .filter((status) => (enemy.statusTimers[status] ?? 0) > 0);
  }

  private updateInfectedSurvivor(enemy: EnemyState, deltaSeconds: number): void {
    const towardPlayer = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    const laneBias = ((enemy.id % 5) - 2) * 0.08;
    const result = stepInfectedSurvivorBehavior(
      {
        phase: enemy.survivorPhase,
        phaseRemainingSeconds: enemy.survivorPhaseRemainingSeconds,
        staminaSeconds: enemy.survivorStaminaSeconds,
        velocity: enemy.survivorVelocity,
      },
      {
        deltaSeconds,
        towardPlayer,
        separation: this.enemySeparation(enemy),
        laneBias,
      },
    );
    enemy.survivorPhase = result.state.phase;
    enemy.survivorPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.survivorStaminaSeconds = result.state.staminaSeconds;
    enemy.survivorVelocity = result.state.velocity;
    enemy.facingDirection = result.facingDirection;
    if (result.rushStarted) {
      this.frameEvents.push({
        type: "infected-survivor-rush",
        position: { ...enemy.position },
        enemyId: enemy.id,
      });
    }
    if (result.movementSpeedMetresPerSecond > 0) {
      this.moveEnemy(
        enemy,
        enemy.facingDirection,
        result.movementSpeedMetresPerSecond,
        deltaSeconds,
      );
    }
  }

  private updateCorruptedMarine(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepCorruptedMarineBehavior(
      {
        phase: enemy.corruptedMarinePhase,
        phaseRemainingSeconds: enemy.corruptedMarinePhaseRemainingSeconds,
        attackCooldownSeconds: enemy.attackCooldownSeconds,
        lockedTarget: enemy.corruptedMarineTarget,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        projectileSlotAvailable: this.availableEnemyProjectileSlots() > 0,
      },
    );
    enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    const resolved = resolveCorruptedMarineAfterMovement(result.state, enemy.position, this.playerPosition);
    enemy.corruptedMarinePhase = resolved.state.phase;
    enemy.corruptedMarinePhaseRemainingSeconds = resolved.state.phaseRemainingSeconds;
    enemy.attackCooldownSeconds = resolved.state.attackCooldownSeconds;
    enemy.corruptedMarineTarget = resolved.state.lockedTarget;
    enemy.facingDirection = resolved.facingDirection;
    if (resolved.warningStarted) {
      this.frameEvents.push({
        type: "corrupted-marine-warning",
        position: { ...enemy.position },
        target: { ...enemy.corruptedMarineTarget },
        enemyId: enemy.id,
      });
    }
    if (result.firesKnife) this.launchCorruptedMarineKnife(enemy);
  }

  private launchCorruptedMarineKnife(enemy: EnemyState): void {
    const direction = normalizeVector({
      x: enemy.corruptedMarineTarget.x - enemy.position.x,
      y: enemy.corruptedMarineTarget.y - enemy.position.y,
    });
    const start = {
      x: enemy.position.x + direction.x * 0.65,
      y: enemy.position.y + direction.y * 0.65,
    };
    this.spawnHostileProjectile({
      type: "corrupted-knife",
      sourceEnemyId: enemy.id,
      position: start,
      velocity: {
        x: direction.x * CORRUPTED_MARINE_KNIFE_SPEED,
        y: direction.y * CORRUPTED_MARINE_KNIFE_SPEED,
      },
      target: { ...enemy.corruptedMarineTarget },
      remainingSeconds: Math.max(
        0.12,
        distance(start, enemy.corruptedMarineTarget) / CORRUPTED_MARINE_KNIFE_SPEED,
      ),
      damage: this.scaledEnemyDamage(enemy, CORRUPTED_MARINE_KNIFE_DAMAGE),
      createsPuddle: false,
    });
    this.frameEvents.push({
      type: "corrupted-marine-knife-fired",
      position: { ...start },
      direction: { ...direction },
      enemyId: enemy.id,
    });
  }

  private updateAbomination(enemy: EnemyState, deltaSeconds: number): void {
    const towardPlayer = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    enemy.facingDirection = towardPlayer;
    const previousPhase = enemy.abominationBehavior.phase;
    const result = stepAbominationBehavior(
      enemy.abominationBehavior,
      deltaSeconds,
      distance(enemy.position, this.playerPosition),
      this.playerPosition,
    );
    enemy.abominationBehavior = result.state;
    if (previousPhase === "shamble" && result.state.phase === "slam-windup" && result.state.lockedTarget) {
      this.frameEvents.push({
        type: "abomination-slam-warning",
        position: { ...enemy.position },
        target: { ...result.state.lockedTarget },
        radiusMetres: ABOMINATION_SLAM_RADIUS_METRES,
        enemyId: enemy.id,
      });
    }
    if (result.slamTriggered && result.state.lockedTarget) {
      const hitPlayer = distance(this.playerPosition, result.state.lockedTarget)
        <= ABOMINATION_SLAM_RADIUS_METRES + PLAYER_RADIUS_METRES;
      const damage = hitPlayer ? this.scaledEnemyDamage(enemy, ABOMINATION_SLAM_DAMAGE) : 0;
      if (hitPlayer) this.damagePlayer(damage, "explosive");
      for (const obstacle of this.activeObstacles()) {
        const closest = {
          x: Math.max(obstacle.x, Math.min(result.state.lockedTarget.x, obstacle.x + obstacle.width)),
          y: Math.max(obstacle.y, Math.min(result.state.lockedTarget.y, obstacle.y + obstacle.height)),
        };
        if (distance(closest, result.state.lockedTarget) <= ABOMINATION_SLAM_RADIUS_METRES) {
          this.damageObstacle(obstacle.id, ABOMINATION_SLAM_TERRAIN_DAMAGE, closest, "enemy-slam");
        }
      }
      this.frameEvents.push({
        type: "abomination-slam-impact",
        position: { ...result.state.lockedTarget },
        radiusMetres: ABOMINATION_SLAM_RADIUS_METRES,
        damage,
        hitPlayer,
        enemyId: enemy.id,
      });
    }
    if (previousPhase !== "recovery" && result.state.phase === "recovery") {
      this.frameEvents.push({
        type: "abomination-recovery",
        position: { ...enemy.position },
        enemyId: enemy.id,
      });
    }
    if (result.movementScale > 0) {
      this.moveEnemy(
        enemy,
        towardPlayer,
        ENEMY_CATALOG.abomination.movementSpeedMetresPerSecond * result.movementScale,
        deltaSeconds,
      );
    }
  }

  private updateAurumHoarder(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepAurumHoarderBehavior(
      {
        phase: enemy.aurumPhase,
        phaseRemainingSeconds: enemy.aurumPhaseRemainingSeconds,
        exitTarget: enemy.aurumExitTarget,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        forageSpeedMetresPerSecond: 1.35,
        fleeSpeedMetresPerSecond: ENEMY_CATALOG["aurum-hoarder"].movementSpeedMetresPerSecond,
      },
    );
    enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    let state = result.state;
    if (result.beginsFleeing) {
      state = beginAurumHoarderFlee(
        state,
        enemy.position,
        this.playerPosition,
        this.widthMetres,
        this.heightMetres,
      );
      this.frameEvents.push({
        type: "aurum-fleeing",
        position: { ...enemy.position },
        target: { ...state.exitTarget },
        remainingSeconds: AURUM_HOARDER_ESCAPE_SECONDS,
      });
    }
    enemy.aurumPhase = state.phase;
    enemy.aurumPhaseRemainingSeconds = state.phaseRemainingSeconds;
    enemy.aurumExitTarget = state.exitTarget;
    if (!result.beginsFleeing && shouldAurumHoarderEscape(state, enemy.position)) this.escapeAurumHoarder(enemy);
  }

  private escapeAurumHoarder(enemy: EnemyState): void {
    if (enemy.dead) return;
    enemy.dead = true;
    this.frameEvents.push({ type: "aurum-escaped", position: { ...enemy.position } });
  }

  private updateEggCluster(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepEggClusterBehavior(
      {
        hatchRemainingSeconds: enemy.hatchRemainingSeconds,
        broodbreakerStalled: enemy.broodbreakerStalled ?? false,
      },
      { deltaSeconds, preventHatchDuringCrack: this.relicModifiers.preventHatchDuringCrack },
    );
    enemy.hatchRemainingSeconds = result.state.hatchRemainingSeconds;
    // Only ever set true, never written back to false — the field is optional
    // and the inline version left it absent until the stall fired.
    if (result.state.broodbreakerStalled) enemy.broodbreakerStalled = true;
    if (!result.hatches) {
      return;
    }

    enemy.dead = true;
    if (this.activeTetherEnemyId === enemy.id) this.activeTetherEnemyId = null;
    this.frameEvents.push({ type: "egg-hatched", position: { ...enemy.position } });
    const offsets = [-0.45, 0.45].slice(0, this.availableDirectorEnemySlots());
    for (const offset of offsets) {
      this.spawnEnemy("scuttler", {
        x: clamp(enemy.position.x + offset, 0.5, this.widthMetres - 0.5),
        y: clamp(enemy.position.y + 0.2, 0.5, this.heightMetres - 0.5),
      });
      if (this.wavesEnabled) this.recordDensitySpawn({ type: "scuttler" });
    }
  }

  private updateNestWeaver(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepNestWeaverBehavior(
      {
        phase: enemy.nestWeaverPhase,
        phaseRemainingSeconds: enemy.nestWeaverPhaseRemainingSeconds,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        movementSpeedMetresPerSecond: ENEMY_CATALOG["nest-weaver"].movementSpeedMetresPerSecond,
        pendingReservationAvailable: enemy.nestPendingReservation !== null,
      },
    );
    enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    enemy.nestWeaverPhase = result.state.phase;
    enemy.nestWeaverPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    if (result.laysPod && enemy.nestPendingReservation) {
      this.spawnNestPod(enemy, enemy.nestPendingReservation);
      enemy.nestPendingReservation = null;
    }
    if (!result.requestsPlacement) return;

    const reservation = tryReserveNestPod({
      activePodsForOwner: this.enemies.filter((candidate) => (
        !candidate.dead && candidate.type === "nest-pod" && candidate.nestPod?.ownerId === enemy.id
      )).length,
      ownerChargesRemaining: enemy.nestWeaverChargesRemaining,
      liveUnits: this.enemies.filter((candidate) => !candidate.dead).length,
      reservedLiveSlots: this.nestReservedLiveSlots,
      liveCap: this.waveLiveCap > 0 ? this.waveLiveCap : 56,
      remainingThreat: enemy.nestWeaverThreatRemaining,
    });
    if (!reservation.accepted) {
      const state = resolveNestWeaverPlacement(result.state, false);
      enemy.nestWeaverPhase = state.phase;
      enemy.nestWeaverPhaseRemainingSeconds = state.phaseRemainingSeconds;
      return;
    }

    const awayFromPlayer = normalizeVector({
      x: enemy.position.x - this.playerPosition.x,
      y: enemy.position.y - this.playerPosition.y,
    });
    const side = enemy.id % 2 === 0 ? 1 : -1;
    enemy.nestWeaverTarget = {
      x: clamp(enemy.position.x + awayFromPlayer.x * 1.25 - awayFromPlayer.y * 0.55 * side, 0.75, this.widthMetres - 0.75),
      y: clamp(enemy.position.y + awayFromPlayer.y * 1.25 + awayFromPlayer.x * 0.55 * side, 0.75, this.heightMetres - 0.75),
    };
    enemy.nestWeaverChargesRemaining -= 1;
    enemy.nestWeaverThreatRemaining -= reservation.reservation.immediatePodThreat
      + reservation.reservation.reservedHatchlingThreat;
    enemy.nestPendingReservation = reservation.reservation;
    this.nestReservedLiveSlots += reservation.reservation.reservedHatchlingSlots;
    this.nestReservedThreat += reservation.reservation.reservedHatchlingThreat;
    const state = resolveNestWeaverPlacement(result.state, true);
    enemy.nestWeaverPhase = state.phase;
    enemy.nestWeaverPhaseRemainingSeconds = state.phaseRemainingSeconds;
    this.frameEvents.push({
      type: "nest-weaver-placement-warning",
      position: { ...enemy.position },
      target: { ...enemy.nestWeaverTarget },
      enemyId: enemy.id,
    });
  }

  private spawnNestPod(owner: EnemyState, reservation: NestPodReservation): void {
    const podId = this.spawnEnemy("nest-pod", owner.nestWeaverTarget);
    const podEnemy = this.enemies.find((candidate) => candidate.id === podId)!;
    podEnemy.nestPod = createNestPod(podId, owner.id, owner.nestWeaverTarget, reservation);
    podEnemy.health = podEnemy.nestPod.health;
    podEnemy.maxHealth = podEnemy.nestPod.health;
    podEnemy.hatchRemainingSeconds = NEST_POD_HATCH_SECONDS;
    podEnemy.hatchDurationSeconds = NEST_POD_HATCH_SECONDS;
    this.frameEvents.push({
      type: "nest-pod-laid",
      position: { ...podEnemy.position },
      ownerId: owner.id,
      podId,
      hatchSeconds: NEST_POD_HATCH_SECONDS,
    });
  }

  private updateNestPod(enemy: EnemyState, deltaSeconds: number): void {
    if (!enemy.nestPod) return;
    const result = stepNestPodBehavior(enemy.nestPod, deltaSeconds);
    enemy.nestPod = result.pod;
    enemy.hatchRemainingSeconds = result.pod.remainingSeconds;
    if (!result.action) return;

    this.nestReservedLiveSlots = Math.max(0, this.nestReservedLiveSlots - result.action.consumedReservedSlots);
    this.nestReservedThreat = Math.max(0, this.nestReservedThreat - result.action.consumedReservedThreat);
    enemy.dead = true;
    for (const offset of result.action.offsets) {
      this.spawnEnemy("nest-hatchling", {
        x: clamp(enemy.position.x + offset.x, 0.4, this.widthMetres - 0.4),
        y: clamp(enemy.position.y + offset.y, 0.4, this.heightMetres - 0.4),
      });
    }
    this.frameEvents.push({
      type: "nest-pod-hatched",
      position: { ...enemy.position },
      podId: enemy.id,
      count: NEST_HATCHLING_COUNT,
    });
  }

  private updateStormSavant(enemy: EnemyState, deltaSeconds: number): void {
    const nodes = this.enemies.filter((candidate) => (
      !candidate.dead
      && candidate.type === "storm-node"
      && candidate.stormNodeOwnerId === enemy.id
      && candidate.conductiveNode
    )).map((candidate) => candidate.conductiveNode!);
    const result = stepStormSavantBehavior(
      { chain: enemy.stormChain, cooldownSeconds: enemy.stormCooldownSeconds },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        movementSpeedMetresPerSecond: ENEMY_CATALOG["storm-savant"].movementSpeedMetresPerSecond,
        nodes,
      },
    );
    enemy.stormChain = result.state.chain;
    enemy.stormCooldownSeconds = result.state.cooldownSeconds;
    enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    if (result.interrupted) {
      this.frameEvents.push({ type: "storm-chain-interrupted", position: { ...enemy.position }, enemyId: enemy.id });
    }
    if (result.discharged) {
      const hitPlayer = pointInsideStormChain(this.playerPosition, result.state.chain.segments, PLAYER_RADIUS_METRES);
      const damage = hitPlayer
        ? this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.stormChain)
        : 0;
      if (damage > 0) this.damagePlayer(damage);
      this.frameEvents.push({
        type: "storm-chain-discharged",
        position: { ...enemy.position },
        enemyId: enemy.id,
        hitPlayer,
        damage,
      });
    }
    if (result.requestsChainStart) {
      const chain = this.buildStormChain(enemy);
      const state = resolveStormSavantChainStart(result.state, chain);
      enemy.stormChain = state.chain;
      enemy.stormCooldownSeconds = state.cooldownSeconds;
      if (chain) {
        this.frameEvents.push({
          type: "storm-chain-warning",
          position: { ...enemy.position },
          enemyId: enemy.id,
          segments: chain.segments,
        });
      }
    }
  }

  private buildStormChain(enemy: EnemyState): StormChainState | null {
    const nodeEnemies = this.enemies.filter((candidate) => (
      !candidate.dead
      && candidate.type === "storm-node"
      && candidate.stormNodeOwnerId === enemy.id
      && candidate.conductiveNode
    ));
    let chain: StormChainState | null = null;
    if (nodeEnemies.length > 0) {
      const locked = lockStormChain(enemy.position, nodeEnemies.map((candidate) => candidate.conductiveNode!));
      chain = locked ? { ...locked, segments: clipStormChainToCover(locked.segments, this.activeObstacles()) } : null;
    } else {
      const plan = planStormNodePlacement(
        enemy.position,
        this.playerPosition,
        this.collisionArena(),
        this.nextEntityId,
        PLAYER_RADIUS_METRES,
      );
      if (plan) {
        for (const plannedNode of plan.nodes) {
          const id = this.spawnEnemy("storm-node", plannedNode.position);
          const nodeEnemy = this.enemies.find((candidate) => candidate.id === id)!;
          nodeEnemy.conductiveNode = createConductiveNode(id, plannedNode.position);
          nodeEnemy.stormNodeOwnerId = enemy.id;
          nodeEnemy.health = nodeEnemy.conductiveNode.health;
          nodeEnemy.maxHealth = nodeEnemy.conductiveNode.health;
        }
        chain = plan.chain;
      }
    }
    return chain;
  }

  private updateScrapSkitterer(enemy: EnemyState, deltaSeconds: number): void {
    const previousPhase = enemy.scrapSkittererBehavior.phase;
    const result = stepScrapSkittererBehavior(
      enemy.scrapSkittererBehavior,
      deltaSeconds,
      enemy.position,
      this.playerPosition,
    );
    enemy.scrapSkittererBehavior = result.state;
    enemy.facingDirection = result.state.phase === "approach"
      ? result.movementDirection
      : result.state.lockedDirection;
    if (previousPhase === "approach" && result.state.phase === "rush-windup") {
      this.frameEvents.push({
        type: "scrap-skitterer-warning",
        position: { ...enemy.position },
        direction: { ...result.state.lockedDirection },
        enemyId: enemy.id,
      });
    }
    if (result.rushStarted) {
      this.frameEvents.push({
        type: "scrap-skitterer-rush",
        position: { ...enemy.position },
        direction: { ...result.state.lockedDirection },
        enemyId: enemy.id,
      });
    }
    if (result.movementSpeedMetresPerSecond <= 0) {
      if (previousPhase === "rush" && result.state.phase === "brake") {
        this.frameEvents.push({
          type: "scrap-skitterer-impact",
          position: { ...enemy.position },
          reason: "miss",
          enemyId: enemy.id,
        });
      }
      return;
    }

    const before = { ...enemy.position };
    this.moveEnemy(enemy, result.movementDirection, result.movementSpeedMetresPerSecond, deltaSeconds);
    if (result.state.phase !== "rush") return;
    const expectedDistance = result.movementSpeedMetresPerSecond
      * enemy.movementSpeedMultiplier
      * this.enemyStatusSpeedMultiplier(enemy)
      * deltaSeconds;
    const actualDistance = distance(before, enemy.position);
    if (actualDistance < expectedDistance * 0.45) {
      enemy.scrapSkittererBehavior = brakeScrapSkitterer(enemy.scrapSkittererBehavior);
      this.frameEvents.push({
        type: "scrap-skitterer-impact",
        position: { ...enemy.position },
        reason: "cover",
        enemyId: enemy.id,
      });
      return;
    }
    if (
      distance(enemy.position, this.playerPosition)
      <= ENEMY_CATALOG["scrap-skitterer"].radiusMetres + PLAYER_RADIUS_METRES
    ) {
      const damage = this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.scrapSkittererRush);
      this.damagePlayer(damage);
      enemy.scrapSkittererBehavior = brakeScrapSkitterer(enemy.scrapSkittererBehavior);
      this.frameEvents.push({
        type: "scrap-skitterer-impact",
        position: { ...enemy.position },
        reason: "player",
        enemyId: enemy.id,
      });
      return;
    }
  }

  private updateArcWarden(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepArcWardenCombatBehavior(
      enemy.arcWardenBehavior,
      {
        deltaSeconds,
        enemyId: enemy.id,
        position: enemy.position,
        playerPosition: this.playerPosition,
        obstacles: this.activeObstacles(),
        movementSpeedMetresPerSecond: ENEMY_CATALOG["arc-warden"].movementSpeedMetresPerSecond,
      },
    );
    enemy.arcWardenBehavior = result.state;

    enemy.facingDirection = result.facingDirection;
    if (result.warningStarted && result.state.lockedLane) {
      this.frameEvents.push({
        type: "arc-warden-warning",
        position: { ...enemy.position },
        enemyId: enemy.id,
        lane: result.state.lockedLane,
      });
    }
    if (result.discharged && result.state.lockedLane) {
      const hitPlayer = pointInsideArcWardenLane(
        this.playerPosition,
        result.state.lockedLane,
        PLAYER_RADIUS_METRES,
      );
      const damage = hitPlayer
        ? this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.arcWardenBeam)
        : 0;
      if (damage > 0) this.damagePlayer(damage);
      this.frameEvents.push({
        type: "arc-warden-discharged",
        position: { ...enemy.position },
        endpoint: { ...result.state.lockedLane.to },
        enemyId: enemy.id,
        hitPlayer,
        damage,
        ...(result.state.lockedLane.blockedByObstacleId
          ? { blockedByObstacleId: result.state.lockedLane.blockedByObstacleId }
          : {}),
      });
    }

    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
  }

  private updateCyborgReclaimer(enemy: EnemyState, deltaSeconds: number): void {
    const previousTargetId = enemy.reclaimerBehavior.targetId;
    const lockedTarget = previousTargetId === null
      ? null
      : this.enemies.find((candidate) => candidate.id === previousTargetId && !candidate.dead) ?? null;
    const wasDamaged = enemy.reclaimerDamagedSinceLastStep;
    enemy.reclaimerDamagedSinceLastStep = false;
    const repairTargets = this.enemies
      .filter((candidate) => !candidate.dead)
      .map((candidate) => this.reclaimerRepairTarget(candidate));
    const activeLinkOwnerId = this.enemies.find((candidate) => (
      !candidate.dead
      && candidate.type === "cyborg-reclaimer"
      && candidate.id !== enemy.id
      && candidate.reclaimerBehavior.phase === "channel"
    ))?.id ?? null;
    const result = stepCyborgReclaimerBehavior(
      enemy.reclaimerBehavior,
      {
        deltaSeconds,
        ownerId: enemy.id,
        ownerPosition: enemy.position,
        playerPosition: this.playerPosition,
        movementSpeedMetresPerSecond: ENEMY_CATALOG["cyborg-reclaimer"].movementSpeedMetresPerSecond,
        lockedTarget: lockedTarget ? this.reclaimerRepairTarget(lockedTarget) : null,
        repairTargets,
        activeLinkOwnerId,
        ownerWasDamaged: wasDamaged,
      },
    );
    enemy.reclaimerBehavior = result.state;

    if (result.interrupted) {
      this.frameEvents.push({
        type: "reclaimer-link-interrupted",
        position: { ...enemy.position },
        enemyId: enemy.id,
        targetId: previousTargetId,
        reason: wasDamaged ? "damage" : "target",
      });
    }
    if (result.completedRepair) {
      const target = this.enemies.find((candidate) => (
        candidate.id === result.completedRepair!.targetId && !candidate.dead
      ));
      if (target) {
        const before = target.health;
        target.health = Math.min(target.maxHealth, target.health + result.completedRepair.amount);
        const amount = target.health - before;
        this.frameEvents.push({
          type: "reclaimer-repair-completed",
          position: { ...enemy.position },
          target: { ...target.position },
          enemyId: enemy.id,
          targetId: target.id,
          amount,
        });
      }
    }

    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    if (result.startedTarget) {
      this.frameEvents.push({
        type: "reclaimer-link-started",
        position: { ...enemy.position },
        target: { ...result.startedTarget.position },
        enemyId: enemy.id,
        targetId: result.startedTarget.id,
      });
    }
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
  }

  private reclaimerRepairTarget(enemy: EnemyState): ReclaimerRepairTarget {
    return {
      id: enemy.id,
      type: enemy.type,
      position: { ...enemy.position },
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      dead: enemy.dead,
      machine: this.isRepairableMachine(enemy),
      rank: enemy.rank === "elite" || enemy.rank === "mini-boss" || enemy.rank === "boss"
        ? enemy.rank
        : "standard",
    };
  }

  private isRepairableMachine(enemy: EnemyState): boolean {
    return enemy.type === "scrap-skitterer"
      || enemy.type === "arc-warden"
      || enemy.type === "cyborg-reclaimer"
      || enemy.type === "foundry-fabricator"
      || enemy.type === "assembly-prime"
      || enemy.type === "foundry-drone"
      || enemy.type === "foundry-turret";
  }

  private updateFoundryFabricator(enemy: EnemyState, deltaSeconds: number): void {
    const ownerWasDamaged = enemy.foundryDamagedSinceLastStep;
    enemy.foundryDamagedSinceLastStep = false;
    const result = stepFoundryFabricatorBehavior(enemy.foundryBehavior, deltaSeconds, ownerWasDamaged);
    enemy.foundryBehavior = result.state;

    if (result.releasedReservation) {
      this.foundryReservedLiveSlots = Math.max(
        0,
        this.foundryReservedLiveSlots - result.releasedReservation.reservedLiveSlots,
      );
      this.foundryReservedThreat = Math.max(
        0,
        this.foundryReservedThreat - result.releasedReservation.reservedThreat,
      );
      enemy.foundryThreatRemaining += result.releasedReservation.reservedThreat;
      this.removeFoundryPad(enemy.id);
      this.frameEvents.push({
        type: "foundry-fabrication-interrupted",
        position: { ...enemy.position },
        enemyId: enemy.id,
        reason: ownerWasDamaged ? "owner-damage" : "pad-destroyed",
      });
    }

    if (result.spawnedChild) {
      this.foundryReservedLiveSlots = Math.max(0, this.foundryReservedLiveSlots - 1);
      this.foundryReservedThreat = Math.max(
        0,
        this.foundryReservedThreat - (result.spawnedChild.type === "foundry-drone" ? 2 : 3),
      );
      this.removeFoundryPad(enemy.id);
      const childId = this.spawnEnemy(result.spawnedChild.type, result.spawnedChild.position);
      const child = this.enemies.find((candidate) => candidate.id === childId)!;
      child.foundryChildOwnerId = enemy.id;
      child.foundryChildRemainingSeconds = result.spawnedChild.remainingSeconds;
      this.frameEvents.push({
        type: "foundry-fabrication-completed",
        position: { ...result.spawnedChild.position },
        enemyId: enemy.id,
        childId,
        childType: result.spawnedChild.type,
      });
    }

    if (!result.requestedChildType) return;
    const activeChildren = this.enemies.filter((candidate) => (
      !candidate.dead
      && candidate.foundryChildOwnerId === enemy.id
      && (candidate.type === "foundry-drone" || candidate.type === "foundry-turret")
    )).length;
    const reservation = tryReserveFoundryChild({
      childType: result.requestedChildType,
      activeChildrenForOwner: activeChildren,
      ownerChargesRemaining: enemy.foundryBehavior.chargesRemaining,
      liveUnits: this.enemies.filter((candidate) => !candidate.dead && candidate.type !== "foundry-pad").length,
      reservedLiveSlots: this.nestReservedLiveSlots + this.foundryReservedLiveSlots,
      liveCap: this.waveLiveCap > 0 ? this.waveLiveCap : 56,
      remainingThreat: enemy.foundryThreatRemaining,
    });
    const resolution = resolveFoundryFabricationRequest(enemy.foundryBehavior, {
      position: enemy.position,
      playerPosition: this.playerPosition,
      movementSpeedMetresPerSecond: ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond,
      arenaWidthMetres: this.widthMetres,
      arenaHeightMetres: this.heightMetres,
      reservation: reservation.accepted ? reservation.reservation : null,
    });
    enemy.foundryBehavior = resolution.state;
    if (resolution.facingDirection) enemy.facingDirection = resolution.facingDirection;
    this.applyMovementIntent(enemy, resolution.movement, deltaSeconds);
    if (!resolution.startedFabrication) return;

    const { target, reservation: acceptedReservation } = resolution.startedFabrication;
    enemy.foundryThreatRemaining -= acceptedReservation.reservedThreat;
    this.foundryReservedLiveSlots += acceptedReservation.reservedLiveSlots;
    this.foundryReservedThreat += acceptedReservation.reservedThreat;
    const padId = this.spawnEnemy("foundry-pad", target);
    const pad = this.enemies.find((candidate) => candidate.id === padId)!;
    pad.foundryPadOwnerId = enemy.id;
    this.frameEvents.push({
      type: "foundry-fabrication-started",
      position: { ...target },
      enemyId: enemy.id,
      padId,
      childType: result.requestedChildType,
    });
  }

  private removeFoundryPad(ownerId: number): void {
    for (const pad of this.enemies) {
      if (!pad.dead && pad.type === "foundry-pad" && pad.foundryPadOwnerId === ownerId) pad.dead = true;
    }
  }

  private updateFoundryChild(enemy: EnemyState, deltaSeconds: number, mobile: boolean): void {
    const ownerId = enemy.foundryChildOwnerId;
    const ownerAlive = ownerId !== null && this.enemies.some((candidate) => (
      candidate.id === ownerId && !candidate.dead
      && (candidate.type === "foundry-fabricator" || candidate.type === "assembly-prime")
    ));
    const result = stepFoundryChildBehavior(
      {
        remainingSeconds: enemy.foundryChildRemainingSeconds,
        turretPhase: enemy.foundryTurretPhase,
        turretPhaseRemainingSeconds: enemy.foundryTurretPhaseRemainingSeconds,
        turretTarget: enemy.foundryTurretTarget,
        attackCooldownSeconds: enemy.attackCooldownSeconds,
      },
      {
        deltaSeconds,
        ownerAlive,
        mobile,
        position: enemy.position,
        playerPosition: this.playerPosition,
        movementSpeedMetresPerSecond: ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond,
      },
    );
    enemy.foundryChildRemainingSeconds = result.state.remainingSeconds;
    enemy.foundryTurretPhase = result.state.turretPhase;
    enemy.foundryTurretPhaseRemainingSeconds = result.state.turretPhaseRemainingSeconds;
    enemy.foundryTurretTarget = result.state.turretTarget;
    enemy.attackCooldownSeconds = result.state.attackCooldownSeconds;
    enemy.facingDirection = result.facingDirection;
    if (result.powerDownReason) {
      enemy.dead = true;
      this.frameEvents.push({
        type: "foundry-child-powered-down",
        position: { ...enemy.position },
        enemyId: enemy.id,
        ownerId: ownerId ?? -1,
        reason: result.powerDownReason,
      });
      return;
    }
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    if (result.firesTurret) {
      const damage = this.scaledEnemyDamage(enemy, 1.1);
      const hitPlayer = !segmentHitsArenaObstacle(
        enemy.position,
        enemy.foundryTurretTarget,
        this.activeObstacles(),
      ) && distanceToSegment(
        this.playerPosition,
        enemy.position,
        enemy.foundryTurretTarget,
      ) <= 0.25 + PLAYER_RADIUS_METRES;
      if (hitPlayer) this.damagePlayer(damage);
      this.frameEvents.push({
        type: "foundry-turret-fired",
        position: { ...enemy.position },
        target: { ...enemy.foundryTurretTarget },
        enemyId: enemy.id,
        damage,
        hitPlayer,
      });
    }
    if (result.warningStarted) {
      this.frameEvents.push({
        type: "foundry-turret-warning",
        position: { ...enemy.position },
        target: { ...enemy.foundryTurretTarget },
        enemyId: enemy.id,
      });
    }
  }

  /**
   * Applies a behaviour module's movement intent. `toward-player` blends in
   * separation steering; `fixed` does not. See `EnemyMovementIntent`.
   */
  private applyMovementIntent(
    enemy: EnemyState,
    intent: EnemyMovementIntent,
    deltaSeconds: number,
  ): void {
    if (intent.kind === "toward-player") {
      this.moveEnemyTowardPlayer(enemy, intent.speedMetresPerSecond, deltaSeconds);
    } else if (intent.kind === "fixed") {
      this.moveEnemy(enemy, intent.direction, intent.speedMetresPerSecond, deltaSeconds);
    } else if (intent.kind === "range-band") {
      this.moveEnemyForRangeBand(enemy, deltaSeconds);
    }
  }

  private updateBrainBlob(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepBrainBlobBehavior(
      {
        phase: enemy.brainPhase,
        phaseRemainingSeconds: enemy.brainPhaseRemainingSeconds,
        lungeDirection: enemy.brainLungeDirection,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        driftSpeedMetresPerSecond: ENEMY_CATALOG["brain-blob"].movementSpeedMetresPerSecond,
        random: () => this.random(),
      },
    );
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    enemy.brainPhase = result.state.phase;
    enemy.brainPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.brainLungeDirection = result.state.lungeDirection;
  }

  private updateBlastMite(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepBlastMiteBehavior(
      { phase: enemy.mitePhase, phaseRemainingSeconds: enemy.mitePhaseRemainingSeconds },
      {
        deltaSeconds,
        chaseSpeedMetresPerSecond: ENEMY_CATALOG["blast-mite"].movementSpeedMetresPerSecond,
      },
    );
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    // Range is tested against the post-movement position, matching the order
    // the inline version used.
    const armed = armBlastMiteIfInRange(result.state, enemy.position, this.playerPosition);
    enemy.mitePhase = armed.phase;
    enemy.mitePhaseRemainingSeconds = armed.phaseRemainingSeconds;
    if (result.detonates) this.applyRawDamage(enemy, enemy.health + 1);
  }

  private updateWarpFlanker(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepWarpFlankerBehavior(
      {
        phase: enemy.warpPhase,
        phaseRemainingSeconds: enemy.warpPhaseRemainingSeconds,
        warpTarget: enemy.warpTarget,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        stalkSpeedMetresPerSecond: ENEMY_CATALOG["warp-flanker"].movementSpeedMetresPerSecond,
      },
    );
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    if (result.teleportTo) enemy.position = result.teleportTo;
    if (result.emitArrival) {
      this.frameEvents.push({ type: "warp-arrival", position: { ...enemy.position } });
    }
    const resolved = resolveWarpFlankerAfterMovement(
      result.state,
      enemy.position,
      this.playerPosition,
      () => this.pickWarpTarget(),
    );
    enemy.warpPhase = resolved.phase;
    enemy.warpPhaseRemainingSeconds = resolved.phaseRemainingSeconds;
    enemy.warpTarget = resolved.warpTarget;
  }

  private pickWarpTarget(): Vector2Data {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const angle = this.random() * Math.PI * 2;
      const candidate = {
        x: clamp(this.playerPosition.x + Math.cos(angle) * 2.2, 0.8, this.widthMetres - 0.8),
        y: clamp(this.playerPosition.y + Math.sin(angle) * 2.2, 0.8, this.heightMetres - 0.8),
      };
      if (!pointHitsObstacle(candidate, this.activeObstacles())) {
        return candidate;
      }
    }
    return {
      x: clamp(this.playerPosition.x + 2.2, 0.8, this.widthMetres - 0.8),
      y: this.playerPosition.y,
    };
  }

  private updateCarapaceScuttler(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepCarapaceScuttlerBehavior(
      {
        phase: enemy.carapacePhase,
        phaseRemainingSeconds: enemy.carapacePhaseRemainingSeconds,
        facingDirection: enemy.facingDirection,
      },
      { deltaSeconds, position: enemy.position, playerPosition: this.playerPosition },
    );
    enemy.facingDirection = result.state.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    const resolved = resolveCarapaceScuttlerAfterMovement(
      result.state,
      enemy.position,
      this.playerPosition,
      enemyRadius(enemy) + PLAYER_RADIUS_METRES + 0.5,
    );
    enemy.carapacePhase = resolved.state.phase;
    enemy.carapacePhaseRemainingSeconds = resolved.state.phaseRemainingSeconds;
    enemy.facingDirection = resolved.state.facingDirection;
    if (resolved.missed) enemy.missWindowRemainingSeconds = ELITE_MISS_WINDOW_SECONDS;
  }

  private updateRipper(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepRipperBehavior(
      {
        phase: enemy.ripperPhase,
        phaseRemainingSeconds: enemy.ripperPhaseRemainingSeconds,
        sweepDirection: enemy.ripperDirection,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        pursuitSpeedMetresPerSecond: ENEMY_CATALOG.ripper.movementSpeedMetresPerSecond,
      },
    );
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    enemy.ripperPhase = result.state.phase;
    enemy.ripperPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.ripperDirection = result.state.sweepDirection;

    if (result.sweepFired) {
      this.frameEvents.push({
        type: "ripper-sweep",
        position: { ...enemy.position },
        direction: { ...enemy.ripperDirection },
        reachMetres: RIPPER_REACH_METRES,
      });
      if (pointInsideRipperSweep(
        enemy.position,
        enemy.ripperDirection,
        this.playerPosition,
        RIPPER_REACH_METRES + PLAYER_RADIUS_METRES,
      )) {
        this.damagePlayer(this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.ripperSweep));
      }
    }
  }

  private updateRazorScuttler(enemy: EnemyState, deltaSeconds: number): void {
    const pursuitSpeed = enemy.eliteKind === "razorlord"
      ? RAZORLORD_PURSUIT_SPEED
      : ENEMY_CATALOG["razor-scuttler"].movementSpeedMetresPerSecond;
    const dashSpeed = enemy.eliteKind === "razorlord" ? RAZORLORD_DASH_SPEED : RAZOR_SCUTTLER_DASH_SPEED;
    const radius = ENEMY_CATALOG["razor-scuttler"].radiusMetres;
    const result = stepRazorScuttlerBehavior(
      {
        phase: enemy.razorScuttlerPhase,
        phaseRemainingSeconds: enemy.razorScuttlerPhaseRemainingSeconds,
        direction: enemy.razorScuttlerDirection,
        hitPlayer: enemy.razorScuttlerHitPlayer,
      },
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        pursuitSpeedMetresPerSecond: pursuitSpeed,
        dashSpeedMetresPerSecond: dashSpeed,
        radiusMetres: radius,
        playerRadiusMetres: PLAYER_RADIUS_METRES,
        widthMetres: this.widthMetres,
        heightMetres: this.heightMetres,
        arena: this.collisionArena(),
      },
    );
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);

    let state = result.state;
    let impact = result.impact;
    if (impact === null) {
      const resolved = resolveRazorScuttlerAfterMovement(
        state,
        enemy.position,
        this.playerPosition,
        radius,
        PLAYER_RADIUS_METRES,
      );
      state = resolved.state;
      impact = resolved.impact;
    }
    enemy.razorScuttlerPhase = state.phase;
    enemy.razorScuttlerPhaseRemainingSeconds = state.phaseRemainingSeconds;
    enemy.razorScuttlerDirection = state.direction;
    enemy.razorScuttlerHitPlayer = state.hitPlayer;

    if (result.warningFired) {
      this.frameEvents.push({
        type: "razor-scuttler-warning",
        position: { ...enemy.position },
        direction: { ...enemy.razorScuttlerDirection },
      });
    }
    if (result.dashFired) {
      this.frameEvents.push({
        type: "razor-scuttler-dash",
        position: { ...enemy.position },
        direction: { ...enemy.razorScuttlerDirection },
      });
    }
    if (impact === "player") {
      this.damagePlayer(this.scaledEnemyDamage(enemy, RAZOR_SCUTTLER_DASH_DAMAGE));
    }
    if (impact !== null) {
      this.frameEvents.push({ type: "razor-scuttler-impact", position: { ...enemy.position }, reason: impact });
    }
  }

  private updateStormRegent(enemy: EnemyState, deltaSeconds: number): void {
    const liveNodeStates = this.enemies.filter((candidate) => (
      candidate.type === "storm-node"
      && candidate.stormNodeOwnerId === enemy.id
      && candidate.conductiveNode
    )).map((candidate) => candidate.conductiveNode!).sort((left, right) => left.id - right.id);
    const previous = { ...enemy.stormRegentBehavior, nodes: liveNodeStates };
    const context = {
      ownerPosition: { ...enemy.position },
      playerPosition: { ...this.playerPosition },
      ownerHealth: enemy.health,
      ownerMaxHealth: enemy.maxHealth,
      arena: this.collisionArena(),
      playerRadiusMetres: PLAYER_RADIUS_METRES,
    };
    const result = stepStormRegentBehavior(previous, deltaSeconds, context);
    enemy.stormRegentBehavior = result.state;

    if (result.moveStarted) {
      const node = result.state.nodes.find((candidate) => candidate.id === result.state.overchargeNodeId);
      const centre = result.moveStarted === "coil-burst"
        ? result.state.coilCentre
        : result.moveStarted === "node-overcharge" ? node?.position ?? null : null;
      const radiusMetres = result.moveStarted === "coil-burst"
        ? STORM_REGENT_COIL_RADIUS_METRES
        : result.moveStarted === "node-overcharge" ? STORM_REGENT_NODE_OVERCHARGE_RADIUS_METRES : undefined;
      this.frameEvents.push({
        type: "storm-regent-warning",
        position: { ...enemy.position },
        enemyId: enemy.id,
        move: result.moveStarted,
        segments: result.state.lockedChain?.segments.map((segment) => ({
          ...segment, from: { ...segment.from }, to: { ...segment.to },
        })) ?? [],
        centre: centre ? { ...centre } : undefined,
        radiusMetres,
        nodeId: result.state.overchargeNodeId ?? undefined,
      });
    }
    if (result.interrupted && result.moveResolved) {
      const interruptedNode = previous.nodes.find((candidate) => candidate.id === previous.overchargeNodeId);
      this.frameEvents.push({
        type: "storm-regent-interrupted",
        position: { ...enemy.position },
        enemyId: enemy.id,
        move: result.moveResolved,
        nodePosition: interruptedNode ? { ...interruptedNode.position } : undefined,
      });
    }
    if (result.actionStarted) {
      let hitPlayer = false;
      let effectCentre: Vector2Data | undefined;
      if (result.actionStarted === "chain-strike") {
        hitPlayer = pointInsideStormChain(
          this.playerPosition,
          result.state.lockedChain?.segments ?? [],
          PLAYER_RADIUS_METRES,
        );
      } else {
        const node = result.state.nodes.find((candidate) => candidate.id === result.state.overchargeNodeId);
        const centre = result.actionStarted === "coil-burst" ? result.state.coilCentre : node?.position;
        effectCentre = centre ? { ...centre } : undefined;
        const radius = result.actionStarted === "coil-burst"
          ? STORM_REGENT_COIL_RADIUS_METRES
          : STORM_REGENT_NODE_OVERCHARGE_RADIUS_METRES;
        hitPlayer = Boolean(centre && distance(centre, this.playerPosition) <= radius + PLAYER_RADIUS_METRES);
      }
      const baseDamage = result.actionStarted === "coil-burst" ? 2.6 : result.actionStarted === "node-overcharge" ? 2.8 : 3.2;
      const damage = hitPlayer ? this.scaledEnemyDamage(enemy, baseDamage) : 0;
      if (damage > 0) this.damagePlayer(damage);
      this.frameEvents.push({
        type: "storm-regent-discharged",
        position: { ...enemy.position },
        enemyId: enemy.id,
        move: result.actionStarted,
        hitPlayer,
        damage,
        centre: effectCentre,
      });
    }

    const state = enemy.stormRegentBehavior;
    if (state.phase === "setup") {
      const direction = miniBossRepositionDirection(
        enemy.position,
        this.playerPosition,
        6.4,
        (enemy.id + state.attackIndex) % 2 === 0 ? 1 : -1,
      );
      enemy.facingDirection = direction;
      this.moveEnemy(enemy, direction, ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond, deltaSeconds);
    } else if (state.coilCentre) {
      enemy.facingDirection = normalizeVector({
        x: this.playerPosition.x - enemy.position.x,
        y: this.playerPosition.y - enemy.position.y,
      });
    }
  }

  private updateAbominationPrime(enemy: EnemyState, deltaSeconds: number): void {
    const previous = enemy.abominationPrimeBehavior;
    const playerDistance = distance(enemy.position, this.playerPosition);
    const geometricLineClear = !segmentHitsArenaObstacle(
      enemy.position,
      this.playerPosition,
      this.activeObstacles(),
    );
    const context = {
      ownerPosition: { ...enemy.position },
      playerPosition: { ...this.playerPosition },
      ownerHealth: enemy.health,
      ownerMaxHealth: enemy.maxHealth,
      arena: this.collisionArena(),
      playerRadiusMetres: PLAYER_RADIUS_METRES,
      grabLineClear: geometricLineClear
        && (this.activeTetherEnemyId === null || this.activeTetherEnemyId === enemy.id),
      playerDodged: this.heroState === "evading",
    };
    const result = stepAbominationPrimeBehavior(previous, deltaSeconds, context);
    enemy.abominationPrimeBehavior = result.state;

    if (result.moveStarted && result.state.lockedTarget) {
      if (result.moveStarted === "biomass-grab") this.activeTetherEnemyId = enemy.id;
      this.frameEvents.push({
        type: "abomination-prime-warning",
        position: { ...enemy.position },
        enemyId: enemy.id,
        move: result.moveStarted,
        target: { ...result.state.lockedTarget },
        radiusMetres: result.moveStarted === "ground-slam"
          ? ABOMINATION_PRIME_SLAM_RADIUS_METRES
          : result.moveStarted === "thrown-biomass" ? ABOMINATION_PRIME_THROW_RADIUS_METRES : undefined,
      });
    }

    if (result.grabBroken) {
      const reason = this.heroState === "evading"
        ? "evasive"
        : previous.grabDamageTaken >= ABOMINATION_PRIME_GRAB_BREAK_DAMAGE
          ? "damage"
          : !geometricLineClear ? "cover" : "range";
      this.frameEvents.push({
        type: "abomination-prime-grab-broken",
        position: { ...enemy.position },
        enemyId: enemy.id,
        reason,
      });
    }

    if (result.actionStarted === "ground-slam" && result.state.lockedTarget) {
      const centre = result.state.lockedTarget;
      const hitPlayer = distance(this.playerPosition, centre)
        <= ABOMINATION_PRIME_SLAM_RADIUS_METRES + PLAYER_RADIUS_METRES;
      const damage = hitPlayer ? this.scaledEnemyDamage(enemy, 4.2) : 0;
      if (hitPlayer) this.damagePlayer(damage, "explosive");
      this.damageTerrainInRadius(centre, ABOMINATION_PRIME_SLAM_RADIUS_METRES, 180, "enemy-slam");
      this.frameEvents.push({
        type: "abomination-prime-slam",
        position: { ...centre },
        enemyId: enemy.id,
        hitPlayer,
        damage,
        radiusMetres: ABOMINATION_PRIME_SLAM_RADIUS_METRES,
      });
    } else if (result.actionStarted === "biomass-grab") {
      const damage = this.scaledEnemyDamage(enemy, 1.6);
      this.damagePlayer(damage, "explosive");
      this.frameEvents.push({
        type: "abomination-prime-grab-latched",
        position: { ...enemy.position },
        enemyId: enemy.id,
        damage,
      });
    } else if (result.actionStarted === "thrown-biomass" && result.state.lockedTarget) {
      const target = result.state.lockedTarget;
      const travelSeconds = Math.max(0.12, result.state.phaseRemainingSeconds);
      const direction = normalizeVector({ x: target.x - enemy.position.x, y: target.y - enemy.position.y });
      const speed = distance(enemy.position, target) / travelSeconds;
      this.spawnHostileProjectile({
        type: "prime-biomass",
        sourceEnemyId: enemy.id,
        position: { ...enemy.position },
        velocity: { x: direction.x * speed, y: direction.y * speed },
        target: { ...target },
        remainingSeconds: travelSeconds,
        damage: 0,
        createsPuddle: false,
      });
      this.frameEvents.push({
        type: "abomination-prime-biomass-thrown",
        position: { ...enemy.position },
        enemyId: enemy.id,
        target: { ...target },
      });
    }

    if (result.hazardCreated) {
      const centre = result.hazardCreated.centre;
      const hitPlayer = distance(this.playerPosition, centre)
        <= ABOMINATION_PRIME_THROW_RADIUS_METRES + PLAYER_RADIUS_METRES;
      const damage = hitPlayer ? this.scaledEnemyDamage(enemy, 3.1) : 0;
      if (hitPlayer) this.damagePlayer(damage);
      this.damageTerrainInRadius(centre, ABOMINATION_PRIME_THROW_RADIUS_METRES, 160, "enemy-biomass");
      this.groundHazards.push({
        id: this.nextId(),
        type: "prime-biomass",
        ownerId: enemy.id,
        position: { ...centre },
        radiusMetres: ABOMINATION_PRIME_THROW_RADIUS_METRES,
        remainingSeconds: ABOMINATION_PRIME_HAZARD_SECONDS,
        durationSeconds: ABOMINATION_PRIME_HAZARD_SECONDS,
        damageCooldownSeconds: 0.8,
      });
      this.frameEvents.push({
        type: "abomination-prime-biomass-landed",
        position: { ...centre },
        enemyId: enemy.id,
        hitPlayer,
        damage,
        radiusMetres: ABOMINATION_PRIME_THROW_RADIUS_METRES,
      });
    }

    if (previous.move === "biomass-grab" && result.moveResolved === "biomass-grab"
      && this.activeTetherEnemyId === enemy.id) {
      this.activeTetherEnemyId = null;
      if (!result.grabBroken) {
        this.frameEvents.push({
          type: "abomination-prime-grab-broken",
          position: { ...enemy.position },
          enemyId: enemy.id,
          reason: "expired",
        });
      }
    }

    const state = enemy.abominationPrimeBehavior;
    if (state.phase === "action" && state.move === "biomass-grab" && this.activeTetherEnemyId === enemy.id) {
      const minimumDistance = enemyRadius(enemy) + PLAYER_RADIUS_METRES + 0.2;
      const pullDistance = Math.min(1.25 * deltaSeconds, Math.max(0, playerDistance - minimumDistance));
      if (pullDistance > 0) {
        const direction = normalizeVector({
          x: enemy.position.x - this.playerPosition.x,
          y: enemy.position.y - this.playerPosition.y,
        });
        this.playerPosition = resolveCircleMovement(
          this.playerPosition,
          {
            x: this.playerPosition.x + direction.x * pullDistance,
            y: this.playerPosition.y + direction.y * pullDistance,
          },
          PLAYER_RADIUS_METRES,
          this.collisionArena(),
        );
      }
    }

    if (state.phase === "setup") {
      const direction = miniBossRepositionDirection(
        enemy.position,
        this.playerPosition,
        3.8,
        (enemy.id + state.attackIndex) % 2 === 0 ? 1 : -1,
      );
      enemy.facingDirection = direction;
      this.moveEnemy(enemy, direction, ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond, deltaSeconds);
    } else {
      enemy.facingDirection = normalizeVector({
        x: this.playerPosition.x - enemy.position.x,
        y: this.playerPosition.y - enemy.position.y,
      });
    }
  }

  private updateAssemblyPrime(enemy: EnemyState, deltaSeconds: number): void {
    const previous = enemy.assemblyPrimeBehavior;
    const ownerWasDamaged = enemy.assemblyPrimeDamagedSinceLastStep;
    enemy.assemblyPrimeDamagedSinceLastStep = false;
    const children = this.enemies.filter((candidate) => (
      candidate.foundryChildOwnerId === enemy.id
      && (candidate.type === "foundry-drone" || candidate.type === "foundry-turret")
    )).map((candidate) => ({
      id: candidate.id,
      ownerId: enemy.id,
      type: candidate.type as FoundryChildType,
      position: { ...candidate.position },
      remainingSeconds: candidate.foundryChildRemainingSeconds,
      dead: candidate.dead,
    }));
    const result = stepAssemblyPrimeBehavior(previous, deltaSeconds, {
      ownerId: enemy.id,
      ownerPosition: { ...enemy.position },
      playerPosition: { ...this.playerPosition },
      ownerHealth: enemy.health,
      ownerMaxHealth: enemy.maxHealth,
      liveUnits: this.enemies.filter((candidate) => !candidate.dead && candidate.type !== "foundry-pad").length,
      reservedLiveSlots: this.nestReservedLiveSlots + this.foundryReservedLiveSlots,
      liveCap: this.waveLiveCap > 0 ? this.waveLiveCap : 56,
      remainingThreat: enemy.foundryThreatRemaining,
      children,
      ownerWasDamaged,
    });
    enemy.assemblyPrimeBehavior = result.state;

    if (result.moveStarted) {
      if (result.moveStarted === "fabrication" && result.state.pendingReservation && result.state.fabricationTarget) {
        const reservation = result.state.pendingReservation;
        enemy.foundryThreatRemaining -= reservation.reservedThreat;
        this.foundryReservedLiveSlots += reservation.reservedLiveSlots;
        this.foundryReservedThreat += reservation.reservedThreat;
        const padId = this.spawnEnemy("foundry-pad", result.state.fabricationTarget);
        const pad = this.enemies.find((candidate) => candidate.id === padId)!;
        pad.foundryPadOwnerId = enemy.id;
        pad.maxHealth = result.state.padHealth;
        pad.health = result.state.padHealth;
      }
      this.frameEvents.push({
        type: "assembly-prime-warning",
        position: { ...enemy.position },
        enemyId: enemy.id,
        move: result.moveStarted,
        lanes: result.state.lockedLanes.map((lane) => ({
          origin: { ...lane.origin },
          direction: { ...lane.direction },
        })),
        target: result.state.fabricationTarget ? { ...result.state.fabricationTarget } : undefined,
        recallTargetId: result.state.recallTargetId ?? undefined,
      });
    }
    if (result.releasedReservation) {
      this.foundryReservedLiveSlots = Math.max(0, this.foundryReservedLiveSlots - 1);
      this.foundryReservedThreat = Math.max(0, this.foundryReservedThreat - result.releasedReservation.reservedThreat);
      enemy.foundryThreatRemaining += result.releasedReservation.reservedThreat;
      this.removeFoundryPad(enemy.id);
      this.frameEvents.push({
        type: "assembly-prime-fabrication-interrupted",
        position: { ...enemy.position },
        enemyId: enemy.id,
        reason: ownerWasDamaged ? "owner-damage" : "pad-destroyed",
      });
    }
    if (result.spawnedChild) {
      this.foundryReservedLiveSlots = Math.max(0, this.foundryReservedLiveSlots - 1);
      const threat = result.spawnedChild.type === "foundry-drone" ? 2 : 3;
      this.foundryReservedThreat = Math.max(0, this.foundryReservedThreat - threat);
      this.removeFoundryPad(enemy.id);
      const childId = this.spawnEnemy(result.spawnedChild.type, result.spawnedChild.position);
      const child = this.enemies.find((candidate) => candidate.id === childId)!;
      child.foundryChildOwnerId = enemy.id;
      child.foundryChildRemainingSeconds = result.spawnedChild.remainingSeconds;
      this.frameEvents.push({
        type: "assembly-prime-fabrication-completed",
        position: { ...child.position },
        enemyId: enemy.id,
        childId,
        childType: result.spawnedChild.type,
      });
    }
    if (result.recalledChildId !== null) {
      const child = this.enemies.find((candidate) => candidate.id === result.recalledChildId && !candidate.dead);
      if (child) {
        child.position = { ...enemy.position };
        child.facingDirection = normalizeVector({
          x: this.playerPosition.x - child.position.x,
          y: this.playerPosition.y - child.position.y,
        });
        this.frameEvents.push({
          type: "assembly-prime-drone-recalled",
          position: { ...enemy.position },
          enemyId: enemy.id,
          childId: child.id,
        });
      }
    }

    const state = enemy.assemblyPrimeBehavior;
    if (state.phase === "setup") {
      const direction = miniBossRepositionDirection(enemy.position, this.playerPosition, 6.8, enemy.id % 2 ? 1 : -1);
      enemy.facingDirection = direction;
      this.moveEnemy(enemy, direction, ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond, deltaSeconds);
      return;
    }
    if (result.actionStarted === "rotating-lanes") {
      enemy.assemblyPrimeLaneIndex = 0;
      enemy.assemblyPrimeLaneCooldownSeconds = 0;
    }
    if (state.phase !== "action" || state.move !== "rotating-lanes") return;
    enemy.assemblyPrimeLaneCooldownSeconds -= deltaSeconds;
    if (enemy.assemblyPrimeLaneCooldownSeconds > 0) return;
    const lane = state.lockedLanes[enemy.assemblyPrimeLaneIndex];
    if (!lane) return;
    const endpoint = {
      x: lane.origin.x + lane.direction.x * 11,
      y: lane.origin.y + lane.direction.y * 11,
    };
    const hitPlayer = !segmentHitsArenaObstacle(lane.origin, endpoint, this.activeObstacles())
      && distanceToSegment(this.playerPosition, lane.origin, endpoint) <= 0.28 + PLAYER_RADIUS_METRES;
    const damage = this.scaledEnemyDamage(enemy, 2.1);
    if (hitPlayer) this.damagePlayer(damage);
    this.frameEvents.push({
      type: "assembly-prime-lane-fired",
      position: { ...lane.origin },
      enemyId: enemy.id,
      laneIndex: enemy.assemblyPrimeLaneIndex,
      endpoint,
      hitPlayer,
      damage,
    });
    enemy.assemblyPrimeLaneIndex += 1;
    enemy.assemblyPrimeLaneCooldownSeconds = 0.3;
  }

  private updateSynapseHerald(enemy: EnemyState, deltaSeconds: number): void {
    const previous = enemy.synapseHeraldBehavior;
    const previousLinkTargetId = previous.linkTargetId;
    const context = {
      ownerPosition: { ...enemy.position },
      playerPosition: { ...this.playerPosition },
      ownerHealth: enemy.health,
      ownerMaxHealth: enemy.maxHealth,
      arenaWidthMetres: this.widthMetres,
      arenaHeightMetres: this.heightMetres,
      brainBlobs: this.enemies.filter((candidate) => candidate.type === "brain-blob").map((candidate) => ({
        id: candidate.id,
        position: { ...candidate.position },
        dead: candidate.dead,
        rank: candidate.rank === "elite" || candidate.rank === "mini-boss" || candidate.rank === "boss"
          ? candidate.rank
          : "standard" as const,
      })),
    };
    const result = stepSynapseHeraldBehavior(previous, deltaSeconds, context);
    enemy.synapseHeraldBehavior = result.state;

    if (result.moveStarted) {
      const targets = result.moveStarted === "lunge-chain"
        ? result.state.lungeTargets
        : result.moveStarted === "marked-zones"
          ? result.state.markedZones
          : [];
      this.frameEvents.push({
        type: "synapse-herald-warning",
        position: { ...enemy.position },
        enemyId: enemy.id,
        move: result.moveStarted,
        targets: targets.map((target) => ({ ...target })),
        linkTargetId: result.state.linkTargetId ?? undefined,
      });
    }
    if (result.actionStarted === "lunge-chain") {
      enemy.synapseHeraldLungeIndex = 0;
      enemy.synapseHeraldHitThisLunge = false;
      const target = result.state.lungeTargets[0];
      if (target) this.frameEvents.push({
        type: "synapse-herald-lunge",
        position: { ...enemy.position },
        enemyId: enemy.id,
        target: { ...target },
        chainIndex: 0,
      });
    } else if (result.actionStarted === "marked-zones") {
      const hitPlayer = result.state.markedZones.some((zone) => (
        distance(zone, this.playerPosition) <= 1.35 + PLAYER_RADIUS_METRES
      ));
      if (hitPlayer) this.damagePlayer(this.scaledEnemyDamage(enemy, 3));
      this.frameEvents.push({
        type: "synapse-herald-zones-erupted",
        position: { ...enemy.position },
        enemyId: enemy.id,
        zones: result.state.markedZones.map((zone) => ({ ...zone })),
        hitPlayer,
      });
    } else if (result.actionStarted === "synapse-link" && result.state.linkTargetId !== null) {
      this.frameEvents.push({
        type: "synapse-herald-link-started",
        position: { ...enemy.position },
        enemyId: enemy.id,
        targetId: result.state.linkTargetId,
      });
    }
    if (result.linkBroken && previousLinkTargetId !== null) {
      this.frameEvents.push({
        type: "synapse-herald-link-broken",
        position: { ...enemy.position },
        enemyId: enemy.id,
        targetId: previousLinkTargetId,
        reason: "target",
      });
    } else if (result.moveResolved === "synapse-link" && previousLinkTargetId !== null) {
      this.frameEvents.push({
        type: "synapse-herald-link-broken",
        position: { ...enemy.position },
        enemyId: enemy.id,
        targetId: previousLinkTargetId,
        reason: "expired",
      });
    }

    const state = enemy.synapseHeraldBehavior;
    if (state.phase === "setup") {
      const direction = miniBossRepositionDirection(
        enemy.position,
        this.playerPosition,
        5.2,
        (enemy.id + state.attackIndex) % 2 === 0 ? 1 : -1,
      );
      enemy.facingDirection = direction;
      this.moveEnemy(enemy, direction, ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond, deltaSeconds);
      return;
    }
    if (state.lockedPlayerTarget) enemy.facingDirection = normalizeVector({
      x: state.lockedPlayerTarget.x - enemy.position.x,
      y: state.lockedPlayerTarget.y - enemy.position.y,
    });
    if (state.phase !== "action" || state.move !== "lunge-chain") return;
    const target = state.lungeTargets[enemy.synapseHeraldLungeIndex];
    if (!target) return;
    const direction = normalizeVector({ x: target.x - enemy.position.x, y: target.y - enemy.position.y });
    enemy.facingDirection = direction;
    this.moveEnemy(enemy, direction, 9.2, deltaSeconds);
    if (
      !enemy.synapseHeraldHitThisLunge
      && distance(enemy.position, this.playerPosition) <= enemyRadius(enemy) + PLAYER_RADIUS_METRES
    ) {
      enemy.synapseHeraldHitThisLunge = true;
      this.damagePlayer(this.scaledEnemyDamage(enemy, 2.4));
    }
    if (distance(enemy.position, target) <= 0.35) {
      enemy.synapseHeraldLungeIndex += 1;
      enemy.synapseHeraldHitThisLunge = false;
      const nextTarget = state.lungeTargets[enemy.synapseHeraldLungeIndex];
      if (nextTarget) this.frameEvents.push({
        type: "synapse-herald-lunge",
        position: { ...enemy.position },
        enemyId: enemy.id,
        target: { ...nextTarget },
        chainIndex: enemy.synapseHeraldLungeIndex,
      });
    }
  }

  private updateSiegeCrusher(enemy: EnemyState, deltaSeconds: number): void {
    const state = {
      phase: enemy.siegeCrusherPhase,
      phaseRemainingSeconds: enemy.siegeCrusherPhaseRemainingSeconds,
      direction: enemy.siegeCrusherDirection,
      attackCount: enemy.siegeCrusherAttackCount,
    };
    const chargeDestination = siegeCrusherChargeDestination(state, {
      deltaSeconds,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      position: enemy.position,
    });
    const chargeObstacle = state.phase === "charge"
      ? this.firstCollidingObstacle(chargeDestination, ENEMY_CATALOG["siege-crusher"].radiusMetres)
      : null;
    const result = stepSiegeCrusherBehavior(state, {
      deltaSeconds,
      enemyId: enemy.id,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      position: enemy.position,
      playerPosition: this.playerPosition,
      chargeBlocked: chargeObstacle !== null,
    });
    enemy.siegeCrusherPhase = result.state.phase;
    enemy.siegeCrusherPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.siegeCrusherDirection = result.state.direction;
    enemy.siegeCrusherAttackCount = result.state.attackCount;
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);

    if (result.action?.kind === "charge-impact" && chargeObstacle) {
      this.damageObstacle(chargeObstacle.id, PLAYER_ATTACK_DAMAGE_BASELINES.crusherCharge * 40, {
        x: chargeObstacle.x + chargeObstacle.width / 2,
        y: chargeObstacle.y + chargeObstacle.height / 2,
      }, "mini-boss-charge");
      this.emitCrusherShockwave(enemy.position);
    } else if (result.action?.kind === "sweep") {
      const { radiusMetres, enrageTier } = result.action;
      this.frameEvents.push({
        type: "mini-boss-sweep",
        position: { ...enemy.position },
        radiusMetres,
      });
      if (distance(enemy.position, this.playerPosition) <= radiusMetres + PLAYER_RADIUS_METRES) {
        this.damagePlayer(this.scaledEnemyDamage(enemy, [
          PLAYER_ATTACK_DAMAGE_BASELINES.crusherSweep,
          PLAYER_ATTACK_DAMAGE_BASELINES.crusherSweepEnraged,
          PLAYER_ATTACK_DAMAGE_BASELINES.crusherSweepLastStand,
        ][enrageTier]!));
      }
    } else if (result.action?.kind === "slam") {
      this.emitCrusherShockwave(
        enemy.position,
        result.action.radiusMetres,
        result.action.enrageTier === 2
          ? PLAYER_ATTACK_DAMAGE_BASELINES.crusherSlamLastStand
          : PLAYER_ATTACK_DAMAGE_BASELINES.crusherSlam,
      );
    }
  }

  private updateBroodWarden(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepBroodWardenBehavior(
      {
        phase: enemy.broodWardenPhase,
        phaseRemainingSeconds: enemy.broodWardenPhaseRemainingSeconds,
        direction: enemy.broodWardenDirection,
        attackCount: enemy.broodWardenAttackCount,
        rushUsed: enemy.broodWardenRushUsed,
      },
      {
        deltaSeconds,
        enemyId: enemy.id,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        position: enemy.position,
        playerPosition: this.playerPosition,
      },
    );
    enemy.broodWardenPhase = result.state.phase;
    enemy.broodWardenPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.broodWardenDirection = result.state.direction;
    enemy.broodWardenAttackCount = result.state.attackCount;
    enemy.broodWardenRushUsed = result.state.rushUsed;
    enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    if (result.action?.kind === "cleave") {
      const { radiusMetres, enrageTier } = result.action;
      this.frameEvents.push({ type: "brood-cleave", position: { ...enemy.position }, radiusMetres });
      if (pointInsideTelegraphedArc(
        enemy.position,
        enemy.broodWardenDirection,
        this.playerPosition,
        radiusMetres + PLAYER_RADIUS_METRES,
        Math.PI / 3,
      )) {
        this.damagePlayer(this.scaledEnemyDamage(enemy, [
          PLAYER_ATTACK_DAMAGE_BASELINES.broodCleave,
          PLAYER_ATTACK_DAMAGE_BASELINES.broodCleaveEnraged,
          PLAYER_ATTACK_DAMAGE_BASELINES.broodCleaveLastStand,
        ][enrageTier]!));
      }
    } else if (result.action?.kind === "acid-volley") {
      this.launchBroodAcidVolley(enemy, result.action.count);
    } else if (result.action?.kind === "lay-eggs") {
      this.layBroodEggs(enemy, result.action.count);
    } else if (result.action?.kind === "swarm-rush") {
      this.spawnBroodSwarm(enemy, result.action.count);
    }
  }

  private launchBroodAcidVolley(enemy: EnemyState, count: number): void {
    const target = { ...this.playerPosition };
    const base = Math.atan2(target.y - enemy.position.y, target.x - enemy.position.x);
    const spread = Math.PI / 8;
    const speed = 8.2;
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : (index / (count - 1) - 0.5) * spread * 2;
      const direction = { x: Math.cos(base + offset), y: Math.sin(base + offset) };
      const start = {
        x: enemy.position.x + direction.x * 0.9,
        y: enemy.position.y + direction.y * 0.9,
      };
      const projectileTarget = {
        x: clamp(start.x + direction.x * 10, 0.3, this.widthMetres - 0.3),
        y: clamp(start.y + direction.y * 10, 0.3, this.heightMetres - 0.3),
      };
      this.spawnHostileProjectile({
        type: "brood-acid",
        position: start,
        velocity: { x: direction.x * speed, y: direction.y * speed },
        target: projectileTarget,
        remainingSeconds: distance(start, projectileTarget) / speed,
        damage: this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.broodAcid),
        createsPuddle: false,
      });
    }
    this.frameEvents.push({
      type: "brood-acid-volley",
      position: { ...enemy.position },
      target,
      count,
    });
  }

  private layBroodEggs(enemy: EnemyState, requestedCount: number): void {
    const liveEggs = this.enemies.filter((candidate) => !candidate.dead && candidate.type === "egg-cluster").length;
    const count = Math.max(0, Math.min(requestedCount, 6 - liveEggs, this.availableDirectorEnemySlots()));
    for (let index = 0; index < count; index += 1) {
      const angle = (index / Math.max(count, 1)) * Math.PI * 2 + this.random() * 0.45;
      this.spawnEnemy("egg-cluster", {
        x: clamp(enemy.position.x + Math.cos(angle) * 2.2, 0.8, this.widthMetres - 0.8),
        y: clamp(enemy.position.y + Math.sin(angle) * 2.2, 0.8, this.heightMetres - 0.8),
      });
      if (this.wavesEnabled) this.recordDensitySpawn({ type: "egg-cluster" });
    }
    this.frameEvents.push({ type: "brood-eggs-laid", position: { ...enemy.position }, count });
  }

  private spawnBroodSwarm(enemy: EnemyState, count: number): void {
    const allowedCount = Math.min(count, this.availableDirectorEnemySlots());
    for (let index = 0; index < allowedCount; index += 1) {
      const angle = (index / Math.max(allowedCount, 1)) * Math.PI * 2;
      this.spawnEnemy("scuttler", {
        x: clamp(enemy.position.x + Math.cos(angle) * 1.7, 0.6, this.widthMetres - 0.6),
        y: clamp(enemy.position.y + Math.sin(angle) * 1.7, 0.6, this.heightMetres - 0.6),
      });
      if (this.wavesEnabled) this.recordDensitySpawn({ type: "scuttler" });
    }
    this.frameEvents.push({ type: "brood-swarm-rush", position: { ...enemy.position }, count: allowedCount });
  }

  private updateRiftStalker(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepRiftStalkerBehavior(
      {
        phase: enemy.riftStalkerPhase,
        phaseRemainingSeconds: enemy.riftStalkerPhaseRemainingSeconds,
        direction: enemy.riftStalkerDirection,
        markTarget: enemy.riftStalkerMarkTarget,
        chainedThisCycle: enemy.riftStalkerChainedThisCycle,
      },
      {
        deltaSeconds,
        enemyId: enemy.id,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        position: enemy.position,
        playerPosition: this.playerPosition,
      },
    );
    enemy.riftStalkerPhase = result.state.phase;
    enemy.riftStalkerPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.riftStalkerDirection = result.state.direction;
    enemy.riftStalkerMarkTarget = result.state.markTarget;
    enemy.riftStalkerChainedThisCycle = result.state.chainedThisCycle;
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    if (result.action?.kind === "mark") {
      this.frameEvents.push({
        type: "rift-stalker-mark",
        position: { ...enemy.position },
        target: { ...enemy.riftStalkerMarkTarget },
      });
    } else if (result.action?.kind === "warp-out") {
      this.frameEvents.push({ type: "rift-stalker-warp-out", position: { ...enemy.position } });
    } else if (result.action?.kind === "pounce") {
      this.resolveRiftStalkerPounce(enemy, result.action.frenzyTier);
    } else if (result.action?.kind === "slash") {
      this.frameEvents.push({
        type: "rift-stalker-slash",
        position: { ...enemy.position },
        direction: { ...enemy.riftStalkerDirection },
        reachMetres: RIFT_STALKER_SLASH_REACH_METRES,
      });
      if (pointInsideTelegraphedArc(
        enemy.position,
        enemy.riftStalkerDirection,
        this.playerPosition,
        RIFT_STALKER_SLASH_REACH_METRES + PLAYER_RADIUS_METRES,
        RIFT_STALKER_SLASH_HALF_ARC_RADIANS,
      )) {
        this.damagePlayer(this.scaledEnemyDamage(enemy, result.action.frenzyTier === 2
          ? PLAYER_ATTACK_DAMAGE_BASELINES.riftSlashFrenzy
          : PLAYER_ATTACK_DAMAGE_BASELINES.riftSlash));
      }
    }
  }

  /** Warp completion: land on the marked point, strike it, and release the rift-spike fan. */
  private resolveRiftStalkerPounce(enemy: EnemyState, tier: 0 | 1 | 2): void {
    const landing = {
      x: clamp(enemy.riftStalkerMarkTarget.x, 0.9, this.widthMetres - 0.9),
      y: clamp(enemy.riftStalkerMarkTarget.y, 0.9, this.heightMetres - 0.9),
    };
    if (!pointHitsObstacle(landing, this.activeObstacles())) {
      enemy.position = landing;
    }
    this.frameEvents.push({ type: "warp-arrival", position: { ...enemy.position } });
    enemy.facingDirection = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    const hitPlayer = distance(this.playerPosition, enemy.position)
      <= RIFT_STALKER_POUNCE_RADIUS_METRES + PLAYER_RADIUS_METRES;
    if (hitPlayer) {
      this.damagePlayer(this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.riftPounce));
    }
    this.frameEvents.push({
      type: "rift-stalker-pounce",
      position: { ...enemy.position },
      radiusMetres: RIFT_STALKER_POUNCE_RADIUS_METRES,
      hitPlayer,
    });
    this.launchRiftSpikeFan(enemy, tier === 2 ? 5 : 3);
  }

  private launchRiftSpikeFan(enemy: EnemyState, requestedCount: number): void {
    const count = Math.min(requestedCount, this.availableEnemyProjectileSlots());
    if (count <= 0) return;
    const base = Math.atan2(
      this.playerPosition.y - enemy.position.y,
      this.playerPosition.x - enemy.position.x,
    );
    const spread = Math.PI / 6;
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : (index / (count - 1) - 0.5) * spread * 2;
      const direction = { x: Math.cos(base + offset), y: Math.sin(base + offset) };
      const start = {
        x: enemy.position.x + direction.x * 0.8,
        y: enemy.position.y + direction.y * 0.8,
      };
      const target = {
        x: clamp(start.x + direction.x * RIFT_STALKER_SPIKE_RANGE_METRES, 0.3, this.widthMetres - 0.3),
        y: clamp(start.y + direction.y * RIFT_STALKER_SPIKE_RANGE_METRES, 0.3, this.heightMetres - 0.3),
      };
      this.spawnHostileProjectile({
        type: "quill-spike",
        position: start,
        velocity: { x: direction.x * RIFT_STALKER_SPIKE_SPEED, y: direction.y * RIFT_STALKER_SPIKE_SPEED },
        target,
        remainingSeconds: distance(start, target) / RIFT_STALKER_SPIKE_SPEED,
        damage: this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.riftSpike),
        createsPuddle: false,
      });
    }
    this.frameEvents.push({
      type: "rift-stalker-fan",
      position: { ...enemy.position },
      direction: { ...enemy.facingDirection },
      count,
    });
  }

  private updateBastionEater(enemy: EnemyState, deltaSeconds: number): void {
    let state = {
      phase: enemy.bastionEaterPhase,
      action: enemy.bastionEaterAction,
      actionRemainingSeconds: enemy.bastionEaterActionRemainingSeconds,
      direction: enemy.bastionEaterDirection,
      target: enemy.bastionEaterTarget,
      attackCount: enemy.bastionEaterAttackCount,
    };
    const chargeDestination = bastionEaterChargeDestination(state, enemy.position, deltaSeconds);
    const chargeObstacle = state.action === "charge"
      ? this.firstCollidingObstacle(chargeDestination, ENEMY_CATALOG["bastion-eater"].radiusMetres)
      : null;
    const result = stepBastionEaterBehavior(state, {
      deltaSeconds,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      position: enemy.position,
      playerPosition: this.playerPosition,
      baseMovementSpeedMetresPerSecond: ENEMY_CATALOG["bastion-eater"].movementSpeedMetresPerSecond,
      chargeBlocked: chargeObstacle !== null,
    });
    state = result.state;
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    let worldAction = result.action;
    if (result.requestsActionChoice) {
      const resolved = resolveBastionEaterActionChoice(state, enemy.position, this.playerPosition);
      state = resolved.state;
      worldAction = resolved.action;
    }
    enemy.bastionEaterPhase = state.phase;
    enemy.bastionEaterAction = state.action;
    enemy.bastionEaterActionRemainingSeconds = state.actionRemainingSeconds;
    enemy.bastionEaterDirection = state.direction;
    enemy.bastionEaterTarget = state.target;
    enemy.bastionEaterAttackCount = state.attackCount;
    this.applyBastionEaterWorldAction(enemy, worldAction, chargeObstacle);
  }

  private applyBastionEaterWorldAction(
    enemy: EnemyState,
    action: BastionEaterWorldAction,
    chargeObstacle: ArenaObstacle | null | undefined,
  ): void {
    if (!action) return;
    if (action.kind === "phase-change") {
      this.frameEvents.push({ type: "bastion-eater-phase", position: { ...enemy.position }, phase: action.phase });
    } else if (action.kind === "claw-warning") {
      this.frameEvents.push({ type: "bastion-eater-claw-warning", position: { ...enemy.position }, direction: { ...enemy.bastionEaterDirection } });
    } else if (action.kind === "tendril-warning") {
      this.frameEvents.push({ type: "bastion-eater-tendril", position: { ...enemy.position }, radiusMetres: action.radiusMetres, warning: true });
    } else if (action.kind === "breach-warning") {
      this.frameEvents.push({ type: "bastion-eater-breach", position: { ...enemy.bastionEaterTarget }, radiusMetres: action.radiusMetres, warning: true });
    } else if (action.kind === "claw-strike") {
      this.frameEvents.push({ type: "bastion-eater-claw-strike", position: { ...enemy.position }, direction: { ...enemy.bastionEaterDirection } });
      if (pointInsideRipperSweep(enemy.position, enemy.bastionEaterDirection, this.playerPosition, 4.4)) {
        this.damagePlayer(PLAYER_ATTACK_DAMAGE_BASELINES.bastionEaterClaw);
      }
    } else if (action.kind === "charge-start") {
      this.frameEvents.push({ type: "bastion-eater-charge", position: { ...enemy.position }, direction: { ...enemy.bastionEaterDirection } });
    } else if (action.kind === "charge-impact" && chargeObstacle) {
      const impact = { x: chargeObstacle.x + chargeObstacle.width / 2, y: chargeObstacle.y + chargeObstacle.height / 2 };
      this.damageObstacle(chargeObstacle.id, 450, impact, "mini-boss-charge");
      this.damageObstacle(chargeObstacle.id, 450, impact, "mini-boss-charge");
    } else if (action.kind === "tendril-strike") {
      this.frameEvents.push({ type: "bastion-eater-tendril", position: { ...enemy.position }, radiusMetres: action.radiusMetres, warning: false });
      const playerDistance = distance(enemy.position, this.playerPosition);
      if (playerDistance >= 2.25 && playerDistance <= action.radiusMetres + PLAYER_RADIUS_METRES) {
        this.damagePlayer(enemy.bastionEaterPhase === "last-stand"
          ? PLAYER_ATTACK_DAMAGE_BASELINES.bastionEaterTendrilLastStand
          : PLAYER_ATTACK_DAMAGE_BASELINES.bastionEaterTendril);
      }
    } else if (action.kind === "lay-eggs") {
      const before = this.enemies.filter((candidate) => !candidate.dead && candidate.type === "egg-cluster").length;
      this.layBroodEggs(enemy, action.count);
      const after = this.enemies.filter((candidate) => !candidate.dead && candidate.type === "egg-cluster").length;
      this.frameEvents.push({ type: "bastion-eater-eggs", position: { ...enemy.position }, count: after - before });
    } else if (action.kind === "breach-strike") {
      this.frameEvents.push({ type: "bastion-eater-breach", position: { ...enemy.bastionEaterTarget }, radiusMetres: action.radiusMetres, warning: false });
      if (distance(enemy.bastionEaterTarget, this.playerPosition) <= action.radiusMetres + PLAYER_RADIUS_METRES) {
        this.damagePlayer(PLAYER_ATTACK_DAMAGE_BASELINES.bastionEaterBreach, "explosive");
      }
    }
  }

  private firstCollidingObstacle(position: Vector2Data, radius: number) {
    return this.activeObstacles().find((obstacle) => (
      position.x + radius > obstacle.x
      && position.x - radius < obstacle.x + obstacle.width
      && position.y + radius > obstacle.y
      && position.y - radius < obstacle.y + obstacle.height
    ));
  }

  /**
   * Damages a world object directly, the way `dealDamage` and `spawnEnemy`
   * expose enemies. Lets a test light a Fuel Cell without first arranging a
   * weapon, an angle and a hundred frames of travel.
   */
  damageObstacleForTest(obstacleId: string, damage: number): void {
    const obstacle = this.arena.obstacles.find((candidate) => candidate.id === obstacleId);
    if (!obstacle) return;
    this.damageObstacle(
      obstacleId,
      damage,
      { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 },
      "player-projectile",
    );
  }

  private damageObstacle(
    obstacleId: string,
    rawDamage: number,
    position: Vector2Data,
    source: TerrainDamageSource,
  ): void {
    const obstacle = this.arena.obstacles.find((candidate) => candidate.id === obstacleId);
    if (!obstacle) return;
    const current = this.obstacleHealth.get(obstacleId) ?? obstacleMaxDurability(obstacle);
    if (current <= 0) return;
    const damage = Math.max(0, rawDamage);
    const remainingHealth = Math.max(0, current - damage);
    this.obstacleHealth.set(obstacleId, remainingHealth);
    this.obstacleHitRemainingSeconds.set(obstacleId, 1.5);
    if (remainingHealth <= 0) {
      this.frameEvents.push({ type: "obstacle-destroyed", obstacleId, position: { ...position }, damage, remainingHealth: 0, source });
      // Scavenger's Eye pays out here rather than on damage, so a half-broken
      // crate is worth nothing and the relic rewards finishing the job.
      if (this.relicModifiers.scrapPerWorldObjectDestroyed > 0) {
        this.secureScrap(this.relicModifiers.scrapPerWorldObjectDestroyed, "world-object", position);
      }
      this.detonateWorldObject(obstacle, source);
    } else {
      this.frameEvents.push({ type: "obstacle-damaged", obstacleId, position: { ...position }, damage, remainingHealth, source });
    }
  }

  /**
   * Fuel Cell and any future `onDestroyed: detonate` world object. Destruction
   * is a weapon: the blast hurts enemies **and** the player, and it sets off
   * neighbouring cells, so a line of them is a trap you can spring — on the
   * swarm or on yourself.
   *
   * The chain runs breadth-first with an explicit visited set rather than by
   * recursing through `damageObstacle`, because two adjacent cells would
   * otherwise detonate each other forever.
   */
  private detonateWorldObject(origin: ArenaObstacle, source: TerrainDamageSource): void {
    const originEffect = worldObjectById(origin.worldObjectId ?? "")?.onDestroyed;
    if (!originEffect) return;

    const detonated = new Set<string>([origin.id]);
    let frontier: { obstacle: ArenaObstacle; effect: typeof originEffect }[] = [
      { obstacle: origin, effect: originEffect },
    ];

    while (frontier.length > 0) {
      const next: typeof frontier = [];
      for (const { obstacle, effect } of frontier) {
        const centre = {
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2,
        };
        this.frameEvents.push({ type: "explosion", position: { ...centre }, radiusMetres: effect.radiusMetres });

        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          if (distance(enemy.position, centre) <= effect.radiusMetres + enemyRadius(enemy)) {
            this.dealDamage(enemy.id, effect.damage, "fire");
          }
        }
        if (distance(this.playerPosition, centre) <= effect.radiusMetres + PLAYER_RADIUS_METRES) {
          this.damagePlayer(effect.damage, "explosive");
        }

        for (const candidate of this.arena.obstacles) {
          if (detonated.has(candidate.id)) continue;
          const candidateEffect = worldObjectById(candidate.worldObjectId ?? "")?.onDestroyed;
          if (!candidateEffect) continue;
          const candidateCentre = {
            x: candidate.x + candidate.width / 2,
            y: candidate.y + candidate.height / 2,
          };
          if (distance(candidateCentre, centre) > effect.chainRadiusMetres) continue;
          detonated.add(candidate.id);
          // The neighbour is consumed by the blast whether or not it had health
          // left; its own explosion is what matters, not its remaining hit points.
          this.obstacleHealth.set(candidate.id, 0);
          this.frameEvents.push({
            type: "obstacle-destroyed",
            obstacleId: candidate.id,
            position: { ...candidateCentre },
            damage: effect.damage,
            remainingHealth: 0,
            source,
          });
          next.push({ obstacle: candidate, effect: candidateEffect });
        }
      }
      frontier = next;
    }
  }

  private damageTerrainInRadius(
    centre: Vector2Data,
    radiusMetres: number,
    damage: number,
    source: TerrainDamageSource,
  ): void {
    for (const obstacle of this.activeObstacles()) {
      const closest = {
        x: Math.max(obstacle.x, Math.min(centre.x, obstacle.x + obstacle.width)),
        y: Math.max(obstacle.y, Math.min(centre.y, obstacle.y + obstacle.height)),
      };
      if (distance(closest, centre) <= radiusMetres) {
        this.damageObstacle(obstacle.id, damage, closest, source);
      }
    }
  }

  private emitCrusherShockwave(
    position: Vector2Data,
    radiusMetres = 2.2,
    damage: number = PLAYER_ATTACK_DAMAGE_BASELINES.crusherCharge,
  ): void {
    this.frameEvents.push({ type: "mini-boss-shockwave", position: { ...position }, radiusMetres });
    if (distance(position, this.playerPosition) <= radiusMetres + PLAYER_RADIUS_METRES) {
      this.damagePlayer(damage, "explosive");
    }
  }

  private updateSlimeSpitter(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepSlimeSpitterBehavior(
      { phase: enemy.spitterPhase, phaseRemainingSeconds: enemy.spitterPhaseRemainingSeconds },
      {
        deltaSeconds,
        // Measured before movement, matching the inline version.
        playerDistanceBeforeMovement: distance(enemy.position, this.playerPosition),
        random: () => this.random(),
      },
    );
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    // Launched before the state write, because launchSlimeGlob reads the target
    // recorded when the windup committed.
    if (result.launchGlob) this.launchSlimeGlob(enemy);
    enemy.spitterPhase = result.state.phase;
    enemy.spitterPhaseRemainingSeconds = result.state.phaseRemainingSeconds;

    // The shared budgets are checked after movement, as they were inline.
    if (
      result.readyToWindup
      && this.canBeginRangedWindup()
      && this.availableEnemyProjectileSlots() >= 1
    ) {
      const windup = commitSlimeSpitterWindup(this.playerPosition);
      enemy.spitterPhase = windup.state.phase;
      enemy.spitterPhaseRemainingSeconds = windup.state.phaseRemainingSeconds;
      enemy.spitterTarget = windup.target;
      this.frameEvents.push({
        type: "slime-spit-windup",
        position: { ...enemy.position },
        target: { ...enemy.spitterTarget },
      });
    }
  }

  private updateQuillback(enemy: EnemyState, deltaSeconds: number): void {
    const result = stepQuillbackBehavior(
      {
        phase: enemy.quillbackPhase,
        phaseRemainingSeconds: enemy.quillbackPhaseRemainingSeconds,
        shotCount: enemy.quillbackShotCount,
        attackCount: enemy.quillbackAttackCount,
        direction: enemy.quillbackDirection,
      },
      {
        deltaSeconds,
        playerDistanceBeforeMovement: distance(enemy.position, this.playerPosition),
        isMatriarch: enemy.eliteKind === "quillback-matriarch",
      },
    );
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);
    // Released before the state write: both launchers read live enemy fields.
    if (result.release === "rain-of-spines") this.beginRainOfSpines(enemy);
    else if (result.release === "volley") this.launchQuillbackVolley(enemy);
    enemy.quillbackPhase = result.state.phase;
    enemy.quillbackPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.quillbackShotCount = result.state.shotCount;
    enemy.quillbackAttackCount = result.state.attackCount;
    enemy.quillbackDirection = result.state.direction;

    const shotCount = quillbackVolleyCount(enemy.quillbackAttackCount);
    if (
      result.readyToWindup
      && this.canBeginRangedWindup()
      && this.availableEnemyProjectileSlots() >= shotCount
    ) {
      const windup = commitQuillbackWindup(
        result.state,
        enemy.position,
        this.playerPosition,
        shotCount,
      );
      enemy.quillbackPhase = windup.state.phase;
      enemy.quillbackPhaseRemainingSeconds = windup.state.phaseRemainingSeconds;
      enemy.quillbackShotCount = windup.state.shotCount;
      enemy.quillbackDirection = windup.direction;
      enemy.facingDirection = windup.direction;
      this.frameEvents.push({
        type: "quillback-windup",
        position: { ...enemy.position },
        direction: { ...enemy.quillbackDirection },
        count: enemy.quillbackShotCount,
      });
    }
  }

  private launchQuillbackVolley(enemy: EnemyState): void {
    const directions = createQuillbackFanDirections(
      enemy.quillbackDirection,
      enemy.quillbackShotCount,
      QUILLBACK_FAN_ARC_RADIANS,
    ).slice(0, this.availableEnemyProjectileSlots());
    for (const direction of directions) {
      const start = {
        x: enemy.position.x + direction.x * 0.72,
        y: enemy.position.y + direction.y * 0.72,
      };
      const target = {
        x: start.x + direction.x * QUILLBACK_PROJECTILE_RANGE_METRES,
        y: start.y + direction.y * QUILLBACK_PROJECTILE_RANGE_METRES,
      };
      this.spawnHostileProjectile({
        type: "quill-spike",
        position: start,
        velocity: {
          x: direction.x * QUILLBACK_PROJECTILE_SPEED,
          y: direction.y * QUILLBACK_PROJECTILE_SPEED,
        },
        target,
        remainingSeconds: QUILLBACK_PROJECTILE_RANGE_METRES / QUILLBACK_PROJECTILE_SPEED,
        damage: this.scaledEnemyDamage(enemy, QUILLBACK_SPIKE_DAMAGE),
        createsPuddle: false,
      });
    }
    this.frameEvents.push({
      type: "quillback-volley",
      position: { ...enemy.position },
      direction: { ...enemy.quillbackDirection },
      count: enemy.quillbackShotCount,
    });
  }

  private updateSpinewheel(enemy: EnemyState, deltaSeconds: number): void {
    let result = stepSpinewheelBehavior(
      this.spinewheelState(enemy),
      {
        deltaSeconds,
        position: enemy.position,
        playerPosition: this.playerPosition,
        positioningSpeedMetresPerSecond: ENEMY_CATALOG.spinewheel.movementSpeedMetresPerSecond,
        statusSpeedMultiplier: this.enemyStatusSpeedMultiplier(enemy),
        radiusMetres: ENEMY_CATALOG.spinewheel.radiusMetres,
        playerRadiusMetres: PLAYER_RADIUS_METRES,
        arena: this.collisionArena(),
      },
    );
    enemy.position = result.position;
    this.writeSpinewheelState(enemy, result.state);
    if (result.facingDirection) enemy.facingDirection = result.facingDirection;
    this.applyMovementIntent(enemy, result.movement, deltaSeconds);

    if (result.warningFired) {
      this.frameEvents.push({
        type: "spinewheel-windup",
        position: { ...enemy.position },
        direction: { ...enemy.spinewheelDirection },
      });
    }
    if (result.bounceFired) {
      this.frameEvents.push({
        type: "spinewheel-bounce",
        position: { ...enemy.position },
        direction: { ...enemy.spinewheelDirection },
        bouncesRemaining: enemy.spinewheelBouncesRemaining,
      });
    }
    if (
      result.crossedPlayer
      && result.state.playerHitCooldownSeconds <= 0
      && !this.playerInvulnerable
      && this.playerHurtCooldownSeconds <= 0
    ) {
      this.damagePlayer(this.scaledEnemyDamage(enemy, SPINEWHEEL_ROLL_DAMAGE));
      result = { ...result, state: lockSpinewheelPlayerHit(result.state) };
      this.writeSpinewheelState(enemy, result.state);
      this.frameEvents.push({ type: "spinewheel-hit", position: { ...this.playerPosition } });
    }
    if (result.recoveryFired) {
      this.frameEvents.push({ type: "spinewheel-recovery", position: { ...enemy.position } });
    }
  }

  private spinewheelState(enemy: EnemyState): SpinewheelState {
    return {
      phase: enemy.spinewheelPhase,
      phaseRemainingSeconds: enemy.spinewheelPhaseRemainingSeconds,
      direction: enemy.spinewheelDirection,
      speedMetresPerSecond: enemy.spinewheelSpeedMetresPerSecond,
      bouncesRemaining: enemy.spinewheelBouncesRemaining,
      playerHitCooldownSeconds: enemy.spinewheelPlayerHitCooldownSeconds,
    };
  }

  private writeSpinewheelState(enemy: EnemyState, state: SpinewheelState): void {
    enemy.spinewheelPhase = state.phase;
    enemy.spinewheelPhaseRemainingSeconds = state.phaseRemainingSeconds;
    enemy.spinewheelDirection = state.direction;
    enemy.spinewheelSpeedMetresPerSecond = state.speedMetresPerSecond;
    enemy.spinewheelBouncesRemaining = state.bouncesRemaining;
    enemy.spinewheelPlayerHitCooldownSeconds = state.playerHitCooldownSeconds;
  }

  private updateTetherBloom(enemy: EnemyState, deltaSeconds: number): void {
    const playerDistance = distance(enemy.position, this.playerPosition);
    const hasClearPath = !segmentHitsArenaObstacle(
      enemy.position,
      this.playerPosition,
      this.activeObstacles(),
    );
    const result = stepTetherBloomBehavior(
      this.tetherBloomState(enemy),
      {
        deltaSeconds,
        playerPosition: this.playerPosition,
        playerDistanceMetres: playerDistance,
        hasClearPath,
        heroEvading: this.heroState === "evading",
        tetherAvailable: this.activeTetherEnemyId === null,
        ownsTether: this.activeTetherEnemyId === enemy.id,
        minimumPullDistanceMetres:
          ENEMY_CATALOG["tether-bloom"].radiusMetres + PLAYER_RADIUS_METRES + 0.15,
      },
    );

    // The authored contract pulls on the final tether tick before release.
    if (result.pullDistanceMetres > 0) {
      const towardBloom = normalizeVector({
        x: enemy.position.x - this.playerPosition.x,
        y: enemy.position.y - this.playerPosition.y,
      });
      this.playerPosition = resolveCircleMovement(
        this.playerPosition,
        {
          x: this.playerPosition.x + towardBloom.x * result.pullDistanceMetres,
          y: this.playerPosition.y + towardBloom.y * result.pullDistanceMetres,
        },
        PLAYER_RADIUS_METRES,
        this.collisionArena(),
      );
    }
    this.applyTetherBloomResult(enemy, result);
  }

  private tetherBloomState(enemy: EnemyState): TetherBloomState {
    return {
      phase: enemy.tetherBloomPhase,
      phaseRemainingSeconds: enemy.tetherBloomPhaseRemainingSeconds,
      target: enemy.tetherBloomTarget,
      damageDuringGrab: enemy.tetherBloomDamageDuringGrab,
    };
  }

  private applyTetherBloomResult(enemy: EnemyState, result: TetherBloomStepResult): void {
    enemy.tetherBloomPhase = result.state.phase;
    enemy.tetherBloomPhaseRemainingSeconds = result.state.phaseRemainingSeconds;
    enemy.tetherBloomTarget = result.state.target;
    enemy.tetherBloomDamageDuringGrab = result.state.damageDuringGrab;
    if (result.claimTether) this.activeTetherEnemyId = enemy.id;
    if (result.releaseTether && this.activeTetherEnemyId === enemy.id) {
      this.activeTetherEnemyId = null;
    }

    switch (result.event) {
      case "windup":
        this.frameEvents.push({
          type: "tether-bloom-windup",
          position: { ...enemy.position },
          target: { ...enemy.tetherBloomTarget },
        });
        break;
      case "latched":
        this.frameEvents.push({ type: "tether-bloom-latched", position: { ...enemy.position } });
        break;
      case "released":
        this.frameEvents.push({ type: "tether-bloom-released", position: { ...enemy.position } });
        break;
      case "broken-evasive":
        this.emitTetherBloomBreak(enemy, "evasive");
        break;
      case "broken-damage":
        this.emitTetherBloomBreak(enemy, "damage");
        break;
      case "broken-range":
        this.emitTetherBloomBreak(enemy, "range");
        break;
      case "ownership-lost":
      case null:
        break;
    }
  }

  private emitTetherBloomBreak(enemy: EnemyState, reason: TetherBloomBreakReason): void {
    this.frameEvents.push({
      type: "tether-bloom-broken",
      position: { ...enemy.position },
      reason,
    });
  }

  private launchSlimeGlob(enemy: EnemyState): void {
    if (this.availableEnemyProjectileSlots() <= 0) return;
    const direction = normalizeVector({
      x: enemy.spitterTarget.x - enemy.position.x,
      y: enemy.spitterTarget.y - enemy.position.y,
    });
    const speed = 7;
    const start = {
      x: enemy.position.x + direction.x * 0.7,
      y: enemy.position.y + direction.y * 0.7,
    };
    this.spawnHostileProjectile({
      type: "slime-glob",
      position: start,
      velocity: { x: direction.x * speed, y: direction.y * speed },
      target: { ...enemy.spitterTarget },
      remainingSeconds: Math.max(0.12, distance(start, enemy.spitterTarget) / speed),
      damage: this.scaledEnemyDamage(enemy, SLIME_GLOB_DAMAGE),
      createsPuddle: true,
    });
    this.frameEvents.push({
      type: "slime-glob-fired",
      position: { ...start },
      target: { ...enemy.spitterTarget },
    });
  }

  private updateEnemyProjectiles(deltaSeconds: number): void {
    for (const projectile of this.enemyProjectiles) {
      if (projectile.dead) continue;
      const previous = { ...projectile.position };
      projectile.position.x += projectile.velocity.x * deltaSeconds;
      projectile.position.y += projectile.velocity.y * deltaSeconds;
      projectile.remainingSeconds -= deltaSeconds;

      const obstacle = projectile.type === "prime-biomass"
        ? undefined
        : this.activeObstacles().find((candidate) => pointHitsObstacle(projectile.position, [candidate]));
      if (obstacle) {
        if (projectile.type !== "corrupted-knife") {
          this.damageObstacle(obstacle.id, projectile.damage, projectile.position, "mini-boss-impact");
        }
        projectile.position = previous;
        this.resolveEnemyProjectileImpact(projectile, "cover");
      } else if (distanceToSegment(this.playerPosition, previous, projectile.position) <= PLAYER_RADIUS_METRES + 0.3) {
        this.resolveEnemyProjectileImpact(projectile, "player");
      } else if (projectile.remainingSeconds <= 0) {
        projectile.position = { ...projectile.target };
        this.resolveEnemyProjectileImpact(projectile, "expired");
      }
    }
  }

  private resolveEnemyProjectileImpact(
    projectile: EnemyProjectileState,
    impactReason: "player" | "cover" | "expired",
  ): void {
    projectile.dead = true;
    const createdPuddle = projectile.createsPuddle && this.createSlowingPuddle(projectile.position);
    const hitPlayer = distance(projectile.position, this.playerPosition) <= PLAYER_RADIUS_METRES + 0.45;
    if (projectile.type === "prime-biomass") {
      return;
    }
    if (projectile.type === "corrupted-knife") {
      this.frameEvents.push({
        type: "corrupted-marine-knife-impact",
        position: { ...projectile.position },
        reason: hitPlayer ? "player" : impactReason,
        damage: hitPlayer ? projectile.damage : 0,
        enemyId: projectile.sourceEnemyId ?? -1,
      });
    } else if (projectile.type === "brood-acid") {
      this.frameEvents.push({ type: "brood-acid-impact", position: { ...projectile.position } });
    } else if (projectile.type === "quill-spike") {
      this.frameEvents.push({ type: "quillback-spike-impact", position: { ...projectile.position }, hitPlayer });
    } else {
      this.frameEvents.push({
        type: "slime-impact",
        position: { ...projectile.position },
        createdPuddle,
      });
    }
    if (hitPlayer) {
      this.damagePlayer(projectile.damage, "projectile");
    }
  }

  private createSlowingPuddle(position: Vector2Data): boolean {
    this.groundHazards.push({
      id: this.nextId(),
      type: "slowing-slime",
      position: { ...position },
      radiusMetres: SLOWING_PUDDLE_RADIUS_METRES,
      remainingSeconds: SLOWING_PUDDLE_DURATION_SECONDS,
      durationSeconds: SLOWING_PUDDLE_DURATION_SECONDS,
    });
    while (this.groundHazards.filter((hazard) => hazard.type === "slowing-slime").length > MAX_SLOWING_PUDDLES) {
      const oldestPuddle = this.groundHazards.findIndex((hazard) => hazard.type === "slowing-slime");
      if (oldestPuddle < 0) break;
      this.groundHazards.splice(oldestPuddle, 1);
    }
    return true;
  }

  private updateGroundHazards(deltaSeconds: number): void {
    for (const hazard of this.groundHazards) {
      hazard.remainingSeconds -= deltaSeconds;
      if (hazard.type !== "prime-biomass") continue;
      hazard.damageCooldownSeconds = Math.max(0, (hazard.damageCooldownSeconds ?? 0) - deltaSeconds);
      if (
        hazard.damageCooldownSeconds <= 0
        && distance(hazard.position, this.playerPosition) <= hazard.radiusMetres + PLAYER_RADIUS_METRES * 0.35
      ) {
        const owner = this.enemies.find((enemy) => enemy.id === hazard.ownerId && !enemy.dead);
        const damage = owner ? this.scaledEnemyDamage(owner, 1.1) : 1.1;
        this.damagePlayer(damage);
        hazard.damageCooldownSeconds = 0.8;
        this.frameEvents.push({
          type: "abomination-prime-hazard-tick",
          position: { ...hazard.position },
          enemyId: hazard.ownerId ?? -1,
          damage,
        });
      }
    }
    this.groundHazards = this.groundHazards.filter((hazard) => hazard.remainingSeconds > 0);
  }

  private beginRainOfSpines(enemy: EnemyState): void {
    this.rainOfSpines.push({
      id: this.nextId(),
      ownerId: enemy.id,
      targets: buildRainOfSpinesTargets(this.playerPosition, this.widthMetres, this.heightMetres),
      remainingSeconds: RAIN_OF_SPINES_TELL_SECONDS,
      damage: this.scaledEnemyDamage(enemy, PLAYER_ATTACK_DAMAGE_BASELINES.quillbackSpike * 1.5),
    });
  }

  private updateRainOfSpines(deltaSeconds: number): void {
    for (const rain of this.rainOfSpines) {
      rain.remainingSeconds -= deltaSeconds;
      if (rain.remainingSeconds > 0) continue;
      if (rain.targets.some((target) => distance(target, this.playerPosition) <= rainRadiusMetres() + PLAYER_RADIUS_METRES)) {
        this.damagePlayer(rain.damage);
      }
      for (const target of rain.targets) {
        this.frameEvents.push({ type: "rain-of-spines-impact", position: { ...target } });
      }
    }
    this.rainOfSpines = this.rainOfSpines.filter((rain) => rain.remainingSeconds > 0);
  }

  private combatTelegraphSnapshots(): readonly CombatTelegraphSnapshot[] {
    const telegraphs: CombatTelegraphSnapshot[] = [];
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (enemy.siegeCrusherPhase === "slam-windup") {
        telegraphs.push({
          id: `slam-${enemy.id}`,
          groupId: `slam-${enemy.id}`,
          kind: "ground-slam",
          origin: { ...enemy.position },
          radiusMetres: enemy.health / enemy.maxHealth <= 0.2 ? 4 : 3.4,
          remainingSeconds: enemy.siegeCrusherPhaseRemainingSeconds,
          durationSeconds: GROUND_SLAM_TELL_SECONDS,
          major: true,
        });
      }
      if (enemy.broodWardenPhase === "cleave-windup") {
        telegraphs.push({
          id: `cleave-${enemy.id}`,
          groupId: `cleave-${enemy.id}`,
          kind: "sweeping-arc",
          origin: { ...enemy.position },
          direction: { ...enemy.broodWardenDirection },
          radiusMetres: enemy.health / enemy.maxHealth <= 0.2 ? 3 : enemy.health / enemy.maxHealth <= 0.55 ? 2.75 : 2.5,
          halfArcRadians: Math.PI / 3,
          remainingSeconds: enemy.broodWardenPhaseRemainingSeconds,
          durationSeconds: SWEEPING_ARC_TELL_SECONDS,
          major: true,
        });
      }
      if (enemy.type === "rift-stalker" && enemy.riftStalkerPhase === "mark") {
        telegraphs.push({
          id: `rift-mark-${enemy.id}`,
          groupId: `rift-mark-${enemy.id}`,
          kind: "radial-pulse",
          origin: { ...enemy.riftStalkerMarkTarget },
          radiusMetres: RIFT_STALKER_POUNCE_RADIUS_METRES,
          remainingSeconds: enemy.riftStalkerPhaseRemainingSeconds,
          durationSeconds: 0.85,
          major: true,
        });
      }
      if (enemy.type === "rift-stalker" && enemy.riftStalkerPhase === "slash-windup") {
        telegraphs.push({
          id: `rift-slash-${enemy.id}`,
          groupId: `rift-slash-${enemy.id}`,
          kind: "sweeping-arc",
          origin: { ...enemy.position },
          direction: { ...enemy.riftStalkerDirection },
          radiusMetres: RIFT_STALKER_SLASH_REACH_METRES,
          halfArcRadians: RIFT_STALKER_SLASH_HALF_ARC_RADIANS,
          remainingSeconds: enemy.riftStalkerPhaseRemainingSeconds,
          durationSeconds: SWEEPING_ARC_TELL_SECONDS,
          major: true,
        });
      }
      if (enemy.type === "brain-blob" && enemy.brainPhase === "windup") {
        telegraphs.push({
          id: `pulse-${enemy.id}`,
          groupId: `pulse-${enemy.id}`,
          kind: "radial-pulse",
          origin: { ...enemy.position },
          radiusMetres: 1.15,
          remainingSeconds: enemy.brainPhaseRemainingSeconds,
          durationSeconds: RADIAL_PULSE_TELL_SECONDS,
          major: false,
        });
      }
    }
    for (const rain of this.rainOfSpines) {
      rain.targets.forEach((target, index) => telegraphs.push({
        id: `rain-${rain.id}-${index}`,
        groupId: `rain-${rain.id}`,
        kind: "rain-of-spines",
        origin: { ...target },
        radiusMetres: rainRadiusMetres(),
        remainingSeconds: rain.remainingSeconds,
        durationSeconds: RAIN_OF_SPINES_TELL_SECONDS,
        major: true,
      }));
    }
    return limitMajorTelegraphs(telegraphs);
  }

  /** Persistent arena hazards currently under the player's feet. */
  private arenaHazardsUnderPlayer(): readonly ArenaHazard[] {
    const hazards = this.arena.hazards;
    if (!hazards || hazards.length === 0) return [];
    return hazards.filter((hazard) => pointInsideHazard(this.playerPosition, hazard));
  }

  /**
   * Damage-over-time from persistent floor hazards. Damage accumulates
   * fractionally and lands in whole ticks so a toxic pool reads as "4 per
   * second" rather than as a per-frame trickle whose size depends on frame rate.
   * Only the strongest hazard underfoot applies — standing where a fire patch
   * and a toxic pool overlap should not silently double the rate.
   */
  private updateArenaHazards(deltaSeconds: number): void {
    const hazards = this.arenaHazardsUnderPlayer();
    if (hazards.length === 0) {
      this.hazardDamageAccumulator = 0;
      return;
    }
    let worst = 0;
    for (const hazard of hazards) {
      if (hazard.effect.type === "damage") worst = Math.max(worst, hazard.effect.damagePerSecond);
    }
    if (worst <= 0) {
      this.hazardDamageAccumulator = 0;
      return;
    }
    this.hazardDamageAccumulator += worst * deltaSeconds;
    if (this.hazardDamageAccumulator < 1) return;
    const whole = Math.floor(this.hazardDamageAccumulator);
    this.hazardDamageAccumulator -= whole;
    this.damagePlayer(whole, "hazard");
  }

  /** Strongest slow underfoot, or 1. Slime slows; it never damages. */
  private arenaHazardMovementMultiplier(): number {
    let multiplier = 1;
    for (const hazard of this.arenaHazardsUnderPlayer()) {
      if (hazard.effect.type === "slow") {
        multiplier = Math.min(multiplier, hazard.effect.movementMultiplier);
      }
    }
    return multiplier;
  }

  private isPlayerSlowed(): boolean {
    return this.groundHazards.some((hazard) => (
      hazard.type === "slowing-slime"
      && distance(hazard.position, this.playerPosition) <= hazard.radiusMetres + PLAYER_RADIUS_METRES * 0.35
    ));
  }

  private moveEnemyTowardPlayer(enemy: EnemyState, speed: number, deltaSeconds: number): void {
    const desired = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    const profile = ENEMY_STEERING_PROFILES[ENEMY_CATALOG[enemy.type].steeringProfile];
    const direction = blendSteering(desired, this.enemySeparation(enemy), profile.separationWeight);
    this.moveEnemy(enemy, direction, speed, deltaSeconds);
  }

  private moveEnemyForRangeBand(enemy: EnemyState, deltaSeconds: number): void {
    const definition = ENEMY_CATALOG[enemy.type];
    const profile = ENEMY_STEERING_PROFILES[definition.steeringProfile];
    const towardPlayer = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    const intent = rangeBandIntent(distance(enemy.position, this.playerPosition), profile.id);
    if (intent === 0) {
      enemy.facingDirection = towardPlayer;
      return;
    }
    const desired = intent > 0
      ? towardPlayer
      : { x: -towardPlayer.x, y: -towardPlayer.y };
    const direction = blendSteering(desired, this.enemySeparation(enemy), profile.separationWeight);
    this.moveEnemy(enemy, direction, this.baseEnemyMovementSpeed(enemy) * (intent < 0 ? 1.15 : 1), deltaSeconds);
  }

  private baseEnemyMovementSpeed(enemy: EnemyState): number {
    if (enemy.eliteKind === "razorlord") return 4.6;
    if (enemy.eliteKind === "blightspitter") return 2.4;
    return ENEMY_CATALOG[enemy.type].movementSpeedMetresPerSecond;
  }

  private enemySeparation(enemy: EnemyState): Vector2Data {
    const separation = { x: 0, y: 0 };
    const neighbourRadius = enemyRadius(enemy) + 0.9;
    for (const other of this.enemies) {
      if (other.id === enemy.id || other.dead) continue;
      const offset = { x: enemy.position.x - other.position.x, y: enemy.position.y - other.position.y };
      const magnitude = Math.hypot(offset.x, offset.y);
      if (magnitude <= 0.001 || magnitude >= neighbourRadius) continue;
      const strength = 1 - magnitude / neighbourRadius;
      separation.x += offset.x / magnitude * strength;
      separation.y += offset.y / magnitude * strength;
    }
    return normalizeVector(separation);
  }

  private canBeginRangedWindup(): boolean {
    let count = 0;
    for (const enemy of this.enemies) {
      if (
        (enemy.type === "slime-spitter" && enemy.spitterPhase === "windup")
        || (enemy.type === "quillback" && enemy.quillbackPhase === "windup")
      ) {
        count += 1;
      }
    }
    return count < MAX_RANGED_WINDUPS;
  }

  private availableEnemyProjectileSlots(): number {
    const live = this.enemyProjectiles.filter((projectile) => !projectile.dead).length;
    return Math.max(0, ENEMY_PROJECTILE_BUDGET - live);
  }

  private moveEnemy(
    enemy: EnemyState,
    direction: Vector2Data,
    speed: number,
    deltaSeconds: number,
  ): void {
    const radius = enemyRadius(enemy);
    const effectiveSpeed = speed * enemy.movementSpeedMultiplier * this.enemyStatusSpeedMultiplier(enemy);
    enemy.position = resolveCircleMovement(
      enemy.position,
      {
        x: enemy.position.x + direction.x * effectiveSpeed * deltaSeconds,
        y: enemy.position.y + direction.y * effectiveSpeed * deltaSeconds,
      },
      radius,
      this.collisionArena(),
    );
  }

  private resolveEnemyContactDamage(): void {
    if (this.playerInvulnerable || this.playerHurtCooldownSeconds > 0) {
      return;
    }

    for (const enemy of this.enemies) {
      if (enemy.dead) {
        continue;
      }

      const definition = ENEMY_CATALOG[enemy.type];
      if (enemy.type === "spinewheel" && enemy.spinewheelPhase === "rolling") {
        continue;
      }
      const contactDamage = this.scaledEnemyDamage(
        enemy,
        enemy.rank === "elite" ? definition.contactDamage * 1.4 : definition.contactDamage,
      );
      if (
        contactDamage > 0
        && enemy.attackCooldownSeconds <= 0
        && distance(enemy.position, this.playerPosition) <= enemyRadius(enemy) + PLAYER_RADIUS_METRES
      ) {
        this.damagePlayer(contactDamage, "contact");
        enemy.attackCooldownSeconds = 0.8;
        break;
      }
    }
  }

  /**
   * `source` exists for Blast Baffle, which promises "explosive damage to you is
   * halved". Blasts, slams and shockwaves pass `"explosive"`; everything else
   * takes the default. (The relic's original field was named for *self*-inflicted
   * damage, which the game has no mechanic for — this is the half of its
   * description that is actually implementable.)
   */
  private damagePlayer(rawDamage: number, source: PlayerDamageSource = "generic"): void {
    if (this.scenario === "density-capacity") return;
    if (source === "explosive") {
      rawDamage *= this.relicModifiers.selfExplosiveDamageMultiplier;
    }
    const ignoresHurtWindow = source === "hazard";
    if (rawDamage <= 0 || this.playerInvulnerable) return;
    if (!ignoresHurtWindow && this.playerHurtCooldownSeconds > 0) return;
    // Item dodge (Brotato overhaul): a chance to ignore the hit outright. Guarded
    // so a zero dodge chance draws no RNG, keeping the deterministic replay digest
    // stable for runs with no dodge items.
    // Null Field: the first hit of each wave simply does not land.
    if (this.relicModifiers.negatesFirstHitPerWave && !this.nullFieldSpentThisWave) {
      this.nullFieldSpentThisWave = true;
      this.frameEvents.push({ type: "projectile-blocked", position: { ...this.playerPosition } });
      return;
    }
    if (this.playerStats.dodgePercent > 0 && this.random() < this.playerStats.dodgePercent / 100) {
      // Chrono Capacitor: a successful dodge refunds part of the evasive cooldown.
      this.heroMotion.refundEvasiveCooldown(this.relicModifiers.evasiveRefundOnDodge);
      this.frameEvents.push({ type: "projectile-blocked", position: { ...this.playerPosition } });
      return;
    }
    if (this.isBuffActive("phase-jacket")) {
      this.activeBuffs.delete("phase-jacket");
      this.frameEvents.push({
        type: "projectile-blocked",
        position: { ...this.playerPosition },
      });
      return;
    }
    const healthBeforeHit = this.playerHealth;
    const absorption = absorbWithShield(this.playerShield, rawDamage);
    const shieldDamage = this.playerShield - absorption.remainingShield;
    this.playerShield = absorption.remainingShield;
    // Aegis Reactor artifact shortens the delay before the shield recharges.
    this.shieldRechargeCooldownSeconds = this.defence.shieldRechargeDelaySeconds * this.relicModifiers.shieldRechargeDelayMultiplier;
    if (absorption.remainingDamage > 0) {
      const entrenchedBonus = this.isPlayerEntrenched() ? this.hero.passive.bonusArmour : 0;
      // Riot Plating: armour that only counts while something is in your face.
      const closeQuartersBonus = this.relicModifiers.closeQuartersArmour > 0
        && this.enemies.some((enemy) => !enemy.dead
          && distance(enemy.position, this.playerPosition) <= RIOT_PLATING_RANGE_METRES)
        ? this.relicModifiers.closeQuartersArmour
        : 0;
      let mitigated = mitigateDamage(
        absorption.remainingDamage,
        this.defence.armour + entrenchedBonus + closeQuartersBonus,
        this.defence.flatDamageReduction,
      );
      if (this.playerHealth / this.playerMaxHealth < 0.3) {
        mitigated *= this.perkModifiers.lowHealthDamageMultiplier;
      }
      // Bonus health is spent after mitigation, unlike shield which absorbs the
      // raw hit: it is extra hit points, so armour still applies to it. Spent
      // before health so it can actually save the player.
      const absorbedByBonus = Math.min(this.playerBonusHealth, mitigated);
      this.playerBonusHealth -= absorbedByBonus;
      this.playerHealth = Math.max(0, this.playerHealth - (mitigated - absorbedByBonus));
      // Reactive Blood answers *health* damage specifically, so it sits inside
      // this branch — a hit fully absorbed by shield provokes nothing.
      if (mitigated > 0) this.applyRetaliationBurst();
    }
    if (!ignoresHurtWindow) {
      this.playerHurtCooldownSeconds = this.defence.hitInvulnerabilitySeconds;
    }
    this.frameEvents.push({
      type: "player-hit",
      position: { ...this.playerPosition },
      damage: rawDamage,
    });
    if (shieldDamage > 0) {
      this.frameEvents.push({
        type: "player-shield-hit",
        position: { ...this.playerPosition },
        damage: shieldDamage,
      });
    }
    const appliedDamage = shieldDamage + Math.max(0, healthBeforeHit - this.playerHealth);
    this.runDamageTaken += appliedDamage;
    this.runDamageTakenBySource[source] += appliedDamage;
    // Warp Anchor: being hit throws you clear of whatever hit you.
    this.applyWarpAnchorBlink();
    if (this.playerHealth <= 0) {
      // Bastion Beacon: the first lethal hit of a run leaves you standing.
      if (this.relicModifiers.revivesOnce && !this.bastionBeaconSpent) {
        this.bastionBeaconSpent = true;
        this.playerHealth = Math.max(1, this.playerMaxHealth * 0.15);
        this.playerHurtCooldownSeconds = Math.max(this.playerHurtCooldownSeconds, 1.5);
        this.frameEvents.push({ type: "player-revived", position: { ...this.playerPosition } });
      } else {
        this.runDefeatCause = playerDefeatCause(source);
        this.status = "defeat";
      }
    }
  }

  private scaledEnemyDamage(enemy: EnemyState, baseDamage: number): number {
    // Ranked enemies get a higher ceiling: several mini-boss move baselines
    // already sit at 4.4-5, so under the standard cap their damage scaling
    // would be almost entirely clamped away.
    const cap = enemy.rank === "mini-boss" || enemy.rank === "boss"
      ? RANKED_ENEMY_HIT_CAP
      : ENEMY_HIT_CAP;
    return scaleEnemyHit(baseDamage, { damageMultiplier: enemy.damageMultiplier }, cap);
  }

  private updateExperiencePickups(deltaSeconds: number): void {
    const magnetBoost = this.isBuffActive("magnet-pulse") ? MAGNET_PULSE_MULTIPLIER : 1;
    const attractionRadius = 2.2 * this.magnetMultiplier * magnetBoost * this.transformationModifiers.pickupRadiusMultiplier;
    const collectionRadius = 0.5 * this.magnetMultiplier * magnetBoost * this.transformationModifiers.pickupRadiusMultiplier;

    for (const pickup of this.pickups) {
      if (pickup.collected) {
        continue;
      }

      const pickupDistance = distance(pickup.position, this.playerPosition);
      if (pickupDistance <= attractionRadius && pickupDistance > 0) {
        const direction = normalizeVector({
          x: this.playerPosition.x - pickup.position.x,
          y: this.playerPosition.y - pickup.position.y,
        });
        const travel = Math.min(7 * deltaSeconds, pickupDistance);
        pickup.position.x += direction.x * travel;
        pickup.position.y += direction.y * travel;
      }

      if (distance(pickup.position, this.playerPosition) <= collectionRadius) {
        pickup.collected = true;
        this.frameEvents.push({
          type: "xp-collected",
          position: { ...pickup.position },
          value: pickup.value,
        });
        this.addExperience(pickup.value);
      }
    }
  }

  private updatePowerups(deltaSeconds: number): void {
    for (const powerup of this.powerups) {
      if (powerup.collected) continue;
      powerup.remainingSeconds -= deltaSeconds;
      if (powerup.remainingSeconds <= 0) {
        powerup.collected = true;
        continue;
      }
      if (distance(powerup.position, this.playerPosition) <= POWERUP_COLLECT_RADIUS_METRES) {
        powerup.collected = true;
        this.applyPowerup(powerup.type);
        this.frameEvents.push({
          type: "powerup-collected",
          position: { ...powerup.position },
          powerupType: powerup.type,
        });
      }
    }
  }

  private applyPowerup(type: PowerupType): void {
    if (type === "aegis") {
      this.playerShield += AEGIS_SHIELD_AMOUNT * this.supportEffectMultiplier;
      return;
    }
    if (type === "medkit") {
      // Picking a medkit up at full health used to be worth exactly nothing;
      // the overflow is now banked as bonus health instead. The event still
      // reports only genuine healing, so healing numbers stay honest.
      const healed = this.grantHealing(
        MEDKIT_HEAL_AMOUNT * this.supportEffectMultiplier * this.transformationModifiers.healingReceivedMultiplier,
      );
      if (healed > 0) {
        this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount: healed });
      }
      this.applyHealthPickupSlowPulse();
      return;
    }
    if (type === "emp-charge") {
      // Instant crowd-breaker: Overload stuns everything in a wide ring, which
      // is the panic button the close-quarters rack wants when it gets swamped.
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (distance(enemy.position, this.playerPosition) > EMP_CHARGE_RADIUS_METRES) continue;
        if (!this.canStatusApply(enemy, "overload")) continue;
        enemy.statusTimers.overload = STATUS_RULES.overload.durationSeconds;
        this.frameEvents.push({ type: "status-applied", position: { ...enemy.position }, status: "overload" });
      }
      this.frameEvents.push({
        type: "mini-boss-shockwave",
        position: { ...this.playerPosition },
        radiusMetres: EMP_CHARGE_RADIUS_METRES,
      });
      return;
    }
    this.activeBuffs.set(
      type,
      Math.max(this.activeBuffs.get(type) ?? 0, POWERUP_DURATION_SECONDS[type]),
    );
  }

  private nextPowerupPosition(): Vector2Data {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = {
        x: this.widthMetres / 2 + (this.random() - 0.5) * this.widthMetres * 0.55,
        y: this.heightMetres / 2 + (this.random() - 0.5) * this.heightMetres * 0.55,
      };
      if (!pointHitsObstacle(candidate, this.activeObstacles())) {
        return candidate;
      }
    }
    return { x: this.widthMetres / 2, y: this.heightMetres / 2 };
  }

  private updateEliteRewards(): void {
    if (this.decisionQueue.length > 0) return;
    for (const reward of this.eliteRewards) {
      if (reward.collected || distance(reward.position, this.playerPosition) > 0.8) continue;
      reward.collected = true;
      this.frameEvents.push({ type: "elite-reward-collected", position: { ...reward.position } });
      if (reward.type === "aurum-supply-cache") {
        const decision = this.buildSupplyDepotDecision();
        this.decisionQueue.push({ ...decision, title: "AURUM SUPPLY CACHE — CHOOSE ONE" });
      } else if (reward.type === "mini-boss-arsenal-cache") {
        this.grantHealing(3 * this.supportEffectMultiplier);
        this.addExperience(this.experienceThreshold() * 2);
      } else {
        // Elite caches are the run's slot income: choose which category
        // grows. Once the hard cap is reached they fall back to experience.
        const requisition = this.buildSlotRequisitionDecision();
        if (requisition) {
          this.decisionQueue.push(requisition);
        } else {
          this.addExperience(this.experienceThreshold());
        }
      }
      break;
    }
  }

  private damageEnemy(
    enemy: EnemyState,
    rawDamage: number,
    damageType: DamageType = "physical",
    sourceWeaponId?: WeaponId,
  ): void {
    if (enemy.dead || rawDamage <= 0) {
      return;
    }

    const definition = ENEMY_CATALOG[enemy.type];
    const resistanceMultiplier = definition.resistances[damageType] ?? 1;
    const corrodeActive = (enemy.statusTimers.corrode ?? 0) > 0;
    const aurumArmourBreak = enemy.type === "aurum-hoarder" ? enemy.aurumArmourBreaksPaid * 3 : 0;
    const effectiveArmour = Math.max(
      enemy.armour - aurumArmourBreak - (corrodeActive ? STATUS_RULES.corrode.armourReduction : 0),
      0,
    );
    const shieldBefore = enemy.shield;
    const momentumMultiplier = this.assaultMomentumMultiplier(enemy.id, sourceWeaponId);
    const absorption = absorbWithShield(enemy.shield, rawDamage * resistanceMultiplier * momentumMultiplier);
    enemy.shield = absorption.remainingShield;
    let mitigated = mitigateDamage(
      absorption.remainingDamage,
      effectiveArmour,
      enemy.flatDamageReduction,
    );
    if (enemy.type === "bastion-eater" && enemy.bastionEaterAction !== "recovery") {
      mitigated *= 0.35;
    }
    if (
      enemy.type === "rift-stalker"
      && (enemy.riftStalkerPhase === "cloak" || enemy.riftStalkerPhase === "warp")
    ) {
      mitigated *= RIFT_STALKER_CLOAK_DAMAGE_MULTIPLIER;
    }
    if (
      enemy.type === "synapse-herald"
      && enemy.synapseHeraldBehavior.phase === "action"
      && enemy.synapseHeraldBehavior.move === "synapse-link"
      && enemy.synapseHeraldBehavior.linkTargetId !== null
      && this.enemies.some((candidate) => (
        candidate.id === enemy.synapseHeraldBehavior.linkTargetId
        && !candidate.dead
        && candidate.type === "brain-blob"
      ))
    ) {
      mitigated *= 0.55;
    }

    // Executioner's Mark: finish wounded enemies faster.
    if (
      this.relicModifiers.executeBonusDamage > 0
      && enemy.health / Math.max(1, enemy.maxHealth) <= EXECUTE_HEALTH_FRACTION
    ) {
      mitigated *= 1 + this.relicModifiers.executeBonusDamage;
    }

    const status = STATUS_BY_DAMAGE_TYPE[damageType];
    if (status && this.canStatusApply(enemy, status)) {
      // Mutagenic "Acidic Secretions" raises Corrode buildup dealt.
      const corrodeBonus = status === "corrode" ? this.transformationModifiers.corrodeBuildupMultiplier : 1;
      // Element Primer doubles buildup, which is what makes the 8-point
      // threshold reachable for slow, hard-hitting elemental weapons.
      // Four independent sources multiply here: the per-damage-type upgrade
      // tuning, the Corrode transformation bonus, the Element Primer relic, and
      // — added 7 Aug 2026 — the resolved player stat, which is how items and
      // level-up cards reach status at all. Kept multiplicative with the others
      // so every existing source behaves exactly as it did.
      const buildupRate = (this.statusTuning.buildupMultiplier[damageType] ?? 1)
        * corrodeBonus
        * this.relicModifiers.statusBuildupMultiplier
        * (1 + this.playerStats.statusBuildupPercent / 100);
      const buildup = (enemy.statusBuildup[status] ?? 0) + mitigated * buildupRate;
      if (buildup >= STATUS_BUILDUP_THRESHOLD) {
        enemy.statusBuildup[status] = 0;
        enemy.statusTimers[status] = STATUS_RULES[status].durationSeconds
          + (status === "freeze" ? this.statusTuning.freezeDurationBonusSeconds : 0);
        this.frameEvents.push({
          type: "status-applied",
          position: { ...enemy.position },
          status,
        });
      } else {
        enemy.statusBuildup[status] = buildup;
      }
    }

    this.frameEvents.push({
      type: "enemy-hit",
      position: { ...enemy.position },
      damage: mitigated,
      damageType,
      enemyId: enemy.id,
    });
    this.registerAssaultMomentumHit(enemy.id, sourceWeaponId);
    if (this.scenario === "density-capacity") {
      return;
    }
    const applied = Math.max(0, shieldBefore - enemy.shield) + Math.min(enemy.health, mitigated);
    this.runHighestHit = Math.max(this.runHighestHit, applied);
    if (enemy.rank === "boss") {
      this.runBossDamage += applied;
    }
    if (sourceWeaponId) {
      this.runDamageByWeapon[sourceWeaponId] = (this.runDamageByWeapon[sourceWeaponId] ?? 0) + applied;
      const second = Math.min(6 * 60 * 60 - 1, Math.max(0, Math.floor(this.runElapsedSeconds)));
      this.runDamageBySecond[second] = (this.runDamageBySecond[second] ?? 0) + applied;
    }
    if (enemy.type === "tether-bloom" && enemy.tetherBloomPhase === "tethering") {
      this.applyTetherBloomResult(
        enemy,
        applyTetherBloomDamage(
          this.tetherBloomState(enemy),
          mitigated,
          this.activeTetherEnemyId === enemy.id,
        ),
      );
    }
    if (
      enemy.type === "abomination-prime"
      && enemy.abominationPrimeBehavior.phase === "action"
      && enemy.abominationPrimeBehavior.move === "biomass-grab"
    ) {
      enemy.abominationPrimeBehavior = damageAbominationPrimeGrab(
        enemy.abominationPrimeBehavior,
        mitigated,
      );
    }
    const healthBeforeHit = enemy.health;
    if (shieldBefore > enemy.shield) enemy.recentDamageRemainingSeconds = 2.25;
    this.applyRawDamage(enemy, mitigated);
    // Item lifesteal (Brotato overhaul): heal a fraction of the damage this weapon
    // hit actually removed (shield + health). Only weapon damage routes through
    // `damageEnemy`; status/DoT ticks call `applyRawDamage` directly and don't leech.
    if (this.playerStats.lifestealPercent > 0) {
      const dealt = Math.max(0, shieldBefore - enemy.shield) + Math.max(0, healthBeforeHit - enemy.health);
      if (this.lifestealWindowRemainingSeconds <= 0) {
        this.lifestealWindowRemainingSeconds = 1;
        this.lifestealWindowPaid = 0;
      }
      const throughputRemaining = Math.max(
        0,
        this.playerMaxHealth * PLAYER_STAT_LIMITS.lifestealThroughputMaxHealthFraction - this.lifestealWindowPaid,
      );
      const healed = Math.min(
        dealt * this.playerStats.lifestealPercent / 100,
        throughputRemaining,
        this.playerMaxHealth - this.playerHealth,
      );
      if (healed > 0) {
        this.playerHealth += healed;
        this.lifestealWindowPaid += healed;
        this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount: healed });
      }
    }
  }

  private canStatusApply(enemy: EnemyState, status: StatusEffectType): boolean {
    if (enemy.rank !== "mini-boss" && enemy.rank !== "boss") {
      return true;
    }
    return !STATUS_RULES[status].stunned && STATUS_RULES[status].speedMultiplier >= 1;
  }

  /** Direct unmitigated damage: used by status ticks and self-detonations. */
  private applyRawDamage(enemy: EnemyState, damage: number): void {
    if (enemy.dead || damage <= 0) {
      return;
    }

    enemy.recentDamageRemainingSeconds = 2.25;

    const previousHealth = enemy.health;
    if (enemy.type === "cyborg-reclaimer") enemy.reclaimerDamagedSinceLastStep = true;
    if (enemy.type === "foundry-fabricator") enemy.foundryDamagedSinceLastStep = true;
    if (enemy.type === "assembly-prime") enemy.assemblyPrimeDamagedSinceLastStep = true;
    if (enemy.type === "foundry-pad") {
      enemy.health = Math.max(0, enemy.health - damage);
      const owner = this.enemies.find((candidate) => candidate.id === enemy.foundryPadOwnerId && !candidate.dead);
      if (owner?.type === "foundry-fabricator") owner.foundryBehavior = damageFoundryPad(owner.foundryBehavior, damage);
      if (owner?.type === "assembly-prime") owner.assemblyPrimeBehavior = damageAssemblyPrimePad(owner.assemblyPrimeBehavior, damage);
      if (enemy.health <= 0) enemy.dead = true;
      return;
    }
    if (enemy.type === "storm-node" && enemy.conductiveNode) {
      enemy.conductiveNode = damageConductiveNode(enemy.conductiveNode, damage);
      enemy.health = enemy.conductiveNode.health;
    } else if (enemy.type === "nest-pod" && enemy.nestPod) {
      const result = damageNestPod(enemy.nestPod, damage);
      enemy.nestPod = result.pod;
      enemy.health = result.pod.health;
      if (result.releasedReservedSlots > 0) {
        this.nestReservedLiveSlots = Math.max(0, this.nestReservedLiveSlots - result.releasedReservedSlots);
        this.nestReservedThreat = Math.max(0, this.nestReservedThreat - result.releasedReservedThreat);
        this.frameEvents.push({ type: "nest-pod-destroyed", position: { ...enemy.position }, podId: enemy.id });
      }
    } else {
      enemy.health -= damage;
    }
    if (enemy.type === "aurum-hoarder") {
      for (const threshold of crossedAurumThresholds(
        previousHealth,
        Math.max(0, enemy.health),
        enemy.maxHealth,
        enemy.aurumArmourBreaksPaid,
      )) {
        enemy.aurumArmourBreaksPaid += 1;
        this.secureScrap(AURUM_HOARDER_BREAK_SCRAP, "aurum-armour", enemy.position);
        this.frameEvents.push({
          type: "aurum-armour-broken",
          position: { ...enemy.position },
          threshold,
          scrap: AURUM_HOARDER_BREAK_SCRAP,
          totalScrap: this.securedScrap,
        });
      }
    }
    if (enemy.health > 0) {
      return;
    }

    enemy.dead = true;
    if (enemy.type === "egg-cluster") {
      this.applyBroodbreakerBurst(enemy);
    }
    if (enemy.type === "scrap-skitterer") {
      const wreckId = this.nextId();
      this.groundHazards.push({
        id: wreckId,
        type: "machine-wreck",
        position: { ...enemy.position },
        radiusMetres: 0.48,
        remainingSeconds: SCRAP_SKITTERER_WRECK_SECONDS,
        durationSeconds: SCRAP_SKITTERER_WRECK_SECONDS,
      });
      this.frameEvents.push({
        type: "scrap-skitterer-wreck",
        position: { ...enemy.position },
        wreckId,
        durationSeconds: SCRAP_SKITTERER_WRECK_SECONDS,
      });
    }
    if (enemy.type === "nest-weaver" && enemy.nestPendingReservation) {
      this.nestReservedLiveSlots = Math.max(
        0,
        this.nestReservedLiveSlots - enemy.nestPendingReservation.reservedHatchlingSlots,
      );
      this.nestReservedThreat = Math.max(
        0,
        this.nestReservedThreat - enemy.nestPendingReservation.reservedHatchlingThreat,
      );
      enemy.nestPendingReservation = null;
    }
    if (enemy.type === "foundry-fabricator") {
      const pending = enemy.foundryBehavior.pendingReservation;
      if (pending) {
        this.foundryReservedLiveSlots = Math.max(0, this.foundryReservedLiveSlots - pending.reservedLiveSlots);
        this.foundryReservedThreat = Math.max(0, this.foundryReservedThreat - pending.reservedThreat);
        enemy.foundryBehavior = { ...enemy.foundryBehavior, pendingReservation: null };
      }
      this.removeFoundryPad(enemy.id);
      for (const child of this.enemies) {
        if (
          !child.dead
          && child.foundryChildOwnerId === enemy.id
          && (child.type === "foundry-drone" || child.type === "foundry-turret")
        ) {
          child.dead = true;
          this.frameEvents.push({
            type: "foundry-child-powered-down",
            position: { ...child.position },
            enemyId: child.id,
            ownerId: enemy.id,
            reason: "owner-defeated",
          });
        }
      }
    }
    if (enemy.type === "assembly-prime") {
      const pending = enemy.assemblyPrimeBehavior.pendingReservation;
      if (pending) {
        this.foundryReservedLiveSlots = Math.max(0, this.foundryReservedLiveSlots - pending.reservedLiveSlots);
        this.foundryReservedThreat = Math.max(0, this.foundryReservedThreat - pending.reservedThreat);
      }
      this.removeFoundryPad(enemy.id);
      for (const child of this.enemies) {
        if (!child.dead && child.foundryChildOwnerId === enemy.id) child.dead = true;
      }
    }
    if (enemy.type === "storm-regent") {
      for (const node of this.enemies) {
        if (!node.dead && node.type === "storm-node" && node.stormNodeOwnerId === enemy.id) {
          node.dead = true;
        }
      }
    }
    if (enemy.type === "abomination-prime") {
      if (this.activeTetherEnemyId === enemy.id) this.activeTetherEnemyId = null;
      this.groundHazards = this.groundHazards.filter((hazard) => (
        hazard.type !== "prime-biomass" || hazard.ownerId !== enemy.id
      ));
      for (const projectile of this.enemyProjectiles) {
        if (projectile.type === "prime-biomass" && projectile.sourceEnemyId === enemy.id) projectile.dead = true;
      }
    }
    this.runKills += 1;
    this.itemEffectKillCount += 1;
    this.fireItemEffects("on-kill");
    if (enemy.rank === "elite") this.runEliteKills += 1;
    this.frameEvents.push({
      type: "enemy-defeated",
      position: { ...enemy.position },
      enemyType: enemy.type,
      bestiaryKey: this.bestiaryKeyOf(enemy),
    });
    // Symbiote Heart artifact: kills restore a sliver of health.
    this.applyNearbyKillHealing(enemy.position);
    this.addOverclockStack();
    if (this.relicModifiers.lifestealPerKill > 0 && this.playerHealth < this.playerMaxHealth) {
      const healed = Math.min(this.relicModifiers.lifestealPerKill, this.playerMaxHealth - this.playerHealth);
      this.playerHealth += healed;
      this.frameEvents.push({ type: "player-healed", position: { ...this.playerPosition }, amount: healed });
    }
    if (enemy.type === "aurum-hoarder") {
      this.secureScrap(AURUM_HOARDER_KILL_SCRAP, "aurum-defeat", enemy.position);
      this.eliteRewards.push({
        id: this.nextId(),
        type: "aurum-supply-cache",
        position: { ...enemy.position },
        collected: false,
      });
      this.frameEvents.push({ type: "aurum-supply-cache-dropped", position: { ...enemy.position } });
    } else if (enemy.miniBossKind) {
      // Phase 5: rank payouts scale with depth now that the fights do. Flat
      // rewards made a late mini-boss worth the same as the first one.
      this.secureScrap(rankDefeatScrap(40, this.waveIndex), "mini-boss-defeat", enemy.position);
      this.unlockUniqueWeapons();
      this.grantWeightedItem(enemy.position);
    } else if (enemy.eliteKind) {
      this.secureScrap(rankDefeatScrap(15, this.waveIndex), "elite-defeat", enemy.position);
    } else if (enemy.rank === "boss") {
      // The boss previously fell through every reward branch and paid nothing.
      this.secureScrap(rankDefeatScrap(80, this.waveIndex), "boss-defeat", enemy.position);
      this.unlockUniqueWeapons();
      this.grantWeightedItem(enemy.position);
    } else if (enemy.type === "quillback" || enemy.type === "spinewheel" || enemy.type === "ripper") {
      this.secureScrap(2, "specialist-defeat", enemy.position);
    } else if (enemy.rank === "standard" && this.random() < ORDINARY_SCRAP_DROP_CHANCE) {
      this.secureScrap(1, "ordinary-drop", enemy.position);
    }
    if (enemy.rank === "standard" && this.random() < MEDKIT_DROP_CHANCE) {
      this.spawnPowerup("medkit", { ...enemy.position });
    }
    if (this.statusTuning.combustionOnDeath && (enemy.statusTimers.blaze ?? 0) > 0) {
      this.frameEvents.push({
        type: "explosion",
        position: { ...enemy.position },
        radiusMetres: COMBUSTION_RADIUS_METRES,
      });
      for (const nearby of this.enemies) {
        if (
          nearby.id !== enemy.id
          && !nearby.dead
          && distance(nearby.position, enemy.position) <= COMBUSTION_RADIUS_METRES
        ) {
          this.damageEnemy(nearby, COMBUSTION_DAMAGE, "fire");
        }
      }
    }
    if (enemy.type === "bastion-eater") {
      this.status = "victory";
      this.frameEvents.push({ type: "bastion-eater-vault", position: { ...enemy.position } });
    }
    if (enemy.type === "blast-mite") {
      this.frameEvents.push({
        type: "explosion",
        position: { ...enemy.position },
        radiusMetres: BLAST_MITE_EXPLOSION_RADIUS_METRES,
      });
      if (
        distance(enemy.position, this.playerPosition)
        <= BLAST_MITE_EXPLOSION_RADIUS_METRES + PLAYER_RADIUS_METRES
      ) {
        this.damagePlayer(this.scaledEnemyDamage(enemy, BLAST_MITE_EXPLOSION_DAMAGE), "explosive");
      }
    }
    if (enemy.eliteKind) {
      this.eliteRewards.push({
        id: this.nextId(),
        type: "elite-upgrade-cache",
        position: { ...enemy.position },
        collected: false,
      });
      this.frameEvents.push({
        type: "elite-reward-dropped",
        position: { ...enemy.position },
        eliteKind: enemy.eliteKind,
      });
    }
    if (enemy.miniBossKind) {
      this.eliteRewards.push({
        id: this.nextId(),
        type: "mini-boss-arsenal-cache",
        position: { ...enemy.position },
        collected: false,
      });
      this.frameEvents.push({
        type: "mini-boss-reward-dropped",
        position: { ...enemy.position },
        miniBossKind: enemy.miniBossKind,
      });
    }
    const experienceValue = enemy.eliteKind
      ? (enemy.eliteKind === "razorlord" || enemy.eliteKind === "blightspitter" ? 30 : 25)
      : enemy.miniBossKind ? 60 : ENEMY_CATALOG[enemy.type].experienceValue;
    if (experienceValue > 0) {
      this.pickups.push({
        id: this.nextId(),
        position: { ...enemy.position },
        value: experienceValue,
        collected: false,
      });
    }
  }

  private secureScrap(
    amount: number,
    source: ScrapSource,
    position: Vector2Data,
  ): void {
    // Scavenger's Manifest artifact + item harvesting (Brotato overhaul) multiply
    // combat Scrap gains. Harvesting is the central economy stat: more scrap per
    // kill/clear means more shop purchasing power.
    const scaled = amount
      * this.relicModifiers.scrapMultiplier
      * this.upgradeScrapMultiplier
      * (1 + this.playerStats.harvestingPercent / 100);
    this.securedScrap += scaled;
    this.runScrapEarned += Math.max(0, scaled);
    this.frameEvents.push({
      type: "scrap-secured",
      position: { ...position },
      amount: scaled,
      total: this.securedScrap,
      source,
    });
  }

  private removeDeadEntities(): void {
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    for (const projectile of this.projectiles) {
      if (projectile.dead) this.friendlyProjectilePool.push(projectile);
    }
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    for (const projectile of this.enemyProjectiles) {
      if (projectile.dead) this.hostileProjectilePool.push(projectile);
    }
    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => !projectile.dead);
    this.pickups = this.pickups.filter((pickup) => !pickup.collected);
    this.powerups = this.powerups.filter((powerup) => !powerup.collected);
    this.eliteRewards = this.eliteRewards.filter((reward) => !reward.collected);
    this.supplyChests = this.supplyChests.filter((chest) => !chest.resolved);
  }

  private spawnFriendlyProjectile(data: Omit<ProjectileState, "id" | "dead">): void {
    // Dead projectiles are reclaimed before admission, so the cap never turns
    // ordinary expiry into gameplay suppression and live views are never recycled.
    for (const projectile of this.projectiles) {
      if (projectile.dead) this.friendlyProjectilePool.push(projectile);
    }
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    if (!this.friendlyProjectileBudget.admit(this.projectiles.length, data.weaponId)) return;
    const projectile = this.friendlyProjectilePool.pop() ?? ({} as ProjectileState);
    Object.assign(projectile, data, { id: this.nextId(), dead: false });
    this.projectiles.push(projectile);
  }

  private spawnHostileProjectile(data: Omit<EnemyProjectileState, "id" | "dead">): void {
    const projectile = this.hostileProjectilePool.pop() ?? ({} as EnemyProjectileState);
    Object.assign(projectile, { sourceEnemyId: undefined }, data, { id: this.nextId(), dead: false });
    this.enemyProjectiles.push(projectile);
  }

  private updateWaveSpawns(deltaSeconds: number): void {
    this.waveElapsedSeconds += deltaSeconds;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0]!.atSeconds <= this.waveElapsedSeconds) {
      if (this.enemies.length >= this.waveLiveCap) {
        this.densitySpawnCapBlockedSeconds += deltaSeconds;
        break;
      }
      const spawn = this.spawnQueue.shift()!;
      if (spawn.rank === "elite") {
        this.spawnElite(spawn.eliteKind ?? "carapace-scuttler");
      } else if (spawn.rank === "mini-boss") {
        this.spawnMiniBoss(this.pickMiniBoss());
      } else if (spawn.rank === "boss") {
        this.spawnBastionEater();
      } else {
        this.spawnEnemy(spawn.type);
      }
      this.recordDensitySpawn(spawn);
    }
  }

  private recordDensitySpawn(
    spawn: Pick<DirectorSpawnPlan, "type" | "rank"> & Partial<Pick<DirectorSpawnPlan, "threatCost">>,
  ): void {
    const role: EnemyPressureRole = spawn.rank
      ? (spawn.rank === "mini-boss" || spawn.rank === "boss" ? "boss" : "specialist")
      : pressureRoleOf(spawn.type);
    this.densitySpawnedThisWave += 1;
    this.waveThreatSpawned += spawn.threatCost ?? 0;
    this.densityPressureSpawned[role] += 1;
    this.densityPeakLiveEnemies = Math.max(this.densityPeakLiveEnemies, this.enemies.length);
  }

  private availableDirectorEnemySlots(): number {
    if (!this.wavesEnabled || this.waveLiveCap <= 0) return Number.POSITIVE_INFINITY;
    const liveEnemies = this.enemies.reduce((count, enemy) => count + (enemy.dead ? 0 : 1), 0);
    return Math.max(0, this.waveLiveCap - liveEnemies);
  }

  private updateEncounterProgress(deltaSeconds: number): void {
    const livingTreasure = this.enemies.filter((enemy) => !enemy.dead && enemy.rank === "treasure");
    const hasBlockingEnemy = this.enemies.some((enemy) => !enemy.dead && enemy.rank !== "treasure");
    if (this.expeditionEncounter !== null && this.status === "combat") {
      const timedComplete = this.waveEndsOnTimer
        && this.waveDurationSeconds !== null
        && this.waveElapsedSeconds >= this.waveDurationSeconds;
      const cleared = !this.waveEndsOnTimer
        && this.spawnQueue.length === 0
        && !hasBlockingEnemy
        && this.enemyProjectiles.length === 0
        && this.eliteRewards.every((reward) => reward.collected)
        && this.decisionQueue.length === 0;
      if (timedComplete || cleared) {
        this.finishExpeditionWave(livingTreasure, timedComplete);
      }
      return;
    }
    if (
      this.status === "combat"
      && this.waveEndsOnTimer
      && this.waveDurationSeconds !== null
      && this.waveElapsedSeconds >= this.waveDurationSeconds
    ) {
      this.finishWave(livingTreasure, true);
      return;
    }
    if (
      this.status === "combat"
      && !this.waveEndsOnTimer
      && this.spawnQueue.length === 0
      && !hasBlockingEnemy
      && this.enemyProjectiles.length === 0
    ) {
      this.finishWave(livingTreasure, false);
      return;
    }

    if (this.status === "intermission") {
      this.intermissionRemainingSeconds -= deltaSeconds;
      if (this.intermissionRemainingSeconds <= 0) {
        if (this.expeditionEncounter) this.beginExpeditionWave(this.expeditionWaveIndex + 1);
        else this.beginWave(this.waveIndex + 1);
      }
    }
  }

  private finishExpeditionWave(livingTreasure: readonly EnemyState[], timed: boolean): void {
    const encounter = this.expeditionEncounter!;
    for (const enemy of livingTreasure) this.escapeAurumHoarder(enemy);
    if (timed) {
      this.spawnQueue = [];
      this.enemies = [];
      this.activeTetherEnemyId = null;
      for (const projectile of this.enemyProjectiles) {
        projectile.dead = true;
        this.hostileProjectilePool.push(projectile);
      }
      this.enemyProjectiles = [];
      this.groundHazards = [];
    }
    if (!this.expeditionRewardedWaves.has(this.expeditionWaveIndex)) {
      this.expeditionRewardedWaves.add(this.expeditionWaveIndex);
      const nodeReward = campaignNodeClearScrap(
        encounter.kind,
        encounter.column,
      );
      const waveCount = Math.max(1, encounter.waves.length);
      const baseShare = Math.floor(nodeReward / waveCount);
      const remainder = nodeReward % waveCount;
      const share = baseShare + (this.expeditionWaveIndex < remainder ? 1 : 0);
      if (share > 0) this.secureScrap(share, "wave-clear", this.playerPosition);
    }
    if (this.expeditionWaveIndex >= encounter.waves.length - 1) {
      if (
        campaignOffersShop(encounter.kind)
        && !this.expeditionPostEncounterShopQueued
      ) {
        this.expeditionPostEncounterShopQueued = true;
        // A liberation node's fight was the price of entry — clearing it opens
        // that location's themed stock instead of the plain scrap market.
        this.decisionQueue.push(this.openScrapShopVisit(encounter.shopProfileId ?? DEFAULT_SHOP_PROFILE_ID));
        return;
      }
      this.status = "victory";
    } else {
      this.status = "intermission";
      this.intermissionRemainingSeconds = INTERMISSION_SECONDS;
    }
  }

  private finishWave(livingTreasure: readonly EnemyState[], timed: boolean): void {
    for (const enemy of livingTreasure) this.escapeAurumHoarder(enemy);
    if (timed) {
      this.spawnQueue = [];
      this.enemies = [];
      this.activeTetherEnemyId = null;
      for (const projectile of this.enemyProjectiles) {
        projectile.dead = true;
        this.hostileProjectilePool.push(projectile);
      }
      this.enemyProjectiles = [];
      this.groundHazards = [];
    }
    this.secureScrap(10 + 5 * (this.waveIndex + 1), "wave-clear", this.playerPosition);
    if (this.waveIndex >= TOTAL_WAVES - 1) {
      this.status = "victory";
    } else {
      this.status = "intermission";
      this.intermissionRemainingSeconds = INTERMISSION_SECONDS;
      this.queueIntermissionReward();
    }
  }

  private queueIntermissionReward(): void {
    if (this.waveIndex % 2 === 0) {
      const reward = this.buildWeaponChestDecision() ?? this.buildUpgradeDecision();
      if (reward) {
        this.decisionQueue.push(reward);
      }
    } else {
      this.decisionQueue.push(this.buildSupplyDepotDecision());
      this.decisionQueue.push(this.openScrapShopVisit());
    }
  }

  private beginWave(index: number): void {
    this.waveIndex = index;
    this.waveElapsedSeconds = 0;
    this.status = "combat";
    this.aurumSpawnedThisWave = false;
    // Quick Drop's wave entry. The expedition path has its own copy in
    // `beginExpeditionWave`; both must fire or the trigger works in one mode
    // and silently not the other.
    this.lowHealthEffectSpentThisWave = false;
    this.fireItemEffects("on-wave-start");
    const wave = buildDensityWave(index);
    this.spawnQueue = [...wave.plans];
    this.waveLiveCap = wave.liveCap;
    this.waveThreatBudget = wave.threatBudget;
    this.waveThreatSpawned = 0;
    this.waveDurationSeconds = wave.durationSeconds;
    this.waveEndsOnTimer = wave.timerEndsWave;
    this.densityPeakLiveEnemies = this.enemies.length;
    this.densitySpawnedThisWave = 0;
    this.densitySpawnCapBlockedSeconds = 0;
    this.densityPeakEnemyProjectiles = this.enemyProjectiles.length;
    this.densityPeakFriendlyProjectiles = this.projectiles.length;
    this.densityPressureSpawned = { pursuit: 0, ranged: 0, specialist: 0, boss: 0 };
    // Powerups from the first wave (was wave 2) — consumables should be common.
    this.spawnPowerup(this.powerupForWave(index));
    // Seeded supply chest: at most one alive, never on the teaching or boss waves.
    if (
      index >= 2
      && index < TOTAL_WAVES - 1
      && this.supplyChests.every((chest) => chest.resolved)
      && this.random() < SUPPLY_CHEST_SPAWN_CHANCE
    ) {
      this.spawnSupplyChest(this.random() < 0.5 ? "sealed" : "armored");
    }
    if (
      index >= 2
      && index < TOTAL_WAVES - 1
      && shouldSpawnAurumHoarder({
        waveNumber: index + 1,
        totalWaves: TOTAL_WAVES,
        roll: this.random(),
        liveEnemies: this.enemies.filter((enemy) => !enemy.dead).length,
        liveCap: this.waveLiveCap,
        alreadySpawned: this.aurumSpawnedThisWave,
        objectiveActive: false,
        rewardEconomyEnabled: true,
      })
    ) {
      this.spawnAurumHoarder();
    }
  }

  private populateStressScenario(profile: 4 | 12): void {
    const counts = profile === 12
      ? { scuttler: 32, egg: 5, brain: 8 }
      : { scuttler: 16, egg: 3, brain: 4 };

    for (let index = 0; index < counts.scuttler; index += 1) this.spawnEnemy("scuttler");
    for (let index = 0; index < counts.egg; index += 1) this.spawnEnemy("egg-cluster");
    for (let index = 0; index < counts.brain; index += 1) this.spawnEnemy("brain-blob");
  }

  private populateExpeditionEncounter(encounter: ExpeditionEncounterDescriptor): void {
    // Safe nodes also use campaign depth for shop reroll pricing.
    this.waveIndex = encounter.directorWaveIndex;
    switch (encounter.kind) {
      case "combat":
      case "elite":
      case "mini-boss":
      // A liberation node is an ordinary fight that happens to open a themed
      // shop when it is won — the fight has to actually start, or the node
      // resolves for free.
      case "liberation":
      case "boss": {
        this.beginExpeditionWave(0);
        break;
      }
      case "supply-depot":
        this.decisionQueue.push(this.buildSupplyDepotDecision());
        break;
      case "weapon-cache": {
        const decision = this.buildWeaponChestDecision() ?? this.buildUpgradeDecision();
        if (decision) this.decisionQueue.push(decision);
        break;
      }
      case "shrine":
      case "event":
        // Resolved by `ExpeditionEventScene`; combat only sees these via the
        // ambush outcome, which arrives as a synthesized `combat` encounter.
        break;
    }
  }

  private beginExpeditionWave(index: number): void {
    const encounter = this.expeditionEncounter;
    const plan: ExpeditionWavePlan | undefined = encounter?.waves[index];
    if (!encounter || !plan) {
      this.status = "victory";
      return;
    }
    this.expeditionWaveIndex = index;
    this.nullFieldSpentThisWave = false;
    this.lowHealthEffectSpentThisWave = false;
    this.fireItemEffects("on-wave-start");
    this.waveIndex = plan.directorWaveIndex;
    this.waveElapsedSeconds = 0;
    this.status = "combat";
    this.aurumSpawnedThisWave = false;
    this.waveThreatSpawned = 0;
    this.densityPeakLiveEnemies = this.enemies.length;
    this.densitySpawnedThisWave = 0;
    this.densitySpawnCapBlockedSeconds = 0;
    this.densityPeakEnemyProjectiles = this.enemyProjectiles.length;
    this.densityPeakFriendlyProjectiles = this.projectiles.length;
    this.densityPressureSpawned = { pursuit: 0, ranged: 0, specialist: 0, boss: 0 };

    if (plan.kind === "ordinary") {
      const wave = buildBudgetDensityWave(
        plan.threatBudget,
        plan.directorWaveIndex,
        plan.timerEndsWave,
        encounter.kind === "combat",
        plan.spawnCadenceMultiplier,
      );
      this.spawnQueue = [...wave.plans];
      this.waveLiveCap = wave.liveCap;
      this.waveThreatBudget = wave.threatBudget;
      this.waveDurationSeconds = wave.durationSeconds;
      this.waveEndsOnTimer = wave.timerEndsWave;
      // Expedition combat now drops one powerup per wave too (previously none).
      this.spawnPowerup(this.powerupForWave(index));
      return;
    }

    this.spawnQueue = [];
    // Phase 5: the rank wave inherits the survivors of the escort wave, so the
    // cap has to leave room for them rather than pinching the arena down to 18
    // the moment the mini-boss lands.
    this.waveLiveCap = Math.max(26, this.enemies.length + 8);
    this.waveDurationSeconds = null;
    this.waveEndsOnTimer = false;
    if (plan.kind === "elite") {
      const eliteKind = plan.eliteKind ?? encounter.eliteKind ?? "carapace-scuttler";
      this.spawnElite(eliteKind);
      this.waveThreatBudget = eliteKind === "razorlord" || eliteKind === "blightspitter" ? 18 : 15;
      this.recordDensitySpawn({ type: "scuttler", rank: "elite", threatCost: this.waveThreatBudget });
    } else if (plan.kind === "mini-boss") {
      this.spawnMiniBoss(plan.miniBossKind ?? encounter.miniBossKind ?? "siege-crusher");
      this.waveThreatBudget = 40;
      this.recordDensitySpawn({ type: "siege-crusher", rank: "mini-boss", threatCost: 40 });
    } else {
      this.spawnBastionEater({ x: this.widthMetres / 2 - 7, y: this.heightMetres / 2 });
      this.waveThreatBudget = 40;
      this.recordDensitySpawn({ type: "bastion-eater", rank: "boss", threatCost: 40 });
    }
  }

  private spawnBastionEater(position?: Vector2Data): number {
    const id = this.spawnEnemy("bastion-eater", position);
    const boss = this.enemies.find((enemy) => enemy.id === id)!;
    boss.rank = "boss";
    boss.bastionEaterPhase = "breach";
    boss.bastionEaterAction = "entrance";
    boss.bastionEaterActionRemainingSeconds = 1.2;
    return id;
  }

  /**
   * The seam review labs reach the simulation through. Everything here is
   * construction-time setup — none of it runs during `step` — so the width of
   * this surface costs nothing at runtime, and keeping it explicit is what
   * stops lab fixtures quietly reaching further into the simulation than real
   * play does.
   */
  private scenarioPopulationContext(): ScenarioPopulationContext {
    return {
      widthMetres: this.widthMetres,
      heightMetres: this.heightMetres,
      playerPosition: this.playerPosition,
      enemies: this.enemies,
      setPlayerHealth: (value) => { this.playerHealth = value; },
      setWaveLiveCap: (value) => { this.waveLiveCap = value; },
      setWaveThreatBudget: (value) => { this.waveThreatBudget = value; },
      resetDensityCounters: () => {
        this.densityPeakLiveEnemies = 0;
        this.densitySpawnedThisWave = 0;
        this.densityPressureSpawned = { ...DENSITY_PRESSURE_RESET };
      },
      spawnEnemy: (type, position) => this.spawnEnemy(type, position),
      spawnElite: (kind, position) => this.spawnElite(kind, position),
      spawnMiniBoss: (kind, position) => this.spawnMiniBoss(kind, position),
      spawnAurumHoarder: (position) => this.spawnAurumHoarder(position),
      spawnBastionEater: (position) => this.spawnBastionEater(position),
      recordDensitySpawn: (spawn) => this.recordDensitySpawn(spawn),
      activeObstacles: () => this.activeObstacles(),
      nextWeaponInstanceId: () => this.weaponInventory.nextInstanceId++,
      setPendingWeaponTile: (tile) => { this.pendingWeaponTile = tile; },
      queueDecision: (decision) => { this.decisionQueue.push(decision); },
      openScrapShopVisit: () => this.openScrapShopVisit(),
      buildWeaponPlacementDecision: (tile) => this.buildWeaponPlacementDecision(tile),
    };
  }

  private pickMiniBoss(): MiniBossKind {
    return selectMiniBossForRoll(this.random());
  }

  private checkForLevelUp(): void {
    if (this.decisionQueue.length > 0) {
      return;
    }

    const threshold = this.experienceThreshold();
    if (this.experience < threshold) {
      return;
    }

    this.experience -= threshold;
    this.level += 1;
    this.applyLevelGrowth();
    this.frameEvents.push({ type: "level-up", level: this.level });
    // Phase 3C: the upgrade draw now carries a stat card alongside the authored
    // upgrades. The all-stat draw covers the case where every upgrade is maxed
    // or locked out — that used to level the player up in complete silence.
    const decision = this.buildUpgradeDecision() ?? this.buildLevelStatDecision();
    if (decision) {
      this.decisionQueue.push(decision);
    }
  }

  private applyLevelGrowth(): void {
    const current = heroGrowthAtLevel(this.hero, this.level);
    const previous = heroGrowthAtLevel(this.hero, this.level - 1);
    const healthGain = current.maxHealthBonus - previous.maxHealthBonus;
    this.playerMaxHealth = this.rewardAdjustedMaxHealth(current.maxHealthBonus);
    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healthGain);
    this.defence.armour += current.armourBonus - previous.armourBonus;
    this.levelDamageMultiplier = current.damageMultiplier;
    this.levelSpeedMultiplier = current.speedMultiplier;
    this.supportEffectMultiplier = current.supportMultiplier;
    for (const weaponClass of Object.keys(this.weaponProficiencies) as WeaponClass[]) {
      this.weaponProficiencies[weaponClass] =
        Math.round(((current.proficiencyMultiplier[weaponClass] - 1) / 0.04) * 1_000) / 1_000;
    }
  }

  private experienceThreshold(): number {
    return experienceThreshold(this.level);
  }

  private enemySnapshot(enemy: EnemyState): EnemySnapshot {
    const definition = ENEMY_CATALOG[enemy.type];
    return {
      id: enemy.id,
      type: enemy.type,
      position: { ...enemy.position },
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      shield: enemy.shield,
      maxShield: enemy.maxShield,
      armour: enemy.armour,
      movementSpeedMultiplier: enemy.movementSpeedMultiplier,
      damageMultiplier: enemy.damageMultiplier,
      radiusMetres: enemyRadius(enemy),
      radiusScale: enemy.radiusScale ?? 1,
      hatchProgress: enemy.hatchDurationSeconds > 0
        ? 1 - enemy.hatchRemainingSeconds / enemy.hatchDurationSeconds
        : 0,
      brainPhase: enemy.type === "brain-blob" ? enemy.brainPhase : undefined,
      spitterPhase: enemy.type === "slime-spitter" ? enemy.spitterPhase : undefined,
      spitterTarget: enemy.type === "slime-spitter" && enemy.spitterPhase === "windup"
        ? { ...enemy.spitterTarget }
        : undefined,
      mitePhase: enemy.type === "blast-mite" ? enemy.mitePhase : undefined,
      survivorPhase: enemy.type === "infected-survivor" ? enemy.survivorPhase : undefined,
      survivorStaminaSeconds: enemy.type === "infected-survivor"
        ? enemy.survivorStaminaSeconds
        : undefined,
      survivorVelocity: enemy.type === "infected-survivor"
        ? { ...enemy.survivorVelocity }
        : undefined,
      corruptedMarinePhase: enemy.type === "corrupted-marine"
        ? enemy.corruptedMarinePhase
        : undefined,
      corruptedMarineTarget: enemy.type === "corrupted-marine"
        ? { ...enemy.corruptedMarineTarget }
        : undefined,
      abominationPhase: enemy.type === "abomination" ? enemy.abominationBehavior.phase : undefined,
      abominationTarget: enemy.type === "abomination" && enemy.abominationBehavior.lockedTarget
        ? { ...enemy.abominationBehavior.lockedTarget }
        : undefined,
      nestWeaverPhase: enemy.type === "nest-weaver" ? enemy.nestWeaverPhase : undefined,
      nestWeaverTarget: enemy.type === "nest-weaver" ? { ...enemy.nestWeaverTarget } : undefined,
      nestWeaverChargesRemaining: enemy.type === "nest-weaver"
        ? enemy.nestWeaverChargesRemaining
        : undefined,
      nestPodRemainingSeconds: enemy.type === "nest-pod" && enemy.nestPod
        ? enemy.nestPod.remainingSeconds
        : undefined,
      nestPodOwnerId: enemy.type === "nest-pod" ? enemy.nestPod?.ownerId : undefined,
      stormPhase: enemy.type === "storm-savant" ? enemy.stormChain.phase : undefined,
      stormSegments: enemy.type === "storm-savant" ? enemy.stormChain.segments : undefined,
      stormNodeOwnerId: enemy.type === "storm-node" ? enemy.stormNodeOwnerId ?? undefined : undefined,
      scrapSkittererPhase: enemy.type === "scrap-skitterer"
        ? enemy.scrapSkittererBehavior.phase
        : undefined,
      scrapSkittererDirection: enemy.type === "scrap-skitterer"
        ? { ...enemy.scrapSkittererBehavior.lockedDirection }
        : undefined,
      arcWardenPhase: enemy.type === "arc-warden" ? enemy.arcWardenBehavior.phase : undefined,
      arcWardenLane: enemy.type === "arc-warden" ? enemy.arcWardenBehavior.lockedLane : undefined,
      reclaimerPhase: enemy.type === "cyborg-reclaimer" ? enemy.reclaimerBehavior.phase : undefined,
      reclaimerTargetId: enemy.type === "cyborg-reclaimer"
        ? enemy.reclaimerBehavior.targetId ?? undefined
        : undefined,
      reclaimerChargesRemaining: enemy.type === "cyborg-reclaimer"
        ? enemy.reclaimerBehavior.chargesRemaining
        : undefined,
      foundryPhase: enemy.type === "foundry-fabricator" ? enemy.foundryBehavior.phase : undefined,
      foundryTarget: enemy.type === "foundry-fabricator" && enemy.foundryBehavior.target
        ? { ...enemy.foundryBehavior.target }
        : undefined,
      foundryChargesRemaining: enemy.type === "foundry-fabricator"
        ? enemy.foundryBehavior.chargesRemaining
        : undefined,
      foundryPadHealth: enemy.type === "foundry-fabricator"
        ? enemy.foundryBehavior.padHealth
        : undefined,
      foundryOwnerId: enemy.type === "foundry-pad"
        ? enemy.foundryPadOwnerId ?? undefined
        : enemy.foundryChildOwnerId ?? undefined,
      foundryRemainingSeconds: enemy.type === "foundry-drone" || enemy.type === "foundry-turret"
        ? enemy.foundryChildRemainingSeconds
        : undefined,
      foundryTurretPhase: enemy.type === "foundry-turret" ? enemy.foundryTurretPhase : undefined,
      foundryTurretTarget: enemy.type === "foundry-turret" ? { ...enemy.foundryTurretTarget } : undefined,
      warpPhase: enemy.type === "warp-flanker" ? enemy.warpPhase : undefined,
      warpTarget: enemy.type === "warp-flanker" && enemy.warpPhase === "warp-windup"
        ? { ...enemy.warpTarget }
        : undefined,
      ripperPhase: enemy.type === "ripper" ? enemy.ripperPhase : undefined,
      ripperDirection: enemy.type === "ripper" ? { ...enemy.ripperDirection } : undefined,
      razorScuttlerPhase: enemy.type === "razor-scuttler" ? enemy.razorScuttlerPhase : undefined,
      razorScuttlerDirection: enemy.type === "razor-scuttler" ? { ...enemy.razorScuttlerDirection } : undefined,
      quillbackPhase: enemy.type === "quillback" ? enemy.quillbackPhase : undefined,
      quillbackDirection: enemy.type === "quillback" ? { ...enemy.quillbackDirection } : undefined,
      quillbackShotCount: enemy.type === "quillback" ? enemy.quillbackShotCount : undefined,
      spinewheelPhase: enemy.type === "spinewheel" ? enemy.spinewheelPhase : undefined,
      spinewheelDirection: enemy.type === "spinewheel" ? { ...enemy.spinewheelDirection } : undefined,
      spinewheelSpeedMetresPerSecond: enemy.type === "spinewheel"
        ? enemy.spinewheelSpeedMetresPerSecond
        : undefined,
      spinewheelBouncesRemaining: enemy.type === "spinewheel"
        ? enemy.spinewheelBouncesRemaining
        : undefined,
      tetherBloomPhase: enemy.type === "tether-bloom" ? enemy.tetherBloomPhase : undefined,
      tetherBloomTarget: enemy.type === "tether-bloom" ? { ...enemy.tetherBloomTarget } : undefined,
      tetherBloomBreakDamage: enemy.type === "tether-bloom"
        ? enemy.tetherBloomDamageDuringGrab
        : undefined,
      aurumPhase: enemy.type === "aurum-hoarder" ? enemy.aurumPhase : undefined,
      aurumExitTarget: enemy.type === "aurum-hoarder" ? { ...enemy.aurumExitTarget } : undefined,
      aurumEscapeRemainingSeconds: enemy.type === "aurum-hoarder" && enemy.aurumPhase === "flee"
        ? Math.max(0, enemy.aurumPhaseRemainingSeconds)
        : undefined,
      aurumArmourBreaksPaid: enemy.type === "aurum-hoarder" ? enemy.aurumArmourBreaksPaid : undefined,
      bastionEaterPhase: enemy.type === "bastion-eater" ? enemy.bastionEaterPhase : undefined,
      bastionEaterAction: enemy.type === "bastion-eater" ? enemy.bastionEaterAction : undefined,
      bastionEaterDirection: enemy.type === "bastion-eater" ? { ...enemy.bastionEaterDirection } : undefined,
      bastionEaterTarget: enemy.type === "bastion-eater" ? { ...enemy.bastionEaterTarget } : undefined,
      bastionEaterNodeExposed: enemy.type === "bastion-eater" ? enemy.bastionEaterAction === "recovery" : undefined,
      rank: enemy.rank,
      threatClass: enemyThreatClass(enemy),
      recentDamageRemainingSeconds: enemy.recentDamageRemainingSeconds,
      hasActiveStatus: Object.values(enemy.statusTimers).some((remaining) => (remaining ?? 0) > 0),
      majorAttackWindup: enemyMajorAttackWindup(enemy),
      eliteKind: enemy.eliteKind,
      carapacePhase: enemy.eliteKind === "carapace-scuttler" ? enemy.carapacePhase : undefined,
      miniBossKind: enemy.miniBossKind,
      siegeCrusherPhase: enemy.miniBossKind === "siege-crusher" ? enemy.siegeCrusherPhase : undefined,
      siegeCrusherDirection: enemy.miniBossKind === "siege-crusher"
        ? { ...enemy.siegeCrusherDirection }
        : undefined,
      broodWardenPhase: enemy.miniBossKind === "brood-warden" ? enemy.broodWardenPhase : undefined,
      broodWardenDirection: enemy.miniBossKind === "brood-warden"
        ? { ...enemy.broodWardenDirection }
        : undefined,
      riftStalkerPhase: enemy.miniBossKind === "rift-stalker" ? enemy.riftStalkerPhase : undefined,
      riftStalkerMarkTarget: enemy.miniBossKind === "rift-stalker"
        ? { ...enemy.riftStalkerMarkTarget }
        : undefined,
      riftStalkerDirection: enemy.miniBossKind === "rift-stalker"
        ? { ...enemy.riftStalkerDirection }
        : undefined,
      synapseHeraldPhase: enemy.miniBossKind === "synapse-herald"
        ? enemy.synapseHeraldBehavior.phase
        : undefined,
      synapseHeraldMove: enemy.miniBossKind === "synapse-herald"
        ? enemy.synapseHeraldBehavior.move ?? undefined
        : undefined,
      synapseHeraldTargets: enemy.miniBossKind === "synapse-herald"
        ? (enemy.synapseHeraldBehavior.move === "lunge-chain"
            ? enemy.synapseHeraldBehavior.lungeTargets.map((target) => ({ ...target }))
            : enemy.synapseHeraldBehavior.markedZones.map((zone) => ({ ...zone })))
        : undefined,
      synapseHeraldLinkTargetId: enemy.miniBossKind === "synapse-herald"
        ? enemy.synapseHeraldBehavior.linkTargetId ?? undefined
        : undefined,
      assemblyPrimePhase: enemy.miniBossKind === "assembly-prime"
        ? enemy.assemblyPrimeBehavior.phase
        : undefined,
      assemblyPrimeMove: enemy.miniBossKind === "assembly-prime"
        ? enemy.assemblyPrimeBehavior.move ?? undefined
        : undefined,
      assemblyPrimeProgress: enemy.miniBossKind === "assembly-prime"
        && enemy.assemblyPrimeBehavior.move === "fabrication"
        && enemy.assemblyPrimeBehavior.phase === "windup"
        ? Math.max(0, Math.min(1, 1 - enemy.assemblyPrimeBehavior.phaseRemainingSeconds / 1.6))
        : undefined,
      assemblyPrimeLanes: enemy.miniBossKind === "assembly-prime"
        ? enemy.assemblyPrimeBehavior.lockedLanes.map((lane) => ({
            origin: { ...lane.origin }, direction: { ...lane.direction },
          }))
        : undefined,
      assemblyPrimeTarget: enemy.miniBossKind === "assembly-prime"
        ? enemy.assemblyPrimeBehavior.fabricationTarget ?? undefined
        : undefined,
      assemblyPrimeRecallTargetId: enemy.miniBossKind === "assembly-prime"
        ? enemy.assemblyPrimeBehavior.recallTargetId ?? undefined
        : undefined,
      stormRegentPhase: enemy.miniBossKind === "storm-regent"
        ? enemy.stormRegentBehavior.phase
        : undefined,
      stormRegentMove: enemy.miniBossKind === "storm-regent"
        ? enemy.stormRegentBehavior.move ?? undefined
        : undefined,
      stormRegentSegments: enemy.miniBossKind === "storm-regent"
        ? enemy.stormRegentBehavior.lockedChain?.segments.map((segment) => ({
            ...segment, from: { ...segment.from }, to: { ...segment.to },
          }))
        : undefined,
      stormRegentCentre: enemy.miniBossKind === "storm-regent"
        ? (enemy.stormRegentBehavior.coilCentre
            ?? enemy.stormRegentBehavior.nodes.find((node) => (
              node.id === enemy.stormRegentBehavior.overchargeNodeId
            ))?.position)
        : undefined,
      stormRegentRadiusMetres: enemy.miniBossKind === "storm-regent"
        ? (enemy.stormRegentBehavior.move === "coil-burst"
            ? STORM_REGENT_COIL_RADIUS_METRES
            : enemy.stormRegentBehavior.move === "node-overcharge"
              ? STORM_REGENT_NODE_OVERCHARGE_RADIUS_METRES : undefined)
        : undefined,
      stormRegentNodeId: enemy.miniBossKind === "storm-regent"
        ? enemy.stormRegentBehavior.overchargeNodeId ?? undefined
        : undefined,
      abominationPrimePhase: enemy.miniBossKind === "abomination-prime"
        ? enemy.abominationPrimeBehavior.phase
        : undefined,
      abominationPrimeMove: enemy.miniBossKind === "abomination-prime"
        ? enemy.abominationPrimeBehavior.move ?? undefined
        : undefined,
      abominationPrimeTarget: enemy.miniBossKind === "abomination-prime"
        ? enemy.abominationPrimeBehavior.lockedTarget ?? undefined
        : undefined,
      abominationPrimeHazard: enemy.miniBossKind === "abomination-prime"
        ? enemy.abominationPrimeBehavior.hazard
        : undefined,
      abominationPrimeGrabDamage: enemy.miniBossKind === "abomination-prime"
        ? enemy.abominationPrimeBehavior.grabDamageTaken
        : undefined,
      facingDirection: { ...enemy.facingDirection },
      statuses: this.activeStatuses(enemy),
      statusBuildup: { ...enemy.statusBuildup },
      steeringProfile: definition.steeringProfile,
    };
  }

  private nextEdgeSpawn(radius: number): Vector2Data {
    const side = Math.floor(this.random() * 4);
    const x = radius + this.random() * (this.widthMetres - radius * 2);
    const y = radius + this.random() * (this.heightMetres - radius * 2);

    switch (side) {
      case 0:
        return { x, y: radius };
      case 1:
        return { x: this.widthMetres - radius, y };
      case 2:
        return { x, y: this.heightMetres - radius };
      default:
        return { x: radius, y };
    }
  }

  private activeObstacles(): ArenaDefinition["obstacles"] {
    return this.arena.obstacles.filter((obstacle) => (
      this.obstacleHealth.get(obstacle.id) ?? obstacleMaxDurability(obstacle)
    ) > 0);
  }

  private collisionArena(): ArenaDefinition {
    return { ...this.arena, obstacles: this.activeObstacles() };
  }

  private nextId(): number {
    const id = this.nextEntityId;
    this.nextEntityId += 1;
    return id;
  }

  private random(): number {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 0x100000000;
  }
}

function enemyThreatClass(enemy: EnemyState): EnemyThreatClass {
  if (enemy.rank === "boss") return "boss";
  if (enemy.rank === "mini-boss") return "mini-boss";
  if (enemy.rank === "elite") return "elite";
  const steeringProfile = ENEMY_CATALOG[enemy.type].steeringProfile;
  return steeringProfile === "supportAnchor" || steeringProfile === "standoffShooter"
    ? "specialist"
    : "standard";
}

function enemyMajorAttackWindup(enemy: EnemyState): boolean {
  const topLevelPhases = Object.values(enemy).some((value) => (
    typeof value === "string" && value.includes("windup")
  ));
  const nestedPhases = [
    enemy.abominationBehavior.phase,
    enemy.synapseHeraldBehavior.phase,
    enemy.assemblyPrimeBehavior.phase,
    enemy.stormRegentBehavior.phase,
    enemy.abominationPrimeBehavior.phase,
    enemy.abominationPrimeBehavior.move,
  ];
  return topLevelPhases || nestedPhases.some((phase) => typeof phase === "string" && phase.includes("windup"));
}

function distance(left: Vector2Data, right: Vector2Data): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function segmentHitsArenaObstacle(
  from: Vector2Data,
  to: Vector2Data,
  obstacles: readonly ArenaObstacle[],
): boolean {
  return obstacles.some((obstacle) => segmentIntersectsRectangle(from, to, obstacle));
}

function segmentIntersectsRectangle(
  from: Vector2Data,
  to: Vector2Data,
  obstacle: ArenaObstacle,
): boolean {
  const delta = { x: to.x - from.x, y: to.y - from.y };
  let minimum = 0;
  let maximum = 1;
  for (const [origin, direction, low, high] of [
    [from.x, delta.x, obstacle.x, obstacle.x + obstacle.width],
    [from.y, delta.y, obstacle.y, obstacle.y + obstacle.height],
  ] as const) {
    if (Math.abs(direction) < 1e-9) {
      if (origin < low || origin > high) return false;
      continue;
    }
    const first = (low - origin) / direction;
    const second = (high - origin) / direction;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
    if (minimum > maximum) return false;
  }
  return true;
}

export function selectMiniBossForRoll(roll: number): MiniBossKind {
  const index = Math.min(Math.floor(clamp(roll, 0, 0.999999) * MINI_BOSS_POOL.length), MINI_BOSS_POOL.length - 1);
  return MINI_BOSS_POOL[index]!;
}

/**
 * Gives mini-boss setup movement a readable orbit instead of another direct
 * pursuit line. Far bosses close the gap, crowded bosses peel away, and the
 * tangent component keeps them traversing the arena between locked attacks.
 */
export function pointInsideRipperSweep(
  origin: Vector2Data,
  direction: Vector2Data,
  point: Vector2Data,
  reachMetres: number,
  halfAngleRadians = Math.PI * 0.32,
): boolean {
  return pointInsideWeaponArc(origin, direction, point, reachMetres, halfAngleRadians);
}

/**
 * Even offsets first, then odd, covering the whole rotation exactly once. Keeps
 * the original "spread by two" feel — consecutive offers are not adjacent in
 * the order — while guaranteeing every upgrade is reachable from any start.
 */
export function upgradeScanOffsets(length: number): readonly number[] {
  const evens: number[] = [];
  const odds: number[] = [];
  for (let offset = 0; offset < Math.max(0, length); offset += 1) {
    (offset % 2 === 0 ? evens : odds).push(offset);
  }
  return [...evens, ...odds];
}

/** Compile-time proof that every UpgradeId has an effect in `applyUpgrade`. */
function assertUpgradeHandled(upgradeId: never): never {
  throw new Error(`Upgrade has no effect wired: ${String(upgradeId)}`);
}

export function quillbackVolleyCount(attackCount: number): 1 | 3 | 5 {
  if (attackCount <= 0) return 1;
  if (attackCount === 1) return 3;
  return 5;
}

export function createQuillbackFanDirections(
  direction: Vector2Data,
  count: 1 | 3 | 5,
  totalArcRadians = Math.PI * 64 / 180,
): readonly Vector2Data[] {
  const facing = normalizeVector(direction);
  const centreAngle = Math.atan2(facing.y, facing.x);
  if (count === 1) return [facing];
  return Array.from({ length: count }, (_, index) => {
    const offset = -totalArcRadians / 2 + totalArcRadians * index / (count - 1);
    const angle = centreAngle + offset;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
}

function distanceToSegment(point: Vector2Data, from: Vector2Data, to: Vector2Data): number {
  const segmentX = to.x - from.x;
  const segmentY = to.y - from.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared === 0) {
    return distance(point, from);
  }
  const t = Math.min(Math.max(
    ((point.x - from.x) * segmentX + (point.y - from.y) * segmentY) / lengthSquared,
    0,
  ), 1);
  return distance(point, { x: from.x + segmentX * t, y: from.y + segmentY * t });
}

/**
 * `size` entries starting at `offset`, wrapping around. Deterministic and
 * RNG-free — the caller advances `offset` with something that already varies
 * (the wave index), so successive visits show different stock without touching
 * the replay-digest-bearing random stream.
 */
/**
 * Furnishes a room with themed world objects (26 July 2026).
 *
 * Quick Drop and every pure harness keep the hand-authored Bastion yard exactly
 * as it was — no regression to the default experience, and existing fixtures and
 * digests are untouched. An **expedition encounter** furnishes from its node's
 * theme and seed instead, because that is where room variety was always meant to
 * live and where a bastion barricade standing in an alien hive reads as a bug.
 *
 * The fence survives furnishing: it is the signature battlefield interaction and
 * its switch is a fixed anchor, so it is kept and its geometry declared
 * off-limits to placement.
 */
function obstacleCentre(obstacle: ArenaObstacle): Vector2Data {
  return { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 };
}

/** Prompt wording for the HUD. Kept beside the effects so they stay in step. */
function interactionPromptVerb(effect: InteractionEffect): string {
  switch (effect.type) {
    case "open-loot": return "OPEN";
    case "open-gate": return "OPEN GATE";
    case "harvest-scrap": return "HARVEST";
    case "disrupt-spawner": return "DISRUPT";
    case "activate-stargate": return "ACTIVATE";
    case "toggle-system": return "TOGGLE";
    case "release-cryo": return "RELEASE";
    case "upgrade-weapon": return "UPGRADE";
  }
}

function furnishArena(base: ArenaDefinition, options: CombatSimulationOptions): ArenaDefinition {
  const theme = options.worldObjectTheme ?? options.expeditionEncounter?.themeId;
  if (!theme) return base;

  const widthMetres = options.widthMetres ?? base.widthMetres;
  const heightMetres = options.heightMetres ?? base.heightMetres;
  const keepClear = [
    { x: widthMetres / 2, y: heightMetres / 2, radiusMetres: SPAWN_CLEARANCE_METRES },
  ];
  if (base.fence) {
    keepClear.push(
      { x: base.fence.switchPosition.x, y: base.fence.switchPosition.y, radiusMetres: 2 },
      { x: base.fence.from.x, y: base.fence.from.y, radiusMetres: 2 },
      { x: base.fence.to.x, y: base.fence.to.y, radiusMetres: 2 },
    );
  }

  const placement = placeWorldObjects({
    theme,
    widthMetres,
    heightMetres,
    // Derived from the encounter seed rather than equal to it, so a room's
    // furniture and its wave rolls are not the same number.
    seed: (options.expeditionEncounter?.seed ?? options.seed ?? 0) ^ 0x9e3779b9,
    keepClear,
  });
  return {
    ...base,
    obstacles: placement.obstacles,
    hazards: placement.hazards,
  };
}

export function rotatingWindow<T>(entries: readonly T[], size: number, offset: number): readonly T[] {
  if (entries.length === 0 || size <= 0) return [];
  if (entries.length <= size) return entries;
  const start = ((offset % entries.length) + entries.length) % entries.length;
  const window: T[] = [];
  for (let step = 0; step < size; step += 1) {
    window.push(entries[(start + step) % entries.length]!);
  }
  return window;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function titleCase(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

function playerDefeatCause(source: PlayerDamageSource): string {
  switch (source) {
    case "contact": return "Overrun by enemy contact";
    case "projectile": return "Struck by an enemy projectile";
    case "explosive": return "Caught in an explosion";
    case "hazard": return "Consumed by an arena hazard";
    default: return "Felled by an enemy attack";
  }
}

function placementTargetId(target: WeaponPlacementTarget): string {
  if (target.kind === "merge") {
    return target.slotId ? `place:merge:rack:${target.slotId}` : `place:merge:inventory:${target.inventoryIndex}`;
  }
  return target.kind === "discard" ? "place:discard" : target.kind === "rack"
    ? `place:rack:${target.slotId}` : `place:inventory:${target.slotIndex}`;
}

function parsePlacementTarget(id: string): WeaponPlacementTarget | null {
  if (id === "place:discard") return { kind: "discard" };
  const [, action, area, value] = id.split(":");
  if (action === "rack" && area) return { kind: "rack", slotId: area };
  if (action === "inventory" && area !== undefined && Number.isInteger(Number(area))) {
    return { kind: "inventory", slotIndex: Number(area) };
  }
  if (action === "merge" && area === "rack" && value) return { kind: "merge", slotId: value, inventoryIndex: null };
  if (action === "merge" && area === "inventory" && value !== undefined) return { kind: "merge", slotId: null, inventoryIndex: Number(value) };
  return null;
}
