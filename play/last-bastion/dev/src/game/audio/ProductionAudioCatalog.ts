import type { WeaponId } from "../content/weaponCatalog";
import batchS1Manifest from "../../../../audio/production/batch-s1/manifest.json";

export type WeaponAudioRole = "one-shot" | "loop-start" | "loop" | "loop-end";
export type WeaponAudioPriority = "critical" | "high" | "standard";

export interface ProductionAudioAssetSpec {
  readonly id: string;
  readonly fileStem: string;
  readonly role: WeaponAudioRole;
  readonly durationMs: readonly [minimum: number, maximum: number];
  readonly seamlessLoop?: boolean;
}

export interface WeaponAudioFamilySpec {
  readonly weaponId: WeaponId;
  /** Existing simulation-facing cue id; production samples replace its synth without changing events. */
  readonly triggerCueId: string;
  readonly priority: WeaponAudioPriority;
  readonly maxVoices: number;
  readonly minimumRetriggerMs: number;
  readonly assets: readonly ProductionAudioAssetSpec[];
}

/**
 * Task 67 / Batch S1 production handoff. Source masters are mono 48 kHz / 24-bit WAV;
 * generated runtime files use the same stems. No file is referenced by the build until
 * it exists, so the current WebAudio synth remains an offline-safe fallback.
 */
export const PRODUCTION_AUDIO_S1_FAMILIES: Readonly<Record<WeaponId, WeaponAudioFamilySpec>> = Object.freeze(
  Object.fromEntries(batchS1Manifest.families.map((entry) => [entry.weaponId, family(
    entry.weaponId as WeaponId,
    entry.triggerCueId,
    entry.priority as WeaponAudioPriority,
    entry.maxVoices,
    entry.minimumRetriggerMs,
    entry.assets.map((asset) => Object.freeze({
      ...asset,
      role: asset.role as WeaponAudioRole,
      durationMs: [asset.durationMs[0] ?? 0, asset.durationMs[1] ?? 0] as const,
    })),
  )])) as Record<WeaponId, WeaponAudioFamilySpec>,
);

export const PRODUCTION_AUDIO_S1_ASSETS: readonly ProductionAudioAssetSpec[] = Object.freeze(
  Object.values(PRODUCTION_AUDIO_S1_FAMILIES).flatMap((entry) => entry.assets),
);

export function productionAudioFamilyForCue(cueId: string): WeaponAudioFamilySpec | null {
  return Object.values(PRODUCTION_AUDIO_S1_FAMILIES).find((entry) => entry.triggerCueId === cueId) ?? null;
}

export function canStartProductionAudioVoice(
  cueId: string,
  nowMs: number,
  lastStartedMs: number | undefined,
  activeVoices: number,
): boolean {
  const familySpec = productionAudioFamilyForCue(cueId);
  if (!familySpec) return true;
  return activeVoices < familySpec.maxVoices
    && (lastStartedMs === undefined || nowMs - lastStartedMs >= familySpec.minimumRetriggerMs);
}

function family(
  weaponId: WeaponId,
  triggerCueId: string,
  priority: WeaponAudioPriority,
  maxVoices: number,
  minimumRetriggerMs: number,
  assets: readonly ProductionAudioAssetSpec[],
): WeaponAudioFamilySpec {
  return Object.freeze({ weaponId, triggerCueId, priority, maxVoices, minimumRetriggerMs, assets: Object.freeze(assets) });
}
