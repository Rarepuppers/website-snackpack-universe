import type { ArenaObstacleKind } from "./ArenaDefinition";

export type WorldThemeFamily =
  | "bastion" | "science" | "logistics" | "foundry" | "hive"
  | "surface" | "starship" | "containment" | "underworld";

export type WorldObjectRole = "obstacle" | "hazard" | "interactable" | "hybrid";
export type WorldObjectArtAssetId =
  | "world-objects-military-v1"
  | "world-objects-natural-v1"
  | "world-objects-organic-v1";
export type HazardEffect =
  | { type: "slow"; movementMultiplier: number }
  | { type: "damage"; damagePerSecond: number; damageType: "toxic" | "fire" | "lava" };
export type InteractionEffect =
  | { type: "open-loot" }
  | { type: "open-gate" }
  | { type: "disrupt-spawner" }
  | { type: "activate-stargate" }
  | { type: "toggle-system"; system: "weapons" | "turrets" | "traps" }
  | { type: "release-cryo" }
  | { type: "upgrade-weapon"; weaponDisabledSeconds: number };

export interface WorldObjectDefinition {
  id: string;
  name: string;
  role: WorldObjectRole;
  themes: readonly WorldThemeFamily[];
  /** Existing damage-state atlas fallback until a dedicated themed prop is bound. */
  visualKind?: ArenaObstacleKind;
  /** Row in a 4-column intact/damaged/critical/destroyed production atlas. */
  art?: Readonly<{ assetId: WorldObjectArtAssetId; row: number }>;
  blocksMovement: boolean;
  blocksProjectiles: boolean;
  /** Null means deliberately indestructible. High values mean breachable mission geometry. */
  durability: number | null;
  footprintMetres: Readonly<{ width: number; height: number }>;
  hazard?: HazardEffect;
  interaction?: Readonly<{ seconds: number; effect: InteractionEffect }>;
  maxPerRoom: number;
  placement: "edge" | "cover" | "open-floor" | "objective-anchor";
}

const all = (...themes: WorldThemeFamily[]) => Object.freeze(themes);
const size = (width: number, height: number) => Object.freeze({ width, height });

export const WORLD_OBJECT_CATALOG: readonly WorldObjectDefinition[] = Object.freeze([
  { id: "broken-wall", name: "Broken Wall", role: "obstacle", themes: all("bastion", "logistics", "foundry", "containment", "underworld"), visualKind: "barricade", art: { assetId: "world-objects-military-v1", row: 0 }, blocksMovement: true, blocksProjectiles: true, durability: 320, footprintMetres: size(3.2, 0.9), maxPerRoom: 5, placement: "cover" },
  { id: "weapon-rack", name: "Weapon Rack", role: "obstacle", themes: all("bastion", "logistics", "starship", "containment"), visualKind: "cargo-crate", art: { assetId: "world-objects-military-v1", row: 1 }, blocksMovement: true, blocksProjectiles: true, durability: 90, footprintMetres: size(1.8, 0.7), maxPerRoom: 3, placement: "edge" },
  { id: "supply-chest", name: "Supply Chest", role: "interactable", themes: all("bastion", "science", "logistics", "foundry", "surface", "starship", "containment"), visualKind: "cargo-crate", blocksMovement: true, blocksProjectiles: true, durability: 120, footprintMetres: size(1.3, 1.0), interaction: { seconds: 0.35, effect: { type: "open-loot" } }, maxPerRoom: 2, placement: "objective-anchor" },
  { id: "equipment-locker", name: "Equipment Locker", role: "obstacle", themes: all("bastion", "science", "logistics", "starship", "containment"), visualKind: "cargo-crate", art: { assetId: "world-objects-military-v1", row: 2 }, blocksMovement: true, blocksProjectiles: true, durability: 150, footprintMetres: size(1.2, 0.8), maxPerRoom: 3, placement: "edge" },
  { id: "rock", name: "Rock", role: "obstacle", themes: all("surface", "hive", "underworld"), visualKind: "boulder", blocksMovement: true, blocksProjectiles: true, durability: 420, footprintMetres: size(1.4, 1.2), maxPerRoom: 8, placement: "cover" },
  { id: "boulder", name: "Boulder", role: "obstacle", themes: all("surface", "hive", "underworld"), visualKind: "boulder", art: { assetId: "world-objects-natural-v1", row: 0 }, blocksMovement: true, blocksProjectiles: true, durability: 700, footprintMetres: size(2.2, 1.8), maxPerRoom: 5, placement: "cover" },
  { id: "earth-mound", name: "Earth Mound", role: "obstacle", themes: all("surface"), visualKind: "reinforced-cover", art: { assetId: "world-objects-natural-v1", row: 1 }, blocksMovement: true, blocksProjectiles: true, durability: 300, footprintMetres: size(2.8, 1.1), maxPerRoom: 5, placement: "cover" },
  { id: "overgrowth", name: "Overgrowth", role: "obstacle", themes: all("surface", "hive"), visualKind: "biomass", art: { assetId: "world-objects-organic-v1", row: 0 }, blocksMovement: true, blocksProjectiles: false, durability: 80, footprintMetres: size(2.0, 1.4), maxPerRoom: 6, placement: "edge" },
  { id: "tree", name: "Tree", role: "obstacle", themes: all("surface"), visualKind: "boulder", art: { assetId: "world-objects-natural-v1", row: 2 }, blocksMovement: true, blocksProjectiles: true, durability: 240, footprintMetres: size(1.5, 1.5), maxPerRoom: 7, placement: "cover" },
  { id: "web-mass", name: "Web Mass", role: "obstacle", themes: all("hive", "underworld"), visualKind: "biomass", art: { assetId: "world-objects-organic-v1", row: 1 }, blocksMovement: true, blocksProjectiles: false, durability: 60, footprintMetres: size(2.2, 1.0), maxPerRoom: 6, placement: "edge" },
  { id: "biomass-node", name: "Biomass Node", role: "obstacle", themes: all("hive", "underworld"), visualKind: "biomass", art: { assetId: "world-objects-organic-v1", row: 2 }, blocksMovement: true, blocksProjectiles: false, durability: 260, footprintMetres: size(1.8, 1.6), maxPerRoom: 5, placement: "cover" },
  { id: "alien-crystal", name: "Alien Crystal", role: "obstacle", themes: all("hive", "surface", "underworld"), visualKind: "boulder", art: { assetId: "world-objects-organic-v1", row: 3 }, blocksMovement: true, blocksProjectiles: true, durability: 360, footprintMetres: size(1.6, 1.5), maxPerRoom: 4, placement: "cover" },
  { id: "ice-block", name: "Ice Block", role: "obstacle", themes: all("surface", "science"), visualKind: "boulder", art: { assetId: "world-objects-natural-v1", row: 3 }, blocksMovement: true, blocksProjectiles: true, durability: 180, footprintMetres: size(1.8, 1.6), maxPerRoom: 6, placement: "cover" },
  { id: "reinforced-gate", name: "Reinforced Gate", role: "hybrid", themes: all("bastion", "starship", "containment", "underworld"), visualKind: "reinforced-cover", art: { assetId: "world-objects-military-v1", row: 3 }, blocksMovement: true, blocksProjectiles: true, durability: 1600, footprintMetres: size(4.0, 0.9), interaction: { seconds: 0.35, effect: { type: "open-gate" } }, maxPerRoom: 2, placement: "objective-anchor" },
  { id: "slime-pool", name: "Slime Pool", role: "hazard", themes: all("hive", "underworld"), blocksMovement: false, blocksProjectiles: false, durability: null, footprintMetres: size(2.5, 2.5), hazard: { type: "slow", movementMultiplier: 0.62 }, maxPerRoom: 5, placement: "open-floor" },
  { id: "toxic-pool", name: "Toxic Pool", role: "hazard", themes: all("science", "hive", "surface", "containment"), blocksMovement: false, blocksProjectiles: false, durability: null, footprintMetres: size(2.2, 2.2), hazard: { type: "damage", damagePerSecond: 4, damageType: "toxic" }, maxPerRoom: 4, placement: "open-floor" },
  { id: "fire-patch", name: "Fire Patch", role: "hazard", themes: all("bastion", "logistics", "foundry", "starship", "underworld"), blocksMovement: false, blocksProjectiles: false, durability: null, footprintMetres: size(1.8, 1.8), hazard: { type: "damage", damagePerSecond: 6, damageType: "fire" }, maxPerRoom: 5, placement: "open-floor" },
  { id: "lava-tile", name: "Lava Tile", role: "hazard", themes: all("foundry", "underworld"), blocksMovement: false, blocksProjectiles: false, durability: null, footprintMetres: size(2.0, 2.0), hazard: { type: "damage", damagePerSecond: 10, damageType: "lava" }, maxPerRoom: 4, placement: "open-floor" },
  { id: "gate-button", name: "Gate Button", role: "interactable", themes: all("bastion", "starship", "containment"), blocksMovement: false, blocksProjectiles: false, durability: null, footprintMetres: size(0.7, 0.7), interaction: { seconds: 0.25, effect: { type: "open-gate" } }, maxPerRoom: 2, placement: "objective-anchor" },
  { id: "monster-teleporter", name: "Monster Teleporter", role: "hybrid", themes: all("hive", "starship", "underworld"), visualKind: "power-conduit", blocksMovement: true, blocksProjectiles: true, durability: 500, footprintMetres: size(2.4, 2.4), interaction: { seconds: 2.0, effect: { type: "disrupt-spawner" } }, maxPerRoom: 2, placement: "objective-anchor" },
  { id: "stargate", name: "Stargate", role: "interactable", themes: all("starship", "underworld"), blocksMovement: true, blocksProjectiles: true, durability: null, footprintMetres: size(4.5, 1.2), interaction: { seconds: 2.5, effect: { type: "activate-stargate" } }, maxPerRoom: 1, placement: "objective-anchor" },
  { id: "control-panel", name: "Control Panel", role: "interactable", themes: all("science", "logistics", "foundry", "starship", "containment"), blocksMovement: true, blocksProjectiles: false, durability: 100, footprintMetres: size(1.2, 0.7), interaction: { seconds: 0.75, effect: { type: "toggle-system", system: "weapons" } }, maxPerRoom: 3, placement: "edge" },
  { id: "turret-console", name: "Turret Console", role: "interactable", themes: all("bastion", "foundry", "starship"), blocksMovement: true, blocksProjectiles: false, durability: 120, footprintMetres: size(1.2, 0.7), interaction: { seconds: 1.0, effect: { type: "toggle-system", system: "turrets" } }, maxPerRoom: 1, placement: "objective-anchor" },
  { id: "trap-console", name: "Trap Console", role: "interactable", themes: all("containment", "underworld"), blocksMovement: true, blocksProjectiles: false, durability: 100, footprintMetres: size(1.2, 0.7), interaction: { seconds: 0.8, effect: { type: "toggle-system", system: "traps" } }, maxPerRoom: 2, placement: "objective-anchor" },
  { id: "cryogenic-tube", name: "Cryogenic Tube", role: "hybrid", themes: all("science", "starship", "containment"), visualKind: "power-conduit", blocksMovement: true, blocksProjectiles: true, durability: 350, footprintMetres: size(1.4, 2.0), interaction: { seconds: 1.5, effect: { type: "release-cryo" } }, maxPerRoom: 4, placement: "edge" },
  { id: "weapon-upgrade-station", name: "Weapon Upgrade Station", role: "interactable", themes: all("science", "foundry", "starship"), blocksMovement: true, blocksProjectiles: true, durability: null, footprintMetres: size(2.0, 1.2), interaction: { seconds: 1.25, effect: { type: "upgrade-weapon", weaponDisabledSeconds: 45 } }, maxPerRoom: 1, placement: "objective-anchor" },
]);

export function worldObjectById(id: string): WorldObjectDefinition | null {
  return WORLD_OBJECT_CATALOG.find((object) => object.id === id) ?? null;
}

export function worldObjectsForTheme(theme: WorldThemeFamily): readonly WorldObjectDefinition[] {
  return WORLD_OBJECT_CATALOG.filter((object) => object.themes.includes(theme));
}
