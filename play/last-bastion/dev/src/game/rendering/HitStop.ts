export const HIT_STOP_FRAME_MILLISECONDS = 1000 / 60;
export const CRITICAL_HIT_STOP_FRAMES = 2;
export const DEFEAT_HIT_STOP_FRAMES = 4;

export interface HitStopPreference {
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly intensityMultiplier: number;
}

export interface HitStopTriggers {
  readonly criticalHits: number;
  readonly enemyDefeats: number;
}

/**
 * Presentation-only pause requested by one rendered frame's simulation deltas.
 * Multiple crits/kills take the strongest beat rather than stacking into a stall.
 */
export function requestedHitStopMilliseconds(
  triggers: HitStopTriggers,
  preference: HitStopPreference,
): number {
  if (!preference.enabled || preference.reducedMotion) return 0;
  const intensity = Number.isFinite(preference.intensityMultiplier)
    ? Math.min(1, Math.max(0, preference.intensityMultiplier))
    : 1;
  const frames = triggers.enemyDefeats > 0
    ? DEFEAT_HIT_STOP_FRAMES
    : triggers.criticalHits > 0 ? CRITICAL_HIT_STOP_FRAMES : 0;
  return frames * HIT_STOP_FRAME_MILLISECONDS * intensity;
}

export interface HitStopFramePlan {
  readonly freezeFrame: boolean;
  readonly nextRemainingMilliseconds: number;
}

/** Uses raw host-frame time; Phaser clocks may already be frozen. */
export function consumeHitStopFrame(
  remainingMilliseconds: number,
  elapsedMilliseconds: number,
): HitStopFramePlan {
  const remaining = Number.isFinite(remainingMilliseconds)
    ? Math.max(0, remainingMilliseconds)
    : 0;
  if (remaining <= 0) return { freezeFrame: false, nextRemainingMilliseconds: 0 };
  const elapsed = Number.isFinite(elapsedMilliseconds) ? Math.max(0, elapsedMilliseconds) : 0;
  return {
    freezeFrame: true,
    nextRemainingMilliseconds: Math.max(0, remaining - elapsed),
  };
}

export function mergeHitStopRequest(current: number, requested: number): number {
  const safeCurrent = Number.isFinite(current) ? Math.max(0, current) : 0;
  const safeRequested = Number.isFinite(requested) ? Math.max(0, requested) : 0;
  return Math.max(safeCurrent, safeRequested);
}
