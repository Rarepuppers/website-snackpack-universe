import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import { HeroMotionController } from "../hero/HeroMotionController";
import { MARINE } from "../hero/marine";
import { ENEMY_CATALOG, type EnemyType } from "../content/enemyCatalog";
import {
  BASTION_SERVICE_RIFLE,
  WEAPON_CATALOG,
  VERTICAL_SLICE_WEAPON_IDS,
  type WeaponId,
  type WeaponRuntimeStats,
} from "../content/weaponCatalog";
import {
  clampWeaponCount,
  createServiceRifleLoadout,
  createWeaponLoadout,
  MAX_EQUIPPED_WEAPONS,
  type EquippedWeapon,
} from "../equipment/WeaponLoadout";
import { calculateWeaponRingLayout } from "../equipment/WeaponRingLayout";
import {
  UPGRADE_CATALOG,
  UPGRADE_ORDER,
  type UpgradeDefinition,
  type UpgradeId,
} from "../content/upgradeCatalog";
import {
  BASTION_ARENA,
  pointHitsObstacle,
  resolveCircleMovement,
  type ArenaDefinition,
  type ArenaObstacle,
} from "../arena/ArenaDefinition";
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
import { stepSpinewheelReflection } from "./SpinewheelPhysics";

export type EncounterStatus = "combat" | "intermission" | "victory" | "defeat";
export type BrainPhase = "drift" | "windup" | "lunge" | "recover";
export type SlimeSpitterPhase = "positioning" | "windup" | "recover";
export type BlastMitePhase = "chase" | "armed";
export type WarpFlankerPhase = "stalk" | "warp-windup" | "materialize";
export type RipperPhase = "pursuit" | "windup" | "sweep" | "recovery";
export type RazorScuttlerPhase = "pursuit" | "windup" | "dash" | "recovery";
export type QuillbackPhase = "positioning" | "windup" | "recover";
export type SpinewheelPhase = "positioning" | "windup" | "rolling" | "recovery";
export type TetherBloomPhase = "idle" | "windup" | "tethering" | "recovery";
export type BastionEaterPhase = "breach" | "brood" | "last-stand";
export type BastionEaterAction =
  | "entrance" | "stalk" | "claw-windup" | "claw" | "charge-windup" | "charge"
  | "tendril-windup" | "tendril" | "egg-windup" | "eggs"
  | "breach-windup" | "breach" | "recovery";
export type EnemyRank = "standard" | "elite" | "mini-boss" | "boss";
export type EliteKind = "carapace-scuttler";
export type CarapacePhase = "pursuit" | "windup" | "charge" | "recovery";
export type MiniBossKind = "siege-crusher" | "brood-warden";
export type SiegeCrusherPhase =
  | "entrance" | "stalk" | "charge-windup" | "charge"
  | "sweep-windup" | "sweep" | "slam-windup" | "slam" | "recovery";
export type BroodWardenPhase =
  | "entrance" | "stalk" | "cleave-windup" | "cleave"
  | "acid-windup" | "acid-volley" | "egg-windup" | "egg-lay"
  | "rush-windup" | "swarm-rush" | "recovery";
export type CombatScenario = "slime-spitter" | "carapace-elite" | "siege-crusher" | "brood-warden" | "ripper" | "razor-scuttler" | "quillback" | "spinewheel" | "tether-bloom" | "bastion-eater";
export type PowerupType = "overcharge" | "aegis" | "adrenaline" | "magnet-pulse";
export type DecisionKind = "upgrade" | "weapon-chest" | "supply-depot";

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
}

export interface PendingDecision {
  kind: DecisionKind;
  title: string;
  options: readonly DecisionOption[];
}

export type CombatEvent =
  | {
    type: "weapon-fired";
    weaponInstanceId: number;
    weaponId: WeaponId;
    position: Vector2Data;
    direction: Vector2Data;
  }
  | { type: "enemy-hit"; position: Vector2Data }
  | { type: "enemy-defeated"; position: Vector2Data; enemyType: EnemyType }
  | { type: "explosion"; position: Vector2Data; radiusMetres: number }
  | { type: "player-hit"; position: Vector2Data; damage: number }
  | { type: "xp-collected"; position: Vector2Data; value: number }
  | { type: "level-up"; level: number }
  | { type: "enemy-spawned"; position: Vector2Data; enemyType: EnemyType }
  | { type: "egg-hatched"; position: Vector2Data }
  | { type: "projectile-blocked"; position: Vector2Data }
  | { type: "chain-arc"; from: Vector2Data; to: Vector2Data; weaponId: WeaponId }
  | { type: "slime-spit-windup"; position: Vector2Data; target: Vector2Data }
  | { type: "slime-glob-fired"; position: Vector2Data; target: Vector2Data }
  | { type: "slime-impact"; position: Vector2Data; createdPuddle: boolean }
  | { type: "elite-armour-hit"; position: Vector2Data; eliteKind: EliteKind }
  | { type: "elite-reward-dropped"; position: Vector2Data; eliteKind: EliteKind }
  | { type: "elite-reward-collected"; position: Vector2Data }
  | { type: "mini-boss-sweep"; position: Vector2Data; radiusMetres: number }
  | { type: "mini-boss-shockwave"; position: Vector2Data; radiusMetres: number }
  | { type: "brood-cleave"; position: Vector2Data; radiusMetres: number }
  | { type: "brood-acid-volley"; position: Vector2Data; target: Vector2Data; count: number }
  | { type: "brood-acid-impact"; position: Vector2Data }
  | { type: "brood-eggs-laid"; position: Vector2Data; count: number }
  | { type: "brood-swarm-rush"; position: Vector2Data; count: number }
  | { type: "obstacle-damaged"; obstacleId: string; position: Vector2Data }
  | { type: "obstacle-destroyed"; obstacleId: string; position: Vector2Data }
  | { type: "mini-boss-reward-dropped"; position: Vector2Data; miniBossKind: MiniBossKind }
  | { type: "status-applied"; position: Vector2Data; status: StatusEffectType }
  | { type: "powerup-collected"; position: Vector2Data; powerupType: PowerupType }
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
  | { type: "bastion-eater-phase"; position: Vector2Data; phase: BastionEaterPhase }
  | { type: "bastion-eater-claw-warning"; position: Vector2Data; direction: Vector2Data }
  | { type: "bastion-eater-claw-strike"; position: Vector2Data; direction: Vector2Data }
  | { type: "bastion-eater-charge"; position: Vector2Data; direction: Vector2Data }
  | { type: "bastion-eater-tendril"; position: Vector2Data; radiusMetres: number; warning: boolean }
  | { type: "bastion-eater-eggs"; position: Vector2Data; count: number }
  | { type: "bastion-eater-breach"; position: Vector2Data; radiusMetres: number; warning: boolean }
  | { type: "bastion-eater-vault"; position: Vector2Data }
  | { type: "ultimate-fired"; position: Vector2Data }
  | { type: "fence-activated"; from: Vector2Data; to: Vector2Data };

export interface EnemySnapshot {
  id: number;
  type: EnemyType;
  position: Vector2Data;
  health: number;
  maxHealth: number;
  radiusMetres: number;
  hatchProgress: number;
  brainPhase?: BrainPhase;
  spitterPhase?: SlimeSpitterPhase;
  spitterTarget?: Vector2Data;
  mitePhase?: BlastMitePhase;
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
  bastionEaterPhase?: BastionEaterPhase;
  bastionEaterAction?: BastionEaterAction;
  bastionEaterDirection?: Vector2Data;
  bastionEaterTarget?: Vector2Data;
  bastionEaterNodeExposed?: boolean;
  rank: EnemyRank;
  eliteKind?: EliteKind;
  carapacePhase?: CarapacePhase;
  miniBossKind?: MiniBossKind;
  siegeCrusherPhase?: SiegeCrusherPhase;
  siegeCrusherDirection?: Vector2Data;
  broodWardenPhase?: BroodWardenPhase;
  broodWardenDirection?: Vector2Data;
  facingDirection: Vector2Data;
  statuses: readonly StatusEffectType[];
}

export interface ProjectileSnapshot {
  id: number;
  weaponId: WeaponId;
  position: Vector2Data;
  rotationRadians: number;
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

export interface ActiveBuffSnapshot {
  type: PowerupType;
  remainingSeconds: number;
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
  type: "slime-glob" | "brood-acid" | "quill-spike";
  position: Vector2Data;
  rotationRadians: number;
}

export interface GroundHazardSnapshot {
  id: number;
  type: "slowing-slime";
  position: Vector2Data;
  radiusMetres: number;
  remainingSeconds: number;
  durationSeconds: number;
}

export interface EliteRewardSnapshot {
  id: number;
  type: "elite-upgrade-cache" | "mini-boss-arsenal-cache";
  position: Vector2Data;
}

export interface CombatSnapshot {
  status: EncounterStatus;
  waveNumber: number;
  totalWaves: number;
  playerPosition: Vector2Data;
  playerHealth: number;
  playerMaxHealth: number;
  playerShield: number;
  playerMaxShield: number;
  playerInvulnerable: boolean;
  playerEntrenched: boolean;
  evasiveReady: boolean;
  evasiveCooldownRemainingSeconds: number;
  ultimateReady: boolean;
  ultimateCooldownRemainingSeconds: number;
  fence: FenceSnapshot | null;
  heroState: string;
  level: number;
  experience: number;
  experienceForNextLevel: number;
  pendingUpgradeChoices: readonly UpgradeDefinition[];
  pendingDecision: PendingDecision | null;
  enemies: readonly EnemySnapshot[];
  projectiles: readonly ProjectileSnapshot[];
  enemyProjectiles: readonly EnemyProjectileSnapshot[];
  groundHazards: readonly GroundHazardSnapshot[];
  eliteRewards: readonly EliteRewardSnapshot[];
  pickups: readonly ExperiencePickupSnapshot[];
  powerups: readonly PowerupPickupSnapshot[];
  activeBuffs: readonly ActiveBuffSnapshot[];
  weapon: Readonly<WeaponRuntimeStats>;
  equippedWeapons: readonly Readonly<EquippedWeapon>[];
  events: readonly CombatEvent[];
  arena: Readonly<ArenaDefinition>;
  stressProfile: 4 | 12 | null;
  scenario: CombatScenario | null;
  playerSlowed: boolean;
  damagedObstacleIds: readonly string[];
  destroyedObstacleIds: readonly string[];
  playerTethered: boolean;
  activeTetherEnemyId: number | null;
}

interface EnemyState {
  id: number;
  type: EnemyType;
  position: Vector2Data;
  health: number;
  attackCooldownSeconds: number;
  dead: boolean;
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
  bastionEaterPhase: BastionEaterPhase;
  bastionEaterAction: BastionEaterAction;
  bastionEaterActionRemainingSeconds: number;
  bastionEaterDirection: Vector2Data;
  bastionEaterTarget: Vector2Data;
  bastionEaterAttackCount: number;
  rank: EnemyRank;
  eliteKind?: EliteKind;
  carapacePhase: CarapacePhase;
  carapacePhaseRemainingSeconds: number;
  facingDirection: Vector2Data;
  maxHealth: number;
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
  remainingSeconds: number;
  pierceRemaining: number;
  explosionRadiusMetres: number;
  knockbackMetres: number;
  chainRemaining: number;
  chainRadiusMetres: number;
  hitEnemyIds: Set<number>;
  dead: boolean;
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

interface EnemyProjectileState {
  id: number;
  type: "slime-glob" | "brood-acid" | "quill-spike";
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
  type: "slowing-slime";
  position: Vector2Data;
  radiusMetres: number;
  remainingSeconds: number;
  durationSeconds: number;
}

interface EliteRewardState {
  id: number;
  type: "elite-upgrade-cache" | "mini-boss-arsenal-cache";
  position: Vector2Data;
  collected: boolean;
}

interface SpawnPlan {
  atSeconds: number;
  type: EnemyType;
  rank?: "elite" | "mini-boss";
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
}

interface EquippedWeaponState extends EquippedWeapon {
  cooldownSeconds: number;
}

const TOTAL_WAVES = 5;
const PLAYER_MAX_HEALTH = 100;
const PLAYER_RADIUS_METRES = 0.55;
const INTERMISSION_SECONDS = 2;
const MAX_SLOWING_PUDDLES = 5;
const SLOWING_PUDDLE_DURATION_SECONDS = 4;
const SLOWING_PUDDLE_RADIUS_METRES = 1.25;
const SLIME_MOVEMENT_MULTIPLIER = 0.55;
const SLIME_GLOB_DAMAGE = 8;
const QUILLBACK_SPIKE_DAMAGE = 7;
const QUILLBACK_PROJECTILE_SPEED = 7.5;
const QUILLBACK_PROJECTILE_RANGE_METRES = 11;
const QUILLBACK_FAN_ARC_RADIANS = Math.PI * 64 / 180;
export const RAZOR_SCUTTLER_WINDUP_SECONDS = 0.48;
export const RAZOR_SCUTTLER_DASH_SPEED = 9.5;
export const RAZOR_SCUTTLER_DASH_SECONDS = 0.55;
export const RAZOR_SCUTTLER_RECOVERY_SECONDS = 1.15;
const RAZOR_SCUTTLER_DASH_DAMAGE = 15;
const RAZOR_SCUTTLER_MIN_DASH_RANGE = 2.6;
const RAZOR_SCUTTLER_MAX_DASH_RANGE = 7.5;
export const SPINEWHEEL_BASE_ROLL_SPEED = 7;
export const SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER = 0.85;
export const SPINEWHEEL_MAX_REBOUNDS = 2;
export const SPINEWHEEL_REPEAT_HIT_LOCKOUT_SECONDS = 0.75;
const SPINEWHEEL_ROLL_DAMAGE = 14;
const SPINEWHEEL_WINDUP_SECONDS = 0.7;
const SPINEWHEEL_MAX_ROLL_SECONDS = 3.2;
const SPINEWHEEL_RECOVERY_SECONDS = 1.5;
export const TETHER_BLOOM_ACQUISITION_RANGE_METRES = 3.5;
export const TETHER_BLOOM_HARD_RANGE_METRES = 5;
export const TETHER_BLOOM_BREAK_DAMAGE = 28;
const TETHER_BLOOM_WINDUP_SECONDS = 0.7;
const TETHER_BLOOM_DURATION_SECONDS = 1.8;
const TETHER_BLOOM_PULL_SPEED_METRES_PER_SECOND = 1.15;
const TETHER_BLOOM_RECOVERY_SECONDS = 3.2;
const POWERUP_LIFETIME_SECONDS = 12;
const POWERUP_COLLECT_RADIUS_METRES = 0.7;
const OVERCHARGE_ATTACK_SPEED_MULTIPLIER = 1.6;
const ADRENALINE_MOVE_MULTIPLIER = 1.35;
const MAGNET_PULSE_MULTIPLIER = 2.5;
const AEGIS_SHIELD_AMOUNT = 25;
const BLAST_MITE_EXPLOSION_RADIUS_METRES = 1.6;
const BLAST_MITE_EXPLOSION_DAMAGE = 16;
const SUPPLY_DEPOT_HEAL = 45;
const FENCE_ACTIVE_SECONDS = 6;
const FENCE_COOLDOWN_SECONDS = 18;
const FENCE_DAMAGE_PER_SECOND = 22;
const FENCE_CONTACT_RANGE_METRES = 0.6;
const FENCE_SWITCH_RANGE_METRES = 1.4;
const ULTIMATE_PROJECTILE_SPEED = 12;
const ULTIMATE_PROJECTILE_LIFETIME_SECONDS = 0.9;
export const MINI_BOSS_POOL: readonly MiniBossKind[] = Object.freeze(["siege-crusher", "brood-warden"]);

const POWERUP_DURATION_SECONDS: Readonly<Record<PowerupType, number>> = Object.freeze({
  overcharge: 6,
  aegis: 0,
  adrenaline: 5,
  "magnet-pulse": 6,
});

const POWERUP_WAVE_CYCLE: readonly PowerupType[] = Object.freeze([
  "overcharge", "magnet-pulse", "adrenaline", "aegis",
]);

export class CombatSimulation {
  readonly widthMetres: number;
  readonly heightMetres: number;
  readonly arena: Readonly<ArenaDefinition>;

  private readonly heroMotion = new HeroMotionController(MARINE);
  private defence = { ...MARINE.defence };
  private moveSpeedMultiplier = 1;
  private stationarySeconds = 0;
  private ultimateCooldownRemainingSeconds = 0;
  private fenceActiveRemainingSeconds = 0;
  private fenceCooldownRemainingSeconds = 0;
  private playerPosition: Vector2Data;
  private playerHealth = PLAYER_MAX_HEALTH;
  private playerShield = MARINE.defence.maxShield;
  private shieldRechargeCooldownSeconds = 0;
  private playerInvulnerable = false;
  private heroState = "idle";
  private playerHurtCooldownSeconds = 0;
  private evasiveReady = true;
  private evasiveCooldownRemainingSeconds = 0;
  private readonly equippedWeapons: EquippedWeaponState[];
  private magnetMultiplier = 1;
  private lastAimDirection: Vector2Data = { x: 1, y: 0 };
  private enemies: EnemyState[] = [];
  private projectiles: ProjectileState[] = [];
  private enemyProjectiles: EnemyProjectileState[] = [];
  private groundHazards: GroundHazardState[] = [];
  private eliteRewards: EliteRewardState[] = [];
  private powerups: PowerupPickupState[] = [];
  private readonly activeBuffs = new Map<PowerupType, number>();
  private readonly obstacleDamage = new Map<string, number>();
  private pickups: ExperiencePickupState[] = [];
  private nextEntityId = 1;
  private status: EncounterStatus = "combat";
  private waveIndex = 0;
  private waveElapsedSeconds = 0;
  private intermissionRemainingSeconds = 0;
  private spawnQueue: SpawnPlan[] = [];
  private level = 1;
  private experience = 0;
  private decisionQueue: PendingDecision[] = [];
  private randomState: number;
  private readonly wavesEnabled: boolean;
  private frameEvents: CombatEvent[] = [];
  private readonly stressProfile: 4 | 12 | null;
  private readonly scenario: CombatScenario | null;
  private activeTetherEnemyId: number | null = null;

  constructor(options: CombatSimulationOptions = {}) {
    this.arena = options.arena ?? BASTION_ARENA;
    this.widthMetres = options.widthMetres ?? this.arena.widthMetres;
    this.heightMetres = options.heightMetres ?? this.arena.heightMetres;
    this.playerPosition = {
      x: this.widthMetres / 2,
      y: this.heightMetres / 2,
    };
    this.randomState = options.seed ?? 0x5a17b45;
    this.stressProfile = options.stressProfile ?? null;
    this.scenario = options.scenario ?? null;
    this.wavesEnabled = options.autoStartWaves !== false
      && this.stressProfile === null
      && this.scenario === null;
    const initialLoadout = options.startingWeaponIds
      ? createWeaponLoadout(options.startingWeaponIds)
      : createServiceRifleLoadout(clampWeaponCount(options.startingWeaponCount ?? 1));
    this.equippedWeapons = initialLoadout.map((weapon) => ({ ...weapon, cooldownSeconds: 0 }));

    if (this.stressProfile !== null) {
      this.populateStressScenario(this.stressProfile);
    } else if (this.scenario === "slime-spitter") {
      this.populateSlimeSpitterScenario();
    } else if (this.scenario === "carapace-elite") {
      this.populateCarapaceEliteScenario();
    } else if (this.scenario === "siege-crusher") {
      this.populateSiegeCrusherScenario();
    } else if (this.scenario === "brood-warden") {
      this.populateBroodWardenScenario();
    } else if (this.scenario === "ripper") {
      this.populateRipperScenario();
    } else if (this.scenario === "razor-scuttler") {
      this.populateRazorScuttlerScenario();
    } else if (this.scenario === "quillback") {
      this.populateQuillbackScenario();
    } else if (this.scenario === "spinewheel") {
      this.populateSpinewheelScenario();
    } else if (this.scenario === "tether-bloom") {
      this.populateTetherBloomScenario();
    } else if (this.scenario === "bastion-eater") {
      this.populateBastionEaterScenario();
    } else if (this.wavesEnabled) {
      this.beginWave(0);
    }
  }

  step(intent: PlayerIntent, deltaSeconds: number): CombatSnapshot {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.05);
    this.frameEvents = [];

    if (this.status === "defeat" || this.status === "victory" || this.decisionQueue.length > 0) {
      return this.snapshot();
    }

    for (const weapon of this.equippedWeapons) {
      weapon.cooldownSeconds = Math.max(0, weapon.cooldownSeconds - delta);
    }
    this.playerHurtCooldownSeconds = Math.max(0, this.playerHurtCooldownSeconds - delta);
    this.ultimateCooldownRemainingSeconds = Math.max(0, this.ultimateCooldownRemainingSeconds - delta);
    this.updateBuffs(delta);
    this.updateShieldRecharge(delta);
    this.updateFence(intent, delta);

    const motionFrame = this.heroMotion.update(intent, delta);
    this.heroState = motionFrame.state;
    this.playerInvulnerable = motionFrame.isInvulnerable;
    this.evasiveReady = motionFrame.evasiveReady;
    this.evasiveCooldownRemainingSeconds = motionFrame.evasiveCooldownRemainingSeconds;
    if (intent.move.x !== 0 || intent.move.y !== 0 || motionFrame.state === "evading") {
      this.stationarySeconds = 0;
    } else {
      this.stationarySeconds += delta;
    }
    let movementMultiplier = motionFrame.state !== "evading" && this.isPlayerSlowed()
      ? resolveSlowedMultiplier(SLIME_MOVEMENT_MULTIPLIER, this.defence.slowResistance)
      : 1;
    if (motionFrame.state !== "evading") {
      movementMultiplier *= this.moveSpeedMultiplier;
      if (this.isBuffActive("adrenaline")) {
        movementMultiplier *= ADRENALINE_MOVE_MULTIPLIER;
      }
    }

    if (intent.ultimatePressed && this.ultimateCooldownRemainingSeconds <= 0) {
      this.fireUltimate();
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

    if (intent.fireHeld) {
      const attackSpeed = this.currentAttackSpeedMultiplier();
      for (const weapon of this.equippedWeapons) {
        if (weapon.cooldownSeconds <= 0) {
          const fireDirection = this.resolveWeaponAimDirection(weapon, this.lastAimDirection);
          if (fireDirection) {
            this.fireWeapon(weapon, fireDirection);
            weapon.cooldownSeconds = weapon.stats.fireIntervalSeconds / attackSpeed;
          }
        }
      }
    }

    if (this.wavesEnabled && this.status === "combat") {
      this.updateWaveSpawns(delta);
    }

    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.updateEnemyProjectiles(delta);
    this.updateGroundHazards(delta);
    this.updateExperiencePickups(delta);
    this.updatePowerups(delta);
    this.updateEliteRewards();
    this.resolveEnemyContactDamage();
    this.removeDeadEntities();
    if (this.wavesEnabled) {
      this.updateEncounterProgress(delta);
    }

    return this.snapshot();
  }

  spawnEnemy(type: EnemyType, position?: Vector2Data): number {
    const definition = ENEMY_CATALOG[type];
    const spawnPosition = position ? { ...position } : this.nextEdgeSpawn(definition.radiusMetres);
    const id = this.nextId();

    this.enemies.push({
      id,
      type,
      position: spawnPosition,
      health: definition.maxHealth,
      maxHealth: definition.maxHealth,
      attackCooldownSeconds: 0,
      dead: false,
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
      statusBuildup: {},
      statusTimers: {},
    });
    this.frameEvents.push({
      type: "enemy-spawned",
      position: { ...spawnPosition },
      enemyType: type,
    });

    return id;
  }

  spawnElite(eliteKind: EliteKind, position?: Vector2Data): number {
    const id = this.spawnEnemy("scuttler", position);
    const enemy = this.enemies.find((candidate) => candidate.id === id)!;
    enemy.rank = "elite";
    enemy.eliteKind = eliteKind;
    enemy.maxHealth = ENEMY_CATALOG.scuttler.maxHealth * 3.5;
    enemy.health = enemy.maxHealth;
    enemy.carapacePhase = "pursuit";
    enemy.carapacePhaseRemainingSeconds = 1.25;
    return id;
  }

  spawnMiniBoss(miniBossKind: MiniBossKind, position?: Vector2Data): number {
    const id = this.spawnEnemy(miniBossKind, position);
    const enemy = this.enemies.find((candidate) => candidate.id === id)!;
    enemy.rank = "mini-boss";
    enemy.miniBossKind = miniBossKind;
    enemy.siegeCrusherPhase = "entrance";
    enemy.siegeCrusherPhaseRemainingSeconds = 0.9;
    enemy.broodWardenPhase = "entrance";
    enemy.broodWardenPhaseRemainingSeconds = 0.9;
    enemy.facingDirection = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    return id;
  }

  spawnPowerup(type: PowerupType, position?: Vector2Data): number {
    const id = this.nextId();
    this.powerups.push({
      id,
      type,
      position: position ? { ...position } : this.nextPowerupPosition(),
      remainingSeconds: POWERUP_LIFETIME_SECONDS,
      collected: false,
    });
    return id;
  }

  addExperience(amount: number): void {
    this.experience += Math.max(0, Math.floor(amount));
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
    if (!decision || !decision.options.some((option) => option.id === optionId)) {
      return false;
    }

    this.decisionQueue.shift();
    switch (decision.kind) {
      case "upgrade":
        this.applyUpgrade(optionId as UpgradeId);
        break;
      case "weapon-chest":
        this.addWeapon(optionId as WeaponId);
        break;
      case "supply-depot":
        this.applySupplyChoice(optionId);
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

  snapshot(): CombatSnapshot {
    const decision = this.decisionQueue[0] ?? null;
    return {
      status: this.status,
      waveNumber: this.waveIndex + 1,
      totalWaves: TOTAL_WAVES,
      playerPosition: { ...this.playerPosition },
      playerHealth: this.playerHealth,
      playerMaxHealth: PLAYER_MAX_HEALTH,
      playerShield: this.playerShield,
      playerMaxShield: this.defence.maxShield,
      playerInvulnerable: this.playerInvulnerable || this.playerHurtCooldownSeconds > 0,
      playerEntrenched: this.isPlayerEntrenched(),
      evasiveReady: this.evasiveReady,
      evasiveCooldownRemainingSeconds: this.evasiveCooldownRemainingSeconds,
      ultimateReady: this.ultimateCooldownRemainingSeconds <= 0,
      ultimateCooldownRemainingSeconds: this.ultimateCooldownRemainingSeconds,
      fence: this.fenceSnapshot(),
      heroState: this.heroState,
      level: this.level,
      experience: this.experience,
      experienceForNextLevel: this.experienceThreshold(),
      pendingUpgradeChoices: decision?.kind === "upgrade"
        ? decision.options.map((option) => UPGRADE_CATALOG[option.id as UpgradeId])
        : [],
      pendingDecision: decision
        ? { kind: decision.kind, title: decision.title, options: decision.options.map((option) => ({ ...option })) }
        : null,
      enemies: this.enemies.filter((enemy) => !enemy.dead).map((enemy) => this.enemySnapshot(enemy)),
      projectiles: this.projectiles.filter((projectile) => !projectile.dead).map((projectile) => ({
        id: projectile.id,
        weaponId: projectile.weaponId,
        position: { ...projectile.position },
        rotationRadians: Math.atan2(projectile.velocity.y, projectile.velocity.x),
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
      activeBuffs: [...this.activeBuffs.entries()].map(([type, remainingSeconds]) => ({
        type,
        remainingSeconds,
      })),
      weapon: { ...(this.equippedWeapons[0]?.stats ?? BASTION_SERVICE_RIFLE) },
      equippedWeapons: this.equippedWeapons.map((weapon) => ({
        instanceId: weapon.instanceId,
        weaponId: weapon.weaponId,
        stats: { ...weapon.stats },
      })),
      events: this.frameEvents.map((event) => ({ ...event })),
      arena: this.arena,
      stressProfile: this.stressProfile,
      scenario: this.scenario,
      playerSlowed: this.isPlayerSlowed(),
      damagedObstacleIds: [...this.obstacleDamage.entries()]
        .filter(([, damage]) => damage === 1).map(([id]) => id),
      destroyedObstacleIds: [...this.obstacleDamage.entries()]
        .filter(([, damage]) => damage >= 2).map(([id]) => id),
      playerTethered: this.enemies.some((enemy) => (
        !enemy.dead && enemy.id === this.activeTetherEnemyId && enemy.tetherBloomPhase === "tethering"
      )),
      activeTetherEnemyId: this.activeTetherEnemyId,
    };
  }

  private applyUpgrade(upgradeId: UpgradeId): void {
    switch (upgradeId) {
      case "rapid-cycling":
        this.modifyAllWeapons((weapon) => { weapon.fireIntervalSeconds *= 0.8; });
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
      case "explosive-payload":
        this.modifyAllWeapons((weapon) => {
          weapon.explosionRadiusMetres = Math.max(weapon.explosionRadiusMetres, 1.4);
        });
        break;
      case "heavy-calibre":
        this.modifyAllWeapons((weapon) => {
          weapon.projectileDamage *= 1.4;
          weapon.fireIntervalSeconds *= 1.1;
        });
        break;
      case "field-magnet":
        this.magnetMultiplier *= 1.5;
        break;
      case "incendiary-rounds":
        this.modifyAllWeapons((weapon) => { weapon.damageType = "fire"; });
        break;
      case "cryo-coating":
        this.modifyAllWeapons((weapon) => { weapon.damageType = "cryo"; });
        break;
      case "chain-lightning":
        this.modifyAllWeapons((weapon) => {
          weapon.chainCount += 1;
          weapon.chainRadiusMetres = Math.max(weapon.chainRadiusMetres, 2.5);
        });
        break;
      case "adrenal-servos":
        this.moveSpeedMultiplier *= 1.12;
        break;
      case "composite-plating":
        this.defence.armour += 3;
        break;
      case "shield-capacitor":
        this.defence.maxShield += 15;
        break;
    }
  }

  private addWeapon(weaponId: WeaponId): void {
    if (this.equippedWeapons.length >= MAX_EQUIPPED_WEAPONS) {
      return;
    }
    const nextInstanceId = this.equippedWeapons
      .reduce((maximum, weapon) => Math.max(maximum, weapon.instanceId), 0) + 1;
    this.equippedWeapons.push({
      instanceId: nextInstanceId,
      weaponId,
      stats: { ...WEAPON_CATALOG[weaponId] },
      cooldownSeconds: 0,
    });
  }

  private applySupplyChoice(optionId: string): void {
    switch (optionId) {
      case "patch-up":
        this.playerHealth = Math.min(PLAYER_MAX_HEALTH, this.playerHealth + SUPPLY_DEPOT_HEAL);
        break;
      case "field-armoury":
        this.decisionQueue.unshift(this.buildUpgradeDecision());
        break;
      case "aegis-lattice":
        this.playerShield += AEGIS_SHIELD_AMOUNT;
        break;
    }
  }

  private buildUpgradeDecision(): PendingDecision {
    const start = (this.level - 2 + UPGRADE_ORDER.length * 2) % UPGRADE_ORDER.length;
    const ids = [
      UPGRADE_ORDER[start]!,
      UPGRADE_ORDER[(start + 2) % UPGRADE_ORDER.length]!,
      UPGRADE_ORDER[(start + 4) % UPGRADE_ORDER.length]!,
    ];
    return {
      kind: "upgrade",
      title: "LEVEL UP — CHOOSE AN UPGRADE",
      options: ids.map((id) => ({
        id,
        name: UPGRADE_CATALOG[id].name,
        description: UPGRADE_CATALOG[id].description,
      })),
    };
  }

  private buildWeaponChestDecision(): PendingDecision | null {
    if (this.equippedWeapons.length >= MAX_EQUIPPED_WEAPONS) {
      return null;
    }
    const ownedIds = new Set(this.equippedWeapons.map((weapon) => weapon.weaponId));
    const options = VERTICAL_SLICE_WEAPON_IDS
      .filter((weaponId) => !ownedIds.has(weaponId))
      .map((weaponId) => ({
        id: weaponId,
        name: WEAPON_CATALOG[weaponId].displayName,
        description: WEAPON_CATALOG[weaponId].description,
      }));
    if (options.length === 0) {
      return null;
    }
    return {
      kind: "weapon-chest",
      title: "WEAPON CHEST — CHOOSE A WEAPON",
      options,
    };
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

  private fireWeapon(weapon: EquippedWeaponState, aimDirection: Vector2Data): void {
    const centre = (weapon.stats.projectileCount - 1) / 2;
    const baseAngle = Math.atan2(aimDirection.y, aimDirection.x);
    const slot = calculateWeaponRingLayout(this.equippedWeapons.length, baseAngle)[
      this.equippedWeapons.indexOf(weapon)
    ] ?? { x: 0, y: 0 };
    const anchor = {
      x: this.playerPosition.x + slot.x,
      y: this.playerPosition.y + slot.y,
    };

    for (let index = 0; index < weapon.stats.projectileCount; index += 1) {
      const angle = baseAngle + (index - centre) * weapon.stats.spreadRadians;
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      const muzzlePosition = {
        x: anchor.x + direction.x * 0.55,
        y: anchor.y + direction.y * 0.55,
      };

      this.projectiles.push({
        id: this.nextId(),
        weaponId: weapon.weaponId,
        damageType: weapon.stats.damageType,
        position: { ...muzzlePosition },
        velocity: {
          x: direction.x * weapon.stats.projectileSpeedMetresPerSecond,
          y: direction.y * weapon.stats.projectileSpeedMetresPerSecond,
        },
        damage: weapon.stats.projectileDamage,
        remainingSeconds: weapon.stats.projectileLifetimeSeconds,
        pierceRemaining: weapon.stats.pierceCount,
        explosionRadiusMetres: weapon.stats.explosionRadiusMetres,
        knockbackMetres: weapon.stats.knockbackMetres,
        chainRemaining: weapon.stats.chainCount,
        chainRadiusMetres: weapon.stats.chainRadiusMetres,
        hitEnemyIds: new Set<number>(),
        dead: false,
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

  private resolveWeaponAimDirection(
    weapon: EquippedWeaponState,
    cursorDirection: Vector2Data,
  ): Vector2Data | null {
    if (weapon.stats.targetingMode === "cursor") {
      return cursorDirection;
    }

    let nearest: EnemyState | null = null;
    let nearestDistance = weapon.stats.rangeMetres;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const candidateDistance = distance(this.playerPosition, enemy.position);
      if (candidateDistance <= nearestDistance) {
        nearest = enemy;
        nearestDistance = candidateDistance;
      }
    }
    return nearest
      ? normalizeVector({
        x: nearest.position.x - this.playerPosition.x,
        y: nearest.position.y - this.playerPosition.y,
      })
      : null;
  }

  private modifyAllWeapons(modifier: (weapon: WeaponRuntimeStats) => void): void {
    for (const weapon of this.equippedWeapons) {
      modifier(weapon.stats);
    }
  }

  private isPlayerEntrenched(): boolean {
    return this.stationarySeconds >= MARINE.passive.stationarySecondsRequired;
  }

  private fireUltimate(): void {
    const ultimate = MARINE.ultimate;
    this.ultimateCooldownRemainingSeconds = ultimate.cooldownSeconds;
    for (let index = 0; index < ultimate.projectileCount; index += 1) {
      const angle = (index / ultimate.projectileCount) * Math.PI * 2;
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      this.projectiles.push({
        id: this.nextId(),
        weaponId: "bastion-service-rifle",
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
        remainingSeconds: ULTIMATE_PROJECTILE_LIFETIME_SECONDS,
        pierceRemaining: 0,
        explosionRadiusMetres: ultimate.explosionRadiusMetres,
        knockbackMetres: 0.4,
        chainRemaining: 0,
        chainRadiusMetres: 0,
        hitEnemyIds: new Set<number>(),
        dead: false,
      });
    }
    this.frameEvents.push({ type: "ultimate-fired", position: { ...this.playerPosition } });
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
      const reach = FENCE_CONTACT_RANGE_METRES + ENEMY_CATALOG[enemy.type].radiusMetres * 0.5;
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
    return this.defence.attackSpeedMultiplier
      * (this.isBuffActive("overcharge") ? OVERCHARGE_ATTACK_SPEED_MULTIPLIER : 1);
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

  private updateShieldRecharge(deltaSeconds: number): void {
    this.shieldRechargeCooldownSeconds = Math.max(0, this.shieldRechargeCooldownSeconds - deltaSeconds);
    if (
      this.shieldRechargeCooldownSeconds <= 0
      && this.playerShield < this.defence.maxShield
    ) {
      this.playerShield = Math.min(
        this.defence.maxShield,
        this.playerShield + this.defence.shieldRechargePerSecond * deltaSeconds,
      );
    }
  }

  private updateProjectiles(deltaSeconds: number): void {
    for (const projectile of this.projectiles) {
      if (projectile.dead) {
        continue;
      }

      projectile.position.x += projectile.velocity.x * deltaSeconds;
      projectile.position.y += projectile.velocity.y * deltaSeconds;
      projectile.remainingSeconds -= deltaSeconds;

      if (
        projectile.remainingSeconds <= 0
        || projectile.position.x < 0
        || projectile.position.y < 0
        || projectile.position.x > this.widthMetres
        || projectile.position.y > this.heightMetres
      ) {
        projectile.dead = true;
        continue;
      }

      if (pointHitsObstacle(projectile.position, this.activeObstacles())) {
        projectile.dead = true;
        this.frameEvents.push({
          type: "projectile-blocked",
          position: { ...projectile.position },
        });
        continue;
      }

      for (const enemy of this.enemies) {
        if (enemy.dead || projectile.hitEnemyIds.has(enemy.id)) {
          continue;
        }

        const definition = ENEMY_CATALOG[enemy.type];
        if (distance(projectile.position, enemy.position) > definition.radiusMetres + 0.14) {
          continue;
        }

        projectile.hitEnemyIds.add(enemy.id);
        const damageMultiplier = this.projectileDamageMultiplier(projectile, enemy);
        this.damageEnemy(enemy, projectile.damage * damageMultiplier, projectile.damageType);
        if (damageMultiplier >= 1) this.applyProjectileKnockback(projectile, enemy);
        this.resolveProjectileChain(projectile, enemy);

        if (projectile.explosionRadiusMetres > 0) {
          this.frameEvents.push({
            type: "explosion",
            position: { ...enemy.position },
            radiusMetres: projectile.explosionRadiusMetres,
          });
          for (const nearby of this.enemies) {
            if (
              nearby.id !== enemy.id
              && !nearby.dead
              && distance(nearby.position, enemy.position) <= projectile.explosionRadiusMetres
            ) {
              this.damageEnemy(nearby, projectile.damage * 0.5, projectile.damageType);
            }
          }
        }

        if (projectile.pierceRemaining > 0) {
          projectile.pierceRemaining -= 1;
        } else {
          projectile.dead = true;
          break;
        }
      }
    }
  }

  private projectileDamageMultiplier(projectile: ProjectileState, enemy: EnemyState): number {
    if (enemy.eliteKind !== "carapace-scuttler" || enemy.carapacePhase === "recovery") return 1;
    const directionToShooter = normalizeVector({ x: -projectile.velocity.x, y: -projectile.velocity.y });
    const frontalDot = directionToShooter.x * enemy.facingDirection.x
      + directionToShooter.y * enemy.facingDirection.y;
    if (frontalDot <= 0.25) return 1;
    this.frameEvents.push({
      type: "elite-armour-hit",
      position: { ...enemy.position },
      eliteKind: enemy.eliteKind,
    });
    return 0.25;
  }

  private applyProjectileKnockback(projectile: ProjectileState, enemy: EnemyState): void {
    if (projectile.knockbackMetres <= 0 || enemy.dead) return;
    const direction = normalizeVector(projectile.velocity);
    const definition = ENEMY_CATALOG[enemy.type];
    enemy.position = resolveCircleMovement(
      enemy.position,
      {
        x: enemy.position.x + direction.x * projectile.knockbackMetres,
        y: enemy.position.y + direction.y * projectile.knockbackMetres,
      },
      definition.radiusMetres,
      this.collisionArena(),
    );
  }

  private resolveProjectileChain(projectile: ProjectileState, source: EnemyState): void {
    let from = source;
    while (projectile.chainRemaining > 0) {
      let target: EnemyState | null = null;
      let nearestDistance = projectile.chainRadiusMetres;
      for (const enemy of this.enemies) {
        if (enemy.dead || projectile.hitEnemyIds.has(enemy.id)) continue;
        const candidateDistance = distance(from.position, enemy.position);
        if (candidateDistance <= nearestDistance) {
          target = enemy;
          nearestDistance = candidateDistance;
        }
      }
      if (!target) return;
      projectile.hitEnemyIds.add(target.id);
      projectile.chainRemaining -= 1;
      this.frameEvents.push({
        type: "chain-arc",
        from: { ...from.position },
        to: { ...target.position },
        weaponId: projectile.weaponId,
      });
      this.damageEnemy(target, projectile.damage * 0.7, projectile.damageType);
      from = target;
    }
  }

  private updateEnemies(deltaSeconds: number): void {
    for (const enemy of [...this.enemies]) {
      if (enemy.dead) {
        continue;
      }

      this.tickEnemyStatuses(enemy, deltaSeconds);
      if (enemy.dead || this.isEnemyStunned(enemy)) {
        continue;
      }

      enemy.attackCooldownSeconds = Math.max(0, enemy.attackCooldownSeconds - deltaSeconds);

      switch (enemy.type) {
        case "scuttler":
          if (enemy.eliteKind === "carapace-scuttler") this.updateCarapaceScuttler(enemy, deltaSeconds);
          else this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG.scuttler.movementSpeedMetresPerSecond, deltaSeconds);
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
      if (rule.damagePerSecond > 0) {
        this.applyRawDamage(enemy, rule.damagePerSecond * deltaSeconds);
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
      multiplier = Math.min(multiplier, STATUS_RULES[status].speedMultiplier);
    }
    return multiplier;
  }

  private activeStatuses(enemy: EnemyState): StatusEffectType[] {
    return (Object.keys(enemy.statusTimers) as StatusEffectType[])
      .filter((status) => (enemy.statusTimers[status] ?? 0) > 0);
  }

  private updateEggCluster(enemy: EnemyState, deltaSeconds: number): void {
    enemy.hatchRemainingSeconds -= deltaSeconds;

    if (enemy.hatchRemainingSeconds > 0) {
      return;
    }

    enemy.dead = true;
    if (this.activeTetherEnemyId === enemy.id) this.activeTetherEnemyId = null;
    this.frameEvents.push({ type: "egg-hatched", position: { ...enemy.position } });
    for (const offset of [-0.45, 0.45]) {
      this.spawnEnemy("scuttler", {
        x: clamp(enemy.position.x + offset, 0.5, this.widthMetres - 0.5),
        y: clamp(enemy.position.y + 0.2, 0.5, this.heightMetres - 0.5),
      });
    }
  }

  private updateBrainBlob(enemy: EnemyState, deltaSeconds: number): void {
    enemy.brainPhaseRemainingSeconds -= deltaSeconds;

    switch (enemy.brainPhase) {
      case "drift":
        this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG["brain-blob"].movementSpeedMetresPerSecond, deltaSeconds);
        if (enemy.brainPhaseRemainingSeconds <= 0) {
          enemy.brainPhase = "windup";
          enemy.brainPhaseRemainingSeconds = 0.45;
        }
        break;
      case "windup":
        if (enemy.brainPhaseRemainingSeconds <= 0) {
          enemy.brainPhase = "lunge";
          enemy.brainPhaseRemainingSeconds = 0.32;
          enemy.brainLungeDirection = normalizeVector({
            x: this.playerPosition.x - enemy.position.x,
            y: this.playerPosition.y - enemy.position.y,
          });
        }
        break;
      case "lunge":
        this.moveEnemy(enemy, enemy.brainLungeDirection, 6, deltaSeconds);
        if (enemy.brainPhaseRemainingSeconds <= 0) {
          enemy.brainPhase = "recover";
          enemy.brainPhaseRemainingSeconds = 0.6;
        }
        break;
      case "recover":
        if (enemy.brainPhaseRemainingSeconds <= 0) {
          enemy.brainPhase = "drift";
          enemy.brainPhaseRemainingSeconds = 1.4 + this.random() * 0.8;
        }
        break;
    }
  }

  private updateBlastMite(enemy: EnemyState, deltaSeconds: number): void {
    enemy.mitePhaseRemainingSeconds -= deltaSeconds;
    switch (enemy.mitePhase) {
      case "chase":
        this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG["blast-mite"].movementSpeedMetresPerSecond, deltaSeconds);
        if (distance(enemy.position, this.playerPosition) <= 1) {
          enemy.mitePhase = "armed";
          enemy.mitePhaseRemainingSeconds = 0.45;
        }
        break;
      case "armed":
        if (enemy.mitePhaseRemainingSeconds <= 0) {
          this.applyRawDamage(enemy, enemy.health + 1);
        }
        break;
    }
  }

  private updateWarpFlanker(enemy: EnemyState, deltaSeconds: number): void {
    enemy.warpPhaseRemainingSeconds -= deltaSeconds;
    switch (enemy.warpPhase) {
      case "stalk":
        enemy.facingDirection = normalizeVector({
          x: this.playerPosition.x - enemy.position.x,
          y: this.playerPosition.y - enemy.position.y,
        });
        this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG["warp-flanker"].movementSpeedMetresPerSecond, deltaSeconds);
        if (enemy.warpPhaseRemainingSeconds <= 0) {
          if (distance(enemy.position, this.playerPosition) > 3) {
            enemy.warpPhase = "warp-windup";
            enemy.warpPhaseRemainingSeconds = 0.7;
            enemy.warpTarget = this.pickWarpTarget();
          } else {
            enemy.warpPhaseRemainingSeconds = 1;
          }
        }
        break;
      case "warp-windup":
        if (enemy.warpPhaseRemainingSeconds <= 0) {
          enemy.position = { ...enemy.warpTarget };
          enemy.warpPhase = "materialize";
          enemy.warpPhaseRemainingSeconds = 0.35;
          this.frameEvents.push({ type: "warp-arrival", position: { ...enemy.position } });
        }
        break;
      case "materialize":
        if (enemy.warpPhaseRemainingSeconds <= 0) {
          enemy.warpPhase = "stalk";
          enemy.warpPhaseRemainingSeconds = 2.2;
        }
        break;
    }
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
    enemy.carapacePhaseRemainingSeconds -= deltaSeconds;
    switch (enemy.carapacePhase) {
      case "pursuit":
        enemy.facingDirection = normalizeVector({
          x: this.playerPosition.x - enemy.position.x,
          y: this.playerPosition.y - enemy.position.y,
        });
        this.moveEnemy(enemy, enemy.facingDirection, 1.85, deltaSeconds);
        if (enemy.carapacePhaseRemainingSeconds <= 0 && distance(enemy.position, this.playerPosition) <= 8) {
          enemy.carapacePhase = "windup";
          enemy.carapacePhaseRemainingSeconds = 0.55;
        }
        break;
      case "windup":
        if (enemy.carapacePhaseRemainingSeconds <= 0) {
          enemy.facingDirection = normalizeVector({
            x: this.playerPosition.x - enemy.position.x,
            y: this.playerPosition.y - enemy.position.y,
          });
          enemy.carapacePhase = "charge";
          enemy.carapacePhaseRemainingSeconds = 0.48;
        }
        break;
      case "charge":
        this.moveEnemy(enemy, enemy.facingDirection, 7.2, deltaSeconds);
        if (enemy.carapacePhaseRemainingSeconds <= 0) {
          enemy.carapacePhase = "recovery";
          enemy.carapacePhaseRemainingSeconds = 1.05;
        }
        break;
      case "recovery":
        if (enemy.carapacePhaseRemainingSeconds <= 0) {
          enemy.carapacePhase = "pursuit";
          enemy.carapacePhaseRemainingSeconds = 1.4;
        }
        break;
    }
  }

  private updateRipper(enemy: EnemyState, deltaSeconds: number): void {
    enemy.ripperPhaseRemainingSeconds -= deltaSeconds;
    const reachMetres = 2.55;
    switch (enemy.ripperPhase) {
      case "pursuit": {
        enemy.facingDirection = normalizeVector({
          x: this.playerPosition.x - enemy.position.x,
          y: this.playerPosition.y - enemy.position.y,
        });
        const playerDistance = distance(enemy.position, this.playerPosition);
        if (playerDistance > reachMetres) {
          this.moveEnemy(enemy, enemy.facingDirection, ENEMY_CATALOG.ripper.movementSpeedMetresPerSecond, deltaSeconds);
        }
        if (enemy.ripperPhaseRemainingSeconds <= 0 && playerDistance <= reachMetres + 0.35) {
          enemy.ripperDirection = { ...enemy.facingDirection };
          enemy.ripperPhase = "windup";
          enemy.ripperPhaseRemainingSeconds = 0.62;
        }
        break;
      }
      case "windup":
        if (enemy.ripperPhaseRemainingSeconds <= 0) {
          enemy.ripperPhase = "sweep";
          enemy.ripperPhaseRemainingSeconds = 0.24;
          this.frameEvents.push({
            type: "ripper-sweep",
            position: { ...enemy.position },
            direction: { ...enemy.ripperDirection },
            reachMetres,
          });
          if (pointInsideRipperSweep(
            enemy.position,
            enemy.ripperDirection,
            this.playerPosition,
            reachMetres + PLAYER_RADIUS_METRES,
          )) {
            this.damagePlayer(18);
          }
        }
        break;
      case "sweep":
        if (enemy.ripperPhaseRemainingSeconds <= 0) {
          enemy.ripperPhase = "recovery";
          enemy.ripperPhaseRemainingSeconds = 1.1;
        }
        break;
      case "recovery":
        if (enemy.ripperPhaseRemainingSeconds <= 0) {
          enemy.ripperPhase = "pursuit";
          enemy.ripperPhaseRemainingSeconds = 0.45;
        }
        break;
    }
  }

  private updateRazorScuttler(enemy: EnemyState, deltaSeconds: number): void {
    enemy.razorScuttlerPhaseRemainingSeconds -= deltaSeconds;
    const playerDistance = distance(enemy.position, this.playerPosition);
    switch (enemy.razorScuttlerPhase) {
      case "pursuit": {
        const towardPlayer = normalizeVector({
          x: this.playerPosition.x - enemy.position.x,
          y: this.playerPosition.y - enemy.position.y,
        });
        enemy.facingDirection = towardPlayer;
        if (playerDistance < RAZOR_SCUTTLER_MIN_DASH_RANGE) {
          this.moveEnemy(enemy, { x: -towardPlayer.x, y: -towardPlayer.y }, ENEMY_CATALOG["razor-scuttler"].movementSpeedMetresPerSecond, deltaSeconds);
        } else if (playerDistance > RAZOR_SCUTTLER_MAX_DASH_RANGE) {
          this.moveEnemy(enemy, towardPlayer, ENEMY_CATALOG["razor-scuttler"].movementSpeedMetresPerSecond, deltaSeconds);
        }
        if (
          enemy.razorScuttlerPhaseRemainingSeconds <= 0
          && playerDistance >= RAZOR_SCUTTLER_MIN_DASH_RANGE
          && playerDistance <= RAZOR_SCUTTLER_MAX_DASH_RANGE
        ) {
          enemy.razorScuttlerDirection = { ...towardPlayer };
          enemy.razorScuttlerPhase = "windup";
          enemy.razorScuttlerPhaseRemainingSeconds = RAZOR_SCUTTLER_WINDUP_SECONDS;
          enemy.razorScuttlerHitPlayer = false;
          this.frameEvents.push({
            type: "razor-scuttler-warning",
            position: { ...enemy.position },
            direction: { ...enemy.razorScuttlerDirection },
          });
        }
        break;
      }
      case "windup":
        if (enemy.razorScuttlerPhaseRemainingSeconds <= 0) {
          enemy.razorScuttlerPhase = "dash";
          enemy.razorScuttlerPhaseRemainingSeconds = RAZOR_SCUTTLER_DASH_SECONDS;
          this.frameEvents.push({
            type: "razor-scuttler-dash",
            position: { ...enemy.position },
            direction: { ...enemy.razorScuttlerDirection },
          });
        }
        break;
      case "dash": {
        const radius = ENEMY_CATALOG["razor-scuttler"].radiusMetres;
        const desired = {
          x: enemy.position.x + enemy.razorScuttlerDirection.x * RAZOR_SCUTTLER_DASH_SPEED * deltaSeconds,
          y: enemy.position.y + enemy.razorScuttlerDirection.y * RAZOR_SCUTTLER_DASH_SPEED * deltaSeconds,
        };
        const hitBoundary = desired.x <= radius || desired.x >= this.widthMetres - radius
          || desired.y <= radius || desired.y >= this.heightMetres - radius;
        const hitCover = this.firstCollidingObstacle(desired, radius);
        if (hitBoundary || hitCover) {
          this.enterRazorScuttlerRecovery(enemy, "cover", 1.4);
          break;
        }
        this.moveEnemy(enemy, enemy.razorScuttlerDirection, RAZOR_SCUTTLER_DASH_SPEED, deltaSeconds);
        if (
          !enemy.razorScuttlerHitPlayer
          && distance(enemy.position, this.playerPosition) <= radius + PLAYER_RADIUS_METRES + 0.12
        ) {
          enemy.razorScuttlerHitPlayer = true;
          this.damagePlayer(RAZOR_SCUTTLER_DASH_DAMAGE);
          this.enterRazorScuttlerRecovery(enemy, "player", 1);
          break;
        }
        if (enemy.razorScuttlerPhaseRemainingSeconds <= 0) {
          this.enterRazorScuttlerRecovery(enemy, "miss", RAZOR_SCUTTLER_RECOVERY_SECONDS);
        }
        break;
      }
      case "recovery":
        if (enemy.razorScuttlerPhaseRemainingSeconds <= 0) {
          enemy.razorScuttlerPhase = "pursuit";
          enemy.razorScuttlerPhaseRemainingSeconds = 0.55;
        }
        break;
    }
  }

  private enterRazorScuttlerRecovery(
    enemy: EnemyState,
    reason: "player" | "cover" | "miss",
    durationSeconds: number,
  ): void {
    enemy.razorScuttlerPhase = "recovery";
    enemy.razorScuttlerPhaseRemainingSeconds = durationSeconds;
    this.frameEvents.push({ type: "razor-scuttler-impact", position: { ...enemy.position }, reason });
  }

  private updateSiegeCrusher(enemy: EnemyState, deltaSeconds: number): void {
    enemy.siegeCrusherPhaseRemainingSeconds -= deltaSeconds;
    const playerDistance = distance(enemy.position, this.playerPosition);
    const enrageTier = siegeCrusherEnrageTier(enemy.health, enemy.maxHealth);
    const stalkSpeed = [1.4, 1.62, 1.85][enrageTier]!;
    const chargeSpeed = [8.8, 9.8, 10.8][enrageTier]!;
    const recoverySeconds = [1.05, 0.88, 0.7][enrageTier]!;
    switch (enemy.siegeCrusherPhase) {
      case "entrance":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "stalk";
          enemy.siegeCrusherPhaseRemainingSeconds = 1.1;
        }
        break;
      case "stalk":
        enemy.facingDirection = normalizeVector({
          x: this.playerPosition.x - enemy.position.x,
          y: this.playerPosition.y - enemy.position.y,
        });
        this.moveEnemy(enemy, enemy.facingDirection, stalkSpeed, deltaSeconds);
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherAttackCount += 1;
          const slamFrequency = enrageTier === 2 ? 2 : 3;
          if (enrageTier >= 1 && enemy.siegeCrusherAttackCount % slamFrequency === 0) {
            enemy.siegeCrusherPhase = "slam-windup";
            enemy.siegeCrusherPhaseRemainingSeconds = enrageTier === 2 ? 0.42 : 0.58;
          } else if (playerDistance > 3.4) {
            enemy.siegeCrusherDirection = { ...enemy.facingDirection };
            enemy.siegeCrusherPhase = "charge-windup";
            enemy.siegeCrusherPhaseRemainingSeconds = [0.65, 0.54, 0.44][enrageTier]!;
          } else {
            enemy.siegeCrusherPhase = "sweep-windup";
            enemy.siegeCrusherPhaseRemainingSeconds = [0.52, 0.44, 0.36][enrageTier]!;
          }
        }
        break;
      case "charge-windup":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "charge";
          enemy.siegeCrusherPhaseRemainingSeconds = 0.72;
        }
        break;
      case "charge": {
        const travel = chargeSpeed * deltaSeconds;
        const desired = {
          x: enemy.position.x + enemy.siegeCrusherDirection.x * travel,
          y: enemy.position.y + enemy.siegeCrusherDirection.y * travel,
        };
        const obstacle = this.firstCollidingObstacle(desired, ENEMY_CATALOG["siege-crusher"].radiusMetres);
        if (obstacle) {
          this.damageObstacle(obstacle.id, {
            x: obstacle.x + obstacle.width / 2,
            y: obstacle.y + obstacle.height / 2,
          });
          this.emitCrusherShockwave(enemy.position);
          enemy.siegeCrusherPhase = "recovery";
          enemy.siegeCrusherPhaseRemainingSeconds = recoverySeconds;
          break;
        }
        this.moveEnemy(enemy, enemy.siegeCrusherDirection, chargeSpeed, deltaSeconds);
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "recovery";
          enemy.siegeCrusherPhaseRemainingSeconds = recoverySeconds;
        }
        break;
      }
      case "sweep-windup":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "sweep";
          enemy.siegeCrusherPhaseRemainingSeconds = 0.28;
          const radiusMetres = [2.7, 2.9, 3.1][enrageTier]!;
          this.frameEvents.push({
            type: "mini-boss-sweep",
            position: { ...enemy.position },
            radiusMetres,
          });
          if (playerDistance <= radiusMetres + PLAYER_RADIUS_METRES) {
            this.damagePlayer([24, 28, 34][enrageTier]!);
          }
        }
        break;
      case "sweep":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "recovery";
          enemy.siegeCrusherPhaseRemainingSeconds = recoverySeconds;
        }
        break;
      case "slam-windup":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "slam";
          enemy.siegeCrusherPhaseRemainingSeconds = 0.3;
          this.emitCrusherShockwave(
            enemy.position,
            enrageTier === 2 ? 4 : 3.4,
            enrageTier === 2 ? 30 : 22,
          );
        }
        break;
      case "slam":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "recovery";
          enemy.siegeCrusherPhaseRemainingSeconds = recoverySeconds;
        }
        break;
      case "recovery":
        if (enemy.siegeCrusherPhaseRemainingSeconds <= 0) {
          enemy.siegeCrusherPhase = "stalk";
          enemy.siegeCrusherPhaseRemainingSeconds = [0.95, 0.78, 0.62][enrageTier]!;
        }
        break;
    }
  }

  private updateBroodWarden(enemy: EnemyState, deltaSeconds: number): void {
    enemy.broodWardenPhaseRemainingSeconds -= deltaSeconds;
    const enrageTier = broodWardenEnrageTier(enemy.health, enemy.maxHealth);
    const playerDistance = distance(enemy.position, this.playerPosition);
    const recoverySeconds = [1.05, 0.82, 0.62][enrageTier]!;
    enemy.facingDirection = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });

    switch (enemy.broodWardenPhase) {
      case "entrance":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenPhase = "stalk";
          enemy.broodWardenPhaseRemainingSeconds = 0.8;
        }
        break;
      case "stalk":
        this.moveEnemy(
          enemy,
          enemy.facingDirection,
          [1.55, 1.82, 2.08][enrageTier]!,
          deltaSeconds,
        );
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenAttackCount += 1;
          if (enrageTier >= 1 && !enemy.broodWardenRushUsed) {
            enemy.broodWardenDirection = { ...enemy.facingDirection };
            enemy.broodWardenPhase = "rush-windup";
            enemy.broodWardenPhaseRemainingSeconds = enrageTier === 2 ? 0.4 : 0.55;
          } else if (playerDistance <= 2.8 && enemy.broodWardenAttackCount % 3 === 1) {
            enemy.broodWardenPhase = "cleave-windup";
            enemy.broodWardenPhaseRemainingSeconds = [0.58, 0.48, 0.38][enrageTier]!;
          } else if (enemy.broodWardenAttackCount % 3 === 2) {
            enemy.broodWardenPhase = "acid-windup";
            enemy.broodWardenPhaseRemainingSeconds = [0.7, 0.58, 0.46][enrageTier]!;
          } else {
            enemy.broodWardenPhase = "egg-windup";
            enemy.broodWardenPhaseRemainingSeconds = [0.72, 0.58, 0.45][enrageTier]!;
          }
        }
        break;
      case "cleave-windup":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          const radiusMetres = [2.5, 2.75, 3][enrageTier]!;
          enemy.broodWardenPhase = "cleave";
          enemy.broodWardenPhaseRemainingSeconds = 0.25;
          this.frameEvents.push({ type: "brood-cleave", position: { ...enemy.position }, radiusMetres });
          if (playerDistance <= radiusMetres + PLAYER_RADIUS_METRES) {
            this.damagePlayer([20, 25, 31][enrageTier]!);
          }
        }
        break;
      case "acid-windup":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenPhase = "acid-volley";
          enemy.broodWardenPhaseRemainingSeconds = 0.3;
          this.launchBroodAcidVolley(enemy, [3, 4, 5][enrageTier]!);
        }
        break;
      case "egg-windup":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenPhase = "egg-lay";
          enemy.broodWardenPhaseRemainingSeconds = 0.32;
          this.layBroodEggs(enemy, [2, 2, 3][enrageTier]!);
        }
        break;
      case "rush-windup":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          const count = enrageTier === 2 ? 6 : 4;
          enemy.broodWardenRushUsed = true;
          enemy.broodWardenPhase = "swarm-rush";
          enemy.broodWardenPhaseRemainingSeconds = enrageTier === 2 ? 0.75 : 0.65;
          this.spawnBroodSwarm(enemy, count);
        }
        break;
      case "swarm-rush":
        this.moveEnemy(enemy, enemy.broodWardenDirection, enrageTier === 2 ? 7.8 : 6.8, deltaSeconds);
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenPhase = "recovery";
          enemy.broodWardenPhaseRemainingSeconds = recoverySeconds;
        }
        break;
      case "cleave":
      case "acid-volley":
      case "egg-lay":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenPhase = "recovery";
          enemy.broodWardenPhaseRemainingSeconds = recoverySeconds;
        }
        break;
      case "recovery":
        if (enemy.broodWardenPhaseRemainingSeconds <= 0) {
          enemy.broodWardenPhase = "stalk";
          enemy.broodWardenPhaseRemainingSeconds = [0.9, 0.72, 0.55][enrageTier]!;
        }
        break;
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
      this.enemyProjectiles.push({
        id: this.nextId(),
        type: "brood-acid",
        position: start,
        velocity: { x: direction.x * speed, y: direction.y * speed },
        target: projectileTarget,
        remainingSeconds: distance(start, projectileTarget) / speed,
        damage: 11,
        createsPuddle: false,
        dead: false,
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
    const count = Math.max(0, Math.min(requestedCount, 6 - liveEggs));
    for (let index = 0; index < count; index += 1) {
      const angle = (index / Math.max(count, 1)) * Math.PI * 2 + this.random() * 0.45;
      this.spawnEnemy("egg-cluster", {
        x: clamp(enemy.position.x + Math.cos(angle) * 2.2, 0.8, this.widthMetres - 0.8),
        y: clamp(enemy.position.y + Math.sin(angle) * 2.2, 0.8, this.heightMetres - 0.8),
      });
    }
    this.frameEvents.push({ type: "brood-eggs-laid", position: { ...enemy.position }, count });
  }

  private spawnBroodSwarm(enemy: EnemyState, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      this.spawnEnemy("scuttler", {
        x: clamp(enemy.position.x + Math.cos(angle) * 1.7, 0.6, this.widthMetres - 0.6),
        y: clamp(enemy.position.y + Math.sin(angle) * 1.7, 0.6, this.heightMetres - 0.6),
      });
    }
    this.frameEvents.push({ type: "brood-swarm-rush", position: { ...enemy.position }, count });
  }

  private updateBastionEater(enemy: EnemyState, deltaSeconds: number): void {
    const healthRatio = enemy.health / enemy.maxHealth;
    const phase: BastionEaterPhase = healthRatio <= 0.33
      ? "last-stand"
      : healthRatio <= 0.66 ? "brood" : "breach";
    if (phase !== enemy.bastionEaterPhase) {
      enemy.bastionEaterPhase = phase;
      enemy.bastionEaterAction = "entrance";
      enemy.bastionEaterActionRemainingSeconds = 0.8;
      this.frameEvents.push({ type: "bastion-eater-phase", position: { ...enemy.position }, phase });
      return;
    }

    enemy.bastionEaterActionRemainingSeconds -= deltaSeconds;
    const action = enemy.bastionEaterAction;
    const recoverySeconds = phase === "last-stand" ? 0.55 : phase === "brood" ? 0.78 : 1;
    switch (action) {
      case "entrance":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "stalk";
          enemy.bastionEaterActionRemainingSeconds = phase === "last-stand" ? 0.38 : 0.65;
        }
        break;
      case "stalk": {
        enemy.facingDirection = normalizeVector({
          x: this.playerPosition.x - enemy.position.x,
          y: this.playerPosition.y - enemy.position.y,
        });
        if (phase !== "brood") {
          this.moveEnemy(
            enemy,
            enemy.facingDirection,
            phase === "last-stand" ? 1.25 : ENEMY_CATALOG["bastion-eater"].movementSpeedMetresPerSecond,
            deltaSeconds,
          );
        }
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAttackCount += 1;
          if (phase === "breach") {
            this.beginBastionEaterAction(enemy, enemy.bastionEaterAttackCount % 2 === 0 ? "charge-windup" : "claw-windup");
          } else if (phase === "brood") {
            this.beginBastionEaterAction(enemy, enemy.bastionEaterAttackCount % 2 === 0 ? "egg-windup" : "tendril-windup");
          } else {
            const cycle = enemy.bastionEaterAttackCount % 3;
            this.beginBastionEaterAction(enemy, cycle === 0 ? "breach-windup" : cycle === 1 ? "claw-windup" : "tendril-windup");
          }
        }
        break;
      }
      case "claw-windup":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "claw";
          enemy.bastionEaterActionRemainingSeconds = 0.28;
          this.frameEvents.push({
            type: "bastion-eater-claw-strike",
            position: { ...enemy.position },
            direction: { ...enemy.bastionEaterDirection },
          });
          if (pointInsideRipperSweep(enemy.position, enemy.bastionEaterDirection, this.playerPosition, 4.4)) {
            this.damagePlayer(phase === "last-stand" ? 34 : 27);
          }
        }
        break;
      case "charge-windup":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "charge";
          enemy.bastionEaterActionRemainingSeconds = 0.85;
          this.frameEvents.push({ type: "bastion-eater-charge", position: { ...enemy.position }, direction: { ...enemy.bastionEaterDirection } });
        }
        break;
      case "charge": {
        const speed = phase === "last-stand" ? 9.2 : 7.8;
        const desired = {
          x: enemy.position.x + enemy.bastionEaterDirection.x * speed * deltaSeconds,
          y: enemy.position.y + enemy.bastionEaterDirection.y * speed * deltaSeconds,
        };
        const obstacle = this.firstCollidingObstacle(desired, ENEMY_CATALOG["bastion-eater"].radiusMetres);
        if (obstacle) {
          this.damageObstacle(obstacle.id, { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 });
          this.damageObstacle(obstacle.id, { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 });
          this.finishBastionEaterAction(enemy, recoverySeconds);
        } else {
          this.moveEnemy(enemy, enemy.bastionEaterDirection, speed, deltaSeconds);
          if (enemy.bastionEaterActionRemainingSeconds <= 0) this.finishBastionEaterAction(enemy, recoverySeconds);
        }
        break;
      }
      case "tendril-windup":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "tendril";
          enemy.bastionEaterActionRemainingSeconds = 0.32;
          const radiusMetres = phase === "last-stand" ? 5.6 : 5;
          this.frameEvents.push({ type: "bastion-eater-tendril", position: { ...enemy.position }, radiusMetres, warning: false });
          const playerDistance = distance(enemy.position, this.playerPosition);
          if (playerDistance >= 2.25 && playerDistance <= radiusMetres + PLAYER_RADIUS_METRES) {
            this.damagePlayer(phase === "last-stand" ? 30 : 23);
          }
        }
        break;
      case "egg-windup":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "eggs";
          enemy.bastionEaterActionRemainingSeconds = 0.35;
          const before = this.enemies.filter((candidate) => !candidate.dead && candidate.type === "egg-cluster").length;
          this.layBroodEggs(enemy, phase === "last-stand" ? 1 : 2);
          const after = this.enemies.filter((candidate) => !candidate.dead && candidate.type === "egg-cluster").length;
          this.frameEvents.push({ type: "bastion-eater-eggs", position: { ...enemy.position }, count: after - before });
        }
        break;
      case "breach-windup":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "breach";
          enemy.bastionEaterActionRemainingSeconds = 0.3;
          const radiusMetres = 2.15;
          this.frameEvents.push({ type: "bastion-eater-breach", position: { ...enemy.bastionEaterTarget }, radiusMetres, warning: false });
          if (distance(enemy.bastionEaterTarget, this.playerPosition) <= radiusMetres + PLAYER_RADIUS_METRES) this.damagePlayer(32);
        }
        break;
      case "claw":
      case "tendril":
      case "eggs":
      case "breach":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) this.finishBastionEaterAction(enemy, recoverySeconds);
        break;
      case "recovery":
        if (enemy.bastionEaterActionRemainingSeconds <= 0) {
          enemy.bastionEaterAction = "stalk";
          enemy.bastionEaterActionRemainingSeconds = phase === "last-stand" ? 0.32 : 0.58;
        }
        break;
    }
  }

  private beginBastionEaterAction(enemy: EnemyState, action: BastionEaterAction): void {
    enemy.bastionEaterAction = action;
    enemy.bastionEaterDirection = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    enemy.bastionEaterTarget = { ...this.playerPosition };
    const lastStand = enemy.bastionEaterPhase === "last-stand";
    enemy.bastionEaterActionRemainingSeconds = lastStand ? 0.5 : 0.72;
    if (action === "claw-windup") {
      this.frameEvents.push({ type: "bastion-eater-claw-warning", position: { ...enemy.position }, direction: { ...enemy.bastionEaterDirection } });
    } else if (action === "tendril-windup") {
      this.frameEvents.push({ type: "bastion-eater-tendril", position: { ...enemy.position }, radiusMetres: lastStand ? 5.6 : 5, warning: true });
    } else if (action === "breach-windup") {
      this.frameEvents.push({ type: "bastion-eater-breach", position: { ...enemy.bastionEaterTarget }, radiusMetres: 2.15, warning: true });
    }
  }

  private finishBastionEaterAction(enemy: EnemyState, recoverySeconds: number): void {
    enemy.bastionEaterAction = "recovery";
    enemy.bastionEaterActionRemainingSeconds = recoverySeconds;
  }

  private firstCollidingObstacle(position: Vector2Data, radius: number) {
    return this.activeObstacles().find((obstacle) => (
      position.x + radius > obstacle.x
      && position.x - radius < obstacle.x + obstacle.width
      && position.y + radius > obstacle.y
      && position.y - radius < obstacle.y + obstacle.height
    ));
  }

  private damageObstacle(obstacleId: string, position: Vector2Data): void {
    const damage = Math.min((this.obstacleDamage.get(obstacleId) ?? 0) + 1, 2);
    this.obstacleDamage.set(obstacleId, damage);
    this.frameEvents.push({
      type: damage >= 2 ? "obstacle-destroyed" : "obstacle-damaged",
      obstacleId,
      position: { ...position },
    });
  }

  private emitCrusherShockwave(position: Vector2Data, radiusMetres = 2.2, damage = 16): void {
    this.frameEvents.push({ type: "mini-boss-shockwave", position: { ...position }, radiusMetres });
    if (distance(position, this.playerPosition) <= radiusMetres + PLAYER_RADIUS_METRES) {
      this.damagePlayer(damage);
    }
  }

  private updateSlimeSpitter(enemy: EnemyState, deltaSeconds: number): void {
    enemy.spitterPhaseRemainingSeconds -= deltaSeconds;
    const playerDistance = distance(enemy.position, this.playerPosition);

    switch (enemy.spitterPhase) {
      case "positioning":
        if (playerDistance > 8) {
          this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG["slime-spitter"].movementSpeedMetresPerSecond, deltaSeconds);
        } else if (playerDistance < 5) {
          const away = normalizeVector({
            x: enemy.position.x - this.playerPosition.x,
            y: enemy.position.y - this.playerPosition.y,
          });
          this.moveEnemy(enemy, away, ENEMY_CATALOG["slime-spitter"].movementSpeedMetresPerSecond, deltaSeconds);
        }
        if (enemy.spitterPhaseRemainingSeconds <= 0 && playerDistance <= 10) {
          enemy.spitterPhase = "windup";
          enemy.spitterPhaseRemainingSeconds = 0.65;
          enemy.spitterTarget = { ...this.playerPosition };
          this.frameEvents.push({
            type: "slime-spit-windup",
            position: { ...enemy.position },
            target: { ...enemy.spitterTarget },
          });
        }
        break;
      case "windup":
        if (enemy.spitterPhaseRemainingSeconds <= 0) {
          this.launchSlimeGlob(enemy);
          enemy.spitterPhase = "recover";
          enemy.spitterPhaseRemainingSeconds = 1.1;
        }
        break;
      case "recover":
        if (enemy.spitterPhaseRemainingSeconds <= 0) {
          enemy.spitterPhase = "positioning";
          enemy.spitterPhaseRemainingSeconds = 0.85 + this.random() * 0.35;
        }
        break;
    }
  }

  private updateQuillback(enemy: EnemyState, deltaSeconds: number): void {
    enemy.quillbackPhaseRemainingSeconds -= deltaSeconds;
    const playerDistance = distance(enemy.position, this.playerPosition);
    const towardPlayer = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });

    switch (enemy.quillbackPhase) {
      case "positioning":
        if (playerDistance < 4.5) {
          this.moveEnemy(
            enemy,
            { x: -towardPlayer.x, y: -towardPlayer.y },
            ENEMY_CATALOG.quillback.movementSpeedMetresPerSecond * 1.15,
            deltaSeconds,
          );
        } else if (playerDistance > 9.5) {
          this.moveEnemy(enemy, towardPlayer, ENEMY_CATALOG.quillback.movementSpeedMetresPerSecond, deltaSeconds);
        } else {
          enemy.facingDirection = towardPlayer;
        }
        if (enemy.quillbackPhaseRemainingSeconds <= 0 && playerDistance >= 4.75 && playerDistance <= 10.5) {
          enemy.quillbackPhase = "windup";
          enemy.quillbackShotCount = quillbackVolleyCount(enemy.quillbackAttackCount);
          enemy.quillbackPhaseRemainingSeconds = 0.62 + (enemy.quillbackShotCount - 1) * 0.055;
          enemy.quillbackDirection = towardPlayer;
          enemy.facingDirection = towardPlayer;
          this.frameEvents.push({
            type: "quillback-windup",
            position: { ...enemy.position },
            direction: { ...enemy.quillbackDirection },
            count: enemy.quillbackShotCount,
          });
        }
        break;
      case "windup":
        if (enemy.quillbackPhaseRemainingSeconds <= 0) {
          this.launchQuillbackVolley(enemy);
          enemy.quillbackAttackCount += 1;
          enemy.quillbackPhase = "recover";
          enemy.quillbackPhaseRemainingSeconds = enemy.quillbackShotCount === 1
            ? 1.15
            : enemy.quillbackShotCount === 3 ? 1.45 : 1.75;
        }
        break;
      case "recover":
        if (enemy.quillbackPhaseRemainingSeconds <= 0) {
          enemy.quillbackPhase = "positioning";
          enemy.quillbackPhaseRemainingSeconds = 0.4;
        }
        break;
    }
  }

  private launchQuillbackVolley(enemy: EnemyState): void {
    const directions = createQuillbackFanDirections(
      enemy.quillbackDirection,
      enemy.quillbackShotCount,
      QUILLBACK_FAN_ARC_RADIANS,
    );
    for (const direction of directions) {
      const start = {
        x: enemy.position.x + direction.x * 0.72,
        y: enemy.position.y + direction.y * 0.72,
      };
      const target = {
        x: start.x + direction.x * QUILLBACK_PROJECTILE_RANGE_METRES,
        y: start.y + direction.y * QUILLBACK_PROJECTILE_RANGE_METRES,
      };
      this.enemyProjectiles.push({
        id: this.nextId(),
        type: "quill-spike",
        position: start,
        velocity: {
          x: direction.x * QUILLBACK_PROJECTILE_SPEED,
          y: direction.y * QUILLBACK_PROJECTILE_SPEED,
        },
        target,
        remainingSeconds: QUILLBACK_PROJECTILE_RANGE_METRES / QUILLBACK_PROJECTILE_SPEED,
        damage: QUILLBACK_SPIKE_DAMAGE,
        createsPuddle: false,
        dead: false,
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
    enemy.spinewheelPhaseRemainingSeconds -= deltaSeconds;
    enemy.spinewheelPlayerHitCooldownSeconds = Math.max(
      0,
      enemy.spinewheelPlayerHitCooldownSeconds - deltaSeconds,
    );
    const towardPlayer = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });

    switch (enemy.spinewheelPhase) {
      case "positioning":
        enemy.facingDirection = towardPlayer;
        if (distance(enemy.position, this.playerPosition) > 6.5) {
          this.moveEnemy(
            enemy,
            towardPlayer,
            ENEMY_CATALOG.spinewheel.movementSpeedMetresPerSecond,
            deltaSeconds,
          );
        }
        if (enemy.spinewheelPhaseRemainingSeconds <= 0) {
          enemy.spinewheelPhase = "windup";
          enemy.spinewheelPhaseRemainingSeconds = SPINEWHEEL_WINDUP_SECONDS;
          enemy.spinewheelDirection = towardPlayer;
          enemy.facingDirection = towardPlayer;
          this.frameEvents.push({
            type: "spinewheel-windup",
            position: { ...enemy.position },
            direction: { ...towardPlayer },
          });
        }
        break;
      case "windup":
        if (enemy.spinewheelPhaseRemainingSeconds <= 0) {
          enemy.spinewheelPhase = "rolling";
          enemy.spinewheelPhaseRemainingSeconds = SPINEWHEEL_MAX_ROLL_SECONDS;
          enemy.spinewheelSpeedMetresPerSecond = SPINEWHEEL_BASE_ROLL_SPEED;
          enemy.spinewheelBouncesRemaining = SPINEWHEEL_MAX_REBOUNDS;
        }
        break;
      case "rolling": {
        const previous = { ...enemy.position };
        const reflection = stepSpinewheelReflection(
          previous,
          enemy.spinewheelDirection,
          enemy.spinewheelSpeedMetresPerSecond * this.enemyStatusSpeedMultiplier(enemy) * deltaSeconds,
          ENEMY_CATALOG.spinewheel.radiusMetres,
          this.collisionArena(),
        );
        enemy.position = reflection.position;
        enemy.spinewheelDirection = reflection.direction;
        enemy.facingDirection = reflection.direction;

        if (reflection.bounced) {
          if (enemy.spinewheelBouncesRemaining <= 0) {
            this.enterSpinewheelRecovery(enemy);
            break;
          }
          enemy.spinewheelBouncesRemaining -= 1;
          enemy.spinewheelSpeedMetresPerSecond *= SPINEWHEEL_BOUNCE_SPEED_MULTIPLIER;
          this.frameEvents.push({
            type: "spinewheel-bounce",
            position: { ...enemy.position },
            direction: { ...enemy.spinewheelDirection },
            bouncesRemaining: enemy.spinewheelBouncesRemaining,
          });
        }

        const crossedPlayer = distanceToSegment(this.playerPosition, previous, enemy.position)
          <= ENEMY_CATALOG.spinewheel.radiusMetres + PLAYER_RADIUS_METRES;
        if (
          crossedPlayer
          && enemy.spinewheelPlayerHitCooldownSeconds <= 0
          && !this.playerInvulnerable
          && this.playerHurtCooldownSeconds <= 0
        ) {
          this.damagePlayer(SPINEWHEEL_ROLL_DAMAGE);
          enemy.spinewheelPlayerHitCooldownSeconds = SPINEWHEEL_REPEAT_HIT_LOCKOUT_SECONDS;
          this.frameEvents.push({ type: "spinewheel-hit", position: { ...this.playerPosition } });
        }
        if (enemy.spinewheelPhaseRemainingSeconds <= 0) {
          this.enterSpinewheelRecovery(enemy);
        }
        break;
      }
      case "recovery":
        if (enemy.spinewheelPhaseRemainingSeconds <= 0) {
          enemy.spinewheelPhase = "positioning";
          enemy.spinewheelPhaseRemainingSeconds = 0.65;
        }
        break;
    }
  }

  private enterSpinewheelRecovery(enemy: EnemyState): void {
    enemy.spinewheelPhase = "recovery";
    enemy.spinewheelPhaseRemainingSeconds = SPINEWHEEL_RECOVERY_SECONDS;
    this.frameEvents.push({ type: "spinewheel-recovery", position: { ...enemy.position } });
  }

  private updateTetherBloom(enemy: EnemyState, deltaSeconds: number): void {
    enemy.tetherBloomPhaseRemainingSeconds -= deltaSeconds;
    const playerDistance = distance(enemy.position, this.playerPosition);
    const hasClearPath = !segmentHitsArenaObstacle(
      enemy.position,
      this.playerPosition,
      this.activeObstacles(),
    );

    switch (enemy.tetherBloomPhase) {
      case "idle":
        if (
          enemy.tetherBloomPhaseRemainingSeconds <= 0
          && this.activeTetherEnemyId === null
          && playerDistance <= TETHER_BLOOM_ACQUISITION_RANGE_METRES
          && hasClearPath
        ) {
          this.activeTetherEnemyId = enemy.id;
          enemy.tetherBloomPhase = "windup";
          enemy.tetherBloomPhaseRemainingSeconds = TETHER_BLOOM_WINDUP_SECONDS;
          enemy.tetherBloomTarget = { ...this.playerPosition };
          this.frameEvents.push({
            type: "tether-bloom-windup",
            position: { ...enemy.position },
            target: { ...enemy.tetherBloomTarget },
          });
        }
        break;
      case "windup":
        if (this.heroState === "evading") {
          this.breakTetherBloom(enemy, "evasive");
        } else if (playerDistance > TETHER_BLOOM_HARD_RANGE_METRES || !hasClearPath) {
          this.breakTetherBloom(enemy, "range");
        } else if (enemy.tetherBloomPhaseRemainingSeconds <= 0) {
          enemy.tetherBloomPhase = "tethering";
          enemy.tetherBloomPhaseRemainingSeconds = TETHER_BLOOM_DURATION_SECONDS;
          enemy.tetherBloomDamageDuringGrab = 0;
          this.frameEvents.push({ type: "tether-bloom-latched", position: { ...enemy.position } });
        }
        break;
      case "tethering": {
        if (this.activeTetherEnemyId !== enemy.id) {
          enemy.tetherBloomPhase = "recovery";
          enemy.tetherBloomPhaseRemainingSeconds = TETHER_BLOOM_RECOVERY_SECONDS;
          break;
        }
        if (this.heroState === "evading") {
          this.breakTetherBloom(enemy, "evasive");
          break;
        }
        if (playerDistance > TETHER_BLOOM_HARD_RANGE_METRES || !hasClearPath) {
          this.breakTetherBloom(enemy, "range");
          break;
        }

        const minimumDistance = ENEMY_CATALOG["tether-bloom"].radiusMetres + PLAYER_RADIUS_METRES + 0.15;
        const pullDistance = Math.min(
          TETHER_BLOOM_PULL_SPEED_METRES_PER_SECOND * deltaSeconds,
          Math.max(0, playerDistance - minimumDistance),
        );
        if (pullDistance > 0) {
          const towardBloom = normalizeVector({
            x: enemy.position.x - this.playerPosition.x,
            y: enemy.position.y - this.playerPosition.y,
          });
          this.playerPosition = resolveCircleMovement(
            this.playerPosition,
            {
              x: this.playerPosition.x + towardBloom.x * pullDistance,
              y: this.playerPosition.y + towardBloom.y * pullDistance,
            },
            PLAYER_RADIUS_METRES,
            this.collisionArena(),
          );
        }
        if (enemy.tetherBloomPhaseRemainingSeconds <= 0) {
          this.releaseTetherBloom(enemy);
        }
        break;
      }
      case "recovery":
        if (enemy.tetherBloomPhaseRemainingSeconds <= 0) {
          enemy.tetherBloomPhase = "idle";
          enemy.tetherBloomPhaseRemainingSeconds = 0.6;
        }
        break;
    }
  }

  private breakTetherBloom(
    enemy: EnemyState,
    reason: "evasive" | "damage" | "range",
  ): void {
    if (this.activeTetherEnemyId === enemy.id) this.activeTetherEnemyId = null;
    enemy.tetherBloomPhase = "recovery";
    enemy.tetherBloomPhaseRemainingSeconds = TETHER_BLOOM_RECOVERY_SECONDS;
    this.frameEvents.push({
      type: "tether-bloom-broken",
      position: { ...enemy.position },
      reason,
    });
  }

  private releaseTetherBloom(enemy: EnemyState): void {
    if (this.activeTetherEnemyId === enemy.id) this.activeTetherEnemyId = null;
    enemy.tetherBloomPhase = "recovery";
    enemy.tetherBloomPhaseRemainingSeconds = TETHER_BLOOM_RECOVERY_SECONDS;
    this.frameEvents.push({ type: "tether-bloom-released", position: { ...enemy.position } });
  }

  private launchSlimeGlob(enemy: EnemyState): void {
    const direction = normalizeVector({
      x: enemy.spitterTarget.x - enemy.position.x,
      y: enemy.spitterTarget.y - enemy.position.y,
    });
    const speed = 7;
    const start = {
      x: enemy.position.x + direction.x * 0.7,
      y: enemy.position.y + direction.y * 0.7,
    };
    this.enemyProjectiles.push({
      id: this.nextId(),
      type: "slime-glob",
      position: start,
      velocity: { x: direction.x * speed, y: direction.y * speed },
      target: { ...enemy.spitterTarget },
      remainingSeconds: Math.max(0.12, distance(start, enemy.spitterTarget) / speed),
      damage: SLIME_GLOB_DAMAGE,
      createsPuddle: true,
      dead: false,
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

      if (pointHitsObstacle(projectile.position, this.activeObstacles())) {
        projectile.position = previous;
        this.resolveEnemyProjectileImpact(projectile);
      } else if (distanceToSegment(this.playerPosition, previous, projectile.position) <= PLAYER_RADIUS_METRES + 0.3) {
        this.resolveEnemyProjectileImpact(projectile);
      } else if (projectile.remainingSeconds <= 0) {
        projectile.position = { ...projectile.target };
        this.resolveEnemyProjectileImpact(projectile);
      }
    }
  }

  private resolveEnemyProjectileImpact(projectile: EnemyProjectileState): void {
    projectile.dead = true;
    const createdPuddle = projectile.createsPuddle && this.createSlowingPuddle(projectile.position);
    const hitPlayer = distance(projectile.position, this.playerPosition) <= PLAYER_RADIUS_METRES + 0.45;
    if (projectile.type === "brood-acid") {
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
      this.damagePlayer(projectile.damage);
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
    while (this.groundHazards.length > MAX_SLOWING_PUDDLES) this.groundHazards.shift();
    return true;
  }

  private updateGroundHazards(deltaSeconds: number): void {
    for (const hazard of this.groundHazards) hazard.remainingSeconds -= deltaSeconds;
    this.groundHazards = this.groundHazards.filter((hazard) => hazard.remainingSeconds > 0);
  }

  private isPlayerSlowed(): boolean {
    return this.groundHazards.some((hazard) => (
      distance(hazard.position, this.playerPosition) <= hazard.radiusMetres + PLAYER_RADIUS_METRES * 0.35
    ));
  }

  private moveEnemyTowardPlayer(enemy: EnemyState, speed: number, deltaSeconds: number): void {
    const direction = normalizeVector({
      x: this.playerPosition.x - enemy.position.x,
      y: this.playerPosition.y - enemy.position.y,
    });
    this.moveEnemy(enemy, direction, speed, deltaSeconds);
  }

  private moveEnemy(
    enemy: EnemyState,
    direction: Vector2Data,
    speed: number,
    deltaSeconds: number,
  ): void {
    const radius = ENEMY_CATALOG[enemy.type].radiusMetres;
    const effectiveSpeed = speed * this.enemyStatusSpeedMultiplier(enemy);
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
      const contactDamage = enemy.rank === "elite"
        ? Math.round(definition.contactDamage * 1.4)
        : definition.contactDamage;
      if (
        contactDamage > 0
        && enemy.attackCooldownSeconds <= 0
        && distance(enemy.position, this.playerPosition) <= definition.radiusMetres + PLAYER_RADIUS_METRES
      ) {
        this.damagePlayer(contactDamage);
        enemy.attackCooldownSeconds = 0.8;
        break;
      }
    }
  }

  private damagePlayer(rawDamage: number): void {
    if (rawDamage <= 0 || this.playerInvulnerable || this.playerHurtCooldownSeconds > 0) return;
    const absorption = absorbWithShield(this.playerShield, rawDamage);
    this.playerShield = absorption.remainingShield;
    this.shieldRechargeCooldownSeconds = this.defence.shieldRechargeDelaySeconds;
    if (absorption.remainingDamage > 0) {
      const entrenchedBonus = this.isPlayerEntrenched() ? MARINE.passive.bonusArmour : 0;
      const mitigated = mitigateDamage(
        absorption.remainingDamage,
        this.defence.armour + entrenchedBonus,
        this.defence.flatDamageReduction,
      );
      this.playerHealth = Math.max(0, this.playerHealth - mitigated);
    }
    this.playerHurtCooldownSeconds = this.defence.hitInvulnerabilitySeconds;
    this.frameEvents.push({
      type: "player-hit",
      position: { ...this.playerPosition },
      damage: rawDamage,
    });
    if (this.playerHealth <= 0) this.status = "defeat";
  }

  private updateExperiencePickups(deltaSeconds: number): void {
    const magnetBoost = this.isBuffActive("magnet-pulse") ? MAGNET_PULSE_MULTIPLIER : 1;
    const attractionRadius = 2.2 * this.magnetMultiplier * magnetBoost;
    const collectionRadius = 0.5 * this.magnetMultiplier * magnetBoost;

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
      this.playerShield += AEGIS_SHIELD_AMOUNT;
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
      if (reward.type === "mini-boss-arsenal-cache") {
        this.playerHealth = Math.min(PLAYER_MAX_HEALTH, this.playerHealth + 30);
        this.addExperience(this.experienceThreshold() * 2);
      } else {
        this.addExperience(this.experienceThreshold());
      }
      break;
    }
  }

  private damageEnemy(enemy: EnemyState, rawDamage: number, damageType: DamageType = "physical"): void {
    if (enemy.dead || rawDamage <= 0) {
      return;
    }

    const definition = ENEMY_CATALOG[enemy.type];
    const resistanceMultiplier = definition.resistances[damageType] ?? 1;
    const corrodeActive = (enemy.statusTimers.corrode ?? 0) > 0;
    const effectiveArmour = Math.max(
      definition.armour - (corrodeActive ? STATUS_RULES.corrode.armourReduction : 0),
      0,
    );
    let mitigated = mitigateDamage(
      rawDamage * resistanceMultiplier,
      effectiveArmour,
      definition.flatDamageReduction,
    );
    if (enemy.type === "bastion-eater" && enemy.bastionEaterAction !== "recovery") {
      mitigated *= 0.35;
    }

    const status = STATUS_BY_DAMAGE_TYPE[damageType];
    if (status && this.canStatusApply(enemy, status)) {
      const buildup = (enemy.statusBuildup[status] ?? 0) + mitigated;
      if (buildup >= STATUS_BUILDUP_THRESHOLD) {
        enemy.statusBuildup[status] = 0;
        enemy.statusTimers[status] = STATUS_RULES[status].durationSeconds;
        this.frameEvents.push({
          type: "status-applied",
          position: { ...enemy.position },
          status,
        });
      } else {
        enemy.statusBuildup[status] = buildup;
      }
    }

    this.frameEvents.push({ type: "enemy-hit", position: { ...enemy.position } });
    if (enemy.type === "tether-bloom" && enemy.tetherBloomPhase === "tethering") {
      enemy.tetherBloomDamageDuringGrab += mitigated;
      if (enemy.tetherBloomDamageDuringGrab >= TETHER_BLOOM_BREAK_DAMAGE) {
        this.breakTetherBloom(enemy, "damage");
      }
    }
    this.applyRawDamage(enemy, mitigated);
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

    enemy.health -= damage;
    if (enemy.health > 0) {
      return;
    }

    enemy.dead = true;
    this.frameEvents.push({
      type: "enemy-defeated",
      position: { ...enemy.position },
      enemyType: enemy.type,
    });
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
        this.damagePlayer(BLAST_MITE_EXPLOSION_DAMAGE);
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
    const experienceValue = ENEMY_CATALOG[enemy.type].experienceValue;
    if (experienceValue > 0) {
      this.pickups.push({
        id: this.nextId(),
        position: { ...enemy.position },
        value: experienceValue,
        collected: false,
      });
    }
  }

  private removeDeadEntities(): void {
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    this.enemyProjectiles = this.enemyProjectiles.filter((projectile) => !projectile.dead);
    this.pickups = this.pickups.filter((pickup) => !pickup.collected);
    this.powerups = this.powerups.filter((powerup) => !powerup.collected);
    this.eliteRewards = this.eliteRewards.filter((reward) => !reward.collected);
  }

  private updateWaveSpawns(deltaSeconds: number): void {
    this.waveElapsedSeconds += deltaSeconds;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0]!.atSeconds <= this.waveElapsedSeconds) {
      const spawn = this.spawnQueue.shift()!;
      if (spawn.rank === "elite") {
        this.spawnElite("carapace-scuttler");
      } else if (spawn.rank === "mini-boss") {
        this.spawnMiniBoss(this.pickMiniBoss());
      } else {
        this.spawnEnemy(spawn.type);
      }
    }
  }

  private updateEncounterProgress(deltaSeconds: number): void {
    if (
      this.status === "combat"
      && this.spawnQueue.length === 0
      && this.enemies.length === 0
      && this.enemyProjectiles.length === 0
    ) {
      if (this.waveIndex >= TOTAL_WAVES - 1) {
        this.status = "victory";
      } else {
        this.status = "intermission";
        this.intermissionRemainingSeconds = INTERMISSION_SECONDS;
        this.queueIntermissionReward();
      }
      return;
    }

    if (this.status === "intermission") {
      this.intermissionRemainingSeconds -= deltaSeconds;
      if (this.intermissionRemainingSeconds <= 0) {
        this.beginWave(this.waveIndex + 1);
      }
    }
  }

  private queueIntermissionReward(): void {
    if (this.waveIndex === 0 || this.waveIndex === 2) {
      const chest = this.buildWeaponChestDecision();
      this.decisionQueue.push(chest ?? this.buildUpgradeDecision());
    } else if (this.waveIndex === 1 || this.waveIndex === 3) {
      this.decisionQueue.push(this.buildSupplyDepotDecision());
    }
  }

  private beginWave(index: number): void {
    this.waveIndex = index;
    this.waveElapsedSeconds = 0;
    this.status = "combat";
    this.spawnQueue = buildWave(index);
    if (index >= 1) {
      this.spawnPowerup(POWERUP_WAVE_CYCLE[(index - 1) % POWERUP_WAVE_CYCLE.length]!);
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

  private populateSlimeSpitterScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    for (const offset of [
      { x: -7, y: -4 },
      { x: 7, y: -3 },
      { x: 6, y: 4 },
    ]) {
      this.spawnEnemy("slime-spitter", { x: centre.x + offset.x, y: centre.y + offset.y });
    }
    this.spawnEnemy("scuttler", { x: centre.x - 6, y: centre.y + 3.5 });
  }

  private populateCarapaceEliteScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    this.spawnElite("carapace-scuttler", { x: centre.x + 6.5, y: centre.y });
    this.spawnEnemy("scuttler", { x: centre.x - 5.5, y: centre.y - 3 });
    this.spawnEnemy("scuttler", { x: centre.x - 6.5, y: centre.y + 3 });
  }

  private populateSiegeCrusherScenario(): void {
    this.spawnMiniBoss("siege-crusher", { x: 4, y: 14 });
    this.spawnEnemy("scuttler", { x: 25, y: 3 });
    this.spawnEnemy("scuttler", { x: 26, y: 13 });
  }

  private populateBroodWardenScenario(): void {
    this.spawnMiniBoss("brood-warden", { x: 7, y: this.heightMetres / 2 });
    this.spawnEnemy("egg-cluster", { x: this.widthMetres - 8, y: 4 });
  }

  private populateRipperScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    this.spawnEnemy("ripper", { x: centre.x + 4.5, y: centre.y - 2.5 });
    this.spawnEnemy("ripper", { x: centre.x - 5, y: centre.y + 2.5 });
    this.spawnEnemy("scuttler", { x: centre.x + 6, y: centre.y + 3.5 });
  }

  private populateRazorScuttlerScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    this.spawnEnemy("razor-scuttler", { x: centre.x - 6.2, y: centre.y });
    this.spawnEnemy("razor-scuttler", { x: centre.x + 5.6, y: centre.y - 3.4 });
    this.spawnEnemy("scuttler", { x: centre.x + 4.8, y: centre.y + 4.2 });
  }

  private populateQuillbackScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    this.spawnEnemy("quillback", { x: centre.x + 7.5, y: centre.y });
    this.spawnEnemy("quillback", { x: centre.x - 7, y: centre.y - 3.5 });
    this.spawnEnemy("scuttler", { x: centre.x + 4.5, y: centre.y + 4 });
  }

  private populateSpinewheelScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    this.spawnEnemy("spinewheel", { x: centre.x - 7.5, y: centre.y });
    this.spawnEnemy("spinewheel", { x: centre.x + 6.5, y: centre.y - 4.5 });
    this.spawnEnemy("scuttler", { x: centre.x + 5, y: centre.y + 4.5 });
  }

  private populateTetherBloomScenario(): void {
    const centre = { x: this.widthMetres / 2, y: this.heightMetres / 2 };
    this.spawnEnemy("tether-bloom", { x: centre.x - 3.2, y: centre.y });
    this.spawnEnemy("tether-bloom", { x: centre.x + 4.6, y: centre.y - 2.8 });
    this.spawnEnemy("scuttler", { x: centre.x + 5.5, y: centre.y + 3.8 });
  }

  private populateBastionEaterScenario(): void {
    const id = this.spawnEnemy("bastion-eater", { x: this.widthMetres / 2 - 7, y: this.heightMetres / 2 });
    const boss = this.enemies.find((enemy) => enemy.id === id)!;
    boss.rank = "boss";
    boss.bastionEaterPhase = "breach";
    boss.bastionEaterAction = "entrance";
    boss.bastionEaterActionRemainingSeconds = 1.2;
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
    this.frameEvents.push({ type: "level-up", level: this.level });
    this.decisionQueue.push(this.buildUpgradeDecision());
  }

  private experienceThreshold(): number {
    return this.level * 4;
  }

  private enemySnapshot(enemy: EnemyState): EnemySnapshot {
    const definition = ENEMY_CATALOG[enemy.type];
    return {
      id: enemy.id,
      type: enemy.type,
      position: { ...enemy.position },
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      radiusMetres: definition.radiusMetres,
      hatchProgress: enemy.hatchDurationSeconds > 0
        ? 1 - enemy.hatchRemainingSeconds / enemy.hatchDurationSeconds
        : 0,
      brainPhase: enemy.type === "brain-blob" ? enemy.brainPhase : undefined,
      spitterPhase: enemy.type === "slime-spitter" ? enemy.spitterPhase : undefined,
      spitterTarget: enemy.type === "slime-spitter" && enemy.spitterPhase === "windup"
        ? { ...enemy.spitterTarget }
        : undefined,
      mitePhase: enemy.type === "blast-mite" ? enemy.mitePhase : undefined,
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
      bastionEaterPhase: enemy.type === "bastion-eater" ? enemy.bastionEaterPhase : undefined,
      bastionEaterAction: enemy.type === "bastion-eater" ? enemy.bastionEaterAction : undefined,
      bastionEaterDirection: enemy.type === "bastion-eater" ? { ...enemy.bastionEaterDirection } : undefined,
      bastionEaterTarget: enemy.type === "bastion-eater" ? { ...enemy.bastionEaterTarget } : undefined,
      bastionEaterNodeExposed: enemy.type === "bastion-eater" ? enemy.bastionEaterAction === "recovery" : undefined,
      rank: enemy.rank,
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
      facingDirection: { ...enemy.facingDirection },
      statuses: this.activeStatuses(enemy),
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
    return this.arena.obstacles.filter((obstacle) => (this.obstacleDamage.get(obstacle.id) ?? 0) < 2);
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

function buildWave(index: number): SpawnPlan[] {
  const plans: SpawnPlan[] = [];
  const add = (
    type: EnemyType,
    count: number,
    start: number,
    interval: number,
    rank?: SpawnPlan["rank"],
  ): void => {
    for (let item = 0; item < count; item += 1) {
      plans.push({ type, atSeconds: start + item * interval, rank });
    }
  };

  switch (index) {
    case 0:
      add("scuttler", 8, 0.2, 0.75);
      break;
    case 1:
      add("scuttler", 8, 0.2, 0.65);
      add("egg-cluster", 3, 1.4, 1.8);
      break;
    case 2:
      add("scuttler", 8, 0.2, 0.6);
      add("brain-blob", 3, 1.2, 1.6);
      add("slime-spitter", 2, 2.4, 2.8);
      add("blast-mite", 3, 3, 1.4);
      break;
    case 3:
      add("scuttler", 8, 0.2, 0.6);
      add("blast-mite", 4, 1, 1.2);
      add("slime-spitter", 2, 2, 2.6);
      add("warp-flanker", 3, 2.5, 1.8);
      add("scuttler", 1, 6, 1, "elite");
      break;
    default:
      add("siege-crusher", 1, 0.5, 1, "mini-boss");
      add("scuttler", 6, 2, 2.2);
      add("blast-mite", 4, 4, 2.4);
      add("warp-flanker", 3, 6, 3);
      break;
  }

  return plans.sort((left, right) => left.atSeconds - right.atSeconds);
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

export function siegeCrusherEnrageTier(health: number, maxHealth: number): 0 | 1 | 2 {
  const ratio = maxHealth > 0 ? health / maxHealth : 0;
  if (ratio <= 0.2) return 2;
  if (ratio <= 0.5) return 1;
  return 0;
}

export function broodWardenEnrageTier(health: number, maxHealth: number): 0 | 1 | 2 {
  return siegeCrusherEnrageTier(health, maxHealth);
}

export function selectMiniBossForRoll(roll: number): MiniBossKind {
  const index = Math.min(Math.floor(clamp(roll, 0, 0.999999) * MINI_BOSS_POOL.length), MINI_BOSS_POOL.length - 1);
  return MINI_BOSS_POOL[index]!;
}

export function pointInsideRipperSweep(
  origin: Vector2Data,
  direction: Vector2Data,
  point: Vector2Data,
  reachMetres: number,
  halfAngleRadians = Math.PI * 0.32,
): boolean {
  const offset = { x: point.x - origin.x, y: point.y - origin.y };
  const magnitude = Math.hypot(offset.x, offset.y);
  if (magnitude > reachMetres) return false;
  if (magnitude === 0) return true;
  const facing = normalizeVector(direction);
  const dot = (offset.x / magnitude) * facing.x + (offset.y / magnitude) * facing.y;
  return dot >= Math.cos(halfAngleRadians);
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
