"""Build deterministic Batch AK vista/backdrop atlas and QA sheet."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS, ROWS = 4, 2


def restore_opaque_core() -> None:
    source = Image.open(ROOT / "boss-arena-vistas-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / "boss-arena-vistas-v1-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / "boss-arena-vistas-v1.png", optimize=True)


def normalize(width: int, height: int) -> Image.Image:
    source = Image.open(ROOT / "boss-arena-vistas-v1.png").convert("RGBA")
    output = Image.new("RGBA", (COLUMNS * width, ROWS * height), (0, 0, 0, 0))
    for row in range(ROWS):
        for column in range(COLUMNS):
            cell = source.crop((round(column * source.width / COLUMNS), round(row * source.height / ROWS), round((column + 1) * source.width / COLUMNS), round((row + 1) * source.height / ROWS)))
            output.alpha_composite(cell.resize((width, height), NEAREST), (column * width, row * height))
    output.save(ROOT / f"boss-arena-vistas-v1-{width}x{height}.png", optimize=True)
    return output


def validate() -> None:
    image = Image.open(ROOT / "boss-arena-vistas-v1.png").convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError("boss-arena-vistas-v1 must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"non-transparent corner at {point}")


def main() -> None:
    restore_opaque_core()
    validate()
    master = normalize(512, 384)
    normalize(256, 192)
    normalize(128, 96)
    canvas = Image.new("RGBA", (1600, 840), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AK - ARENA VISTAS / BACKDROP PLATES / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "Cells: COLOSSEUM / REACTOR / HIVE / FOUNDRY / MILITARY / VOID / STARGATE / BASTION DECK", fill=(255, 202, 105, 255))
    draw.text((24, 72), "Non-playable background plates; lower half stays quiet for actors and code telegraphs.", fill=(117, 224, 239, 255))
    canvas.alpha_composite(master.resize((1152, 432), NEAREST), (24, 105))
    draw.text((24, 590), "No collision, target markers, warning geometry, timers, or gameplay values baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ak-vistas-contact-sheet.png", optimize=True)
    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for width, height in ((256, 192), (128, 96)):
        copy2(ROOT / f"boss-arena-vistas-v1-{width}x{height}.png", runtime_dir / f"boss-arena-vistas-v1-{width}x{height}.png")
    print("Wrote Batch AK vista master, runtime derivatives, and contact sheet")


if __name__ == "__main__":
    main()
