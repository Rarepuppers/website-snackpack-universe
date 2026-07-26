"""Build deterministic Object Batch O9 observation and research atlases."""
from pathlib import Path
from shutil import copy2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
PARTS = {
    "security-observation-v1": "SECURITY / OBSERVATION",
    "research-lab-v1": "RESEARCH LAB",
    "environment-identity-v1": "ENVIRONMENT IDENTITY",
}


def restore(name: str) -> None:
    source = Image.open(ROOT / f"{name}-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / f"{name}-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / f"{name}.png", optimize=True)


def normalize(name: str, size: int) -> Image.Image:
    source = Image.open(ROOT / f"{name}.png").convert("RGBA")
    output = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    for row in range(2):
        for column in range(2):
            cell = source.crop((round(column * source.width / 2), round(row * source.height / 2), round((column + 1) * source.width / 2), round((row + 1) * source.height / 2)))
            output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"{name}-{size}.png", optimize=True)
    return output


def validate(name: str) -> None:
    alpha = Image.open(ROOT / f"{name}.png").convert("RGBA").getchannel("A")
    if alpha.getextrema() != (0, 255):
        raise ValueError(f"{name} must contain transparent and opaque pixels")
    for point in ((0, 0), (alpha.width - 1, 0), (0, alpha.height - 1), (alpha.width - 1, alpha.height - 1)):
        if alpha.getpixel(point) != 0:
            raise ValueError(f"{name}: non-transparent corner at {point}")
    for row in range(2):
        for column in range(2):
            cell = alpha.crop((column * alpha.width // 2, row * alpha.height // 2, (column + 1) * alpha.width // 2, (row + 1) * alpha.height // 2))
            if cell.getbbox() is None:
                raise ValueError(f"{name}: empty atlas cell {row},{column}")


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
    draw.text((24, 18), "OBJECT BATCH O9 / OBSERVATION + RESEARCH / 4K PREFLIGHT", fill=(231, 240, 246, 255))
    y = 70
    for name, label in PARTS.items():
        draw.text((24, y), label, fill=(117, 224, 239, 255))
        canvas.alpha_composite(masters[name].resize((768, 768), NEAREST), (24, y + 28))
        y += 450
    draw.text((24, 2070), "Observation and research candidates; no interaction, collision, targets, telegraphs, or gameplay values baked in.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "object-batch-o9-contact-sheet.png", optimize=True)
    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for name in PARTS:
        for size in (256, 128):
            copy2(ROOT / f"{name}-{size}.png", runtime_dir / f"{name}-{size}.png")
    print("Wrote Object Batch O9 masters and runtime derivatives")


if __name__ == "__main__":
    main()
