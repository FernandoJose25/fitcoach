"""Junta los PNG de build_anim.py en un WebP animado en bucle, sobre el color del escenario de la app.

El render sale con fondo transparente (sombra incluida); aquí se funde sobre `--bg` (por defecto
#151513 = palette.dark.card, el escenario fijo de ExerciseDemo). Opaco comprime ~4× mejor que con alfa.

Python del sistema + Pillow (fuera de Blender). Uso, desde la raíz del repo:
  python apps/mobile/assets/anim/assemble_webp.py <carpeta_frames>/<slug> apps/mobile/assets/anim/<slug>.webp
"""
import glob
import os
import sys

from PIL import Image

FPS = 24


def main():
    src, dst = sys.argv[1], sys.argv[2]
    width = int(sys.argv[sys.argv.index("--width") + 1]) if "--width" in sys.argv else 480
    quality = int(sys.argv[sys.argv.index("--quality") + 1]) if "--quality" in sys.argv else 72
    bg = sys.argv[sys.argv.index("--bg") + 1] if "--bg" in sys.argv else "#151513"
    fps = int(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else FPS  # 30 en capturas de Mixamo
    bg_rgb = tuple(int(bg[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    files = sorted(f for f in glob.glob(os.path.join(src, "[0-9]*.png")))
    frames = []
    for f in files:
        im = Image.open(f).convert("RGBA")
        if width and im.width != width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        flat = Image.new("RGBA", im.size, bg_rgb)
        flat.alpha_composite(im)
        frames.append(flat.convert("RGB"))
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0,
                   quality=quality, method=6)
    print(f"{dst}: {len(frames)} frames, {os.path.getsize(dst) // 1024} KB")


main()
