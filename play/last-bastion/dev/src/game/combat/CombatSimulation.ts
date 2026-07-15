import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import { HeroMotionController } from "../hero/HeroMotionController";
import { MARINE } from "../hero/marine";
import { ENEMY_CATALOG, type EnemyType } from "../content/enemyCatalog";
import {
  BASTION_SERVICE_RIFLE,
  type WeaponId,
  type WeaponRuntimeStats,
} from "../content/weaponCatalog";
import {
  clampWeaponCount,
  createServiceRifleLoadout,
  createWeaponLoadout,
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
} from "../arena/ArenaDefinition";

export type EncounterStatus = "combat" | "intermission" | "victory" | "defeat";
export type BrainPhase = "drift" | "windup" | "lunge" | "recover";
export type SlimeSpitterPhase = "positioning" | "windup" | "recover";
export type EnemyRank = "standard" | "elite";
export type EliteKind = "carapace-scuttler";
export type CarapacePhase = "pursuit" | "windup" | "charge" | "recovery";
export type CombatScenario = "slime-spitter" | "carapace-elite";

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
  | { type: "elite-reward-collected"; position: Vector2Data };

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
  rank: EnemyRank;
  eliteKind?: EliteKind;
  carapacePhase?: CarapacePhase;
  facingDirection: Vector2Data;
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

export interface EnemyProjectileSnapshot {
  id: number;
  type: "slime-glob";
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
  type: "elite-upgrade-cache";
  position: Vector2Data;
}

export interface CombatSnapshot {
  status: EncounterStatus;
  waveNumber: number;
  totalWaves: number;
  playerPosition: Vector2Data;
  playerHealth: number;
  playerMaxHealth: number;
  playerInvulnerable: boolean;
  evasiveReady: boolean;
  evasiveCooldownRemainingSeconds: number;
  heroState: string;
  level: number;
  experience: number;
  experienceForNextLevel: number;
  pendingUpgradeChoices: readonly UpgradeDefinition[];
  enemies: readonly EnemySnapshot[];
  projectiles: readonly ProjectileSnapshot[];
  enemyProjectiles: readonly EnemyProjectileSnapshot[];
  groundHazards: readonly GroundHazardSnapshot[];
  eliteRewards: readonly EliteRewardSnapshot[];
  pickups: readonly ExperiencePickupSnapshot[];
  weapon: Readonly<WeaponRuntimeStats>;
  equippedWeapons: readonly Readonly<EquippedWeapon>[];
  events: readonly CombatEvent[];
  arena: Readonly<ArenaDefinition>;
  stressProfile: 4 | 12 | null;
  scenario: CombatScenario | null;
  playerSlowed: boolean;
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
  rank: EnemyRank;
  eliteKind?: EliteKind;
  carapacePhase: CarapacePhase;
  carapacePhaseRemainingSeconds: number;
  facingDirection: Vector2Data;
  maxHealth: number;
}

interface ProjectileState {
  id: number;
  weaponId: WeaponId;
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

interface EnemyProjectileState {
  id: number;
  type: "slime-glob";
  position: Vector2Data;
  velocity: Vector2Data;
  target: Vector2Data;
  remainingSeconds: number;
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
  type: "elite-upgrade-cache";
  position: Vector2Data;
  collected: boolean;
}

interface SpawnPlan {
  atSeconds: number;
  type: EnemyType;
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

const TOTAL_WAVES = 3;
const PLAYER_MAX_HEALTH = 100;
const PLAYER_RADIUS_METRES = 0.55;
const PLAYER_HURT_COOLDOWN_SECONDS = 0.65;
const INTERMISSION_SECONDS = 2;
const MAX_SLOWING_PUDDLES = 5;
const SLOWING_PUDDLE_DURATION_SECONDS = 4;
const SLOWING_PUDDLE_RADIUS_METRES = 1.25;
const SLIME_MOVEMENT_MULTIPLIER = 0.55;
const SLIME_GLOB_DAMAGE = 8;

export class CombatSimulation {
  readonly widthMetres: number;
  readonly heightMetres: number;
  readonly arena: Readonly<ArenaDefinition>;

  private readonly heroMotion = new HeroMotionController(MARINE);
  private playerPosition: Vector2Data;
  private playerHealth = PLAYER_MAX_HEALTH;
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
  private pickups: ExperiencePickupState[] = [];
  private nextEntityId = 1;
  private status: EncounterStatus = "combat";
  private waveIndex = 0;
  private waveElapsedSeconds = 0;
  private intermissionRemainingSeconds = 0;
  private spawnQueue: SpawnPlan[] = [];
  private level = 1;
  private experience = 0;
  private pendingUpgradeIds: UpgradeId[] = [];
  private randomState: number;
  private readonly wavesEnabled: boolean;
  private frameEvents: CombatEvent[] = [];
  private readonly stressProfile: 4 | 12 | null;
  private readonly scenario: CombatScenario | null;

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
    } else if (this.wavesEnabled) {
      this.beginWave(0);
    }
  }

  step(intent: PlayerIntent, deltaSeconds: number): CombatSnapshot {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.05);
    this.frameEvents = [];

    if (this.status === "defeat" || this.status === "victory" || this.pendingUpgradeIds.length > 0) {
      return this.snapshot();
    }

    for (const weapon of this.equippedWeapons) {
      weapon.cooldownSeconds = Math.max(0, weapon.cooldownSeconds - delta);
    }
    this.playerHurtCooldownSeconds = Math.max(0, this.playerHurtCooldownSeconds - delta);

    const motionFrame = this.heroMotion.update(intent, delta);
    this.heroState = motionFrame.state;
    this.playerInvulnerable = motionFrame.isInvulnerable;
    this.evasiveReady = motionFrame.evasiveReady;
    this.evasiveCooldownRemainingSeconds = motionFrame.evasiveCooldownRemainingSeconds;
    const movementMultiplier = motionFrame.state !== "evading" && this.isPlayerSlowed()
      ? SLIME_MOVEMENT_MULTIPLIER
      : 1;
    const previousPlayerPosition = { ...this.playerPosition };
    this.playerPosition = resolveCircleMovement(
      previousPlayerPosition,
      {
        x: previousPlayerPosition.x + motionFrame.displacementMetres.x * movementMultiplier,
        y: previousPlayerPosition.y + motionFrame.displacementMetres.y * movementMultiplier,
      },
      PLAYER_RADIUS_METRES,
      this.arena,
    );

    if (intent.aim.x !== 0 || intent.aim.y !== 0) {
      this.lastAimDirection = normalizeVector(intent.aim);
    }

    if (intent.fireHeld) {
      for (const weapon of this.equippedWeapons) {
        if (weapon.cooldownSeconds <= 0) {
          const fireDirection = this.resolveWeaponAimDirection(weapon, this.lastAimDirection);
          if (fireDirection) {
            this.fireWeapon(weapon, fireDirection);
            weapon.cooldownSeconds = weapon.stats.fireIntervalSeconds;
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
      rank: "standard",
      carapacePhase: "pursuit",
      carapacePhaseRemainingSeconds: 0,
      facingDirection: normalizeVector({
        x: this.playerPosition.x - spawnPosition.x,
        y: this.playerPosition.y - spawnPosition.y,
      }),
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

  addExperience(amount: number): void {
    this.experience += Math.max(0, Math.floor(amount));
    this.checkForLevelUp();
  }

  chooseUpgrade(upgradeId: UpgradeId): boolean {
    if (!this.pendingUpgradeIds.includes(upgradeId)) {
      return false;
    }

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
    }

    this.pendingUpgradeIds = [];
    this.checkForLevelUp();
    return true;
  }

  snapshot(): CombatSnapshot {
    return {
      status: this.status,
      waveNumber: this.waveIndex + 1,
      totalWaves: TOTAL_WAVES,
      playerPosition: { ...this.playerPosition },
      playerHealth: this.playerHealth,
      playerMaxHealth: PLAYER_MAX_HEALTH,
      playerInvulnerable: this.playerInvulnerable || this.playerHurtCooldownSeconds > 0,
      evasiveReady: this.evasiveReady,
      evasiveCooldownRemainingSeconds: this.evasiveCooldownRemainingSeconds,
      heroState: this.heroState,
      level: this.level,
      experience: this.experience,
      experienceForNextLevel: this.experienceThreshold(),
      pendingUpgradeChoices: this.pendingUpgradeIds.map((id) => UPGRADE_CATALOG[id]),
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

      if (pointHitsObstacle(projectile.position, this.arena.obstacles)) {
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
        this.damageEnemy(enemy, projectile.damage * damageMultiplier);
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
              this.damageEnemy(nearby, projectile.damage * 0.5);
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
      this.arena,
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
      this.damageEnemy(target, projectile.damage * 0.7);
      from = target;
    }
  }

  private updateEnemies(deltaSeconds: number): void {
    for (const enemy of [...this.enemies]) {
      if (enemy.dead) {
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
      }
    }
  }

  private updateEggCluster(enemy: EnemyState, deltaSeconds: number): void {
    enemy.hatchRemainingSeconds -= deltaSeconds;

    if (enemy.hatchRemainingSeconds > 0) {
      return;
    }

    enemy.dead = true;
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

      if (pointHitsObstacle(projectile.position, this.arena.obstacles)) {
        projectile.position = previous;
        this.resolveSlimeImpact(projectile);
      } else if (projectile.remainingSeconds <= 0) {
        projectile.position = { ...projectile.target };
        this.resolveSlimeImpact(projectile);
      }
    }
  }

  private resolveSlimeImpact(projectile: EnemyProjectileState): void {
    projectile.dead = true;
    const createdPuddle = this.createSlowingPuddle(projectile.position);
    this.frameEvents.push({
      type: "slime-impact",
      position: { ...projectile.position },
      createdPuddle,
    });
    if (distance(projectile.position, this.playerPosition) <= PLAYER_RADIUS_METRES + 0.45) {
      this.damagePlayer(SLIME_GLOB_DAMAGE);
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
    enemy.position = resolveCircleMovement(
      enemy.position,
      {
        x: enemy.position.x + direction.x * speed * deltaSeconds,
        y: enemy.position.y + direction.y * speed * deltaSeconds,
      },
      radius,
      this.arena,
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

  private damagePlayer(damage: number): void {
    if (damage <= 0 || this.playerInvulnerable || this.playerHurtCooldownSeconds > 0) return;
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.playerHurtCooldownSeconds = PLAYER_HURT_COOLDOWN_SECONDS;
    this.frameEvents.push({
      type: "player-hit",
      position: { ...this.playerPosition },
      damage,
    });
    if (this.playerHealth <= 0) this.status = "defeat";
  }

  private updateExperiencePickups(deltaSeconds: number): void {
    const attractionRadius = 2.2 * this.magnetMultiplier;
    const collectionRadius = 0.5 * this.magnetMultiplier;

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

  private updateEliteRewards(): void {
    if (this.pendingUpgradeIds.length > 0) return;
    for (const reward of this.eliteRewards) {
      if (reward.collected || distance(reward.position, this.playerPosition) > 0.8) continue;
      reward.collected = true;
      this.frameEvents.push({ type: "elite-reward-collected", position: { ...reward.position } });
      this.addExperience(this.experienceThreshold());
      break;
    }
  }

  private damageEnemy(enemy: EnemyState, damage: number): void {
    if (enemy.dead) {
      return;
    }

    enemy.health -= damage;
    this.frameEvents.push({ type: "enemy-hit", position: { ...enemy.position } });
    if (enemy.health > 0) {
      return;
    }

    enemy.dead = true;
    this.frameEvents.push({
      type: "enemy-defeated",
      position: { ...enemy.position },
      enemyType: enemy.type,
    });
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
    this.eliteRewards = this.eliteRewards.filter((reward) => !reward.collected);
  }

  private updateWaveSpawns(deltaSeconds: number): void {
    this.waveElapsedSeconds += deltaSeconds;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0]!.atSeconds <= this.waveElapsedSeconds) {
      const spawn = this.spawnQueue.shift()!;
      this.spawnEnemy(spawn.type);
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

  private beginWave(index: number): void {
    this.waveIndex = index;
    this.waveElapsedSeconds = 0;
    this.status = "combat";
    this.spawnQueue = buildWave(index);
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

  private checkForLevelUp(): void {
    if (this.pendingUpgradeIds.length > 0) {
      return;
    }

    const threshold = this.experienceThreshold();
    if (this.experience < threshold) {
      return;
    }

    this.experience -= threshold;
    this.level += 1;
    this.frameEvents.push({ type: "level-up", level: this.level });
    const start = (this.level - 2) % UPGRADE_ORDER.length;
    this.pendingUpgradeIds = [
      UPGRADE_ORDER[start]!,
      UPGRADE_ORDER[(start + 2) % UPGRADE_ORDER.length]!,
      UPGRADE_ORDER[(start + 4) % UPGRADE_ORDER.length]!,
    ];
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
      rank: enemy.rank,
      eliteKind: enemy.eliteKind,
      carapacePhase: enemy.eliteKind === "carapace-scuttler" ? enemy.carapacePhase : undefined,
      facingDirection: { ...enemy.facingDirection },
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
  const add = (type: EnemyType, count: number, start: number, interval: number): void => {
    for (let item = 0; item < count; item += 1) {
      plans.push({ type, atSeconds: start + item * interval });
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
    default:
      add("scuttler", 10, 0.2, 0.55);
      add("brain-blob", 4, 1.2, 1.6);
      add("slime-spitter", 2, 2.4, 2.8);
      break;
  }

  return plans.sort((left, right) => left.atSeconds - right.atSeconds);
}

function distance(left: Vector2Data, right: Vector2Data): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
