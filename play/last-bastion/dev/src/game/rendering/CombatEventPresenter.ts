import type Phaser from "phaser";
import { type CombatEvent, type CombatSnapshot, type PowerupType } from "../combat/CombatSimulation";
import type { GameSettings } from "../save/LocalSaveStore";
import { cueForCombatEvent, MEDKIT_HEAL_CUE } from "../audio/AudioCueMap";
import type { WebAudioSynth } from "../audio/WebAudioSynth";
import type { VisualEffectPool } from "../effects/VisualEffectPool";
import type { FloatingDamageNumbers } from "../rendering/FloatingDamageNumbers";
import type { CombatEventFeed } from "../ui/CombatEventFeed";
import type { CombatHaptics } from "../ui/CombatHaptics";
import { dedicatedPowerupFrame, powerupPickupPresentation } from "../ui/PowerupTileFrames";
import type { WeaponId } from "../content/weaponCatalog";

const PIXELS_PER_METRE = 32;
type WorldPoint = Readonly<{ x: number; y: number }>;
type EffectColumn = 0 | 1 | 2 | 3;
type EffectTexture =
  | "combat-effects-v1" | "batch-b-effects-v1" | "batch-c-effects-v1" | "batch-c-rewards-v1"
  | "powerup-identity-atlas-v1" | "brood-warden-effects-v1" | "rift-stalker-effects-v1"
  | "synapse-herald-effects-v1" | "assembly-prime-effects-v1" | "storm-regent-effects-v1"
  | "abomination-prime-biomass-v1" | "abomination-prime-effects-v1" | "ripper-effects-v1"
  | "razor-scuttler-effects-v1" | "elite-dash-puddle-effects-v1" | "quillback-effects-v1"
  | "spinewheel-effects-v1" | "tether-bloom-effects-v1" | "bastion-eater-effects-v1"
  | "bastion-eater-environment-v1" | "the-choir-effects-v1" | "foundry-sovereign-effects-v1"
  | "patrol-blade-effects-v1" | "bolt-carbine-effects-v1" | "injector-carbine-effects-v1"
  | "bulwark-rotary-effects-v1" | "grenade-tube-effects-v1" | "event-horizon-effects-v1"
  | "marauder-ar-effects-v1" | "aurum-hoarder-effects-v1" | "corrupted-marine-effects-v1"
  | "nest-effects-v1" | "storm-effects-v1" | "machine-scrap-skitterer-effects-v1"
  | "machine-arc-warden-effects-v1" | "machine-cyborg-reclaimer-effects-v1"
  | "machine-foundry-effects-v1" | "telegraph-small-v1" | "destructible-terrain-effects-v1";

export interface CombatEventPresentationContext {
  readonly haptics: CombatHaptics;
  readonly synth: WebAudioSynth;
  readonly damageNumbers: FloatingDamageNumbers;
  readonly effectPool: VisualEffectPool;
  readonly eventFeed: CombatEventFeed;
  readonly settings: Pick<GameSettings, "damageNumbersEnabled" | "reducedFlashEnabled">;
  readonly lastSnapshot: CombatSnapshot;
  readonly time: Phaser.Time.Clock;
  pulseWeapon(instanceId: number): void;
  animateProductionWeapon(instanceId: number, weaponId: WeaponId): void;
  animatePatrolBlade(instanceId: number): void;
  drawPatrolBladeSweep(position: WorldPoint, direction: WorldPoint, weaponId: WeaponId): void;
  drawChainArc(from: WorldPoint, to: WorldPoint): void;
  emitAuthoredEffect(frame: number, position: WorldPoint, duration: number, scale: number, targetScale: number, rotation?: number, texture?: EffectTexture): void;
  emitNestEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitSkittererEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number, rotation?: number): void;
  emitStormEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitArcWardenEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitReclaimerEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitFoundryEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number, rotation?: number): void;
  emitSynapseHeraldEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitAssemblyPrimeEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitStormRegentEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  emitAbominationPrimeEffect(column: EffectColumn, position: WorldPoint, duration: number, scale: number, targetScale: number): void;
  flashCircle(position: WorldPoint, radiusPixels: number, color: number, duration: number, targetScale: number, outlineOnly?: boolean): void;
  shakeCamera(durationMilliseconds: number, intensity: number): void;
  flashCamera(durationMilliseconds: number, red: number, green: number, blue: number): void;
  showDamageDirection(): void;
  showPickupBanner(type: PowerupType): void;
  usesBladeBody(weaponId: WeaponId): boolean;
  powerupDisplayName(type: PowerupType): string;
}

/** Owns the event-to-audio/haptic/visual dispatch boundary for combat presentation. */
export class CombatEventPresenter {
  constructor(private readonly context: CombatEventPresentationContext) {}

  play(events: readonly CombatEvent[]): void {
    for (const event of events) {
      this.context.haptics.playForEvent(event);
      const audioCue = cueForCombatEvent(event);
      if (audioCue) {
        this.context.synth.play(audioCue);
      }
      switch (event.type) {
        case "weapon-fired":
          this.context.pulseWeapon(event.weaponInstanceId);
          this.context.animateProductionWeapon(event.weaponInstanceId, event.weaponId);
          if (this.context.usesBladeBody(event.weaponId)) {
            this.context.animatePatrolBlade(event.weaponInstanceId);
            this.context.drawPatrolBladeSweep(event.position, event.direction, event.weaponId);
            break;
          }
          if (event.weaponId === "bolt-carbine") {
            this.context.emitAuthoredEffect(0, event.position, 110, 0.5, 0.92, Math.atan2(event.direction.y, event.direction.x), "bolt-carbine-effects-v1");
            break;
          }
          if (event.weaponId === "injector-carbine") {
            this.context.emitAuthoredEffect(1, event.position, 100, 0.45, 0.9, Math.atan2(event.direction.y, event.direction.x), "injector-carbine-effects-v1");
            break;
          }
          if (event.weaponId === "bulwark-rotary-cannon") {
            this.context.emitAuthoredEffect(2, event.position, 80, 0.45, 0.82, Math.atan2(event.direction.y, event.direction.x), "bulwark-rotary-effects-v1");
            break;
          }
          if (event.weaponId === "marauder-ar") {
            const angle = Math.atan2(event.direction.y, event.direction.x);
            this.context.emitAuthoredEffect(0, event.position, 72, 0.38, 0.72, angle, "marauder-ar-effects-v1");
            this.context.emitAuthoredEffect(3, event.position, 180, 0.3, 0.55, angle - 0.8, "marauder-ar-effects-v1");
            break;
          }
          if (event.weaponId === "event-horizon") {
            this.context.emitAuthoredEffect(1, event.position, 140, 0.5, 1.05, Math.atan2(event.direction.y, event.direction.x), "event-horizon-effects-v1");
            break;
          }
          if (event.weaponId === "grenade-tube") break;
          this.context.emitAuthoredEffect(
            event.weaponId === "scattergun" ? 0 : event.weaponId === "arc-carbine" ? 5 : 5,
            event.position,
            90,
            0.48,
            0.9,
            Math.atan2(event.direction.y, event.direction.x),
            event.weaponId === "bastion-service-rifle" ? "combat-effects-v1" : "batch-b-effects-v1",
          );
          break;
        case "chain-arc":
          this.context.drawChainArc(event.from, event.to);
          break;
        case "enemy-hit":
          this.context.emitAuthoredEffect(7, event.position, 110, 0.55, 0.95);
          if (this.context.settings.damageNumbersEnabled) {
            this.context.damageNumbers.report(
              event.enemyId,
              event.damage,
              event.damageType,
              event.position.x * PIXELS_PER_METRE,
              event.position.y * PIXELS_PER_METRE,
              this.context.time.now,
            );
          }
          break;
        case "ironhide-adapted":
          this.context.flashCircle(event.position, 30, 0xd98252, 380, 1.55, true);
          this.context.eventFeed.add(`IRONHIDE ADAPTS — ARMOUR +${event.bonusArmour}`, "#ffd08a");
          break;
        case "bolt-impact":
          this.context.emitAuthoredEffect(
            event.hitIndex === 1 ? 3 : 5,
            event.position,
            event.hitIndex === 1 ? 150 : 210,
            event.hitIndex === 1 ? 0.65 : 0.82,
            event.hitIndex === 1 ? 1.25 : 1.65,
            0,
            "bolt-carbine-effects-v1",
          );
          break;
        case "projectile-impact":
          if (event.weaponId === "injector-carbine") {
            this.context.emitAuthoredEffect(2, event.position, 150, 0.52, 1.05, 0, "injector-carbine-effects-v1");
          } else if (event.weaponId === "bulwark-rotary-cannon") {
            this.context.emitAuthoredEffect(4, event.position, 120, 0.48, 0.9, 0, "bulwark-rotary-effects-v1");
          } else if (event.weaponId === "marauder-ar") {
            this.context.emitAuthoredEffect(2, event.position, 115, 0.4, 0.82, 0, "marauder-ar-effects-v1");
          }
          break;
        case "enemy-defeated":
          if (event.enemyType === "aurum-hoarder") {
            this.context.emitAuthoredEffect(6, event.position, 460, 0.75, 1.65, 0, "aurum-hoarder-effects-v1");
          } else if (event.enemyType === "siege-crusher") {
            this.context.emitAuthoredEffect(19, event.position, 420, 0.8, 2.1, 0, "batch-b-effects-v1");
          } else if (event.enemyType === "brood-warden") {
            this.context.emitAuthoredEffect(9, event.position, 460, 0.9, 2.3, 0, "brood-warden-effects-v1");
          } else if (event.enemyType === "assembly-prime") {
            this.context.emitAssemblyPrimeEffect(3, event.position, 620, 0.92, 2.3);
          } else if (event.enemyType === "abomination-prime") {
            this.context.emitAbominationPrimeEffect(3, event.position, 680, 0.96, 2.45);
          } else if (event.enemyType === "rift-stalker") {
            this.context.emitAuthoredEffect(6, event.position, 520, 0.82, 2.15, 0, "rift-stalker-effects-v1");
            this.context.emitAuthoredEffect(7, event.position, 680, 0.7, 2.4, 0, "rift-stalker-effects-v1");
          } else if (event.enemyType === "blast-mite") {
            this.context.emitAuthoredEffect(16, event.position, 300, 0.65, 1.35, 0, "batch-c-effects-v1");
          } else if (event.enemyType === "warp-flanker") {
            this.context.emitAuthoredEffect(18, event.position, 260, 0.6, 1.2, 0, "batch-c-effects-v1");
          } else if (event.enemyType === "ripper") {
            this.context.emitAuthoredEffect(7, event.position, 340, 0.72, 1.5, 0, "ripper-effects-v1");
          } else if (event.enemyType === "razor-scuttler") {
            this.context.emitAuthoredEffect(7, event.position, 320, 0.72, 1.5, 0, "razor-scuttler-effects-v1");
          } else if (event.enemyType === "quillback") {
            this.context.emitAuthoredEffect(7, event.position, 360, 0.75, 1.55, 0, "quillback-effects-v1");
          } else if (event.enemyType === "spinewheel") {
            this.context.emitAuthoredEffect(7, event.position, 380, 0.78, 1.65, 0, "spinewheel-effects-v1");
          } else if (event.enemyType === "tether-bloom") {
            this.context.emitAuthoredEffect(7, event.position, 400, 0.82, 1.75, 0, "tether-bloom-effects-v1");
          } else if (event.enemyType === "nest-weaver") {
            this.context.emitNestEffect(3, event.position, 460, 0.72, 1.55);
          } else if (event.enemyType === "bastion-eater") {
            this.context.emitAuthoredEffect(10, event.position, 760, 1.4, 3.2, 0, "bastion-eater-effects-v1");
          } else if (event.enemyType === "the-choir") {
            this.context.emitAuthoredEffect(6, event.position, 820, 0.9, 2.4, 0, "the-choir-effects-v1");
          } else if (event.enemyType === "foundry-sovereign") {
            this.context.emitAuthoredEffect(7, event.position, 900, 0.9, 2.5, 0, "foundry-sovereign-effects-v1");
          } else {
            this.context.emitAuthoredEffect(event.enemyType === "brain-blob" ? 18 : event.enemyType === "egg-cluster" ? 13 : 11, event.position, 210, 0.72, 1.2);
          }
          break;
        case "explosion":
          if (event.weaponId === "grenade-tube") {
            this.context.emitAuthoredEffect(5, event.position, 320, event.radiusMetres * 0.55, event.radiusMetres * 1.15, 0, "grenade-tube-effects-v1");
            this.context.shakeCamera(100, 0.004);
          } else {
            this.context.emitAuthoredEffect(9, event.position, 240, event.radiusMetres, event.radiusMetres * 1.5);
          }
          break;
        case "player-hit":
          this.context.showDamageDirection();
          this.context.shakeCamera(120, 0.006);
          if (this.context.settings.damageNumbersEnabled) {
            this.context.damageNumbers.reportPlayerDamage(
              event.damage,
              event.position.x * PIXELS_PER_METRE,
              event.position.y * PIXELS_PER_METRE,
              this.context.time.now,
            );
          }
          if (this.context.settings.reducedFlashEnabled) {
            this.context.flashCircle(event.position, 15, 0xffe2b8, 260, 1.8, true);
          } else {
            this.context.emitAuthoredEffect(3, event.position, 180, 0.85, 1.4);
          }
          break;
        case "player-shield-hit":
          this.context.showDamageDirection();
          break;
        case "player-healed":
          if (this.context.settings.damageNumbersEnabled) {
            this.context.damageNumbers.reportHealing(
              event.amount,
              event.position.x * PIXELS_PER_METRE,
              event.position.y * PIXELS_PER_METRE,
              this.context.time.now,
            );
          }
          break;
        case "medic-triage":
          this.context.emitAuthoredEffect(4, event.position, 360, 0.65, 1.35, 0, "injector-carbine-effects-v1");
          if (event.healed > 0 || event.shieldGained > 0) {
            this.context.emitAuthoredEffect(5, event.position, 300, 0.55, 1.2, 0, "injector-carbine-effects-v1");
          }
          break;
        case "medic-surge":
          this.context.emitAuthoredEffect(6, event.position, 520, 0.9, 2.2, 0, "injector-carbine-effects-v1");
          if (event.shieldGained > 0) {
            this.context.emitAuthoredEffect(7, event.position, 650, 0.75, 1.65, 0, "injector-carbine-effects-v1");
          }
          break;
        case "xp-collected":
          this.context.emitAuthoredEffect(19, event.position, 130, 0.4, 0.8);
          break;
        case "level-up":
          if (!this.context.settings.reducedFlashEnabled) this.context.flashCamera(160, 104, 228, 232);
          else this.context.flashCircle(this.context.lastSnapshot.playerPosition, 22, 0x68e4e8, 420, 2.4, true);
          this.context.emitAuthoredEffect(2, this.context.lastSnapshot.playerPosition, 420, 0.9, 2.2);
          this.context.eventFeed.add(`LEVEL ${event.level}`, "#68e4e8");
          break;
        case "enemy-spawned":
          if (event.enemyType === "ripper") {
            this.context.emitAuthoredEffect(5, event.position, 260, 0.72, 1.3, 0, "ripper-effects-v1");
          } else if (event.enemyType === "storm-node") {
            this.context.emitStormEffect(0, event.position, 220, 0.42, 0.84);
          } else {
            this.context.emitAuthoredEffect(event.enemyType === "egg-cluster" ? 12 : event.enemyType === "scuttler" ? 10 : 19, event.position, 230, 0.65, 1.25);
          }
          break;
        case "egg-hatched":
          this.context.emitAuthoredEffect(14, event.position, 280, 0.9, 1.45);
          this.context.shakeCamera(90, 0.0025);
          break;
        case "nest-weaver-placement-warning":
          this.context.emitNestEffect(0, event.target, 220, 0.42, 0.82);
          break;
        case "nest-pod-laid":
          this.context.emitNestEffect(0, event.position, 260, 0.48, 0.9);
          break;
        case "nest-pod-hatched":
          this.context.emitNestEffect(1, event.position, 360, 0.62, 1.25);
          this.context.shakeCamera(90, 0.0025);
          break;
        case "nest-pod-destroyed":
          this.context.emitNestEffect(2, event.position, 320, 0.58, 1.1);
          break;
        case "storm-chain-warning":
          this.context.emitStormEffect(1, event.position, 240, 0.46, 0.9);
          break;
        case "storm-chain-discharged":
          this.context.emitStormEffect(2, event.position, 180, 0.52, 1.02);
          break;
        case "storm-chain-interrupted":
          this.context.emitStormEffect(3, event.position, 320, 0.48, 0.96);
          break;
        case "scrap-skitterer-warning":
          this.context.emitSkittererEffect(0, event.position, 190, 0.4, 0.78, Math.atan2(event.direction.y, event.direction.x));
          break;
        case "scrap-skitterer-rush":
          this.context.emitSkittererEffect(1, event.position, 180, 0.44, 0.9, Math.atan2(event.direction.y, event.direction.x));
          break;
        case "scrap-skitterer-impact":
          this.context.emitSkittererEffect(2, event.position, 220, 0.52, 0.98);
          break;
        case "scrap-skitterer-wreck":
          this.context.emitSkittererEffect(3, event.position, 360, 0.42, 0.84);
          break;
        case "arc-warden-warning":
          this.context.emitArcWardenEffect(0, event.position, 240, 0.45, 0.9);
          break;
        case "arc-warden-discharged":
          this.context.emitArcWardenEffect(1, event.position, 170, 0.5, 1);
          this.context.emitArcWardenEffect(2, event.endpoint, 210, 0.48, 0.94);
          this.context.time.delayedCall(190, () => this.context.emitArcWardenEffect(3, event.position, 300, 0.44, 0.88));
          break;
        case "reclaimer-link-started":
          this.context.emitReclaimerEffect(0, event.position, 240, 0.48, 0.9);
          break;
        case "reclaimer-repair-completed":
          this.context.emitReclaimerEffect(1, event.target, 300, 0.55, 1.08);
          this.context.time.delayedCall(180, () => this.context.emitReclaimerEffect(3, event.position, 320, 0.46, 0.9));
          break;
        case "reclaimer-link-interrupted":
          this.context.emitReclaimerEffect(2, event.position, 260, 0.52, 1.02);
          this.context.time.delayedCall(150, () => this.context.emitReclaimerEffect(3, event.position, 320, 0.44, 0.86));
          break;
        case "foundry-fabrication-started":
          this.context.emitFoundryEffect(0, event.position, 280, 0.5, 0.96);
          break;
        case "foundry-fabrication-completed":
          this.context.emitFoundryEffect(1, event.position, 340, 0.62, 1.18);
          break;
        case "foundry-fabrication-interrupted":
          this.context.emitFoundryEffect(2, event.position, 300, 0.58, 1.12);
          break;
        case "foundry-turret-fired":
          this.context.emitFoundryEffect(3, event.position, 190, 0.52, 0.96, Math.atan2(event.target.y - event.position.y, event.target.x - event.position.x));
          break;
        case "synapse-herald-warning":
          if (event.move === "lunge-chain") {
            this.context.emitSynapseHeraldEffect(0, event.position, 260, 0.5, 0.98);
          }
          break;
        case "synapse-herald-lunge":
          this.context.emitSynapseHeraldEffect(0, event.position, 190, 0.52, 1.04);
          break;
        case "synapse-herald-zones-erupted":
          for (const zone of event.zones) this.context.emitSynapseHeraldEffect(1, zone, 320, 0.62, 1.2);
          break;
        case "synapse-herald-link-started":
          this.context.emitSynapseHeraldEffect(2, event.position, 280, 0.55, 1.08);
          break;
        case "synapse-herald-link-broken":
          this.context.emitSynapseHeraldEffect(3, event.position, 300, 0.58, 1.14);
          break;
        case "assembly-prime-warning":
          if (event.move === "rotating-lanes") this.context.emitAssemblyPrimeEffect(0, event.position, 300, 0.56, 1.08);
          break;
        case "assembly-prime-fabrication-completed":
          this.context.emitAssemblyPrimeEffect(1, event.position, 360, 0.64, 1.24);
          break;
        case "assembly-prime-fabrication-interrupted":
          this.context.emitFoundryEffect(2, event.position, 300, 0.58, 1.12);
          break;
        case "assembly-prime-drone-recalled":
          this.context.emitAssemblyPrimeEffect(2, event.position, 320, 0.6, 1.18);
          break;
        case "storm-regent-warning":
          if (event.move === "chain-strike") this.context.emitStormRegentEffect(0, event.position, 280, 0.54, 1.06);
          break;
        case "storm-regent-discharged":
          if (event.move === "chain-strike") {
            this.context.emitStormRegentEffect(0, event.position, 220, 0.58, 1.14);
          } else if (event.move === "node-overcharge") {
            this.context.emitStormRegentEffect(1, event.centre ?? event.position, 340, 0.68, 1.28);
          } else {
            this.context.emitStormRegentEffect(2, event.centre ?? event.position, 300, 0.64, 1.22);
          }
          break;
        case "storm-regent-interrupted":
          this.context.emitStormRegentEffect(3, event.nodePosition ?? event.position, 320, 0.6, 1.18);
          break;
        case "abomination-prime-slam":
          this.context.emitAbominationPrimeEffect(0, event.position, 380, 0.72, 1.42);
          if (event.hitPlayer) this.context.shakeCamera(150, 0.006);
          break;
        case "abomination-prime-grab-latched":
          this.context.emitAbominationPrimeEffect(1, event.position, 280, 0.62, 1.16);
          break;
        case "abomination-prime-grab-broken":
          this.context.emitAbominationPrimeEffect(1, event.position, 320, 0.58, 1.22);
          break;
        case "abomination-prime-biomass-thrown":
          this.context.emitAbominationPrimeEffect(2, event.position, 300, 0.64, 1.18);
          break;
        case "abomination-prime-biomass-landed":
          this.context.emitAuthoredEffect(3, event.position, 300, 0.62, 1.04, 0, "abomination-prime-biomass-v1");
          break;
        case "projectile-blocked":
          if (event.weaponId === "bolt-carbine") {
            this.context.emitAuthoredEffect(6, event.position, 150, 0.58, 1.05, 0, "bolt-carbine-effects-v1");
          } else if (event.weaponId === "bulwark-rotary-cannon") {
            this.context.emitAuthoredEffect(5, event.position, 120, 0.48, 0.9, 0, "bulwark-rotary-effects-v1");
          } else if (event.weaponId === "grenade-tube") {
            this.context.emitAuthoredEffect(6, event.position, 180, 0.65, 1.15, 0, "grenade-tube-effects-v1");
          } else {
            this.context.emitAuthoredEffect(7, event.position, 130, 0.5, 0.95);
          }
          break;
        case "slime-spit-windup":
          this.context.emitAuthoredEffect(12, event.target, 260, 0.65, 0.9, 0, "batch-b-effects-v1");
          break;
        case "slime-glob-fired":
          this.context.emitAuthoredEffect(10, event.position, 130, 0.35, 0.65, 0, "batch-b-effects-v1");
          break;
        case "slime-impact":
          this.context.emitAuthoredEffect(
            event.eliteKind === "blightspitter" ? 4 : 13,
            event.position,
            260,
            0.55,
            1.05,
            0,
            event.eliteKind === "blightspitter" ? "elite-dash-puddle-effects-v1" : "batch-b-effects-v1",
          );
          break;
        case "elite-armour-hit":
          this.context.emitAuthoredEffect(18, event.position, 150, 0.52, 0.95, 0, "batch-b-effects-v1");
          break;
        case "elite-reward-dropped":
          this.context.flashCircle(event.position, 20, 0xffd36b, 360, 2.2, true);
          break;
        case "elite-reward-collected":
          this.context.flashCircle(event.position, 24, 0xd696ff, 420, 2.8, true);
          this.context.eventFeed.add("ELITE CACHE SECURED", "#d696ff");
          break;
        case "mini-boss-sweep":
          this.context.emitAuthoredEffect(16, event.position, 320, event.radiusMetres * 0.5, event.radiusMetres, 0, "batch-b-effects-v1");
          break;
        case "mini-boss-shockwave":
          this.context.emitAuthoredEffect(17, event.position, 360, event.radiusMetres * 0.5, event.radiusMetres, 0, "batch-b-effects-v1");
          this.context.shakeCamera(150, 0.006);
          break;
        case "rain-of-spines-impact":
          this.context.emitAuthoredEffect(11, event.position, 190, 0.8, 1, 0, "telegraph-small-v1");
          break;
        case "brood-cleave":
          this.context.emitAuthoredEffect(5, event.position, 300, event.radiusMetres * 0.5, event.radiusMetres, 0, "brood-warden-effects-v1");
          break;
        case "brood-acid-volley":
          this.context.emitAuthoredEffect(1, event.position, 190, 0.5, 1.05, Math.atan2(event.target.y - event.position.y, event.target.x - event.position.x), "brood-warden-effects-v1");
          break;
        case "brood-acid-impact":
          this.context.emitAuthoredEffect(2, event.position, 190, 0.48, 1, 0, "brood-warden-effects-v1");
          break;
        case "brood-eggs-laid":
          this.context.emitAuthoredEffect(3, event.position, 270, 0.65, 1.45, 0, "brood-warden-effects-v1");
          break;
        case "brood-swarm-rush":
          this.context.emitAuthoredEffect(7, event.position, 350, 0.8, 1.9, 0, "brood-warden-effects-v1");
          this.context.shakeCamera(120, 0.004);
          break;
        case "corrupted-marine-warning":
          this.context.emitAuthoredEffect(1, event.position, 300, 0.52, 0.82, 0, "corrupted-marine-effects-v1");
          break;
        case "corrupted-marine-knife-fired":
          this.context.emitAuthoredEffect(2, event.position, 170, 0.5, 0.82, Math.atan2(event.direction.y, event.direction.x), "corrupted-marine-effects-v1");
          break;
        case "corrupted-marine-knife-impact":
          this.context.emitAuthoredEffect(event.reason === "player" ? 5 : 4, event.position, 220, 0.52, 0.9, 0, "corrupted-marine-effects-v1");
          break;
        case "abomination-slam-warning":
          this.context.emitAuthoredEffect(3, event.target, 900, 0.75, event.radiusMetres, 0, "telegraph-small-v1");
          break;
        case "abomination-slam-impact":
          this.context.emitAuthoredEffect(7, event.position, 320, 0.85, event.radiusMetres, 0, "telegraph-small-v1");
          if (event.hitPlayer) this.context.shakeCamera(140, 0.006);
          break;
        case "rift-stalker-mark":
          this.context.emitAuthoredEffect(2, event.target, 520, 0.68, 1.5, 0, "rift-stalker-effects-v1");
          break;
        case "rift-stalker-warp-out":
          this.context.emitAuthoredEffect(0, event.position, 280, 0.72, 1.35, 0, "rift-stalker-effects-v1");
          this.context.emitAuthoredEffect(7, event.position, 460, 0.5, 1.2, 0, "rift-stalker-effects-v1");
          break;
        case "rift-stalker-pounce":
          this.context.emitAuthoredEffect(1, event.position, 170, 0.72, 1.28, 0, "rift-stalker-effects-v1");
          this.context.emitAuthoredEffect(3, event.position, 300, 0.78, event.radiusMetres * 0.88, 0, "rift-stalker-effects-v1");
          if (event.hitPlayer) this.context.shakeCamera(110, 0.005);
          break;
        case "rift-stalker-fan":
          this.context.emitAuthoredEffect(
            5, event.position, 300, 0.68, event.count === 5 ? 1.45 : 1.15,
            Math.atan2(event.direction.y, event.direction.x), "rift-stalker-effects-v1",
          );
          break;
        case "rift-stalker-slash":
          this.context.emitAuthoredEffect(
            4, event.position, 230, 0.9, event.reachMetres * 0.72,
            Math.atan2(event.direction.y, event.direction.x), "rift-stalker-effects-v1",
          );
          break;
        case "ripper-sweep":
          this.context.emitAuthoredEffect(
            2,
            event.position,
            240,
            1.05,
            1.28,
            Math.atan2(event.direction.y, event.direction.x),
            "ripper-effects-v1",
          );
          this.context.shakeCamera(90, 0.0035);
          break;
        case "quillback-windup":
          this.context.emitAuthoredEffect(
            1,
            event.position,
            260,
            0.52,
            0.85,
            Math.atan2(event.direction.y, event.direction.x),
            "quillback-effects-v1",
          );
          break;
        case "razor-scuttler-warning":
          this.context.emitAuthoredEffect(
            0, event.position, 300, 0.56, 0.92,
            Math.atan2(event.direction.y, event.direction.x),
            event.eliteKind === "razorlord" ? "elite-dash-puddle-effects-v1" : "razor-scuttler-effects-v1",
          );
          this.context.flashCircle(event.position, 12, 0xffd36b, 260, 1.5, true);
          break;
        case "razor-scuttler-dash":
          this.context.emitAuthoredEffect(
            1, event.position, 180, 0.62, 1.05,
            Math.atan2(event.direction.y, event.direction.x),
            event.eliteKind === "razorlord" ? "elite-dash-puddle-effects-v1" : "razor-scuttler-effects-v1",
          );
          break;
        case "razor-scuttler-impact":
          if (event.eliteKind === "razorlord") {
            this.context.emitAuthoredEffect(2, event.position, 280, 0.68, event.reason === "cover" ? 1.35 : 1.16, 0, "elite-dash-puddle-effects-v1");
            this.context.emitAuthoredEffect(3, event.position, 360, 0.5, 1.05, 0, "elite-dash-puddle-effects-v1");
            if (event.reason !== "miss") this.context.shakeCamera(80, 0.0035);
            break;
          }
          this.context.emitAuthoredEffect(
            event.reason === "player" ? 3 : event.reason === "cover" ? 4 : 5,
            event.position, event.reason === "cover" ? 280 : 220, 0.68, event.reason === "cover" ? 1.35 : 1.16,
            0, "razor-scuttler-effects-v1",
          );
          this.context.emitAuthoredEffect(6, event.position, 360, 0.5, 1.05, 0, "razor-scuttler-effects-v1");
          if (event.reason !== "miss") this.context.shakeCamera(80, 0.0035);
          break;
        case "quillback-volley":
          this.context.emitAuthoredEffect(
            event.count === 5 ? 3 : event.count === 3 ? 2 : 1,
            event.position,
            180,
            event.count === 5 ? 0.72 : 0.58,
            event.count === 5 ? 1.05 : 0.88,
            Math.atan2(event.direction.y, event.direction.x),
            "quillback-effects-v1",
          );
          break;
        case "quillback-spike-impact":
          this.context.emitAuthoredEffect(event.hitPlayer ? 5 : 4, event.position, 190, 0.48, 0.9, 0, "quillback-effects-v1");
          break;
        case "spinewheel-windup":
          this.context.emitAuthoredEffect(0, event.position, 260, 0.62, 1.05, 0, "spinewheel-effects-v1");
          break;
        case "spinewheel-bounce":
          this.context.emitAuthoredEffect(2, event.position, 180, 0.72, 1.2, Math.atan2(event.direction.y, event.direction.x), "spinewheel-effects-v1");
          this.context.emitAuthoredEffect(5, event.position, 210, 0.58, 1.05, 0, "spinewheel-effects-v1");
          this.context.shakeCamera(70, 0.0025);
          break;
        case "spinewheel-hit":
          this.context.emitAuthoredEffect(4, event.position, 210, 0.72, 1.2, 0, "spinewheel-effects-v1");
          this.context.shakeCamera(110, 0.005);
          break;
        case "spinewheel-recovery":
          this.context.emitAuthoredEffect(6, event.position, 320, 0.7, 1.35, 0, "spinewheel-effects-v1");
          break;
        case "tether-bloom-windup":
          this.context.emitAuthoredEffect(0, event.position, 340, 0.62, 1.3, 0, "tether-bloom-effects-v1");
          this.context.emitAuthoredEffect(1, event.target, 340, 0.52, 0.92, 0, "tether-bloom-effects-v1");
          break;
        case "tether-bloom-latched":
          this.context.emitAuthoredEffect(2, event.position, 300, 0.58, 1.08, 0, "tether-bloom-effects-v1");
          break;
        case "tether-bloom-broken":
          this.context.emitAuthoredEffect(
            event.reason === "damage" ? 5 : 4,
            event.position,
            260,
            0.68,
            1.28,
            0,
            "tether-bloom-effects-v1",
          );
          break;
        case "tether-bloom-released":
          this.context.emitAuthoredEffect(6, event.position, 340, 0.62, 1.18, 0, "tether-bloom-effects-v1");
          break;
        case "aurum-arrived":
          this.context.emitAuthoredEffect(0, event.position, 420, 0.65, 1.4, 0, "aurum-hoarder-effects-v1");
          this.context.flashCircle(event.position, 28, 0xffd36b, 520, 2.8, true);
          break;
        case "aurum-fleeing":
          this.context.emitAuthoredEffect(3, event.position, 260, 0.62, 1.25, 0, "aurum-hoarder-effects-v1");
          this.context.flashCircle(event.target, 34, 0x68e4e8, 620, 2.2, true);
          break;
        case "aurum-armour-broken":
          this.context.flashCircle(event.position, 22, 0xffd36b, 260, 1.9, true);
          this.context.emitAuthoredEffect(1, event.position, 260, 0.68, 1.35, 0, "aurum-hoarder-effects-v1");
          break;
        case "scrap-secured":
          this.context.emitAuthoredEffect(2, event.position, 220, 0.52, 1.05, 0, "aurum-hoarder-effects-v1");
          break;
        case "aurum-escaped":
          this.context.emitAuthoredEffect(5, event.position, 380, 0.65, 1.4, 0, "aurum-hoarder-effects-v1");
          this.context.flashCircle(event.position, 24, 0x68e4e8, 380, 2.1, true);
          this.context.eventFeed.add("AURUM TARGET ESCAPED", "#ff9b5f");
          break;
        case "aurum-supply-cache-dropped":
          this.context.emitAuthoredEffect(7, event.position, 520, 0.72, 1.5, 0, "aurum-hoarder-effects-v1");
          this.context.flashCircle(event.position, 30, 0xffd36b, 560, 3, true);
          this.context.eventFeed.add("SUPPLY CACHE DROPPED", "#ffd36b");
          break;
        case "bastion-eater-phase":
          this.context.emitAuthoredEffect(9, event.position, 520, 0.9, 1.8, 0, "bastion-eater-effects-v1");
          this.context.shakeCamera(180, 0.008);
          this.context.eventFeed.add(`BASTION EATER: ${event.phase.replace("-", " ").toUpperCase()}`, "#ff9b5f");
          break;
        case "bastion-eater-claw-warning":
          this.context.emitAuthoredEffect(0, event.position, 520, 0.85, 1.5, Math.atan2(event.direction.y, event.direction.x), "bastion-eater-effects-v1");
          break;
        case "bastion-eater-claw-strike":
          this.context.emitAuthoredEffect(1, event.position, 300, 1, 1.7, Math.atan2(event.direction.y, event.direction.x), "bastion-eater-effects-v1");
          this.context.shakeCamera(130, 0.006);
          break;
        case "bastion-eater-charge":
          this.context.emitAuthoredEffect(2, event.position, 360, 0.9, 1.6, Math.atan2(event.direction.y, event.direction.x), "bastion-eater-effects-v1");
          break;
        case "bastion-eater-tendril":
          this.context.emitAuthoredEffect(event.warning ? 4 : 5, event.position, event.warning ? 520 : 340, 0.9, event.radiusMetres / 2.2, 0, "bastion-eater-effects-v1");
          break;
        case "bastion-eater-eggs":
          this.context.emitAuthoredEffect(6, event.position, 420, 0.9, 1.7, 0, "bastion-eater-effects-v1");
          break;
        case "bastion-eater-breach":
          this.context.emitAuthoredEffect(event.warning ? 0 : 3, event.position, event.warning ? 620 : 900, 0.65, event.radiusMetres / 0.8, 0, "bastion-eater-environment-v1");
          if (!event.warning) this.context.shakeCamera(220, 0.012);
          break;
        case "bastion-eater-vault":
          this.context.emitAuthoredEffect(6, event.position, 1800, 0.9, 1.5, 0, "bastion-eater-environment-v1");
          break;
        case "choir-voice-collapsed":
          this.context.emitAuthoredEffect(0, event.position, 520, 0.72, 1.5, 0, "the-choir-effects-v1");
          this.context.flashCircle(event.position, 28, 0xe788ff, 480, 2.2, true);
          this.context.eventFeed.add(`CHOIR VOICE LOST  /  ${event.voicesActive} REMAIN`, "#e7a4ff");
          break;
        case "choir-merged":
          this.context.emitAuthoredEffect(1, event.position, 760, 0.85, 2.1, 0, "the-choir-effects-v1");
          this.context.flashCircle(event.position, event.safeRadiusMetres * PIXELS_PER_METRE, 0x8de7ff, 700, 1.08, true);
          this.context.shakeCamera(180, 0.007);
          this.context.eventFeed.add("THE CHOIR MERGES  /  HOLD THE SAFE RADIUS", "#8de7ff");
          break;
        case "choir-pulse-warning":
          this.context.emitAuthoredEffect(2, event.position, 520, 0.7, 1.35, 0, "the-choir-effects-v1");
          this.context.flashCircle(event.position, event.radiusMetres * PIXELS_PER_METRE, 0xe788ff, 520, 1.02, true);
          break;
        case "choir-pulse":
          this.context.emitAuthoredEffect(3, event.position, 340, 0.78, 1.7, 0, "the-choir-effects-v1");
          this.context.flashCircle(event.position, event.radiusMetres * PIXELS_PER_METRE, 0xff72ba, 280, 1.04, true);
          if (event.hitPlayer) this.context.shakeCamera(110, 0.005);
          break;
        case "choir-flood-hit":
          this.context.emitAuthoredEffect(4, event.position, 260, 0.55, 1.25, 0, "the-choir-effects-v1");
          this.context.flashCircle(event.position, event.safeRadiusMetres * PIXELS_PER_METRE, 0x8de7ff, 220, 1.02, true);
          break;
        case "sovereign-fabrication-warning":
          this.context.emitAuthoredEffect(0, event.position, 560, 0.7, 1.35, 0, "foundry-sovereign-effects-v1");
          this.context.flashCircle(event.position, 70, 0xffb84d, 540, 1.7, true);
          this.context.eventFeed.add(`SOVEREIGN FABRICATION ${event.waveIndex + 1}`, "#ffcf72");
          break;
        case "sovereign-fabricated":
          this.context.emitAuthoredEffect(event.waveIndex >= 4 ? 5 : 4, event.position, 620, 0.72, 1.5, 0, "foundry-sovereign-effects-v1");
          event.childIds.forEach((_, index) => this.context.emitAuthoredEffect(
            index % 2 === 0 ? 2 : 3,
            { x: event.position.x + (index === 0 ? -1.5 : 1.5), y: event.position.y + 1.1 },
            460,
            0.62,
            1.2,
            0,
            "foundry-sovereign-effects-v1",
          ));
          this.context.flashCircle(event.position, 88, 0x8de7ff, 360, 1.9, true);
          this.context.eventFeed.add(`${event.childIds.length} UNITS ONLINE  /  x${event.buffMultiplier.toFixed(1)}`, "#8de7ff");
          break;
        case "obstacle-damaged":
          this.context.effectPool.emitBurst(event.position.x * PIXELS_PER_METRE, event.position.y * PIXELS_PER_METRE, 0xffd36b, 5);
          this.context.emitAuthoredEffect(event.source === "player-melee" ? 1 : event.source.startsWith("mini-boss") ? 4 : 0, event.position, 260, 0.72, 1.05, 0, "destructible-terrain-effects-v1");
          break;
        case "obstacle-destroyed":
          this.context.effectPool.emitBurst(event.position.x * PIXELS_PER_METRE, event.position.y * PIXELS_PER_METRE, 0xff6654, 8);
          this.context.emitAuthoredEffect(5, event.position, 420, 0.72, 1.25, 0, "destructible-terrain-effects-v1");
          this.context.shakeCamera(180, 0.008);
          break;
        case "mini-boss-reward-dropped":
          this.context.flashCircle(event.position, 30, 0xffd36b, 520, 3.2, true);
          this.context.eventFeed.add(
            `${event.miniBossKind.replaceAll("-", " ").toUpperCase()} REWARD AVAILABLE`,
            "#ffd36b",
          );
          break;
        case "item-granted":
          this.context.eventFeed.add(
            `ITEM ACQUIRED: ${event.itemId.replaceAll("-", " ").toUpperCase()}`,
            "#68e4e8",
          );
          break;
        case "player-revived":
          this.context.eventFeed.add("BASTION BEACON REVIVAL", "#68e4e8");
          break;
        case "status-applied":
          this.context.emitAuthoredEffect(statusEffectFrame(event.status), event.position, 320, 0.58, 1.12, 0, "batch-c-effects-v1");
          break;
        case "powerup-collected":
          this.context.showPickupBanner(event.powerupType);
          this.context.eventFeed.add(this.context.powerupDisplayName(event.powerupType).toUpperCase(), "#68e4e8");
          if (event.powerupType === "medkit") {
            this.context.synth.play(MEDKIT_HEAL_CUE);
            this.context.emitAuthoredEffect(2, event.position, 320, 0.5, 1.1, 0, "combat-effects-v1");
          } else {
            const dedicatedFrame = dedicatedPowerupFrame(event.powerupType);
            if (dedicatedFrame !== undefined) {
              this.context.emitAuthoredEffect(dedicatedFrame, event.position, 360, 0.32, 0.68, 0, "powerup-identity-atlas-v1");
            } else {
              const presentation = powerupPickupPresentation(event.powerupType);
              this.context.emitAuthoredEffect(presentation.frame ?? 0, event.position, 360, 0.6, 1.3, 0, "batch-c-rewards-v1");
            }
          }
          break;
        case "kit-activated":
          this.context.eventFeed.add("U-25 CORE ROUNDS ACTIVE", "#ffd36b");
          break;
        case "warp-arrival":
          this.context.emitAuthoredEffect(17, event.position, 280, 0.62, 1.2, 0, "batch-c-effects-v1");
          break;
        case "ultimate-fired":
          if (!this.context.settings.reducedFlashEnabled) this.context.flashCamera(140, 255, 214, 107);
          else this.context.flashCircle(event.position, 28, 0xffd66b, 420, 2.8, true);
          this.context.emitAuthoredEffect(10, event.position, 420, 0.7, 2.2, 0, "batch-c-effects-v1");
          this.context.emitAuthoredEffect(14, event.position, 460, 0.75, 2.4, 0, "batch-c-effects-v1");
          break;
        case "fence-activated":
          this.context.emitAuthoredEffect(9, event.from, 300, 0.55, 1.2, 0, "batch-c-effects-v1");
          this.context.emitAuthoredEffect(9, event.to, 300, 0.55, 1.2, 0, "batch-c-effects-v1");
          break;
        case "world-interaction-completed":
          this.context.emitAuthoredEffect(19, event.position, 320, 0.52, 1.1, 0, "batch-c-effects-v1");
          this.context.flashCircle(event.position, 22, 0x68e4e8, 380, 1.8, true);
          this.context.eventFeed.add(
            `${event.worldObjectId.replaceAll("-", " ").toUpperCase()}  /  ${event.effect.replaceAll("-", " ").toUpperCase()}`,
            "#68e4e8",
          );
          break;
        case "escort-objective-damaged":
          this.context.flashCircle(event.position, 24, 0xff9b5f, 240, 1.5, true);
          this.context.eventFeed.add(
            `ESCORT UNDER FIRE  /  ${Math.ceil(event.health)} OF ${Math.ceil(event.maxHealth)}`,
            "#ff9b5f",
          );
          break;
        case "escort-objective-completed":
          this.presentObjectiveOutcome(event.position, "ESCORT SECURED", true);
          break;
        case "escort-objective-failed":
          this.presentObjectiveOutcome(event.position, "ESCORT LOST", false);
          break;
        case "deny-objective-completed":
          this.presentObjectiveOutcome(event.position, "DENIAL ZONE HELD", true);
          break;
        case "deny-objective-failed":
          this.presentObjectiveOutcome(event.position, "DENIAL ZONE OVERRUN", false);
          break;
        case "collect-objective-picked-up":
          this.context.emitAuthoredEffect(19, event.position, 220, 0.5, 1.05, 0, "batch-c-effects-v1");
          this.context.eventFeed.add("OBJECTIVE PACKAGE RECOVERED", "#68e4e8");
          break;
        case "collect-objective-completed":
          this.presentObjectiveOutcome(event.position, "ALL PACKAGES SECURED", true);
          break;
        case "collect-objective-failed":
          this.presentObjectiveOutcome(event.position, "PACKAGE RECOVERY FAILED", false);
          break;
        case "infected-survivor-rush":
          this.context.emitAuthoredEffect(4, event.position, 220, 0.48, 0.95, 0, "batch-c-effects-v1");
          break;
        case "abomination-recovery":
          this.context.emitAuthoredEffect(5, event.position, 360, 0.62, 1.25, 0, "batch-c-effects-v1");
          break;
        case "foundry-turret-warning":
          this.context.emitFoundryEffect(3, event.position, 260, 0.45, 0.9, Math.atan2(event.target.y - event.position.y, event.target.x - event.position.x));
          this.context.flashCircle(event.target, 14, 0xff9b5f, 280, 1.35, true);
          break;
        case "foundry-child-powered-down":
          this.context.emitFoundryEffect(2, event.position, 320, 0.5, 1.05);
          break;
        case "assembly-prime-lane-fired":
          this.context.emitAssemblyPrimeEffect(2, event.position, 260, 0.58, 1.15);
          this.context.emitAssemblyPrimeEffect(2, event.endpoint, 260, 0.5, 1);
          if (event.hitPlayer) this.context.shakeCamera(90, 0.003);
          break;
        case "abomination-prime-warning":
          this.context.emitAbominationPrimeEffect(0, event.position, 360, 0.62, 1.25);
          this.context.flashCircle(
            event.target,
            Math.max(18, (event.radiusMetres ?? 0.75) * PIXELS_PER_METRE),
            0xff9b5f,
            420,
            1.15,
            true,
          );
          break;
        case "abomination-prime-hazard-tick":
          this.context.emitAbominationPrimeEffect(2, event.position, 180, 0.42, 0.82);
          break;
        case "brace-formation":
          this.context.flashCircle(event.position, 20, 0x68e4e8, 300, 1.6, true);
          this.context.eventFeed.add("FORMATION BRACED", "#68e4e8");
          break;
        case "deployable-placed":
          this.context.emitAuthoredEffect(19, event.position, 260, 0.48, 1, 0, "batch-c-effects-v1");
          this.context.eventFeed.add(`${event.weaponId.replaceAll("-", " ").toUpperCase()} DEPLOYED`, "#68e4e8");
          break;
        case "deployable-fired":
          this.context.emitAuthoredEffect(5, event.position, 90, 0.36, 0.68, 0, "combat-effects-v1");
          break;
        case "deployable-expired":
          this.context.emitAuthoredEffect(5, event.position, 260, 0.45, 0.9, 0, "batch-c-effects-v1");
          this.context.eventFeed.add(`${event.weaponId.replaceAll("-", " ").toUpperCase()} EXPIRED`, "#8fa1b3");
          break;
        case "scrap-spent":
          this.context.eventFeed.add(`-${event.amount} SCRAP  /  ${event.remaining} REMAIN`, "#ffd36b");
          break;
        case "weapon-sold":
          this.context.eventFeed.add(
            `${event.weaponId.replaceAll("-", " ").toUpperCase()} SOLD  /  +${event.amount} SCRAP`,
            "#ffd36b",
          );
          break;
        case "supply-chest-spawned":
          this.context.flashCircle(event.position, 22, 0x68e4e8, 420, 1.8, true);
          this.context.eventFeed.add(
            event.variant === "armored" ? "ARMOURED SUPPLY CACHE DETECTED" : "SUPPLY CACHE DETECTED",
            "#68e4e8",
          );
          break;
        case "supply-chest-hit":
          this.context.effectPool.emitBurst(
            event.position.x * PIXELS_PER_METRE,
            event.position.y * PIXELS_PER_METRE,
            0xffd36b,
            4,
          );
          this.context.emitAuthoredEffect(0, event.position, 180, 0.42, 0.82, 0, "destructible-terrain-effects-v1");
          break;
        case "supply-chest-opened":
          this.context.emitAuthoredEffect(5, event.position, 480, 0.62, 1.45, 0, "batch-c-rewards-v1");
          this.context.flashCircle(event.position, 28, 0x68e4e8, 520, 2.4, true);
          this.context.eventFeed.add("SUPPLY CACHE OPENED  /  REWARDS DEPLOYED", "#68e4e8");
          break;
        case "supply-chest-destroyed":
          this.context.effectPool.emitBurst(
            event.position.x * PIXELS_PER_METRE,
            event.position.y * PIXELS_PER_METRE,
            0xff9b5f,
            10,
          );
          this.context.emitAuthoredEffect(5, event.position, 520, 0.7, 1.65, 0, "destructible-terrain-effects-v1");
          this.context.flashCircle(event.position, 30, 0xffd36b, 480, 2.2, true);
          this.context.shakeCamera(130, 0.005);
          this.context.eventFeed.add("ARMOURED SUPPLY CACHE BREACHED  /  REWARDS DEPLOYED", "#ffd36b");
          break;
        default:
          assertNever(event);
      }
    }
  }

  private presentObjectiveOutcome(position: WorldPoint, label: string, success: boolean): void {
    const color = success ? 0x68e4e8 : 0xff6b54;
    this.context.emitAuthoredEffect(success ? 2 : 5, position, 520, 0.72, 1.6, 0, "batch-c-effects-v1");
    this.context.flashCircle(position, 34, color, 620, 2.5, true);
    this.context.shakeCamera(success ? 90 : 160, success ? 0.003 : 0.007);
    this.context.eventFeed.add(label, success ? "#68e4e8" : "#ff6b54");
  }

}

function assertNever(value: never): never {
  throw new Error(`Unhandled combat event: ${JSON.stringify(value)}`);
}

function statusEffectFrame(status: string): number {
  switch (status) {
    case "blaze": return 0;
    case "overload": return 1;
    case "freeze": return 2;
    case "corrode": return 3;
    default: return 4;
  }
}
