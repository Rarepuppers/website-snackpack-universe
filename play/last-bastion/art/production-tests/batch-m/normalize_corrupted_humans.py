"""Extract magenta-key masters and emit stable Batch M runtime atlases."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def extract_chroma(source_name: str, output_name: str) -> None:
    source = Image.open(ROOT / source_name).convert("RGB")
    pixels = source.load()
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    target = (255, 0, 255)
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue = pixels[x, y]
            distance = ((red - target[0]) ** 2 + (green - target[1]) ** 2 + (blue - target[2]) ** 2) ** 0.5
            magenta_like = green < 110 and red > 145 and blue > 145 and abs(red - blue) < 115
            alpha = 0 if magenta_like else max(0, min(255, round((distance - 58) * 5.2)))
            if alpha == 0:
                continue
            spill = min(1.0, alpha / 255.0)
            output.putpixel((x, y), (round(red * (1 - 0.12 * spill)), round(green * (1 - 0.06 * spill)), round(blue * (1 - 0.12 * spill)), alpha))
    output.save(ROOT / output_name, optimize=True)


def crop_grid(source_name: str, output_name: str, columns: int, rows: int, size: int) -> None:
    source = Image.open(ROOT / source_name).convert("RGBA")
    cells: list[Image.Image] = []
    for row in range(rows):
        for column in range(columns):
            left = round(column * source.width / columns)
            right = round((column + 1) * source.width / columns)
            top = round(row * source.height / rows)
            bottom = round((row + 1) * source.height / rows)
            cells.append(source.crop((left, top, right, bottom)))
    subjects: list[Image.Image] = []
    for index, cell in enumerate(cells):
        bounds = cell.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"{source_name} cell {index} contains no visible pixels")
        subjects.append(cell.crop(bounds))
    scale = min((size - 8) / max(subject.width for subject in subjects), (size - 8) / max(subject.height for subject in subjects))
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for index, subject in enumerate(subjects):
        width = max(1, round(subject.width * scale))
        height = max(1, round(subject.height * scale))
        resized = subject.resize((width, height), NEAREST)
        column = index % columns
        row = index // columns
        output.alpha_composite(resized, (column * size + (size - width) // 2, row * size + (size - height) // 2))
    output.save(ROOT / output_name, optimize=True)


def main() -> None:
    extract_chroma("corrupted-human-survivor-spritesheet-v1-chroma.png", "corrupted-human-survivor-spritesheet-v1.png")
    extract_chroma("corrupted-marine-spritesheet-v1-chroma.png", "corrupted-marine-spritesheet-v1.png")
    extract_chroma("abomination-spritesheet-v1-chroma.png", "abomination-spritesheet-v1.png")
    extract_chroma("corrupted-marine-effect-atlas-v1-chroma.png", "corrupted-marine-effect-atlas-v1.png")
    crop_grid("corrupted-human-survivor-spritesheet-v1.png", "corrupted-human-survivor-spritesheet-v1-96.png", 4, 2, 96)
    crop_grid("corrupted-marine-spritesheet-v1.png", "corrupted-marine-spritesheet-v1-96.png", 4, 3, 96)
    crop_grid("abomination-spritesheet-v1.png", "abomination-spritesheet-v1-128.png", 4, 3, 128)
    crop_grid("corrupted-marine-effect-atlas-v1.png", "corrupted-marine-effect-atlas-v1-64.png", 4, 2, 64)
    print("Wrote Batch M transparent masters and runtime atlases")


if __name__ == "__main__":
    main()
