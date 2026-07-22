"""Emit deterministic Batch V runtime atlases and contact-sheet QA."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST

def crop_grid(source_name, output_name, columns, rows, size, padding=10, per_cell_scale=False, detected_rows=False):
    source = Image.open(ROOT / source_name).convert("RGBA")
    row_bounds = []
    if detected_rows:
        alpha = source.getchannel("A")
        occupied = [alpha.crop((0, y, source.width, y + 1)).getbbox() is not None for y in range(source.height)]
        start = None
        for y, present in enumerate(occupied + [False]):
            if present and start is None:
                start = y
            elif not present and start is not None:
                row_bounds.append((start, y))
                start = None
        if len(row_bounds) != rows:
            raise ValueError(f"{source_name} expected {rows} authored rows, found {len(row_bounds)}")
    subjects = []
    for row in range(rows):
        for column in range(columns):
            top, bottom = row_bounds[row] if detected_rows else (round(row * source.height / rows), round((row + 1) * source.height / rows))
            bounds = (round(column * source.width / columns), top,
                      round((column + 1) * source.width / columns), bottom)
            cell = source.crop(bounds)
            alpha_bounds = cell.getchannel("A").getbbox()
            if alpha_bounds is None:
                raise ValueError(f"{source_name} cell {column},{row} is empty")
            subjects.append(cell.crop(alpha_bounds))
    uniform = min((size - padding * 2) / max(x.width for x in subjects),
                  (size - padding * 2) / max(x.height for x in subjects))
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for index, subject in enumerate(subjects):
        scale = min((size - padding * 2) / subject.width, (size - padding * 2) / subject.height) if per_cell_scale else uniform
        resized = subject.resize((max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), NEAREST)
        column, row = index % columns, index // columns
        output.alpha_composite(resized, (column * size + (size - resized.width) // 2, row * size + size - padding - resized.height))
    output.save(ROOT / output_name, optimize=True)
    return output

def main():
    body = crop_grid("machine-scrap-skitterer-v1.png", "machine-scrap-skitterer-v1-128.png", 4, 8, 128, per_cell_scale=True, detected_rows=True)
    effects = crop_grid("machine-scrap-skitterer-effects-v1.png", "machine-scrap-skitterer-effects-v1-128.png", 4, 2, 128)
    canvas = Image.new("RGBA", (1100, 1000), (16, 24, 34, 255))
    draw = ImageDraw.Draw(canvas)
    y = 18
    for label, sheet, height in [("SCRAP SKITTERER - 4 x 8 / 128 px", body, 730), ("SKITTERER EFFECTS - 4 x 2 / 128 px", effects, 190)]:
        draw.text((20, y), label, fill=(224, 239, 244, 255)); y += 20
        scale = min(1060 / sheet.width, height / sheet.height)
        preview = sheet.resize((round(sheet.width * scale), round(sheet.height * scale)), NEAREST)
        canvas.alpha_composite(preview, ((1100 - preview.width) // 2, y)); y += preview.height + 20
    canvas.convert("RGB").save(ROOT / "batch-v-contact-sheet.png", optimize=True)
    print("Wrote Batch V runtime atlases and contact sheet")

if __name__ == "__main__":
    main()
