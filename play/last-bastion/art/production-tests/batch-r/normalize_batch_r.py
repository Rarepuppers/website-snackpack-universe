from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def extract_grid(source_name: str, columns: int, rows: int, cell_size: int, output_name: str) -> Image.Image:
    source = Image.open(ROOT / source_name).convert("RGBA")
    atlas = Image.new("RGBA", (columns * cell_size, rows * cell_size), (0, 0, 0, 0))
    for row in range(rows):
        for column in range(columns):
            left = round(column * source.width / columns)
            right = round((column + 1) * source.width / columns)
            top = round(row * source.height / rows)
            bottom = round((row + 1) * source.height / rows)
            cell = source.crop((left, top, right, bottom))
            alpha_box = cell.getchannel("A").getbbox()
            if alpha_box is None:
                raise RuntimeError(f"Empty source cell at row {row}, column {column}")
            subject = cell.crop(alpha_box)
            padding = 8 if cell_size >= 128 else 5
            scale = min((cell_size - padding * 2) / subject.width, (cell_size - padding * 2) / subject.height)
            target = subject.resize(
                (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
                NEAREST,
            )
            x = column * cell_size + (cell_size - target.width) // 2
            y = row * cell_size + cell_size - padding - target.height
            atlas.alpha_composite(target, (x, y))
    atlas.save(ROOT / output_name)
    return atlas


def retained_4x(runtime: Image.Image, output_name: str) -> None:
    runtime.resize((runtime.width * 4, runtime.height * 4), NEAREST).save(ROOT / output_name)


def contact_sheet(terrain: Image.Image, effects: Image.Image) -> None:
    scale = 0.72
    width = 960
    height = 760
    sheet = Image.new("RGBA", (width, height), (12, 19, 29, 255))
    terrain_preview = terrain.resize((round(terrain.width * scale), round(terrain.height * scale)), NEAREST)
    effects_preview = effects.resize((effects.width, effects.height), NEAREST)
    sheet.alpha_composite(terrain_preview, (42, 48))
    sheet.alpha_composite(effects_preview, (530, 110))
    draw = ImageDraw.Draw(sheet)
    draw.text((42, 18), "BATCH R TERRAIN — intact / damaged / critical / destroyed", fill=(232, 226, 212, 255))
    draw.text((530, 82), "MATERIAL IMPACTS", fill=(104, 228, 232, 255))
    sheet.save(ROOT / "batch-r-contact-sheet.png")


def main() -> None:
    terrain = extract_grid(
        "destructible-terrain-v1-alpha-master.png", 4, 7, 128, "destructible-terrain-v1-128.png"
    )
    effects = extract_grid(
        "destructible-terrain-effects-v1-alpha-master.png", 4, 2, 64,
        "destructible-terrain-effects-v1-64.png",
    )
    retained_4x(terrain, "destructible-terrain-v1-alpha-master-4x.png")
    retained_4x(effects, "destructible-terrain-effects-v1-alpha-master-4x.png")
    contact_sheet(terrain, effects)


if __name__ == "__main__":
    main()
