"""Build Batch K's 4x4 high-resolution status-overlay atlas."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
FRAME_SIZE = 256
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
    visible = [box for box in boxes if box is not None]
    if not visible:
        raise ValueError(f"No visible pixels found in {path.name}")
    left = min(box[0] for box in visible)
    top = min(box[1] for box in visible)
    right = max(box[2] for box in visible)
    bottom = max(box[3] for box in visible)
    side = max(1, round(max(right - left, bottom - top) * 1.14))
    centre_x = (left + right) / 2
    centre_y = (top + bottom) / 2
    normalized = []
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
        normalized.append(square.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS))
    return normalized


atlas = Image.new("RGBA", (FRAME_SIZE * 4, FRAME_SIZE * 4), (0, 0, 0, 0))
for row, (filename, frame_count) in enumerate(ROWS):
    for column, frame in enumerate(split_strip(ROOT / filename, frame_count)):
        atlas.alpha_composite(frame, (column * FRAME_SIZE, row * FRAME_SIZE))

atlas.save(ROOT / "status-effect-overlay-atlas-v2-256.png", optimize=True)
