import { describe, expect, it } from "vitest";
import { placeWorldObjects, MIN_LANE_WIDTH_METRES } from "./WorldObjectPlacement";
import { ARENA_THEME_FAMILY_IDS } from "./WorldObjectCatalog";
import { BASTION_ARENA, type ArenaObstacle } from "./ArenaDefinition";

/**
 * The navigation guarantee (world-object-production-plan.md 3.1.5).
 *
 * The plan asked for this and it was never built: "destruction must not strand
 * a pickup or invalidate the only route… This needs a test, not a hope." A
 * furnished room that quietly walls off a corner does not crash, does not fail
 * a type check, and ruins a run — so it needs checking by construction.
 *
 * The check is a flood fill on a grid finer than the player's diameter. Every
 * open cell must be reachable from the spawn: no sealed pockets, no islands.
 */

const ARENA = {
  widthMetres: BASTION_ARENA.widthMetres,
  heightMetres: BASTION_ARENA.heightMetres,
};
/** Player diameter is ~0.7m; sampling at 0.5m cannot miss a gap they could use. */
const CELL_METRES = 0.5;

function blocked(x: number, y: number, obstacles: readonly ArenaObstacle[]): boolean {
  return obstacles.some((obstacle) => (
    x >= obstacle.x && x <= obstacle.x + obstacle.width
    && y >= obstacle.y && y <= obstacle.y + obstacle.height
  ));
}

/** Open cells reachable from the arena centre, and the total count of open cells. */
function floodFromSpawn(obstacles: readonly ArenaObstacle[]) {
  const columns = Math.floor(ARENA.widthMetres / CELL_METRES);
  const rows = Math.floor(ARENA.heightMetres / CELL_METRES);
  const open: boolean[][] = [];
  let openCells = 0;
  for (let column = 0; column < columns; column += 1) {
    open[column] = [];
    for (let row = 0; row < rows; row += 1) {
      const free = !blocked((column + 0.5) * CELL_METRES, (row + 0.5) * CELL_METRES, obstacles);
      open[column]![row] = free;
      if (free) openCells += 1;
    }
  }

  const startColumn = Math.floor(columns / 2);
  const startRow = Math.floor(rows / 2);
  const seen = new Set<string>();
  if (!open[startColumn]?.[startRow]) return { reached: 0, openCells, spawnBlocked: true };

  const queue: [number, number][] = [[startColumn, startRow]];
  seen.add(`${startColumn},${startRow}`);
  while (queue.length > 0) {
    const [column, row] = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nextColumn = column + dx;
      const nextRow = row + dy;
      const key = `${nextColumn},${nextRow}`;
      if (seen.has(key)) continue;
      if (!open[nextColumn]?.[nextRow]) continue;
      seen.add(key);
      queue.push([nextColumn, nextRow]);
    }
  }
  return { reached: seen.size, openCells, spawnBlocked: false };
}

describe("world object navigation guarantee", () => {
  it("actually furnishes the rooms these guarantees are checked against", () => {
    // Without this the flood-fill assertions below would pass trivially on an
    // empty arena, which is exactly the shape of a test that guards nothing.
    let totalObstacles = 0;
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      for (let seed = 1; seed <= 25; seed += 1) {
        totalObstacles += placeWorldObjects({ theme: themeId, ...ARENA, seed }).obstacles.length;
      }
    }
    expect(totalObstacles).toBeGreaterThan(ARENA_THEME_FAMILY_IDS.length * 25);
  });

  it("detects a sealed pocket when one exists", () => {
    // Proves the flood fill can fail: a wall of blocks across the arena leaves
    // the far side unreachable from spawn.
    const wall: ArenaObstacle[] = [];
    for (let y = 0; y < ARENA.heightMetres; y += 1) {
      wall.push({ id: `wall-${y}`, kind: "barricade", x: 4, y, width: 1, height: 1 } as ArenaObstacle);
    }
    const { reached, openCells } = floodFromSpawn(wall);
    expect(reached).toBeLessThan(openCells);
  });

  it("never seals off part of the room, across every theme and many seeds", () => {
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      for (let seed = 1; seed <= 25; seed += 1) {
        const { obstacles } = placeWorldObjects({ theme: themeId, ...ARENA, seed });
        const { reached, openCells, spawnBlocked } = floodFromSpawn(obstacles);

        expect(spawnBlocked, `${themeId}#${seed}: spawn itself is blocked`).toBe(false);
        // Every open cell must be reachable. An unreachable pocket is where a
        // pickup goes to be lost.
        expect(reached, `${themeId}#${seed}: ${openCells - reached} cells stranded`).toBe(openCells);
      }
    }
  });

  it("still holds after any single object is destroyed", () => {
    // Destruction is the harder case: removing a wall can only open the room up,
    // but the gates are tuned against the *furnished* layout, so this checks the
    // intermediate states a fight actually produces.
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      for (let seed = 1; seed <= 6; seed += 1) {
        const { obstacles } = placeWorldObjects({ theme: themeId, ...ARENA, seed });
        for (let index = 0; index < obstacles.length; index += 1) {
          const remaining = obstacles.filter((_, position) => position !== index);
          const { reached, openCells } = floodFromSpawn(remaining);
          expect(reached, `${themeId}#${seed} without ${obstacles[index]!.id}`).toBe(openCells);
        }
      }
    }
  });

  it("keeps placed objects at least a lane apart, so no gap is too narrow to use", () => {
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const { obstacles } = placeWorldObjects({ theme: themeId, ...ARENA, seed });
        for (let left = 0; left < obstacles.length; left += 1) {
          for (let right = left + 1; right < obstacles.length; right += 1) {
            const a = obstacles[left]!;
            const b = obstacles[right]!;
            const horizontal = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width));
            const vertical = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height));
            expect(Math.max(horizontal, vertical), `${a.id} vs ${b.id}`)
              .toBeGreaterThanOrEqual(MIN_LANE_WIDTH_METRES);
          }
        }
      }
    }
  });
});
