import Phaser from "phaser";
import type { ArenaDefinition, ArenaObstacleKind } from "../arena/ArenaDefinition";
import { worldDepth } from "./WorldDepth";
import { ARENA_THEMES, type ArenaTheme } from "./arenaThemes";
import { obstacleFrameIndex, worldObjectArtAssetId } from "./TerrainVisualState";
import { authoredDecalFrame, authoredFloorFrame, authoredFloorTransform } from "./ArenaFrameSelection";

const OBSTACLE_COLORS: Readonly<Record<ArenaObstacleKind, { body: number; edge: number }>> = {
  barricade: { body: 0x52677c, edge: 0xb8cad8 },
  "cargo-crate": { body: 0x785a35, edge: 0xd6a75c },
  "power-conduit": { body: 0x315c68, edge: 0x63d9df },
  biomass: { body: 0x65395f, edge: 0xd367b8 },
  fence: { body: 0x56745f, edge: 0xcdea72 },
  boulder: { body: 0x58616a, edge: 0xb8cad8 },
  "reinforced-cover": { body: 0x4d5263, edge: 0xd696ff },
};

export function renderArena(
  scene: Phaser.Scene,
  arena: ArenaDefinition,
  pixelsPerMetre: number,
  debugCollision = false,
  productionArt = true,
  theme: ArenaTheme = ARENA_THEMES[0]!,
): void {
  const columns = Math.ceil(arena.widthMetres / arena.tileSizeMetres);
  const rows = Math.ceil(arena.heightMetres / arena.tileSizeMetres);
  const tilePixels = arena.tileSizeMetres * pixelsPerMetre;
  const widthPixels = arena.widthMetres * pixelsPerMetre;
  const heightPixels = arena.heightMetres * pixelsPerMetre;

  scene.add.rectangle(widthPixels / 2, heightPixels / 2, widthPixels, heightPixels, theme.backdropColor)
    .setDepth(-30);

  if (productionArt) {
    renderAuthoredFloor(scene, columns, rows, tilePixels, theme);
    renderAmbientDecals(scene, columns, rows, tilePixels, theme);
    if (theme.readabilityWashAlpha > 0) {
      scene.add.rectangle(widthPixels / 2, heightPixels / 2, widthPixels, heightPixels, 0x071019, theme.readabilityWashAlpha)
        .setDepth(-16);
    }
    renderAuthoredBoundaries(scene, columns, rows, tilePixels, widthPixels, heightPixels, theme);
    renderHazards(scene, arena, pixelsPerMetre);
    renderAuthoredObstacles(scene, arena, pixelsPerMetre, debugCollision, theme);
    return;
  }

  renderPlaceholderArena(scene, arena, pixelsPerMetre, debugCollision, columns, rows, tilePixels);
  renderHazards(scene, arena, pixelsPerMetre);
}

/**
 * Persistent floor hazards (26 July 2026). Code-drawn until Object Batch O2's
 * loop sheets land and bind, because a hazard that damages you invisibly is
 * strictly worse than no hazard at all.
 *
 * Deliberately readable without colour: each family gets its own hatch density
 * and a dashed border whose thickness tracks severity, so slime, toxic, fire and
 * lava stay distinguishable in greyscale and in common colour-vision modes —
 * the requirement stated in `world-object-production-plan.md`. Drawn under
 * actors and pickups so it never masks a body or a drop.
 */
function renderHazards(scene: Phaser.Scene, arena: ArenaDefinition, pixelsPerMetre: number): void {
  const hazards = arena.hazards ?? [];
  if (hazards.length === 0) return;

  for (const hazard of hazards) {
    const style = HAZARD_STYLES[hazardStyleKey(hazard)];
    const x = hazard.x * pixelsPerMetre;
    const y = hazard.y * pixelsPerMetre;
    const width = hazard.width * pixelsPerMetre;
    const height = hazard.height * pixelsPerMetre;

    const graphics = scene.add.graphics().setDepth(-14);
    graphics.fillStyle(style.fill, style.fillAlpha);
    graphics.fillRect(x, y, width, height);

    // Hatching: the shape cue that survives greyscale. Tighter spacing reads as
    // more dangerous, independently of the fill colour.
    graphics.lineStyle(2, style.hatch, 0.5);
    for (let offset = -height; offset < width; offset += style.hatchSpacingPixels) {
      graphics.beginPath();
      graphics.moveTo(x + offset, y + height);
      graphics.lineTo(x + offset + height, y);
      graphics.strokePath();
    }

    graphics.lineStyle(style.borderPixels, style.hatch, 0.9);
    graphics.strokeRect(x, y, width, height);
  }
}

function hazardStyleKey(hazard: NonNullable<ArenaDefinition["hazards"]>[number]): keyof typeof HAZARD_STYLES {
  if (hazard.effect.type === "slow") return "slow";
  return hazard.effect.damageType;
}

const HAZARD_STYLES = {
  // Slow: widest hatching, thinnest border — an inconvenience, not a threat.
  slow: { fill: 0x4d7a3a, fillAlpha: 0.3, hatch: 0x9ede6a, hatchSpacingPixels: 26, borderPixels: 2 },
  toxic: { fill: 0x2f5a20, fillAlpha: 0.36, hatch: 0x7ed957, hatchSpacingPixels: 18, borderPixels: 3 },
  fire: { fill: 0x5b2415, fillAlpha: 0.4, hatch: 0xff9a52, hatchSpacingPixels: 12, borderPixels: 4 },
  // Lava: tightest hatching and heaviest border, the strongest non-colour cue.
  lava: { fill: 0x6b1c08, fillAlpha: 0.46, hatch: 0xffb23f, hatchSpacingPixels: 8, borderPixels: 6 },
} as const;

function renderAuthoredFloor(
  scene: Phaser.Scene,
  columns: number,
  rows: number,
  tilePixels: number,
  theme: ArenaTheme,
): void {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const frame = authoredFloorFrame(theme, column, row);
      const transform = theme.floorTransformMode === "rotate-mirror"
        ? authoredFloorTransform(column, row)
        : { angle: 0 as const, flipX: false };
      scene.add.sprite((column + 0.5) * tilePixels, (row + 0.5) * tilePixels, theme.floorTexture, frame)
        .setDisplaySize(tilePixels, tilePixels)
        .setAngle(transform.angle)
        .setFlipX(transform.flipX)
        .setDepth(-20)
        .setTint(theme.floorTint);
    }
  }
}

function renderAmbientDecals(
  scene: Phaser.Scene,
  columns: number,
  rows: number,
  tilePixels: number,
  theme: ArenaTheme,
): void {
  if (!theme.decalTexture) return;
  for (let row = 1; row < rows - 1; row += 1) {
    for (let column = 1; column < columns - 1; column += 1) {
      const frame = authoredDecalFrame(theme, column, row);
      if (frame === null) continue;
      scene.add.sprite(
        (column + 0.5) * tilePixels,
        (row + 0.5) * tilePixels,
        theme.decalTexture,
        frame,
      ).setDisplaySize(tilePixels * 1.35, tilePixels * 1.35)
        .setAlpha(0.34)
        .setDepth(-18);
    }
  }
}

function renderAuthoredBoundaries(
  scene: Phaser.Scene,
  columns: number,
  rows: number,
  tilePixels: number,
  widthPixels: number,
  heightPixels: number,
  theme: ArenaTheme,
): void {
  for (let column = 0; column < columns; column += 1) {
    const x = (column + 0.5) * tilePixels;
    const topFrame = column === Math.floor(columns / 2) ? 6 : 0;
    const bottomFrame = column === Math.floor(columns * 0.72) ? 7 : 1;
    scene.add.sprite(x, tilePixels * 0.32, theme.boundaryTexture, topFrame)
      .setDisplaySize(tilePixels, tilePixels).setDepth(80).setTint(theme.boundaryTint);
    scene.add.sprite(x, heightPixels - tilePixels * 0.32, theme.boundaryTexture, bottomFrame)
      .setDisplaySize(tilePixels, tilePixels).setDepth(worldDepth(heightPixels / tilePixels) + 20)
      .setTint(theme.boundaryTint);
  }
  for (let row = 1; row < rows - 1; row += 1) {
    const y = (row + 0.5) * tilePixels;
    scene.add.sprite(tilePixels * 0.32, y, theme.boundaryTexture, 2)
      .setDisplaySize(tilePixels, tilePixels).setDepth(worldDepth(y / tilePixels) + 10)
      .setTint(theme.boundaryTint);
    scene.add.sprite(widthPixels - tilePixels * 0.32, y, theme.boundaryTexture, 3)
      .setDisplaySize(tilePixels, tilePixels).setDepth(worldDepth(y / tilePixels) + 10)
      .setTint(theme.boundaryTint);
  }
}

function renderAuthoredObstacles(
  scene: Phaser.Scene,
  arena: ArenaDefinition,
  pixelsPerMetre: number,
  debugCollision: boolean,
  theme: ArenaTheme,
): void {
  for (const obstacle of arena.obstacles) {
    const x = (obstacle.x + obstacle.width / 2) * pixelsPerMetre;
    const collisionY = (obstacle.y + obstacle.height / 2) * pixelsPerMetre;
    const y = (obstacle.y + obstacle.height) * pixelsPerMetre;
    const width = obstacle.width * pixelsPerMetre;
    const height = obstacle.height * pixelsPerMetre;
    const assetId = worldObjectArtAssetId(obstacle) ?? "destructible-terrain-v1";
    const view = scene.add.sprite(x, y, assetId, obstacleFrameIndex(obstacle, 1, 1))
      .setName(`arena-obstacle:${obstacle.id}`)
      .setDisplaySize(width, height)
      .setDepth(worldDepth(obstacle.y + obstacle.height))
      .setTint(theme.obstacleTint)
      .setOrigin(0.5, 0.92);
    if (debugCollision) {
      scene.add.rectangle(x, collisionY, width, height, 0x000000, 0)
        .setStrokeStyle(3, 0xff3d55).setDepth(view.depth + 1);
      scene.add.text(x, collisionY, obstacle.id, {
        color: "#ffffff", fontFamily: "monospace", fontSize: "9px", backgroundColor: "#111722",
      }).setOrigin(0.5).setDepth(view.depth + 2);
    }
  }
}

function renderPlaceholderArena(
  scene: Phaser.Scene,
  arena: ArenaDefinition,
  pixelsPerMetre: number,
  debugCollision: boolean,
  columns: number,
  rows: number,
  tilePixels: number,
): void {
  const graphics = scene.add.graphics().setDepth(-20);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const variant = (column * 17 + row * 31) % 7;
      graphics.fillStyle(variant === 0 ? 0x1d2d3d : variant === 1 ? 0x1a2938 : 0x192534, 1);
      graphics.fillRect(column * tilePixels, row * tilePixels, tilePixels, tilePixels);
      graphics.lineStyle(1, 0x2a4053, 0.42);
      graphics.strokeRect(column * tilePixels, row * tilePixels, tilePixels, tilePixels);
    }
  }
  for (const obstacle of arena.obstacles) {
    const colors = OBSTACLE_COLORS[obstacle.kind];
    const x = (obstacle.x + obstacle.width / 2) * pixelsPerMetre;
    const y = (obstacle.y + obstacle.height / 2) * pixelsPerMetre;
    const width = obstacle.width * pixelsPerMetre;
    const height = obstacle.height * pixelsPerMetre;
    scene.add.rectangle(x, y, width, height, colors.body)
      .setName(`arena-obstacle:${obstacle.id}`)
      .setStrokeStyle(debugCollision ? 3 : 2, debugCollision ? 0xff3d55 : colors.edge)
      .setDepth(worldDepth(obstacle.y + obstacle.height));
  }
}
