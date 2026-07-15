"""Normalize approved Production Batch B masters into fixed Phaser assets."""

from pathlib import Path
from collections import deque
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


def alpha_art(region: Image.Image) -> Image.Image | None:
    box = region.getchannel("A").getbbox()
    return None if box is None else region.crop(box)


def keep_largest_component(region: Image.Image) -> Image.Image:
    """Discard neighboring-cell fragments while retaining the connected creature silhouette."""
    alpha = region.getchannel("A")
    width, height = region.size
    opaque = alpha.load()
    visited: set[tuple[int, int]] = set()
    largest: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            if opaque[x, y] < 20 or (x, y) in visited:
                continue
            component: list[tuple[int, int]] = []
            queue = deque([(x, y)])
            visited.add((x, y))
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and opaque[nx, ny] >= 20 and (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component
    if not largest:
        return region
    mask = Image.new("L", region.size)
    mask_pixels = mask.load()
    for x, y in largest:
        mask_pixels[x, y] = opaque[x, y]
    cleaned = region.copy()
    cleaned.putalpha(mask)
    return cleaned


def fitted_sheet(
    source: str,
    output: str,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
    padding: int,
    common_scale: bool = False,
    cell_inset_fraction: float = 0,
) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    frames: list[Image.Image | None] = []
    for row in range(rows):
        for column in range(columns):
            region = grid_region(image, column, row, columns, rows)
            inset_x = round(region.width * cell_inset_fraction)
            inset_y = round(region.height * cell_inset_fraction)
            if inset_x or inset_y:
                region = region.crop((inset_x, inset_y, region.width - inset_x, region.height - inset_y))
            if common_scale:
                region = keep_largest_component(region)
            frames.append(alpha_art(region))
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
        size = (max(1, round(art.width * scale)), max(1, round(art.height * scale)))
        art = art.resize(size, NEAREST)
        column, row = index % columns, index // columns
        x = column * frame_width + (frame_width - art.width) // 2
        y = row * frame_height + (frame_height - art.height) // 2
        atlas.alpha_composite(art, (x, y))
    atlas.save(ROOT / output)


def extract_images(source: str, outputs: list[str], frame_width: int, frame_height: int, padding: int) -> None:
    image = Image.open(ROOT / source).convert("RGBA")
    for column, output in enumerate(outputs):
        art = alpha_art(grid_region(image, column, 0, len(outputs), 1))
        if art is None:
            continue
        scale = min((frame_width - padding * 2) / art.width, (frame_height - padding * 2) / art.height)
        art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), NEAREST)
        canvas = Image.new("RGBA", (frame_width, frame_height))
        canvas.alpha_composite(art, ((frame_width - art.width) // 2, (frame_height - art.height) // 2))
        canvas.save(ROOT / output)


extract_images(
    "weapon-pair-v1.png",
    ["scattergun-gameplay-v1-64.png", "arc-carbine-gameplay-v1-64.png"],
    64,
    32,
    2,
)
fitted_sheet("slime-spitter-spritesheet-v1.png", "slime-spitter-spritesheet-v1-64.png", 4, 3, 64, 64, 3, True, 0.035)
fitted_sheet("carapace-scuttler-spritesheet-v1.png", "carapace-scuttler-spritesheet-v1-96.png", 4, 4, 96, 96, 4, True, 0.035)
fitted_sheet("siege-crusher-spritesheet-v1.png", "siege-crusher-spritesheet-v1-128.png", 4, 3, 128, 128, 5, True, 0.035)
fitted_sheet("batch-b-effect-atlas-v1.png", "batch-b-effect-atlas-v1-64.png", 5, 4, 64, 64, 3)
fitted_sheet("siege-crusher-portrait-v1.png", "siege-crusher-portrait-v1-128.png", 1, 1, 128, 128, 4)
