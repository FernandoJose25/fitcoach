"""Animaciones 3D de ejercicios para FitCoach (Blender 5.3 + extensión MPFB 2.0.18, headless).

Humano MPFB (malla MakeHuman, CC0) con rig `game_engine`. Brazos y piernas van por IK hacia
objetivos (manos, pies); pelvis, columna y cabeza por rotaciones en ejes del mundo. Así cada
ejercicio es una lista corta de poses clave (ver `exercises.py`).
Render Cycles (GPU AMD por HIP si está disponible) con fondo transparente: la app pinta el fondo
de un solo color. Solo la luz principal proyecta sombra, suave y bajo el cuerpo (shadow catcher).
Los PNG por frame se juntan en un WebP animado con `assemble_webp.py`.

Uso (desde la raíz del repo; MPFB instalada en el repo de extensiones `user_default`):
  python .claude/skills/blender-core/scripts/run_in_blender.py --user-prefs \
    apps/mobile/assets/anim/build_anim.py -- --out <carpeta_frames> [--only slug1,slug2] [--stills 1,30] [--res 360] [--size 480]
"""
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from exercises import EXERCISES  # noqa: E402

FPS = 24
RES = (720, 540)
SKIN = "#A86F50"    # piel trigueña
MUSCLE = "#C8341F"  # tejido muscular (rojo bermellón profundo): músculos que trabaja el ejercicio
SHORTS = "#2A3644"  # short deportivo en acero oscuro (paleta de la app)
HAIR = "#1C1714"
PROP = "#6F6B64"    # objetos (silla, mochila, botellas): gris medio, legible sobre el fondo oscuro
MACRO = {"gender": 1.0, "age": 0.5, "muscle": 1.0, "weight": 0.36, "proportions": 1.0, "height": 0.6,
         "cupsize": 0.5, "firmness": 0.5, "race": {"asian": 0.33, "caucasian": 0.34, "african": 0.33}}
# Definición muscular de un cuerpo entrenado (targets anatómicos de MakeHuman, 0–1). Se cargan antes del
# rig para que las articulaciones se calculen sobre la forma final.
MUSCLE_TARGETS = {
    "l-upperarm-muscle-incr": 0.8, "r-upperarm-muscle-incr": 0.8,
    "l-upperarm-shoulder-muscle-incr": 0.7, "r-upperarm-shoulder-muscle-incr": 0.7,
    "l-lowerarm-muscle-incr": 0.6, "r-lowerarm-muscle-incr": 0.6,
    "l-upperleg-muscle-incr": 0.7, "r-upperleg-muscle-incr": 0.7,
    "l-lowerleg-muscle-incr": 0.6, "r-lowerleg-muscle-incr": 0.6,
    "torso-muscle-pectoral-incr": 0.6, "torso-muscle-dorsi-incr": 0.6, "stomach-tone-incr": 0.9,
}
# Prueba `--look v2`: cuerpo de gimnasio en vez de delgado (más masa, brazos, piernas y espalda en V).
MACRO_V2 = {**MACRO, "weight": 0.55}
MUSCLE_TARGETS_V2 = {**{k: min(1.0, v + 0.3) for k, v in MUSCLE_TARGETS.items()},
                     "torso-vshape-incr": 0.6, "measure-neck-circ-incr": 0.4}
SPINE = (("spine_01", 0.3), ("spine_02", 0.3), ("spine_03", 0.4))
NECK = (("neck_01", 0.5), ("head", 0.5))
FINGERS = ("index", "middle", "ring", "pinky")
KNEE_POLE = (0.25, -1.2, 0.55)
ELBOW_POLE = (0.6, 0.6, 1.0)


# ---------------------------------------------------------------------------------------------
def lin(hexstr):
    c = [int(hexstr[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]


def world_q(deg):
    """Rotación en grados sobre los ejes X, Y, Z del mundo (en ese orden) → cuaternión."""
    x, y, z = (math.radians(a) for a in deg)
    return Quaternion((0, 0, 1), z) @ Quaternion((0, 1, 0), y) @ Quaternion((1, 0, 0), x)


def to_local(rest_q, q):
    """Rotación de mundo → rotación local de un hueso cuyo reposo (en espacio de armadura) es rest_q."""
    return rest_q.inverted() @ q @ rest_q


def mirror(side, v):
    return Vector(v) if side == "l" else Vector((-v[0], v[1], v[2]))


def mirror_rot(side, deg):
    return tuple(deg) if side == "l" else (deg[0], -deg[1], -deg[2])


def basis(a, b):
    """Base ortonormal (3x3) con columnas a, b⊥, a×b (a manda)."""
    a = Vector(a).normalized()
    b = (Vector(b) - a * a.dot(Vector(b))).normalized()
    return Matrix((a, b, a.cross(b))).transposed()


def side_spec(pose, key, s):
    """Spec por lado: `key_l`/`key_r` (coordenadas del mundo, sin espejar) o `key` (espejada)."""
    if f"{key}_{s}" in pose:
        return pose[f"{key}_{s}"], False
    return pose.get(key), True


def empty(name, mat):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.05
    bpy.context.scene.collection.objects.link(e)
    e.rotation_mode = "QUATERNION"
    e.matrix_world = mat
    return e


def material(name, hexstr, rough=0.5):
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(hexstr)
    b.inputs["Roughness"].default_value = rough
    return m


class Actor:
    def __init__(self, macro=MACRO, targets=MUSCLE_TARGETS):
        self.body = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True,
                                              feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
        for name, w in targets.items():
            TargetService.load_target(self.body, TargetService.target_full_path(name), weight=w)
        self.rig = HumanService.add_builtin_rig(self.body, "game_engine", import_weights=True)
        for pb in self.rig.pose.bones:
            pb.rotation_mode = "QUATERNION"
        sub = self.body.modifiers.new("Subdiv", "SUBSURF")
        sub.levels, sub.render_levels = 0, 1
        for p in self.body.data.polygons:
            p.use_smooth = True
        self.rest = {b.name: b.matrix_local.copy() for b in self.rig.data.bones}
        # Ejes de la mano en su propio espacio: dedos (Y) y palma (+Z de los dedos, hacia donde flexionan).
        self.hand_axes = {}
        for s in "lr":
            r = self.rest[f"hand_{s}"].to_3x3()
            palm = self.rest[f"middle_01_{s}"].to_3x3().col[2]
            fingers = (self.rest[f"middle_01_{s}"].translation - self.rest[f"hand_{s}"].translation).normalized()
            self.hand_axes[s] = basis(r.inverted() @ fingers, r.inverted() @ palm)
        self.t = {}
        for s in "lr":
            self.t[f"foot_{s}"] = empty(f"T_foot_{s}", self.rest[f"foot_{s}"])
            self.t[f"hand_{s}"] = empty(f"T_hand_{s}", self.rest[f"hand_{s}"])
            self.t[f"knee_{s}"] = empty(f"P_knee_{s}", Matrix.Translation(mirror(s, KNEE_POLE)))
            self.t[f"elbow_{s}"] = empty(f"P_elbow_{s}", Matrix.Translation(mirror(s, ELBOW_POLE)))
            for bone, tgt, pole in ((f"calf_{s}", f"foot_{s}", f"knee_{s}"), (f"lowerarm_{s}", f"hand_{s}", f"elbow_{s}")):
                c = self.rig.pose.bones[bone].constraints.new("IK")
                c.target, c.pole_target, c.chain_count = self.t[tgt], self.t[pole], 2
            c = self.rig.pose.bones[f"foot_{s}"].constraints.new("COPY_TRANSFORMS")
            c.target = self.t[f"foot_{s}"]
            c = self.rig.pose.bones[f"hand_{s}"].constraints.new("COPY_ROTATION")
            c.target, c.influence = self.t[f"hand_{s}"], 0.0
        self.poles = self.calibrate_poles()
        self.fingers(12)
        self.rest_co = self.shaped_coords()
        self.eyes = [self.add_eye(s) for s in "lr"]
        self.paint_regions()
        # Posición de reposo como atributo: las fibras del músculo y la trama de la tela no "nadan" al moverse.
        self.body.add_rest_position_attribute = True

    def paint_regions(self):
        """Atributos 'cloth' (short: de la cintura a medio muslo) y 'hair' (cuero cabelludo, corte corto)."""
        me = self.body.data
        co = self.rest_co
        hip = self.rest["thigh_l"].translation
        knee = self.rest["calf_l"].translation
        waist_z, hem_z = hip.z + 0.085, knee.z + 0.62 * (hip.z - knee.z)
        groups = {g.index: g.name for g in self.body.vertex_groups}
        legs = {i for i, n in groups.items() if n in ("pelvis", "thigh_l", "thigh_r", "spine_01")}
        arms = {i for i, n in groups.items() if n.startswith(("upperarm", "lowerarm", "hand", "thumb", *FINGERS))}
        head = next(i for i, n in groups.items() if n == "head")
        eye_idx = {i for i, n in groups.items() if n in ("joint-l-eye", "joint-r-eye")}
        eyes = [co[v.index] for v in me.vertices if any(g.group in eye_idx for g in v.groups)]
        eye = sum(eyes, Vector()) / len(eyes)

        def step(x, w):
            return max(0.0, min(1.0, 0.5 + x / (2 * w)))

        cloth = me.color_attributes.new("cloth", "FLOAT_COLOR", "POINT")
        hair = me.color_attributes.new("hair", "FLOAT_COLOR", "POINT")
        for v in me.vertices:
            p = co[v.index]
            gs = {g.group: g.weight for g in v.groups}
            c = 0.0
            if any(gs.get(i, 0) > 0.02 for i in legs) and not any(gs.get(i, 0) > 0.02 for i in arms):
                c = step(waist_z - p.z, 0.006) * step(p.z - hem_z, 0.006)
            h = 0.0
            if gs.get(head, 0) > 0.5:
                # Coronilla y nuca; deja libres cara, orejas y patillas bajas.
                top = step(p.z - (eye.z + 0.045), 0.008)
                back = step(p.y - (eye.y + 0.105), 0.01) * step(p.z - (eye.z - 0.05), 0.01)
                sides = step(p.z - (eye.z + 0.02), 0.008) * step(p.y - (eye.y + 0.035), 0.01)
                h = max(top, back, sides)
            cloth.data[v.index].color = (c, c, c, 1)
            hair.data[v.index].color = (h, h, h, 1)

    # -- geometría de reposo ------------------------------------------------------------------
    def shaped_coords(self):
        """Posición de cada vértice con los targets de MPFB (sexo, altura, músculo) aplicados."""
        me = self.body.data
        keys = me.shape_keys.key_blocks if me.shape_keys else []
        if not keys:
            return [v.co.copy() for v in me.vertices]
        base = [k.co.copy() for k in keys[0].data]
        out = [c.copy() for c in base]
        for k in keys[1:]:
            if k.value:
                for i, d in enumerate(k.data):
                    out[i] += (d.co - base[i]) * k.value
        return out

    def add_eye(self, s):
        """Globo ocular (MakeHuman deja las cuencas vacías), pegado al hueso de la cabeza."""
        me = self.body.data
        g = self.body.vertex_groups[f"joint-{s}-eye"].index
        co = self.rest_co
        idx = [v.index for v in me.vertices if any(x.group == g for x in v.groups)]
        center = sum((co[i] for i in idx), Vector()) / len(idx)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0118, segments=24, ring_count=12, location=center)
        eye = bpy.context.active_object
        eye.name = f"Eye_{s}"
        for p in eye.data.polygons:
            p.use_smooth = True
        self.bind(eye, "head")
        return eye

    def bind(self, ob, bone):
        """Pega un objeto rígido a un hueso con el mismo rig que el cuerpo (deformación por peso 1)."""
        vg = ob.vertex_groups.new(name=bone)
        vg.add(range(len(ob.data.vertices)), 1.0, "REPLACE")
        ob.modifiers.new("Armature", "ARMATURE").object = self.rig

    def fingers(self, deg, thumb=None):
        """Flexión de los dedos: ~12° relajados, ~70° agarrando un objeto."""
        for s in "lr":
            for f in FINGERS:
                for i, k in (("01", 0.6), ("02", 1.0), ("03", 0.8)):
                    self.rig.pose.bones[f"{f}_{i}_{s}"].rotation_quaternion = Quaternion((1, 0, 0), math.radians(deg * k))
            self.rig.pose.bones[f"thumb_02_{s}"].rotation_quaternion = Quaternion((1, 0, 0), math.radians(thumb if thumb is not None else deg * 0.4))

    def update(self):
        bpy.context.view_layer.update()

    def head(self, bone):
        return self.rig.matrix_world @ self.rig.pose.bones[bone].head

    def calibrate_poles(self):
        """Ángulo de polo que deja la articulación media (rodilla/codo) más cerca de su polo."""
        self.apply({"hips": (0, 0.1, -0.3), "hand": {"shoulder": (0, -0.2, -0.25)}})
        res = {}
        for s in "lr":
            for bone, pole in ((f"calf_{s}", f"knee_{s}"), (f"lowerarm_{s}", f"elbow_{s}")):
                c = self.rig.pose.bones[bone].constraints["IK"]
                best = None
                for a in range(-180, 180, 5):
                    c.pole_angle = math.radians(a)
                    self.update()
                    d = (self.head(bone) - self.t[pole].location).length
                    if best is None or d < best[0]:
                        best = (d, a)
                c.pole_angle = math.radians(best[1])
                res[bone] = best[1]
        self.apply({})
        return res

    # -- poses ---------------------------------------------------------------------------------
    def apply(self, pose):
        """Coloca el cuerpo en `pose` (formato en exercises.py)."""
        rb = self.rig.pose.bones
        pel = rb["pelvis"]
        rest_pel = self.rest["pelvis"]
        delta = Vector(pose["pelvis"]) - rest_pel.translation if "pelvis" in pose else Vector(pose.get("hips", (0, 0, 0)))
        pel.location = rest_pel.to_3x3().inverted() @ delta
        # hips_twist: giro sobre el eje largo del cuerpo (Z de pie) antes de inclinarlo; así una plancha
        # lateral es "girar -90 y tumbar", sin que la inclinación se convierta en ladeo.
        twist_q = Quaternion((0, 0, 1), math.radians(pose.get("hips_twist", 0)))
        pel.rotation_quaternion = to_local(rest_pel.to_quaternion(), world_q(pose.get("hips_rot", (0, 0, 0))) @ twist_q)
        for chain, key, tw in ((SPINE, "spine", pose.get("twist", 0)), (NECK, "head", 0)):
            deg = pose.get(key, (0, 0, 0))
            for name, share in chain:
                q = world_q(tuple(a * share for a in deg)) @ Quaternion((0, 0, 1), math.radians(tw * share))
                rb[name].rotation_quaternion = to_local(self.rest[name].to_quaternion(), q)
        for s in "lr":
            for key, default in (("knee", KNEE_POLE), ("elbow", ELBOW_POLE)):
                spec, mir = side_spec(pose, key, s)
                v = spec if spec is not None else default
                self.t[f"{key}_{s}"].location = mirror(s, v) if (mir or spec is None) else Vector(v)
            spec, mir = side_spec(pose, "foot", s)
            ft = spec or {}
            rest = self.rest[f"foot_{s}"]
            fix = (lambda v: mirror(s, v)) if mir else Vector
            pos = fix(ft["pos"]) if "pos" in ft else rest.translation + fix(ft.get("off", (0, 0, 0)))
            rdeg = ft.get("rot", (0, 0, 0))
            tw = Quaternion((0, 0, 1), math.radians(ft.get("twist", 0)))
            rot = world_q(mirror_rot(s, rdeg) if mir else rdeg) @ tw @ rest.to_quaternion()
            self.t[f"foot_{s}"].matrix_world = Matrix.Translation(pos) @ rot.to_matrix().to_4x4()
            # Dedos de los pies: si el pie se apoya en la punta (rot X entre 0 y 90°) se doblan para quedar
            # planos sobre el suelo en vez de clavarse; `toes` lo fija a mano.
            toes = ft.get("toes", -min(75.0, rdeg[0]) if 0 < rdeg[0] <= 90 else 0.0)
            rb[f"ball_{s}"].rotation_quaternion = to_local(self.rest[f"ball_{s}"].to_quaternion(), Quaternion((1, 0, 0), math.radians(toes)))
        self.update()  # el hombro depende de pelvis + columna
        for s in "lr":
            spec, mir = side_spec(pose, "hand", s)
            hd = spec or {}
            fix = (lambda v: mirror(s, v)) if mir else Vector
            if "pos" in hd:
                pos = fix(hd["pos"])
            elif "shoulder" in hd:
                pos = self.head(f"upperarm_{s}") + fix(hd["shoulder"])
            else:
                pos = self.rest[f"hand_{s}"].translation + fix(hd.get("off", (0, 0, 0)))
            rot = self.rest[f"hand_{s}"].to_3x3()
            if "palm" in hd:  # orientación de la mano por intención: hacia dónde mira la palma y apuntan los dedos
                rot = basis(fix(hd["fingers"]), fix(hd["palm"])) @ self.hand_axes[s].inverted()
            self.t[f"hand_{s}"].matrix_world = Matrix.Translation(pos) @ rot.to_4x4()
        self.update()

    def key(self, frame):
        rb = self.rig.pose.bones
        rb["pelvis"].keyframe_insert("location", frame=frame)
        for name in ("pelvis", *(n for n, _ in SPINE), *(n for n, _ in NECK), "ball_l", "ball_r"):
            rb[name].keyframe_insert("rotation_quaternion", frame=frame)
        for e in self.t.values():
            e.keyframe_insert("location", frame=frame)
            e.keyframe_insert("rotation_quaternion", frame=frame)

    def clear_anim(self):
        for ob in (self.rig, *self.t.values()):
            ob.animation_data_clear()

    def check(self):
        """Diagnóstico de la pose actual: cuánto se hunde el cuerpo bajo el suelo y cuánto le falta a
        cada mano/pie para llegar a su objetivo (IK fuera de alcance)."""
        dg = bpy.context.evaluated_depsgraph_get()
        ev = self.body.evaluated_get(dg)
        me = ev.to_mesh()
        low = min((ev.matrix_world @ v.co).z for v in me.vertices)
        ev.to_mesh_clear()
        miss = {}
        for s in "lr":
            for bone, tgt in ((f"calf_{s}", f"foot_{s}"), (f"lowerarm_{s}", f"hand_{s}")):
                tail = self.rig.matrix_world @ self.rig.pose.bones[bone].tail
                miss[tgt] = round((tail - self.t[tgt].matrix_world.translation).length, 3)
        return round(low, 3), miss

    def hand_rotation(self, on):
        for s in "lr":
            self.rig.pose.bones[f"hand_{s}"].constraints["Copy Rotation"].influence = 1.0 if on else 0.0

    # -- resaltado de músculos -------------------------------------------------------------------
    def highlight(self, spec):
        """Atributo 'hl' = peso de los huesos indicados, filtrado por zona:
        "hueso" | ("hueso", "front"|"back"|"top"|"low"). front/back = delante/detrás del eje del hueso."""
        me = self.body.data
        if "hl" in me.color_attributes:
            me.color_attributes.remove(me.color_attributes["hl"])
        attr = me.color_attributes.new("hl", "FLOAT_COLOR", "POINT")
        parts = []
        for item in spec:
            bone, zone = (item, "") if isinstance(item, str) else item
            if bone not in self.body.vertex_groups:
                continue
            b = self.rig.data.bones[bone]
            parts.append((self.body.vertex_groups[bone].index, zone, (b.head_local + b.tail_local) / 2, b.head_local.copy(), b.tail_local.copy()))
        co = self.rest_co

        def smooth(x, w=0.025):
            return max(0.0, min(1.0, 0.5 + x / (2 * w)))

        for v in me.vertices:
            p = co[v.index]
            best = 0.0
            for g in v.groups:
                for gi, zone, mid, h, t in parts:
                    if g.group != gi:
                        continue
                    f = 1.0  # zonas combinables con "+", p. ej. "front+low" = bíceps sin el deltoides
                    for z in zone.split("+"):
                        if z == "front":
                            f *= smooth(mid.y - p.y)
                        elif z == "back":
                            f *= smooth(p.y - mid.y)
                        elif z == "top":
                            f *= smooth(0.14 - (p - h).length, 0.04)
                        elif z == "low":
                            f *= smooth((p - h).length - 0.12, 0.04)
                    best = max(best, min(1.0, g.weight * 1.4) ** 1.5 * f)
            attr.data[v.index].color = (best, best, best, 1)


# ---------------------------------------------------------------------------------------------
class Props:
    """Objetos de escena (silla, mesa, barra) y de mano (botellas, mochila, toalla, banda)."""

    def __init__(self, actor):
        self.actor = actor
        self.mat = material("Prop", PROP, 0.55)
        self.soft = material("Soft", "#4E4A45", 0.8)
        self.objs = []

    def clear(self):
        for ob in self.objs:
            bpy.data.objects.remove(ob)
        self.objs = []

    def box(self, size, loc, mat=None, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=[math.radians(a) for a in rot])
        ob = bpy.context.active_object
        ob.scale = size
        bev = ob.modifiers.new("Bevel", "BEVEL")
        bev.width, bev.segments = min(size) * 0.18, 3
        ob.data.materials.append(mat or self.mat)
        self.objs.append(ob)
        return ob

    def cyl(self, r, depth, loc, rot=(0, 0, 0), mat=None, verts=24):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=[math.radians(a) for a in rot], vertices=verts)
        ob = bpy.context.active_object
        for p in ob.data.polygons:
            p.use_smooth = True
        ob.data.materials.append(mat or self.mat)
        self.objs.append(ob)
        return ob

    def chair(self, x=0.0, y=0.0, rz=0.0, h=0.46):
        """Silla con el asiento en (x, y); rz gira el respaldo (0 = respaldo hacia +y)."""
        rot = Matrix.Rotation(math.radians(rz), 4, "Z")
        o = Vector((x, y, 0))

        def at(v):
            return o + (rot @ Vector(v).to_4d()).to_3d()

        self.box((0.44, 0.42, 0.05), at((0, 0, h)), rot=(0, 0, rz))
        self.box((0.44, 0.04, 0.42), at((0, 0.2, h + 0.23)), rot=(0, 0, rz))
        for dx in (-0.19, 0.19):
            for dy in (-0.18, 0.18):
                self.box((0.035, 0.035, h), at((dx, dy, h / 2)), rot=(0, 0, rz))

    def table(self, y=0.0, h=0.74, width=1.2, depth=0.7):
        self.box((width, depth, 0.05), (0, y, h))
        for dx in (-width / 2 + 0.05, width / 2 - 0.05):
            for dy in (-depth / 2 + 0.05, depth / 2 - 0.05):
                self.box((0.05, 0.05, h), (dx, y + dy, h / 2))

    def bar(self, z=2.25, y=-0.02, width=1.3):
        self.cyl(0.016, width, (0, y, z), rot=(0, 90, 0), verts=16)
        for dx in (-width / 2, width / 2):
            self.box((0.06, 0.06, z + 0.1), (dx, y, (z + 0.1) / 2))

    def in_hand(self, s, kind):
        """Objeto en la palma, rígido al hueso de la mano (botella o mancuerna)."""
        a = self.actor
        # En mundo: con movimiento capturado el rig ya no está en el origen (mocap.ground lo apoya en el suelo).
        r = a.rig.matrix_world @ a.rest[f"hand_{s}"]
        ax = a.hand_axes[s]  # columnas: dedos, palma, transversal (espacio local de la mano)
        center = r @ (ax.col[0] * 0.075 + ax.col[1] * 0.025)
        across = (r.to_3x3() @ ax.col[2]).normalized()
        q = Vector((0, 0, 1)).rotation_difference(across)
        if kind == "pack":  # mochila colgando de una mano: eje largo a lo largo de los dedos
            fingers = (r.to_3x3() @ ax.col[0]).normalized()
            ob = self.box((0.28, 0.14, 0.34), r @ (ax.col[0] * 0.2 + ax.col[1] * 0.02), mat=self.soft)
            q = Vector((0, 0, -1)).rotation_difference(fingers)
        elif kind == "bottle":
            ob = self.cyl(0.034, 0.24, center, verts=24)
        else:
            ob = self.cyl(0.03, 0.2, center, verts=16)
        ob.rotation_mode = "QUATERNION"
        ob.rotation_quaternion = q
        bpy.context.view_layer.update()
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        a.bind(ob, f"hand_{s}")
        return ob

    def between(self, a_target, b_target, radius, mat=None, hang=None):
        """Toalla o banda entre dos puntos (huesos o empties): cilindro estirado con restricciones."""
        bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=1.0, location=(0, 0, 0), vertices=16)
        ob = bpy.context.active_object
        ob.data.transform(Matrix.Translation((0, 0.5, 0)) @ Matrix.Rotation(math.radians(-90), 4, "X"))  # eje a +Y, base en el origen
        ob.data.materials.append(mat or self.soft)
        for p in ob.data.polygons:
            p.use_smooth = True
        c = ob.constraints.new("COPY_LOCATION")
        c.target, c.subtarget = a_target
        c = ob.constraints.new("STRETCH_TO")
        c.target, c.subtarget = b_target
        c.rest_length, c.volume = 1.0, "NO_VOLUME"
        self.objs.append(ob)
        return ob

    def backpack_on_back(self):
        a = self.actor
        r = a.rig.matrix_world @ a.rest["spine_03"]
        ob = self.box((0.32, 0.16, 0.42), r.translation + Vector((0, 0.17, 0.02)), mat=self.soft)
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        a.bind(ob, "spine_03")

    def backpack_in_hands(self):
        """Mochila colgando del punto medio entre las manos (sin girar: cuelga por peso)."""
        a = self.actor
        ob = self.box((0.3, 0.15, 0.36), (0, 0, -0.2), mat=self.soft)
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        for s, inf in (("l", 1.0), ("r", 0.5)):
            c = ob.constraints.new("COPY_LOCATION")
            c.target, c.subtarget, c.head_tail, c.influence = a.rig, f"hand_{s}", 0.6, inf

    def build(self, specs):
        a = self.actor
        for sp in specs:
            kind = sp["type"]
            if kind == "chair":
                self.chair(sp.get("x", 0.0), sp.get("y", 0.0), sp.get("rz", 0.0), sp.get("h", 0.46))
            elif kind == "table":
                self.table(sp.get("y", 0.0), sp.get("h", 0.74))
            elif kind == "bar":
                self.bar(sp.get("z", 2.25), sp.get("y", -0.02))
            elif kind in ("bottles", "dumbbells"):
                for s in "lr":
                    self.in_hand(s, "bottle" if kind == "bottles" else "dumbbell")
            elif kind == "bottle":
                self.in_hand(sp.get("side", "r"), "bottle")
            elif kind == "backpack_hand":
                self.in_hand(sp.get("side", "r"), "pack")
            elif kind == "backpack_back":
                self.backpack_on_back()
            elif kind == "backpack_hands":
                self.backpack_in_hands()
            elif kind == "towel":
                self.between((a.rig, "hand_l"), (a.rig, "hand_r"), 0.022)
            elif kind == "towel_foot":
                self.between((a.rig, "hand_l"), (a.rig, sp.get("foot", "foot_r")), 0.022)
            elif kind == "band":
                self.between((a.rig, "hand_l"), (a.rig, "hand_r"), 0.012, mat=material("Band", "#8EA4B9", 0.4))


# ---------------------------------------------------------------------------------------------
def use_gpu():
    """Activa la GPU para Cycles (HIP en AMD, luego OptiX/CUDA/oneAPI). False si no hay ninguna."""
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("HIP", "OPTIX", "CUDA", "ONEAPI"):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == kind]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == kind
            return True
    return False


def setup_scene(actor):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU" if use_gpu() else "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.render.resolution_x, scene.render.resolution_y = RES
    scene.render.fps = FPS
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"

    world = bpy.data.worlds.new("W")
    scene.world = world
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.4, 0.4, 0.4, 1)
    bg.inputs["Strength"].default_value = 0.14

    # Piel realista: tono trigueño con dispersión subsuperficial, poros y sombreado de cavidades (AO) que
    # marca la separación entre músculos. Encima, por atributos: músculo trabajado (tejido rojo con fibras),
    # short y cabello.
    mat = bpy.data.materials.new("Skin")
    nt = mat.node_tree
    N, link = nt.nodes, nt.links.new
    bsdf = N["Principled BSDF"]
    bsdf.inputs["Specular IOR Level"].default_value = 0.45
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.4, 0.22)
    bsdf.inputs["Subsurface Scale"].default_value = 0.01

    def attr(name):
        a = N.new("ShaderNodeAttribute")
        a.attribute_name = name
        return a.outputs["Fac"]

    def op(kind, a, b):
        m = N.new("ShaderNodeMath")
        m.operation = kind
        for i, x in enumerate((a, b)):
            if isinstance(x, (int, float)):
                m.inputs[i].default_value = x
            else:
                link(x, m.inputs[i])
        return m.outputs[0]

    def mix_rgb(fac, a, b, blend="MIX"):
        m = N.new("ShaderNodeMix")
        m.data_type, m.blend_type = "RGBA", blend
        if isinstance(fac, float):
            m.inputs["Factor"].default_value = fac
        else:
            link(fac, m.inputs["Factor"])
        for sock, val in zip([x for x in m.inputs if x.type == "RGBA"], (a, b)):
            if isinstance(val, list):
                sock.default_value = val
            else:
                link(val, sock)
        return next(x for x in m.outputs if x.type == "RGBA")

    def mix_f(fac, a, b):
        return op("ADD", op("MULTIPLY", op("SUBTRACT", 1.0, fac), a), op("MULTIPLY", fac, b))

    hl = op("MULTIPLY", attr("hl"), 0.95)
    cloth, hair = attr("cloth"), attr("hair")
    rest = N.new("ShaderNodeAttribute")
    rest.attribute_name = "rest_position"
    # Fibras: ruido muy estirado en vertical (eje largo de piernas y tronco en reposo).
    stretch = N.new("ShaderNodeMapping")
    stretch.inputs["Scale"].default_value = (90, 90, 9)
    link(rest.outputs["Vector"], stretch.inputs["Vector"])
    fib = N.new("ShaderNodeTexNoise")
    fib.inputs["Scale"].default_value = 1.0
    fib.inputs["Detail"].default_value = 4
    link(stretch.outputs["Vector"], fib.inputs["Vector"])
    pores = N.new("ShaderNodeTexNoise")
    pores.inputs["Scale"].default_value = 1400
    weave = N.new("ShaderNodeTexWave")
    weave.inputs["Scale"].default_value = 260
    link(rest.outputs["Vector"], weave.inputs["Vector"])

    base = mix_rgb(cloth, lin(SKIN), lin(SHORTS))
    # Músculo con variación de tono según las fibras; se ve también sobre el short (glúteos, cuádriceps).
    tissue = mix_rgb(0.35, lin(MUSCLE), mix_rgb(fib.outputs["Fac"], lin("#7E1A10"), lin("#E2553A")))
    base = mix_rgb(op("MULTIPLY", hl, op("SUBTRACT", 1.0, op("MULTIPLY", cloth, 0.3))), base, tissue)
    base = mix_rgb(hair, base, lin(HAIR))
    ao = N.new("ShaderNodeAmbientOcclusion")
    ao.inputs["Distance"].default_value = 0.05
    cav = N.new("ShaderNodeMapRange")
    cav.inputs["To Min"].default_value = 0.42
    link(ao.outputs["AO"], cav.inputs["Value"])
    shade = N.new("ShaderNodeCombineColor")
    for k in ("Red", "Green", "Blue"):
        link(cav.outputs["Result"], shade.inputs[k])
    link(mix_rgb(1.0, base, shade.outputs["Color"], "MULTIPLY"), bsdf.inputs["Base Color"])

    skin_only = op("MULTIPLY", op("SUBTRACT", 1.0, cloth), op("SUBTRACT", 1.0, hair))
    link(op("MULTIPLY", skin_only, mix_f(hl, 0.2, 0.05)), bsdf.inputs["Subsurface Weight"])
    link(mix_f(hair, mix_f(cloth, mix_f(hl, 0.46, 0.3), 0.82), 0.6), bsdf.inputs["Roughness"])
    link(op("MULTIPLY", cloth, 0.2), bsdf.inputs["Sheen Weight"])
    # Relieve: poros en la piel, fibras en el músculo, trama en la tela y mechones en el cabello.
    height = op("ADD", op("MULTIPLY", pores.outputs["Fac"], op("MULTIPLY", skin_only, 0.15)),
                op("MULTIPLY", fib.outputs["Fac"], hl))
    height = op("ADD", height, op("MULTIPLY", weave.outputs["Fac"], op("MULTIPLY", cloth, 0.35)))
    height = op("ADD", height, op("MULTIPLY", pores.outputs["Fac"], op("MULTIPLY", hair, 0.9)))
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.002
    link(height, bump.inputs["Height"])
    link(bump.outputs["Normal"], bsdf.inputs["Normal"])
    actor.body.data.materials.clear()
    actor.body.data.materials.append(mat)
    eye_mat = material("Eye", "#17110D", 0.15)
    for ob in actor.eyes:
        ob.data.materials.clear()
        ob.data.materials.append(eye_mat)

    # Suelo invisible que solo recibe la sombra (queda como alfa en el PNG).
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    bpy.context.active_object.is_shadow_catcher = True

    # Clave grande y alta (única con sombra: queda corta, bajo el cuerpo), contra para separar la
    # silueta del fondo y relleno bajo, ambas sin sombra.
    for name, energy, loc, size, shadow in (
        ("Key", 1000, (-1.4, -2.2, 5.2), 3.0, True),
        ("Rim", 650, (2.6, 2.4, 3.2), 1.2, False),
        ("Fill", 200, (3.2, -3.0, 1.4), 4.0, False),
    ):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy, ld.size, ld.use_shadow = energy, size, shadow
        lo = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(lo)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 70
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    return cam


def fit_camera(actor, props, cam, frames, az, el, pad=1.04):
    """Encuadra cuerpo y objetos en todos los frames muestreados desde el azimut/elevación dados."""
    scene = bpy.context.scene
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for f in frames:
        scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        for ob in (actor.body, *[o for o in props.objs if o.get("frame", True)]):
            ev = ob.evaluated_get(dg)
            for c in ev.bound_box:
                p = ev.matrix_world @ Vector(c)
                lo = Vector(map(min, lo, p))
                hi = Vector(map(max, hi, p))
    lo.z = max(lo.z, 0.0)
    center = (lo + hi) / 2
    a, e = math.radians(az), math.radians(el)
    d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    q = (-d).to_track_quat("-Z", "Y")
    right, up = q @ Vector((1, 0, 0)), q @ Vector((0, 1, 0))
    corners = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
    hw = max(abs((c - center).dot(right)) for c in corners)
    hh = max(abs((c - center).dot(up)) for c in corners)
    depth = max(abs((c - center).dot(d)) for c in corners)
    tan_h = 18 / cam.data.lens
    tan_v = tan_h * scene.render.resolution_y / scene.render.resolution_x
    dist = max(hw / tan_h, hh / tan_v) * pad + depth * 0.5
    cam.location = center + d * dist
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = q
    return [round(v, 3) for v in (*lo, *hi)]


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = os.path.abspath(args[args.index("--out") + 1])
    only = args[args.index("--only") + 1].split(",") if "--only" in args else list(EXERCISES)
    stills = args[args.index("--stills") + 1] if "--stills" in args else None  # "1,30" o "auto" (inicio + pico)
    blend = args[args.index("--save") + 1] if "--save" in args else None

    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob)
    look = args[args.index("--look") + 1] if "--look" in args else "v1"
    # --mocap <archivo.fbx>: animación de Mixamo (ver mocap.py) para el ejercicio de --only.
    mocap = os.path.abspath(args[args.index("--mocap") + 1]) if "--mocap" in args else None
    actor = Actor(MACRO_V2, MUSCLE_TARGETS_V2) if look == "v2" else Actor()
    props = Props(actor)
    cam = setup_scene(actor)
    scene = bpy.context.scene
    if "--size" in args:  # resolución final sin bajar las muestras (la app usa 480 px de ancho)
        w = int(args[args.index("--size") + 1])
        scene.render.resolution_x, scene.render.resolution_y = w, round(w * RES[1] / RES[0])
    if "--res" in args:  # vista previa rápida
        w = int(args[args.index("--res") + 1])
        scene.render.resolution_x, scene.render.resolution_y = w, round(w * RES[1] / RES[0])
        scene.cycles.samples = 12
    result = {"ok": True, "gpu": scene.cycles.device, "poles": actor.poles, "exercises": {}}

    for slug in only:
        ex = EXERCISES[slug]
        actor.clear_anim()
        props.clear()
        actor.hand_rotation(ex.get("hand_rot", False))
        actor.fingers(ex.get("grip", 12), ex.get("thumb"))
        issues = []
        if mocap:  # movimiento capturado (Mixamo) en lugar de poses clave
            from mocap import bake
            last = bake(actor, mocap) + 1
        else:
            for frame, pose in ex["keys"]:
                actor.apply(pose)
                actor.key(frame)
                low, miss = actor.check()
                bad = {k: v for k, v in miss.items() if v > 0.03}
                if low < -0.015 or bad:
                    issues.append({"frame": frame, "below_floor": low, "ik_miss": bad})
            last = ex["keys"][-1][0]
        props.build(ex.get("props", []))
        scene.frame_start, scene.frame_end = 1, last - 1
        actor.highlight(ex.get("highlight", []))
        cam_spec = ex.get("camera", {})
        if "--camera" in args:  # prueba de encuadre: --camera az,el
            az, el = (float(v) for v in args[args.index("--camera") + 1].split(","))
            cam_spec = {**cam_spec, "az": az, "el": el}
        bbox = fit_camera(actor, props, cam, range(1, last, 4), cam_spec.get("az", 38), cam_spec.get("el", 6), cam_spec.get("pad", 1.04))
        folder = os.path.join(out, slug)
        os.makedirs(folder, exist_ok=True)
        if stills:
            peak = last // 2 if mocap else ex.get("peak", ex["keys"][len(ex["keys"]) // 2][0])
            frames = [1, peak] if stills == "auto" else [int(x) for x in stills.split(",")]
            for f in frames:
                scene.frame_set(min(f, last - 1))
                scene.render.filepath = os.path.join(folder, f"still_{f:04d}.png")
                bpy.ops.render.render(write_still=True)
        else:
            for f in os.listdir(folder):
                if f[:1].isdigit():
                    os.remove(os.path.join(folder, f))
            scene.render.filepath = os.path.join(folder, "")
            bpy.ops.render.render(animation=True)
        result["exercises"][slug] = {"frames": last - 1, "bbox": bbox, **({"issues": issues} if issues else {}),
                                     **(actor.mocap_info if mocap else {})}

    if blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(blend))
    print("@@JSON@@" + json.dumps(result), flush=True)


main()
