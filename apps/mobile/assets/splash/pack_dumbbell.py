"""Empaqueta los 24 frames de build_dumbbell_spin.py (requiere Pillow con WebP).

  python apps/mobile/assets/splash/pack_dumbbell.py <dir_frames>

Escribe junto a este script:
  dumbbell_spin.webp    WebP animado, loop infinito, 24 fps
  dumbbell_sprite.png   sprite sheet 6x4 (frame i en col i%6, fila i//6)
"""
import os
import sys

from PIL import Image

COLS, ROWS, FPS = 6, 4, 24
here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1]
frames = [Image.open(os.path.join(src, f"frame_{i:02d}.png")).convert("RGBA") for i in range(COLS * ROWS)]
w, h = frames[0].size

sheet = Image.new("RGBA", (w * COLS, h * ROWS), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.paste(f, ((i % COLS) * w, (i // COLS) * h))
sheet.save(os.path.join(here, "dumbbell_sprite.png"), optimize=True)

frames[0].save(os.path.join(here, "dumbbell_spin.webp"), save_all=True, append_images=frames[1:],
               duration=round(1000 / FPS), loop=0, quality=90, method=6, disposal=2)
print({n: os.path.getsize(os.path.join(here, n)) for n in ("dumbbell_sprite.png", "dumbbell_spin.webp")})
