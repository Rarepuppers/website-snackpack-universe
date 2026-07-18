"""Normalize Task 36 Aurum Hoarder masters into stable Phaser runtime atlases."""

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


def extracted_frames(source: str, columns: int, rows: int) -> list[Image.Image | None]:
    image = Image.open(ROOT / source).convert("RGBA")
    frames: list[Image.Image | None] = []
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            inset_x = round(region.width * 0.015)
            inset_y = round(region.height * 0.015)
            region = region.crop((inset_x, inset_y, region.width - inset_x, region.height - inset_y))
            box = region.getchannel("A").getbbox()
            frames.append(None if box is None else region.crop(box))
    return frames


def write_atlas(
    frames: list[Image.Image | None],
    output: str,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
    padding: int,
    common_scale: bool,
) -> None:
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


write_atlas(
    extracted_frames("aurum-hoarder-spritesheet-v1.png", 4, 3),
    "aurum-hoarder-spritesheet-v1-96.png",
    4, 3, 96, 96, 4, True,
)
write_atlas(
    extracted_frames("aurum-hoarder-effect-atlas-v1.png", 4, 2),
    "aurum-hoarder-effect-atlas-v1-64.png",
    4, 2, 64, 64, 3, False,
)
tile_frames = extracted_frames("aurum-tiles-a-v1.png", 2, 2) + extracted_frames("aurum-tiles-b-v1.png", 2, 2)
write_atlas(tile_frames, "aurum-tile-atlas-v1-128.png", 4, 2, 128, 128, 5, True)

tile_atlas = Image.open(ROOT / "aurum-tile-atlas-v1-128.png").convert("RGBA")
for index, name in enumerate([
    "scrap-tile-v1-128.png",
    "aurum-supply-cache-tile-v1-128.png",
    "aurum-hoarder-codex-tile-v1-128.png",
    "treasure-event-tile-v1-128.png",
    "armour-break-tile-v1-128.png",
    "escape-warning-tile-v1-128.png",
    "shop-scrap-tile-v1-128.png",
    "locked-treasure-event-tile-v1-128.png",
]):
    column, row = index % 4, index // 4
    tile_atlas.crop((column * 128, row * 128, (column + 1) * 128, (row + 1) * 128)).save(ROOT / name)
