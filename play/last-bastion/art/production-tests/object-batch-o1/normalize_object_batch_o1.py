"""Build deterministic Object Batch O1 damage-state atlases and QA sheet."""
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
FAMILIES = ("military", "natural", "organic")


def cells(source: Image.Image):
    for row in range(4):
        for column in range(4):
            yield column, row, source.crop((
                round(column * source.width / 4),
                round(row * source.height / 4),
                round((column + 1) * source.width / 4),
                round((row + 1) * source.height / 4),
            ))


def normalize(family: str, size: int) -> Image.Image:
    source = Image.open(ROOT / f"world-objects-{family}-v1.png").convert("RGBA")
    output = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    for column, row, cell in cells(source):
        output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"world-objects-{family}-v1-{size}.png", optimize=True)
    return output


def main():
    masters = {family: normalize(family, 384) for family in FAMILIES}
    for family in FAMILIES:
        normalize(family, 192)

    canvas = Image.new("RGBA", (1600, 1580), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "WORLD OBJECT BATCH O1 - STRUCTURAL DESTRUCTIBLES / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 44), "Columns: INTACT / DAMAGED / CRITICAL / DESTROYED", fill=(255, 202, 105, 255))
    labels = {
        "military": "MILITARY - wall / weapon rack / equipment locker / reinforced gate",
        "natural": "NATURAL - boulder / earth mound / tree / ice block",
        "organic": "ORGANIC - overgrowth / web mass / biomass node / alien crystal",
    }
    for index, family in enumerate(FAMILIES):
        y = 78 + index * 500
        draw.text((24, y), labels[family], fill=((117, 224, 239, 255) if index < 2 else (208, 162, 255, 255)))
        canvas.alpha_composite(masters[family].resize((1440, 450), NEAREST), (24, y + 24))
    draw.text((24, 1542), "Health, collision, debris clearance, drops, navigation, and hazard effects remain code-owned.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "object-batch-o1-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    for family in FAMILIES:
        name = f"world-objects-{family}-v1-192.png"
        Image.open(ROOT / name).save(runtime_dir / name, optimize=True)
    print("Wrote Object Batch O1 masters, runtime atlases, and contact sheet")


if __name__ == "__main__":
    main()
