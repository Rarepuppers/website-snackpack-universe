import marineSelectPortraitUrl from "../../../../art/production-tests/batch-character-select/marine-select-portrait-v1-1024x1536.png";
import marineSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-select/marine-select-portrait-v1-1024x1536.webp";
import medicSelectPortraitUrl from "../../../../art/production-tests/batch-character-select/medic-select-portrait-v1-1024x1536.png";
import medicSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-select/medic-select-portrait-v1-1024x1536.webp";
import assaultSelectPortraitUrl from "../../../../art/production-tests/batch-character-c3-assault/assault-select-portrait-v1-1024x1536.png";
import assaultSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-c3-assault/assault-select-portrait-v1-1024x1536.webp";
import tacticianSelectPortraitUrl from "../../../../art/production-tests/batch-character-c3-tactician/tactician-select-portrait-v1-1024x1536.png";
import tacticianSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-c3-tactician/tactician-select-portrait-v1-1024x1536.webp";
import scoutSelectPortraitUrl from "../../../../art/production-tests/batch-character-c3-scout/scout-select-portrait-v1-1024x1536.png";
import scoutSelectPortraitWebpUrl from "../../../../art/production-tests/batch-character-c3-scout/scout-select-portrait-v1-1024x1536.webp";
import canonicalPerkTileUrl from "../../../../art/production-tests/batch-i/canonical-perk-tile-atlas-v2-128.png";
import type { GameAssetDefinition } from "./GameAssetManifest";
import { BASTION_BACKDROP_ASSET } from "./BastionBackdropAsset";
import { TITLE_BACKDROP_ASSET } from "./TitleBackdropAsset";
import { runtimeImageUrl } from "./RuntimeImageFormat";

export const SHELL_BASE_ASSETS: readonly GameAssetDefinition[] = Object.freeze([
  BASTION_BACKDROP_ASSET,
  TITLE_BACKDROP_ASSET,
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
    kind: "image",
    id: "assault-select-portrait-v1",
    url: runtimeImageUrl(assaultSelectPortraitUrl, assaultSelectPortraitWebpUrl),
    logicalWidth: 1024,
    logicalHeight: 1536,
    pivot: Object.freeze({ x: 0.5, y: 0.9 }),
  }),
  Object.freeze({
    kind: "image",
    id: "tactician-select-portrait-v1",
    url: runtimeImageUrl(tacticianSelectPortraitUrl, tacticianSelectPortraitWebpUrl),
    logicalWidth: 1024,
    logicalHeight: 1536,
    pivot: Object.freeze({ x: 0.5, y: 0.9 }),
  }),
  Object.freeze({
    kind: "image",
    id: "scout-select-portrait-v1",
    url: runtimeImageUrl(scoutSelectPortraitUrl, scoutSelectPortraitWebpUrl),
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
