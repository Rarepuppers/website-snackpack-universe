"""Normalize approved Production Batch C masters into fixed Phaser atlases."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def grid_region(image: Image.Image, column: int, row: int, columns: int, rows: int) -> Image.Image:
    left = round(column * image.width / columns)
    right = round((column + 1) * image.width / columns)
    top = round(row * image.height / rows)
    bottom = round((row + 1) * image.height / rows)
    region = image.crop((left, top, right, bottom))
    inset_x = round(region.width * 0.02)
    inset_y = round(region.height * 0.02)
    return region.crop((inset_x, inset_y, region.width - inset_x, region.height - inset_y))


def fitted_sheet(source: str, output: str, columns: int, rows: int, size: int, padding: int) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    atlas = Image.new("RGBA", (columns * size, rows * size))
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            alpha_box = region.getchannel("A").getbbox()
            if alpha_box is None:
                continue
            art = region.crop(alpha_box)
            scale = min((size - padding * 2) / art.width, (size - padding * 2) / art.height)
            art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), NEAREST)
            x = column * size + (size - art.width) // 2
            y = row * size + (size - art.height) // 2
            atlas.alpha_composite(art, (x, y))
    atlas.save(ROOT / output)


fitted_sheet("blast-mite-spritesheet-v1.png", "blast-mite-spritesheet-v1-64.png", 4, 3, 64, 3)
fitted_sheet("warp-flanker-spritesheet-v1.png", "warp-flanker-spritesheet-v1-96.png", 4, 3, 96, 4)
fitted_sheet("batch-c-reward-atlas-v1.png", "batch-c-reward-atlas-v1-64.png", 4, 4, 64, 3)
fitted_sheet("batch-c-effect-atlas-v1.png", "batch-c-effect-atlas-v1-64.png", 5, 4, 64, 3)
