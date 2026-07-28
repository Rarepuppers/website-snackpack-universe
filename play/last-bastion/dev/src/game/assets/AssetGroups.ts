import type { GameAssetDefinition } from "./GameAssetManifest";
import { GAME_ASSET_MANIFEST } from "./GameAssetManifest";

export type AssetGroup =
  | "boot"
  | "hero"
  | "arena"
  | "encounter"
  | "weapons"
  | "shop"
  | "gallery"
  | "close-view"
  | "debrief";
export function assetsForGroup(group: AssetGroup): readonly GameAssetDefinition[] {
  if (group === "boot") return GAME_ASSET_MANIFEST.filter((asset) => /^(arena-floor|arena-boundary|hud-panel|combat-effects|pickup)/.test(asset.id));
  if (group === "hero") return GAME_ASSET_MANIFEST.filter((asset) => /^(marine|medic)/.test(asset.id));
  if (group === "weapons") return GAME_ASSET_MANIFEST.filter((asset) => /weapon|rifle|scattergun|carbine|grenade|blade|event-horizon/.test(asset.id));
  if (group === "shop") return GAME_ASSET_MANIFEST.filter((asset) => /shop|weapon-tile|perk-tile|slot-tier|quartermaster|placement-modal/.test(asset.id));
  if (group === "gallery" || group === "close-view") return GAME_ASSET_MANIFEST.filter((asset) => /portrait|select|gameplay/.test(asset.id));
  if (group === "debrief") return GAME_ASSET_MANIFEST.filter((asset) => (
    asset.id === "bastion-logistics-map-backdrop-v1"
    || asset.id === "batch-i-weapon-tiles-v1"
  ));
  if (group === "arena") return GAME_ASSET_MANIFEST.filter((asset) => /floor|boundary|obstacle|fixture|decal|world|node/.test(asset.id));
  return GAME_ASSET_MANIFEST.filter((asset) => /enemy|boss|effects|spritesheet/.test(asset.id));
}
