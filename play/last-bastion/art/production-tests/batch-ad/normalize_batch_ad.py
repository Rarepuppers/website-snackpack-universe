"""Build deterministic Batch AD Science Wing atlases and contact-sheet QA."""
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def grid_cells(source: Image.Image, columns: int, rows: int):
    for row in range(rows):
        top = round(row * source.height / rows)
        bottom = round((row + 1) * source.height / rows)
        for column in range(columns):
            left = round(column * source.width / columns)
            right = round((column + 1) * source.width / columns)
            yield column, row, source.crop((left, top, right, bottom))


def opaque_grid(source_name: str, output_name: str, columns: int, rows: int, cell_size: int):
    source = Image.open(ROOT / source_name).convert("RGB")
    output = Image.new("RGB", (columns * cell_size, rows * cell_size))
    for column, row, cell in grid_cells(source, columns, rows):
        output.paste(cell.resize((cell_size, cell_size), NEAREST), (column * cell_size, row * cell_size))
    output.save(ROOT / output_name, optimize=True)
    return output.convert("RGBA")


def transparent_grid(
    source_name: str,
    output_name: str,
    columns: int,
    rows: int,
    cell_size: int,
    padding: int,
    preserve_cell: bool = False,
    bottom_align: bool = False,
):
    source = Image.open(ROOT / source_name).convert("RGBA")
    output = Image.new("RGBA", (columns * cell_size, rows * cell_size), (0, 0, 0, 0))
    for column, row, cell in grid_cells(source, columns, rows):
        if preserve_cell:
            subject = cell.resize((cell_size, cell_size), NEAREST)
            x = column * cell_size
            y = row * cell_size
        else:
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_name} cell {column},{row} is empty")
            subject = cell.crop(bounds)
            scale = min((cell_size - padding * 2) / subject.width, (cell_size - padding * 2) / subject.height)
            subject = subject.resize(
                (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
                NEAREST,
            )
            x = column * cell_size + (cell_size - subject.width) // 2
            if bottom_align:
                y = row * cell_size + cell_size - padding - subject.height
            else:
                y = row * cell_size + (cell_size - subject.height) // 2
        output.alpha_composite(subject, (x, y))
    output.save(ROOT / output_name, optimize=True)
    return output


def main():
    floor_master = opaque_grid("science-wing-floor-v1-source.png", "science-wing-floor-v1-256.png", 4, 4, 256)
    floor_runtime = opaque_grid("science-wing-floor-v1-source.png", "science-wing-floor-v1-128.png", 4, 4, 128)
    boundary_master = transparent_grid(
        "science-wing-boundary-v1.png", "science-wing-boundary-v1-256.png", 4, 2, 256, 0, preserve_cell=True
    )
    boundary_runtime = transparent_grid(
        "science-wing-boundary-v1.png", "science-wing-boundary-v1-128.png", 4, 2, 128, 0, preserve_cell=True
    )
    fixtures_master = transparent_grid(
        "science-wing-fixtures-v1.png", "science-wing-fixtures-v1-384.png", 4, 2, 384, 24, bottom_align=True
    )
    fixtures_runtime = transparent_grid(
        "science-wing-fixtures-v1.png", "science-wing-fixtures-v1-192.png", 4, 2, 192, 12, bottom_align=True
    )
    decals_master = transparent_grid(
        "science-wing-decals-v1.png", "science-wing-decals-v1-256.png", 4, 2, 256, 20
    )
    decals_runtime = transparent_grid(
        "science-wing-decals-v1.png", "science-wing-decals-v1-128.png", 4, 2, 128, 10
    )

    seam_mosaic = Image.new("RGB", (1024, 512), (0, 0, 0))
    base = floor_runtime.crop((0, 0, 128, 128)).convert("RGB")
    varied_frames = (0, 1, 2, 3, 1, 0, 3, 2, 2, 3, 0, 1, 3, 2, 1, 0)
    for row in range(4):
        for column in range(4):
            seam_mosaic.paste(base, (column * 128, row * 128))
            frame = varied_frames[row * 4 + column]
            source_x = (frame % 4) * 128
            source_y = (frame // 4) * 128
            tile = floor_runtime.crop((source_x, source_y, source_x + 128, source_y + 128)).convert("RGB")
            seam_mosaic.paste(tile, (512 + column * 128, row * 128))
    seam_mosaic.save(ROOT / "science-wing-seam-mosaic.png", optimize=True)

    canvas = Image.new("RGBA", (1600, 1360), (15, 22, 32, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 18), "BATCH AD - BASTION SCIENCE WING / 4K MASTER PREFLIGHT", fill=(231, 240, 246, 255))
    draw.text((24, 45), "FLOORS - 16 x 256 px retained master", fill=(117, 224, 239, 255))
    canvas.alpha_composite(floor_master.resize((800, 800), NEAREST), (24, 70))
    draw.text((850, 45), "BOUNDARIES - 8 x 256 px retained master", fill=(117, 224, 239, 255))
    canvas.alpha_composite(boundary_master.resize((720, 360), NEAREST), (850, 70))
    draw.text((850, 455), "FIXTURES - 8 x 384 px retained master", fill=(255, 202, 105, 255))
    canvas.alpha_composite(fixtures_master.resize((720, 360), NEAREST), (850, 480))
    draw.text((24, 900), "DECALS - 8 x 256 px retained master", fill=(208, 162, 255, 255))
    canvas.alpha_composite(decals_master.resize((800, 400), NEAREST), (24, 930))
    draw.text((850, 900), "Runtime: floors/boundaries/decals 128 px; fixtures 192 px", fill=(184, 202, 216, 255))
    draw.text((850, 930), "Code owns collision, interactions, hazards, glow, timing, room rules, and adjacency.", fill=(184, 202, 216, 255))
    draw.text((850, 970), "Floor identities: lab / cryo / surgery / bio / reactor / energy / control / teleporter.", fill=(184, 202, 216, 255))
    canvas.convert("RGB").save(ROOT / "batch-ad-contact-sheet.png", optimize=True)

    runtime_dir = ROOT.parents[2] / "game-assets"
    for name in (
        "science-wing-floor-v1-128.png",
        "science-wing-boundary-v1-128.png",
        "science-wing-fixtures-v1-192.png",
        "science-wing-decals-v1-128.png",
    ):
        Image.open(ROOT / name).save(runtime_dir / name, optimize=True)
    print("Wrote Batch AD masters, runtime atlases, and contact sheet")


if __name__ == "__main__":
    main()
