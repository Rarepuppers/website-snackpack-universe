from pathlib import Path

from PIL import Image


BUILD_ROOT = Path(__file__).resolve().parent.parent / "packaging-assets"
SOURCE = BUILD_ROOT / "icon-source.png"


def square_master(image: Image.Image, size: int = 1024) -> Image.Image:
    if image.width != image.height:
        raise ValueError(f"Icon source must be square, received {image.size}")
    return image.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    with Image.open(SOURCE) as source:
        master = square_master(source)

    linux_icon = master.resize((512, 512), Image.Resampling.LANCZOS)
    linux_icon.save(BUILD_ROOT / "icon.png", optimize=True)
    master.save(
        BUILD_ROOT / "icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    master.save(BUILD_ROOT / "icon.icns", format="ICNS")


if __name__ == "__main__":
    main()
