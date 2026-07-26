"""Build deterministic Object Batch O2B control-surface atlases and QA sheet."""
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
ATLASES = ("web-slow", "ice-fracture", "recovery-decals")


def restore_opaque_core(kind: str) -> None:
    source = Image.open(ROOT / f"{kind}-v1-chroma.png").convert("RGB")
    extracted = Image.open(ROOT / f"{kind}-v1-alpha-extracted.png").convert("RGBA")
    output = Image.composite(source, extracted.convert("RGB"), extracted.getchannel("A")).convert("RGBA")
    output.putalpha(extracted.getchannel("A"))
    output.save(ROOT / f"{kind}-v1.png", optimize=True)


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
    source = Image.open(ROOT / f"{kind}-v1.png").convert("RGBA")
    output = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    for column, row, cell in cells(source):
        output.alpha_composite(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / f"{kind}-v1-{size}.png", optimize=True)
    return output


def validate(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    if image.getchannel("A").getextrema() != (0, 255):
        raise ValueError(f"{path.name} must contain transparent and opaque pixels")
    for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        if image.getchannel("A").getpixel(point) != 0:
            raise ValueError(f"{path.name} corner {point} is not transparent")


def main():
    for kind in ATLASES:
        restore_opaque_core(kind)
        validate(ROOT / f"{kind}-v1.png")
    masters = {kind: normalize(kind, 384) for kind in ATLASES}
    for kind in ATLASES:
        normalize(kind, 128)

    canvas = Image.new("RGBA", (1600, 1400), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "WORLD OBJECT BATCH O2B - CONTROL SURFACES / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "Rows and columns remain asset-specific; all effects are non-colliding overlays", fill=(255, 202, 105, 255))
    positions = {"web-slow": (24, 80), "ice-fracture": (824, 80), "recovery-decals": (24, 580)}
    labels = {
        "web-slow": "WEB SLOW - fill / edge / convex / concave; four loop phases",
        "ice-fracture": "ICE FRACTURE - fresh / hairline / deep / settled; four progression phases",
        "recovery-decals": "RECOVERY DECALS - ember / lava / toxic / web; four fading phases",
    }
    for kind, master in masters.items():
        x, y = positions[kind]
        draw.text((x, y), labels[kind], fill=(117, 224, 239, 255) if kind != "recovery-decals" else (208, 162, 255, 255))
        canvas.alpha_composite(master.resize((720, 720), NEAREST), (x, y + 24))
    draw.text((824, 580), "Safe-edge masks remain code-native geometry, not raster art.", fill=(184, 202, 216, 255))
    draw.text((824, 610), "Collision, slow strength, placement, timing, and telegraphs remain code-owned.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "object-batch-o2b-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    for kind in ATLASES:
        name = f"{kind}-v1-128.png"
        copy2(ROOT / name, runtime_dir / name)
    print("Wrote Object Batch O2B masters, runtime atlases, and contact sheet")


if __name__ == "__main__":
    main()
