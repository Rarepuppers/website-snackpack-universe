"""Build the deterministic six-frame dedicated power-up atlas."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
FRAME_SIZE = 128
MASTER_SIZE = 512
POWERUP_IDS = (
    "siege-loader",
    "phase-jacket",
    "hunter-optics",
    "last-stand-stimulant",
    "emp-charge",
    "butchers-serum",
)


def clear_connected_black(image: Image.Image) -> Image.Image:
    """Make only the near-black region connected to the image edge transparent."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        red, green, blue, _ = pixels[x, y]
        if max(red, green, blue) > 36:
            continue
        pixels[x, y] = (red, green, blue, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    return rgba


def main() -> None:
    atlas = Image.new("RGBA", (FRAME_SIZE * len(POWERUP_IDS), FRAME_SIZE))
    for frame, powerup_id in enumerate(POWERUP_IDS):
        source = Image.open(ROOT / f"{powerup_id}-source-v1.png")
        master = clear_connected_black(source).resize(
            (MASTER_SIZE, MASTER_SIZE), Image.Resampling.LANCZOS
        )
        master.save(ROOT / f"{powerup_id}-master-v1-512.png", optimize=True)
        runtime = master.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)
        atlas.alpha_composite(runtime, (frame * FRAME_SIZE, 0))

    atlas.save(ROOT / "powerup-identity-atlas-v1-128.png", optimize=True)
    atlas.save(
        ROOT / "powerup-identity-atlas-v1-128.webp",
        format="WEBP",
        lossless=True,
        method=6,
    )


if __name__ == "__main__":
    main()
