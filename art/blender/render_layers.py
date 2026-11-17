"""Layer karakter modular (tampak depan, elevasi 38) untuk kustomisasi + APD. Semua layer satu kanvas 96x128,
ditumpuk di game: legs, boots/sandal, torso, vest, hands, head, hair, glasses, helmet/cap.
Jalankan:  blender -b -P art/blender/render_layers.py -- <path absolut>/art/out/raw
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import common  # noqa: E402
from common import box, new_root, sphere  # noqa: E402

out_dir = sys.argv[sys.argv.index("--") + 1]
SKINS = ["skin_a", "skin_b", "skin_c"]


def legs():
    r = new_root("legs")
    for x in (-0.28, 0.28):
        box(r, f"leg{x}", (x, 0, 0.55), (0.42, 0.42, 0.7), "gray_dark")
    return r


def boots():
    r = new_root("boots")
    for x in (-0.28, 0.28):
        box(r, f"b{x}", (x, 0.08, 0.2), (0.5, 0.64, 0.4), "charcoal")
        box(r, f"t{x}", (x, 0.34, 0.2), (0.5, 0.14, 0.4), "yellow_shadow")
    return r


def sandal():
    r = new_root("sandal")
    for x in (-0.28, 0.28):
        box(r, f"s{x}", (x, 0.1, 0.06), (0.5, 0.7, 0.12), "dirt")
        box(r, f"st{x}", (x, 0.1, 0.18), (0.42, 0.2, 0.1), "dirt_dark")
    return r


def torso(color):
    r = new_root("torso")
    box(r, "torso", (0, 0, 1.3), (1.0, 0.62, 0.95), color)
    for x in (-0.72, 0.72):
        box(r, f"arm{x}", (x, 0, 1.3), (0.32, 0.36, 0.85), color)
    return r


def torso_f():
    r = torso("green")
    box(r, "skirt", (0, 0, 0.95), (1.2, 0.7, 0.35), "green_dark")
    return r


def vest():
    r = new_root("vest")
    box(r, "vest", (0, 0, 1.3), (1.06, 0.68, 0.9), "orange")
    box(r, "a", (0, 0, 1.45), (1.08, 0.7, 0.14), "white")
    box(r, "b", (0, 0, 1.12), (1.08, 0.7, 0.14), "white")
    return r


def hands(skin):
    r = new_root("hands")
    for x in (-0.72, 0.72):
        sphere(r, f"h{x}", (x, 0.02, 0.8), 0.2, skin, subdiv=1)
    return r


def head(skin):
    r = new_root("head")
    sphere(r, "head", (0, 0, 2.25), 0.8, skin, scale=(1.0, 0.95, 0.92))
    box(r, "eye_l", (-0.27, 0.74, 2.2), (0.15, 0.08, 0.24), "outline")
    box(r, "eye_r", (0.27, 0.74, 2.2), (0.15, 0.08, 0.24), "outline")
    box(r, "mouth", (0, 0.76, 1.88), (0.26, 0.06, 0.07), skin + "_shadow")
    box(r, "cheek_l", (-0.5, 0.68, 2.0), (0.16, 0.06, 0.1), "orange_light")
    box(r, "cheek_r", (0.5, 0.68, 2.0), (0.16, 0.06, 0.1), "orange_light")
    return r


def hair(style):
    r = new_root("hair")
    if style == 0:  # pendek rapi
        sphere(r, "cap", (0, -0.05, 2.55), 0.86, "coal", scale=(1.0, 1.0, 0.62))
    elif style == 1:  # jabrik
        sphere(r, "cap", (0, -0.05, 2.55), 0.84, "coal", scale=(1.0, 1.0, 0.55))
        for i in range(-2, 3):
            box(r, f"spike{i}", (i * 0.32, 0.0, 3.0 + (0.12 if i % 2 == 0 else 0)), (0.2, 0.2, 0.5), "coal_light")
    else:  # panjang
        sphere(r, "cap", (0, -0.05, 2.55), 0.88, "coal", scale=(1.0, 1.0, 0.62))
        for x in (-0.82, 0.82):
            box(r, f"side{x}", (x, -0.1, 2.0), (0.28, 0.5, 1.2), "coal")
    return r


def hair_back():
    """Rambut panjang bagian belakang: ditumpuk DI BAWAH layer kepala."""
    r = new_root("hairback")
    box(r, "back", (0, -0.6, 2.0), (1.5, 0.5, 1.5), "coal")
    return r


def glasses():
    r = new_root("glasses")
    box(r, "g", (0, 0.8, 2.3), (0.9, 0.1, 0.18), "sky_light")
    return r


def helmet():
    r = new_root("helmet")
    sphere(r, "helmet", (0, -0.05, 2.78), 0.84, "yellow", scale=(1.0, 1.0, 0.55))
    box(r, "brim", (0, 0.5, 2.62), (1.5, 0.7, 0.09), "yellow_shadow")
    box(r, "ridge", (0, -0.05, 3.2), (0.16, 1.0, 0.12), "yellow_hi")
    return r


def cap():
    r = new_root("cap")
    sphere(r, "dome", (0, -0.05, 2.75), 0.84, "red", scale=(1.0, 1.0, 0.5))
    box(r, "brim", (0, 0.62, 2.6), (1.3, 0.7, 0.08), "red_dark")
    return r


JOBS = [("ch_legs", legs), ("ch_boots", boots), ("ch_sandal", sandal), ("ch_torso_m", lambda: torso("sky")), ("ch_torso_f", torso_f),
        ("ch_vest", vest), ("ch_glasses", glasses), ("ch_helmet", helmet), ("ch_cap", cap)]
JOBS += [(f"ch_hands_{i}", (lambda s=s: hands(s))) for i, s in enumerate(SKINS)]
JOBS += [(f"ch_head_{i}", (lambda s=s: head(s))) for i, s in enumerate(SKINS)]
JOBS += [(f"ch_hair_{i}", (lambda i=i: hair(i))) for i in range(3)]
JOBS += [("ch_hairback_2", hair_back)]

os.makedirs(out_dir, exist_ok=True)
for name, build in JOBS:
    common.reset_scene()
    root = build()
    root.rotation_euler = (0, 0, -math.radians(180))
    common.setup_render(96, 128, 4.6, 1.5, elevation=38)
    bpy.context.scene.render.filepath = os.path.join(out_dir, f"{name}.png")
    bpy.ops.render.render(write_still=True)
print("RENDER DONE", out_dir)
