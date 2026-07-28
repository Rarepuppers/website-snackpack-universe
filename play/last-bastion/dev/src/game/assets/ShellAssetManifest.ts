import marineSelectPortraitUrl from "../../../../art/production-tests/batch-character-select/marine-select-portrait-v1-1024x1536.png";
import marineSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-select/marine-select-portrait-v1-1024x1536.webp";
import medicSelectPortraitUrl from "../../../../art/production-tests/batch-character-select/medic-select-portrait-v1-1024x1536.png";
import medicSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-select/medic-select-portrait-v1-1024x1536.webp";
import canonicalPerkTileUrl from "../../../../art/production-tests/batch-i/canonical-perk-tile-atlas-v2-128.png";
import type { GameAssetDefinition } from "./GameAssetManifest";
import { BASTION_BACKDROP_ASSET } from "./BastionBackdropAsset";
import { runtimeImageUrl } from "./RuntimeImageFormat";

export const SHELL_BASE_ASSETS: readonly GameAssetDefinition[] = Object.freeze([
  BASTION_BACKDROP_ASSET,
]);

export const SHELL_CHARACTER_ASSETS: readonly GameAssetDefinition[] = Object.freeze([
  Object.freeze({
    kind: "image",
    id: "marine-select-portrait-v1",
    url: runtimeImageUrl(marineSelectPortraitUrl, marineSelectPortraitWebpUrl),
    logicalWidth: 1024,
    logicalHeight: 1536,
    pivot: Object.freeze({ x: 0.5, y: 0.9 }),
  }),
  Object.freeze({
    kind: "image",
    id: "medic-select-portrait-v1",
    url: runtimeImageUrl(medicSelectPortraitUrl, medicSelectPortraitWebpUrl),
    logicalWidth: 1024,
    logicalHeight: 1536,
    pivot: Object.freeze({ x: 0.5, y: 0.9 }),
  }),
  Object.freeze({
    kind: "spritesheet",
    id: "canonical-perk-tiles-v2",
    url: canonicalPerkTileUrl,
    logicalWidth: 128,
    logicalHeight: 128,
    pivot: Object.freeze({ x: 0.5, y: 0.5 }),
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 8,
  }),
]);
