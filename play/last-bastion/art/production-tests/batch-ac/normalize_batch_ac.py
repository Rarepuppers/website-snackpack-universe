"""Emit deterministic Batch AC runtime atlases and contact-sheet QA."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def crop_grid(source_name, output_name, columns, rows, size, padding=12, row_ranges=None):
    source = Image.open(ROOT / source_name).convert("RGBA")
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for row in range(rows):
        if row_ranges:
            top, bottom = row_ranges[row]
        else:
            top = round(row * source.height / rows)
            bottom = round((row + 1) * source.height / rows)
        for column in range(columns):
            left = round(column * source.width / columns)
            right = round((column + 1) * source.width / columns)
            cell = source.crop((left, top, right, bottom))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_name} cell {column},{row} is empty")
            subject = cell.crop(bounds)
            scale = min((size - padding * 2) / subject.width, (size - padding * 2) / subject.height)
            resized = subject.resize(
                (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
                NEAREST,
            )
            x = column * size + (size - resized.width) // 2
            y = row * size + size - padding - resized.height
            output.alpha_composite(resized, (x, y))
    output.save(ROOT / output_name, optimize=True)
    return output


def portrait():
    source = Image.open(ROOT / "abomination-prime-portrait-v1.png").convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("portrait is empty")
    subject = source.crop(bounds)
    output = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    scale = min(240 / subject.width, 240 / subject.height)
    resized = subject.resize((round(subject.width * scale), round(subject.height * scale)), NEAREST)
    output.alpha_composite(resized, ((256 - resized.width) // 2, (256 - resized.height) // 2))
    output.save(ROOT / "abomination-prime-portrait-v1-256.png", optimize=True)
    return output


def main():
    # The accepted generator source contains one redundant late hurt/recovery
    # band. Keep the first twelve ordered contract rows, skip 1901..2061, and
    # retain the final collapsed defeat band as contract row thirteen.
    body_ranges = (
        (0, 179), (179, 331), (331, 490), (490, 652), (652, 809),
        (809, 966), (966, 1119), (1119, 1277), (1277, 1421),
        (1421, 1581), (1581, 1734), (1734, 1901), (2061, 2172),
    )
    body = crop_grid(
        "abomination-prime-v1.png",
        "abomination-prime-v1-192.png",
        4,
        13,
        192,
        row_ranges=body_ranges,
    )
    biomass = crop_grid(
        "abomination-prime-biomass-v1.png",
        "abomination-prime-biomass-v1-128.png",
        4,
        2,
        128,
        padding=10,
    )
    effects = crop_grid(
        "abomination-prime-effects-v1.png",
        "abomination-prime-effects-v1-128.png",
        4,
        2,
        128,
    )
    face = portrait()

    canvas = Image.new("RGBA", (1400, 2000), (16, 24, 34, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((18, 16), "ABOMINATION PRIME - 4 x 13 / 192 px", fill=(224, 239, 244, 255))
    body_preview = body.resize((528, 1716), NEAREST)
    canvas.alpha_composite(body_preview, (80, 44))
    draw.text((660, 44), "BIOMASS - 4 x 2 / 128 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(biomass, (730, 70))
    draw.text((660, 360), "LOCAL EFFECTS - 4 x 2 / 128 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(effects, (730, 388))
    draw.text((820, 700), "PORTRAIT - 256 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(face, (800, 730))
    canvas.convert("RGB").save(ROOT / "batch-ac-contact-sheet.png", optimize=True)
    print("Wrote Batch AC runtime assets and contact sheet")


if __name__ == "__main__":
    main()
