import { describe, expect, it } from "vitest";
import { CombatTelemetryAccumulator } from "./CombatTelemetry";
import type { CombatEvent } from "../combat/CombatSimulation";

const frame = (events: CombatEvent[] = []) => ({
  events,
  projectiles: [{ id: 1 }],
  enemyProjectiles: [],
  density: {
    currentLiveEnemies: 2, peakLiveEnemies: 3, spawnCapBlockedSeconds: 1,
    threatSpawned: 4, peakEnemyProjectiles: 0, pressureSpawned: { pursuit: 2 },
  },
});

describe("CombatTelemetryAccumulator", () => {
  it("is deterministic and accumulates explicit frame/event data", () => {
    const run = () => {
      const telemetry = new CombatTelemetryAccumulator();
      telemetry.recordSnapshot(0.5, frame([
        { type: "enemy-hit", damage: 4, damageType: "fire", position: { x: 0, y: 0 }, enemyId: 1 },
        { type: "enemy-defeated", position: { x: 0, y: 0 }, enemyType: "slime-spitter", bestiaryKey: "slime" },
      ]) as never);
      return telemetry.toSnapshot();
    };
    expect(run()).toEqual(run());
    expect(run()).toMatchObject({ elapsedSeconds: 0.5, averageLiveEnemies: 2, peakLiveEnemies: 3, kills: 1, damageDealt: { fire: 4 } });
  });
});
