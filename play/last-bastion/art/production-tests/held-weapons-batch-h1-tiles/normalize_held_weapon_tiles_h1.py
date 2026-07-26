"""Build deterministic canonical held-weapon tile atlas and QA sheet."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS, ROWS = 3, 2


def restore_opaque_core() -> None:
    source = Image.open(ROOT / "held-weapon-tiles-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / "held-weapon-tiles-v1-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / "held-weapon-tiles-v1.png", optimize=True)


def normalize(size: int) -> Image.Image:
    source = Image.open(ROOT / "held-weapon-tiles-v1.png").convert("RGBA")
    output = Image.new("RGBA", (COLUMNS * size, ROWS * size), (0, 0, 0, 0))
    for row in range(ROWS):
        for column in range(COLUMNS):
            cell = source.crop((round(column * source.width / COLUMNS), round(row * source.height / ROWS), round((column + 1) * source.width / COLUMNS), round((row + 1) * source.height / ROWS)))
            output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"held-weapon-tiles-v1-{size}.png", optimize=True)
    return output


def validate() -> None:
    image = Image.open(ROOT / "held-weapon-tiles-v1.png").convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError("held-weapon-tiles-v1 must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"non-transparent corner at {point}")


def main() -> None:
    restore_opaque_core()
    validate()
    master = normalize(384)
    normalize(128)
    normalize(96)
    normalize(64)
    normalize(48)
    normalize(36)
    canvas = Image.new("RGBA", (1600, 900), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "HELD WEAPONS H1 - CANONICAL TILE ATLAS / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "Cells: RAILSPIKE / SEEKER SWARM / CRYO LANCE / TESLA COIL / FLAMETHROWER / SAWBLADE", fill=(255, 202, 105, 255))
    draw.text((24, 72), "Single source for Codex, shop, loadout, status, and HUD surfaces; no frames or overlays baked in.", fill=(117, 224, 239, 255))
    canvas.alpha_composite(master.resize((1152, 768), NEAREST), (24, 105))
    draw.text((24, 850), "Candidate tile art only; rarity, cooldown, timers, quantities, and selection remain code-owned.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "held-weapon-tiles-h1-contact-sheet.png", optimize=True)
    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for size in (128, 96, 64, 48, 36):
        copy2(ROOT / f"held-weapon-tiles-v1-{size}.png", runtime_dir / f"held-weapon-tiles-v1-{size}.png")
    print("Wrote Held Weapon Tile H1 master, runtime derivatives, and contact sheet")


if __name__ == "__main__":
    main()
