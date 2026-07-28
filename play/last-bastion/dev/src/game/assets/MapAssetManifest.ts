import alienHiveMapBackdropUrl from "../../../../art/production-tests/batch-map-presentation/alien-hive-map-backdrop-v1-1536x1024.png";
import alienHiveMapBackdropWebpUrl from "../../../../art/production-tests/batch-map-presentation/alien-hive-map-backdrop-v1-1536x1024.webp";
import arcticRelayMapBackdropUrl from "../../../../art/production-tests/batch-map-presentation/arctic-relay-map-backdrop-v1-1536x1024.png";
import arcticRelayMapBackdropWebpUrl from "../../../../art/production-tests/batch-map-presentation/arctic-relay-map-backdrop-v1-1536x1024.webp";
import machineFoundryMapBackdropUrl from "../../../../art/production-tests/batch-map-presentation/machine-foundry-map-backdrop-v1-1536x1024.png";
import machineFoundryMapBackdropWebpUrl from "../../../../art/production-tests/batch-map-presentation/machine-foundry-map-backdrop-v1-1536x1024.webp";
import scienceWingMapBackdropUrl from "../../../../art/production-tests/batch-map-presentation/science-wing-map-backdrop-v1-1536x1024.png";
import scienceWingMapBackdropWebpUrl from "../../../../art/production-tests/batch-map-presentation/science-wing-map-backdrop-v1-1536x1024.webp";
import voidApproachMapBackdropUrl from "../../../../art/production-tests/batch-map-presentation/void-approach-map-backdrop-v1-1536x1024.png";
import voidApproachMapBackdropWebpUrl from "../../../../art/production-tests/batch-map-presentation/void-approach-map-backdrop-v1-1536x1024.webp";
import type { ImageAssetDefinition } from "./GameAssetManifest";
import { BASTION_BACKDROP_ASSET } from "./BastionBackdropAsset";
import { runtimeImageUrl } from "./RuntimeImageFormat";

const ALIEN_HIVE_BACKDROP = backdrop(
  "alien-hive-map-backdrop-v1",
  runtimeImageUrl(alienHiveMapBackdropUrl, alienHiveMapBackdropWebpUrl),
);
const ARCTIC_RELAY_BACKDROP = backdrop(
  "arctic-relay-map-backdrop-v1",
  runtimeImageUrl(arcticRelayMapBackdropUrl, arcticRelayMapBackdropWebpUrl),
);
const MACHINE_FOUNDRY_BACKDROP = backdrop(
  "machine-foundry-map-backdrop-v1",
  runtimeImageUrl(machineFoundryMapBackdropUrl, machineFoundryMapBackdropWebpUrl),
);
const SCIENCE_WING_BACKDROP = backdrop(
  "science-wing-map-backdrop-v1",
  runtimeImageUrl(scienceWingMapBackdropUrl, scienceWingMapBackdropWebpUrl),
);
const VOID_APPROACH_BACKDROP = backdrop(
  "void-approach-map-backdrop-v1",
  runtimeImageUrl(voidApproachMapBackdropUrl, voidApproachMapBackdropWebpUrl),
);

const MAP_BACKDROP_BY_THEME: Readonly<Record<string, ImageAssetDefinition>> = Object.freeze({
  "bastion-standard": BASTION_BACKDROP_ASSET,
  "bastion-logistics": BASTION_BACKDROP_ASSET,
  "emberfall": MACHINE_FOUNDRY_BACKDROP,
  "toxic-bloom": ALIEN_HIVE_BACKDROP,
  "surface-frontier": BASTION_BACKDROP_ASSET,
  "starship-transit": SCIENCE_WING_BACKDROP,
  "containment-underworld": VOID_APPROACH_BACKDROP,
  "alien-hive": ALIEN_HIVE_BACKDROP,
  "machine-foundry": MACHINE_FOUNDRY_BACKDROP,
  "science-wing": SCIENCE_WING_BACKDROP,
  "void-approach": VOID_APPROACH_BACKDROP,
  "arctic-relay": ARCTIC_RELAY_BACKDROP,
});

export function mapBackdropAssetForTheme(themeId: string): ImageAssetDefinition {
  return MAP_BACKDROP_BY_THEME[themeId] ?? BASTION_BACKDROP_ASSET;
}

function backdrop(id: ImageAssetDefinition["id"], url: string): ImageAssetDefinition {
  return Object.freeze({
    kind: "image",
    id,
    url,
    logicalWidth: 1536,
    logicalHeight: 1024,
    pivot: Object.freeze({ x: 0.5, y: 0.5 }),
  });
}
