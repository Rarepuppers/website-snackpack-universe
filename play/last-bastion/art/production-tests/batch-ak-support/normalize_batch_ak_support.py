"""Build deterministic Batch AK modular boundary/fixture atlases and QA sheet."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS, ROWS = 4, 2


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
    for name in ("arena-boundary-v1", "arena-fixtures-v1"):
        restore(name)
        validate(name)
    boundary = normalize("arena-boundary-v1", 384)
    fixtures = normalize("arena-fixtures-v1", 384)
    for name in ("arena-boundary-v1", "arena-fixtures-v1"):
        normalize(name, 256)
        normalize(name, 192)
        normalize(name, 128)
    canvas = Image.new("RGBA", (1600, 1150), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AK SUPPORT - MODULAR BOUNDARIES + COVER FIXTURES / 4K PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "BOUNDARY: NORTH / SOUTH / WEST / EAST / INNER CORNER / OUTER CORNER / GATE / BREACH", fill=(255, 202, 105, 255))
    draw.text((24, 72), "FIXTURES: PILLAR / CRATE CLUSTER / GENERATOR / CONSOLE / STAIRS / RUBBLE / HIVE GROWTH / VOID OBELISK", fill=(117, 224, 239, 255))
    canvas.alpha_composite(boundary.resize((768, 768), NEAREST), (24, 105))
    canvas.alpha_composite(fixtures.resize((768, 768), NEAREST), (808, 105))
    draw.text((24, 905), "BOUNDARIES", fill=(208, 162, 255, 255))
    draw.text((808, 905), "FIXTURES / COVER", fill=(208, 162, 255, 255))
    draw.text((24, 950), "Candidate support art only; collision, cover, safe lanes, anchors, warnings, and interaction remain code-owned.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ak-support-contact-sheet.png", optimize=True)
    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for name in ("arena-boundary-v1", "arena-fixtures-v1"):
        for size in (256, 192, 128):
            copy2(ROOT / f"{name}-{size}.png", runtime_dir / f"{name}-{size}.png")
    print("Wrote Batch AK support masters, runtime derivatives, and contact sheet")


if __name__ == "__main__":
    main()
