"""Extract toxic-bloom magenta-key masters and emit fixed runtime atlases."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def extract(source_name: str, output_name: str) -> None:
    source = Image.open(ROOT / source_name).convert("RGB")
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    target = (255, 0, 255)
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue = source.getpixel((x, y))
            distance = ((red - target[0]) ** 2 + (green - target[1]) ** 2 + (blue - target[2]) ** 2) ** 0.5
            magenta_like = green < 110 and red > 145 and blue > 145 and abs(red - blue) < 115
            alpha = 0 if magenta_like else max(0, min(255, round((distance - 58) * 5.2)))
            if alpha:
                output.putpixel((x, y), (red, green, blue, alpha))
    output.save(ROOT / output_name, optimize=True)


def grid(source_name: str, output_name: str, columns: int, rows: int, size: int, padding: int = 0) -> None:
    source = Image.open(ROOT / source_name).convert("RGBA")
    output = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for row in range(rows):
        for column in range(columns):
            left = round(source.width * column / columns)
            right = round(source.width * (column + 1) / columns)
            top = round(source.height * row / rows)
            bottom = round(source.height * (row + 1) / rows)
            cell = source.crop((left, top, right, bottom))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_name} cell {column},{row} contains no visible pixels")
            subject = cell.crop(bounds)
            target = size - padding * 2
            scale = min(target / subject.width, target / subject.height)
            resized = subject.resize((max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), NEAREST)
            output.alpha_composite(resized, (column * size + (size - resized.width) // 2, row * size + (size - resized.height) // 2))
    output.save(ROOT / output_name, optimize=True)


def main() -> None:
    pairs = [
        ("toxic-bloom-floor-atlas-v1-chroma.png", "toxic-bloom-floor-atlas-v1.png"),
        ("toxic-bloom-boundary-atlas-v1-chroma.png", "toxic-bloom-boundary-atlas-v1.png"),
        ("toxic-bloom-obstacle-atlas-v1-chroma.png", "toxic-bloom-obstacle-atlas-v1.png"),
        ("toxic-bloom-decal-atlas-v1-chroma.png", "toxic-bloom-decal-atlas-v1.png"),
    ]
    for source, output in pairs:
        extract(source, output)
    grid("toxic-bloom-floor-atlas-v1.png", "toxic-bloom-floor-atlas-v1-64.png", 3, 2, 64, 2)
    grid("toxic-bloom-boundary-atlas-v1.png", "toxic-bloom-boundary-atlas-v1-64.png", 4, 2, 64, 1)
    grid("toxic-bloom-obstacle-atlas-v1.png", "toxic-bloom-obstacle-atlas-v1-96.png", 2, 2, 96, 2)
    grid("toxic-bloom-decal-atlas-v1.png", "toxic-bloom-decal-atlas-v1-64.png", 3, 2, 64, 4)
    print("Wrote toxic-bloom transparent masters and runtime atlases")


if __name__ == "__main__":
    main()
