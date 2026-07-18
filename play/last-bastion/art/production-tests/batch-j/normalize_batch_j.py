"""Normalize Batch J retained masters into stable nearest-neighbour runtime atlases."""

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


def extracted_frames(source: str, columns: int, rows: int) -> list[Image.Image]:
    image = Image.open(ROOT / source).convert("RGBA")
    frames: list[Image.Image] = []
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            inset_x = round(region.width * 0.012)
            inset_y = round(region.height * 0.012)
            region = region.crop((inset_x, inset_y, region.width - inset_x, region.height - inset_y))
            box = region.getchannel("A").getbbox()
            if box is None:
                raise ValueError(f"Empty frame {column},{row} in {source}")
            frames.append(region.crop(box))
    return frames


def full_cell_frames(source: str, columns: int, rows: int) -> list[Image.Image]:
    image = Image.open(ROOT / source).convert("RGBA")
    return [
        grid_region(image, column, row, columns, rows)
        for row in range(rows)
        for column in range(columns)
    ]


def write_atlas(
    frames: list[Image.Image],
    output: str,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
    padding: int,
    common_scale: bool,
) -> None:
    if len(frames) != columns * rows:
        raise ValueError(f"{output}: {len(frames)} frames do not fill {columns}x{rows}")
    scales = [
        min((frame_width - padding * 2) / frame.width, (frame_height - padding * 2) / frame.height)
        for frame in frames
    ]
    shared_scale = min(scales) if common_scale else None
    atlas = Image.new("RGBA", (columns * frame_width, rows * frame_height))
    for index, frame in enumerate(frames):
        scale = shared_scale or scales[index]
        art = frame.resize((max(1, round(frame.width * scale)), max(1, round(frame.height * scale))), NEAREST)
        column, row = index % columns, index // columns
        x = column * frame_width + (frame_width - art.width) // 2
        y = row * frame_height + (frame_height - art.height) // 2
        atlas.alpha_composite(art, (x, y))
    atlas.save(ROOT / output)


def write_cell_atlas(
    frames: list[Image.Image],
    output: str,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
) -> None:
    if len(frames) != columns * rows:
        raise ValueError(f"{output}: {len(frames)} frames do not fill {columns}x{rows}")
    atlas = Image.new("RGBA", (columns * frame_width, rows * frame_height))
    for index, frame in enumerate(frames):
        art = frame.resize((frame_width, frame_height), NEAREST)
        atlas.alpha_composite(art, ((index % columns) * frame_width, (index // columns) * frame_height))
    atlas.save(ROOT / output)


write_atlas(
    extracted_frames("swarm-scuttler-spritesheet-v1.png", 4, 2),
    "swarm-scuttler-spritesheet-v1-64.png", 4, 2, 64, 64, 3, True,
)
write_atlas(
    extracted_frames("razorlord-spritesheet-v1.png", 4, 4),
    "razorlord-spritesheet-v1-96.png", 4, 4, 96, 96, 4, True,
)
write_atlas(
    extracted_frames("blightspitter-spritesheet-v1.png", 4, 3),
    "blightspitter-spritesheet-v1-96.png", 4, 3, 96, 96, 4, True,
)
write_atlas(
    extracted_frames("quillback-matriarch-spritesheet-v1.png", 4, 4),
    "quillback-matriarch-spritesheet-v1-128.png", 4, 4, 128, 128, 5, True,
)

telegraph_a = full_cell_frames("telegraph-decals-a-v2.png", 4, 4)
telegraph_b = full_cell_frames("telegraph-decals-b-v1.png", 4, 2)
write_cell_atlas(
    telegraph_a[0:4] + telegraph_a[8:12],
    "telegraph-large-atlas-v1-128.png", 4, 2, 128, 128,
)
write_cell_atlas(
    telegraph_a[4:8] + telegraph_a[12:16] + telegraph_b[0:4],
    "telegraph-small-atlas-v1-64.png", 4, 3, 64, 64,
)
write_cell_atlas(
    telegraph_b[4:8],
    "telegraph-danger-fill-v1-64.png", 4, 1, 64, 64,
)


EXPECTED = {
    "swarm-scuttler-spritesheet-v1-64.png": (256, 128),
    "razorlord-spritesheet-v1-96.png": (384, 384),
    "blightspitter-spritesheet-v1-96.png": (384, 288),
    "quillback-matriarch-spritesheet-v1-128.png": (512, 512),
    "telegraph-large-atlas-v1-128.png": (512, 256),
    "telegraph-small-atlas-v1-64.png": (256, 192),
    "telegraph-danger-fill-v1-64.png": (256, 64),
}
for name, expected_size in EXPECTED.items():
    image = Image.open(ROOT / name).convert("RGBA")
    if image.size != expected_size:
        raise ValueError(f"{name}: expected {expected_size}, got {image.size}")
    if image.getpixel((0, 0))[3] != 0 and "danger-fill" not in name:
        raise ValueError(f"{name}: top-left corner is not transparent")
