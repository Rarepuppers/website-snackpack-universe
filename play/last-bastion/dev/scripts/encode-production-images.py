"""Generate audited WebP runtime derivatives from high-resolution PNG masters."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, features


QUALITY = 92
MAX_RUNTIME_RATIO = 0.75
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
        source = ART_ROOT / relative_source
        runtime = source.with_suffix(".webp")
        temporary = runtime.with_suffix(".webp.tmp")
        if not source.is_file():
            raise FileNotFoundError(source)

        with Image.open(source) as image:
            width, height = image.size
            converted = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            converted.save(
                temporary,
                format="WEBP",
                quality=QUALITY,
                method=6,
                exact=True,
            )

        temporary.replace(runtime)
        source_bytes = source.stat().st_size
        runtime_bytes = runtime.stat().st_size
        ratio = runtime_bytes / source_bytes
        if ratio > MAX_RUNTIME_RATIO:
            raise RuntimeError(
                f"{runtime.name} is {ratio:.1%} of its PNG master; expected at most "
                f"{MAX_RUNTIME_RATIO:.0%}."
            )
        source_total += source_bytes
        runtime_total += runtime_bytes
        records.append(
            {
                "source": source.relative_to(GAME_ROOT).as_posix(),
                "runtime": runtime.relative_to(GAME_ROOT).as_posix(),
                "width": width,
                "height": height,
                "quality": QUALITY,
                "sourceBytes": source_bytes,
                "runtimeBytes": runtime_bytes,
                "sourceSha256": sha256(source),
                "runtimeSha256": sha256(runtime),
            }
        )
        print(
            f"ENCODED {runtime.name}  {source_bytes / 1024:.1f} KiB -> "
            f"{runtime_bytes / 1024:.1f} KiB ({ratio:.1%})"
        )

    manifest = {
        "schemaVersion": 1,
        "format": "webp",
        "quality": QUALITY,
        "maxRuntimeRatio": MAX_RUNTIME_RATIO,
        "assets": records,
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
