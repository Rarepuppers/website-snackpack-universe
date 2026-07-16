import { describe, expect, it } from "vitest";
import {
  BASTION_ARENA,
  pointHitsObstacle,
  resolveCircleMovement,
} from "./ArenaDefinition";

describe("ArenaDefinition", () => {
  it("keeps the central player spawn clear", () => {
    expect(pointHitsObstacle({
      x: BASTION_ARENA.widthMetres / 2,
      y: BASTION_ARENA.heightMetres / 2,
    }, BASTION_ARENA.obstacles)).toBe(false);
  });

  it("is larger than one 960 by 540 gameplay viewport", () => {
    expect(BASTION_ARENA.widthMetres * 32).toBeGreaterThan(960);
    expect(BASTION_ARENA.heightMetres * 32).toBeGreaterThan(540);
  });

  it("clamps movement to arena bounds", () => {
    expect(resolveCircleMovement({ x: 2, y: 2 }, { x: -2, y: 30 }, 0.5, BASTION_ARENA))
      .toEqual({ x: 0.5, y: BASTION_ARENA.heightMetres - 0.5 });
  });

  it("slides along an obstacle when one movement axis remains clear", () => {
    const obstacle = BASTION_ARENA.obstacles[0]!;
    const previous = { x: obstacle.x - 1, y: obstacle.y - 0.7 };
    const resolved = resolveCircleMovement(
      previous,
      { x: obstacle.x + 0.2, y: obstacle.y + 0.2 },
      0.3,
      BASTION_ARENA,
    );
    expect(resolved.y).toBe(previous.y);
    expect(resolved.x).not.toBe(previous.x);
  });

  it("blocks points inside obstacle footprints", () => {
    const crate = BASTION_ARENA.obstacles[1]!;
    expect(pointHitsObstacle({ x: crate.x + 0.5, y: crate.y + 0.5 }, BASTION_ARENA.obstacles))
      .toBe(true);
  });
});
