from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT.parents[2] / "game-assets"
PARTS = {
    "fabrication-safety-v1": "FABRICATION / SAFETY",
    "habitat-commons-v1": "HABITAT / COMMONS",
    "communications-infrastructure-v1": "COMMUNICATIONS / INFRASTRUCTURE",
}


def restore(name: str) -> Image.Image:
    src = Image.open(ROOT / f"{name}-alpha-extracted.png").convert("RGBA")
    # Keep the atlas contract stable: four isolated cells, no baked green corners.
    for xy in ((0, 0), (src.width - 1, 0), (0, src.height - 1), (src.width - 1, src.height - 1)):
        src.putpixel(xy, (0, 0, 0, 0))
    return src


def normalize(src: Image.Image, size: int) -> Image.Image:
    cell_w, cell_h = src.width // 2, src.height // 2
    out = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    for row in range(2):
        for col in range(2):
            cell = src.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
            cell = cell.resize((size, size), Image.Resampling.LANCZOS)
            out.alpha_composite(cell, (col * size, row * size))
    return out


def validate(name: str, image: Image.Image) -> None:
    alpha = image.getchannel("A")
    assert alpha.getextrema() == (0, 255), f"{name}: alpha extrema {alpha.getextrema()}"
    for xy in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        assert image.getpixel(xy)[3] == 0, f"{name}: corner {xy} not transparent"
    w, h = image.size
    for row in range(2):
        for col in range(2):
            box = (col * w // 2, row * h // 2, (col + 1) * w // 2, (row + 1) * h // 2)
            assert image.crop(box).getchannel("A").getbbox(), f"{name}: empty cell {row},{col}"


def contact_sheet(masters: dict[str, Image.Image]) -> Image.Image:
    sheet = Image.new("RGB", (1200, 3500), (18, 22, 28))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("segoeui.ttf", 34)
        small = ImageFont.truetype("segoeui.ttf", 22)
    except OSError:
        font = small = ImageFont.load_default()
    draw.text((48, 36), "OBJECT BATCH O26 / FABRICATION SAFETY + HABITAT COMMONS + COMMS INFRA / 4K PREFLIGHT", fill=(240, 244, 248), font=font)
    y = 110
    for name, image in masters.items():
        draw.text((48, y), PARTS[name], fill=(160, 206, 220), font=font)
        thumb = image.resize((1000, 1000), Image.Resampling.NEAREST)
        sheet.paste(thumb, (100, y + 58), thumb)
        y += 1110
    draw.text((48, 3440), "Fabrication-safety, habitat, and communications-infrastructure candidates; no interaction, collision, hazards, targets, telegraphs, or gameplay values baked in.", fill=(178, 186, 196), font=small)
    return sheet


def main() -> None:
    masters = {}
    for name in PARTS:
        source = restore(name)
        validate(name, source)
        master = normalize(source, 384)
        validate(name, master)
        masters[name] = master
        master.save(ROOT / f"{name}-384.png")
        for size in (256, 128):
            runtime = normalize(source, size)
            validate(name, runtime)
            runtime.save(ROOT / f"{name}-{size}.png")
            RUNTIME.mkdir(parents=True, exist_ok=True)
            runtime.save(RUNTIME / f"{name}-{size}.png")
    contact_sheet(masters).save(ROOT / "object-batch-o26-contact-sheet.jpg", quality=95, optimize=True)


if __name__ == "__main__":
    main()
