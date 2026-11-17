"""Tile lingkungan + elemen UI pixel art, dibuat langsung dengan Pillow (datar, tanpa Blender), hanya pakai warna palet.

  python art/tools/tiles.py   -> art/out/sprites/tile_*.png, ui_*.png (lalu jalankan pack_atlas.py)
Ukuran dalam piksel art (layar = 2x).
"""
import json
import os
import random

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "out", "sprites")
os.makedirs(DST, exist_ok=True)

with open(os.path.join(ROOT, "palette.json"), encoding="utf8") as f:
    P = {c["name"]: tuple(int(c["hex"][i:i + 2], 16) for i in (1, 3, 5)) for c in json.load(f)["colors"]}

rnd = random.Random(7)  # deterministik: hasil sama tiap dijalankan


def save(im, name):
    im.save(os.path.join(DST, f"{name}.png"))


def speckle(im, base, tones, density):
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            px[x, y] = P[base] + (255,)
    for _ in range(int(im.size[0] * im.size[1] * density)):
        px[rnd.randrange(im.size[0]), rnd.randrange(im.size[1])] = P[rnd.choice(tones)] + (255,)


# ---- tile 32x32 ----
def tile_dirt():
    im = Image.new("RGBA", (32, 32))
    speckle(im, "dirt", ["dirt_light", "dirt_dark"], 0.08)
    save(im, "tile_dirt")


def tile_road():
    im = Image.new("RGBA", (32, 32))
    speckle(im, "gray", ["gray_light", "gray_dark"], 0.08)
    save(im, "tile_road")


def tile_berm():
    im = Image.new("RGBA", (32, 32))
    speckle(im, "dirt_dark", ["dirt", "coal_light"], 0.12)
    for x in range(32):
        im.putpixel((x, 0), P["dirt"] + (255,))
        im.putpixel((x, 1), P["dirt_light"] + (255,))
    save(im, "tile_berm")


def tile_pit():
    im = Image.new("RGBA", (32, 32))
    speckle(im, "coal_light", ["coal", "gray_dark"], 0.1)
    save(im, "tile_pit")


def tile_grass():
    im = Image.new("RGBA", (32, 32))
    speckle(im, "green", ["green_light", "green_dark"], 0.1)
    save(im, "tile_grass")


# ---- UI ----
def rect(im, x0, y0, x1, y1, color):
    for y in range(y0, y1):
        for x in range(x0, x1):
            im.putpixel((x, y), P[color] + (255,))


def ui_button(name, face, hi, shadow):
    """Tombol 24x24 bergaya pixel: dipakai nine-slice (sudut 6 px)."""
    im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    rect(im, 1, 1, 23, 23, "outline")
    rect(im, 2, 2, 22, 22, shadow)
    rect(im, 2, 2, 22, 20, face)
    rect(im, 3, 3, 21, 5, hi)
    for x, y in ((1, 1), (22, 1), (1, 22), (22, 22), (0, 0), (23, 0), (0, 23), (23, 23)):
        im.putpixel((x, y), (0, 0, 0, 0))
    save(im, name)


def ui_panel(name, face, edge):
    im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    rect(im, 0, 0, 24, 24, "outline")
    rect(im, 1, 1, 23, 23, edge)
    rect(im, 2, 2, 22, 22, face)
    for x, y in ((0, 0), (23, 0), (0, 23), (23, 23)):
        im.putpixel((x, y), (0, 0, 0, 0))
    save(im, name)


def ui_bar(name, fill):
    """Isi bar 8x8 (di-scale lebar di game)."""
    im = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    rect(im, 0, 0, 8, 8, fill)
    rect(im, 0, 0, 8, 2, fill if fill == "white" else {"green": "green_light", "red": "orange_light", "yellow": "yellow_hi"}.get(fill, "white"))
    save(im, name)


def ui_sign_speed():
    """Rambu batas kecepatan 24x24: lingkaran merah bergaris putih."""
    im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    cx = cy = 11.5
    for y in range(24):
        for x in range(24):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= 11.8:
                im.putpixel((x, y), P["outline"] + (255,))
            if d <= 11:
                im.putpixel((x, y), P["red"] + (255,))
            if d <= 8:
                im.putpixel((x, y), P["white"] + (255,))
    save(im, "ui_sign_speed")


tile_dirt()
tile_road()
tile_berm()
tile_pit()
tile_grass()
ui_button("ui_button", "yellow", "yellow_hi", "yellow_shadow")
ui_button("ui_button_red", "red", "orange_light", "red_dark")
ui_button("ui_button_green", "green", "green_light", "green_dark")
ui_panel("ui_panel", "charcoal", "gray_dark")
ui_panel("ui_panel_light", "gray_pale", "gray_light")
for c in ("green", "red", "yellow", "white"):
    ui_bar(f"ui_bar_{c}", c)
ui_sign_speed()
print("tile + ui ->", DST)
