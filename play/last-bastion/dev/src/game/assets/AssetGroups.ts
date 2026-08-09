import type { GameAssetDefinition } from "./GameAssetManifest";
import { GAME_ASSET_MANIFEST } from "./GameAssetManifest";
import { SCOUT_DEPLOYMENT_RELEASED } from "../progression/ArmoryProgression";

export type AssetGroup =
  | "boot"
  | "hero"
  | "arena"
  | "encounter"
  | "weapons"
  | "shop"
  | "gallery"
  | "close-view";
export function assetsForGroup(group: AssetGroup): readonly GameAssetDefinition[] {
  if (group === "boot") return GAME_ASSET_MANIFEST.filter((asset) => /^(arena-floor|arena-boundary|hud-panel|combat-effects|pickup)/.test(asset.id));
  if (group === "hero") return GAME_ASSET_MANIFEST.filter((asset) => (
    /^(marine|medic|assault|tactician)/.test(asset.id)
    || (SCOUT_DEPLOYMENT_RELEASED && asset.id.startsWith("scout"))
  ));
  if (group === "weapons") return GAME_ASSET_MANIFEST.filter((asset) => /weapon|rifle|marauder|scattergun|carbine|grenade|blade|event-horizon/.test(asset.id));
  if (group === "shop") return GAME_ASSET_MANIFEST.filter((asset) => /shop|weapon-tile|perk-tile|slot-tier|quartermaster|placement-modal/.test(asset.id));
  if (group === "gallery" || group === "close-view") return GAME_ASSET_MANIFEST.filter((asset) => /portrait|select|gameplay/.test(asset.id));
  if (group === "arena") return GAME_ASSET_MANIFEST.filter((asset) => /floor|boundary|obstacle|fixture|decal|world|node/.test(asset.id));
  return GAME_ASSET_MANIFEST.filter((asset) => /enemy|boss|effects|spritesheet/.test(asset.id));
}
