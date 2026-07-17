"""Normalize approved Bastion Eater Production Batch D3 masters."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def region(image: Image.Image, column: int, row: int, columns: int, rows: int) -> Image.Image:
    return image.crop((
        round(column * image.width / columns),
        round(row * image.height / rows),
        round((column + 1) * image.width / columns),
        round((row + 1) * image.height / rows),
    ))


def art_bounds(image: Image.Image) -> Image.Image | None:
    box = image.getchannel("A").getbbox()
    return None if box is None else image.crop(box)


def sheet(source: str, output: str, columns: int, rows: int, cell: int, padding: int, shared: bool) -> None:
    source_image = Image.open(ROOT / source).convert("RGBA")
    frames = [art_bounds(region(source_image, column, row, columns, rows))
              for row in range(rows) for column in range(columns)]
    scales = [min((cell - padding * 2) / frame.width, (cell - padding * 2) / frame.height)
              for frame in frames if frame is not None]
    common_scale = min(scales) if shared and scales else None
    atlas = Image.new("RGBA", (columns * cell, rows * cell))
    for index, frame in enumerate(frames):
        if frame is None:
            continue
        scale = common_scale or min((cell - padding * 2) / frame.width, (cell - padding * 2) / frame.height)
        frame = frame.resize((max(1, round(frame.width * scale)), max(1, round(frame.height * scale))), NEAREST)
        column, row = index % columns, index // columns
        atlas.alpha_composite(frame, (column * cell + (cell - frame.width) // 2,
                                      row * cell + (cell - frame.height) // 2))
    atlas.save(ROOT / output)


def portrait(source: str, output: str, size: int, padding: int) -> None:
    image = art_bounds(Image.open(ROOT / source).convert("RGBA"))
    if image is None:
        raise ValueError("Portrait source has no visible pixels")
    scale = min((size - padding * 2) / image.width, (size - padding * 2) / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), NEAREST)
    canvas = Image.new("RGBA", (size, size))
    canvas.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
    canvas.save(ROOT / output)


sheet("bastion-eater-spritesheet-v1.png", "bastion-eater-spritesheet-v1-192.png", 4, 3, 192, 7, True)
sheet("bastion-eater-node-overlay-v1.png", "bastion-eater-node-overlay-v1-192.png", 4, 2, 192, 7, True)
sheet("bastion-eater-effect-atlas-v1.png", "bastion-eater-effect-atlas-v1-96.png", 4, 3, 96, 4, False)
sheet("bastion-eater-environment-atlas-v1.png", "bastion-eater-environment-atlas-v1-96.png", 4, 2, 96, 4, False)
portrait("bastion-eater-portrait-v1.png", "bastion-eater-portrait-v1-256.png", 256, 8)
