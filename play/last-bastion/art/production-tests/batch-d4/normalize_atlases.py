"""Normalize approved Razor Scuttler Production Batch D4 masters into Phaser assets."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def grid_region(image: Image.Image, column: int, row: int, columns: int, rows: int) -> Image.Image:
    return image.crop((
        round(column * image.width / columns),
        round(row * image.height / rows),
        round((column + 1) * image.width / columns),
        round((row + 1) * image.height / rows),
    ))


def fitted_sheet(
    source: str,
    output: str,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
    padding: int,
    common_scale: bool,
) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    frames: list[Image.Image | None] = []
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            inset_x = round(region.width * 0.02)
            inset_y = round(region.height * 0.02)
            region = region.crop((inset_x, inset_y, region.width - inset_x, region.height - inset_y))
            box = region.getchannel("A").getbbox()
            frames.append(None if box is None else region.crop(box))

    scales = [
        min((frame_width - padding * 2) / art.width, (frame_height - padding * 2) / art.height)
        for art in frames if art is not None
    ]
    shared_scale = min(scales) if common_scale and scales else None
    atlas = Image.new("RGBA", (columns * frame_width, rows * frame_height))
    for index, art in enumerate(frames):
        if art is None:
            continue
        scale = shared_scale or min(
            (frame_width - padding * 2) / art.width,
            (frame_height - padding * 2) / art.height,
        )
        art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), NEAREST)
        column, row = index % columns, index // columns
        x = column * frame_width + (frame_width - art.width) // 2
        y = row * frame_height + (frame_height - art.height) // 2
        atlas.alpha_composite(art, (x, y))
    atlas.save(ROOT / output)


fitted_sheet("razor-scuttler-spritesheet-v1.png", "razor-scuttler-spritesheet-v1-96.png", 4, 4, 96, 96, 4, True)
fitted_sheet("razor-scuttler-effect-atlas-v1.png", "razor-scuttler-effect-atlas-v1-64.png", 4, 2, 64, 64, 3, False)
