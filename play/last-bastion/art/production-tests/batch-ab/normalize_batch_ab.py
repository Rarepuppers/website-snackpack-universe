"""Emit deterministic Batch AB runtime atlases and contact-sheet QA."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def crop_grid(source_name, output_name, columns, rows, size, padding=12, row_edges=None):
    source = Image.open(ROOT / source_name).convert("RGBA")
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for row in range(rows):
        top = row_edges[row] if row_edges else round(row * source.height / rows)
        bottom = row_edges[row + 1] if row_edges else round((row + 1) * source.height / rows)
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
    source = Image.open(ROOT / "storm-regent-portrait-v1.png").convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("portrait is empty")
    subject = source.crop(bounds)
    output = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    scale = min(240 / subject.width, 240 / subject.height)
    resized = subject.resize((round(subject.width * scale), round(subject.height * scale)), NEAREST)
    output.alpha_composite(resized, ((256 - resized.width) // 2, (256 - resized.height) // 2))
    output.save(ROOT / "storm-regent-portrait-v1-256.png", optimize=True)
    return output


def main():
    # The retained body master uses an irregular authored cadence: the first
    # three tall crown poses are deeper than the compact recovery rows.
    body_rows = (0, 206, 394, 571, 716, 860, 1007, 1148, 1289, 1423, 1563, 1659)
    body = crop_grid(
        "storm-regent-v1.png",
        "storm-regent-v1-192.png",
        4,
        11,
        192,
        row_edges=body_rows,
    )
    node = crop_grid(
        "storm-conductive-node-v1.png",
        "storm-conductive-node-v1-128.png",
        6,
        1,
        128,
        padding=9,
    )
    effects = crop_grid(
        "storm-regent-effects-v1.png",
        "storm-regent-effects-v1-128.png",
        4,
        2,
        128,
    )
    face = portrait()

    canvas = Image.new("RGBA", (1400, 1800), (16, 24, 34, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((18, 16), "STORM REGENT - 4 x 11 / 192 px", fill=(224, 239, 244, 255))
    body_preview = body.resize((528, 1452), NEAREST)
    canvas.alpha_composite(body_preview, (80, 44))
    draw.text((660, 44), "CONDUCTIVE NODE - 6 x 1 / 128 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(node, (620, 70))
    draw.text((660, 230), "LOCAL EFFECTS - 4 x 2 / 128 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(effects, (730, 258))
    draw.text((820, 570), "PORTRAIT - 256 px", fill=(224, 239, 244, 255))
    canvas.alpha_composite(face, (800, 600))
    canvas.convert("RGB").save(ROOT / "batch-ab-contact-sheet.png", optimize=True)
    print("Wrote Batch AB runtime assets and contact sheet")


if __name__ == "__main__":
    main()
