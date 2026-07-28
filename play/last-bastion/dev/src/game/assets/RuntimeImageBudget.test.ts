import { describe, expect, it } from "vitest";
import manifestData from "../../../../art/production-tests/runtime-webp-manifest.json";

interface RuntimeImageRecord {
  source: string;
  runtime: string;
  runtimeBytes: number;
}

interface RuntimeImageManifest {
  assets: RuntimeImageRecord[];
  supportingAssets: { source: string; bytes: number }[];
}

const manifest = manifestData as RuntimeImageManifest;

describe("runtime image transfer budgets", () => {
  it("keeps the complete high-resolution WebP batch below 1.6 MiB", () => {
    const runtimeBytes = manifest.assets.reduce((total, asset) => total + asset.runtimeBytes, 0);
    expect(runtimeBytes).toBeLessThanOrEqual(1.6 * 1024 * 1024);
  });

  it("keeps every map backdrop below 384 KiB", () => {
    const backdrops = manifest.assets.filter((asset) => asset.runtime.includes("map-backdrop"));
    expect(backdrops).toHaveLength(6);
    for (const backdrop of backdrops) {
      expect(backdrop.runtimeBytes, backdrop.runtime).toBeLessThanOrEqual(384 * 1024);
    }
  });

  it("keeps title startup art below 128 KiB", () => {
    const titleBackdrop = manifest.assets.find((asset) => (
      asset.runtime.includes("bastion-logistics-map-backdrop")
    ));
    expect(titleBackdrop?.runtimeBytes).toBeLessThanOrEqual(128 * 1024);
  });

  it("keeps deferred character-select art below 600 KiB", () => {
    const portraits = manifest.assets
      .filter((asset) => asset.runtime.includes("select-portrait"))
      .reduce((total, asset) => total + asset.runtimeBytes, 0);
    const perkAtlas = manifest.supportingAssets.find((asset) => (
      asset.source.includes("canonical-perk-tile-atlas")
    ))?.bytes ?? Number.POSITIVE_INFINITY;
    expect(portraits + perkAtlas).toBeLessThanOrEqual(600 * 1024);
  });
});
