import batchIWeaponTileUrl from "../../../../art/production-tests/batch-i/codex-weapon-tile-atlas-v1-128.png";
import type { GameAssetDefinition } from "./GameAssetManifest";
import { BASTION_BACKDROP_ASSET } from "./BastionBackdropAsset";

export const DEBRIEF_ASSETS: readonly GameAssetDefinition[] = Object.freeze([
  BASTION_BACKDROP_ASSET,
  Object.freeze({
    kind: "spritesheet",
    id: "batch-i-weapon-tiles-v1",
    url: batchIWeaponTileUrl,
    logicalWidth: 128,
    logicalHeight: 128,
    pivot: Object.freeze({ x: 0.5, y: 0.5 }),
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 8,
  }),
]);
