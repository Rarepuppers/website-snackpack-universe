from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT.parents[2] / "game-assets"
PARTS = {"thermal-climate-v1": "THERMAL / CLIMATE CONTROL", "learning-education-v1": "LEARNING / EDUCATION", "personal-quarters-v1": "PERSONAL / QUARTERS"}

def restore(name):
    im = Image.open(ROOT / f"{name}-alpha-extracted.png").convert("RGBA")
    for p in ((0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)): im.putpixel(p, (0, 0, 0, 0))
    return im

def normalize(src, size):
    cw, ch = src.width // 2, src.height // 2
    out = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    for r in range(2):
        for c in range(2):
            cell = src.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)).resize((size, size), Image.Resampling.LANCZOS)
            out.alpha_composite(cell, (c * size, r * size))
    return out

def validate(name, im):
    assert im.getchannel("A").getextrema() == (0, 255), f"{name}: alpha extrema"
    for p in ((0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)): assert im.getpixel(p)[3] == 0, f"{name}: corner"
    for r in range(2):
        for c in range(2): assert im.crop((c * im.width // 2, r * im.height // 2, (c + 1) * im.width // 2, (r + 1) * im.height // 2)).getchannel("A").getbbox(), f"{name}: empty cell"

def contact_sheet(masters):
    sheet = Image.new("RGB", (1200, 3500), (18, 22, 28)); draw = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("segoeui.ttf", 34); small = ImageFont.truetype("segoeui.ttf", 22)
    except OSError: font = small = ImageFont.load_default()
    draw.text((48, 36), "OBJECT BATCH O29 / THERMAL CLIMATE + LEARNING EDUCATION + PERSONAL QUARTERS / 4K PREFLIGHT", fill=(240, 244, 248), font=font)
    y = 110
    for name, im in masters.items():
        draw.text((48, y), PARTS[name], fill=(160, 206, 220), font=font); thumb = im.resize((1000, 1000), Image.Resampling.NEAREST); sheet.paste(thumb, (100, y + 58), thumb); y += 1110
    draw.text((48, 3440), "Thermal-climate, learning-education, and personal-quarters candidates; no interaction, collision, hazards, targets, telegraphs, or gameplay values baked in.", fill=(178, 186, 196), font=small)
    return sheet

def main():
    masters = {}
    for name in PARTS:
        src = restore(name); validate(name, src); master = normalize(src, 384); validate(name, master); masters[name] = master; master.save(ROOT / f"{name}-384.png")
        for size in (256, 128):
            run = normalize(src, size); validate(name, run); run.save(ROOT / f"{name}-{size}.png"); RUNTIME.mkdir(parents=True, exist_ok=True); run.save(RUNTIME / f"{name}-{size}.png")
    contact_sheet(masters).save(ROOT / "object-batch-o29-contact-sheet.jpg", quality=95, optimize=True)

if __name__ == "__main__": main()
