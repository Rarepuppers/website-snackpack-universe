"""Normalize Event Horizon preflight masters to stable runtime contracts."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent


def crop_grid(source: Image.Image, columns: int, rows: int, size: int) -> Image.Image:
    source = source.convert("RGBA")
    cells: list[Image.Image] = []
    for row in range(rows):
        for column in range(columns):
            left = round(column * source.width / columns)
            right = round((column + 1) * source.width / columns)
            top = round(row * source.height / rows)
            bottom = round((row + 1) * source.height / rows)
            cells.append(source.crop((left, top, right, bottom)))

    boxes = [cell.getchannel("A").getbbox() for cell in cells]
    visible = [box for box in boxes if box is not None]
    if not visible:
        raise ValueError("No visible pixels in source")
    left = min(box[0] for box in visible)
    top = min(box[1] for box in visible)
    right = max(box[2] for box in visible)
    bottom = max(box[3] for box in visible)
    side = max(right - left, bottom - top)
    side = max(1, round(side * 1.12))
    centre_x = (left + right) / 2
    centre_y = (top + bottom) / 2

    output = Image.new("RGBA", (size * columns, size * rows), (0, 0, 0, 0))
    for index, cell in enumerate(cells):
        crop_left = round(centre_x - side / 2)
        crop_top = round(centre_y - side / 2)
        crop_right = crop_left + side
        crop_bottom = crop_top + side
        region = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        source_left = max(0, crop_left)
        source_top = max(0, crop_top)
        source_right = min(cell.width, crop_right)
        source_bottom = min(cell.height, crop_bottom)
        if source_right > source_left and source_bottom > source_top:
            region.alpha_composite(
                cell.crop((source_left, source_top, source_right, source_bottom)),
                (source_left - crop_left, source_top - crop_top),
            )
        frame = region.resize((size, size), Image.Resampling.NEAREST)
        output.alpha_composite(frame, ((index % columns) * size, (index // columns) * size))
    return output


def normalize_tile() -> Image.Image:
    source = Image.open(ROOT / "event-horizon-tile-v1.png").convert("RGBA")
    bbox = source.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Tile has no visible pixels")
    left, top, right, bottom = bbox
    side = max(right - left, bottom - top)
    margin = round(side * 0.11)
    side += margin * 2
    cx = (left + right) / 2
    cy = (top + bottom) / 2
    crop_left = round(cx - side / 2)
    crop_top = round(cy - side / 2)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    source_left = max(0, crop_left)
    source_top = max(0, crop_top)
    source_right = min(source.width, crop_left + side)
    source_bottom = min(source.height, crop_top + side)
    canvas.alpha_composite(
        source.crop((source_left, source_top, source_right, source_bottom)),
        (source_left - crop_left, source_top - crop_top),
    )
    return canvas.resize((64, 64), Image.Resampling.NEAREST)


def main() -> None:
    crop_grid(Image.open(ROOT / "event-horizon-spritesheet-v1.png"), 4, 1, 96).save(
        ROOT / "event-horizon-spritesheet-v1-96.png", optimize=True,
    )
    crop_grid(Image.open(ROOT / "event-horizon-effect-atlas-v1.png"), 4, 2, 64).save(
        ROOT / "event-horizon-effect-atlas-v1-64.png", optimize=True,
    )
    normalize_tile().save(ROOT / "event-horizon-tile-v1-64.png", optimize=True)
    print("Wrote Event Horizon runtime spritesheet, effects atlas, and tile")


if __name__ == "__main__":
    main()
