from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "art" / "production-tests" / "legacy-enemy-refresh"


def normalize(name: str, columns: int, rows: int) -> None:
    source = Image.open(ROOT / f"{name}-v2-alpha.png").convert("RGBA")
    cell_size = 256
    output = Image.new("RGBA", (columns * cell_size, rows * cell_size), (0, 0, 0, 0))
    for row in range(rows):
        for column in range(columns):
            left = round(column * source.width / columns)
            top = round(row * source.height / rows)
            right = round((column + 1) * source.width / columns)
            bottom = round((row + 1) * source.height / rows)
            cell = source.crop((left, top, right, bottom))
            bbox = cell.getchannel("A").getbbox()
            if bbox is None:
                continue
            cell = cell.crop(bbox)
            scale = min((cell_size - 20) / cell.width, (cell_size - 20) / cell.height)
            cell = cell.resize((max(1, round(cell.width * scale)), max(1, round(cell.height * scale))), Image.Resampling.LANCZOS)
            output.alpha_composite(cell, (column * cell_size + (cell_size - cell.width) // 2, row * cell_size + (cell_size - cell.height) // 2))
    output.save(ROOT / f"{name}-v2-256.png", optimize=True)


normalize("scuttler-spritesheet", 4, 2)
normalize("egg-cluster-spritesheet", 4, 1)
normalize("brain-blob-states", 4, 1)
