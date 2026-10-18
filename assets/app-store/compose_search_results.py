#!/usr/bin/env python3
"""Compose App Store Search Results creative asset (3:2) with a realistic Today mock."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 3840, 2560
BG = (244, 239, 230)
SURFACE = (255, 251, 247)
TEXT = (26, 22, 18)
MUTED = (107, 100, 92)
GREEN = (47, 93, 80)
ORANGE = (196, 92, 38)
BORDER = (229, 221, 210)
FIELD = (237, 230, 219)
PHONE = (22, 20, 18)
OUT = Path(__file__).resolve().parent


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/Library/Fonts/Arial Bold.ttf",
        ]
        if bold
        else [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        ]
    )
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def text_size(draw: ImageDraw.ImageDraw, s: str, f: ImageFont.ImageFont) -> tuple[int, int]:
    b = draw.textbbox((0, 0), s, font=f)
    return b[2] - b[0], b[3] - b[1]


def rr(
    draw: ImageDraw.ImageDraw,
    box: list[float],
    r: float,
    fill=None,
    outline=None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def draw_ring(
    img: Image.Image,
    cx: int,
    cy: int,
    radius: int,
    stroke: int,
    progress: float,
    color: tuple[int, int, int],
) -> Image.Image:
    draw = ImageDraw.Draw(img)
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        outline=FIELD,
        width=stroke,
    )
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    extent = int(360 * progress)
    od.arc(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        start=-90,
        end=-90 + extent,
        fill=color + (255,),
        width=stroke,
    )
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def draw_today(pw: int, ph: int) -> Image.Image:
    """Today tab mock aligned with StatusHero + DoThisNext structure."""
    img = Image.new("RGB", (pw, ph), BG)
    draw = ImageDraw.Draw(img)
    s = pw / 390
    pad = int(20 * s)

    # Status bar
    draw.text((int(28 * s), int(18 * s)), "9:41", font=font(int(15 * s), True), fill=TEXT)
    bx = pw - int(28 * s)
    rr(draw, [bx - int(22 * s), int(20 * s), bx, int(30 * s)], 2, outline=TEXT, width=1)
    draw.rectangle(
        [bx - int(20 * s), int(22 * s), bx - int(6 * s), int(28 * s)], fill=TEXT
    )

    y = int(52 * s)

    # Keeper chip (header action, outside hero)
    kf = font(int(13 * s), True)
    kw, kh = text_size(draw, "Keeper", kf)
    kx0 = pw - pad - kw - int(36 * s)
    rr(
        draw,
        [kx0, y + int(2 * s), pw - pad, y + int(2 * s) + kh + int(14 * s)],
        int(14 * s),
        fill=SURFACE,
        outline=BORDER,
        width=1,
    )
    draw.text((kx0 + int(10 * s), y + int(6 * s)), "*", font=font(int(14 * s), True), fill=ORANGE)
    draw.text((kx0 + int(26 * s), y + int(8 * s)), "Keeper", font=kf, fill=TEXT)

    # Hero card (StatusHero): greeting + weather + ring row
    card_x0, card_x1 = pad, pw - pad
    card_top = y + int(40 * s)
    card_h = int(228 * s)
    rr(
        draw,
        [card_x0, card_top, card_x1, card_top + card_h],
        int(18 * s),
        fill=SURFACE,
        outline=BORDER,
        width=1,
    )

    draw.text(
        (card_x0 + int(16 * s), card_top + int(16 * s)),
        "Good morning, Jeff",
        font=font(int(24 * s), True),
        fill=TEXT,
    )
    draw.text(
        (card_x0 + int(16 * s), card_top + int(48 * s)),
        "12\u00b0C  ·  Partly cloudy  ·  Fall",
        font=font(int(12 * s)),
        fill=MUTED,
    )

    ring_cx = card_x0 + int(70 * s)
    ring_cy = card_top + int(140 * s)
    radius = int(48 * s)
    stroke = int(9 * s)
    img = draw_ring(img, ring_cx, ring_cy, radius, stroke, 0.82, GREEN)
    draw = ImageDraw.Draw(img)

    vf = font(int(28 * s), True)
    vw, vh = text_size(draw, "82", vf)
    draw.text((ring_cx - vw / 2, ring_cy - vh / 2 - int(8 * s)), "82", font=vf, fill=TEXT)
    cf = font(int(11 * s))
    cw, _ = text_size(draw, "Upkeep", cf)
    draw.text((ring_cx - cw / 2, ring_cy + int(12 * s)), "Upkeep", font=cf, fill=MUTED)

    tx = card_x0 + int(140 * s)
    ty = card_top + int(88 * s)
    draw.text((tx, ty), "On track", font=font(int(20 * s), True), fill=GREEN)
    draw.text(
        (tx, ty + int(30 * s)),
        "Everything is on track.",
        font=font(int(13 * s)),
        fill=MUTED,
    )
    draw.text(
        (tx, ty + int(48 * s)),
        "2 things due this week.",
        font=font(int(13 * s)),
        fill=MUTED,
    )

    pill = "2 due today"
    pf = font(int(12 * s), True)
    pw_, ph_ = text_size(draw, pill, pf)
    px0, py0 = tx, ty + int(78 * s)
    rr(
        draw,
        [px0, py0, px0 + pw_ + int(28 * s), py0 + ph_ + int(12 * s)],
        int(12 * s),
        fill=(255, 236, 224),
    )
    draw.text((px0 + int(10 * s), py0 + int(5 * s)), pill, font=pf, fill=ORANGE)
    draw.text(
        (px0 + pw_ + int(12 * s), py0 + int(4 * s)),
        ">",
        font=font(int(12 * s), True),
        fill=ORANGE,
    )

    y = card_top + card_h + int(22 * s)

    # Do this next
    draw.text((pad, y), "Do this next", font=font(int(17 * s), True), fill=TEXT)
    y += int(28 * s)

    nrt_h = int(136 * s)
    rr(
        draw,
        [pad, y, pw - pad, y + nrt_h],
        int(18 * s),
        fill=SURFACE,
        outline=BORDER,
        width=1,
    )

    # Category chip (HVAC / appliances accent)
    ccx, ccy = pad + int(30 * s), y + int(30 * s)
    draw.ellipse(
        [ccx - int(18 * s), ccy - int(18 * s), ccx + int(18 * s), ccy + int(18 * s)],
        fill=(255, 228, 210),
    )
    draw.text(
        (ccx - int(7 * s), ccy - int(9 * s)),
        "H",
        font=font(int(14 * s), True),
        fill=ORANGE,
    )

    draw.text(
        (pad + int(58 * s), y + int(16 * s)),
        "Replace HVAC filter",
        font=font(int(16 * s), True),
        fill=TEXT,
    )
    draw.text(
        (pad + int(58 * s), y + int(40 * s)),
        "Due today  ·  ~15 min",
        font=font(int(12 * s)),
        fill=ORANGE,
    )

    btn_y = y + int(74 * s)
    rr(
        draw,
        [pad + int(16 * s), btn_y, pw - pad - int(16 * s), btn_y + int(44 * s)],
        int(14 * s),
        fill=ORANGE,
    )
    bf = font(int(15 * s), True)
    bw, _ = text_size(draw, "Mark done", bf)
    draw.text(((pw - bw) / 2, btn_y + int(12 * s)), "Mark done", font=bf, fill=(255, 255, 255))

    y += nrt_h + int(22 * s)

    # This week
    draw.text((pad, y), "This week", font=font(int(17 * s), True), fill=TEXT)
    see = "See all 3"
    sw, _ = text_size(draw, see, font(int(13 * s), True))
    draw.text((pw - pad - sw, y + int(2 * s)), see, font=font(int(13 * s), True), fill=ORANGE)
    y += int(28 * s)

    rows = [
        ("Test smoke alarms", "Due tomorrow"),
        ("Clean gutters", "In 3 days"),
    ]
    row_h = int(58 * s)
    week_h = row_h * len(rows) + int(8 * s)
    rr(
        draw,
        [pad, y, pw - pad, y + week_h],
        int(18 * s),
        fill=SURFACE,
        outline=BORDER,
        width=1,
    )
    for i, (title, meta) in enumerate(rows):
        ry = y + int(4 * s) + i * row_h
        if i > 0:
            draw.line(
                [pad + int(52 * s), ry, pw - pad - int(12 * s), ry],
                fill=BORDER,
                width=1,
            )
        cr = int(11 * s)
        cx = pad + int(28 * s)
        cy = ry + row_h // 2
        draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], outline=BORDER, width=2)
        draw.text(
            (pad + int(52 * s), ry + int(12 * s)),
            title,
            font=font(int(15 * s), True),
            fill=TEXT,
        )
        draw.text(
            (pad + int(52 * s), ry + int(32 * s)),
            meta,
            font=font(int(12 * s)),
            fill=MUTED,
        )
        draw.text(
            (pw - pad - int(20 * s), ry + int(18 * s)),
            ">",
            font=font(int(16 * s)),
            fill=MUTED,
        )

    # Tab bar: Today / Tasks / My Home
    tab_h = int(78 * s)
    tab_y = ph - tab_h
    draw.rectangle([0, tab_y, pw, ph], fill=(250, 247, 241))
    draw.line([0, tab_y, pw, tab_y], fill=BORDER, width=1)
    tabs = [("Today", True), ("Tasks", False), ("My Home", False)]
    tw = pw / 3
    for i, (label, active) in enumerate(tabs):
        color = ORANGE if active else MUTED
        tx = int(i * tw + tw / 2)
        iy = tab_y + int(14 * s)
        if label == "Today":
            rr(
                draw,
                [tx - int(11 * s), iy, tx + int(11 * s), iy + int(15 * s)],
                3,
                outline=color,
                width=2,
            )
            if active:
                draw.rectangle(
                    [tx - int(5 * s), iy + int(4 * s), tx + int(5 * s), iy + int(11 * s)],
                    fill=color,
                )
        elif label == "Tasks":
            for dx, dy in [(-9, -5), (3, -5), (-9, 7), (3, 7)]:
                rr(
                    draw,
                    [
                        tx + int(dx * s),
                        iy + int((dy + 5) * s),
                        tx + int((dx + 8) * s),
                        iy + int((dy + 12) * s),
                    ],
                    2,
                    outline=color,
                    width=1,
                )
        else:
            draw.polygon(
                [
                    (tx, iy),
                    (tx - int(11 * s), iy + int(10 * s)),
                    (tx + int(11 * s), iy + int(10 * s)),
                ],
                outline=color,
            )
            draw.rectangle(
                [tx - int(7 * s), iy + int(10 * s), tx + int(7 * s), iy + int(18 * s)],
                outline=color,
                width=1,
            )
        lf = font(int(10 * s), active)
        lw, _ = text_size(draw, label, lf)
        draw.text((tx - lw / 2, tab_y + int(40 * s)), label, font=lf, fill=color)

    rr(
        draw,
        [pw // 2 - int(48 * s), ph - int(10 * s), pw // 2 + int(48 * s), ph - int(5 * s)],
        3,
        fill=(180, 175, 168),
    )
    return img


def compose() -> None:
    phone_ui = draw_today(1170, 2532)
    phone_ui.save(OUT / "today-mock-phone.png", "PNG")

    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    bezel = 36
    radius = 100
    target_h = int(H * 0.88)
    scale = target_h / (phone_ui.height + bezel * 2)
    inner_w = int(phone_ui.width * scale)
    inner_h = int(phone_ui.height * scale)
    bezel_s = max(22, int(bezel * scale))
    radius_s = max(48, int(radius * scale))
    phone_w = inner_w + bezel_s * 2
    phone_h = inner_h + bezel_s * 2
    ui = phone_ui.resize((inner_w, inner_h), Image.Resampling.LANCZOS)

    phone_left = int(W * 0.50)
    phone_top = (H - phone_h) // 2

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [
            phone_left + 28,
            phone_top + 40,
            phone_left + phone_w + 28,
            phone_top + phone_h + 40,
        ],
        radius=radius_s,
        fill=(26, 22, 18, 50),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(52))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB")
    draw = ImageDraw.Draw(canvas)

    rr(
        draw,
        [phone_left, phone_top, phone_left + phone_w, phone_top + phone_h],
        radius_s,
        fill=PHONE,
    )
    mask = Image.new("L", (inner_w, inner_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, inner_w - 1, inner_h - 1],
        radius=max(40, radius_s - 20),
        fill=255,
    )
    canvas.paste(ui, (phone_left + bezel_s, phone_top + bezel_s), mask)
    draw = ImageDraw.Draw(canvas)

    di_w, di_h = int(phone_w * 0.32), max(24, int(phone_h * 0.028))
    di_x = phone_left + (phone_w - di_w) // 2
    di_y = phone_top + int(bezel_s * 0.7)
    rr(draw, [di_x, di_y, di_x + di_w, di_y + di_h], di_h // 2, fill=(8, 8, 8))

    left_x = int(W * 0.07)
    hf = font(118, True)
    sf = font(48, False)
    lines = ["See what's due", "at a glance"]
    sizes = [text_size(draw, line, hf) for line in lines]
    block_h = sum(h + 6 for _, h in sizes) + 50 + 56 + 70
    y = phone_top + (phone_h - block_h) // 2
    for (tw, th), line in zip(sizes, lines):
        draw.text((left_x, y), line, font=hf, fill=TEXT)
        y += th + 6
    y += 28
    draw.text((left_x, y), "Your real Today view — due work,", font=sf, fill=MUTED)
    y += 56
    draw.text((left_x, y), "upkeep, and what to do next.", font=sf, fill=MUTED)
    y += 80
    bw, gap = 22, 14
    heights = [48, 68, 34]
    colors = [GREEN, ORANGE, (28, 28, 28)]
    for i, (hh, c) in enumerate(zip(heights, colors)):
        x = left_x + i * (bw + gap)
        rr(draw, [x, y + 68 - hh, x + bw, y + 68], bw // 2, fill=c)

    path = OUT / "search-results-3840x2560.png"
    canvas.save(path, "PNG", optimize=True)
    canvas.resize((1152, 768), Image.Resampling.LANCZOS).save(
        OUT / "search-results-preview.png", "PNG"
    )
    print(f"wrote {path}")


if __name__ == "__main__":
    compose()
