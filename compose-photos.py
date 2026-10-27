"""Builds the website's vehicle images from the photos in assets/vehicles/.

  python3 scripts/compose-photos.py

Writes to public/images/vehicles/:
  - car, auto-rickshaw, bike, scooter .webp   cut-outs (transparent) for cards and lists
  - hero-city.webp, featured-*.webp           photos placed on the dusk scenes in assets/scenes/
  - fleet.webp                                all four vehicles together (transparent), for all-service sections
  - fleet-road.webp, fleet-city.webp, fleet-dusk.webp   all four vehicles on the dusk scenes

Needs Pillow, plus Node with Playwright to turn the scene SVGs into pictures.
Run `node scripts/generate-art.mjs` first if the scenes change.
"""
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "vehicles"
SCENES = ROOT / "assets" / "scenes"
OUT = ROOT / "public" / "images" / "vehicles"
OUT.mkdir(parents=True, exist_ok=True)


def cutout(name: str) -> Image.Image:
    """Photo trimmed to the vehicle, ignoring faint glow pixels."""
    im = Image.open(SRC / f"{name}.png").convert("RGBA")
    alpha = im.getchannel("A").point(lambda a: 255 if a > 40 else 0)
    return im.crop(alpha.getbbox())


def fit_width(im: Image.Image, w: int) -> Image.Image:
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def save(im: Image.Image, name: str, quality=84):
    im.save(OUT / name, "WEBP", quality=quality, method=6)
    print(f"  {name} {im.width}x{im.height} {(OUT / name).stat().st_size // 1024} KB")


def render_scenes() -> dict[str, Image.Image]:
    """SVG scenes -> PNG through headless Chromium (Playwright)."""
    tmp = Path(tempfile.mkdtemp())
    js = """
const { chromium } = require("playwright");
const fs = require("fs"); const path = require("path");
(async () => {
  const [src, out] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".svg"))) {
    const svg = fs.readFileSync(path.join(src, f), "utf8");
    const [, w, h] = svg.match(/viewBox="0 0 (\\d+) (\\d+)"/);
    const p = await b.newPage({ viewport: { width: +w, height: +h } });
    await p.setContent(`<body style="margin:0">${svg.replace("<svg", '<svg width="' + w + '" height="' + h + '"')}</body>`);
    await p.screenshot({ path: path.join(out, f.replace(".svg", ".png")) });
    await p.close();
  }
  await b.close();
})();
"""
    (tmp / "render.js").write_text(js)
    subprocess.run(["node", str(tmp / "render.js"), str(SCENES), str(tmp)], check=True, cwd=ROOT)
    return {p.stem: Image.open(p).convert("RGBA") for p in tmp.glob("*.png")}


def place_on_scene(scene: Image.Image, vehicle: Image.Image, width: int, center_x: int, ground_y: int) -> Image.Image:
    """Vehicle standing on the road, with a contact shadow and a faint wet-road reflection."""
    v = fit_width(vehicle, width)
    x, y = center_x - v.width // 2, ground_y - v.height
    out = scene.copy()

    reflection = v.transpose(Image.FLIP_TOP_BOTTOM)
    a = reflection.getchannel("A").point(lambda p: p * 0.16)
    fade = Image.linear_gradient("L").resize(reflection.size)  # strongest next to the tyres
    reflection.putalpha(Image.composite(a, Image.new("L", a.size, 0), fade.transpose(Image.FLIP_TOP_BOTTOM)))
    out.alpha_composite(reflection, (x, ground_y - 6))

    shadow = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        (x + v.width * 0.06, ground_y - v.height * 0.07, x + v.width * 0.94, ground_y + v.height * 0.05), fill=(0, 0, 0, 170)
    )
    out.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(v.height * 0.04)))
    out.alpha_composite(v, (x, y))
    return out.convert("RGB")


# Real-world heights in metres, so the four photos stand at believable sizes next to each other.
HEIGHTS = {"car": 1.45, "auto-rickshaw": 1.75, "bike": 1.1, "scooter": 1.15}
# (vehicle, centre x, ground y, depth scale), back to front, in units of the car's width.
FLEET = [
    ("auto-rickshaw", 0.42, 0.80, 0.9),
    ("bike", 1.62, 0.80, 0.9),
    ("car", 0.98, 1.0, 1.0),
    ("scooter", 1.97, 1.0, 1.0),
]


def fleet(photos: dict[str, Image.Image], car_width: int) -> Image.Image:
    """All four vehicles grouped on one ground plane, with contact shadows, on a transparent canvas."""
    px_per_m = fit_width(photos["car"], car_width).height / HEIGHTS["car"]
    canvas = Image.new("RGBA", (round(car_width * 2.45), round(car_width * 1.0)), (0, 0, 0, 0))
    for name, cx, gy, depth in FLEET:
        h = round(HEIGHTS[name] * px_per_m * depth)
        v = photos[name].resize((round(photos[name].width * h / photos[name].height), h), Image.LANCZOS)
        x, ground = round(cx * car_width - v.width / 2), round(gy * canvas.height * 0.98)
        shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(shadow).ellipse(
            (x + v.width * 0.06, ground - v.height * 0.06, x + v.width * 0.94, ground + v.height * 0.04), fill=(0, 0, 0, 120)
        )
        canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(max(4, v.height * 0.035))))
        canvas.alpha_composite(v, (x, ground - v.height))
    return canvas.crop(canvas.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())


def fleet_on_scene(scene: Image.Image, group: Image.Image, width: int, center_x: int, ground_y: int) -> Image.Image:
    g = fit_width(group, width)
    out = scene.copy()
    out.alpha_composite(g, (center_x - g.width // 2, ground_y - g.height))
    return out.convert("RGB")


def main():
    print("Cut-outs")
    photos = {n: cutout(n) for n in ["car", "auto-rickshaw", "bike", "scooter"]}
    for name, im in photos.items():
        save(fit_width(im, 960), f"{name}.webp")

    group = fleet(photos, 900)
    save(fit_width(group, 1400), "fleet.webp")

    print("Scenes")
    scenes = render_scenes()
    save(place_on_scene(scenes["hero-city"], photos["car"], 860, 1110, 845), "hero-city.webp", 80)
    save(place_on_scene(scenes["featured-sedan"], photos["car"], 860, 690, 820), "featured-car.webp", 80)
    save(place_on_scene(scenes["featured-rickshaw"], photos["auto-rickshaw"], 560, 690, 830), "featured-auto-rickshaw.webp", 80)
    save(place_on_scene(scenes["featured-scooter"], photos["bike"], 760, 690, 830), "featured-bike.webp", 80)
    save(place_on_scene(scenes["featured-rickshaw"], photos["scooter"], 620, 690, 830), "featured-scooter.webp", 80)
    save(fleet_on_scene(scenes["featured-sedan"], group, 1380, 800, 860), "fleet-road.webp", 80)
    save(fleet_on_scene(scenes["hero-city"], group, 1300, 820, 900), "fleet-city.webp", 80)
    save(fleet_on_scene(scenes["featured-rickshaw"], group, 1380, 800, 870), "fleet-dusk.webp", 80)


if __name__ == "__main__":
    main()
