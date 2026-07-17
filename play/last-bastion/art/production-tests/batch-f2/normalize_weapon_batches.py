from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST


def grid(source_path: Path, output_path: Path, columns: int, rows: int, cell_size: int) -> None:
    source = Image.open(source_path).convert("RGBA")
    output = Image.new("RGBA", (columns * cell_size, rows * cell_size))
    for row in range(rows):
        for column in range(columns):
            left = round(source.width * column / columns)
            right = round(source.width * (column + 1) / columns)
            top = round(source.height * row / rows)
            bottom = round(source.height * (row + 1) / rows)
            cell = source.crop((left, top, right, bottom))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_path.name} cell {column},{row} is empty")
            subject = cell.crop(bounds)
            target = cell_size - 8
            subject.thumbnail((target, target), NEAREST)
            x = column * cell_size + (cell_size - subject.width) // 2
            y = row * cell_size + (cell_size - subject.height) // 2
            output.alpha_composite(subject, (x, y))
    output.save(output_path, optimize=True)


def component_row(source_path: Path, output_path: Path, count: int, cell_size: int) -> None:
    source = Image.open(source_path).convert("RGBA")
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
        raise ValueError(f"Expected {count} subjects in {source_path.name}, found {len(bounds)}")
    output = Image.new("RGBA", (count * cell_size, cell_size))
    for index, box in enumerate(bounds):
        subject = source.crop(box)
        subject.thumbnail((cell_size - 8, cell_size - 8), NEAREST)
        x = index * cell_size + (cell_size - subject.width) // 2
        y = (cell_size - subject.height) // 2
        output.alpha_composite(subject, (x, y))
    output.save(output_path, optimize=True)


component_row(ROOT / "bolt-carbine-spritesheet-v1.png", ROOT / "bolt-carbine-spritesheet-v1-96.png", 4, 96)
grid(ROOT / "bolt-carbine-effect-atlas-v1.png", ROOT / "bolt-carbine-effect-atlas-v1-64.png", 4, 2, 64)
grid(ROOT / "weapon-tile-atlas-v1.png", ROOT / "weapon-tile-atlas-v1-64.png", 3, 1, 64)

F3 = ROOT.parent / "batch-f3"
component_row(F3 / "bulwark-rotary-cannon-spritesheet-v1.png", F3 / "bulwark-rotary-cannon-spritesheet-v1-96.png", 4, 96)
grid(F3 / "bulwark-rotary-cannon-effect-atlas-v1.png", F3 / "bulwark-rotary-cannon-effect-atlas-v1-64.png", 4, 2, 64)

F4 = ROOT.parent / "batch-f4"
component_row(F4 / "grenade-tube-spritesheet-v1.png", F4 / "grenade-tube-spritesheet-v1-96.png", 4, 96)
grid(F4 / "grenade-tube-effect-atlas-v1.png", F4 / "grenade-tube-effect-atlas-v1-64.png", 4, 2, 64)
