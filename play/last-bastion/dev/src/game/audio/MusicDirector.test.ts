import { describe, expect, it } from "vitest";
import { stepMusicDirector, type MusicDirectorState } from "./MusicDirector";

describe("MusicDirector", () => {
  it("holds intensity and transitions to calm only after hysteresis", () => {
    let state: MusicDirectorState = { layer: "calm", intensitySeconds: 0, calmSeconds: 4 };
    state = stepMusicDirector(state, { status: "combat", currentEnemies: 8, liveCap: 10, bossPresent: false, deltaSeconds: 2 });
    expect(state.layer).toBe("intensity");
    state = stepMusicDirector(state, { status: "combat", currentEnemies: 0, liveCap: 10, bossPresent: false, deltaSeconds: 3 });
    expect(state.layer).toBe("intensity");
    state = stepMusicDirector(state, { status: "combat", currentEnemies: 0, liveCap: 10, bossPresent: false, deltaSeconds: 1 });
    expect(state.layer).toBe("calm");
  });
});
