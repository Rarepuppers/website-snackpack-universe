"""Normalize approved Batch A concept sheets into fixed Phaser atlases."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def grid_region(image: Image.Image, column: int, row: int, columns: int, rows: int) -> Image.Image:
    left = round(column * image.width / columns)
    right = round((column + 1) * image.width / columns)
    top = round(row * image.height / rows)
    bottom = round((row + 1) * image.height / rows)
    return image.crop((left, top, right, bottom))


def fixed_square_sheet(source: str, output: str, columns: int, rows: int, size: int) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    atlas = Image.new("RGBA", (columns * size, rows * size))
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            side = min(region.width, region.height)
            left = (region.width - side) // 2
            top = (region.height - side) // 2
            frame = region.crop((left, top, left + side, top + side)).resize((size, size), NEAREST)
            atlas.alpha_composite(frame, (column * size, row * size))
    atlas.save(ROOT / output)


def fitted_sheet(
    source: str,
    output: str,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
    padding: int,
) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    atlas = Image.new("RGBA", (columns * frame_width, rows * frame_height))
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            alpha_box = region.getchannel("A").getbbox()
            if alpha_box is None:
                continue
            art = region.crop(alpha_box)
            scale = min(
                (frame_width - padding * 2) / art.width,
                (frame_height - padding * 2) / art.height,
            )
            target = (max(1, round(art.width * scale)), max(1, round(art.height * scale)))
            art = art.resize(target, NEAREST)
            x = column * frame_width + (frame_width - art.width) // 2
            y = row * frame_height + (frame_height - art.height) // 2
            atlas.alpha_composite(art, (x, y))
    atlas.save(ROOT / output)


fixed_square_sheet("combat-effect-atlas-v1.png", "combat-effect-atlas-v1-64.png", 5, 4, 64)
fitted_sheet("pickup-atlas-v1.png", "pickup-atlas-v1-64.png", 4, 1, 64, 64, 5)
fitted_sheet("hud-panel-atlas-v1.png", "hud-panel-atlas-v1-256x128.png", 3, 2, 256, 128, 5)
