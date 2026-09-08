#!/usr/bin/env python3
"""Preprocess character sprites and bake procedural HUD / FX / item art."""
from __future__ import annotations

import math
import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path("/home/userk21/Eris_game_project")
ASSETS = ROOT / "assets"
OUT = ASSETS / "processed"
random.seed(23)


def ensure(p: Path) -> Path:
    p.mkdir(parents=True, exist_ok=True)
    return p


def chroma_green(im: Image.Image, thresh: int = 70) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if g > 90 and g > r + 35 and g > b + 20:
                px[x, y] = (0, 0, 0, 0)
            elif g > 200 and r < 80 and b < 80:
                px[x, y] = (0, 0, 0, 0)
    return im


def chroma_sheet(im: Image.Image) -> Image.Image:
    """Knock out light-blue character-sheet backgrounds and edge padding."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size

    def is_bg(r, g, b, a):
        if a < 12:
            return True
        if r < 40 and g < 40 and b < 40 and a < 80:
            return True
        if b >= r + 8 and g >= r and b >= 140 and g >= 140 and r >= 90:
            return True
        if r > 185 and g > 200 and b > 210:
            return True
        if abs(r - g) < 18 and abs(g - b) < 22 and r > 170 and b > 175:
            return True
        return False

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_bg(r, g, b, a):
                px[x, y] = (0, 0, 0, 0)

    # Crop likely caption strip (bottom ~14%)
    crop_h = int(h * 0.86)
    band = im.crop((0, crop_h, w, h))
    dark = 0
    tot = 0
    bp = band.load()
    bw, bh = band.size
    for y in range(bh):
        for x in range(bw):
            r, g, b, a = bp[x, y]
            if a > 40:
                tot += 1
                if r + g + b < 220:
                    dark += 1
    if tot and dark / tot > 0.18:
        im = im.crop((0, 0, w, crop_h))
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.paste(im, (0, 0), im)
        im = canvas
    return im


def trim_and_pad(im: Image.Image, size: int = 256, bottom_heavy: bool = True) -> Image.Image:
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    im = im.crop(bbox)
    tw, th = im.size
    scale = min((size * 0.90) / max(tw, 1), (size * 0.92) / max(th, 1))
    nw, nh = max(1, int(tw * scale)), max(1, int(th * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - nw) // 2
    y = size - nh - 4 if bottom_heavy else (size - nh) // 2
    canvas.paste(im, (x, y), im)
    return canvas


def key_file(src: Path, dst: Path, mode: str, size: int = 256) -> None:
    im = Image.open(src)
    if mode == "green":
        im = chroma_green(im)
    else:
        im = chroma_sheet(im)
    im = trim_and_pad(im, size=size, bottom_heavy=True)
    ensure(dst.parent)
    im.save(dst, "PNG")


def circle(draw, xy, fill, outline=None, width=2):
    draw.ellipse(xy, fill=fill, outline=outline, width=width if outline else 0)


def draw_text(draw, xy, text, fill, size=18):
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size
        )
    except Exception:
        font = ImageFont.load_default()
    draw.text(xy, text, fill=fill, font=font, anchor="mm")


def make_icon(letter: str, bg, fg, accent, name: str):
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((2, 2, 62, 62), radius=8, fill=bg, outline=accent, width=3)
    d.rounded_rectangle((8, 8, 56, 56), radius=5, fill=None, outline=fg, width=2)
    draw_text(d, (32, 33), letter, fg, 28)
    ensure(ASSETS / "items")
    im.save(ASSETS / "items" / f"wep_{name}.png")
    return im


def make_food(kind: str):
    im = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if kind == "apple":
        d.ellipse((8, 10, 40, 42), fill=(230, 170, 20), outline=(90, 50, 10), width=2)
        d.ellipse((14, 14, 24, 22), fill=(255, 230, 120))
        d.polygon([(24, 10), (28, 2), (32, 10)], fill=(80, 140, 40))
    elif kind == "hotdog":
        d.ellipse((6, 18, 42, 34), fill=(210, 90, 50), outline=(90, 30, 10), width=2)
        d.ellipse((10, 16, 38, 30), fill=(240, 200, 90), outline=(140, 90, 20), width=2)
        d.line((14, 22, 34, 26), fill=(180, 40, 40), width=2)
    elif kind == "pineapple":
        d.ellipse((12, 16, 36, 42), fill=(230, 180, 40), outline=(120, 80, 10), width=2)
        d.polygon([(24, 4), (16, 18), (32, 18)], fill=(40, 150, 70))
        d.polygon([(24, 2), (20, 16), (28, 16)], fill=(60, 180, 80))
    elif kind == "chao":
        d.ellipse((6, 6, 42, 42), fill=(255, 70, 180), outline=(40, 0, 40), width=2)
        d.pieslice((10, 10, 38, 38), 90, 270, fill=(20, 20, 20))
        d.pieslice((10, 10, 38, 38), -90, 90, fill=(245, 245, 245))
        d.ellipse((18, 14, 26, 22), fill=(240, 190, 30))
        d.regular_polygon((30, 30, 5), 5, rotation=18, fill=(240, 190, 30))
    elif kind == "life":
        d.ellipse((8, 12, 40, 42), fill=(40, 20, 60), outline=(240, 200, 60), width=2)
        draw_text(d, (24, 27), "1", (255, 220, 80), 18)
    elif kind == "bomb":
        d.ellipse((10, 14, 38, 42), fill=(40, 40, 50), outline=(20, 20, 20), width=2)
        d.rectangle((22, 8, 26, 16), fill=(180, 140, 40))
        d.line((26, 8, 34, 4), fill=(255, 80, 40), width=2)
    elif kind == "medal":
        d.ellipse((10, 12, 38, 40), fill=(240, 190, 30), outline=(140, 90, 10), width=2)
        d.regular_polygon((24, 26, 10), 5, rotation=18, fill=(255, 230, 120))
    im.save(ASSETS / "items" / f"food_{kind}.png")


def make_bullet(name, color, w=16, h=8):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, w - 1, h - 1), fill=color, outline=(255, 255, 255, 180))
    if name == "rocket":
        d.polygon([(0, h // 2), (8, 0), (8, h - 1)], fill=(240, 80, 30))
        d.rectangle((8, 2, w - 2, h - 3), fill=color)
    if name == "laser":
        d.rectangle((0, 1, w - 1, h - 2), fill=color)
        if h >= 6:
            d.rectangle((0, 2, w - 1, h - 3), fill=(255, 255, 255, 200))
    if name == "flame":
        d.ellipse((0, 0, w - 1, h - 1), fill=(255, 140, 20, 200))
        d.ellipse((4, 2, w - 3, h - 3), fill=(255, 230, 80, 220))
    im.save(ASSETS / "fx" / f"bullet_{name}.png")


def make_grenade():
    im = Image.new("RGBA", (20, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((2, 6, 18, 22), fill=(50, 90, 40), outline=(20, 40, 15), width=2)
    d.rectangle((8, 2, 12, 8), fill=(180, 160, 40))
    im.save(ASSETS / "fx" / "grenade.png")


def make_muzzle():
    im = Image.new("RGBA", (32, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 12), (32, 2), (24, 12), (32, 22)], fill=(255, 240, 160))
    d.polygon([(4, 12), (26, 8), (22, 12), (26, 16)], fill=(255, 180, 40))
    im.save(ASSETS / "fx" / "muzzle.png")


def make_explosion_sheet():
    """6 cartoon explosion frames on transparent, 128x128."""
    frames = []
    cols = [
        (255, 250, 210),
        (255, 220, 80),
        (255, 140, 20),
        (230, 60, 20),
        (80, 40, 40),
        (40, 30, 30),
    ]
    for i in range(6):
        im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        t = i / 5.0
        radius = int(18 + t * 50)
        cx, cy = 64, 64
        # smoke
        if i >= 2:
            for k in range(6):
                ang = k * math.pi / 3 + i
                rr = radius + 10
                x = cx + math.cos(ang) * rr * 0.4
                y = cy + math.sin(ang) * rr * 0.35
                s = 16 + i * 4
                d.ellipse((x - s, y - s, x + s, y + s), fill=(40, 30, 30, 160 - i * 20))
        col = cols[i]
        d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=col + (230,))
        inner = max(4, radius - 14)
        icol = cols[max(0, i - 1)]
        d.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=icol + (240,))
        if i < 4:
            d.ellipse((cx - inner // 2, cy - inner // 2, cx + inner // 2, cy + inner // 2),
                      fill=(255, 255, 240, 230))
        # star spikes
        for k in range(8):
            ang = k * math.pi / 4 + i * 0.2
            x2 = cx + math.cos(ang) * (radius + 16)
            y2 = cy + math.sin(ang) * (radius + 16)
            d.polygon([(cx, cy), (x2, y2 - 4), (x2, y2 + 4)], fill=col + (200,))
        frames.append(im)
    sheet = Image.new("RGBA", (768, 128), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * 128, 0), fr)
        fr.save(ASSETS / "fx" / f"boom_{i}.png")
    sheet.save(ASSETS / "fx" / "boom_sheet.png")


def make_particle(name, color, size=10):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, size - 1, size - 1), fill=color)
    im.save(ASSETS / "fx" / f"part_{name}.png")


def make_hud_panel():
    im = Image.new("RGBA", (960, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 960, 64), fill=(8, 4, 16, 180))
    d.rectangle((0, 62, 960, 64), fill=(240, 190, 40, 200))
    im.save(ASSETS / "ui" / "hud_bar.png")

    heart = Image.new("RGBA", (28, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(heart)
    d.polygon([(14, 22), (2, 10), (6, 4), (14, 10), (22, 4), (26, 10)], fill=(220, 40, 70))
    heart.save(ASSETS / "ui" / "heart.png")

    bomb = Image.new("RGBA", (22, 22), (0, 0, 0, 0))
    d = ImageDraw.Draw(bomb)
    d.ellipse((3, 5, 19, 21), fill=(40, 40, 50), outline=(240, 200, 60), width=1)
    d.rectangle((10, 2, 12, 6), fill=(200, 160, 40))
    bomb.save(ASSETS / "ui" / "bomb_icon.png")


def make_platform(name, top, body):
    im = Image.new("RGBA", (128, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 8, 128, 32), fill=body)
    d.rectangle((0, 0, 128, 12), fill=top)
    d.line((0, 12, 128, 12), fill=(0, 0, 0, 80), width=2)
    # pentagon stamp
    try:
        d.regular_polygon((64, 20, 7), 5, rotation=18, fill=top)
    except Exception:
        pass
    im.save(ASSETS / "tiles" / f"plat_{name}.png")


def make_deco():
    # pentagon graffiti
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.regular_polygon((32, 32, 26), 5, rotation=18, fill=(240, 190, 40, 180), outline=(20, 10, 0))
    im.save(ASSETS / "fx" / "penta.png")

    apple = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(apple)
    d.ellipse((4, 8, 28, 30), fill=(230, 170, 20), outline=(90, 50, 10), width=2)
    d.polygon([(16, 8), (20, 2), (22, 8)], fill=(70, 140, 40))
    apple.save(ASSETS / "fx" / "apple_small.png")

    fnord = Image.new("RGBA", (48, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(fnord)
    draw_text(d, (24, 8), "FNORD", (240, 40, 180), 12)
    fnord.save(ASSETS / "fx" / "fnord.png")


def bake_green_heroes():
    mapping = {
        "hero_idle.jpg": "hero_idle.png",
        "hero_crouch.jpg": "hero_crouch.png",
        "hero_shoot.jpg": "hero_shoot.png",
        "hero_jump.jpg": "hero_jump.png",
    }
    src_dir = ASSETS / "characters" / "eris"
    dst_dir = ensure(OUT / "eris")
    for src_name, dst_name in mapping.items():
        src = src_dir / src_name
        if src.exists():
            key_file(src, dst_dir / dst_name, "green", 256)


def bake_props():
    props = {
        ASSETS / "vehicles" / "apple_slug.jpg": OUT / "vehicles" / "apple_slug.png",
        ASSETS / "items" / "crate.jpg": OUT / "items" / "crate.png",
        ASSETS / "items" / "prisoner.jpg": OUT / "items" / "prisoner.png",
        ASSETS / "items" / "barrel.jpg": OUT / "items" / "barrel.png",
        ASSETS / "fx" / "explosion.jpg": OUT / "fx" / "explosion.png",
    }
    for src, dst in props.items():
        if src.exists():
            key_file(src, dst, "green", 256 if "slug" not in str(dst) else 384)
    # tank is wider
    tank_src = ASSETS / "vehicles" / "apple_slug.jpg"
    if tank_src.exists():
        im = chroma_green(Image.open(tank_src))
        im = trim_and_pad(im, size=384, bottom_heavy=True)
        # make wider canvas
        wide = Image.new("RGBA", (512, 256), (0, 0, 0, 0))
        im2 = im.resize((512, 256), Image.Resampling.LANCZOS)
        wide.paste(im2, (0, 0), im2)
        ensure(OUT / "vehicles")
        wide.save(OUT / "vehicles" / "apple_slug.png")


def bake_tiles():
    for i in range(1, 6):
        src = ASSETS / "tiles" / f"ground{i}.jpg"
        if not src.exists():
            continue
        im = Image.open(src).convert("RGB").resize((256, 256), Image.Resampling.LANCZOS)
        # force seamless-ish by blending edges
        arr_l = im.crop((0, 0, 24, 256))
        arr_r = im.crop((232, 0, 256, 256))
        mix = Image.blend(arr_l, arr_r, 0.5)
        im.paste(mix, (0, 0))
        im.paste(mix, (232, 0))
        im.save(ASSETS / "tiles" / f"ground{i}.png")


def bake_characters():
    chars = ASSETS / "characters"
    for char in sorted(os.listdir(chars)):
        cdir = chars / char
        if not cdir.is_dir():
            continue
        for anim in ("idle", "run", "jump", "shoot", "die"):
            adir = cdir / anim
            if not adir.is_dir():
                continue
            frames = sorted(adir.glob("frame_*.png"))
            for fr in frames:
                dst = OUT / "characters" / char / anim / fr.name
                key_file(fr, dst, "sheet", 256)


def make_white_flash_placeholder():
    im = Image.new("RGBA", (8, 8), (255, 255, 255, 255))
    im.save(ASSETS / "fx" / "white.png")
    im = Image.new("RGBA", (8, 8), (255, 40, 40, 255))
    im.save(ASSETS / "fx" / "red.png")
    im = Image.new("RGBA", (4, 64), (255, 240, 80, 180))
    im.save(ASSETS / "fx" / "beam.png")


def make_water():
    im = Image.new("RGBA", (256, 64), (20, 80, 140, 90))
    d = ImageDraw.Draw(im)
    for x in range(0, 256, 16):
        d.arc((x, 0, x + 32, 20), 0, 180, fill=(180, 230, 255, 140), width=2)
    im.save(ASSETS / "fx" / "water.png")


def make_button():
    for state, col in (("n", (40, 20, 60)), ("h", (80, 40, 110)), ("p", (20, 10, 30))):
        im = Image.new("RGBA", (280, 48), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((1, 1, 278, 46), radius=8, fill=col, outline=(240, 190, 40), width=3)
        im.save(ASSETS / "ui" / f"btn_{state}.png")


def main():
    ensure(OUT)
    ensure(ASSETS / "items")
    ensure(ASSETS / "fx")
    ensure(ASSETS / "ui")
    ensure(ASSETS / "tiles")
    print("Baking heroes / props / tiles...")
    bake_green_heroes()
    bake_props()
    bake_tiles()
    print("Baking character frames...")
    bake_characters()
    print("Drawing HUD / items / FX...")
    make_icon("H", (30, 60, 160), (255, 255, 255), (240, 200, 40), "hmg")
    make_icon("S", (40, 130, 50), (255, 255, 255), (240, 200, 40), "shot")
    make_icon("R", (160, 40, 40), (255, 255, 255), (240, 200, 40), "rocket")
    make_icon("F", (200, 90, 20), (255, 255, 255), (240, 200, 40), "flame")
    make_icon("L", (40, 200, 210), (10, 20, 40), (240, 200, 40), "laser")
    make_icon("C", (140, 40, 180), (255, 255, 255), (240, 200, 40), "chaser")
    make_icon("I", (90, 90, 90), (255, 255, 255), (240, 200, 40), "lizard")
    make_icon("G", (40, 90, 40), (255, 255, 255), (240, 200, 40), "sgren")
    for k in ("apple", "hotdog", "pineapple", "chao", "life", "bomb", "medal"):
        make_food(k)
    for name, col, w, h in (
        ("pistol", (255, 220, 80), 14, 8),
        ("hmg", (255, 240, 140), 16, 6),
        ("shot", (255, 180, 40), 10, 10),
        ("rocket", (220, 60, 30), 24, 10),
        ("laser", (80, 255, 220), 28, 6),
        ("flame", (255, 120, 20), 18, 14),
        ("chaser", (200, 80, 255), 14, 14),
        ("enemy", (255, 60, 60), 12, 8),
        ("orb", (80, 255, 160), 16, 16),
        ("rock", (140, 120, 100), 18, 18),
    ):
        make_bullet(name, col, w, h)
    make_grenade()
    make_muzzle()
    make_explosion_sheet()
    make_particle("spark", (255, 230, 80), 8)
    make_particle("smoke", (50, 40, 40, 160), 16)
    make_particle("blood", (180, 20, 40), 8)
    make_particle("gold", (240, 190, 40), 8)
    make_hud_panel()
    make_platform("city", (80, 70, 90), (50, 40, 50))
    make_platform("jungle", (40, 110, 60), (50, 40, 20))
    make_platform("canyon", (140, 110, 80), (90, 70, 50))
    make_platform("marine", (50, 90, 110), (30, 50, 70))
    make_platform("void", (40, 20, 50), (20, 8, 28))
    make_deco()
    make_white_flash_placeholder()
    make_water()
    make_button()
    print("Done.")


if __name__ == "__main__":
    main()
