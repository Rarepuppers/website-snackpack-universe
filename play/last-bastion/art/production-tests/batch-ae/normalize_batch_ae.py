"""Build deterministic Batch AE Bastion Logistics atlases and QA sheets."""
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
PREFIX = "bastion-logistics"


def cells(source: Image.Image, columns: int, rows: int):
    for row in range(rows):
        for column in range(columns):
            box = (
                round(column * source.width / columns),
                round(row * source.height / rows),
                round((column + 1) * source.width / columns),
                round((row + 1) * source.height / rows),
            )
            yield column, row, source.crop(box)


def opaque(source_name: str, output_name: str, columns: int, rows: int, size: int):
    source = Image.open(ROOT / source_name).convert("RGB")
    output = Image.new("RGB", (columns * size, rows * size))
    for column, row, cell in cells(source, columns, rows):
        output.paste(cell.resize((size, size), NEAREST), (column * size, row * size))
    output.save(ROOT / output_name, optimize=True)
    return output.convert("RGBA")


def alpha(
    source_name: str,
    output_name: str,
    columns: int,
    rows: int,
    size: int,
    padding: int,
    preserve_cell: bool = False,
    bottom_align: bool = False,
):
    source = Image.open(ROOT / source_name).convert("RGBA")
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for column, row, cell in cells(source, columns, rows):
        if preserve_cell:
            subject = cell.resize((size, size), NEAREST)
            x, y = column * size, row * size
        else:
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"empty cell {column},{row} in {source_name}")
            subject = cell.crop(bounds)
            scale = min((size - padding * 2) / subject.width, (size - padding * 2) / subject.height)
            subject = subject.resize((round(subject.width * scale), round(subject.height * scale)), NEAREST)
            x = column * size + (size - subject.width) // 2
            y = row * size + (size - subject.height) // 2
            if bottom_align:
                y = row * size + size - padding - subject.height
        output.alpha_composite(subject, (x, y))
    output.save(ROOT / output_name, optimize=True)
    return output


def main():
    floor_master = opaque(f"{PREFIX}-floor-v1-source.png", f"{PREFIX}-floor-v1-256.png", 4, 4, 256)
    floor_runtime = opaque(f"{PREFIX}-floor-v1-source.png", f"{PREFIX}-floor-v1-128.png", 4, 4, 128)
    boundary_master = alpha(f"{PREFIX}-boundary-v1.png", f"{PREFIX}-boundary-v1-256.png", 4, 2, 256, 0, True)
    boundary_runtime = alpha(f"{PREFIX}-boundary-v1.png", f"{PREFIX}-boundary-v1-128.png", 4, 2, 128, 0, True)
    fixtures_master = alpha(f"{PREFIX}-fixtures-v1.png", f"{PREFIX}-fixtures-v1-384.png", 4, 2, 384, 24, bottom_align=True)
    fixtures_runtime = alpha(f"{PREFIX}-fixtures-v1.png", f"{PREFIX}-fixtures-v1-192.png", 4, 2, 192, 12, bottom_align=True)
    decals_master = alpha(f"{PREFIX}-decals-v1.png", f"{PREFIX}-decals-v1-256.png", 4, 2, 256, 20)
    decals_runtime = alpha(f"{PREFIX}-decals-v1.png", f"{PREFIX}-decals-v1-128.png", 4, 2, 128, 10)

    seam = Image.new("RGB", (1024, 512))
    base = floor_runtime.crop((0, 0, 128, 128)).convert("RGB")
    order = (0, 1, 2, 3, 1, 0, 3, 2, 2, 3, 0, 1, 3, 2, 1, 0)
    for row in range(4):
        for column in range(4):
            seam.paste(base, (column * 128, row * 128))
            frame = order[row * 4 + column]
            x, y = (frame % 4) * 128, (frame // 4) * 128
            seam.paste(floor_runtime.crop((x, y, x + 128, y + 128)), (512 + column * 128, row * 128))
    seam.save(ROOT / f"{PREFIX}-seam-mosaic.png", optimize=True)

    canvas = Image.new("RGBA", (1600, 1360), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AE - BASTION LOGISTICS AND DEFENCE / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "FLOORS - 16 x 256 px", fill=(255, 202, 105, 255))
    canvas.alpha_composite(floor_master.resize((800, 800), NEAREST), (24, 70))
    draw.text((850, 45), "BOUNDARIES - 8 x 256 px", fill=(255, 202, 105, 255))
    canvas.alpha_composite(boundary_master.resize((720, 360), NEAREST), (850, 70))
    draw.text((850, 455), "FIXTURES - 8 x 384 px", fill=(117, 224, 239, 255))
    canvas.alpha_composite(fixtures_master.resize((720, 360), NEAREST), (850, 480))
    draw.text((24, 900), "DECALS - 8 x 256 px", fill=(208, 162, 255, 255))
    canvas.alpha_composite(decals_master.resize((800, 400), NEAREST), (24, 930))
    draw.text((850, 900), "Supply / armoury / shop / forge / medic / command / loading / bunker", fill=(184, 202, 216, 255))
    draw.text((850, 930), "Collision, interaction, cover, inventory, shops, healing, and objectives remain code-owned.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ae-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    for name in (
        f"{PREFIX}-floor-v1-128.png",
        f"{PREFIX}-boundary-v1-128.png",
        f"{PREFIX}-fixtures-v1-192.png",
        f"{PREFIX}-decals-v1-128.png",
    ):
        Image.open(ROOT / name).save(runtime_dir / name, optimize=True)
    print("Wrote Batch AE masters, runtime atlases, seam mosaic, and contact sheet")


if __name__ == "__main__":
    main()
