"""Build deterministic three-part Batch AK macro material atlases."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
PARTS = {
    "industrial-macro-v1": "INDUSTRIAL / REACTOR / FOUNDRY",
    "hive-void-macro-v1": "HIVE / VOID",
    "military-colosseum-macro-v1": "MILITARY / COLOSSEUM",
}
COLUMNS, ROWS = 2, 2


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
    canvas = Image.new("RGBA", (1200, 2150), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AK MACRO MATERIAL TRIO / 4K PREFLIGHT", fill=(231, 240, 246, 255))
    y = 70
    for name, label in PARTS.items():
        draw.text((24, y), label, fill=(117, 224, 239, 255))
        canvas.alpha_composite(masters[name].resize((768, 768), NEAREST), (24, y + 28))
        y += 450
    draw.text((24, 2070), "Tileable material candidates; no props, telegraphs, collision, targets, or gameplay values baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ak-macro-trio-contact-sheet.png", optimize=True)
    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for name in PARTS:
        for size in (256, 128):
            copy2(ROOT / f"{name}-{size}.png", runtime_dir / f"{name}-{size}.png")
    print("Wrote Batch AK macro material trio masters and runtime derivatives")


if __name__ == "__main__":
    main()
