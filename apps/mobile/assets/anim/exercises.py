"""Ejercicios en casa para build_anim.py: poses clave por ejercicio.

Coordenadas en metros. El humano está de pie mirando a -Y (delante), +Z arriba, su izquierda en +X.
Pose = dict (todo opcional; lo ausente vuelve a la postura de pie):
  pelvis:    posición absoluta del pivote de la pelvis (≈ cadera); o hips = desplazamiento desde reposo.
  hips_rot:  rotación de la pelvis en grados sobre X, Y, Z del mundo (X+ = inclinarse hacia delante;
             90 = boca abajo con la cabeza hacia -Y, -90 = boca arriba con la cabeza hacia +Y).
  spine / head: rotación extra de columna (repartida en 3 vértebras) y cuello+cabeza, mismos ejes.
  hand / foot:  {"pos": absoluta} | {"off": desde reposo} | {"shoulder": desde el hombro posado};
             mano: "palm" + "fingers" (direcciones) si el ejercicio usa hand_rot; pie: "rot" (grados).
             `hand`/`foot` se espejan al lado derecho; `hand_l`/`hand_r`/`foot_l`/`foot_r` no.
  knee / elbow (o _l/_r): punto hacia el que apunta la rodilla / el codo.
Ejercicio: names (nombres del catálogo de la app), keys [(frame, pose)] (el último = el primero, no
se renderiza), highlight (huesos, ver Actor.highlight), camera {az, el}, props, hand_rot, grip, peak.
"""
import math

L_LEG, L_TORSO = 0.927, 0.474   # cadera→tobillo, pivote de pelvis→hombro
L_BODY = L_LEG + L_TORSO

# -- músculos (zonas de peso de los huesos) -------------------------------------------------------
CHEST = [("spine_03", "front"), ("clavicle_l", "front"), ("clavicle_r", "front")]
BACK = [("spine_03", "back"), ("spine_02", "back"), ("clavicle_l", "back"), ("clavicle_r", "back")]
LOWBACK = [("spine_01", "back"), ("spine_02", "back"), ("pelvis", "back")]
LEGS = ["thigh_l", "thigh_r"]
GLUTES = [("pelvis", "back"), ("thigh_l", "back"), ("thigh_r", "back")]
CALVES = [("calf_l", "back"), ("calf_r", "back")]
SHOULDERS = [("upperarm_l", "top"), ("upperarm_r", "top"), "clavicle_l", "clavicle_r"]
REAR_DELTS = [("upperarm_l", "top"), ("upperarm_r", "top"), ("clavicle_l", "back"), ("clavicle_r", "back")]
TRICEPS = [("upperarm_l", "back+low"), ("upperarm_r", "back+low")]
BICEPS = [("upperarm_l", "front+low"), ("upperarm_r", "front+low")]
CORE = [("spine_01", "front"), ("spine_02", "front"), ("pelvis", "front")]

# -- piezas comunes -------------------------------------------------------------------------------
HANG = {"shoulder": (0.06, 0.01, -0.53)}          # brazos colgando relajados
PALM_DOWN = {"palm": (0, 0, -1), "fingers": (0.15, -1, 0)}
STAND = {"hand": HANG}
GRIP = 65                                          # dedos cerrados sobre un objeto


def body(ay, az, sz, head=-1):
    """Cuerpo recto en tabla: tobillos en (ay, az), hombros a altura sz; head=-1 boca abajo con la
    cabeza hacia -Y, +1 boca arriba con la cabeza hacia +Y. Devuelve (pose base, y de hombros, ángulo)."""
    dz = sz - az
    span = math.sqrt(max(L_BODY ** 2 - dz ** 2, 1e-6))
    sy = ay + head * span
    k = L_LEG / L_BODY
    th = math.degrees(math.atan2(-(sy - ay), dz))
    return {"pelvis": (0, ay + (sy - ay) * k, az + dz * k), "hips_rot": (th, 0, 0)}, sy, th


def rep(top, bottom, total=60, hold=6, down=22):
    """Repetición: arriba (pausa) → abajo (pausa) → arriba."""
    return [(1, top), (1 + hold, top), (1 + hold + down, bottom), (1 + hold + down + hold, bottom), (total, top)]


def alt(a, mid, b, total=96):
    """Dos repeticiones alternadas (izquierda y derecha) con paso por la posición neutra."""
    q = total // 4
    return [(1, mid), (q, a), (2 * q, mid), (3 * q, b), (total, mid)]


def hold(pose, total=72, breathe=0.008):
    """Isométrico: la pelvis sube y baja apenas (respiración)."""
    up = dict(pose)
    x, y, z = pose["pelvis"]
    up["pelvis"] = (x, y, z + breathe)
    return [(1, pose), (total // 2, up), (total, pose)]


EXERCISES = {}


def ex(slug, names, keys, **kw):
    EXERCISES[slug] = {"names": names, "keys": keys, **kw}


# ===================================== PECHO (flexiones) ======================================
def pushup_pose(sz, ay=0.89, az=0.155, hand=(0.25, -0.445, 0.05), elbow=(0.55, 0.25, 0.8), feet_x=0.11):
    base, sy, th = body(ay, az, sz, head=-1)
    return {**base, "head": (-12, 0, 0),
            "hand": {"pos": hand, **PALM_DOWN}, "elbow": elbow,
            "foot": {"pos": (feet_x, ay, az), "rot": (th, 0, 0)}, "knee": (0.15, ay - 0.45, -0.6)}


def pushup(slug, names, hand=(0.25, -0.445, 0.05), elbow=(0.55, 0.25, 0.8), top=0.58, bottom=0.25, ay=0.89, az=0.155, props=(), hl=None):
    t = pushup_pose(top, ay, az, hand, elbow)
    b = pushup_pose(bottom, ay, az, hand, elbow)
    ex(slug, names, rep(t, b), highlight=hl or CHEST + TRICEPS, camera={"az": 62, "el": 14}, hand_rot=True, grip=0, props=list(props))


pushup("flexiones", ["Flexiones"])
pushup("flexiones-abiertas", ["Flexiones abiertas"], hand=(0.43, -0.445, 0.05), elbow=(0.85, -0.1, 0.8))
pushup("flexiones-diamante", ["Flexiones diamante"], hand=(0.05, -0.38, 0.05), elbow=(0.3, 0.45, 0.8), hl=TRICEPS + CHEST)
pushup("flexiones-cerradas", ["Flexiones cerradas"], hand=(0.13, -0.42, 0.05), elbow=(0.3, 0.45, 0.8), hl=TRICEPS + CHEST)
# Pies sobre una silla: el cuerpo queda declinado (más hombro y pecho alto).
pushup("flexiones-pies-elevados", ["Flexiones con pies elevados"], ay=1.0, az=0.64, top=0.58, bottom=0.26,
       props=[{"type": "chair", "y": 1.09, "rz": 0}])
# Manos sobre el asiento de una silla: más fácil, cuerpo inclinado.
pushup("flexiones-inclinadas", ["Flexiones inclinadas"], hand=(0.24, -0.5, 0.5), ay=0.60, top=1.02, bottom=0.63,
       props=[{"type": "chair", "y": -0.62, "rz": 180}])

# Explosivas: baja, empuja fuerte y las manos despegan del suelo.
_pt, _pb = pushup_pose(0.58), pushup_pose(0.25)
_air = pushup_pose(0.74)
_air["hand"] = {"pos": (0.25, -0.46, 0.17), **PALM_DOWN}
ex("flexiones-explosivas", ["Flexiones explosivas"],
   [(1, _pt), (6, _pt), (24, _pb), (28, _pb), (36, _air), (42, _pt), (60, _pt)],
   highlight=CHEST + TRICEPS, camera={"az": 62, "el": 14}, hand_rot=True, grip=0, peak=36)

# Flexión y giro a plancha lateral sobre la mano izquierda, brazo derecho al techo.
def side_plank(shoulder_z, hand_l, elbow_l, hand_r, elbow_r):
    """Plancha lateral sobre el lado izquierdo, mirando a -X. La línea del cuerpo pasa por la columna:
    el hombro de apoyo queda 0,21 m por debajo y el tobillo de abajo 0,11 m por debajo."""
    base, sy, th = body(0.0, 0.16, shoulder_z + 0.21, head=-1)
    off = -0.45 - sy                                   # hombros sobre y = -0,45
    px, py, pz = base["pelvis"]
    ay = off
    return {"pelvis": (0.0, py + off, pz + 0.03), "hips_rot": (th, 0, 0), "hips_twist": -90, "head": (0, 0, 0),
            "hand_l": hand_l, "elbow_l": elbow_l, "hand_r": hand_r, "elbow_r": elbow_r,
            "foot_l": {"pos": (0.0, ay, 0.05), "rot": (th, 0, 0), "twist": -90},
            "foot_r": {"pos": (0.0, ay + 0.03, 0.15), "rot": (th, 0, 0), "twist": -90},
            "knee_l": (-0.6, 0.45, 0.2), "knee_r": (-0.6, 0.45, 0.3)}


_side = side_plank(0.575, {"pos": (0.0, -0.45, 0.05), **{"palm": (0, 0, -1), "fingers": (-1, 0, 0)}}, (0.4, -0.3, 0.6),
                   {"pos": (0.0, -0.46, 1.48), "palm": (-1, 0, 0), "fingers": (0, 0, 1)}, (0.3, -0.3, 1.4))
ex("flexion-plancha-lateral", ["Flexión con giro a plancha lateral"],
   [(1, _pt), (6, _pt), (22, _pb), (26, _pb), (42, _pt), (60, _side), (70, _side), (90, _pt)],
   highlight=CHEST + CORE, camera={"az": 40, "el": 16}, hand_rot=True, grip=0, peak=62)


# ===================================== HOMBRO ===================================================
def pike(sz_shoulder, pelvis, th):
    return {"pelvis": pelvis, "hips_rot": (th, 0, 0), "head": (0, 0, 0),
            "hand": {"pos": (0.27, -0.42, 0.05), **PALM_DOWN}, "elbow": (0.6, 0.05, 0.9),
            "foot": {"pos": (0.13, 0.52, 0.13), "rot": (55, 0, 0)}, "knee": (0.2, 0.0, -0.5)}


_pk_top = pike(0.5, (0, 0.085, 0.95), 150)
_pk_bot = pike(0.3, (0, -0.10, 0.81), 160)
ex("flexiones-pica", ["Pike push-ups", "Flexiones en pica"], rep(_pk_top, _pk_bot),
   highlight=SHOULDERS + TRICEPS, camera={"az": 75, "el": 10}, hand_rot=True, grip=0)

BOTTLES = [{"type": "bottles"}]
_hinge = {"hips": (0, 0.16, -0.1), "hips_rot": (58, 0, 0), "spine": (6, 0, 0), "head": (-38, 0, 0), "knee": (0.25, -1.4, 0.6)}

ex("elevaciones-laterales", ["Elevaciones con botellas"],
   rep({"hand": {"shoulder": (0.09, -0.02, -0.52)}, "elbow": (0.7, 0.4, 1.0)},
       {"hand": {"shoulder": (0.5, -0.06, -0.06)}, "elbow": (0.7, 0.4, 1.4)}, down=20),
   highlight=SHOULDERS, props=BOTTLES, grip=GRIP, peak=30)
ex("press-botellas", ["Press con botellas"],
   rep({"hand": {"shoulder": (0.12, -0.06, 0.02)}, "elbow": (0.7, 0.1, 1.0)},
       {"hand": {"shoulder": (0.03, -0.03, 0.53)}, "elbow": (0.9, 0.1, 1.6)}, down=20),
   highlight=SHOULDERS + TRICEPS, props=BOTTLES, grip=GRIP, peak=30)
ex("pajaros-botellas", ["Pájaros con botellas"],
   rep({**_hinge, "hand": {"shoulder": (0.03, -0.02, -0.52)}, "elbow": (0.6, 0.3, 1.2)},
       {**_hinge, "hand": {"shoulder": (0.5, 0.04, -0.14)}, "elbow": (0.6, 0.6, 1.6)}, down=20),
   highlight=REAR_DELTS + BACK, props=BOTTLES, grip=GRIP, camera={"az": 50, "el": 10}, peak=30)
ex("elevaciones-frontales", ["Elevaciones frontales con botellas"],
   rep({"hand": {"shoulder": (0.05, -0.06, -0.52)}, "elbow": (0.6, 0.6, 1.0)},
       {"hand": {"shoulder": (0.05, -0.53, -0.02)}, "elbow": (0.6, 0.5, 1.6)}, down=20),
   highlight=SHOULDERS, props=BOTTLES, grip=GRIP, camera={"az": 60, "el": 6}, peak=30)
ex("aperturas-banda", ["Aperturas con banda elástica"],
   rep({"hand": {"shoulder": (-0.12, -0.52, 0.0)}, "elbow": (0.5, 0.4, 1.2)},
       {"hand": {"shoulder": (0.5, -0.14, 0.0)}, "elbow": (0.5, 0.6, 1.6)}, down=20),
   highlight=REAR_DELTS + BACK, props=[{"type": "band"}], grip=GRIP, camera={"az": 25, "el": 10}, peak=30)


# ===================================== ESPALDA ==================================================
def row_pose(pull):
    return {**_hinge, "hand": {"shoulder": (0.0, 0.14, -0.22) if pull else (0.02, -0.02, -0.52)},
            "elbow": (0.3, 0.9, 1.3)}


ex("remo-mochila", ["Remo con mochila"], rep(row_pose(False), row_pose(True), down=18),
   highlight=BACK + BICEPS, props=[{"type": "backpack_hands"}], grip=GRIP, camera={"az": 70, "el": 8}, peak=28)

_one = {"hips": (0, 0.1, -0.12), "hips_rot": (62, 0, 0), "spine": (4, 0, 0), "head": (-40, 0, 0),
        "foot_l": {"pos": (0.15, -0.38, 0.077)}, "foot_r": {"pos": (-0.18, 0.3, 0.077)},
        "knee": (0.25, -1.4, 0.6), "hand_l": {"pos": (0.2, -0.55, 0.52)}, "elbow_l": (0.7, -0.4, 1.0)}
ex("remo-una-mano", ["Remo a una mano con mochila"],
   rep({**_one, "hand_r": {"shoulder": (-0.03, -0.02, -0.52)}, "elbow_r": (-0.3, 0.9, 1.2)},
       {**_one, "hand_r": {"shoulder": (-0.02, 0.15, -0.22)}, "elbow_r": (-0.3, 0.9, 1.4)}, down=18),
   highlight=BACK + BICEPS, props=[{"type": "chair", "y": -0.62, "x": 0.2, "rz": 180}, {"type": "backpack_hand", "side": "r"}], grip=GRIP,
   camera={"az": 75, "el": 10}, peak=28)

_prone = {"pelvis": (0, 0.0, 0.172), "hips_rot": (90, 0, 0), "knee": (0.15, 0.5, -0.6)}
ex("superman", ["Superman"],
   rep({**_prone, "hand": {"pos": (0.26, -1.0, 0.06), **PALM_DOWN}, "elbow": (0.4, -0.6, 0.6),
        "foot": {"pos": (0.12, 0.93, 0.085), "rot": (160, 0, 0)}},
       {**_prone, "spine": (-18, 0, 0), "head": (-10, 0, 0), "hand": {"pos": (0.26, -0.95, 0.33), **PALM_DOWN}, "elbow": (0.4, -0.6, 0.9),
        "foot": {"pos": (0.12, 0.88, 0.26), "rot": (160, 0, 0)}}, down=18),
   highlight=LOWBACK + GLUTES, hand_rot=True, grip=0, camera={"az": 78, "el": 12}, peak=28)
ex("extension-lumbar", ["Extensión lumbar en el suelo"],
   rep({**_prone, "hand": {"pos": (0.27, 0.06, 0.07), "palm": (0, 0, 1), "fingers": (0, 1, 0)}, "elbow": (0.6, 0.0, 0.5),
        "foot": {"pos": (0.12, 0.93, 0.085), "rot": (160, 0, 0)}},
       {**_prone, "spine": (-30, 0, 0), "head": (-8, 0, 0), "hand": {"pos": (0.27, 0.06, 0.2), "palm": (0, 0, 1), "fingers": (0, 1, 0)},
        "elbow": (0.6, 0.0, 0.6), "foot": {"pos": (0.12, 0.93, 0.085), "rot": (160, 0, 0)}}, down=18),
   highlight=LOWBACK, hand_rot=True, camera={"az": 78, "el": 12}, peak=28)


def pullup(supine):
    palm = (0, 1, 0) if supine else (0, -1, 0)
    hx = 0.2 if supine else 0.33
    bot = {"hips": (0, -0.06, 0.22), "hand": {"pos": (hx, -0.1, 2.26), "palm": palm, "fingers": (0, 0, 1)},
           "elbow": (0.6, 0.1, 1.5) if not supine else (0.35, -0.4, 1.5),
           "foot": {"off": (0, 0.16, 0.3), "rot": (35, 0, 0)}, "knee": (0.2, -1.0, 0.8)}
    top = {**bot, "hips": (0, 0.03, 0.52), "spine": (-8, 0, 0), "head": (-10, 0, 0), "foot": {"off": (0, 0.16, 0.6), "rot": (35, 0, 0)}}
    return bot, top


for _slug, _names, _sup in (("dominadas", ["Dominadas (si tienes barra)"], False), ("dominadas-supinas", ["Dominadas supinas (si tienes barra)"], True)):
    _b, _t = pullup(_sup)
    ex(_slug, _names, rep(_b, _t, down=20), highlight=BACK + BICEPS, hand_rot=True, grip=GRIP,
       props=[{"type": "bar", "z": 2.26, "y": -0.1}], camera={"az": 40, "el": 4}, peak=30)


def inverted_row(top):
    base, sy, th = body(-1.27, 0.09, 0.52 if top else 0.225, head=1)
    return {**base, "head": (12 if top else 0, 0, 0),
            "hand": {"pos": (0.32, 0.12, 0.765), "palm": (0, -1, 0), "fingers": (0, 0.3, 1)}, "elbow": (0.6, -0.1, -0.2),
            "foot": {"pos": (0.12, -1.27, 0.09), "rot": (th, 0, 0)}, "knee": (0.15, -0.7, 1.2)}


ex("remo-invertido-mesa", ["Remo invertido en mesa"], rep(inverted_row(False), inverted_row(True), down=20),
   highlight=BACK + BICEPS, hand_rot=True, grip=GRIP, props=[{"type": "table", "y": 0.45, "h": 0.74}],
   camera={"az": 68, "el": 8}, peak=30)


# ===================================== PIERNA ===================================================
SQ_FEET = {"off": (0.06, 0, 0), "rot": (0, 0, 12)}
SQ_TOP = {**STAND, "foot": SQ_FEET, "knee": (0.3, -1.2, 0.55)}
SQ_BOTTOM = {"hips": (0, 0.2, -0.43), "hips_rot": (16, 0, 0), "spine": (22, 0, 0), "head": (-24, 0, 0),
             "hand": {"shoulder": (-0.02, -0.52, 0.02)}, "foot": SQ_FEET, "knee": (0.32, -1.2, 0.55)}
ex("sentadilla-libre", ["Sentadilla libre"], rep(SQ_TOP, SQ_BOTTOM, total=60, hold=9, down=24), highlight=LEGS + GLUTES[:1], peak=34)
ex("sentadilla-mochila", ["Sentadilla con mochila"],
   rep({**SQ_TOP}, {**SQ_BOTTOM, "hand": {"shoulder": (0.0, -0.18, -0.35)}}, total=60, hold=9, down=24),
   highlight=LEGS + GLUTES[:1], props=[{"type": "backpack_back"}], peak=34)
_jump = {"hips": (0, 0.0, 0.16), "hand": {"shoulder": (0.1, 0.12, -0.5)}, "foot": {"off": (0.06, 0.02, 0.14), "rot": (28, 0, 12)}, "knee": (0.3, -1.2, 0.55)}
_land = {**SQ_BOTTOM, "hips": (0, 0.12, -0.22), "hips_rot": (10, 0, 0), "spine": (12, 0, 0)}
ex("sentadilla-salto", ["Sentadilla con salto"],
   [(1, SQ_TOP), (6, SQ_TOP), (24, SQ_BOTTOM), (28, SQ_BOTTOM), (36, _jump), (44, _land), (60, SQ_TOP)],
   highlight=LEGS + GLUTES[:1], peak=36)


def lunge(front, back_off, hips, back_rot=45):
    """front = lado que adelanta; back_off = desplazamiento del pie de atrás."""
    other = "r" if front == "l" else "l"
    sx = 1 if front == "l" else -1
    return {"hips": hips, "hand": HANG,
            f"foot_{front}": {"off": (0.0, -0.55, 0.0)} if back_off is None else {"off": (0, 0, 0)},
            f"foot_{other}": {"off": back_off or (0, 0.05, 0.05), "rot": (back_rot, 0, 0)},
            f"knee_{front}": (0.14 * sx, -1.5, 0.6), f"knee_{other}": (-0.14 * sx, -0.8, 0.25)}


ex("zancadas", ["Zancadas"],
   alt(lunge("l", None, (0, -0.25, -0.32)), STAND, lunge("r", None, (0, -0.25, -0.32))),
   highlight=LEGS + GLUTES[:1], camera={"az": 70, "el": 6}, peak=24)
ex("zancada-atras", ["Zancada hacia atrás"],
   alt(lunge("l", (0, 0.6, 0.06), (0, 0.12, -0.35), 50), STAND, lunge("r", (0, 0.6, 0.06), (0, 0.12, -0.35), 50)),
   highlight=LEGS + GLUTES[:1], camera={"az": 70, "el": 6}, peak=24)

_bulg = {"hand": HANG, "foot_l": {"pos": (0.12, -0.42, 0.077)}, "foot_r": {"pos": (-0.12, 0.66, 0.55), "rot": (120, 0, 0)},
         "knee_l": (0.15, -1.5, 0.6), "knee_r": (-0.14, -0.8, 0.2)}
ex("sentadilla-bulgara", ["Sentadilla búlgara"],
   rep({**_bulg, "hips": (0, -0.08, -0.07), "spine": (6, 0, 0)}, {**_bulg, "hips": (0, -0.04, -0.42), "hips_rot": (8, 0, 0), "spine": (6, 0, 0)}),
   highlight=LEGS + GLUTES[:1], props=[{"type": "chair", "y": 0.8, "rz": 0}], camera={"az": 75, "el": 6}, peak=30)

_step0 = {"hand": HANG, "hips": (0, -0.12, -0.04), "foot_l": {"pos": (0.12, -0.42, 0.56)}, "foot_r": {"off": (0, 0, 0)},
          "knee": (0.2, -1.4, 0.8)}
_step_mid = {**_step0, "hips": (0, -0.3, 0.22), "foot_r": {"pos": (-0.12, -0.2, 0.72), "rot": (25, 0, 0)}}
_step_top = {**_step0, "hips": (0, -0.42, 0.48), "foot_r": {"pos": (-0.12, -0.42, 0.56)}}
ex("subidas-silla", ["Subidas a una silla"],
   [(1, _step0), (6, _step0), (18, _step_mid), (28, _step_top), (36, _step_top), (48, _step_mid), (60, _step0)],
   highlight=LEGS + GLUTES[:1], props=[{"type": "chair", "y": -0.45, "rz": 180}], camera={"az": 70, "el": 8}, peak=30)

ex("elevacion-talones", ["Elevación de talones"],
   rep(STAND, {**STAND, "hips": (0, -0.03, 0.08), "foot": {"off": (0, -0.045, 0.085), "rot": (30, 0, 0)}}, down=14),
   highlight=CALVES, camera={"az": 60, "el": 4}, peak=24)


def supine_feet(lift):
    """Boca arriba, rodillas flexionadas y pies apoyados; lift = cuánto sube la cadera (puente)."""
    p = {"pelvis": (0, 0.0, 0.163), "hips_rot": (-90, 0, 0),
         "hand": {"pos": (0.3, -0.05, 0.04), "palm": (0, 0, -1), "fingers": (0, -1, 0)}, "elbow": (0.6, 0.2, 0.6),
         "foot": {"pos": (0.15, -0.44, 0.095)}, "knee": (0.2, -0.3, 1.1)}
    if lift:
        # Tronco recto de la cadera a los omóplatos apoyados en el suelo; el cuello se flexiona.
        pz = 0.163 + lift
        a = math.degrees(math.asin(min(1.0, (pz - 0.13) / L_TORSO)))
        p.update({"pelvis": (0, 0.475 - L_TORSO * math.cos(math.radians(a)), pz), "hips_rot": (-90 - a, 0, 0), "head": (a * 0.9, 0, 0),
                  "hand": {"pos": (0.3, 0.1, 0.04), "palm": (0, 0, -1), "fingers": (0, -1, 0)}})
    return p


ex("puente-gluteo", ["Puente de glúteo"], rep(supine_feet(0), supine_feet(0.25), down=18),
   highlight=GLUTES, hand_rot=True, grip=0, camera={"az": 80, "el": 12}, peak=28)
_sl_bot = {**supine_feet(0), "foot_r": {"pos": (-0.15, -0.8, 0.5), "rot": (-122, 0, 0)}, "knee_r": (-0.2, -0.6, 1.2)}
_sl_top = {**supine_feet(0.25), "foot_r": {"pos": (-0.15, -0.95, 0.62), "rot": (-115, 0, 0)}, "knee_r": (-0.2, -0.6, 1.4)}
ex("puente-una-pierna", ["Puente de glúteo a una pierna"], rep(_sl_bot, _sl_top, down=18),
   highlight=GLUTES, hand_rot=True, grip=0, camera={"az": 80, "el": 12}, peak=28)


# ===================================== TRÍCEPS ==================================================
def dips(down):
    return {"hips": (0, 0.15, -0.47 - (0.26 if down else 0)), "hips_rot": (6, 0, 0),
            "hand": {"pos": (0.22, 0.18, 0.49), "palm": (0, 0, -1), "fingers": (0, -1, 0)}, "elbow": (0.25, 0.9, 0.8),
            "foot": {"pos": (0.15, -0.62, 0.077)}, "knee": (0.2, -0.9, 0.9)}


ex("fondos-silla", ["Fondos en silla"], rep(dips(False), dips(True)), highlight=TRICEPS + CHEST[:1],
   hand_rot=True, grip=10, props=[{"type": "chair", "y": 0.33, "rz": 0}], camera={"az": 65, "el": 8}, peak=30)

_ovh_dn = {"hand": {"shoulder": (-0.17, 0.2, 0.06)}, "elbow": (0.2, -0.2, 2.4)}
_ovh_up = {"hand": {"shoulder": (-0.17, -0.02, 0.53)}, "elbow": (0.2, -0.2, 2.4)}
ex("extension-mochila", ["Extensión con mochila"], rep(_ovh_up, _ovh_dn, down=20),
   highlight=TRICEPS, props=[{"type": "backpack_hands"}], grip=GRIP, camera={"az": 65, "el": 6}, peak=30)

# Toalla: mano derecha arriba (detrás de la cabeza) y la izquierda en la espalda baja tirando hacia abajo.
_tw = {"hand_l": {"pos": (0.12, 0.2, 1.0)}, "elbow_l": (0.5, 0.6, 0.6)}
ex("extension-toalla", ["Extensión con toalla"],
   rep({**_tw, "hand_r": {"shoulder": (0.12, 0.2, 0.08)}, "elbow_r": (-0.2, -0.2, 2.4)},
       {**_tw, "hand_l": {"pos": (0.1, 0.18, 1.12)}, "hand_r": {"shoulder": (0.1, 0.02, 0.53)}, "elbow_r": (-0.2, -0.2, 2.4)}, down=20),
   highlight=TRICEPS, props=[{"type": "towel"}], grip=GRIP, camera={"az": 140, "el": 6}, peak=30)

_kb = {**_hinge, "hips_rot": (64, 0, 0)}
ex("patada-triceps", ["Patada de tríceps con botella"],
   rep({**_kb, "hand": {"shoulder": (0.03, 0.25, -0.39)}, "elbow": (0.3, 1.0, 1.3)},
       {**_kb, "hand": {"shoulder": (0.03, 0.5, -0.23)}, "elbow": (0.3, 1.0, 1.3)}, down=16),
   highlight=TRICEPS, props=BOTTLES, grip=GRIP, camera={"az": 80, "el": 8}, peak=26)

# Press de tríceps en el suelo: de plancha sobre antebrazos a brazos estirados (extensión de codo).
def tri_press(up):
    base, sy, th = body(0.92, 0.155, 0.55 if up else 0.35, head=-1)
    return {**base, "head": (-10, 0, 0), "hand": {"pos": (0.16, -0.72, 0.04), **PALM_DOWN},
            "elbow": (0.25, -0.35, -0.5), "foot": {"pos": (0.11, 0.92, 0.155), "rot": (th, 0, 0)}, "knee": (0.15, 0.45, -0.6)}


ex("press-triceps-suelo", ["Press de tríceps en el suelo"], rep(tri_press(False), tri_press(True), down=20),
   highlight=TRICEPS, hand_rot=True, grip=0, camera={"az": 65, "el": 14}, peak=30)


# ===================================== BÍCEPS ===================================================
def curl(up, palm_dn=(0, -1, 0), palm_up=(0, 1, 0), pole=(0.35, 0.6, 0.6)):
    if up:
        return {"hand": {"shoulder": (0.04, -0.14, -0.07), "palm": palm_up, "fingers": (0, 0, 1)}, "elbow": pole}
    return {"hand": {"shoulder": (0.05, -0.06, -0.53), "palm": palm_dn, "fingers": (0, 0, -1)}, "elbow": pole}


ex("curl-botellas", ["Curl con botellas"], rep(curl(False), curl(True), down=18),
   highlight=BICEPS, props=BOTTLES, grip=GRIP, hand_rot=True, camera={"az": 55, "el": 6}, peak=28)
ex("curl-martillo", ["Curl martillo con botellas"],
   rep(curl(False, (-1, 0, 0), (-1, 0, 0)), curl(True, (-1, 0, 0), (-1, 0, 0)), down=18),
   highlight=BICEPS, props=BOTTLES, grip=GRIP, hand_rot=True, camera={"az": 55, "el": 6}, peak=28)
_c2 = {"hand": {"shoulder": (-0.08, -0.08, -0.53), "palm": (0, -1, 0), "fingers": (0, 0, -1)}, "elbow": (0.35, 0.6, 0.6)}
_c2u = {"hand": {"shoulder": (-0.08, -0.16, -0.08), "palm": (0, 1, 0), "fingers": (0, 0, 1)}, "elbow": (0.35, 0.6, 0.6)}
ex("curl-mochila", ["Curl con mochila"], rep(_c2, _c2u, down=18),
   highlight=BICEPS, props=[{"type": "backpack_hands"}], grip=GRIP, hand_rot=True, camera={"az": 55, "el": 6}, peak=28)
ex("curl-inverso-mochila", ["Curl inverso con mochila"],
   rep({**_c2, "hand": {**_c2["hand"], "palm": (0, 1, 0)}}, {**_c2u, "hand": {**_c2u["hand"], "palm": (0, -1, 0)}}, down=18),
   highlight=BICEPS, props=[{"type": "backpack_hands"}], grip=GRIP, hand_rot=True, camera={"az": 55, "el": 6}, peak=28)
_ct = {"foot_r": {"off": (0.04, -0.12, 0)}}
ex("curl-toalla", ["Curl con toalla"],
   rep({**_ct, **_c2}, {**_ct, **_c2u}, down=18),
   highlight=BICEPS, props=[{"type": "towel_foot", "foot": "foot_r"}], grip=GRIP, hand_rot=True, camera={"az": 55, "el": 6}, peak=28)

# Curl concentrado: sentado en una silla, codo derecho apoyado en el muslo.
_seat = {"pelvis": (0, 0.1, 0.57), "hips_rot": (28, 0, 0), "spine": (14, 0, 0), "head": (-22, 0, 0),
         "foot": {"pos": (0.3, -0.42, 0.077), "rot": (0, 0, 15)}, "knee": (0.5, -1.2, 0.7),
         "hand_l": {"pos": (0.3, -0.42, 0.56), "palm": (0, 0, -1), "fingers": (0, -1, 0)}, "elbow_l": (0.8, 0.0, 1.0)}
ex("curl-concentrado", ["Curl concentrado con botella"],
   rep({**_seat, "hand_r": {"shoulder": (0.06, -0.1, -0.5), "palm": (0.4, -1, 0), "fingers": (0, 0, -1)}, "elbow_r": (-0.3, 0.2, 0.3)},
       {**_seat, "hand_r": {"shoulder": (0.08, -0.16, -0.12), "palm": (0.3, 1, 0), "fingers": (0, 0, 1)}, "elbow_r": (-0.3, 0.2, 0.3)}, down=18),
   highlight=BICEPS, props=[{"type": "chair", "y": 0.22, "rz": 0}, {"type": "bottle", "side": "r"}], grip=GRIP, hand_rot=True,
   camera={"az": 50, "el": 8}, peak=28)


# ===================================== CORE =====================================================
def forearm_plank():
    base, sy, th = body(0.94, 0.155, 0.355, head=-1)
    return {**base, "head": (-6, 0, 0), "hand": {"pos": (0.17, -0.72, 0.05), **PALM_DOWN}, "elbow": (0.25, -0.4, -0.5),
            "foot": {"pos": (0.11, 0.94, 0.155), "rot": (th, 0, 0)}, "knee": (0.15, 0.5, -0.6)}


ex("plancha", ["Plancha"], hold(forearm_plank()), highlight=CORE, hand_rot=True, grip=0, camera={"az": 65, "el": 14}, peak=1)

_side_plank = side_plank(0.34, {"pos": (-0.27, -0.45, 0.04), "palm": (0, 0, -1), "fingers": (-1, 0, 0)}, (0.3, -0.45, -0.4),
                         {"pos": (-0.05, 0.02, 0.66), "palm": (0, 0, -1), "fingers": (-0.3, 0.6, -1)}, (-0.2, 0.4, 1.2))
ex("plancha-lateral", ["Plancha lateral"], hold(_side_plank), highlight=CORE, hand_rot=True, grip=0, camera={"az": -65, "el": 12}, peak=1)

_sup_arms = {"hand": {"pos": (0.3, -0.05, 0.04), "palm": (0, 0, -1), "fingers": (0, -1, 0)}, "elbow": (0.6, 0.2, 0.6)}
_lying = {"pelvis": (0, 0.0, 0.163), "hips_rot": (-90, 0, 0)}


def crunch(up):
    p = {**supine_feet(0), "hand": {"shoulder": (-0.13, -0.16, 0.13)}, "elbow": (0.5, 0.0, 0.2)}
    if up:
        p.update({"spine": (40, 0, 0), "head": (14, 0, 0)})
    return p


ex("crunch", ["Crunch"], rep(crunch(False), crunch(True), down=16), highlight=CORE, camera={"az": 80, "el": 12}, peak=26)

_table_top = {"foot": {"pos": (0.11, -0.45, 0.6), "rot": (-90, 0, 0)}, "knee": (0.15, -0.2, 1.2)}
ex("crunch-inverso", ["Crunch inverso"],
   rep({**_lying, **_sup_arms, **_table_top},
       {**_sup_arms, "pelvis": (0, 0.02, 0.17), "hips_rot": (-125, 0, 0), "spine": (35, 0, 0),
        "foot": {"pos": (0.11, -0.12, 0.8), "rot": (-120, 0, 0)}, "knee": (0.15, 0.2, 1.4)}, down=16),
   highlight=CORE, hand_rot=True, grip=0, camera={"az": 80, "el": 12}, peak=26)

ex("elevacion-piernas", ["Elevación de piernas"],
   rep({**_lying, **_sup_arms, "foot": {"pos": (0.1, -0.9, 0.12), "rot": (-90, 0, 0)}, "knee": (0.15, -0.5, 1.2)},
       {**_lying, **_sup_arms, "foot": {"pos": (0.1, -0.08, 1.02), "rot": (-180, 0, 0)}, "knee": (0.15, -0.6, 0.6)}, down=20),
   highlight=CORE, hand_rot=True, grip=0, camera={"az": 80, "el": 12}, peak=30)

_db_mid = {**_lying, "hand": {"shoulder": (0.0, 0.0, 0.53)}, "elbow": (0.6, 0.3, 0.6), **_table_top}
_db_a = {**_db_mid, "hand_l": {"pos": (0.22, 1.0, 0.16)}, "foot_r": {"pos": (-0.11, -0.9, 0.18), "rot": (-90, 0, 0)}}
_db_b = {**_db_mid, "hand_r": {"pos": (-0.22, 1.0, 0.16)}, "foot_l": {"pos": (0.11, -0.9, 0.18), "rot": (-90, 0, 0)}}
ex("bicho-muerto", ["Bicho muerto"], alt(_db_a, _db_mid, _db_b), highlight=CORE, camera={"az": 75, "el": 14}, peak=24)

_bk = {**_lying, "spine": (36, 0, 0), "head": (10, 0, 0), "hand": {"shoulder": (-0.08, 0.2, 0.14)}, "elbow": (0.7, 0.3, 0.4)}
_bk_l = {**_bk, "twist": -26, "foot_l": {"pos": (0.1, -0.26, 0.42), "rot": (-100, 0, 0)}, "foot_r": {"pos": (-0.1, -0.86, 0.32), "rot": (-100, 0, 0)},
         "knee": (0.15, -0.2, 1.2)}
_bk_r = {**_bk, "twist": 26, "foot_r": {"pos": (-0.1, -0.26, 0.42), "rot": (-100, 0, 0)}, "foot_l": {"pos": (0.1, -0.86, 0.32), "rot": (-100, 0, 0)},
         "knee": (0.15, -0.2, 1.2)}
ex("bicicleta-abdominal", ["Bicicleta abdominal"], [(1, _bk_l), (24, _bk_r), (48, _bk_l)],
   highlight=CORE, camera={"az": 70, "el": 16}, peak=1)

_rus = {"pelvis": (0, 0.0, 0.074), "hips_rot": (-38, 0, 0), "head": (8, 0, 0),
        "foot": {"pos": (0.13, -0.55, 0.13), "rot": (-10, 0, 0)}, "knee": (0.2, -0.5, 1.2)}
_rus_c = {**_rus, "hand": {"pos": (0.04, -0.27, 0.58)}, "elbow": (0.6, -0.1, 0.8)}
_rus_l = {**_rus, "twist": 38, "hand_l": {"pos": (0.36, -0.14, 0.36)}, "hand_r": {"pos": (0.28, -0.22, 0.38)}, "elbow": (0.6, -0.1, 0.8)}
_rus_r = {**_rus, "twist": -38, "hand_r": {"pos": (-0.36, -0.14, 0.36)}, "hand_l": {"pos": (-0.28, -0.22, 0.38)}, "elbow": (0.6, -0.1, 0.8)}
ex("giros-rusos", ["Giros rusos"], alt(_rus_l, _rus_c, _rus_r, total=72), highlight=CORE, camera={"az": 30, "el": 10}, peak=18)
