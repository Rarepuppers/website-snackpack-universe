from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "art" / "production-tests" / "telegraph-refresh"
SOURCE = Image.open(ROOT / "telegraph-small-atlas-v2-alpha.png").convert("RGBA")
CELL = 256
OUTPUT = Image.new("RGBA", (CELL * 4, CELL * 3), (0, 0, 0, 0))

for row in range(3):
    for column in range(4):
        box = (
            round(column * SOURCE.width / 4),
            round(row * SOURCE.height / 3),
            round((column + 1) * SOURCE.width / 4),
            round((row + 1) * SOURCE.height / 3),
        )
        frame = SOURCE.crop(box)
        bbox = frame.getchannel("A").getbbox()
        if bbox is None:
            continue
        frame = frame.crop(bbox)
        scale = min((CELL - 24) / frame.width, (CELL - 24) / frame.height)
        frame = frame.resize((max(1, round(frame.width * scale)), max(1, round(frame.height * scale))), Image.Resampling.LANCZOS)
        OUTPUT.alpha_composite(frame, (column * CELL + (CELL - frame.width) // 2, row * CELL + (CELL - frame.height) // 2))

OUTPUT.save(ROOT / "telegraph-small-atlas-v2-256.png", optimize=True)
