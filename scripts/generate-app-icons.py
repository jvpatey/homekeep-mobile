#!/usr/bin/env python3
"""Render HouseMark app icons from the same metrics as src/components/ui/HouseMark.tsx."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

# HouseMark.tsx
BAR_WIDTH_RATIO = 0.22
GAP_RATIO = 0.06
RADIUS_RATIO = 0.08
HEIGHT_RATIOS = (0.55, 0.85, 0.42)

# Hearth palette — src/theme/colors.ts
LIGHT_BARS = ("#2F5D50", "#C45C26", "#1A1612")
LIGHT_BG = "#F4EFE6"
DARK_BARS = ("#4A7A6A", "#D46B35", "#F5F0E8")
DARK_BG = "#14110E"
TINTED_BARS = ("#FFFFFF", "#FFFFFF", "#FFFFFF")

ICON_SIZE = 1024
# Bounding box of the bars sits in the center ~66% (Android adaptive safe zone).
SAFE_ZONE = 0.66
SPLASH_SIZE = (1320, 2868)


def hex_to_rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = hex_color.lstrip("#")
    r, g, b = (int(value[i : i + 2], 16) for i in (0, 2, 4))
    return (r, g, b, alpha)


def mark_size_for_canvas(canvas: int, safe_zone: float = SAFE_ZONE) -> float:
    """Choose HouseMark `size` so bar bounds fit in `safe_zone` of the canvas."""
    max_height_ratio = max(HEIGHT_RATIOS)
    width_ratio = 3 * BAR_WIDTH_RATIO + 2 * GAP_RATIO
    limit = canvas * safe_zone
    return min(limit / max_height_ratio, limit / width_ratio)


def bar_rects(canvas_w: int, canvas_h: int, size: float) -> list[tuple[float, float, float, float]]:
    bar_w = size * BAR_WIDTH_RATIO
    gap = size * GAP_RATIO
    heights = [size * r for r in HEIGHT_RATIOS]
    total_w = 3 * bar_w + 2 * gap
    max_h = max(heights)
    left = (canvas_w - total_w) / 2
    bottom = (canvas_h + max_h) / 2
    rects = []
    x = left
    for height in heights:
        y = bottom - height
        rects.append((x, y, x + bar_w, y + height))
        x += bar_w + gap
    return rects


def draw_mark(
    image: Image.Image,
    bar_colors: tuple[str, str, str],
    size: float,
    alpha: int = 255,
) -> None:
    draw = ImageDraw.Draw(image)
    radius = size * RADIUS_RATIO
    for rect, color in zip(bar_rects(image.width, image.height, size), bar_colors):
        draw.rounded_rectangle(rect, radius=radius, fill=hex_to_rgba(color, alpha))


def render_opaque(path: Path, background: str, bars: tuple[str, str, str]) -> None:
    image = Image.new("RGB", (ICON_SIZE, ICON_SIZE), background)
    rgba = image.convert("RGBA")
    draw_mark(rgba, bars, mark_size_for_canvas(ICON_SIZE))
    rgba.convert("RGB").save(path, "PNG")


def render_transparent(path: Path, bars: tuple[str, str, str]) -> None:
    image = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    draw_mark(image, bars, mark_size_for_canvas(ICON_SIZE))
    image.save(path, "PNG")


def render_splash(path: Path) -> None:
    image = Image.new("RGB", SPLASH_SIZE, LIGHT_BG)
    rgba = image.convert("RGBA")
    # Hero mark ~28% of the shorter splash side — readable, not a full-bleed icon.
    size = mark_size_for_canvas(min(SPLASH_SIZE), safe_zone=0.28)
    draw_mark(rgba, LIGHT_BARS, size)
    rgba.convert("RGB").save(path, "PNG")


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    (ASSETS / "splash").mkdir(exist_ok=True)

    render_opaque(ASSETS / "icon.png", LIGHT_BG, LIGHT_BARS)
    render_opaque(ASSETS / "icon-dark.png", DARK_BG, DARK_BARS)
    render_transparent(ASSETS / "icon-tinted.png", TINTED_BARS)
    render_transparent(ASSETS / "adaptive-icon.png", LIGHT_BARS)
    render_splash(ASSETS / "splash" / "splash.png")

    print("Wrote:")
    for rel in (
        "assets/icon.png",
        "assets/icon-dark.png",
        "assets/icon-tinted.png",
        "assets/adaptive-icon.png",
        "assets/splash/splash.png",
    ):
        print(f"  {rel}")


if __name__ == "__main__":
    main()
