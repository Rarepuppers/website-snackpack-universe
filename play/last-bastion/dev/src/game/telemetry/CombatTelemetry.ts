import type { CombatEvent, CombatSnapshot } from "../combat/CombatSimulation";

export type TelemetryNumberMap = Readonly<Record<string, number>>;

export interface CombatTelemetrySnapshot {
  elapsedSeconds: number;
  averageLiveEnemies: number;
  peakLiveEnemies: number;
  spawnCapBlockedSeconds: number;
  threatSpawned: number;
  pressureSpawned: TelemetryNumberMap;
  peakFriendlyProjectiles: number;
  peakHostileProjectiles: number;
  damageDealt: TelemetryNumberMap;
  damageTaken: TelemetryNumberMap;
  healing: TelemetryNumberMap;
  dodges: number;
  blocks: number;
  shieldBlocks: number;
  xpSpawned: number;
  xpCollected: number;
  xpLost: number;
  levelUps: number;
  scrapEarned: number;
  kills: number;
}

function increment(map: Record<string, number>, key: string, amount: number): void {
  map[key] = (map[key] ?? 0) + amount;
}

/** Pure, replayable accumulator. It deliberately has no clock or persistence hooks. */
export class CombatTelemetryAccumulator {
  private elapsedSeconds = 0;
  private liveEnemySeconds = 0;
  private peakLiveEnemies = 0;
  private peakFriendlyProjectiles = 0;
  private peakHostileProjectiles = 0;
  private spawnCapBlockedSeconds = 0;
  private threatSpawned = 0;
  private readonly pressureSpawned: Record<string, number> = {};
  private readonly damageDealt: Record<string, number> = {};
  private readonly damageTaken: Record<string, number> = {};
  private readonly healing: Record<string, number> = {};
  private dodges = 0;
  private blocks = 0;
  private shieldBlocks = 0;
  private xpSpawned = 0;
  private xpCollected = 0;
  private xpLost = 0;
  private levelUps = 0;
  private scrapEarned = 0;
  private kills = 0;

  recordFrame(deltaSeconds: number, snapshot: Pick<CombatSnapshot, "density" | "projectiles" | "enemyProjectiles">): void {
    const delta = Math.max(0, deltaSeconds);
    this.elapsedSeconds += delta;
    this.liveEnemySeconds += snapshot.density.currentLiveEnemies * delta;
    this.peakLiveEnemies = Math.max(this.peakLiveEnemies, snapshot.density.currentLiveEnemies, snapshot.density.peakLiveEnemies);
    this.peakFriendlyProjectiles = Math.max(this.peakFriendlyProjectiles, snapshot.projectiles.length);
    this.peakHostileProjectiles = Math.max(this.peakHostileProjectiles, snapshot.enemyProjectiles.length, snapshot.density.peakEnemyProjectiles);
    this.spawnCapBlockedSeconds = Math.max(this.spawnCapBlockedSeconds, snapshot.density.spawnCapBlockedSeconds);
    this.threatSpawned = Math.max(this.threatSpawned, snapshot.density.threatSpawned);
    for (const [role, count] of Object.entries(snapshot.density.pressureSpawned)) this.pressureSpawned[role] = Math.max(this.pressureSpawned[role] ?? 0, count);
  }

  recordEvent(event: CombatEvent): void {
    switch (event.type) {
      case "enemy-hit": increment(this.damageDealt, event.damageType, event.damage); break;
      case "enemy-defeated": this.kills += 1; break;
      case "player-hit": increment(this.damageTaken, "enemy", event.damage); break;
      case "player-shield-hit": this.shieldBlocks += 1; increment(this.damageTaken, "shield", event.damage); break;
      case "player-healed": increment(this.healing, "combat", event.amount); break;
      case "xp-collected": this.xpCollected += event.value; break;
      case "level-up": this.levelUps += 1; break;
      case "scrap-secured": this.scrapEarned += event.amount; break;
      case "projectile-blocked": this.blocks += 1; break;
      default: break;
    }
  }

  recordSnapshot(deltaSeconds: number, snapshot: CombatSnapshot): void {
    this.recordFrame(deltaSeconds, snapshot);
    for (const event of snapshot.events) this.recordEvent(event);
  }

  toSnapshot(): CombatTelemetrySnapshot {
    return {
      elapsedSeconds: this.elapsedSeconds,
      averageLiveEnemies: this.elapsedSeconds > 0 ? this.liveEnemySeconds / this.elapsedSeconds : 0,
      peakLiveEnemies: this.peakLiveEnemies,
      spawnCapBlockedSeconds: this.spawnCapBlockedSeconds,
      threatSpawned: this.threatSpawned,
      pressureSpawned: { ...this.pressureSpawned },
      peakFriendlyProjectiles: this.peakFriendlyProjectiles,
      peakHostileProjectiles: this.peakHostileProjectiles,
      damageDealt: { ...this.damageDealt },
      damageTaken: { ...this.damageTaken },
      healing: { ...this.healing },
      dodges: this.dodges,
      blocks: this.blocks,
      shieldBlocks: this.shieldBlocks,
      xpSpawned: this.xpSpawned,
      xpCollected: this.xpCollected,
      xpLost: this.xpLost,
      levelUps: this.levelUps,
      scrapEarned: this.scrapEarned,
      kills: this.kills,
    };
  }
}

export class FramePerformanceSampler {
  private samples: number[] = [];
  sample(frameMilliseconds: number): void { if (Number.isFinite(frameMilliseconds) && frameMilliseconds >= 0) this.samples.push(frameMilliseconds); }
  summary(): { samples: number; p50Milliseconds: number } {
    const values = [...this.samples].sort((a, b) => a - b);
    return { samples: values.length, p50Milliseconds: values.length ? values[Math.floor(values.length / 2)] ?? 0 : 0 };
  }
}
