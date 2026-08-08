export interface DisplayCalibrationPreference {
  readonly brightness: number;
  readonly gamma: number;
}

export interface DisplayCalibrationPlan {
  readonly brightness: number;
  readonly gamma: number;
  /** SVG feComponentTransfer exponent; gamma > 1 lightens midtones. */
  readonly exponent: number;
  readonly identity: boolean;
}

export function planDisplayCalibration(
  preference: DisplayCalibrationPreference,
): DisplayCalibrationPlan {
  const brightness = bounded(preference.brightness, 1, 0.5, 1.5);
  const gamma = bounded(preference.gamma, 1, 0.5, 2);
  return {
    brightness,
    gamma,
    exponent: 1 / gamma,
    identity: brightness === 1 && gamma === 1,
  };
}

function bounded(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
