"""Emit deterministic Batch T runtime atlases and contact-sheet QA."""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def crop_grid(source_name: str, output_name: str, columns: int, rows: int, size: int, padding: int = 10, per_cell_scale: bool = False) -> Image.Image:
    source = Image.open(ROOT / source_name).convert("RGBA")
    subjects: list[Image.Image] = []
    for row in range(rows):
        for column in range(columns):
            bounds = (
                round(column * source.width / columns),
                round(row * source.height / rows),
                round((column + 1) * source.width / columns),
                round((row + 1) * source.height / rows),
            )
            cell = source.crop(bounds)
            alpha_bounds = cell.getchannel("A").getbbox()
            if alpha_bounds is None:
                raise ValueError(f"{source_name} cell {column},{row} is empty")
            subjects.append(cell.crop(alpha_bounds))
    uniform_scale = min(
        (size - padding * 2) / max(subject.width for subject in subjects),
        (size - padding * 2) / max(subject.height for subject in subjects),
    )
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for index, subject in enumerate(subjects):
        scale = min((size - padding * 2) / subject.width, (size - padding * 2) / subject.height) if per_cell_scale else uniform_scale
        width = max(1, round(subject.width * scale))
        height = max(1, round(subject.height * scale))
        resized = subject.resize((width, height), NEAREST)
        column = index % columns
        row = index // columns
        x = column * size + (size - width) // 2
        y = row * size + size - padding - height
        output.alpha_composite(resized, (x, y))
    output.save(ROOT / output_name, optimize=True)
    return output


def contact_sheet(sheets: list[tuple[str, Image.Image]]) -> None:
    canvas = Image.new("RGBA", (1280, 960), (16, 24, 34, 255))
    draw = ImageDraw.Draw(canvas)
    y = 18
    for label, sheet in sheets:
        draw.text((20, y), label, fill=(224, 239, 244, 255))
        y += 20
        available_height = 530 if "WEAVER" in label else 160
        scale = min(1240 / sheet.width, available_height / sheet.height)
        preview = sheet.resize((round(sheet.width * scale), round(sheet.height * scale)), NEAREST)
        canvas.alpha_composite(preview, ((1280 - preview.width) // 2, y))
        y += preview.height + 24
    canvas.convert("RGB").save(ROOT / "batch-t-contact-sheet.png", optimize=True)


def main() -> None:
    weaver = crop_grid("nest-weaver-spritesheet-v1.png", "nest-weaver-spritesheet-v1-192.png", 4, 8, 192, per_cell_scale=True)
    pod = crop_grid("nest-pod-spritesheet-v1.png", "nest-pod-spritesheet-v1-128.png", 6, 1, 128)
    effects = crop_grid("nest-effects-atlas-v1.png", "nest-effects-atlas-v1-128.png", 4, 2, 128)
    contact_sheet([("NEST WEAVER — 4 × 8 / 192 px", weaver), ("NEST POD — 6 × 1 / 128 px", pod), ("NEST EFFECTS — 4 × 2 / 128 px", effects)])
    print("Wrote Batch T runtime atlases and contact sheet")


if __name__ == "__main__":
    main()
