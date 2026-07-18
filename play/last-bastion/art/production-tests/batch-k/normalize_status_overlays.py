"""Build Batch K's stable 4x4 status-overlay atlas from keyed source strips."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
FRAME_SIZE = 48
ATLAS_COLUMNS = 4
ATLAS_ROWS = 4

ROWS = (
    ("status-burning-strip-v1.png", 4),
    ("status-overload-strip-v1.png", 4),
    ("status-corrode-strip-v1.png", 4),
    ("status-freeze-strip-v1.png", 3),
)


def split_strip(path: Path, frame_count: int) -> list[Image.Image]:
    source = Image.open(path).convert("RGBA")
    bounds = [round(index * source.width / frame_count) for index in range(frame_count + 1)]
    frames = [source.crop((bounds[index], 0, bounds[index + 1], source.height)) for index in range(frame_count)]

    boxes = [frame.getchannel("A").getbbox() for frame in frames]
    visible_boxes = [box for box in boxes if box is not None]
    if not visible_boxes:
        raise ValueError(f"No visible pixels found in {path.name}")

    left = min(box[0] for box in visible_boxes)
    top = min(box[1] for box in visible_boxes)
    right = max(box[2] for box in visible_boxes)
    bottom = max(box[3] for box in visible_boxes)
    content_width = right - left
    content_height = bottom - top
    side = max(content_width, content_height)
    side = max(1, round(side * 1.14))
    centre_x = (left + right) / 2
    centre_y = (top + bottom) / 2

    normalized: list[Image.Image] = []
    for frame in frames:
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        crop_left = round(centre_x - side / 2)
        crop_top = round(centre_y - side / 2)
        crop_right = crop_left + side
        crop_bottom = crop_top + side

        source_left = max(0, crop_left)
        source_top = max(0, crop_top)
        source_right = min(frame.width, crop_right)
        source_bottom = min(frame.height, crop_bottom)
        if source_right > source_left and source_bottom > source_top:
            region = frame.crop((source_left, source_top, source_right, source_bottom))
            square.alpha_composite(region, (source_left - crop_left, source_top - crop_top))

        normalized.append(square.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.NEAREST))
    return normalized


def main() -> None:
    atlas = Image.new(
        "RGBA",
        (FRAME_SIZE * ATLAS_COLUMNS, FRAME_SIZE * ATLAS_ROWS),
        (0, 0, 0, 0),
    )
    for row_index, (filename, frame_count) in enumerate(ROWS):
        frames = split_strip(ROOT / filename, frame_count)
        for column_index, frame in enumerate(frames):
            atlas.alpha_composite(frame, (column_index * FRAME_SIZE, row_index * FRAME_SIZE))

    output = ROOT / "status-effect-overlay-atlas-v1-48.png"
    atlas.save(output, optimize=True)
    print(f"Wrote {output} ({atlas.width}x{atlas.height}, RGBA)")


if __name__ == "__main__":
    main()
