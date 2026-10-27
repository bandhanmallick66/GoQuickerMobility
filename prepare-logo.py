"""Turns the owner's logo (on black) into transparent versions for the website.

  python3 scripts/prepare-logo.py

Reads assets/brand/goquicker-logo.png and writes to public/images/brand/:
  - goquicker-logo-dark.webp    white wordmark, for dark backgrounds (as supplied)
  - goquicker-logo-light.webp   navy wordmark, for light backgrounds
  - goquicker-lockup-dark.webp / goquicker-lockup-light.webp
                                the G mark beside the wordmark, for the header and footer
The black background becomes transparent; green parts keep their colour.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/brand/goquicker-logo.png"
OUT = ROOT / "public/images/brand"
NAVY = np.array([23, 32, 51], dtype=np.float32)  # --color-ink


def main():
    rgb = np.asarray(Image.open(SRC).convert("RGB"), dtype=np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # Green pixels are clearly greener than they are red or blue; the rest is the white wordmark and pin.
    green = (g > 1.3 * r) & (g > 1.3 * b) & (g > 6)
    white = ~green
    # On black, brightness is coverage. Solid shapes become fully opaque; only anti-aliased edges fade.
    level = np.where(green, g / 90.0, rgb.max(axis=2) / 200.0)
    a = np.clip(level, 0, 1)
    alpha = a * 255
    color = np.clip(rgb / np.maximum(a[..., None], 1e-6), 0, 255)
    white = white[..., None]

    OUT.mkdir(parents=True, exist_ok=True)
    for name, ink in (("dark", None), ("light", NAVY)):
        c = color if ink is None else np.where(white, ink, color)
        img = Image.fromarray(np.dstack([c, alpha]).astype(np.uint8), "RGBA")
        img = trim(img)
        lockup(img).save(OUT / f"goquicker-lockup-{name}.webp", quality=92, method=6)
        img.thumbnail((720, 720), Image.LANCZOS)
        img.save(OUT / f"goquicker-logo-{name}.webp", quality=92, method=6)
        print(name, img.size)


def trim(img):
    return img.crop(img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())


def lockup(stacked):
    """Splits the stacked logo at the empty band between mark and text, then sets the text beside the mark."""
    rows = (np.asarray(stacked.getchannel("A")) > 24).any(axis=1)
    gap = next(y for y in range(len(rows) // 3, len(rows)) if not rows[y])
    mark = trim(stacked.crop((0, 0, stacked.width, gap)))
    word = trim(stacked.crop((0, gap, stacked.width, stacked.height)))
    scale = mark.height * 0.5 / word.height
    word = word.resize((round(word.width * scale), round(word.height * scale)), Image.LANCZOS)
    space = round(mark.height * 0.1)
    out = Image.new("RGBA", (mark.width + space + word.width, mark.height), (0, 0, 0, 0))
    out.alpha_composite(mark, (0, 0))
    out.alpha_composite(word, (mark.width + space, (mark.height - word.height) // 2))
    out.thumbnail((640, 200), Image.LANCZOS)
    return out


if __name__ == "__main__":
    main()
