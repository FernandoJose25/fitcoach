"""Mancuerna low-poly girando (24 frames, loop perfecto) para el splash de FitCoach.

Renderiza los frames con fondo transparente en --frames (PNG sueltos). El paso
a sprite sheet + WebP animado lo hace pack_dumbbell.py (requiere Pillow).

Uso (desde la raiz del repo):
  python .claude/skills/blender-core/scripts/run_in_blender.py \
    apps/mobile/assets/splash/build_dumbbell_spin.py -- --frames <dir>
"""
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix

FRAMES = 24
RES = 384
COLORS = {"plate": "#5B6676", "handle": "#C8F44D", "collar": "#F0F3F6"}

# (material, x centro, radio, ancho, lados) a lo largo del eje X; se espeja.
PIECES = [
    ("handle", 0.0, 0.017, 0.30, 8),
    ("collar", 0.072, 0.028, 0.022, 8),
    ("plate", 0.105, 0.105, 0.042, 8),
    ("plate", 0.146, 0.082, 0.036, 8),
    ("collar", 0.172, 0.03, 0.016, 8),
]


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]


def make_mat(name, hexstr, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = lin(hexstr)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def build(scene):
    mats = {"plate": make_mat("Plate", COLORS["plate"], 0.55),
            "handle": make_mat("Handle", COLORS["handle"], 0.45),
            "collar": make_mat("Collar", COLORS["collar"], 0.3, 0.6)}
    order = list(mats)
    bm = bmesh.new()
    for kind, x, r, w, sides in PIECES:
        for sx in ((1, -1) if x else (1,)):
            # cilindro sobre Z -> rotado a X; octagono girado medio lado (cara plana abajo)
            mat = (Matrix.Translation((x * sx, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "Y")
                   @ Matrix.Rotation(math.pi / sides, 4, "Z"))
            res = bmesh.ops.create_cone(bm, cap_ends=True, segments=sides, radius1=r, radius2=r,
                                        depth=w, matrix=mat)
            faces = {f for v in res["verts"] for f in v.link_faces}
            for f in faces:
                f.material_index = order.index(kind)
    bmesh.ops.bevel(bm, geom=[e for e in bm.edges if len(e.link_faces) == 2
                              and e.calc_face_angle(0) > 1.2],
                    offset=0.003, segments=1, affect="EDGES")
    me = bpy.data.meshes.new("Dumbbell")
    bm.to_mesh(me)
    bm.free()
    for k in order:
        me.materials.append(mats[k])
    ob = bpy.data.objects.new("Dumbbell", me)
    scene.collection.objects.link(ob)
    return ob, sum(len(p.vertices) - 2 for p in me.polygons)


def setup(scene):
    for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = eng
            break
        except TypeError:
            continue
    r = scene.render
    r.resolution_x = r.resolution_y = RES
    r.film_transparent = True
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    try:
        scene.eevee.taa_render_samples = 32
    except AttributeError:
        pass
    w = bpy.data.worlds.new("W")
    scene.world = w
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0.55, 0.58, 0.62, 1)
    bg.inputs["Strength"].default_value = 0.5

    cd = bpy.data.cameras.new("Cam")
    cd.lens = 85
    cam = bpy.data.objects.new("Cam", cd)
    scene.collection.objects.link(cam)
    elev = math.radians(18)
    dist = 1.0
    cam.location = (0, -dist * math.cos(elev), dist * math.sin(elev))
    cam.rotation_euler = (math.pi / 2 - elev, 0, 0)
    scene.camera = cam
    # key, relleno y contraluz verde-lima suave para separar del fondo oscuro
    for name, e, rot, col in (("Key", 3.2, (45, 0, -35), (1, 1, 1)),
                              ("Fill", 0.8, (70, 0, 60), (1, 1, 1)),
                              ("Rim", 2.0, (-60, 0, 0), (0.85, 1.0, 0.6))):
        ld = bpy.data.lights.new(name, "SUN")
        ld.energy, ld.color = e, col
        lo = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(lo)
        lo.rotation_euler = [math.radians(a) for a in rot]


def main():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = os.path.abspath(a[a.index("--frames") + 1] if "--frames" in a else "frames")
    os.makedirs(out, exist_ok=True)
    scene = bpy.context.scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob)
    setup(scene)
    ob, tris = build(scene)
    files = []
    for i in range(FRAMES):  # 0..345 grados: el frame 24 seria el 0, loop sin salto
        ob.rotation_euler = (0, math.radians(-12), 2 * math.pi * i / FRAMES)
        p = os.path.join(out, f"frame_{i:02d}.png")
        scene.render.filepath = p
        bpy.ops.render.render(write_still=True)
        files.append(os.path.getsize(p))
    print("@@JSON@@" + json.dumps({"ok": True, "tris": tris, "dims": list(ob.dimensions),
                                   "frames": len(files), "min_bytes": min(files)}), flush=True)


main()
