"""Model tambahan: kendaraan lain, Pak Bos, rintangan, reklamasi, ikon APD. Menghadap +Y."""
from common import box, cylinder, new_root, sphere
from models import character


def spotter():
    """Spotter dengan helm putih dan bendera aba-aba."""
    return character(skin="skin_b", helmet="white", flag=True)


def excavator(boom=True):
    r = new_root("excavator")
    for x in (-1.5, 1.5):
        box(r, f"track_{x}", (x, 0, 0.55), (1.0, 4.6, 1.1), "gray_dark")
        box(r, f"track_pad_{x}", (x, 0, 0.2), (1.1, 4.7, 0.3), "charcoal")
    box(r, "turret", (0, -0.4, 1.7), (3.2, 3.4, 1.2), "yellow")
    box(r, "turret_stripe", (0, -0.4, 1.2), (3.24, 3.44, 0.2), "orange")
    box(r, "counterweight", (0, -2.2, 1.9), (2.8, 0.9, 1.0), "gray")
    box(r, "cab", (-0.9, 0.9, 2.9), (1.4, 1.5, 1.4), "yellow")
    box(r, "cab_glass", (-0.9, 1.66, 3.0), (1.1, 0.06, 0.9), "sky")
    box(r, "cab_roof", (-0.9, 0.9, 3.7), (1.6, 1.7, 0.18), "yellow_shadow")
    if boom:
        box(r, "boom", (0.5, 3.0, 3.6), (0.6, 4.2, 0.6), "yellow", rot=(0.5, 0, 0))
        box(r, "stick", (0.5, 5.4, 3.7), (0.45, 2.6, 0.45), "yellow_shadow", rot=(-0.6, 0, 0))
        box(r, "bucket", (0.5, 6.5, 2.6), (1.5, 1.1, 1.0), "gray_dark")
        box(r, "bucket_teeth", (0.5, 7.0, 2.2), (1.5, 0.2, 0.25), "gray_light")
    else:  # pangkal saja: lengan dan bucket digerakkan di game
        box(r, "boom_base", (0.5, 1.8, 3.4), (0.7, 1.4, 0.7), "yellow")
    return r


def bucket():
    r = new_root("bucket")
    box(r, "shell", (0, 0, 0.5), (2.2, 1.6, 1.0), "gray_dark")
    box(r, "coal", (0, 0, 1.05), (1.8, 1.2, 0.2), "coal")
    box(r, "teeth", (0, 0.85, 0.2), (2.2, 0.2, 0.3), "gray_light")
    return r


def lv():
    """Light vehicle: pickup putih dengan lampu rotator."""
    r = new_root("lv")
    box(r, "body", (0, 0, 1.0), (2.0, 4.6, 0.9), "white")
    box(r, "cabin", (0, 0.6, 1.8), (1.9, 2.0, 0.8), "gray_pale")
    box(r, "windshield", (0, 1.62, 1.85), (1.6, 0.06, 0.5), "sky")
    box(r, "bed_wall", (0, -1.6, 1.55), (1.9, 1.4, 0.3), "gray_pale")
    box(r, "stripe", (0, 0, 1.0), (2.04, 4.64, 0.16), "green")
    box(r, "beacon", (0, 0.6, 2.35), (0.3, 0.3, 0.3), "orange")
    for y in (1.5, -1.5):
        for x in (-1.05, 1.05):
            cylinder(r, f"wheel_{x}_{y}", (x, y, 0.55), 0.55, 0.45, "charcoal", rot=(0, 1.5708, 0), verts=8)
    return r


def boss(expr="marah"):
    """Pak Bos: potret kepala, 5 ekspresi (marah, kesal, kaget, bangga, jempol)."""
    r = new_root("boss")
    sphere(r, "head", (0, 0, 0), 0.9, "orange_light" if expr == "marah" else "skin_b", scale=(1.0, 0.95, 0.95))
    sphere(r, "helmet", (0, -0.05, 0.62), 0.98, "white", scale=(1.0, 1.0, 0.55))
    box(r, "brim", (0, 0.55, 0.46), (1.7, 0.8, 0.1), "gray_pale")
    for x in (-0.3, 0.3):
        box(r, f"eye_{x}", (x, 0.82, 0.02), (0.16, 0.08, 0.3 if expr == "kaget" else 0.2), "outline")
    tilt = {"marah": 0.5, "kesal": 0.15, "kaget": -0.2, "bangga": -0.1, "jempol": -0.1}[expr]
    box(r, "brow_l", (-0.3, 0.84, 0.28), (0.36, 0.08, 0.08), "outline", rot=(0, -tilt, 0))
    box(r, "brow_r", (0.3, 0.84, 0.28), (0.36, 0.08, 0.08), "outline", rot=(0, tilt, 0))
    box(r, "mustache", (0, 0.86, -0.3), (0.8, 0.1, 0.18), "coal")
    mouth = {
        "marah": ((0.5, 0.08, 0.16), "red_dark"),
        "kesal": ((0.4, 0.08, 0.06), "outline"),
        "kaget": ((0.22, 0.08, 0.3), "red_dark"),
        "bangga": ((0.5, 0.08, 0.1), "white"),
        "jempol": ((0.5, 0.08, 0.1), "white"),
    }[expr]
    box(r, "mouth", (0, 0.86, -0.52), mouth[0], mouth[1])
    if expr == "jempol":
        box(r, "fist", (1.15, 0.5, -0.4), (0.5, 0.45, 0.5), "skin_b")
        box(r, "thumb", (1.15, 0.5, 0.0), (0.2, 0.2, 0.4), "skin_b")
    return r


def hole():
    r = new_root("hole")
    cylinder(r, "rim", (0, 0, 0.02), 1.5, 0.08, "dirt_dark", verts=10)
    cylinder(r, "pit", (0, 0, 0.08), 1.15, 0.1, "coal", verts=10)
    return r


def rock():
    r = new_root("rock")
    sphere(r, "r1", (0, 0, 0.6), 1.0, "gray", scale=(1.2, 1.0, 0.8), subdiv=1)
    sphere(r, "r2", (0.7, 0.4, 0.4), 0.6, "gray_light", scale=(1.0, 1.0, 0.8), subdiv=1)
    sphere(r, "r3", (-0.6, -0.5, 0.35), 0.5, "gray_dark", subdiv=1)
    return r


def puddle():
    r = new_root("puddle")
    cylinder(r, "water", (0, 0, 0.03), 1.6, 0.06, "sky", verts=12)
    cylinder(r, "shine", (-0.4, 0.3, 0.07), 0.5, 0.04, "sky_light", verts=8)
    return r


def soil():
    r = new_root("soil")
    box(r, "patch", (0, 0, 0.1), (2.6, 2.6, 0.2), "dirt_dark")
    for i, (x, y) in enumerate(((-0.7, -0.6), (0.6, 0.7), (0.5, -0.5), (-0.6, 0.6))):
        sphere(r, f"clump{i}", (x, y, 0.28), 0.32, "dirt", scale=(1, 1, 0.5), subdiv=1)
    return r


def seedling(stage=1):
    """Tahap tumbuh 1 (bibit), 2 (anakan), 3 (pohon)."""
    r = new_root(f"seedling{stage}")
    box(r, "soil", (0, 0, 0.1), (2.6, 2.6, 0.2), "dirt_dark")
    h = {1: 0.9, 2: 1.8, 3: 2.6}[stage]
    w = 0.5 if stage == 3 else 0.22
    box(r, "stem", (0, 0, 0.2 + h / 2), (w, w, h), "dirt")
    top = 0.2 + h
    if stage == 1:
        sphere(r, "leaf_l", (-0.4, 0, top), 0.4, "green_light", scale=(1.2, 0.6, 0.5), subdiv=1)
        sphere(r, "leaf_r", (0.4, 0, top + 0.1), 0.4, "green", scale=(1.2, 0.6, 0.5), subdiv=1)
    else:
        sphere(r, "crown", (0, 0, top + 0.5), 0.9 if stage == 2 else 1.5, "green", subdiv=2)
        sphere(r, "crown_hi", (-0.3, 0.1, top + 0.8), 0.5 if stage == 2 else 0.9, "green_light", subdiv=1)
    return r


def icon_helmet():
    r = new_root("helmet")
    sphere(r, "dome", (0, 0, 0.5), 1.2, "yellow", scale=(1, 1, 0.7))
    box(r, "brim", (0, 0.7, 0.35), (2.4, 1.0, 0.14), "yellow_shadow")
    box(r, "ridge", (0, 0, 1.3), (0.24, 1.6, 0.18), "yellow_hi")
    return r


def icon_glasses():
    r = new_root("glasses")
    box(r, "frame", (0, 0, 0.5), (2.6, 0.2, 0.9), "charcoal")
    box(r, "lens_l", (-0.6, 0.12, 0.5), (1.0, 0.1, 0.65), "sky_light")
    box(r, "lens_r", (0.6, 0.12, 0.5), (1.0, 0.1, 0.65), "sky_light")
    return r


def icon_vest():
    r = new_root("vest")
    box(r, "body", (0, 0, 0.8), (2.2, 0.8, 1.9), "orange")
    box(r, "neck", (0, 0.05, 1.6), (0.8, 0.8, 0.5), "orange_shadow")
    box(r, "s1", (0, 0.42, 1.0), (2.24, 0.06, 0.3), "white")
    box(r, "s2", (0, 0.42, 0.45), (2.24, 0.06, 0.3), "white")
    return r


def icon_boots():
    r = new_root("boots")
    for x in (-0.7, 0.7):
        box(r, f"b{x}", (x, 0, 0.5), (0.9, 1.4, 1.0), "charcoal")
        box(r, f"t{x}", (x, 0.6, 0.35), (0.9, 0.4, 0.7), "yellow_shadow")
    return r


def icon_cap():
    r = new_root("cap")
    sphere(r, "dome", (0, 0, 0.5), 1.1, "red", scale=(1, 1, 0.7))
    box(r, "brim", (0, 0.9, 0.3), (1.6, 1.0, 0.12), "red_dark")
    return r


def icon_sandal():
    r = new_root("sandal")
    for x in (-0.6, 0.6):
        cylinder(r, f"sole{x}", (x, 0, 0.1), 0.6, 0.18, "dirt", verts=8)
        box(r, f"strap{x}", (x, 0.1, 0.3), (0.9, 0.18, 0.12), "dirt_dark")
    return r
