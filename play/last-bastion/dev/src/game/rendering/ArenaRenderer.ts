import Phaser from "phaser";
import type { ArenaDefinition, ArenaObstacleKind } from "../arena/ArenaDefinition";
import { worldDepth } from "./WorldDepth";

const OBSTACLE_FRAMES: Readonly<Record<ArenaObstacleKind, number>> = {
  barricade: 0,
  "cargo-crate": 1,
  "power-conduit": 2,
  biomass: 3,
};

const OBSTACLE_COLORS: Readonly<Record<ArenaObstacleKind, { body: number; edge: number }>> = {
  barricade: { body: 0x52677c, edge: 0xb8cad8 },
  "cargo-crate": { body: 0x785a35, edge: 0xd6a75c },
  "power-conduit": { body: 0x315c68, edge: 0x63d9df },
  biomass: { body: 0x65395f, edge: 0xd367b8 },
};

export function renderArena(
  scene: Phaser.Scene,
  arena: ArenaDefinition,
  pixelsPerMetre: number,
  debugCollision = false,
  productionArt = true,
): void {
  const columns = Math.ceil(arena.widthMetres / arena.tileSizeMetres);
  const rows = Math.ceil(arena.heightMetres / arena.tileSizeMetres);
  const tilePixels = arena.tileSizeMetres * pixelsPerMetre;
  const widthPixels = arena.widthMetres * pixelsPerMetre;
  const heightPixels = arena.heightMetres * pixelsPerMetre;

  scene.add.rectangle(widthPixels / 2, heightPixels / 2, widthPixels, heightPixels, 0x111a25)
    .setDepth(-30);

  if (productionArt) {
    renderAuthoredFloor(scene, columns, rows, tilePixels);
    renderAuthoredBoundaries(scene, columns, rows, tilePixels, widthPixels, heightPixels);
    renderAuthoredObstacles(scene, arena, pixelsPerMetre, debugCollision);
    return;
  }

  renderPlaceholderArena(scene, arena, pixelsPerMetre, debugCollision, columns, rows, tilePixels);
}

function renderAuthoredFloor(
  scene: Phaser.Scene,
  columns: number,
  rows: number,
  tilePixels: number,
): void {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const seed = (column * 17 + row * 31) % 23;
      const frame = seed === 0 ? 4 : seed === 1 ? 3 : seed < 6 ? 1 + (seed % 2) : 0;
      scene.add.sprite((column + 0.5) * tilePixels, (row + 0.5) * tilePixels, "arena-floor-v1", frame)
        .setDisplaySize(tilePixels, tilePixels).setDepth(-20);
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
): void {
  for (let column = 0; column < columns; column += 1) {
    const x = (column + 0.5) * tilePixels;
    const topFrame = column === Math.floor(columns / 2) ? 6 : 0;
    const bottomFrame = column === Math.floor(columns * 0.72) ? 7 : 1;
    scene.add.sprite(x, tilePixels * 0.32, "arena-boundary-v1", topFrame)
      .setDisplaySize(tilePixels, tilePixels).setDepth(80);
    scene.add.sprite(x, heightPixels - tilePixels * 0.32, "arena-boundary-v1", bottomFrame)
      .setDisplaySize(tilePixels, tilePixels).setDepth(worldDepth(heightPixels / tilePixels) + 20);
  }
  for (let row = 1; row < rows - 1; row += 1) {
    const y = (row + 0.5) * tilePixels;
    scene.add.sprite(tilePixels * 0.32, y, "arena-boundary-v1", 2)
      .setDisplaySize(tilePixels, tilePixels).setDepth(worldDepth(y / tilePixels) + 10);
    scene.add.sprite(widthPixels - tilePixels * 0.32, y, "arena-boundary-v1", 3)
      .setDisplaySize(tilePixels, tilePixels).setDepth(worldDepth(y / tilePixels) + 10);
  }
}

function renderAuthoredObstacles(
  scene: Phaser.Scene,
  arena: ArenaDefinition,
  pixelsPerMetre: number,
  debugCollision: boolean,
): void {
  for (const obstacle of arena.obstacles) {
    const x = (obstacle.x + obstacle.width / 2) * pixelsPerMetre;
    const y = (obstacle.y + obstacle.height / 2) * pixelsPerMetre;
    const width = obstacle.width * pixelsPerMetre;
    const height = obstacle.height * pixelsPerMetre;
    const view = scene.add.sprite(x, y, "arena-obstacle-v1", OBSTACLE_FRAMES[obstacle.kind])
      .setName(`arena-obstacle:${obstacle.id}`)
      .setDisplaySize(width, height)
      .setDepth(worldDepth(obstacle.y + obstacle.height));
    if (debugCollision) {
      scene.add.rectangle(x, y, width, height, 0x000000, 0)
        .setStrokeStyle(3, 0xff3d55).setDepth(view.depth + 1);
      scene.add.text(x, y, obstacle.id, {
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
