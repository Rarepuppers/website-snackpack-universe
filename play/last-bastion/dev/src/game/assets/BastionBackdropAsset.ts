import bastionLogisticsMapBackdropUrl from "../../../../art/production-tests/batch-map-presentation/bastion-logistics-map-backdrop-v1-1536x1024.png";
import bastionLogisticsMapBackdropWebpUrl from "../../../../art/production-tests/batch-map-presentation/bastion-logistics-map-backdrop-v1-1536x1024.webp";
import type { ImageAssetDefinition } from "./GameAssetManifest";
import { runtimeImageUrl } from "./RuntimeImageFormat";

export const BASTION_BACKDROP_ASSET: ImageAssetDefinition = Object.freeze({
  kind: "image",
  id: "bastion-logistics-map-backdrop-v1",
  url: runtimeImageUrl(bastionLogisticsMapBackdropUrl, bastionLogisticsMapBackdropWebpUrl),
  logicalWidth: 1536,
  logicalHeight: 1024,
  pivot: Object.freeze({ x: 0.5, y: 0.5 }),
});
