import type { PlayerIntent } from "../input/PlayerIntent";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import { HeroMotionController } from "../hero/HeroMotionController";
import { MARINE } from "../hero/marine";
import { ENEMY_CATALOG, type EnemyType } from "../content/enemyCatalog";
import { BASTION_SERVICE_RIFLE, type WeaponRuntimeStats } from "../content/weaponCatalog";
import {
  clampWeaponCount,
  createServiceRifleLoadout,
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

export type CombatEvent =
  | {
    type: "weapon-fired";
    weaponInstanceId: number;
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
  | { type: "projectile-blocked"; position: Vector2Data };

export interface EnemySnapshot {
  id: number;
  type: EnemyType;
  position: Vector2Data;
  health: number;
  maxHealth: number;
  radiusMetres: number;
  hatchProgress: number;
  brainPhase?: BrainPhase;
}

export interface ProjectileSnapshot {
  id: number;
  position: Vector2Data;
  rotationRadians: number;
}

export interface ExperiencePickupSnapshot {
  id: number;
  position: Vector2Data;
  value: number;
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
  pickups: readonly ExperiencePickupSnapshot[];
  weapon: Readonly<WeaponRuntimeStats>;
  equippedWeapons: readonly Readonly<EquippedWeapon>[];
  events: readonly CombatEvent[];
  arena: Readonly<ArenaDefinition>;
  stressProfile: 4 | 12 | null;
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
}

interface ProjectileState {
  id: number;
  position: Vector2Data;
  velocity: Vector2Data;
  damage: number;
  remainingSeconds: number;
  pierceRemaining: number;
  explosionRadiusMetres: number;
  hitEnemyIds: Set<number>;
  dead: boolean;
}

interface ExperiencePickupState {
  id: number;
  position: Vector2Data;
  value: number;
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
  arena?: ArenaDefinition;
  stressProfile?: 4 | 12;
}

interface EquippedWeaponState extends EquippedWeapon {
  cooldownSeconds: number;
}

const TOTAL_WAVES = 3;
const PLAYER_MAX_HEALTH = 100;
const PLAYER_RADIUS_METRES = 0.55;
const PLAYER_HURT_COOLDOWN_SECONDS = 0.65;
const INTERMISSION_SECONDS = 2;

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
    this.wavesEnabled = options.autoStartWaves !== false && this.stressProfile === null;
    this.equippedWeapons = createServiceRifleLoadout(
      clampWeaponCount(options.startingWeaponCount ?? 1),
    ).map((weapon) => ({ ...weapon, cooldownSeconds: 0 }));

    if (this.stressProfile !== null) {
      this.populateStressScenario(this.stressProfile);
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
    const previousPlayerPosition = { ...this.playerPosition };
    this.playerPosition = resolveCircleMovement(
      previousPlayerPosition,
      {
        x: previousPlayerPosition.x + motionFrame.displacementMetres.x,
        y: previousPlayerPosition.y + motionFrame.displacementMetres.y,
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
          this.fireWeapon(weapon, this.lastAimDirection);
          weapon.cooldownSeconds = weapon.stats.fireIntervalSeconds;
        }
      }
    }

    if (this.wavesEnabled && this.status === "combat") {
      this.updateWaveSpawns(delta);
    }

    this.updateEnemies(delta);
    this.updateProjectiles(delta);
    this.updateExperiencePickups(delta);
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
      attackCooldownSeconds: 0,
      dead: false,
      hatchRemainingSeconds: type === "egg-cluster" ? 6 : 0,
      hatchDurationSeconds: type === "egg-cluster" ? 6 : 0,
      brainPhase: "drift",
      brainPhaseRemainingSeconds: type === "brain-blob" ? 1.5 + this.random() : 0,
      brainLungeDirection: { x: 0, y: 0 },
    });
    this.frameEvents.push({
      type: "enemy-spawned",
      position: { ...spawnPosition },
      enemyType: type,
    });

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
        position: { ...projectile.position },
        rotationRadians: Math.atan2(projectile.velocity.y, projectile.velocity.x),
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
        position: { ...muzzlePosition },
        velocity: {
          x: direction.x * weapon.stats.projectileSpeedMetresPerSecond,
          y: direction.y * weapon.stats.projectileSpeedMetresPerSecond,
        },
        damage: weapon.stats.projectileDamage,
        remainingSeconds: weapon.stats.projectileLifetimeSeconds,
        pierceRemaining: weapon.stats.pierceCount,
        explosionRadiusMetres: weapon.stats.explosionRadiusMetres,
        hitEnemyIds: new Set<number>(),
        dead: false,
      });

      this.frameEvents.push({
        type: "weapon-fired",
        weaponInstanceId: weapon.instanceId,
        position: muzzlePosition,
        direction,
      });
    }
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
        this.damageEnemy(enemy, projectile.damage);

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

  private updateEnemies(deltaSeconds: number): void {
    for (const enemy of [...this.enemies]) {
      if (enemy.dead) {
        continue;
      }

      enemy.attackCooldownSeconds = Math.max(0, enemy.attackCooldownSeconds - deltaSeconds);

      switch (enemy.type) {
        case "scuttler":
          this.moveEnemyTowardPlayer(enemy, ENEMY_CATALOG.scuttler.movementSpeedMetresPerSecond, deltaSeconds);
          break;
        case "egg-cluster":
          this.updateEggCluster(enemy, deltaSeconds);
          break;
        case "brain-blob":
          this.updateBrainBlob(enemy, deltaSeconds);
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
      if (
        definition.contactDamage > 0
        && enemy.attackCooldownSeconds <= 0
        && distance(enemy.position, this.playerPosition) <= definition.radiusMetres + PLAYER_RADIUS_METRES
      ) {
        this.playerHealth = Math.max(0, this.playerHealth - definition.contactDamage);
        this.playerHurtCooldownSeconds = PLAYER_HURT_COOLDOWN_SECONDS;
        enemy.attackCooldownSeconds = 0.8;
        this.frameEvents.push({
          type: "player-hit",
          position: { ...this.playerPosition },
          damage: definition.contactDamage,
        });

        if (this.playerHealth <= 0) {
          this.status = "defeat";
        }
        break;
      }
    }
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
    this.pickups = this.pickups.filter((pickup) => !pickup.collected);
  }

  private updateWaveSpawns(deltaSeconds: number): void {
    this.waveElapsedSeconds += deltaSeconds;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0]!.atSeconds <= this.waveElapsedSeconds) {
      const spawn = this.spawnQueue.shift()!;
      this.spawnEnemy(spawn.type);
    }
  }

  private updateEncounterProgress(deltaSeconds: number): void {
    if (this.status === "combat" && this.spawnQueue.length === 0 && this.enemies.length === 0) {
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
      maxHealth: definition.maxHealth,
      radiusMetres: definition.radiusMetres,
      hatchProgress: enemy.hatchDurationSeconds > 0
        ? 1 - enemy.hatchRemainingSeconds / enemy.hatchDurationSeconds
        : 0,
      brainPhase: enemy.type === "brain-blob" ? enemy.brainPhase : undefined,
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
