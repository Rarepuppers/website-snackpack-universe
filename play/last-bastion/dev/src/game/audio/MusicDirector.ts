export type MusicLayer = "title" | "calm" | "intensity" | "boss" | "victory" | "defeat";
export interface MusicDirectorState { layer: MusicLayer; intensitySeconds: number; calmSeconds: number; }
export interface MusicDirectorInput { status: "combat" | "victory" | "defeat"; currentEnemies: number; liveCap: number; bossPresent: boolean; deltaSeconds: number; }

/** Hysteretic, presentation-only music selection driven by density snapshots. */
export function stepMusicDirector(state: MusicDirectorState, input: MusicDirectorInput): MusicDirectorState {
  if (input.status === "victory" || input.status === "defeat") return { ...state, layer: input.status };
  if (input.bossPresent) return { ...state, layer: "boss", intensitySeconds: 0, calmSeconds: 0 };
  const ratio = input.liveCap > 0 ? input.currentEnemies / input.liveCap : 0;
  const intensitySeconds = ratio >= 0.65 ? state.intensitySeconds + Math.max(0, input.deltaSeconds) : 0;
  const calmSeconds = ratio <= 0.35 ? state.calmSeconds + Math.max(0, input.deltaSeconds) : 0;
  const layer = state.layer === "intensity" && intensitySeconds < 2 && calmSeconds < 4
    ? "intensity"
    : intensitySeconds >= 2 ? "intensity" : calmSeconds >= 4 ? "calm" : state.layer;
  return { layer, intensitySeconds, calmSeconds };
}
