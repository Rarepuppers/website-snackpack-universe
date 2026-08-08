export interface ScreenShakePreference {
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly intensityMultiplier: number;
}

/** Returns zero when shake is disabled or reduced motion is active. */
export function screenShakeIntensity(
  authoredIntensity: number,
  preference: ScreenShakePreference,
): number {
  if (!preference.enabled || preference.reducedMotion) return 0;
  const multiplier = Number.isFinite(preference.intensityMultiplier)
    ? Math.min(1, Math.max(0, preference.intensityMultiplier))
    : 1;
  return Math.max(0, authoredIntensity) * multiplier;
}
