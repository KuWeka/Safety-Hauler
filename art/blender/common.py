"""Helper Blender untuk pipeline pixel art Safety Hauler. Dijalankan di dalam Blender (bpy), bukan Python biasa.

Satu setting kamera + cahaya untuk SEMUA asset (GDD: "satu setting render yang sama"):
orthographic, tampak atas 3/4 (elevasi 55 derajat), cahaya dari kiri-atas, tanpa anti-aliasing.
"""
import json
import math
import os

import bpy

ELEVATION_DEG = 55.0
PALETTE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "palette.json")
_materials = {}


def palette():
    with open(PALETTE_PATH, encoding="utf8") as f:
        return {c["name"]: c["hex"] for c in json.load(f)["colors"]}


PAL = palette()


def _srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def mat(name):
    """Material diffuse polos dari warna palet (by nama)."""
    if name in _materials:
        return _materials[name]
    h = PAL[name].lstrip("#")
    lin = [_srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfDiffuse")
    bsdf.inputs["Color"].default_value = (*lin, 1.0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    _materials[name] = m
    return m


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _materials.clear()


def new_root(name):
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    return root


def _finish(o, name, color, root):
    o.name = name
    o.data.materials.append(mat(color))
    if root is not None:
        o.parent = root
    return o


def box(root, name, loc, size, color, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    return _finish(o, name, color, root)


def sphere(root, name, loc, radius, color, scale=(1, 1, 1), subdiv=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=radius, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bpy.ops.object.shade_flat()
    return _finish(o, name, color, root)


def cylinder(root, name, loc, radius, depth, color, rot=(0, 0, 0), verts=10):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    bpy.ops.object.shade_flat()
    return _finish(o, name, color, root)


def setup_render(width, height, ortho_scale, target_z, elevation=ELEVATION_DEG):
    """Kamera orthographic 3/4, sun kiri-atas, render tanpa AA ke PNG transparan.
    elevation default 55 derajat (gameplay). Potret/ikon UI boleh lebih rendah supaya wajah terbaca."""
    scene = bpy.context.scene
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    scene.render.engine = next(e for e in engines if "EEVEE" in e)
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.filter_size = 0.0  # tanpa anti-aliasing: tepi piksel tajam
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 1

    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.55, 0.58, 0.64, 1)
    bg.inputs[1].default_value = 0.9
    scene.world = world

    sun_data = bpy.data.lights.new("sun", "SUN")
    sun_data.energy = 2.6
    sun_data.angle = 0.0
    sun = bpy.data.objects.new("sun", sun_data)
    # Cahaya datang dari kiri-atas-depan kamera.
    sun.rotation_euler = (math.radians(50), math.radians(8), math.radians(35))
    scene.collection.objects.link(sun)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = ortho_scale
    cam = bpy.data.objects.new("cam", cam_data)
    e = math.radians(elevation)
    d = 30.0
    cam.location = (0, -d * math.cos(e), target_z + d * math.sin(e))
    cam.rotation_euler = (math.radians(90 - elevation), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam


def render_directions(root, name, out_dir, directions=8):
    """Render 8 arah (0 = menghadap utara/atas layar, searah jarum jam)."""
    os.makedirs(out_dir, exist_ok=True)
    for i in range(directions):
        root.rotation_euler = (0, 0, -math.radians(360 / directions * i))
        bpy.context.scene.render.filepath = os.path.join(out_dir, f"{name}_{i}.png")
        bpy.ops.render.render(write_still=True)
