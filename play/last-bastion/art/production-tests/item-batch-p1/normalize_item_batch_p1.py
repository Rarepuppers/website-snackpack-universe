"""Build deterministic Item Batch P1 powerup/status atlases and QA sheet."""
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def restore_opaque_core(name: str) -> None:
    source = Image.open(ROOT / f"{name}-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / f"{name}-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / f"{name}.png", optimize=True)


def normalize(name: str, columns: int, rows: int, size: int) -> Image.Image:
    source = Image.open(ROOT / f"{name}.png").convert("RGBA")
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for row in range(rows):
        for column in range(columns):
            cell = source.crop((
                round(column * source.width / columns), round(row * source.height / rows),
                round((column + 1) * source.width / columns), round((row + 1) * source.height / rows),
            ))
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
    restore_opaque_core("powerup-atlas-v1")
    restore_opaque_core("powerup-effects-v1")
    validate("powerup-atlas-v1")
    validate("powerup-effects-v1")
    atlas = normalize("powerup-atlas-v1", 4, 6, 384)
    effects = normalize("powerup-effects-v1", 4, 1, 384)
    normalize("powerup-atlas-v1", 4, 6, 128)
    normalize("powerup-atlas-v1", 4, 6, 96)
    normalize("powerup-atlas-v1", 4, 6, 64)
    normalize("powerup-atlas-v1", 4, 6, 48)
    normalize("powerup-atlas-v1", 4, 6, 36)
    normalize("powerup-effects-v1", 4, 1, 128)
    normalize("powerup-effects-v1", 4, 1, 64)
    normalize("powerup-effects-v1", 4, 1, 36)

    canvas = Image.new("RGBA", (1600, 1360), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "ITEM BATCH P1 - POWERUPS / STATUS MOTIFS / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "Rows: OVERCHARGE / AEGIS / ADRENALINE / MAGNET PULSE / MEDKIT / URANIUM-CORE ROUNDS", fill=(255, 202, 105, 255))
    draw.text((24, 72), "Columns: CANONICAL TILE / PICKUP IDLE / PICKUP BURST / ACTIVE STATUS", fill=(117, 224, 239, 255))
    canvas.alpha_composite(atlas.resize((768, 1152), NEAREST), (24, 105))
    canvas.alpha_composite(effects.resize((768, 192), NEAREST), (808, 475))
    draw.text((808, 400), "SHARED PICKUP / EXPIRATION EFFECTS", fill=(208, 162, 255, 255))
    draw.text((808, 695), "No timers, stacks, quantities, rarity, cooldown rings, or gameplay geometry baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "item-batch-p1-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for name in ("powerup-atlas-v1-128", "powerup-atlas-v1-96", "powerup-atlas-v1-64", "powerup-atlas-v1-48", "powerup-atlas-v1-36", "powerup-effects-v1-128", "powerup-effects-v1-64", "powerup-effects-v1-36"):
        copy2(ROOT / f"{name}.png", runtime_dir / f"{name}.png")
    print("Wrote Item Batch P1 masters, runtime derivatives, and contact sheet")


if __name__ == "__main__":
    main()
