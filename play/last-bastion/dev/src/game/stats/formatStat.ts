import { armourDamageMultiplier } from "./DefenceStats";
/**
 * The single display path for every stat and damage number.
 *
 * The balance model calculates in full floating point and rounds only for
 * display (see wave_balance.md "Numeric precision"). At a 2-damage baseline a
 * `+15%` bonus is worth 0.3, so the game must never round simulation state —
 * but the player still needs legible numbers. `formatStat` is that boundary:
 * round-half-up to a fixed number of decimals, then trim trailing zeros so
 * `2.0` reads as `2` while `2.05` reads as `2.1`.
 *
 * Keeping one implementation means no two surfaces (HUD, floating numbers,
 * stat cards, tooltips) can disagree about what 2.05 is.
 */

/** Decimals for anything the player reads at a glance. */
export const DISPLAY_DECIMALS = 1;

/** Decimals for debug/comparison readouts and precision assertions in tests. */
export const DEBUG_DECIMALS = 3;

/**
 * Round-half-up to `decimals` places with trailing zeros (and a bare trailing
 * dot) trimmed. Non-finite input formats as `0`. Values are non-negative in
 * practice (damage, health, armour), and the half-up tie-break is applied in
 * that direction; the small epsilon nudge defends against binary-float error
 * such as `2.05 * 10 === 20.499999999999996` so ties still round up.
 */
export function formatStat(value: number, decimals: number = DISPLAY_DECIMALS): string {
  const safeDecimals = Math.max(0, Math.floor(decimals));
  const safeValue = Number.isFinite(value) ? value : 0;
  const factor = 10 ** safeDecimals;
  const nudge = safeValue >= 0 ? 1e-9 : -1e-9;
  const rounded = Math.round(safeValue * factor + nudge) / factor;
  // Collapse a negative zero so it never displays as "-0".
  const normalized = rounded === 0 ? 0 : rounded;

  let text = normalized.toFixed(safeDecimals);
  if (text.includes(".")) {
    text = text.replace(/\.?0+$/, "");
  }
  return text;
}

/**
 * Armour is diminishing — `armour / (armour + 15)` — so the raw number tells a
 * player nothing: 12 armour is 44% reduction and the 13th point is worth less
 * than the 12th. The effective percentage is the honest readout.
 *
 * Flat reduction is shown separately because it behaves differently: it is
 * subtracted *after* the percentage step and is floored at 0.1, so folding the
 * two into one figure would misrepresent both. Omitted when zero, which is the
 * common case — only Reactive Plating grants it.
 */
export function armourLabel(armour: number, flatDamageReduction: number): string {
  if (armour <= 0 && flatDamageReduction <= 0) return "";
  // Floored, not rounded: armour is asymptotic and never reaches 100%
  // reduction, so rounding 99.85% up to "100%" would tell the player they are
  // immune. Flooring also never overstates mitigation at any value.
  const reduction = Math.floor((1 - armourDamageMultiplier(armour)) * 100);
  const flat = flatDamageReduction > 0 ? `  -${flatDamageReduction.toFixed(1)}` : "";
  return `  •  ARM ${Math.round(armour)} (${reduction}%)${flat}`;
}


/**
 * `M:SS` for a run clock. The single implementation — `RunSummaryScene` used to
 * carry its own copy, and two formatters disagreeing about what 59.7 seconds is
 * would show a different duration on the HUD than on the summary that follows it.
 *
 * Floors rather than rounds, so the live clock never displays a second the run
 * has not actually reached. Hours are included only when a run gets there, which
 * keeps the common case narrow enough for the top-centre panel.
 */
export function formatRunClock(seconds: number): string {
  const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(whole / 60);
  const secondsPart = String(whole % 60).padStart(2, "0");
  if (minutes < 60) return `${minutes}:${secondsPart}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, "0")}:${secondsPart}`;
}

export interface WaveCountdownView {
  /** False on clear-all waves, which have no countdown by design. */
  readonly visible: boolean;
  readonly remainingSeconds: number;
  /** 1 at wave start draining to 0, for a bar that empties as time runs out. */
  readonly remainingFraction: number;
  /** Last five seconds — the cue to stop looting and brace. */
  readonly urgent: boolean;
}

/**
 * Whether to draw a wave countdown, and how full it is.
 *
 * Waves 1-2, 5 and 10 deliberately have no countdown: 1-2 are clear-all
 * onboarding (their `durationSeconds` is the spawn-schedule window, not an
 * ending), and 5 and 10 are the elite and boss waves, which end when cleared.
 * Showing a draining bar on those would promise an ending that never comes, so
 * `timerEndsWave` — not the presence of a duration — is the gate.
 */
export function waveCountdownView(
  elapsedSeconds: number,
  durationSeconds: number | null,
  timerEndsWave: boolean,
  inCombat: boolean,
): WaveCountdownView {
  const hidden = { visible: false, remainingSeconds: 0, remainingFraction: 0, urgent: false } as const;
  if (!timerEndsWave || !inCombat) return hidden;
  if (durationSeconds === null || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return hidden;
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const remainingSeconds = Math.max(0, durationSeconds - elapsed);
  return {
    visible: true,
    // Ceiling so the readout only shows 0 once the wave is genuinely over,
    // matching the existing numeric suffix rather than contradicting it.
    remainingSeconds: Math.ceil(remainingSeconds),
    remainingFraction: clamp01(remainingSeconds / durationSeconds),
    urgent: remainingSeconds <= 5,
  };
}

export interface HealthBarView {
  /** 0..1 of the health track. Clamped — the fill must never leave its frame. */
  readonly healthFraction: number;
  /** 0..1 on the SAME scale as health, so one shield point reads as one health point. */
  readonly shieldFraction: number;
  readonly shieldTrackVisible: boolean;
  readonly shieldFillVisible: boolean;
  /** 0..1 on the SAME scale as health, for the overheal overlay. */
  readonly bonusFraction: number;
  readonly bonusVisible: boolean;
}

/**
 * `+4` suffix for the health readout, per §11.3's `12/12 +4`. The pool is the
 * unambiguous readout — the bar overlay is a glance cue, the number is the fact.
 * Ceiled so a sliver of bonus health never reads as `+0`.
 */
export function bonusHealthLabel(bonusHealth: number): string {
  if (!Number.isFinite(bonusHealth) || bonusHealth <= 0) return "";
  return `  +${Math.ceil(bonusHealth)}`;
}

/**
 * Pure layout maths for the health/shield cluster, kept out of `CombatHud` so it
 * can be tested without booting Phaser.
 *
 * Shield deliberately shares the health bar's pixel-per-point scale rather than
 * getting its own full-width bar: shield totals are small (Shield Capacitor
 * grants 1.5 per level) against a health pool in the tens, and a full-width bar
 * would imply a second health pool of equal weight.
 */
export function healthBarView(
  health: number,
  maxHealth: number,
  shield: number,
  maxShield: number,
  bonusHealth = 0,
): HealthBarView {
  const safeMax = Math.max(1, maxHealth);
  return {
    healthFraction: clamp01(health / safeMax),
    shieldFraction: clamp01(shield / safeMax),
    // The track shows whenever shield is *possible*, so the player can see the
    // capacity they bought even while it is depleted and recharging.
    shieldTrackVisible: maxShield > 0,
    shieldFillVisible: maxShield > 0 && shield > 0,
    // Overheal shares the health scale too, and is drawn as an overlay rather
    // than by rescaling the bar — rescaling would make the same HP value change
    // width, which is the one thing a bar must never do.
    bonusFraction: clamp01(bonusHealth / safeMax),
    bonusVisible: bonusHealth > 0,
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value);
}
