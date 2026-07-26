"""Build deterministic held-weapon body/effects atlases and QA sheet."""
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
COLUMNS, ROWS = 4, 6
ROWS_TEXT = "RAILSPIKE / SEEKER SWARM / CRYO LANCE / TESLA COIL / FLAMETHROWER / SAWBLADE"


def restore_opaque_core(kind: str) -> None:
    source = Image.open(ROOT / f"held-weapons-{kind}-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / f"held-weapons-{kind}-v1-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / f"held-weapons-{kind}-v1.png", optimize=True)


def normalize(kind: str, size: int) -> Image.Image:
    source = Image.open(ROOT / f"held-weapons-{kind}-v1.png").convert("RGBA")
    output = Image.new("RGBA", (COLUMNS * size, ROWS * size), (0, 0, 0, 0))
    for row in range(ROWS):
        for column in range(COLUMNS):
            cell = source.crop((
                round(column * source.width / COLUMNS),
                round(row * source.height / ROWS),
                round((column + 1) * source.width / COLUMNS),
                round((row + 1) * source.height / ROWS),
            ))
            output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"held-weapons-{kind}-v1-{size}.png", optimize=True)
    return output


def validate(kind: str) -> None:
    image = Image.open(ROOT / f"held-weapons-{kind}-v1.png").convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError(f"held-weapons-{kind}-v1.png must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"{kind}: non-transparent corner at {point}")


def main() -> None:
    for kind in ("body", "effects"):
        restore_opaque_core(kind)
        validate(kind)
    body = normalize("body", 384)
    effects = normalize("effects", 384)
    normalize("body", 128)
    normalize("effects", 128)

    canvas = Image.new("RGBA", (1600, 1220), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "HELD WEAPONS BATCH H1 - BODY + EFFECTS / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), f"Rows: {ROWS_TEXT}", fill=(255, 202, 105, 255))
    draw.text((24, 72), "Columns: ONSET / TRAVEL-ACTIVE / RESULT / RECOVERY", fill=(117, 224, 239, 255))
    canvas.alpha_composite(body.resize((640, 960), NEAREST), (24, 105))
    canvas.alpha_composite(effects.resize((640, 960), NEAREST), (760, 105))
    draw.text((24, 1080), "BODY ATLAS", fill=(208, 162, 255, 255))
    draw.text((760, 1080), "EFFECTS ATLAS", fill=(208, 162, 255, 255))
    draw.text((24, 1110), "Candidate art only; no gameplay geometry, radii, reticles, or damage values baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "held-weapons-batch-h1-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for kind in ("body", "effects"):
        copy2(ROOT / f"held-weapons-{kind}-v1-128.png", runtime_dir / f"held-weapons-{kind}-v1-128.png")
    print("Wrote Held Weapons Batch H1 masters, runtime atlases, and contact sheet")


if __name__ == "__main__":
    main()
