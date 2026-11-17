"""Kemas semua sprite (art/out/sprites) jadi satu texture atlas Phaser + JSON.

  python art/tools/pack_atlas.py        -> game/public/art/atlas.png + atlas.json
Nama frame = nama file tanpa .png (misal hd_truck_0, boss_marah).
"""
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "out", "sprites")
DST = os.path.join(os.path.dirname(ROOT), "game", "public", "art")
ATLAS_W = 1024
PAD = 1  # jarak antar sprite supaya tidak bocor saat di-skala nearest


def main():
    names = sorted(f for f in os.listdir(SRC) if f.endswith(".png"))
    sprites = [(n[:-4], Image.open(os.path.join(SRC, n)).convert("RGBA")) for n in names]
    sprites.sort(key=lambda s: -s[1].size[1])  # shelf packing: tinggi terbesar dulu

    x = y = shelf_h = 0
    placed = []
    for name, im in sprites:
        w, h = im.size
        if x + w + PAD > ATLAS_W:
            x, y, shelf_h = 0, y + shelf_h + PAD, 0
        placed.append((name, im, x, y))
        x += w + PAD
        shelf_h = max(shelf_h, h)
    height = 1
    while height < y + shelf_h + PAD:
        height *= 2

    atlas = Image.new("RGBA", (ATLAS_W, height), (0, 0, 0, 0))
    frames = {}
    for name, im, px, py in placed:
        atlas.alpha_composite(im, (px, py))
        w, h = im.size
        frames[name] = {
            "frame": {"x": px, "y": py, "w": w, "h": h},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
            "sourceSize": {"w": w, "h": h},
        }
    os.makedirs(DST, exist_ok=True)
    atlas.save(os.path.join(DST, "atlas.png"), optimize=True)
    with open(os.path.join(DST, "atlas.json"), "w", encoding="utf8") as f:
        json.dump({"frames": frames, "meta": {"image": "atlas.png", "size": {"w": ATLAS_W, "h": height}, "scale": "1"}}, f, separators=(",", ":"))
    kb = os.path.getsize(os.path.join(DST, "atlas.png")) / 1024
    print(f"{len(frames)} frame, atlas {ATLAS_W}x{height}, {kb:.0f} KB -> {DST}")


if __name__ == "__main__":
    main()
