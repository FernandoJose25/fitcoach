"""Movimiento real (captura de Mixamo o generado con HY-Motion) sobre el humano MPFB de build_anim.py.

Importa un FBX de Mixamo "Without Skin" o de HY-Motion (esqueleto SMPL-H) y copia, hueso por hueso, el
cambio de rotación respecto del reposo, en espacio de mundo. Ambos reposan en T y MPFB en A: antes de
copiar se alinea la dirección de reposo de cada hueso fuente con la del destino, así los brazos no
quedan desfasados. La pelvis recibe además la traslación (escalada por la altura de cadera) y al final
el cuerpo se apoya en el suelo. Los FBX viven en `mocap/` y no se versionan (licencia de Mixamo).
"""
import bpy
from mathutils import Matrix, Vector

# Hueso del rig `game_engine` de MPFB → hueso de Mixamo (sin el prefijo "mixamorig:").
CORE = {
    "pelvis": "Hips", "spine_01": "Spine", "spine_02": "Spine1", "spine_03": "Spine2",
    "neck_01": "Neck", "head": "Head",
}
LIMBS = {
    "clavicle": "Shoulder", "upperarm": "Arm", "lowerarm": "ForeArm", "hand": "Hand",
    "thigh": "UpLeg", "calf": "Leg", "foot": "Foot", "ball": "ToeBase",
}
FINGERS = {"thumb": "Thumb", "index": "Index", "middle": "Middle", "ring": "Ring", "pinky": "Pinky"}
# Mismo mapa para el esqueleto SMPL-H de HY-Motion (sin prefijo; lados "L_"/"R_", dedos "L_Index1").
CORE_SMPLH = {"pelvis": "Pelvis", "spine_01": "Spine1", "spine_02": "Spine2", "spine_03": "Spine3",
              "neck_01": "Neck", "head": "Head"}
LIMBS_SMPLH = {"clavicle": "Collar", "upperarm": "Shoulder", "lowerarm": "Elbow", "hand": "Wrist",
               "thigh": "Hip", "calf": "Knee", "foot": "Ankle", "ball": "Foot"}
# Articulación siguiente de cada hueso (MPFB): la dirección de reposo se mide de articulación a articulación,
# no por el eje Y del hueso, que en los FBX de Mixamo no siempre apunta al hijo.
NEXT = {"pelvis": "spine_01", "spine_01": "spine_02", "spine_02": "spine_03", "spine_03": "neck_01", "neck_01": "head"}
for _s in "lr":
    NEXT.update({f"clavicle_{_s}": f"upperarm_{_s}", f"upperarm_{_s}": f"lowerarm_{_s}", f"lowerarm_{_s}": f"hand_{_s}",
                 f"hand_{_s}": f"middle_01_{_s}", f"thigh_{_s}": f"calf_{_s}", f"calf_{_s}": f"foot_{_s}", f"foot_{_s}": f"ball_{_s}"})
    for _f in FINGERS:
        NEXT.update({f"{_f}_01_{_s}": f"{_f}_02_{_s}", f"{_f}_02_{_s}": f"{_f}_03_{_s}"})


def bone_map(src):
    """{hueso MPFB: hueso fuente} con los que existan en el FBX (Mixamo con prefijo variable, o SMPL-H)."""
    if "Pelvis" in src.data.bones:  # HY-Motion
        # Sin dedos: HY-Motion solo genera 22 articulaciones y deja la mano plana y abierta. Quedan los del
        # ejercicio (`grip` de exercises.py), que cierran la mano sobre la botella o la barra.
        m = dict(CORE_SMPLH)
        for side in "lr":
            s = side.upper()
            m.update({f"{ours}_{side}": f"{s}_{theirs}" for ours, theirs in LIMBS_SMPLH.items()})
        return {t: s for t, s in m.items() if s in src.data.bones}
    prefix = next((b.name.split(":")[0] + ":" for b in src.data.bones if ":" in b.name), "")
    m = dict(CORE)
    for side, word in (("l", "Left"), ("r", "Right")):
        for ours, theirs in LIMBS.items():
            m[f"{ours}_{side}"] = f"{word}{theirs}"
        for ours, theirs in FINGERS.items():
            for i in (1, 2, 3):
                m[f"{ours}_{i:02d}_{side}"] = f"{word}Hand{theirs}{i}"
    return {t: prefix + s for t, s in m.items() if prefix + s in src.data.bones}


def _rot(mat):
    return mat.to_3x3().normalized().to_quaternion()


def _dir(arm, bone, nxt):
    """Dirección de reposo en mundo: hacia la articulación siguiente, o el eje Y si no hay siguiente."""
    b = arm.data.bones[bone]
    if nxt and nxt in arm.data.bones:
        return (arm.matrix_world.to_3x3() @ (arm.data.bones[nxt].head_local - b.head_local)).normalized()
    return (arm.matrix_world.to_3x3() @ (b.matrix_local.to_3x3() @ Vector((0, 1, 0)))).normalized()


def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == "ARMATURE")
    for o in new:
        if o is not arm:
            bpy.data.objects.remove(o)
    return arm


def face_minus_y(src, bmap):
    """El humano de build_anim mira a -Y con su izquierda en +X. Si el FBX mira al revés, se gira 180°."""
    left = src.matrix_world @ src.data.bones[bmap["thigh_l"]].head_local
    right = src.matrix_world @ src.data.bones[bmap["thigh_r"]].head_local
    if left.x < right.x:
        src.matrix_world = Matrix.Rotation(3.14159265, 4, "Z") @ src.matrix_world
        bpy.context.view_layer.update()


def loop_range(src, bmap, f0, f1):
    """Tramo del clip que se repite sin salto: el par de frames (inicio, fin) con la misma postura y la misma
    dirección de movimiento (se comparan también los frames siguientes). El error de cierre se mide en proporción
    a cuánto se mueve el cuerpo dentro del tramo: si no, gana un tramo quieto, que cierra perfecto pero no muestra
    el ejercicio. Los clips de HY-Motion no cierran el bucle solos (los de Mixamo sí).
    Si no hay una repetición que cierre, ida y vuelta (ver abajo). Devuelve (frames del clip a copiar, info)."""
    scene = bpy.context.scene
    keys = [k for k in ("pelvis", "head", "hand_l", "hand_r", "lowerarm_l", "lowerarm_r", "foot_l", "foot_r",
                        "calf_l", "calf_r") if k in bmap]
    feats = []
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        feats.append([src.matrix_world @ src.pose.bones[bmap[k]].head for k in keys])
    n = len(feats)

    def dist(a, b):
        return sum((p - q).length for p, q in zip(feats[a], feats[b])) / len(keys)

    best = (float("inf"), 0, n - 1, 0.0)
    min_span = max(24, int(n * 0.3))  # al menos ~0,8 s: una repetición completa, no un temblor
    for s in range(0, n // 3 + 1):
        amp = 0.0
        for e in range(s + 1, n - 1):
            amp = max(amp, dist(s, e))  # cuánto se aleja el cuerpo de la postura inicial dentro del tramo
            if e - s < min_span:
                continue
            close = (dist(s, e) + dist(s + 1, e + 1)) / 2
            score = close / max(amp, 0.03)
            if score < best[0]:
                best = (score, s, e, close)
    score, s, e, close = best
    span_amp = close / score if score > 0 else 0.0
    if close <= 0.035 and span_amp >= 0.08:  # una repetición completa que cierra: bucle normal
        return list(range(f0 + s, f0 + e)), {"mode": "loop", "loop_error_m": round(close, 3)}
    # Media repetición (sube y se queda, o baja y se queda): ida y vuelta desde que empieza el movimiento
    # hasta su punto más lejano. Las pausas arriba y abajo son las de un ejercicio real.
    prof = [dist(0, f) for f in range(n)]
    top = max(prof) or 1.0
    a = max(0, next(i for i, p in enumerate(prof) if p >= 0.03 * top) - 3)
    b = next(i for i, p in enumerate(prof) if p >= 0.97 * top)
    if b - a < 12:
        b = min(n - 1, a + 12)
    go = list(range(f0 + a, f0 + b + 1))
    return go + go[-2:0:-1], {"mode": "pingpong", "range": [f0 + a, f0 + b], "amp_m": round(top, 3)}


def bake(actor, path):
    """Copia la animación del FBX al rig del actor (IK y objetivos desactivados). Devuelve el nº de frames."""
    rig = actor.rig
    for pb in rig.pose.bones:
        for c in pb.constraints:
            c.mute = True
        pb.rotation_mode = "QUATERNION"
    src = import_fbx(path)
    bmap = bone_map(src)
    face_minus_y(src, bmap)
    act = src.animation_data.action
    f0, f1 = (int(round(v)) for v in act.frame_range)
    scene = bpy.context.scene
    actor.mocap_info = {"clip": [f0, f1]}
    frames = list(range(f0, f1 + 1))
    if "Pelvis" in src.data.bones:  # HY-Motion: una repetición que se repita sin salto
        frames, info = loop_range(src, bmap, f0, f1)
        actor.mocap_info.update(info)

    order = sorted(rig.data.bones, key=lambda b: len(b.parent_recursive))  # padres primero
    rest_rel = {b.name: (b.parent.matrix_local.inverted() @ b.matrix_local if b.parent else b.matrix_local.copy())
                for b in order}
    tw = rig.matrix_world
    t_rest = {t: _rot(tw @ rig.data.bones[t].matrix_local) for t in bmap}
    scene.frame_set(f0)
    s_rest = {}
    for t, s in bmap.items():
        s_mat = src.matrix_world @ src.data.bones[s].matrix_local
        # Reposo de la fuente girado para apuntar como el del destino (T → A): el cambio que se copia es el
        # que lleva el hueso desde "apuntando como el nuestro" hasta su pose en ese frame.
        nxt = NEXT.get(t)
        align = _dir(src, s, bmap.get(nxt)).rotation_difference(_dir(rig, t, nxt if nxt in bmap else None))
        s_rest[s] = align @ _rot(s_mat)
    s_hips = src.matrix_world @ src.data.bones[bmap["pelvis"]].head_local
    t_hips = tw @ rig.data.bones["pelvis"].head_local
    # Altura de cadera medida desde la punta del pie: el origen del FBX de HY-Motion no está en el suelo.
    s_h = s_hips.z - (src.matrix_world @ src.data.bones[bmap["ball_l"]].head_local).z
    t_h = t_hips.z - (tw @ rig.data.bones["ball_l"].head_local).z
    ratio = t_h / s_h if abs(s_h) > 1e-6 else 1.0

    rig.animation_data_clear()
    n = len(frames)
    for i, f in enumerate(frames, start=1):
        scene.frame_set(f)
        pose = {}
        for b in order:
            base = (pose[b.parent.name] if b.parent else Matrix.Identity(4)) @ rest_rel[b.name]
            s = bmap.get(b.name)
            if not s:
                pose[b.name] = base
                continue
            sw = _rot(src.matrix_world @ src.pose.bones[s].matrix)
            dw = sw @ s_rest[s].inverted() @ t_rest[b.name]
            lq = _rot(base).inverted() @ (_rot(tw).inverted() @ dw)
            pb = rig.pose.bones[b.name]
            if pb.rotation_quaternion.dot(lq) < 0 and i > 1:
                lq.negate()  # continuidad para interpolar
            loc = Vector()
            if b.name == "pelvis":
                hs = src.matrix_world @ src.pose.bones[s].head
                want = tw.inverted() @ (t_hips + (hs - s_hips) * ratio)
                loc = base.to_3x3().inverted() @ (want - base.translation)
                pb.location = loc
                pb.keyframe_insert("location", frame=i)
            pb.rotation_quaternion = lq
            pb.keyframe_insert("rotation_quaternion", frame=i)
            pose[b.name] = base @ Matrix.Translation(loc) @ lq.to_matrix().to_4x4()
    bpy.data.objects.remove(src)
    scene.frame_start, scene.frame_end = 1, n
    ground(actor, n)
    return n


def ground(actor, n):
    """Baja o sube el cuerpo entero para que el punto más bajo (pies) quede sobre el suelo."""
    scene = bpy.context.scene
    low = 1e9
    for f in range(1, n + 1, max(1, n // 12)):
        scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        ev = actor.body.evaluated_get(dg)
        me = ev.to_mesh()
        low = min(low, min((ev.matrix_world @ v.co).z for v in me.vertices))
        ev.to_mesh_clear()
    actor.rig.location.z -= low
    bpy.context.view_layer.update()
