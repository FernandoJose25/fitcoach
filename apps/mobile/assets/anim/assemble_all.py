"""Convierte los frames de todos los ejercicios en WebP animados y regenera `src/lib/anim.ts`.

Python del sistema + Pillow. Uso, desde la raíz del repo:
  python apps/mobile/assets/anim/assemble_all.py <carpeta_frames> [--only slug1,slug2]
Con `--only` convierte solo esos; el mapa incluye además los WebP que ya existen.
"""
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8")  # la consola de Windows (cp1252) no imprime "·" ni flechas

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from exercises import EXERCISES  # noqa: E402

frames_root = sys.argv[1]
only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
done = []
jobs = []
for slug, ex in EXERCISES.items():
    src = os.path.join(frames_root, slug)
    dst = os.path.join(HERE, f"{slug}.webp")
    if only is not None and slug not in only:
        if os.path.exists(dst):
            done.append((slug, ex["names"]))
        continue
    if not os.path.isdir(src) or not any(f[:1].isdigit() for f in os.listdir(src)):
        print(f"falta: {slug}")
        continue
    jobs.append([sys.executable, os.path.join(HERE, "assemble_webp.py"), src, dst])
    done.append((slug, ex["names"]))

# Cada WebP tarda ~30 s (método 6): se convierten varios a la vez.
with ThreadPoolExecutor(max_workers=max(1, (os.cpu_count() or 4) // 2)) as pool:
    for r in pool.map(lambda cmd: subprocess.run(cmd, check=True, capture_output=True, text=True), jobs):
        print(r.stdout.strip())

lines = [
    "/**",
    " * Animaciones 3D de ejercicios (WebP animado sobre el escenario #151513), generadas con",
    " * assets/anim/build_anim.py + assemble_all.py. Clave = nombre del ejercicio en el catálogo.",
    " * Archivo generado: no editar a mano.",
    " */",
    "/* eslint-disable @typescript-eslint/no-require-imports -- Metro resuelve assets locales con require */",
    "export const EXERCISE_ANIM: Record<string, number> = {",
]
for slug, names in sorted(done, key=lambda x: x[1][0]):
    for n in names:
        lines.append(f"  '{n}': require('../../assets/anim/{slug}.webp'),")
lines += ["};", "/* eslint-enable @typescript-eslint/no-require-imports */", ""]
out = os.path.normpath(os.path.join(HERE, "..", "..", "src", "lib", "anim.ts"))
with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))
print(f"{len(done)} animaciones · {sum(len(n) for _, n in done)} nombres → {out}")
