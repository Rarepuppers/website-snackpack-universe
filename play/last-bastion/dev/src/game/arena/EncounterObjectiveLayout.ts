import type { Vector2Data } from "../math/Vector2Data";

export type EncounterObjectiveKind = "gate-button" | "gate" | "turret-console" | "trap-console";
export interface EncounterObjectivePoint { id: string; kind: EncounterObjectiveKind; position: Vector2Data; footprintMetres: number; linkedGateId?: string; }
export interface EncounterObjectiveLayout { seed: number; objectives: readonly EncounterObjectivePoint[]; playerSpawn: Vector2Data; enemySpawnLanes: readonly Vector2Data[]; reservedClearanceMetres: number; }

/** Authored, seeded objective layer. Procedural furnishing remains responsible for ordinary scenery. */
export function createEncounterObjectiveLayout(widthMetres: number, heightMetres: number, seed: number): EncounterObjectiveLayout {
  const centre = { x: widthMetres / 2, y: heightMetres / 2 };
  const gateY = Math.max(4, Math.min(heightMetres - 4, centre.y));
  return {
    seed,
    playerSpawn: centre,
    enemySpawnLanes: [{ x: 2.5, y: gateY }, { x: widthMetres - 2.5, y: gateY }],
    reservedClearanceMetres: 4,
    objectives: [
      { id: "objective-gate-button", kind: "gate-button", position: { x: centre.x - 5, y: gateY }, footprintMetres: 0.7, linkedGateId: "objective-gate" },
      { id: "objective-gate", kind: "gate", position: { x: centre.x, y: gateY }, footprintMetres: 4, linkedGateId: "objective-gate-button" },
      { id: "objective-turret-console", kind: "turret-console", position: { x: centre.x + 6, y: centre.y - 5 }, footprintMetres: 1.2 },
      { id: "objective-trap-console", kind: "trap-console", position: { x: centre.x + 6, y: centre.y + 5 }, footprintMetres: 1.2 },
    ],
  };
}

export function objectiveLayoutHasReachableGateSides(layout: EncounterObjectiveLayout, widthMetres: number, heightMetres: number): boolean {
  const gate = layout.objectives.find((objective) => objective.kind === "gate");
  if (!gate) return false;
  const cols = Math.max(3, Math.ceil(widthMetres));
  const rows = Math.max(3, Math.ceil(heightMetres));
  const blocked = (x: number, y: number) => Math.abs(x - gate.position.x) < gate.footprintMetres / 2 && Math.abs(y - gate.position.y) < 0.6;
  const start = { x: 1, y: Math.max(1, Math.min(rows - 2, Math.round(gate.position.y))) };
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  while (queue.length) {
    const point = queue.shift()!;
    for (const next of [{ x: point.x + 1, y: point.y }, { x: point.x - 1, y: point.y }, { x: point.x, y: point.y + 1 }, { x: point.x, y: point.y - 1 }]) {
      if (next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows || blocked(next.x, next.y)) continue;
      const key = `${next.x},${next.y}`;
      if (!seen.has(key)) { seen.add(key); queue.push(next); }
    }
  }
  return [...seen].some((key) => Number(key.split(",")[0]) >= cols - 2);
}
