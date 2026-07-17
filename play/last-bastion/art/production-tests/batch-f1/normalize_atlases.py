from pathlib import Path
from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def grid(source_name: str, output_name: str, columns: int, rows: int, cell_size: int) -> None:
    source = Image.open(ROOT / source_name).convert("RGBA")
    output = Image.new("RGBA", (columns * cell_size, rows * cell_size))
    for row in range(rows):
        for column in range(columns):
            left = round(source.width * column / columns)
            right = round(source.width * (column + 1) / columns)
            top = round(source.height * row / rows)
            bottom = round(source.height * (row + 1) / rows)
            cell = source.crop((left, top, right, bottom))
            side = max(cell.width, cell.height)
            square = Image.new("RGBA", (side, side))
            square.alpha_composite(cell, ((side - cell.width) // 2, (side - cell.height) // 2))
            output.alpha_composite(square.resize((cell_size, cell_size), NEAREST), (column * cell_size, row * cell_size))
    output.save(ROOT / output_name, optimize=True)


def content_grid(source_name: str, output_name: str, columns: int, rows: int, cell_size: int, padding: int) -> None:
    source = Image.open(ROOT / source_name).convert("RGBA")
    subjects = []
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
            subjects.append(cell.crop(bounds))
    scale = min(
        (cell_size - padding * 2) / max(subject.width for subject in subjects),
        (cell_size - padding * 2) / max(subject.height for subject in subjects),
    )
    output = Image.new("RGBA", (columns * cell_size, rows * cell_size))
    for index, subject in enumerate(subjects):
        width = max(1, round(subject.width * scale))
        height = max(1, round(subject.height * scale))
        resized = subject.resize((width, height), NEAREST)
        column = index % columns
        row = index // columns
        output.alpha_composite(
            resized,
            (column * cell_size + (cell_size - width) // 2, row * cell_size + (cell_size - height) // 2),
        )
    output.save(ROOT / output_name, optimize=True)


def component_row(source_name: str, output_name: str, count: int, cell_size: int, padding: int) -> None:
    source = Image.open(ROOT / source_name).convert("RGBA")
    alpha = source.getchannel("A")
    pixels = alpha.load()
    width, height = source.size
    seen = bytearray(width * height)
    components = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or pixels[x, y] < 32:
                continue
            queue = deque([(x, y)])
            seen[index] = 1
            area = 0
            left = right = x
            top = bottom = y
            while queue:
                current_x, current_y = queue.popleft()
                area += 1
                left = min(left, current_x)
                right = max(right, current_x)
                top = min(top, current_y)
                bottom = max(bottom, current_y)
                for next_x in range(max(0, current_x - 1), min(width, current_x + 2)):
                    for next_y in range(max(0, current_y - 1), min(height, current_y + 2)):
                        next_index = next_y * width + next_x
                        if not seen[next_index] and pixels[next_x, next_y] >= 32:
                            seen[next_index] = 1
                            queue.append((next_x, next_y))
            components.append((area, (left, top, right + 1, bottom + 1)))
    bounds = sorted((box for _, box in sorted(components, reverse=True)[:count]), key=lambda box: box[0])
    if len(bounds) != count:
        raise ValueError(f"Expected {count} connected subjects in {source_name}, found {len(bounds)}")
    subjects = [source.crop(box) for box in bounds]
    scale = min(
        (cell_size - padding * 2) / max(subject.width for subject in subjects),
        (cell_size - padding * 2) / max(subject.height for subject in subjects),
    )
    output = Image.new("RGBA", (count * cell_size, cell_size))
    for index, subject in enumerate(subjects):
        resized = subject.resize(
            (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))), NEAREST,
        )
        output.alpha_composite(
            resized,
            (index * cell_size + (cell_size - resized.width) // 2, (cell_size - resized.height) // 2),
        )
    output.save(ROOT / output_name, optimize=True)


def icon(source_name: str, output_name: str, size: int, padding: int) -> None:
    source = Image.open(ROOT / source_name).convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"{source_name} contains no visible pixels")
    subject = source.crop(bounds)
    target = size - padding * 2
    subject.thumbnail((target, target), NEAREST)
    output = Image.new("RGBA", (size, size))
    output.alpha_composite(subject, ((size - subject.width) // 2, (size - subject.height) // 2))
    output.save(ROOT / output_name, optimize=True)


component_row("patrol-blade-spritesheet-v1.png", "patrol-blade-spritesheet-v1-96.png", 4, 96, 6)
grid("patrol-blade-effect-atlas-v1.png", "patrol-blade-effect-atlas-v1-64.png", 3, 2, 64)
grid("action-tile-atlas-v1.png", "action-tile-atlas-v1-64.png", 3, 2, 64)
icon("uranium-core-rounds-status-v1.png", "uranium-core-rounds-status-v1-64.png", 64, 5)
