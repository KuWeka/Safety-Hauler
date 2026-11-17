"""Kunci render Blender ke palet Safety Hauler + outline 1 piksel + contact sheet preview.

  python art/tools/quantize.py [folder_raw] [folder_sprites]
Default: art/out/raw -> art/out/sprites, preview di art/out/preview.png
"""
import json
import os
import sys
from collections import OrderedDict

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALPHA_CUTOFF = 128  # alpha di bawah ini dibuang: tepi tajam, tanpa semi-transparan


def load_palette():
    with open(os.path.join(ROOT, "palette.json"), encoding="utf8") as f:
        cols = json.load(f)["colors"]
    out = []
    for c in cols:
        h = c["hex"].lstrip("#")
        out.append((c["name"], tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))))
    return out


PALETTE = load_palette()
OUTLINE = PALETTE[0][1]
_cache = {}


def nearest(rgb):
    """Warna palet terdekat (jarak 'redmean' ~ lebih sesuai persepsi daripada RGB biasa)."""
    hit = _cache.get(rgb)
    if hit:
        return hit
    r, g, b = rgb
    best, best_d = PALETTE[1][1], 1e18  # indeks 0 (outline) hanya untuk garis tepi dan mata
    for name, (pr, pg, pb) in PALETTE:
        rm = (r + pr) / 2
        d = (2 + rm / 256) * (r - pr) ** 2 + 4 * (g - pg) ** 2 + (2 + (255 - rm) / 256) * (b - pb) ** 2
        if d < best_d:
            best, best_d = (pr, pg, pb), d
    _cache[rgb] = best
    return best


def quantize(img):
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    out = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))  # +1 piksel tiap sisi untuk outline
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a >= ALPHA_CUTOFF:
                op[x + 1, y + 1] = (*nearest((r, g, b)), 255)
    # Outline luar: piksel transparan yang bersebelahan (4 arah) dengan piksel solid.
    ow, oh = out.size
    edge = []
    for y in range(oh):
        for x in range(ow):
            if op[x, y][3] == 0 and any(
                0 <= x + dx < ow and 0 <= y + dy < oh and op[x + dx, y + dy][3] == 255
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
                edge.append((x, y))
    for x, y in edge:
        op[x, y] = (*OUTLINE, 255)
    return out


def contact_sheet(groups, scale=3):
    """groups: {nama: [Image, ...]} -> satu gambar, tiap grup satu baris, diperbesar nearest-neighbor."""
    pad = 8
    row_h = [max(i.size[1] for i in imgs) * scale + pad for imgs in groups.values()]
    width = max(sum(i.size[0] * scale + pad for i in imgs) for imgs in groups.values()) + pad
    sheet = Image.new("RGBA", (width, sum(row_h) + pad), (58, 74, 90, 255))
    y = pad
    for (name, imgs), rh in zip(groups.items(), row_h):
        x = pad
        for im in imgs:
            big = im.resize((im.size[0] * scale, im.size[1] * scale), Image.NEAREST)
            sheet.alpha_composite(big, (x, y))
            x += big.size[0] + pad
        y += rh
    return sheet


def main():
    raw = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", "raw")
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "out", "sprites")
    os.makedirs(dst, exist_ok=True)
    groups = OrderedDict()
    for fn in sorted(os.listdir(raw)):
        if not fn.endswith(".png"):
            continue
        sprite = quantize(Image.open(os.path.join(raw, fn)))
        sprite.save(os.path.join(dst, fn))
        groups.setdefault(fn.rsplit("_", 1)[0], []).append(sprite)
    sheet = contact_sheet(groups)
    sheet.save(os.path.join(ROOT, "out", "preview.png"))
    used = {tuple(c[:3]) for imgs in groups.values() for im in imgs for c in im.getdata() if c[3]}
    print(f"{sum(len(v) for v in groups.values())} sprite -> {dst}; warna terpakai {len(used)}/{len(PALETTE)}")


if __name__ == "__main__":
    main()
