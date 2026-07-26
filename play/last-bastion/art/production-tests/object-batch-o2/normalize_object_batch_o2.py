"""Build deterministic Object Batch O2 hazard atlases and QA sheet."""
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
ATLASES = ("loop", "transitions")


def restore_opaque_core(kind: str) -> None:
    """Keep helper-despilled edges while restoring source colour in opaque pixels."""
    source = Image.open(ROOT / f"world-hazards-{kind}-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / f"world-hazards-{kind}-v1-alpha-extracted.png").convert("RGBA")
    output_path = ROOT / f"world-hazards-{kind}-v1.png"
    if source.size != extracted.size:
        raise ValueError(f"{kind} chroma and extracted sources must have the same dimensions")
    alpha = extracted.getchannel("A")
    rgb = Image.composite(source, extracted.convert("RGB"), alpha)
    restored = rgb.convert("RGBA")
    restored.putalpha(alpha)
    restored.save(output_path, optimize=True)


def cells(source: Image.Image):
    for row in range(4):
        for column in range(4):
            yield column, row, source.crop((
                round(column * source.width / 4),
                round(row * source.height / 4),
                round((column + 1) * source.width / 4),
                round((row + 1) * source.height / 4),
            ))


def normalize(kind: str, size: int) -> Image.Image:
    source = Image.open(ROOT / f"world-hazards-{kind}-v1.png").convert("RGBA")
    output = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    for column, row, cell in cells(source):
        output.alpha_composite(
            cell.resize((size, size), NEAREST),
            (column * size, row * size),
        )
    output.save(ROOT / f"world-hazards-{kind}-v1-{size}.png", optimize=True)
    return output


def validate_alpha(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError(f"{path.name} must contain both transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"{path.name} has a non-transparent corner at {point}")


def main():
    for kind in ATLASES:
        restore_opaque_core(kind)
        validate_alpha(ROOT / f"world-hazards-{kind}-v1.png")

    masters = {kind: normalize(kind, 384) for kind in ATLASES}
    for kind in ATLASES:
        normalize(kind, 128)

    canvas = Image.new("RGBA", (1600, 930), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "WORLD OBJECT BATCH O2 - PERSISTENT HAZARDS / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 44), "Rows: SLIME / TOXIC / FIRE / LAVA", fill=(255, 202, 105, 255))
    draw.text((24, 70), "LOOP PHASES - stable footprint, four internal animation phases", fill=(117, 224, 239, 255))
    canvas.alpha_composite(masters["loop"].resize((720, 720), NEAREST), (24, 96))
    draw.text((824, 70), "TRANSITIONS - fill / straight edge / convex quarter / concave corner", fill=(208, 162, 255, 255))
    canvas.alpha_composite(masters["transitions"].resize((720, 720), NEAREST), (824, 96))
    draw.text((24, 850), "Damage, slow, collision, radius, placement, safe lanes, timing, and telegraphs remain code-owned.", fill=(184, 202, 216, 255))
    draw.text((24, 876), "Retain chroma sources and clean-alpha sheets; runtime atlases are deterministic derivatives.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "object-batch-o2-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for kind in ATLASES:
        name = f"world-hazards-{kind}-v1-128.png"
        copy2(ROOT / name, runtime_dir / name)

    print("Wrote Object Batch O2 masters, runtime atlases, and contact sheet")


if __name__ == "__main__":
    main()
