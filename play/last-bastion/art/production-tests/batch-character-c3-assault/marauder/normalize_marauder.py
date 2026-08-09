"""Build deterministic Marauder AR runtime derivatives from retained alpha masters."""

from pathlib import Path

from PIL import Image, ImageChops, ImageOps


ROOT = Path(__file__).resolve().parent


def fit_alpha(source: Image.Image, size: tuple[int, int], padding: int) -> Image.Image:
    source = source.convert("RGBA")
    bbox = source.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("source has no visible pixels")
    subject = source.crop(bbox)
    target_w = size[0] - padding * 2
    target_h = size[1] - padding * 2
    scale = min(target_w / subject.width, target_h / subject.height)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return canvas


def build_weapon() -> None:
    source = Image.open(ROOT / "marauder-ar-gameplay-v1-alpha-master.png")
    fit_alpha(source, (256, 128), 10).save(ROOT / "marauder-ar-gameplay-v1-256x128.png")


def build_effects() -> None:
    source = Image.open(ROOT / "marauder-ar-effects-v1-alpha-master.png").convert("RGBA")
    source_cell_w = source.width // 4
    atlas = Image.new("RGBA", (256, 64), (0, 0, 0, 0))
    for frame in range(4):
        cell = source.crop((frame * source_cell_w, 0, (frame + 1) * source_cell_w, source.height))
        atlas.alpha_composite(fit_alpha(cell, (64, 64), 5), (frame * 64, 0))
    atlas.save(ROOT / "marauder-ar-effects-v1-64.png")


def build_tile() -> None:
    source = Image.open(ROOT / "marauder-ar-tile-v1-source.png").convert("RGBA")
    tile = ImageOps.fit(source, (128, 128), Image.Resampling.LANCZOS)
    reference_atlas = Image.open(ROOT.parents[1] / "batch-i" / "codex-weapon-tile-atlas-v1-128.png").convert("RGBA")
    frame_mask = reference_atlas.crop((7 * 128, 0, 8 * 128, 128)).getchannel("A")
    tile.putalpha(ImageChops.multiply(tile.getchannel("A"), frame_mask))
    tile.save(ROOT / "marauder-ar-tile-v1-128.png")


if __name__ == "__main__":
    build_weapon()
    build_effects()
    build_tile()
    print("Wrote Marauder AR gameplay, effect, and tile runtime derivatives.")
