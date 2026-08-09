import type { HeroDefinition } from "./HeroDefinition";
import { ASSAULT } from "./assault";
import { MARINE } from "./marine";
import { MEDIC } from "./medic";
import { TACTICIAN } from "./tactician";

export const HERO_CATALOG: Readonly<Record<HeroDefinition["id"], HeroDefinition>> = Object.freeze({
  marine: MARINE,
  medic: MEDIC,
  assault: ASSAULT,
  tactician: TACTICIAN,
});

export function heroDefinition(heroId: HeroDefinition["id"]): HeroDefinition {
  return HERO_CATALOG[heroId];
}

export function isHeroId(value: unknown): value is HeroDefinition["id"] {
  return value === "marine" || value === "medic" || value === "assault" || value === "tactician";
}
