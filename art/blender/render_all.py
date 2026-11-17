"""Render semua sprite Safety Hauler (selain tile tanah/jalan yang dibuat skrip Pillow).
Jalankan dari root repo (path output HARUS absolut):
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P art/blender/render_all.py -- <path absolut>/art/out/raw
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
import common  # noqa: E402
import models as m0  # noqa: E402
import models_extra as mx  # noqa: E402

out_dir = sys.argv[sys.argv.index("--") + 1]
os.makedirs(out_dir, exist_ok=True)

FRONT = 180  # derajat: menghadap kamera


def single(root, name, angle=FRONT):
    root.rotation_euler = (0, 0, -math.radians(angle))
    bpy.context.scene.render.filepath = os.path.join(out_dir, f"{name}.png")
    bpy.ops.render.render(write_still=True)


# (nama, builder, w, h, ortho_scale, target_z, elevasi, arah: 8 = 8 arah, 1 = hadap kamera, 0 = apa adanya)
JOBS = [
    ("character", m0.character, 96, 128, 4.6, 1.5, 55, 8),
    ("spotter", mx.spotter, 96, 128, 4.6, 1.5, 55, 8),
    ("hd_truck", m0.hd_truck, 128, 128, 9.5, 1.6, 55, 8),
    ("excavator", mx.excavator, 160, 160, 12.5, 1.8, 55, 8),
    ("lv", mx.lv, 96, 96, 7.0, 1.0, 55, 8),
    ("hole", mx.hole, 64, 40, 4.5, 0.0, 55, 0),
    ("rock", mx.rock, 64, 56, 3.8, 0.4, 55, 0),
    ("puddle", mx.puddle, 72, 48, 4.8, 0.0, 55, 0),
    ("soil", mx.soil, 64, 56, 4.6, 0.0, 55, 0),
    ("seedling1", lambda: mx.seedling(1), 64, 64, 4.6, 0.6, 55, 0),
    ("seedling2", lambda: mx.seedling(2), 64, 80, 5.2, 1.0, 55, 0),
    ("seedling3", lambda: mx.seedling(3), 64, 96, 6.0, 1.6, 55, 0),
    ("icon_helmet", mx.icon_helmet, 64, 64, 3.2, 0.6, 38, 1),
    ("icon_glasses", mx.icon_glasses, 64, 40, 3.6, 0.5, 38, 1),
    ("icon_vest", mx.icon_vest, 64, 64, 3.4, 0.8, 38, 1),
    ("icon_boots", mx.icon_boots, 64, 48, 3.4, 0.5, 38, 1),
    ("icon_cap", mx.icon_cap, 64, 56, 3.0, 0.5, 38, 1),
    ("icon_sandal", mx.icon_sandal, 64, 40, 3.0, 0.1, 55, 1),
] + [(f"boss_{e}", (lambda e=e: mx.boss(e)), 96, 96, 3.4, 0.2, 25, 1) for e in ("marah", "kesal", "kaget", "bangga", "jempol")]

for name, build, w, h, scale, tz, elev, dirs in JOBS:
    common.reset_scene()
    root = build()
    common.setup_render(w, h, scale, tz, elevation=elev)
    if dirs == 8:
        common.render_directions(root, name, out_dir)
    else:
        single(root, name, FRONT if dirs == 1 else 0)
print("RENDER DONE", out_dir)
