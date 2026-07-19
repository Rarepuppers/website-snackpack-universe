"""Normalize retained Batch P chroma masters into transparent Phaser atlases."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent
MAGENTA = (255, 0, 255)
LANCZOS = Image.Resampling.LANCZOS


def extract_chroma(name: str) -> Image.Image:
    image = Image.open(ROOT / name).convert("RGBA")
    pixels = []
    for red, green, blue, _ in image.getdata():
        # Generated chroma backgrounds include compression-like magenta grain.
        # The Medic family has no purple materials, so remove the whole narrow
        # magenta hue band rather than only exact #ff00ff pixels.
        chroma_hue = red > 75 and blue > 75 and green < 105 and abs(red - blue) < 90
        pixels.append((red, green, blue, 0 if chroma_hue else 255))
    image.putdata(pixels)
    return image


def region(image: Image.Image, column: int, row: int, columns: int, rows: int) -> Image.Image:
    return image.crop((
        round(column * image.width / columns), round(row * image.height / rows),
        round((column + 1) * image.width / columns), round((row + 1) * image.height / rows),
    ))


def save_alpha_master(source: str, output: str) -> Image.Image:
    image = extract_chroma(source)
    image.save(ROOT / output, optimize=True)
    return image


def body_and_overlay() -> None:
    body = save_alpha_master("medic-base-spritesheet-v1-chroma-master.png", "medic-base-spritesheet-v1-alpha-master.png")
    helmet = save_alpha_master("medic-helmet-overlay-v1-chroma-master.png", "medic-helmet-overlay-v1-alpha-master.png")
    body_atlas = Image.new("RGBA", (384, 480))
    helmet_atlas = Image.new("RGBA", (384, 480))
    # The generator respected the 4x5 order but used taller first/fourth poses.
    # These cuts sit in the actual inter-row gaps and avoid amputating boots.
    y_bounds = [0, 290, 555, 760, 1025, body.height]
    helmet_y_bounds = [0, 260, 490, 720, 960, helmet.height]
    x_bounds = [round(column * body.width / 4) for column in range(5)]
    helmet_centres = [
        [(48, 14), (48, 14), (48, 15), (48, 15)],
        [(43, 17), (48, 15), (50, 18), (46, 18)],
        [(31, 31), (57, 31), (55, 31), (42, 31)],
        [(43, 19), (44, 19), (43, 19), (52, 19)],
        [(27, 54), (59, 59), (53, 55), (43, 52)],
    ]
    for row in range(5):
        for column in range(4):
            box = (x_bounds[column], y_bounds[row], x_bounds[column + 1], y_bounds[row + 1])
            body_cell = body.crop(box)
            helmet_box = (
                x_bounds[column], helmet_y_bounds[row],
                x_bounds[column + 1], helmet_y_bounds[row + 1],
            )
            helmet_cell = helmet.crop(helmet_box)
            bounds = body_cell.getchannel("A").getbbox()
            if bounds is None:
                raise RuntimeError(f"Empty Medic body frame {row * 4 + column}")
            subject = body_cell.crop(bounds)
            scale = min(88 / subject.width, 88 / subject.height)
            target_size = (max(1, round(body_cell.width * scale)), max(1, round(body_cell.height * scale)))
            scaled_body = body_cell.resize(target_size, LANCZOS)
            scaled_bounds = tuple(round(value * scale) for value in bounds)
            subject_width = scaled_bounds[2] - scaled_bounds[0]
            subject_height = scaled_bounds[3] - scaled_bounds[1]
            target_x = column * 96 + (96 - subject_width) // 2 - scaled_bounds[0]
            target_y = row * 96 + 92 - subject_height - scaled_bounds[1]
            body_atlas.alpha_composite(scaled_body, (target_x, target_y))
            helmet_bounds = helmet_cell.getchannel("A").getbbox()
            if helmet_bounds is None:
                raise RuntimeError(f"Empty Medic helmet frame {row * 4 + column}")
            helmet_art = helmet_cell.crop(helmet_bounds)
            helmet_scale = min(28 / helmet_art.width, 24 / helmet_art.height)
            helmet_art = helmet_art.resize((
                max(1, round(helmet_art.width * helmet_scale)),
                max(1, round(helmet_art.height * helmet_scale)),
            ), LANCZOS)
            centre_x, centre_y = helmet_centres[row][column]
            helmet_atlas.alpha_composite(helmet_art, (
                column * 96 + centre_x - helmet_art.width // 2,
                row * 96 + centre_y - helmet_art.height // 2,
            ))
    body_atlas.save(ROOT / "medic-base-spritesheet-v1-96.png", optimize=True)
    helmet_atlas.save(ROOT / "medic-helmet-overlay-v1-96.png", optimize=True)
    composite = Image.alpha_composite(body_atlas, helmet_atlas)
    composite.save(ROOT / "medic-composite-preview-v1-96.png", optimize=True)


def fitted_atlas(source: str, alpha_master: str, output: str, columns: int, rows: int, size: int, padding: int) -> None:
    image = save_alpha_master(source, alpha_master)
    atlas = Image.new("RGBA", (columns * size, rows * size))
    for row in range(rows):
        for column in range(columns):
            cell = region(image, column, row, columns, rows)
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise RuntimeError(f"Empty frame {row * columns + column} in {source}")
            art = cell.crop(bounds)
            scale = min((size - padding * 2) / art.width, (size - padding * 2) / art.height)
            art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), LANCZOS)
            x = column * size + (size - art.width) // 2
            y = row * size + (size - art.height) // 2
            atlas.alpha_composite(art, (x, y))
    atlas.save(ROOT / output, optimize=True)


def main() -> None:
    body_and_overlay()
    fitted_atlas(
        "injector-carbine-spritesheet-v1-chroma-master.png",
        "injector-carbine-spritesheet-v1-alpha-master.png",
        "injector-carbine-spritesheet-v1-96.png", 4, 1, 96, 4,
    )
    fitted_atlas(
        "injector-carbine-effect-atlas-v1-chroma-master.png",
        "injector-carbine-effect-atlas-v1-alpha-master.png",
        "injector-carbine-effect-atlas-v1-64.png", 4, 2, 64, 3,
    )
    fitted_atlas(
        "medic-portrait-v1-chroma-master.png",
        "medic-portrait-v1-alpha-master.png",
        "medic-portrait-v1-128.png", 1, 1, 128, 2,
    )


if __name__ == "__main__":
    main()
