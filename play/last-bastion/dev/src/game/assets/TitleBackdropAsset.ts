import titleMenuBackdropUrl from "../../../../art/production-tests/ui-batch-title/title-menu-backdrop-v1-3840x2160.png";
import titleMenuBackdropWebpUrl from "../../../../art/production-tests/ui-batch-title/title-menu-backdrop-v1-3840x2160.webp";
import type { ImageAssetDefinition } from "./GameAssetManifest";
import { runtimeImageUrl } from "./RuntimeImageFormat";

export const TITLE_BACKDROP_ASSET: ImageAssetDefinition = Object.freeze({
  kind: "image",
  id: "title-menu-backdrop-v1",
  url: runtimeImageUrl(titleMenuBackdropUrl, titleMenuBackdropWebpUrl),
  logicalWidth: 3840,
  logicalHeight: 2160,
  pivot: Object.freeze({ x: 0.5, y: 0.5 }),
});

/** Temporary review escape hatch: `?titlebackdrop=legacy` restores the map plate. */
export function titleBackdropAssetId(search = browserSearch()):
  "title-menu-backdrop-v1" | "bastion-logistics-map-backdrop-v1" {
  return new URLSearchParams(search).get("titlebackdrop") === "legacy"
    ? "bastion-logistics-map-backdrop-v1"
    : "title-menu-backdrop-v1";
}

function browserSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}
