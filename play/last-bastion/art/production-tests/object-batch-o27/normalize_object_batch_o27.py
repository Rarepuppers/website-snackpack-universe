from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT.parents[2] / "game-assets"
PARTS = {
    "civic-market-v1": "CIVIC / MARKET",
    "memorial-cultural-v1": "MEMORIAL / CULTURAL",
    "surface-salvage-v1": "SURFACE / SALVAGE",
}

def restore(name):
    image = Image.open(ROOT / f"{name}-alpha-extracted.png").convert("RGBA")
    for xy in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        image.putpixel(xy, (0, 0, 0, 0))
    return image

def normalize(source, size):
    cell_w, cell_h = source.width // 2, source.height // 2
    out = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    for row in range(2):
        for col in range(2):
            cell = source.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
            out.alpha_composite(cell.resize((size, size), Image.Resampling.LANCZOS), (col * size, row * size))
    return out

def validate(name, image):
    assert image.getchannel("A").getextrema() == (0, 255), f"{name}: alpha extrema"
    for xy in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
        assert image.getpixel(xy)[3] == 0, f"{name}: corner not transparent"
    for row in range(2):
        for col in range(2):
            box = (col * image.width // 2, row * image.height // 2, (col + 1) * image.width // 2, (row + 1) * image.height // 2)
            assert image.crop(box).getchannel("A").getbbox(), f"{name}: empty cell {row},{col}"

def contact_sheet(masters):
    sheet = Image.new("RGB", (1200, 3500), (18, 22, 28))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("segoeui.ttf", 34)
        small = ImageFont.truetype("segoeui.ttf", 22)
    except OSError:
        font = small = ImageFont.load_default()
    draw.text((48, 36), "OBJECT BATCH O27 / CIVIC MARKET + MEMORIAL CULTURAL + SURFACE SALVAGE / 4K PREFLIGHT", fill=(240, 244, 248), font=font)
    y = 110
    for name, image in masters.items():
        draw.text((48, y), PARTS[name], fill=(160, 206, 220), font=font)
        thumb = image.resize((1000, 1000), Image.Resampling.NEAREST)
        sheet.paste(thumb, (100, y + 58), thumb)
        y += 1110
    draw.text((48, 3440), "Civic-market, memorial-cultural, and surface-salvage candidates; no interaction, collision, hazards, targets, telegraphs, or gameplay values baked in.", fill=(178, 186, 196), font=small)
    return sheet

def main():
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
    contact_sheet(masters).save(ROOT / "object-batch-o27-contact-sheet.jpg", quality=95, optimize=True)

if __name__ == "__main__":
    main()
