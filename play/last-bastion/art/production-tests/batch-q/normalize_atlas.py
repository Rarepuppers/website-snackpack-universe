"""Normalize the retained 3x2 Quartermaster master to six 128x256 runtime cells."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "quartermaster-atlas-v1-alpha-master.png"
OUTPUT = ROOT / "quartermaster-atlas-v1-384x512.png"
COLS, ROWS = 3, 2
CELL_W, CELL_H = 128, 256
PAD_X, PAD_TOP, PAD_BOTTOM = 6, 10, 8


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    source_cell_w = source.width // COLS
    source_cell_h = source.height // ROWS
    atlas = Image.new("RGBA", (COLS * CELL_W, ROWS * CELL_H), (0, 0, 0, 0))

    for row in range(ROWS):
        for col in range(COLS):
            frame = source.crop((
                col * source_cell_w,
                row * source_cell_h,
                (col + 1) * source_cell_w,
                (row + 1) * source_cell_h,
            ))
            alpha = frame.getchannel("A")
            bounds = alpha.getbbox()
            if bounds is None:
                raise RuntimeError(f"Frame {row * COLS + col} is empty")
            subject = frame.crop(bounds)
            scale = min(
                (CELL_W - PAD_X * 2) / subject.width,
                (CELL_H - PAD_TOP - PAD_BOTTOM) / subject.height,
            )
            size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
            subject = subject.resize(size, Image.Resampling.LANCZOS)
            x = col * CELL_W + (CELL_W - subject.width) // 2
            y = row * CELL_H + CELL_H - PAD_BOTTOM - subject.height
            atlas.alpha_composite(subject, (x, y))

    atlas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT.name}: {atlas.width}x{atlas.height}")


if __name__ == "__main__":
    main()
