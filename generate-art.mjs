// Generates GoQuicker's original placeholder artwork (SVG) into public/images.
// Replace these files with licensed photography when available; paths are set in src/config.
// Run: node scripts/generate-art.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "public", "images");
mkdirSync(OUT, { recursive: true });
// Vehicle-free backdrops, used only at build time by scripts/compose-photos.py.
const SCENES = join(import.meta.dirname, "..", "assets", "scenes");
mkdirSync(SCENES, { recursive: true });

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;

/* ---------- Vehicles (side profile, facing right) ---------- */

// Sedan, local box 820 x 300, ground at y=292.
function sedan(id, paint = ["#2c6150", "#143d31", "#0a241d", "#040d0a"]) {
  const wheel = (cx) => `
    <g transform="translate(${cx} 234)">
      <circle r="56" fill="#070a09"/>
      <circle r="54" fill="none" stroke="#1c2421" stroke-width="3"/>
      <circle r="39" fill="url(#${id}-rim)"/>
      ${Array.from({ length: 10 }, (_, i) => `<rect x="-2.6" y="-37" width="5.2" height="27" rx="2" fill="#a9b6b0" opacity="${i % 2 ? 0.55 : 0.85}" transform="rotate(${i * 36 + (i % 2 ? 8 : 0)})"/>`).join("")}
      <path d="M-24 -8 a26 26 0 0 1 22 -18" stroke="#c7f36b" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle r="11" fill="#1a2320"/><circle r="4" fill="#8d9a94"/>
    </g>`;
  return `
  <defs>
    <linearGradient id="${id}-paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${paint[0]}"/><stop offset=".38" stop-color="${paint[1]}"/>
      <stop offset=".72" stop-color="${paint[2]}"/><stop offset="1" stop-color="${paint[3]}"/>
    </linearGradient>
    <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#e8fff0" stop-opacity=".22"/>
      <stop offset=".62" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b4a44"/><stop offset=".5" stop-color="#0b1714"/><stop offset="1" stop-color="#16302a"/>
    </linearGradient>
    <radialGradient id="${id}-rim" cx=".4" cy=".35" r=".8">
      <stop offset="0" stop-color="#55615c"/><stop offset="1" stop-color="#151b19"/>
    </radialGradient>
    <radialGradient id="${id}-shadow"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <ellipse cx="410" cy="292" rx="390" ry="18" fill="url(#${id}-shadow)"/>
  <path d="M78 232C64 230 56 214 58 196C60 182 66 172 78 166L96 156C120 148 150 146 186 144C232 140 262 124 312 104C352 88 404 80 462 80C512 80 548 92 588 114C618 130 640 140 668 144C712 150 744 156 764 168C780 178 786 194 782 210C780 222 772 230 760 232L672 232A62 62 0 0 0 548 232L254 232A62 62 0 0 0 130 232Z" fill="url(#${id}-paint)"/>
  <path d="M78 232C64 230 56 214 58 196C60 182 66 172 78 166L96 156C120 148 150 146 186 144C232 140 262 124 312 104C352 88 404 80 462 80C512 80 548 92 588 114C618 130 640 140 668 144C712 150 744 156 764 168C780 178 786 194 782 210C780 222 772 230 760 232L672 232A62 62 0 0 0 548 232L254 232A62 62 0 0 0 130 232Z" fill="url(#${id}-sheen)"/>
  <path d="M300 112C340 94 400 88 458 88C504 88 540 98 572 116C590 126 600 134 604 138L318 140C304 138 296 124 300 112Z" fill="url(#${id}-glass)"/>
  <path d="M310 114C350 98 398 93 440 92L420 110C380 112 340 116 310 124Z" fill="#cfe9df" opacity=".14"/>
  <rect x="452" y="88" width="9" height="52" fill="#0a1512"/>
  <path d="M96 160C250 150 520 144 770 172" stroke="#ffffff" stroke-opacity=".28" stroke-width="2" fill="none"/>
  <path d="M150 204C320 199 520 199 730 203" stroke="#000" stroke-opacity=".35" stroke-width="2" fill="none"/>
  <path d="M330 146V226M456 144V226" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>
  <rect x="356" y="158" width="26" height="5" rx="2.5" fill="#000" opacity=".4"/><rect x="482" y="158" width="26" height="5" rx="2.5" fill="#000" opacity=".4"/>
  <path d="M592 134C602 126 616 126 622 134L620 142L596 142Z" fill="${paint[2]}"/>
  <path d="M736 160C756 162 772 168 780 178L760 177C750 171 742 166 736 160Z" fill="#f2ffd6" filter="url(#${id}-glow)" opacity=".9"/>
  <path d="M736 160C756 162 772 168 780 178L760 177C750 171 742 166 736 160Z" fill="#f7ffe6"/>
  <path d="M60 182C70 174 84 167 100 162L100 168C86 173 72 180 62 188Z" fill="#ff5a47" filter="url(#${id}-glow)" opacity=".8"/>
  <path d="M60 182C70 174 84 167 100 162L100 168C86 173 72 180 62 188Z" fill="#ff6a55"/>
  <path d="M700 226L760 226" stroke="#c7f36b" stroke-opacity=".5" stroke-width="2"/>
  ${wheel(192)}${wheel(610)}`;
}

// Three-wheeler, local box 640 x 400, ground at y=388.
function threeWheeler(id, { body, canopy, stripe, seat }) {
  const wheel = (cx, r) => `
    <g transform="translate(${cx} ${388 - r})">
      <circle r="${r}" fill="#080b0a"/><circle r="${r * 0.6}" fill="#3a4541"/>
      <circle r="${r * 0.6}" fill="none" stroke="#9aa7a1" stroke-width="2.5" opacity=".7"/>
      ${Array.from({ length: 5 }, (_, i) => `<rect x="-2" y="${-r * 0.56}" width="4" height="${r * 0.4}" rx="2" fill="#9aa7a1" opacity=".7" transform="rotate(${i * 72})"/>`).join("")}
      <circle r="${r * 0.18}" fill="#c9d2ce"/>
    </g>`;
  return `
  <defs>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${body[0]}"/><stop offset="1" stop-color="${body[1]}"/>
    </linearGradient>
    <linearGradient id="${id}-canopy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${canopy[0]}"/><stop offset="1" stop-color="${canopy[1]}"/>
    </linearGradient>
    <radialGradient id="${id}-shadow"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <ellipse cx="350" cy="388" rx="300" ry="14" fill="url(#${id}-shadow)"/>
  <!-- cabin interior -->
  <rect x="110" y="110" width="400" height="200" fill="#0b1512"/>
  <rect x="150" y="150" width="34" height="76" rx="10" fill="${seat}"/>
  <rect x="150" y="214" width="130" height="20" rx="8" fill="${seat}"/>
  <path d="M478 168L500 160" stroke="#9aa7a1" stroke-width="5" stroke-linecap="round"/>
  <path d="M470 196L486 164" stroke="#5b6863" stroke-width="5" stroke-linecap="round"/>
  <!-- canopy -->
  <path d="M100 118C100 92 118 78 146 78L478 78C506 78 522 94 528 116L534 132L100 132Z" fill="url(#${id}-canopy)"/>
  <path d="M100 118L100 250C100 262 108 270 120 270L150 270L150 132L100 132Z" fill="url(#${id}-canopy)"/>
  <path d="M110 92C160 86 400 84 500 88" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/>
  <!-- windshield frame -->
  <path d="M506 128L528 130L546 214L524 214Z" fill="#183630" stroke="${canopy[1]}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M512 136L522 137L536 200Z" fill="#d9f0e6" opacity=".25"/>
  <!-- rear tub -->
  <path d="M100 250C100 236 110 226 124 226L318 226L340 300L520 300L520 340L124 340C110 340 100 330 100 316Z" fill="url(#${id}-body)"/>
  <rect x="100" y="256" width="236" height="12" fill="${stripe}"/>
  <!-- front cowl -->
  <path d="M500 214C524 204 566 204 586 220C600 232 604 262 602 304C600 328 588 340 566 340L496 340Z" fill="url(#${id}-body)"/>
  <path d="M506 222C530 214 560 214 578 226" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none"/>
  <path d="M500 286L602 286" stroke="${stripe}" stroke-width="10"/>
  <!-- lights -->
  <circle cx="598" cy="246" r="9" fill="#f6ffe0" filter="url(#${id}-glow)"/><circle cx="598" cy="246" r="7" fill="#fbfff1"/>
  <rect x="102" y="280" width="8" height="18" rx="3" fill="#ff5a47"/>
  <!-- floor + step -->
  <rect x="330" y="298" width="170" height="6" fill="#0b1512" opacity=".6"/>
  ${wheel(190, 44)}${wheel(540, 40)}
  <path d="M488 348A56 56 0 0 1 592 348" stroke="${body[1]}" stroke-width="10" fill="none"/>`;
}

// Scooter, local box 640 x 400, ground at y=388.
function scooter(id, { body = ["#3d7d69", "#174236"], seat = "#0d1a16", accent = "#c7f36b" } = {}) {
  const wheel = (cx) => `
    <g transform="translate(${cx} 336)">
      <circle r="52" fill="#080b0a"/><circle r="34" fill="#2e3935"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="-3" y="-32" width="6" height="24" rx="3" fill="#a4b1ab" opacity=".75" transform="rotate(${i * 60})"/>`).join("")}
      <circle r="9" fill="#cdd6d2"/>
    </g>`;
  return `
  <defs>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${body[0]}"/><stop offset="1" stop-color="${body[1]}"/>
    </linearGradient>
    <radialGradient id="${id}-shadow"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <ellipse cx="320" cy="388" rx="260" ry="13" fill="url(#${id}-shadow)"/>
  ${wheel(160)}${wheel(480)}
  <!-- rear body -->
  <path d="M86 268C80 232 104 200 150 194L330 188C352 188 364 200 366 220L372 262L254 274C232 292 214 300 186 300L120 300C100 300 90 288 86 268Z" fill="url(#${id}-body)"/>
  <path d="M100 236C150 214 260 206 350 204" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none"/>
  <path d="M110 262L300 250" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
  <!-- seat -->
  <path d="M120 196C128 176 160 168 206 168L318 170C338 172 344 184 336 194L128 202Z" fill="${seat}"/>
  <!-- floorboard -->
  <path d="M240 272L410 262L412 290L250 298Z" fill="#101c18"/>
  <!-- front apron / leg shield -->
  <path d="M392 290L400 232C404 196 418 160 436 128L462 132C454 170 452 210 462 248C470 272 484 286 500 292L474 300L404 300Z" fill="url(#${id}-body)"/>
  <path d="M430 140C424 170 420 210 426 250" stroke="#fff" stroke-opacity=".28" stroke-width="3" fill="none"/>
  <!-- steering + bars -->
  <path d="M446 132L456 96" stroke="#22302b" stroke-width="12" stroke-linecap="round"/>
  <path d="M420 92L492 84" stroke="#0d1a16" stroke-width="9" stroke-linecap="round"/>
  <path d="M472 86L486 56" stroke="#5b6863" stroke-width="3"/><ellipse cx="489" cy="52" rx="10" ry="6" fill="#22302b"/>
  <!-- headlight -->
  <path d="M458 104C474 100 488 104 494 114L468 120Z" fill="#fbfff1"/>
  <path d="M458 104C474 100 488 104 494 114L468 120Z" fill="#f6ffe0" filter="url(#${id}-glow)"/>
  <!-- front fender -->
  <path d="M424 300A60 60 0 0 1 540 292" stroke="url(#${id}-body)" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- tail light -->
  <path d="M86 250L96 242L100 262L90 266Z" fill="#ff5a47"/>
  <!-- rear swingarm -->
  <path d="M160 336L250 300" stroke="#1f2a26" stroke-width="16" stroke-linecap="round"/>`;
}

/* ---------- Scenery ---------- */

function skyline(r, w, baseY, { minH, maxH, color, windows = 0 }) {
  let x = -20;
  let out = "";
  while (x < w + 20) {
    const bw = 30 + r() * 70;
    const h = minH + Math.pow(r(), 1.6) * (maxH - minH);
    out += `<rect x="${f(x)}" y="${f(baseY - h)}" width="${f(bw)}" height="${f(h + 4)}" fill="${color}"/>`;
    if (r() > 0.82) out += `<rect x="${f(x + bw / 2 - 1.5)}" y="${f(baseY - h - 30)}" width="3" height="32" fill="${color}"/>`;
    if (windows) {
      for (let wy = baseY - h + 10; wy < baseY - 8; wy += 12) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 9) {
          if (r() < windows) out += `<rect x="${f(wx)}" y="${f(wy)}" width="3" height="4" fill="#f5d996" opacity="${f(0.25 + r() * 0.5)}"/>`;
        }
      }
    }
    x += bw + r() * 6;
  }
  return out;
}

function ridge(r, w, baseY, amp, color, freq = 1) {
  const pts = [];
  const p1 = r() * 6, p2 = r() * 6, p3 = r() * 6;
  for (let x = 0; x <= w; x += 20) {
    const t = (x / w) * Math.PI * 2 * freq;
    const y = baseY - amp * (0.55 * Math.sin(t * 1.3 + p1) + 0.3 * Math.sin(t * 3.1 + p2) + 0.15 * Math.sin(t * 7.7 + p3) + 1) / 2;
    pts.push(`${x},${f(y)}`);
  }
  return `<path d="M0 ${baseY + 400}L${pts.join("L")}L${w} ${baseY + 400}Z" fill="${color}"/>`;
}

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>\n`;
}

function duskSky(id, w, h, horizon, warm = "#d39a55") {
  return `
  <defs>
    <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#061a15"/><stop offset=".45" stop-color="#16392f"/>
      <stop offset=".78" stop-color="#5b6f55"/><stop offset="1" stop-color="${warm}"/>
    </linearGradient>
    <radialGradient id="${id}-sun" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffe2a6" stop-opacity=".95"/><stop offset=".25" stop-color="#f3b867" stop-opacity=".55"/>
      <stop offset="1" stop-color="#f3b867" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${horizon}" fill="url(#${id}-sky)"/>`;
}

function road(id, w, top, h) {
  return `
  <defs>
    <linearGradient id="${id}-road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#26302b"/><stop offset=".35" stop-color="#121a17"/><stop offset="1" stop-color="#050807"/>
    </linearGradient>
    <linearGradient id="${id}-roadsheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f3b867" stop-opacity="0"/><stop offset=".6" stop-color="#f3b867" stop-opacity=".18"/><stop offset="1" stop-color="#f3b867" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect y="${top}" width="${w}" height="${h}" fill="url(#${id}-road)"/>
  <rect y="${top}" width="${w}" height="${h * 0.5}" fill="url(#${id}-roadsheen)"/>`;
}

const place = (inner, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
const mirror = (inner, x, y, s, groundY) =>
  `<g opacity=".18" transform="translate(${x} ${y + 2 * groundY * s}) scale(${s} ${-s})">${inner}</g>`;

/* Hero: city at dusk with sedan */
{
  const W = 1600, H = 1000, horizon = 690;
  const r = rng(7);
  const car = sedan("hc");
  const s = 1.12, cx = 640, cy = horizon + 110 - 292 * s;
  const body = `
  ${duskSky("h", W, H, horizon)}
  <circle cx="1180" cy="${horizon - 30}" r="380" fill="url(#h-sun)"/>
  ${skyline(r, W, horizon, { minH: 80, maxH: 300, color: "#3c5547", windows: 0 })}
  ${skyline(r, W, horizon, { minH: 60, maxH: 420, color: "#132a23", windows: 0.07 })}
  <rect x="0" y="${horizon - 4}" width="${W}" height="8" fill="#0b1915"/>
  ${road("h", W, horizon, H - horizon)}
  <path d="M0 ${horizon + 120}L${W} ${horizon + 95}" stroke="#c7f36b" stroke-opacity=".12" stroke-width="2"/>
  ${mirror(car, cx, cy, s, 292)}
  ${place(car, cx, cy, s)}`;
  writeFileSync(join(OUT, "hero-city.svg"), svg(W, H, body));
  // Same scene without the car: the backdrop for the real vehicle photos (scripts/compose-photos.py).
  writeFileSync(join(SCENES, "hero-city.svg"), svg(W, H, body.slice(0, body.indexOf(mirror(car, cx, cy, s, 292)))));
}

/* Featured scenes: hills at dusk with a vehicle on the road */
function featured(name, vehicle, vw, groundY, scale, x, seed) {
  const W = 1600, H = 900, horizon = 560;
  const r = rng(seed);
  const y = horizon + 230 - groundY * scale;
  const body = `
  ${duskSky("f" + seed, W, H, horizon, "#c99556")}
  <circle cx="${300 + r() * 900}" cy="${horizon - 20}" r="320" fill="url(#f${seed}-sun)"/>
  ${ridge(r, W, horizon - 40, 260, "#3f5a4b", 1)}
  ${ridge(r, W, horizon - 10, 200, "#24423a", 1.4)}
  ${ridge(r, W, horizon + 6, 130, "#0f2620", 2)}
  ${road("f" + seed, W, horizon, H - horizon)}
  ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 200 - 40}" y="${horizon + 262}" width="110" height="6" rx="3" fill="#e9eedf" opacity=".35"/>`).join("")}
  ${mirror(vehicle, x, y, scale, groundY)}
  ${place(vehicle, x, y, scale)}`;
  writeFileSync(join(OUT, name), svg(W, H, body));
  writeFileSync(join(SCENES, name), svg(W, H, body.slice(0, body.indexOf(mirror(vehicle, x, y, scale, groundY)))));
  void vw;
}
featured("featured-sedan.svg", sedan("fs"), 820, 292, 1.25, 330, 11);
featured(
  "featured-rickshaw.svg",
  threeWheeler("fr", { body: ["#2a2f2c", "#0d0f0e"], canopy: ["#ffd84a", "#e2b10f"], stripe: "#ffd84a", seat: "#5a3b2a" }),
  640, 388, 1.2, 440, 37,
);
featured("featured-scooter.svg", scooter("fsc"), 640, 388, 1.2, 440, 41);

/* Category cut-outs (transparent backgrounds) */
writeFileSync(join(OUT, "category-cars.svg"), svg(820, 300, sedan("cc")));
writeFileSync(
  join(OUT, "category-auto-rickshaw.svg"),
  svg(640, 400, threeWheeler("cr", { body: ["#2a2f2c", "#0d0f0e"], canopy: ["#ffd84a", "#e2b10f"], stripe: "#ffd84a", seat: "#5a3b2a" })),
);
writeFileSync(join(OUT, "category-scooter.svg"), svg(640, 400, scooter("cs")));

/* Testimonials: night road with light trails */
{
  const W = 1600, H = 800, horizon = 520;
  const r = rng(91);
  const stars = Array.from({ length: 90 }, () => `<circle cx="${f(r() * W)}" cy="${f(r() * horizon * 0.7)}" r="${f(0.6 + r() * 1.2)}" fill="#e6f2ea" opacity="${f(0.2 + r() * 0.5)}"/>`).join("");
  const trails = Array.from({ length: 7 }, (_, i) => {
    const y = horizon + 120 + i * 16;
    const c = i % 3 === 0 ? "#c7f36b" : i % 3 === 1 ? "#ffcf8a" : "#ff7a5c";
    return `<path d="M-50 ${y + 30}C400 ${y + 10} 1000 ${y - 10} 1650 ${y - 40}" stroke="${c}" stroke-width="${2 + (i % 3)}" stroke-opacity="${f(0.25 + r() * 0.35)}" fill="none"/>`;
  }).join("");
  const body = `
  <defs><linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030c0a"/><stop offset=".7" stop-color="#0b241d"/><stop offset="1" stop-color="#23463a"/></linearGradient></defs>
  <rect width="${W}" height="${horizon}" fill="url(#t-sky)"/>${stars}
  ${ridge(r, W, horizon - 10, 180, "#0d211b", 1.2)}
  ${ridge(r, W, horizon + 4, 90, "#071510", 2.2)}
  ${road("t", W, horizon, H - horizon)}
  <g filter="url(#tblur)">${trails}</g>
  <defs><filter id="tblur"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
  ${place(sedan("ts", ["#1e463a", "#0f2a22", "#081a15", "#030907"]), 1080, horizon + 140 - 292 * 0.55, 0.55)}`;
  writeFileSync(join(OUT, "testimonials-road.svg"), svg(W, H, body));
}

/* Benefits: night city map with a highlighted route */
{
  const W = 1000, H = 800;
  const r = rng(5);
  let streets = "";
  for (let i = 0; i < 16; i++) {
    const x = i * 70 + r() * 30 - 40;
    streets += `<path d="M${f(x)} -20L${f(x + 120 + r() * 80)} ${H + 20}" stroke="#22324d" stroke-width="${i % 4 === 0 ? 7 : 2.5}"/>`;
  }
  for (let i = 0; i < 13; i++) {
    const y = i * 68 + r() * 20 - 20;
    streets += `<path d="M-20 ${f(y)}L${W + 20} ${f(y - 80 - r() * 60)}" stroke="#22324d" stroke-width="${i % 4 === 1 ? 7 : 2.5}"/>`;
  }
  const route = "M180 640C240 600 260 560 320 540S430 520 470 470S520 360 600 330S720 300 780 230";
  const body = `
  <defs>
    <radialGradient id="b-bg" cx=".55" cy=".45" r=".8"><stop offset="0" stop-color="#1a2a44"/><stop offset="1" stop-color="#0c1424"/></radialGradient>
    <filter id="b-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#b-bg)"/>
  <path d="M-20 260C200 300 300 180 520 210S820 120 1020 60L1020 130C820 190 700 270 520 280S220 380 -20 340Z" fill="#13355a" opacity=".85"/>
  <rect x="560" y="520" width="200" height="140" rx="18" fill="#1b3b3a" transform="rotate(-8 660 590)"/>
  ${streets}
  <path d="${route}" stroke="#4fd1a1" stroke-width="16" fill="none" stroke-linecap="round" filter="url(#b-glow)" opacity=".6"/>
  <path d="${route}" stroke="#4fd1a1" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="${route}" stroke="#0f1a2b" stroke-width="2" fill="none" stroke-dasharray="2 14" stroke-linecap="round"/>
  <circle cx="180" cy="640" r="26" fill="#f7f7f2" opacity=".18"/><circle cx="180" cy="640" r="13" fill="#f7f7f2"/><circle cx="180" cy="640" r="5" fill="#0f1a2b"/>
  <g transform="translate(780 230)">
    <ellipse cx="0" cy="4" rx="18" ry="6" fill="#000" opacity=".4"/>
    <path d="M0 0C-16 -20 -26 -32 -26 -46A26 26 0 0 1 26 -46C26 -32 16 -20 0 0Z" fill="#4fd1a1"/>
    <circle cx="0" cy="-46" r="10" fill="#0f1a2b"/>
  </g>`;
  writeFileSync(join(OUT, "benefits-route.svg"), svg(W, H, body));
}

console.log("Artwork written to", OUT);
