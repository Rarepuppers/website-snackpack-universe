/**
 * Presentation-only arena themes: seeded tint/backdrop variations over the
 * shared floor, boundary, and obstacle atlases. This is the first step of the
 * expedition plan's half-procedural background variety — the map later hands
 * each node a world id whose theme pool this module resolves, and Codex
 * eventually supplies authored per-world floor sets that replace pure tints.
 * Themes never affect simulation state.
 */
export interface ArenaTheme {
  id: string;
  name: string;
  backdropColor: number;
  floorTint: number;
  boundaryTint: number;
  obstacleTint: number;
  floorTexture: string;
  boundaryTexture: string;
  obstacleTexture: string;
  decalTexture: string | null;
  /** Optional contiguous frame window used by partitioned floor atlases. */
  floorFrameOffset?: number;
  floorFrameCount?: number;
  /** Optional deterministic decal pool for a room/biome subset. */
  decalFrames?: readonly number[];
  /** Natural terrain may rotate/mirror one frame; directional architecture must not. */
  floorTransformMode?: "none" | "rotate-mirror";
  /** Neutral veil above terrain/decal art and below gameplay actors. */
  readabilityWashAlpha: number;
}

export const ARENA_THEMES: readonly ArenaTheme[] = Object.freeze([
  Object.freeze({
    id: "bastion-standard",
    name: "Bastion Perimeter",
    backdropColor: 0x111a25,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "arena-floor-v1",
    boundaryTexture: "arena-boundary-v1",
    obstacleTexture: "arena-obstacle-v1",
    decalTexture: null,
    readabilityWashAlpha: 0,
  }),
  Object.freeze({
    id: "emberfall",
    name: "Emberfall Ruin",
    backdropColor: 0x1c120e,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "emberfall-floor-v1",
    boundaryTexture: "emberfall-boundary-v1",
    obstacleTexture: "emberfall-obstacles-v1",
    decalTexture: "emberfall-decals-v1",
    readabilityWashAlpha: 0.08,
  }),
  Object.freeze({
    id: "toxic-bloom",
    name: "Toxic Bloom",
    backdropColor: 0x0f1c12,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "toxic-bloom-floor-v1",
    boundaryTexture: "toxic-bloom-boundary-v1",
    obstacleTexture: "toxic-bloom-obstacles-v1",
    decalTexture: "toxic-bloom-decals-v1",
    readabilityWashAlpha: 0.1,
  }),
  Object.freeze({
    id: "void-approach",
    name: "Void Approach",
    backdropColor: 0x150f23,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "void-approach-floor-v1",
    boundaryTexture: "void-approach-boundary-v1",
    obstacleTexture: "void-approach-obstacles-v1",
    decalTexture: "void-approach-decals-v1",
    readabilityWashAlpha: 0.1,
  }),
  Object.freeze({
    id: "arctic-relay",
    name: "Arctic Relay",
    backdropColor: 0x0d1a23,
    floorTint: 0x9eb5c0,
    boundaryTint: 0xb3c8d1,
    obstacleTint: 0xa9bec8,
    floorTexture: "arctic-relay-floor-v1",
    boundaryTexture: "arctic-relay-boundary-v1",
    obstacleTexture: "arctic-relay-obstacles-v1",
    decalTexture: "arctic-relay-decals-v1",
    readabilityWashAlpha: 0.2,
  }),
  Object.freeze({
    id: "science-wing",
    name: "Bastion Science Wing",
    backdropColor: 0x0c151f,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xa9bbc8,
    floorTexture: "science-wing-floor-v1",
    boundaryTexture: "science-wing-boundary-v1",
    obstacleTexture: "science-wing-fixtures-v1",
    decalTexture: "science-wing-decals-v1",
    readabilityWashAlpha: 0.08,
  }),
  Object.freeze({
    id: "bastion-logistics",
    name: "Bastion Logistics",
    backdropColor: 0x0c1219,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xb5aa91,
    floorTexture: "bastion-logistics-floor-v1",
    boundaryTexture: "bastion-logistics-boundary-v1",
    obstacleTexture: "bastion-logistics-fixtures-v1",
    decalTexture: "bastion-logistics-decals-v1",
    readabilityWashAlpha: 0.08,
  }),
  Object.freeze({
    id: "machine-foundry",
    name: "Machine Foundry",
    backdropColor: 0x130f0c,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xc0b29a,
    floorTexture: "machine-foundry-floor-v1",
    boundaryTexture: "machine-foundry-boundary-v1",
    obstacleTexture: "machine-foundry-fixtures-v1",
    decalTexture: "machine-foundry-decals-v1",
    readabilityWashAlpha: 0.1,
  }),
  Object.freeze({
    id: "alien-hive",
    name: "Alien Hive",
    backdropColor: 0x120d18,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xb9a5bb,
    floorTexture: "alien-hive-floor-v1",
    boundaryTexture: "alien-hive-boundary-v1",
    obstacleTexture: "alien-hive-fixtures-v1",
    decalTexture: "alien-hive-decals-v1",
    readabilityWashAlpha: 0.12,
  }),
  Object.freeze({
    id: "surface-frontier",
    name: "Surface Frontier — Cracked Earth",
    backdropColor: 0x17130f,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xb7aa96,
    floorTexture: "surface-frontier-floor-v1",
    boundaryTexture: "surface-frontier-boundary-v1",
    obstacleTexture: "surface-frontier-fixtures-v1",
    decalTexture: "surface-frontier-decals-v1",
    floorFrameOffset: 0,
    floorFrameCount: 1,
    decalFrames: Object.freeze([0, 1, 2]),
    floorTransformMode: "rotate-mirror",
    readabilityWashAlpha: 0.1,
  }),
  Object.freeze({
    id: "starship-transit",
    name: "Starship Transit - Clean Corridor",
    backdropColor: 0x080d16,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xb4c3ce,
    floorTexture: "starship-transit-floor-v1",
    boundaryTexture: "starship-transit-boundary-v1",
    obstacleTexture: "starship-transit-fixtures-v1",
    decalTexture: "starship-transit-decals-v1",
    floorFrameOffset: 0,
    floorFrameCount: 1,
    decalFrames: Object.freeze([0, 2, 3]),
    floorTransformMode: "none",
    readabilityWashAlpha: 0.08,
  }),
  Object.freeze({
    id: "containment-underworld",
    name: "Containment - Institutional Wing",
    backdropColor: 0x0a0d12,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xb7bec3,
    floorTexture: "containment-underworld-floor-v1",
    boundaryTexture: "containment-underworld-boundary-v1",
    obstacleTexture: "containment-underworld-fixtures-v1",
    decalTexture: "containment-underworld-decals-v1",
    floorFrameOffset: 0,
    floorFrameCount: 4,
    decalFrames: Object.freeze([0, 1, 2, 3]),
    floorTransformMode: "none",
    readabilityWashAlpha: 0.08,
  }),
]);

export type SurfaceBiomeId =
  | "cracked-earth" | "dirt-trail" | "forest-loam" | "cave-stone"
  | "alien-basalt" | "ash-waste" | "frozen-ground" | "toxic-marsh"
  | "ruined-settlement" | "canyon" | "meteor-scar" | "demonic-ground"
  | "grassland" | "battlefield-mud" | "crystal-badlands" | "blast-zone";

export interface SurfaceBiome {
  id: SurfaceBiomeId;
  name: string;
  floorFrameOffset: number;
  decalFrames: readonly number[];
  backdropColor: number;
  washAlpha: number;
}

export const SURFACE_BIOMES: readonly SurfaceBiome[] = Object.freeze([
  Object.freeze({ id: "cracked-earth", name: "Cracked Earth", floorFrameOffset: 0, decalFrames: Object.freeze([0, 2]), backdropColor: 0x17130f, washAlpha: 0.1 }),
  Object.freeze({ id: "dirt-trail", name: "Dirt Trail", floorFrameOffset: 1, decalFrames: Object.freeze([0, 1]), backdropColor: 0x17130f, washAlpha: 0.1 }),
  Object.freeze({ id: "forest-loam", name: "Forest Loam", floorFrameOffset: 2, decalFrames: Object.freeze([1, 2]), backdropColor: 0x10140f, washAlpha: 0.12 }),
  Object.freeze({ id: "cave-stone", name: "Cave Stone", floorFrameOffset: 3, decalFrames: Object.freeze([2]), backdropColor: 0x101114, washAlpha: 0.12 }),
  Object.freeze({ id: "alien-basalt", name: "Alien Basalt", floorFrameOffset: 4, decalFrames: Object.freeze([3, 7]), backdropColor: 0x101217, washAlpha: 0.12 }),
  Object.freeze({ id: "ash-waste", name: "Ash Waste", floorFrameOffset: 5, decalFrames: Object.freeze([3]), backdropColor: 0x151515, washAlpha: 0.12 }),
  Object.freeze({ id: "frozen-ground", name: "Frozen Ground", floorFrameOffset: 6, decalFrames: Object.freeze([4]), backdropColor: 0x10161b, washAlpha: 0.16 }),
  Object.freeze({ id: "toxic-marsh", name: "Toxic Marsh", floorFrameOffset: 7, decalFrames: Object.freeze([5]), backdropColor: 0x11160f, washAlpha: 0.14 }),
  Object.freeze({ id: "ruined-settlement", name: "Ruined Settlement", floorFrameOffset: 8, decalFrames: Object.freeze([6, 2]), backdropColor: 0x151413, washAlpha: 0.12 }),
  Object.freeze({ id: "canyon", name: "Canyon", floorFrameOffset: 9, decalFrames: Object.freeze([0, 2]), backdropColor: 0x1a120d, washAlpha: 0.1 }),
  Object.freeze({ id: "meteor-scar", name: "Meteor Scar", floorFrameOffset: 10, decalFrames: Object.freeze([7, 3]), backdropColor: 0x121212, washAlpha: 0.12 }),
  Object.freeze({ id: "demonic-ground", name: "Demonic Ground", floorFrameOffset: 11, decalFrames: Object.freeze([7]), backdropColor: 0x170d0d, washAlpha: 0.16 }),
  Object.freeze({ id: "grassland", name: "Grassland", floorFrameOffset: 12, decalFrames: Object.freeze([1, 0]), backdropColor: 0x13160f, washAlpha: 0.12 }),
  Object.freeze({ id: "battlefield-mud", name: "Battlefield Mud", floorFrameOffset: 13, decalFrames: Object.freeze([0, 6]), backdropColor: 0x13110f, washAlpha: 0.12 }),
  Object.freeze({ id: "crystal-badlands", name: "Crystal Badlands", floorFrameOffset: 14, decalFrames: Object.freeze([2, 7]), backdropColor: 0x111019, washAlpha: 0.14 }),
  Object.freeze({ id: "blast-zone", name: "Blast Zone", floorFrameOffset: 15, decalFrames: Object.freeze([7, 3]), backdropColor: 0x17100c, washAlpha: 0.14 }),
]);

export function surfaceBiomeById(id: string | null | undefined): SurfaceBiome | null {
  return SURFACE_BIOMES.find((biome) => biome.id === id) ?? null;
}

export function surfaceFrontierTheme(theme: ArenaTheme, seed: number, requestedBiome?: string | null): ArenaTheme {
  if (theme.id !== "surface-frontier") return theme;
  const requested = surfaceBiomeById(requestedBiome);
  const biome = requested ?? SURFACE_BIOMES[Math.abs(Math.floor(seed)) % SURFACE_BIOMES.length]!;
  return {
    ...theme,
    name: `Surface Frontier — ${biome.name}`,
    backdropColor: biome.backdropColor,
    floorFrameOffset: biome.floorFrameOffset,
    floorFrameCount: 1,
    decalFrames: biome.decalFrames,
    readabilityWashAlpha: biome.washAlpha,
  };
}

export type StarshipRoomId = "operational-deck" | "command-deck" | "energy-transit" | "derelict-deck";

export interface StarshipRoom {
  id: StarshipRoomId;
  name: string;
  floorFrameOffset: number;
  floorFrameCount: number;
  decalFrames: readonly number[];
  backdropColor: number;
  washAlpha: number;
}

export const STARSHIP_ROOMS: readonly StarshipRoom[] = Object.freeze([
  Object.freeze({ id: "operational-deck", name: "Operational Deck", floorFrameOffset: 0, floorFrameCount: 4, decalFrames: Object.freeze([0, 2, 3]), backdropColor: 0x080d16, washAlpha: 0.08 }),
  Object.freeze({ id: "command-deck", name: "Command Deck", floorFrameOffset: 4, floorFrameCount: 4, decalFrames: Object.freeze([0, 1, 2]), backdropColor: 0x070d17, washAlpha: 0.1 }),
  Object.freeze({ id: "energy-transit", name: "Energy Transit", floorFrameOffset: 8, floorFrameCount: 4, decalFrames: Object.freeze([4, 5]), backdropColor: 0x070817, washAlpha: 0.12 }),
  Object.freeze({ id: "derelict-deck", name: "Derelict Deck", floorFrameOffset: 12, floorFrameCount: 4, decalFrames: Object.freeze([3, 6, 7]), backdropColor: 0x0b0c10, washAlpha: 0.13 }),
]);

export function starshipRoomById(id: string | null | undefined): StarshipRoom | null {
  return STARSHIP_ROOMS.find((room) => room.id === id) ?? null;
}

export function starshipTransitTheme(theme: ArenaTheme, seed: number, requestedRoom?: string | null): ArenaTheme {
  if (theme.id !== "starship-transit") return theme;
  const requested = starshipRoomById(requestedRoom);
  const room = requested ?? STARSHIP_ROOMS[Math.abs(Math.floor(seed)) % STARSHIP_ROOMS.length]!;
  return {
    ...theme,
    name: `Starship Transit - ${room.name}`,
    backdropColor: room.backdropColor,
    floorFrameOffset: room.floorFrameOffset,
    floorFrameCount: room.floorFrameCount,
    decalFrames: room.decalFrames,
    readabilityWashAlpha: room.washAlpha,
  };
}

export type ContainmentRoomId = "institutional-wing" | "containment-vault" | "dungeon-depths" | "infernal-facility";

export interface ContainmentRoom {
  id: ContainmentRoomId;
  name: string;
  floorFrameOffset: number;
  decalFrames: readonly number[];
  backdropColor: number;
  washAlpha: number;
}

export const CONTAINMENT_ROOMS: readonly ContainmentRoom[] = Object.freeze([
  Object.freeze({ id: "institutional-wing", name: "Institutional Wing", floorFrameOffset: 0, decalFrames: Object.freeze([0, 1, 2, 3]), backdropColor: 0x0a0d12, washAlpha: 0.08 }),
  Object.freeze({ id: "containment-vault", name: "Containment Vault", floorFrameOffset: 4, decalFrames: Object.freeze([0, 1, 2, 3]), backdropColor: 0x0a0c11, washAlpha: 0.1 }),
  Object.freeze({ id: "dungeon-depths", name: "Dungeon Depths", floorFrameOffset: 8, decalFrames: Object.freeze([4, 5]), backdropColor: 0x100c0b, washAlpha: 0.12 }),
  Object.freeze({ id: "infernal-facility", name: "Infernal Facility", floorFrameOffset: 12, decalFrames: Object.freeze([5, 6, 7]), backdropColor: 0x130909, washAlpha: 0.14 }),
]);

export function containmentUnderworldTheme(theme: ArenaTheme, seed: number, requestedRoom?: string | null): ArenaTheme {
  if (theme.id !== "containment-underworld") return theme;
  const requested = CONTAINMENT_ROOMS.find((room) => room.id === requestedRoom);
  const room = requested ?? CONTAINMENT_ROOMS[Math.abs(Math.floor(seed)) % CONTAINMENT_ROOMS.length]!;
  return {
    ...theme,
    name: `Containment - ${room.name}`,
    backdropColor: room.backdropColor,
    floorFrameOffset: room.floorFrameOffset,
    floorFrameCount: 4,
    decalFrames: room.decalFrames,
    readabilityWashAlpha: room.washAlpha,
  };
}

export function arenaThemeById(id: string | null | undefined): ArenaTheme | null {
  if (!id) {
    return null;
  }
  return ARENA_THEMES.find((theme) => theme.id === id) ?? null;
}

/** Three restrained lighting variants per world; collision art stays identical. */
export function arenaThemeVariant(theme: ArenaTheme, seed: number): ArenaTheme {
  const variant = Math.abs(Math.floor(seed)) % 3;
  if (variant === 0) return theme;
  const multiplier = variant === 1 ? 0.94 : 0.88;
  return {
    ...theme,
    floorTint: scaleRgb(theme.floorTint, multiplier),
    boundaryTint: scaleRgb(theme.boundaryTint, Math.min(1, multiplier + 0.04)),
    obstacleTint: scaleRgb(theme.obstacleTint, Math.min(1, multiplier + 0.03)),
  };
}

/** Deterministic pick so a run seed (or future map node) always maps to one theme. */
export function pickArenaTheme(seed: number): ArenaTheme {
  const index = Math.abs(Math.floor(seed)) % ARENA_THEMES.length;
  return ARENA_THEMES[index]!;
}

function scaleRgb(color: number, multiplier: number): number {
  const red = Math.round(((color >>> 16) & 0xff) * multiplier);
  const green = Math.round(((color >>> 8) & 0xff) * multiplier);
  const blue = Math.round((color & 0xff) * multiplier);
  return (red << 16) | (green << 8) | blue;
}
