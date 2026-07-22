"""Emit deterministic Batch Z runtime atlases and contact-sheet QA."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def authored_rows(source, expected):
    alpha = source.getchannel("A")
    occupied = [alpha.crop((0, y, source.width, y + 1)).getbbox() is not None for y in range(source.height)]
    bounds, start = [], None
    for y, present in enumerate(occupied + [False]):
        if present and start is None: start = y
        elif not present and start is not None: bounds.append((start, y)); start = None
    if len(bounds) != expected: raise ValueError(f"expected {expected} authored rows, found {len(bounds)}")
    return bounds


def crop_grid(source_name, output_name, columns, rows, size, padding=12, detect_rows=True):
    source = Image.open(ROOT / source_name).convert("RGBA")
    row_bounds = authored_rows(source, rows) if detect_rows else []
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for row in range(rows):
        top, bottom = row_bounds[row] if detect_rows else (round(row * source.height / rows), round((row + 1) * source.height / rows))
        for column in range(columns):
            cell = source.crop((round(column * source.width / columns), top, round((column + 1) * source.width / columns), bottom))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None: raise ValueError(f"{source_name} cell {column},{row} is empty")
            subject = cell.crop(bounds)
            scale = min((size - padding * 2) / subject.width, (size - padding * 2) / subject.height)
            resized = subject.resize((max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), NEAREST)
            output.alpha_composite(resized, (column * size + (size - resized.width) // 2, row * size + size - padding - resized.height))
    output.save(ROOT / output_name, optimize=True)
    return output


def portrait():
    source = Image.open(ROOT / "synapse-herald-portrait-v1.png").convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if bounds is None: raise ValueError("portrait is empty")
    subject = source.crop(bounds)
    output = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    scale = min(236 / subject.width, 236 / subject.height)
    resized = subject.resize((round(subject.width * scale), round(subject.height * scale)), NEAREST)
    output.alpha_composite(resized, ((256 - resized.width) // 2, 256 - 8 - resized.height))
    output.save(ROOT / "synapse-herald-portrait-v1-256.png", optimize=True)
    return output


def main():
    body = crop_grid("synapse-herald-v1.png", "synapse-herald-v1-192.png", 4, 10, 192, detect_rows=False)
    effects = crop_grid("synapse-herald-effects-v1.png", "synapse-herald-effects-v1-128.png", 4, 2, 128, detect_rows=False)
    face = portrait()
    canvas = Image.new("RGBA", (1200, 1500), (16, 24, 34, 255)); draw = ImageDraw.Draw(canvas)
    draw.text((18, 16), "SYNAPSE HERALD - 4 x 10 / 192 px", fill=(224, 239, 244, 255))
    body_preview = body.resize((480, 1200), NEAREST); canvas.alpha_composite(body_preview, (130, 40))
    draw.text((660, 50), "EFFECTS - 4 x 2 / 128 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(effects, (660, 78))
    draw.text((790, 385), "PORTRAIT - 256 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(face, (760, 415))
    canvas.convert("RGB").save(ROOT / "batch-z-contact-sheet.png", optimize=True)
    print("Wrote Batch Z runtime assets and contact sheet")


if __name__ == "__main__": main()
