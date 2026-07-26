"""Build deterministic Batch AK decal atlas and QA sheet."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS, ROWS = 4, 2


def restore_opaque_core() -> None:
    source = Image.open(ROOT / "boss-arena-decals-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / "boss-arena-decals-v1-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / "boss-arena-decals-v1.png", optimize=True)


def normalize(size: int) -> Image.Image:
    source = Image.open(ROOT / "boss-arena-decals-v1.png").convert("RGBA")
    output = Image.new("RGBA", (COLUMNS * size, ROWS * size), (0, 0, 0, 0))
    for row in range(ROWS):
        for column in range(COLUMNS):
            cell = source.crop((round(column * source.width / COLUMNS), round(row * source.height / ROWS), round((column + 1) * source.width / COLUMNS), round((row + 1) * source.height / ROWS)))
            output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"boss-arena-decals-v1-{size}.png", optimize=True)
    return output


def validate() -> None:
    image = Image.open(ROOT / "boss-arena-decals-v1.png").convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError("boss-arena-decals-v1 must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"non-transparent corner at {point}")


def main() -> None:
    restore_opaque_core()
    validate()
    master = normalize(256)
    normalize(128)
    normalize(64)
    canvas = Image.new("RGBA", (1200, 720), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AK - LOW-CONTRAST ARENA DECALS / 4K PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "Cells: OIL SCUFF / STONE SCORING / COOLANT STAIN / HIVE RESIDUE / VOID DUST / FOUNDRY SOOT / MILITARY SCRAPE / RUBBLE ABRASION", fill=(255, 202, 105, 255))
    draw.text((24, 72), "Transparent compositing underlays only; no warnings, targets, hazards, or collision geometry.", fill=(117, 224, 239, 255))
    canvas.alpha_composite(master.resize((768, 384), NEAREST), (24, 105))
    draw.text((24, 540), "Must remain lower contrast than actors, projectiles, pickups, and code-owned telegraphs.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ak-decals-contact-sheet.png", optimize=True)
    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for size in (128, 64):
        copy2(ROOT / f"boss-arena-decals-v1-{size}.png", runtime_dir / f"boss-arena-decals-v1-{size}.png")
    print("Wrote Batch AK decal master, runtime derivatives, and contact sheet")


if __name__ == "__main__":
    main()
