import type { EnemyThreatClass } from "./EnemyHealthBars";

/**
 * Per-threat-class geometry for the world-space enemy health bar.
 *
 * §11.6 item 5: the boss gets a dedicated `bossPanel`, but elites and
 * mini-bosses used the ordinary 34x4 bar with a single 3px pip and did not read
 * as special at all. At 30+ enemy density a pip that small is invisible, so rank
 * is carried by three redundant channels instead — size, an outline frame, and
 * pip count — rather than by colour alone, which four colour-vision modes make
 * unreliable.
 *
 * Phaser-free so it can be unit-tested; `EnemyHealthBars` imports Phaser.
 */

export interface EnemyBarStyle {
  readonly width: number;
  readonly height: number;
  /** Outline around the health track, drawn in `accent`. */
  readonly framed: boolean;
  /** Frame and pip colour; null where the class gets no rank marking. */
  readonly accent: number | null;
  /** Rank pips drawn to the right of the bar. */
  readonly pips: number;
  /** Dividers across the fill; 1 means an unbroken bar. */
  readonly segments: number;
}

const ELITE_GOLD = 0xffcf70;
const BOSS_AMBER = 0xff9a52;

const STYLES: Readonly<Record<EnemyThreatClass, EnemyBarStyle>> = Object.freeze({
  standard: Object.freeze({ width: 34, height: 4, framed: false, accent: null, pips: 0, segments: 1 }),
  specialist: Object.freeze({ width: 34, height: 4, framed: false, accent: null, pips: 0, segments: 1 }),
  elite: Object.freeze({ width: 44, height: 5, framed: true, accent: ELITE_GOLD, pips: 1, segments: 1 }),
  "mini-boss": Object.freeze({ width: 52, height: 6, framed: true, accent: ELITE_GOLD, pips: 2, segments: 4 }),
  // The boss also has the full-width `bossPanel`; this is its world-space bar.
  boss: Object.freeze({ width: 60, height: 7, framed: true, accent: BOSS_AMBER, pips: 3, segments: 4 }),
});

export function enemyBarStyle(threatClass: EnemyThreatClass): EnemyBarStyle {
  return STYLES[threatClass] ?? STYLES.standard;
}

/**
 * Row offsets derived from bar height rather than hard-coded, so a taller elite
 * bar does not overlap its own shield strip. At the standard height of 4 these
 * return exactly the previously hard-coded 5 and 9.
 */
export function shieldRowY(style: EnemyBarStyle): number {
  return style.height + 1;
}

export function buildupRowY(style: EnemyBarStyle): number {
  return style.height + 5;
}
