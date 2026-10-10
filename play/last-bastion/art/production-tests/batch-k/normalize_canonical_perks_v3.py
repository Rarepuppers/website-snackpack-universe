"""Build Batch K retained tiles and the ten-frame canonical perk atlas.

The seven approved v2 runtime frames are copied as pixels, without resampling.
The Batch I 128px crop/fit rule is reused for the three new frames.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
BATCH_I = ROOT.parent / "batch-i"
SOURCE_MASTER = BATCH_I / "canonical-perk-tiles-v2-alpha-master.png"
SOURCE_ATLAS = BATCH_I / "canonical-perk-tile-atlas-v2-128.png"
OUTPUT = ROOT / "canonical-perk-tile-atlas-v3-128.png"
SIZE, PAD = 128, 4
NAMES = ("vanguard", "logistician", "recon-specialist")


def remove_chroma(image: Image.Image) -> Image.Image:
    """Batch I magenta rule, evaluated as arrays for the large retained masters."""
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    distance = np.sqrt((red - 255) ** 2 + green**2 + (blue - 255) ** 2)
    magenta_like = (green < 110) & (red > 145) & (blue > 145) & (np.abs(red - blue) < 115)
    alpha = np.where(magenta_like, 0, np.clip(np.rint((distance - 58) * 5.2), 0, 255))
    spill = alpha / 255
    rgba = np.dstack((
        np.rint(red * (1 - 0.12 * spill)),
        np.rint(green * (1 - 0.06 * spill)),
        np.rint(blue * (1 - 0.12 * spill)),
        alpha,
    )).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def empty_batch_i_frame() -> Image.Image:
    source = Image.open(SOURCE_MASTER).convert("RGBA")
    tile = source.crop((0, 0, round(source.width / 4), round(source.height / 2)))
    width, height = tile.size
    # Only the inset field is repainted. The approved 4K metal surround and
    # its top-left light remain literal pixels from the Batch I master.
    polygon = [(168, 111), (365, 111), (397, 147), (397, 319),
               (366, 357), (167, 357), (138, 320), (138, 149)]
    mask = Image.new("L", (width * 4, height * 4))
    draw = ImageDraw.Draw(mask)
    draw.polygon([(x * 4, y * 4) for x, y in polygon], fill=255)
    mask = mask.resize((width, height), Image.Resampling.LANCZOS)
    pixels = np.zeros((height, width, 4), dtype=np.uint8)
    yy, xx = np.indices((height, width))
    texture = ((xx * 17 + yy * 29 + (xx * yy) // 47) % 7).astype(np.uint8)
    pixels[..., 0] = 6 + texture
    pixels[..., 1] = 23 + texture
    pixels[..., 2] = 32 + texture
    pixels[..., 3] = 255
    field = Image.fromarray(pixels, "RGBA")
    tile.paste(field, (0, 0), mask)
    return tile


def framed_tile(name: str, base: Image.Image) -> Image.Image:
    icon = remove_chroma(Image.open(ROOT / f"{name}-v1-chroma-master.png"))
    bounds = icon.getchannel("A").getbbox()
    if bounds is None:
        raise RuntimeError(f"{name} has no visible icon")
    icon = icon.crop(bounds)
    scale = min(232 / icon.width, 232 / icon.height)
    icon = icon.resize((round(icon.width * scale), round(icon.height * scale)), Image.Resampling.LANCZOS)
    tile = base.copy()
    tile.alpha_composite(icon, ((tile.width - icon.width) // 2 + 44,
                                (tile.height - icon.height) // 2 + 13))
    tile.save(ROOT / f"{name}-v1-tile-alpha-master.png", optimize=True)
    chroma = Image.new("RGBA", tile.size, (255, 0, 255, 255))
    chroma.alpha_composite(tile)
    chroma.convert("RGB").save(ROOT / f"{name}-v1-tile-chroma-master.png", optimize=True)
    return tile


def normalize(tile: Image.Image) -> Image.Image:
    bounds = tile.getchannel("A").getbbox()
    if bounds is None:
        raise RuntimeError("Empty tile")
    art = tile.crop(bounds)
    scale = min((SIZE - PAD * 2) / art.width, (SIZE - PAD * 2) / art.height)
    art = art.resize((max(1, round(art.width * scale)),
                      max(1, round(art.height * scale))), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (SIZE, SIZE))
    frame.alpha_composite(art, ((SIZE - art.width) // 2, (SIZE - art.height) // 2))
    return frame


def main() -> None:
    v2 = Image.open(SOURCE_ATLAS).convert("RGBA")
    if v2.size != (512, 256):
        raise RuntimeError(f"Unexpected v2 atlas size: {v2.size}")
    atlas = Image.new("RGBA", (512, 384))
    for index in range(7):
        x, y = (index % 4) * SIZE, (index // 4) * SIZE
        atlas.paste(v2.crop((x, y, x + SIZE, y + SIZE)), (x, y))
    base = empty_batch_i_frame()
    for index, name in enumerate(NAMES, start=7):
        tile = framed_tile(name, base)
        x, y = (index % 4) * SIZE, (index // 4) * SIZE
        atlas.alpha_composite(normalize(tile), (x, y))
    atlas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT.name}: {atlas.width}x{atlas.height}, frames 0-9")


if __name__ == "__main__":
    main()
