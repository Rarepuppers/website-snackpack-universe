"""Normalize approved U1 ImageGen sources into deterministic runtime UI assets."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parent


def remove_baked_checker(image: Image.Image) -> Image.Image:
    """Convert the generator's neutral checker preview to real transparency."""
    rgba = image.convert("RGBA")
    pixels = []
    for red, green, blue, _alpha in rgba.getdata():
        neutral = max(red, green, blue) - min(red, green, blue) <= 12
        preview_square = neutral and min(red, green, blue) >= 218
        pixels.append((red, green, blue, 0 if preview_square else 255))
    rgba.putdata(pixels)
    bounds = rgba.getbbox()
    if bounds is None:
        raise RuntimeError("source became empty while removing checker preview")
    return rgba.crop(bounds)


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    resized = ImageOps.contain(image, size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", size)
    output.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return output


def tint_state(image: Image.Image, state: str) -> Image.Image:
    alpha = image.getchannel("A")
    rgb = image.convert("RGB")
    if state == "hover":
        rgb = ImageEnhance.Brightness(rgb).enhance(1.10)
        rgb = ImageEnhance.Color(rgb).enhance(1.12)
    elif state == "selected":
        rgb = ImageEnhance.Brightness(rgb).enhance(1.18)
        rgb = ImageEnhance.Color(rgb).enhance(1.28)
    elif state == "pressed":
        rgb = ImageEnhance.Brightness(rgb).enhance(0.76)
        rgb = ImageEnhance.Contrast(rgb).enhance(1.12)
    elif state == "disabled":
        rgb = ImageOps.grayscale(rgb).convert("RGB")
        alpha = alpha.point(lambda value: round(value * 0.48))
    return Image.merge("RGBA", (*rgb.split(), alpha))


def save_webp(image: Image.Image, path: Path) -> None:
    image.save(path, "WEBP", lossless=True, method=6)


def save_pair(image: Image.Image, stem: str) -> None:
    image.save(ROOT / f"{stem}.png", optimize=True)
    save_webp(image, ROOT / f"{stem}.webp")


def nine_slice_resize(
    image: Image.Image,
    size: tuple[int, int],
    margins: tuple[int, int, int, int],
) -> Image.Image:
    left, right, top, bottom = margins
    source_x = (0, left, image.width - right, image.width)
    source_y = (0, top, image.height - bottom, image.height)
    target_x = (0, left, size[0] - right, size[0])
    target_y = (0, top, size[1] - bottom, size[1])
    output = Image.new("RGBA", size)
    for row in range(3):
        for column in range(3):
            source = image.crop((source_x[column], source_y[row], source_x[column + 1], source_y[row + 1]))
            width = target_x[column + 1] - target_x[column]
            height = target_y[row + 1] - target_y[row]
            output.alpha_composite(source.resize((width, height), Image.Resampling.LANCZOS), (target_x[column], target_y[row]))
    return output


def focus_brackets() -> Image.Image:
    output = Image.new("RGBA", (128, 128))
    draw = ImageDraw.Draw(output)
    dark = (4, 13, 22, 235)
    cyan = (104, 228, 232, 255)
    amber = (255, 154, 82, 255)
    length = 34
    inset = 8
    corners = (
        ((inset + length, inset), (inset, inset), (inset, inset + length)),
        ((128 - inset - length, inset), (128 - inset, inset), (128 - inset, inset + length)),
        ((inset, 128 - inset - length), (inset, 128 - inset), (inset + length, 128 - inset)),
        ((128 - inset, 128 - inset - length), (128 - inset, 128 - inset), (128 - inset - length, 128 - inset)),
    )
    for points in corners:
        draw.line(points, fill=dark, width=10, joint="curve")
        draw.line(points, fill=cyan, width=4, joint="curve")
        draw.ellipse((points[1][0] - 3, points[1][1] - 3, points[1][0] + 3, points[1][1] + 3), fill=amber)
    return output


def divider_rule() -> Image.Image:
    output = Image.new("RGBA", (512, 16))
    draw = ImageDraw.Draw(output)
    draw.rectangle((16, 5, 496, 11), fill=(4, 13, 22, 220))
    draw.line((24, 8, 488, 8), fill=(104, 228, 232, 210), width=2)
    draw.rectangle((8, 5, 18, 11), fill=(255, 154, 82, 255))
    draw.rectangle((494, 5, 504, 11), fill=(255, 154, 82, 255))
    return output


panel = contain(remove_baked_checker(Image.open(ROOT / "ui-panel-source-v1.png")), (256, 256))
save_pair(panel, "ui-panel-frame-v1-256")
save_pair(tint_state(panel, "pressed"), "ui-panel-recessed-v1-256")
save_pair(panel, "ui-panel-raised-v1-256")
save_pair(tint_state(panel, "selected"), "ui-panel-emphasis-v1-256")

button = contain(remove_baked_checker(Image.open(ROOT / "ui-button-source-v1.png")), (320, 120))
for button_state in ("idle", "hover", "selected", "pressed", "disabled"):
    state_image = tint_state(button, button_state)
    save_pair(state_image, f"ui-button-{button_state}-v1-320x120")

save_pair(nine_slice_resize(button, (512, 96), (48, 48, 36, 36)), "ui-header-plate-v1-512x96")
save_pair(focus_brackets(), "ui-focus-brackets-v1-128")
save_pair(divider_rule(), "ui-divider-rule-v1-512x16")

print("Normalized U1 panels, button states, focus, header, and divider with real alpha.")
