"""Build deterministic three-part Batch AK follow-up atlases and QA sheet."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS, ROWS = 4, 2
PARTS = {
    "gate-states-v1": ("GATE STATES", "CLOSED row / OPEN row"),
    "debris-accents-v1": ("DEBRIS + COVER ACCENTS", "Eight compact prop silhouettes"),
    "lighting-accents-v1": ("LIGHTING ACCENTS", "Eight soft non-telegraphic light layers"),
}


def restore(name: str) -> None:
    source = Image.open(ROOT / f"{name}-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / f"{name}-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / f"{name}.png", optimize=True)


def normalize(name: str, size: int) -> Image.Image:
    source = Image.open(ROOT / f"{name}.png").convert("RGBA")
    output = Image.new("RGBA", (COLUMNS * size, ROWS * size), (0, 0, 0, 0))
    for row in range(ROWS):
        for column in range(COLUMNS):
            cell = source.crop((round(column * source.width / COLUMNS), round(row * source.height / ROWS), round((column + 1) * source.width / COLUMNS), round((row + 1) * source.height / ROWS)))
            output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"{name}-{size}.png", optimize=True)
    return output


def validate(name: str) -> None:
    image = Image.open(ROOT / f"{name}.png").convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError(f"{name} must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"{name}: non-transparent corner at {point}")


def main() -> None:
    for name in PARTS:
        restore(name)
        validate(name)
    masters = {name: normalize(name, 384) for name in PARTS}
    for name in PARTS:
        normalize(name, 256)
        normalize(name, 128)

    canvas = Image.new("RGBA", (1600, 1700), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AK FOLLOW-UP TRIO / THREE LARGE SUPPORT ATLASES / 4K PREFLIGHT", fill=(231, 240, 246, 255))
    y = 90
    for name, (title, subtitle) in PARTS.items():
        draw.text((24, y), f"{title} — {subtitle}", fill=(117, 224, 239, 255))
        canvas.alpha_composite(masters[name].resize((768, 384), NEAREST), (24, y + 28))
        y += 520
    draw.text((24, 1640), "Art-gated candidates: no collision, warnings, targets, timers, objective state, or gameplay values baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ak-followup-trio-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for name in PARTS:
        for size in (256, 128):
            copy2(ROOT / f"{name}-{size}.png", runtime_dir / f"{name}-{size}.png")
    print("Wrote Batch AK follow-up trio masters, runtime derivatives, and contact sheet")


if __name__ == "__main__":
    main()
