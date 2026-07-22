import Phaser from "phaser";
import type { ArenaDefinition, ArenaObstacleKind } from "../arena/ArenaDefinition";
import { worldDepth } from "./WorldDepth";
import { ARENA_THEMES, type ArenaTheme } from "./arenaThemes";
import { terrainFrameIndex } from "./TerrainVisualState";
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
    renderAuthoredObstacles(scene, arena, pixelsPerMetre, debugCollision, theme);
    return;
  }

  renderPlaceholderArena(scene, arena, pixelsPerMetre, debugCollision, columns, rows, tilePixels);
}

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
    const view = scene.add.sprite(x, y, "destructible-terrain-v1", terrainFrameIndex(obstacle.kind, 1, 1))
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
