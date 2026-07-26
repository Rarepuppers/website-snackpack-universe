"""Build deterministic Object Batch O3A interactable control atlas and QA sheet."""
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS = ROWS = 5


def restore_opaque_core() -> None:
    source = Image.open(ROOT / "small-interactables-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / "small-interactables-v1-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / "small-interactables-v1.png", optimize=True)


def cells(source: Image.Image):
    for row in range(ROWS):
        for column in range(COLUMNS):
            yield column, row, source.crop((
                round(column * source.width / COLUMNS),
                round(row * source.height / ROWS),
                round((column + 1) * source.width / COLUMNS),
                round((row + 1) * source.height / ROWS),
            ))


def normalize(size: int) -> Image.Image:
    source = Image.open(ROOT / "small-interactables-v1.png").convert("RGBA")
    output = Image.new("RGBA", (COLUMNS * size, ROWS * size), (0, 0, 0, 0))
    for column, row, cell in cells(source):
        output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"small-interactables-v1-{size}.png", optimize=True)
    return output


def validate() -> None:
    image = Image.open(ROOT / "small-interactables-v1.png").convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError("small-interactables-v1.png must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"non-transparent corner at {point}")


def main():
    restore_opaque_core()
    validate()
    master = normalize(384)
    normalize(128)

    canvas = Image.new("RGBA", (1600, 1150), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "WORLD OBJECT BATCH O3A - SMALL INTERACTABLES / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "Rows: CHEST / GATE BUTTON / CONTROL PANEL / TURRET CONSOLE / TRAP CONSOLE", fill=(255, 202, 105, 255))
    draw.text((24, 72), "Columns: IDLE / READY / ACTIVE / DISABLED / COMPLETED-OPENED", fill=(117, 224, 239, 255))
    canvas.alpha_composite(master.resize((1000, 1000), NEAREST), (24, 105))
    draw.text((1060, 110), "Physical state changes only", fill=(208, 162, 255, 255))
    draw.text((1060, 140), "No prompts, timing, ownership,", fill=(184, 202, 216, 255))
    draw.text((1060, 164), "collision, damage, rewards,", fill=(184, 202, 216, 255))
    draw.text((1060, 188), "or linked-system logic baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "object-batch-o3a-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    copy2(ROOT / "small-interactables-v1-128.png", runtime_dir / "small-interactables-v1-128.png")
    print("Wrote Object Batch O3A master, runtime atlas, and contact sheet")


if __name__ == "__main__":
    main()
