"""Generate audited WebP runtime derivatives from high-resolution PNG masters.

Two tiers, because sprite art and photographic plates want different encoders:

* ``SOURCES`` — the large photographic map plates and character portraits. Lossy
  q92 is fine; nothing here is sampled per-texel by gameplay.
* ``LOSSLESS_SOURCES`` — sprite sheets, atlases, and anything the renderer draws
  at a fixed logical cell size. These are encoded **lossless**, so decoded
  pixels are bit-identical to the PNG master. Lossy WebP shifts alpha edges,
  which is exactly the chroma-fringe failure the art bible's quality floor
  exists to catch, and it would do so invisibly at authoring size.

Scope note (7 Aug 2026): the lossless tier covers every ``GameAssetManifest``
PNG import above 300 KB — 50 files holding 33.4 MB, which is the bulk of the
per-route image weight. The remaining ~120 imports are small enough that the
paired-import cost outweighs the saving; revisit only if a route's measured
payload says otherwise. The 106 MB total in ``game-assets/`` is NOT the download
size: assets load per scene, and the combat route pulls 6.34 MB.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, features


QUALITY = 92
MAX_RUNTIME_RATIO = 0.75
# Lossless WebP on sprite art measures around 69% of PNG; 90% leaves headroom
# for an outlier without letting a no-win encode through unnoticed.
MAX_LOSSLESS_RUNTIME_RATIO = 0.90
GAME_ROOT = Path(__file__).resolve().parents[2]
ART_ROOT = GAME_ROOT / "art" / "production-tests"
MANIFEST_PATH = ART_ROOT / "runtime-webp-manifest.json"
SOURCES = (
    "batch-map-presentation/bastion-logistics-map-backdrop-v1-1536x1024.png",
    "batch-map-presentation/alien-hive-map-backdrop-v1-1536x1024.png",
    "batch-map-presentation/machine-foundry-map-backdrop-v1-1536x1024.png",
    "batch-map-presentation/science-wing-map-backdrop-v1-1536x1024.png",
    "batch-map-presentation/void-approach-map-backdrop-v1-1536x1024.png",
    "batch-map-presentation/arctic-relay-map-backdrop-v1-1536x1024.png",
    "batch-character-select/marine-select-portrait-v1-1024x1536.png",
    "batch-character-select/medic-select-portrait-v1-1024x1536.png",
)

LOSSLESS_SOURCES = (
    "batch-e1/ironhide-abomination-spritesheet-v1-128.png",
    "batch-e1/splitcaller-weaver-spritesheet-v1-192.png",
    "batch-e1/voltaic-warden-spritesheet-v1-128.png",
    "batch-aa/assembly-prime-v1-192.png",
    "batch-ac/abomination-prime-v1-192.png",
    "batch-y/machine-foundry-fabricator-v1-192.png",
    "batch-x/machine-cyborg-reclaimer-v1-192.png",
    "batch-ab/storm-regent-v1-192.png",
    "batch-t/nest-weaver-spritesheet-v1-192.png",
    "batch-z/synapse-herald-v1-192.png",
    "batch-f1/action-tile-atlas-v1.png",
    "batch-c/batch-c-effect-atlas-v1.png",
    "batch-b/batch-b-effect-atlas-v1.png",
    "batch-u/storm-savant-v1-192.png",
    "batch-a/combat-effect-atlas-v1.png",
    "batch-y/machine-foundry-turret-v1-128.png",
    "batch-n2/scrap-shop-panel-v1-1024x576.png",
    "telegraph-refresh/telegraph-small-atlas-v2-256.png",
    "object-batch-o1/world-objects-natural-v1-192.png",
    "batch-f2/weapon-tile-atlas-v1.png",
    "batch-ah/surface-frontier-floor-v1-128.png",
    "object-batch-o1/world-objects-organic-v1-192.png",
    "batch-ag/alien-hive-floor-v1-128.png",
    "batch-i/shop-counter-backdrop-v1-1200x700.png",
    "batch-af/machine-foundry-floor-v1-128.png",
    "batch-f3/bulwark-rotary-cannon-effect-atlas-v1.png",
    "batch-ai/starship-transit-floor-v1-128.png",
    "object-batch-o1/world-objects-military-v1-192.png",
    "batch-f4/grenade-tube-effect-atlas-v1.png",
    "batch-ae/bastion-logistics-floor-v1-128.png",
    "batch-w/machine-arc-warden-v1-128.png",
    "batch-ad/science-wing-floor-v1-128.png",
    "batch-f1/patrol-blade-effect-atlas-v1.png",
    "batch-i/placement-modal-frame-v1-900x560.png",
    "batch-aj/containment-underworld-floor-v1-128.png",
    "batch-y/machine-foundry-drone-v1-128.png",
    "batch-r/destructible-terrain-v1-128.png",
    "batch-d3/bastion-eater-node-overlay-v1-192.png",
    "batch-af/machine-foundry-fixtures-v1-192.png",
    "batch-ai/starship-transit-fixtures-v1-192.png",
    "batch-ae/bastion-logistics-fixtures-v1-192.png",
    "batch-l/event-horizon-effect-atlas-v1.png",
    "legacy-enemy-refresh/scuttler-spritesheet-v2-256.png",
    "batch-ah/surface-frontier-fixtures-v1-192.png",
    "batch-v/machine-scrap-skitterer-v1-128.png",
    "batch-ag/alien-hive-fixtures-v1-192.png",
    "batch-ad/science-wing-fixtures-v1-192.png",
    "batch-aj/containment-underworld-fixtures-v1-192.png",
    "batch-a/pickup-atlas-v1.png",
    "batch-f2/bolt-carbine-effect-atlas-v1.png",
    "batch-d3/bastion-eater-spritesheet-v1-192.png",
    "batch-k/status-effect-overlay-atlas-v2-256.png",
    "legacy-enemy-refresh/egg-cluster-spritesheet-v2-256.png",
)


def encode(relative_source: str, *, lossless: bool, maximum_ratio: float) -> dict[str, object]:
    """Encode one master and return its audit record.

    Lossless output is verified by decoding it back and comparing pixels with
    the master. A sprite atlas that silently changed a pixel would only show up
    as a hairline seam at 4x, long after the encode.
    """
    source = ART_ROOT / relative_source
    runtime = source.with_suffix(".webp")
    temporary = runtime.with_suffix(".webp.tmp")
    if not source.is_file():
        raise FileNotFoundError(source)

    with Image.open(source) as image:
        width, height = image.size
        converted = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        save_options: dict[str, object] = {"format": "WEBP", "method": 6, "exact": True}
        if lossless:
            save_options["lossless"] = True
            save_options["quality"] = 100
        else:
            save_options["quality"] = QUALITY
        converted.save(temporary, **save_options)

        if lossless:
            with Image.open(temporary) as decoded:
                if decoded.convert(converted.mode).tobytes() != converted.tobytes():
                    temporary.unlink(missing_ok=True)
                    raise RuntimeError(f"{runtime.name} did not round-trip losslessly.")

    temporary.replace(runtime)
    source_bytes = source.stat().st_size
    runtime_bytes = runtime.stat().st_size
    ratio = runtime_bytes / source_bytes
    if ratio > maximum_ratio:
        raise RuntimeError(
            f"{runtime.name} is {ratio:.1%} of its PNG master; expected at most "
            f"{maximum_ratio:.0%}."
        )
    print(
        f"ENCODED{' (lossless)' if lossless else ''} {runtime.name}  "
        f"{source_bytes / 1024:.1f} KiB -> {runtime_bytes / 1024:.1f} KiB ({ratio:.1%})"
    )
    return {
        "source": source.relative_to(GAME_ROOT).as_posix(),
        "runtime": runtime.relative_to(GAME_ROOT).as_posix(),
        "width": width,
        "height": height,
        "quality": 100 if lossless else QUALITY,
        "lossless": lossless,
        "sourceBytes": source_bytes,
        "runtimeBytes": runtime_bytes,
        "sourceSha256": sha256(source),
        "runtimeSha256": sha256(runtime),
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    if not features.check("webp"):
        raise RuntimeError("This Pillow installation does not support WebP encoding.")

    records: list[dict[str, object]] = []
    source_total = 0
    runtime_total = 0
    for relative_source in SOURCES:
        record = encode(relative_source, lossless=False, maximum_ratio=MAX_RUNTIME_RATIO)
        records.append(record)
        source_total += int(record["sourceBytes"])
        runtime_total += int(record["runtimeBytes"])

    lossless_records: list[dict[str, object]] = []
    for relative_source in LOSSLESS_SOURCES:
        record = encode(
            relative_source, lossless=True, maximum_ratio=MAX_LOSSLESS_RUNTIME_RATIO
        )
        lossless_records.append(record)
        source_total += int(record["sourceBytes"])
        runtime_total += int(record["runtimeBytes"])

    manifest = {
        "schemaVersion": 2,
        "format": "webp",
        "quality": QUALITY,
        "maxRuntimeRatio": MAX_RUNTIME_RATIO,
        "maxLosslessRuntimeRatio": MAX_LOSSLESS_RUNTIME_RATIO,
        "assets": records,
        "losslessAssets": lossless_records,
        "supportingAssets": [
            supporting_asset_record("batch-i/canonical-perk-tile-atlas-v2-128.png"),
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(
        f"WebP batch complete: {source_total / 1024 / 1024:.2f} MiB -> "
        f"{runtime_total / 1024 / 1024:.2f} MiB "
        f"({runtime_total / source_total:.1%})."
    )
    print(f"Wrote {MANIFEST_PATH}")


def supporting_asset_record(relative_source: str) -> dict[str, object]:
    source = ART_ROOT / relative_source
    return {
        "source": source.relative_to(GAME_ROOT).as_posix(),
        "bytes": source.stat().st_size,
        "sha256": sha256(source),
    }


if __name__ == "__main__":
    main()
