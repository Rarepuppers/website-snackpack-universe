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
