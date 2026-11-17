"""Render style reference: 1 karakter + 1 HD, 8 arah.
Jalankan (dari root repo):
  "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P art/blender/render_reference.py -- art/out/raw
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common  # noqa: E402
import models  # noqa: E402

out_dir = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "art/out/raw"

# (builder, nama, lebar px, tinggi px, ortho_scale = tinggi dunia yang muat di kanvas, tinggi target kamera)
JOBS = [
    (models.character, "character", 96, 128, 4.6, 1.5),  # ± 28 px per satuan: close-up (APD, kustomisasi, kartu)
    (models.hd_truck, "hd_truck", 128, 128, 9.5, 1.6),  # ± 13 px per satuan: gameplay hauling/dumping
]

for build, name, w, h, scale, target_z in JOBS:
    common.reset_scene()
    root = build()
    common.setup_render(w, h, scale, target_z)
    common.render_directions(root, name, out_dir)
print("RENDER DONE", out_dir)
