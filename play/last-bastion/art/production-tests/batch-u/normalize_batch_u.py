"""Emit deterministic Batch U runtime atlases and contact-sheet QA."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST

def crop_grid(source_name, output_name, columns, rows, size, padding=10, per_cell_scale=False):
    source = Image.open(ROOT / source_name).convert("RGBA")
    subjects = []
    for row in range(rows):
        for column in range(columns):
            bounds = (round(column * source.width / columns), round(row * source.height / rows),
                      round((column + 1) * source.width / columns), round((row + 1) * source.height / rows))
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
    savant = crop_grid("storm-savant-v1.png", "storm-savant-v1-192.png", 4, 9, 192, per_cell_scale=True)
    node = crop_grid("storm-node-v1.png", "storm-node-v1-128.png", 6, 1, 128)
    effects = crop_grid("storm-effects-v1.png", "storm-effects-v1-128.png", 4, 2, 128)
    canvas = Image.new("RGBA", (1280, 1100), (16, 24, 34, 255))
    draw = ImageDraw.Draw(canvas)
    y = 18
    for label, sheet, height in [("STORM SAVANT - 4 x 9 / 192 px", savant, 650), ("STORM NODE - 6 x 1 / 128 px", node, 150), ("STORM EFFECTS - 4 x 2 / 128 px", effects, 190)]:
        draw.text((20, y), label, fill=(224, 239, 244, 255)); y += 20
        scale = min(1240 / sheet.width, height / sheet.height)
        preview = sheet.resize((round(sheet.width * scale), round(sheet.height * scale)), NEAREST)
        canvas.alpha_composite(preview, ((1280 - preview.width) // 2, y)); y += preview.height + 20
    canvas.convert("RGB").save(ROOT / "batch-u-contact-sheet.png", optimize=True)
    print("Wrote Batch U runtime atlases and contact sheet")

if __name__ == "__main__":
    main()
