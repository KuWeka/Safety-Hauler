"""Model low-poly Safety Hauler (dibangun dari kode supaya konsisten dan gampang diubah).
Semua model menghadap +Y (utara/atas layar). Satuan Blender = meter kira-kira."""
from common import box, cylinder, new_root, sphere


def hd_truck():
    """Heavy dump truck kuning (bak penuh batubara)."""
    r = new_root("hd_truck")
    # Rangka dan roda
    box(r, "chassis", (0, 0, 1.0), (2.1, 5.6, 0.5), "gray_dark")
    for y in (2.1, -1.3, -2.5):
        for x in (-1.25, 1.25):
            cylinder(r, f"wheel_{x}_{y}", (x, y, 0.75), 0.75, 0.7, "charcoal", rot=(0, 1.5708, 0), verts=10)
            cylinder(r, f"hub_{x}_{y}", (x * 1.14, y, 0.75), 0.32, 0.12, "gray_light", rot=(0, 1.5708, 0), verts=8)
    # Kabin
    box(r, "cab", (-0.55, 2.0, 2.0), (1.5, 1.6, 1.6), "yellow")
    box(r, "cab_roof", (-0.55, 2.0, 2.9), (1.7, 1.8, 0.25), "yellow_shadow")
    box(r, "windshield", (-0.55, 2.82, 2.25), (1.2, 0.08, 0.7), "sky")
    box(r, "grille", (-0.55, 2.84, 1.45), (1.3, 0.1, 0.45), "charcoal")
    box(r, "light_l", (-1.15, 2.86, 1.45), (0.22, 0.1, 0.22), "yellow_hi")
    box(r, "light_r", (0.05, 2.86, 1.45), (0.22, 0.1, 0.22), "yellow_hi")
    # Bak dump
    box(r, "bed", (0, -0.6, 2.05), (2.7, 3.9, 1.3), "yellow")
    box(r, "bed_rim", (0, -0.6, 2.72), (2.9, 4.1, 0.18), "yellow_shadow")
    box(r, "canopy", (0, 0.95, 2.9), (2.7, 1.3, 0.45), "yellow")
    box(r, "coal", (0, -0.7, 2.72), (2.4, 3.6, 0.3), "coal")
    box(r, "stripe", (0, -0.6, 1.55), (2.74, 3.92, 0.18), "orange")
    return r


def character(skin="skin_a", helmet="yellow", flag=False):
    """Operator chibi: kepala besar, helm, kacamata safety, rompi reflektif, sepatu safety."""
    r = new_root("character")
    # Kaki + sepatu safety
    for x in (-0.28, 0.28):
        box(r, f"leg_{x}", (x, 0, 0.55), (0.42, 0.42, 0.7), "gray_dark")
        box(r, f"boot_{x}", (x, 0.08, 0.2), (0.5, 0.64, 0.4), "charcoal")
        box(r, f"boot_toe_{x}", (x, 0.34, 0.2), (0.5, 0.14, 0.4), "yellow_shadow")
    # Badan: kaos + rompi oranye dengan garis reflektif
    box(r, "torso", (0, 0, 1.3), (1.0, 0.62, 0.95), "gray")
    box(r, "vest", (0, 0, 1.3), (1.06, 0.68, 0.9), "orange")
    box(r, "vest_stripe_a", (0, 0, 1.45), (1.08, 0.7, 0.14), "white")
    box(r, "vest_stripe_b", (0, 0, 1.12), (1.08, 0.7, 0.14), "white")
    # Lengan + tangan
    for x in (-0.72, 0.72):
        box(r, f"arm_{x}", (x, 0, 1.3), (0.32, 0.36, 0.85), "gray")
        sphere(r, f"hand_{x}", (x, 0.02, 0.8), 0.2, skin, subdiv=1)
    # Kepala chibi: wajah harus kelihatan, helm hanya menutup bagian atas.
    sphere(r, "head", (0, 0, 2.25), 0.8, skin, scale=(1.0, 0.95, 0.92))
    box(r, "eye_l", (-0.27, 0.74, 2.2), (0.15, 0.08, 0.24), "outline")
    box(r, "eye_r", (0.27, 0.74, 2.2), (0.15, 0.08, 0.24), "outline")
    box(r, "mouth", (0, 0.76, 1.88), (0.26, 0.06, 0.07), skin + "_shadow")
    box(r, "cheek_l", (-0.5, 0.68, 2.0), (0.16, 0.06, 0.1), "orange_light")
    box(r, "cheek_r", (0.5, 0.68, 2.0), (0.16, 0.06, 0.1), "orange_light")
    # Kacamata safety (di atas mata) dan helm (setengah bola di atas dahi)
    box(r, "glasses", (0, 0.8, 2.3), (0.9, 0.1, 0.18), "sky_light")
    sphere(r, "helmet", (0, -0.05, 2.78), 0.84, helmet, scale=(1.0, 1.0, 0.55))
    box(r, "helmet_brim", (0, 0.5, 2.62), (1.5, 0.7, 0.09), "yellow_shadow")
    box(r, "helmet_ridge", (0, -0.05, 3.2), (0.16, 1.0, 0.12), "yellow_hi")
    if flag:  # spotter: tongkat + bendera merah di tangan kanan
        box(r, "flag_pole", (0.72, 0.2, 1.7), (0.08, 0.08, 1.8), "gray_light")
        box(r, "flag", (0.72, 0.2, 2.45), (0.6, 0.06, 0.4), "red")
    return r
