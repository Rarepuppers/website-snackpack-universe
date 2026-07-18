"""Deterministic Task N2 runtime normalization from retained transparent masters."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def load_rgba(name: str) -> Image.Image:
    return Image.open(ROOT / name).convert("RGBA")


def normalize_grid(source_name: str, columns: int, rows: int, cell_size: int, output_name: str) -> Image.Image:
    source = load_rgba(source_name)
    source_cell_width = source.width // columns
    source_cell_height = source.height // rows
    atlas = Image.new("RGBA", (columns * cell_size, rows * cell_size), (0, 0, 0, 0))
    for row in range(rows):
        for column in range(columns):
            cell = source.crop((
                column * source_cell_width,
                row * source_cell_height,
                (column + 1) * source_cell_width,
                (row + 1) * source_cell_height,
            )).resize((cell_size, cell_size), NEAREST)
            atlas.alpha_composite(cell, (column * cell_size, row * cell_size))
    atlas.save(ROOT / output_name, optimize=True)
    return atlas


offer_atlas = normalize_grid(
    "scrap-shop-offer-tiles-v1.png", 3, 2, 128, "scrap-shop-offer-tile-atlas-v1-128.png"
)
hud_atlas = normalize_grid(
    "scrap-shop-hud-v1.png", 2, 2, 128, "scrap-shop-hud-atlas-v1-128.png"
)

offer_names = [
    "field-repair", "uranium-core-kit", "armour-retrofit",
    "upgrade-calibration", "weapon-requisition", "sold-locked",
]
for frame, name in enumerate(offer_names):
    column, row = frame % 3, frame // 3
    offer_atlas.crop((column * 128, row * 128, (column + 1) * 128, (row + 1) * 128)).save(
        ROOT / f"{name}-tile-v1-128.png", optimize=True
    )

panel = load_rgba("scrap-shop-panel-v1.png").resize((1024, 576), NEAREST)
panel.save(ROOT / "scrap-shop-panel-v1-1024x576.png", optimize=True)

print("Wrote 6-frame 128 px offer atlas, 4-frame 128 px HUD atlas, six individual tiles, and 1024x576 panel")
