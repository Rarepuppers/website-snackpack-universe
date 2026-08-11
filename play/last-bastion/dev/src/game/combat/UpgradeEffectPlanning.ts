import type { UpgradeId } from "../content/upgradeCatalog";
import type { DamageType } from "./damageTypes";

type ElementalDamageType = Exclude<DamageType, "physical">;

export interface WeaponUpgradeEffect {
  readonly fireIntervalMultiplier?: number;
  readonly projectileCountDelta?: number;
  readonly minimumSpreadRadians?: number;
  readonly pierceCountDelta?: number;
  readonly minimumExplosionRadiusMetres?: number;
  readonly projectileDamageMultiplier?: number;
  readonly damageType?: DamageType;
  readonly chainCountDelta?: number;
  readonly minimumChainRadiusMetres?: number;
  readonly rangeMultiplier?: number;
  readonly projectileLifetimeMultiplier?: number;
}

export interface StatusUpgradeEffect {
  readonly buildupMultiplierSet?: Readonly<Partial<Record<ElementalDamageType, number>>>;
  readonly buildupMultiplierDelta?: Readonly<Partial<Record<ElementalDamageType, number>>>;
  readonly blazeBonusDamagePerSecond?: number;
  readonly corrodeBonusDamagePerSecond?: number;
  readonly freezeSpeedMultiplierOverride?: number;
  readonly freezeDurationBonusSeconds?: number;
  readonly combustionOnDeath?: boolean;
}

export interface DefenceUpgradeEffect {
  readonly armourDelta?: number;
  readonly maxShieldDelta?: number;
  readonly flatDamageReductionDelta?: number;
  readonly hitInvulnerabilitySecondsDelta?: number;
  readonly slowResistanceDelta?: number;
  readonly shieldRechargePerSecondMultiplier?: number;
  readonly shieldRechargeDelaySecondsMultiplier?: number;
}

export interface UpgradeEffectPlan {
  readonly weapon?: WeaponUpgradeEffect;
  readonly status?: StatusUpgradeEffect;
  readonly defence?: DefenceUpgradeEffect;
  readonly minimumExplosionSplashMultiplier?: number;
  readonly magnetMultiplier?: number;
  readonly moveSpeedMultiplier?: number;
  readonly supportEffectMultiplier?: number;
  readonly scrapMultiplier?: number;
}

export function planUpgradeEffect(upgradeId: UpgradeId, level: number): UpgradeEffectPlan {
  switch (upgradeId) {
    case "rapid-cycling":
      return { weapon: { fireIntervalMultiplier: 0.85 } };
    case "twin-shot":
      return { weapon: { projectileCountDelta: 1, minimumSpreadRadians: 0.11 } };
    case "piercing-rounds":
      return { weapon: { pierceCountDelta: 1 } };
    case "explosive-payload":
      return {
        weapon: { minimumExplosionRadiusMetres: level === 1 ? 1.4 : level === 2 ? 1.8 : 2.2 },
        minimumExplosionSplashMultiplier: 0.4 + level * 0.1,
      };
    case "heavy-calibre":
      return { weapon: { projectileDamageMultiplier: 1.35, fireIntervalMultiplier: 1.1 } };
    case "field-magnet":
      return { magnetMultiplier: 1.5 };
    case "incendiary-rounds":
      if (level === 1) return { weapon: { damageType: "fire" } };
      if (level === 2) return { status: { buildupMultiplierSet: { fire: 1.2 }, blazeBonusDamagePerSecond: 0.3 } };
      return { status: { combustionOnDeath: true } };
    case "cryo-coating":
      if (level === 1) return { weapon: { damageType: "cryo" } };
      if (level === 2) return { status: { buildupMultiplierSet: { cryo: 1.2 }, freezeSpeedMultiplierOverride: 0.22 } };
      return { status: { freezeDurationBonusSeconds: 0.8, freezeSpeedMultiplierOverride: 0.15 } };
    case "chain-lightning":
      return {
        weapon: { chainCountDelta: 1, minimumChainRadiusMetres: 2.1 + level * 0.4 },
        ...(level >= 2 ? { status: { buildupMultiplierDelta: { shock: 0.1 } } } : {}),
      };
    case "adrenal-servos":
      return { moveSpeedMultiplier: 1.12 };
    case "composite-plating":
      return { defence: { armourDelta: 3 } };
    case "shield-capacitor":
      return { defence: { maxShieldDelta: 1.5 } };
    case "corrosive-rounds":
      if (level === 1) return { weapon: { damageType: "toxic" } };
      if (level === 2) return { status: { buildupMultiplierSet: { toxic: 1.2 }, corrodeBonusDamagePerSecond: 0.3 } };
      return { status: { corrodeBonusDamagePerSecond: 0.7 } };
    case "catalyst-array":
      return { status: { buildupMultiplierDelta: { fire: 0.15, shock: 0.15, cryo: 0.15, toxic: 0.15 } } };
    case "marksman-barrels":
      return { weapon: { rangeMultiplier: 1.2, projectileLifetimeMultiplier: 1.2 } };
    case "reactive-plating":
      return { defence: { flatDamageReductionDelta: 0.3 } };
    case "kinetic-buffer":
      return { defence: { hitInvulnerabilitySecondsDelta: 0.05, slowResistanceDelta: 0.25 } };
    case "capacitor-array":
      return { defence: { shieldRechargePerSecondMultiplier: 1.4, shieldRechargeDelaySecondsMultiplier: 0.8 } };
    case "field-transfusion":
      return { supportEffectMultiplier: 1.25 };
    case "salvage-drones":
      return { scrapMultiplier: 1.2 };
    default:
      return assertUpgradeHandled(upgradeId);
  }
}

function assertUpgradeHandled(upgradeId: never): never {
  throw new Error(`Unhandled upgrade effect: ${String(upgradeId)}`);
}
