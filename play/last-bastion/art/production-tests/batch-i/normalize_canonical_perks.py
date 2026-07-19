"""Normalize the seven canonical Task 46 perk masters to the shared 128px tile contract."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "canonical-perk-tiles-v2-alpha-master.png"
OUTPUT = ROOT / "canonical-perk-tile-atlas-v2-128.png"
COLS, ROWS, SIZE, PAD = 4, 2, 128, 4


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    atlas = Image.new("RGBA", (COLS * SIZE, ROWS * SIZE))
    for row in range(ROWS):
        for column in range(COLS):
            left = round(column * source.width / COLS)
            top = round(row * source.height / ROWS)
            right = round((column + 1) * source.width / COLS)
            bottom = round((row + 1) * source.height / ROWS)
            cell = source.crop((left, top, right, bottom))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                if row * COLS + column != 7:
                    raise RuntimeError(f"Canonical perk frame {row * COLS + column} is empty")
                continue
            art = cell.crop(bounds)
            scale = min((SIZE - PAD * 2) / art.width, (SIZE - PAD * 2) / art.height)
            art = art.resize((
                max(1, round(art.width * scale)),
                max(1, round(art.height * scale)),
            ), Image.Resampling.LANCZOS)
            x = column * SIZE + (SIZE - art.width) // 2
            y = row * SIZE + (SIZE - art.height) // 2
            atlas.alpha_composite(art, (x, y))
    atlas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT.name}: {atlas.width}x{atlas.height}")


if __name__ == "__main__":
    main()
