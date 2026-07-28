export type EffectQualityPreference = "auto" | "high" | "medium" | "low";
export type EffectQualityTier = Exclude<EffectQualityPreference, "auto">;

export interface CombatEffectsBudget {
  readonly maximumActiveEffects: number;
  readonly burstScale: number;
  readonly maximumDamageNumbers: number;
}

export interface PerformanceSnapshot {
  readonly preference: EffectQualityPreference;
  readonly tier: EffectQualityTier;
  readonly averageFrameMilliseconds: number;
}

const DOWNGRADE_HOLD_MS = 1_500;
const UPGRADE_HOLD_MS = 7_000;
const CHANGE_COOLDOWN_MS = 4_000;
const WARMUP_MS = 2_000;

/**
 * Frame-time governor for cosmetic combat work only. Hysteresis prevents
 * oscillation: quality falls quickly under sustained pressure and recovers
 * slowly after several seconds of stable headroom.
 */
export class AdaptivePerformanceGovernor {
  private preference: EffectQualityPreference;
  private tier: EffectQualityTier;
  private averageFrameMilliseconds = 16.67;
  private sampledMilliseconds = 0;
  private slowMilliseconds = 0;
  private fastMilliseconds = 0;
  private cooldownMilliseconds = 0;

  constructor(preference: EffectQualityPreference = "auto") {
    this.preference = preference;
    this.tier = preference === "auto" ? "high" : preference;
  }

  snapshot(): PerformanceSnapshot {
    return {
      preference: this.preference,
      tier: this.tier,
      averageFrameMilliseconds: this.averageFrameMilliseconds,
    };
  }

  setPreference(preference: EffectQualityPreference): boolean {
    this.preference = preference;
    this.resetPressure();
    if (preference === "auto") return false;
    if (this.tier === preference) return false;
    this.tier = preference;
    return true;
  }

  sample(deltaMilliseconds: number, suspended = false): boolean {
    if (suspended || !Number.isFinite(deltaMilliseconds) || deltaMilliseconds <= 0) {
      this.resetPressure();
      return false;
    }
    const sample = Math.max(5, Math.min(deltaMilliseconds, 50));
    this.averageFrameMilliseconds += (sample - this.averageFrameMilliseconds) * 0.08;
    this.sampledMilliseconds += sample;
    if (this.preference !== "auto" || this.sampledMilliseconds < WARMUP_MS) return false;

    this.cooldownMilliseconds = Math.max(0, this.cooldownMilliseconds - sample);
    if (this.cooldownMilliseconds > 0) return false;

    const downgradeThreshold = this.tier === "high" ? 20 : 28;
    const upgradeThreshold = this.tier === "low" ? 19 : 17.5;
    if (this.tier !== "low" && this.averageFrameMilliseconds > downgradeThreshold) {
      this.slowMilliseconds += sample;
      this.fastMilliseconds = 0;
      if (this.slowMilliseconds >= DOWNGRADE_HOLD_MS) {
        this.tier = this.tier === "high" ? "medium" : "low";
        this.afterChange();
        return true;
      }
      return false;
    }
    if (this.tier !== "high" && this.averageFrameMilliseconds < upgradeThreshold) {
      this.fastMilliseconds += sample;
      this.slowMilliseconds = 0;
      if (this.fastMilliseconds >= UPGRADE_HOLD_MS) {
        this.tier = this.tier === "low" ? "medium" : "high";
        this.afterChange();
        return true;
      }
      return false;
    }
    this.slowMilliseconds = 0;
    this.fastMilliseconds = 0;
    return false;
  }

  private afterChange(): void {
    this.slowMilliseconds = 0;
    this.fastMilliseconds = 0;
    this.cooldownMilliseconds = CHANGE_COOLDOWN_MS;
  }

  private resetPressure(): void {
    this.slowMilliseconds = 0;
    this.fastMilliseconds = 0;
  }
}

export function combatEffectsBudget(
  tier: EffectQualityTier,
  stressProfile: 4 | 12 | null,
): CombatEffectsBudget {
  if (tier === "low") {
    return { maximumActiveEffects: 48, burstScale: 0.45, maximumDamageNumbers: 10 };
  }
  if (tier === "medium") {
    return { maximumActiveEffects: 96, burstScale: 0.7, maximumDamageNumbers: 16 };
  }
  return {
    maximumActiveEffects: stressProfile === 12 ? 192 : 128,
    burstScale: 1,
    maximumDamageNumbers: 24,
  };
}
