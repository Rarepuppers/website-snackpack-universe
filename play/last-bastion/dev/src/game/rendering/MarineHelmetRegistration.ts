import type Phaser from "phaser";

/**
 * The retained Marine helmet sheet has a larger, lower silhouette than the
 * body sheet's head. Keep its source pixels intact and register each pose at
 * runtime until a new overlay master is approved.
 */
const OFFSETS: readonly (readonly [number, number])[] = [
  [3, -26], [3, -26], [6, -27], [0, -27],
  [3, -25], [3, -25], [6, -25], [0, -25],
  [-2, -24], [1, -23], [2, -23], [3, -23],
];
const HELMET_SCALE = 0.55;

export function registerMarineHelmet(
  sprite: Phaser.GameObjects.Sprite,
  frame: number,
  x = 0,
  y = 0,
  bodyScale = 1,
): void {
  const [dx, dy] = OFFSETS[frame] ?? OFFSETS[0]!;
  sprite.setPosition(x + dx * bodyScale, y + dy * bodyScale);
  sprite.setScale(bodyScale * HELMET_SCALE);
}
