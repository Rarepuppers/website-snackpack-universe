"""Emit deterministic Batch X runtime atlases and contact-sheet QA."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def authored_rows(source: Image.Image, expected: int) -> list[tuple[int, int]]:
    alpha = source.getchannel("A")
    occupied = [alpha.crop((0, y, source.width, y + 1)).getbbox() is not None for y in range(source.height)]
    bounds: list[tuple[int, int]] = []
    start = None
    for y, present in enumerate(occupied + [False]):
        if present and start is None:
            start = y
        elif not present and start is not None:
            bounds.append((start, y))
            start = None
    if len(bounds) != expected:
        raise ValueError(f"expected {expected} authored rows, found {len(bounds)}")
    return bounds


def crop_grid(source_name: str, output_name: str, columns: int, rows: int, size: int,
              padding: int = 12, detect_rows: bool = False) -> Image.Image:
    source = Image.open(ROOT / source_name).convert("RGBA")
    row_bounds = authored_rows(source, rows) if detect_rows else []
    subjects: list[Image.Image] = []
    for row in range(rows):
        top, bottom = row_bounds[row] if detect_rows else (
            round(row * source.height / rows), round((row + 1) * source.height / rows)
        )
        for column in range(columns):
            cell = source.crop((
                round(column * source.width / columns), top,
                round((column + 1) * source.width / columns), bottom,
            ))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_name} cell {column},{row} is empty")
            subjects.append(cell.crop(bounds))

    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for index, subject in enumerate(subjects):
        scale = min((size - padding * 2) / subject.width, (size - padding * 2) / subject.height)
        resized = subject.resize(
            (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), NEAREST
        )
        column, row = index % columns, index // columns
        output.alpha_composite(
            resized,
            (column * size + (size - resized.width) // 2, row * size + size - padding - resized.height),
        )
    output.save(ROOT / output_name, optimize=True)
    return output


def main() -> None:
    body = crop_grid(
        "machine-cyborg-reclaimer-v1.png", "machine-cyborg-reclaimer-v1-192.png",
        4, 9, 192, detect_rows=True,
    )
    effects = crop_grid(
        "machine-cyborg-reclaimer-effects-v1.png", "machine-cyborg-reclaimer-effects-v1-128.png",
        4, 2, 128,
    )
    canvas = Image.new("RGBA", (1200, 1320), (16, 24, 34, 255))
    draw = ImageDraw.Draw(canvas)
    y = 18
    for label, sheet, height in [
        ("CYBORG RECLAIMER - 4 x 9 / 192 px", body, 1020),
        ("CYBORG RECLAIMER EFFECTS - 4 x 2 / 128 px", effects, 210),
    ]:
        draw.text((20, y), label, fill=(224, 239, 244, 255))
        y += 22
        scale = min(1160 / sheet.width, height / sheet.height)
        preview = sheet.resize((round(sheet.width * scale), round(sheet.height * scale)), NEAREST)
        canvas.alpha_composite(preview, ((1200 - preview.width) // 2, y))
        y += preview.height + 22
    canvas.convert("RGB").save(ROOT / "batch-x-contact-sheet.png", optimize=True)
    print("Wrote Batch X runtime atlases and contact sheet")


if __name__ == "__main__":
    main()
