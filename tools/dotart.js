// Usage: node tools/dotart.js out.html  → paste the <svg> lines into .case-stage in index.html
// Builds the hero's dot illustrations: each scene is a few simple shapes,
// filled with a hex grid of dots in mixed sizes (halftone style).
const fs = require('fs');

const C = { ink: '#14211f', teal: '#1fb5b0', tealDark: '#0b6e70', yellow: '#ffd84d', gold: '#ffb800', crust: '#e39a3b', sand: '#f2c94c', grey: '#cfd3c6', white: '#ffffff' };

// --- shape tests -----------------------------------------------------------
const rrect = (x, y, w, h, r = 0) => (px, py) => {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r), cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};
const circle = (cx, cy, r) => (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
const ring = (cx, cy, r1, r2) => (px, py) => { const d = (px - cx) ** 2 + (py - cy) ** 2; return d <= r2 * r2 && d >= r1 * r1; };
const ellipse = (cx, cy, rx, ry) => (px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
const capsule = (x1, y1, x2, y2, r) => (px, py) => {
  const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return (px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2 <= r * r;
};
const poly = (pts) => (px, py) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const not = (a, b) => (px, py) => a(px, py) && !b(px, py);

// deterministic noise so the art is stable between builds
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

// layers: later entries sit on top. { test, color, size (0..1 dot fill), jitter }
const render = (layers, { step = 13, rot = 0 } = {}) => {
  const out = [];
  const h = step * Math.sqrt(3) / 2;
  for (let row = 0, y = step / 2; y < 600; row++, y += h) {
    for (let x = (row % 2 ? step : step / 2); x < 600; x += step) {
      let hit = null;
      for (const L of layers) if (L.test(x, y)) hit = L;
      if (!hit) continue;
      const n = hash(x, y);
      const r = (step / 2) * (hit.size ?? 0.8) * (0.55 + 0.45 * n);
      out.push({ x, y, r, color: hit.color, cls: hit.cls });
    }
  }
  return out;
};

// --- scenes ----------------------------------------------------------------
const chair = (ox) => [
  { test: rrect(ox + 16, 110, 128, 200, 34), color: C.teal, size: 0.9 },          // backrest
  { test: rrect(ox, 300, 160, 56, 22), color: C.tealDark, size: 0.95 },           // seat
  { test: capsule(ox + 24, 350, ox + 14, 500, 9), color: C.ink, size: 0.85 },      // legs
  { test: capsule(ox + 136, 350, ox + 146, 500, 9), color: C.ink, size: 0.85 },
];
const scenes = {
  chairs: [
    { test: ellipse(300, 512, 260, 22), color: C.grey, size: 0.55 },
    ...chair(70), ...chair(370),
  ],
  bread: [
    { test: ellipse(300, 470, 250, 24), color: C.grey, size: 0.55 },
    { test: poly([[60, 440], [70, 330], [130, 240], [230, 190], [370, 190], [470, 240], [530, 330], [540, 440]]), color: C.crust, size: 0.95 },
    { test: ellipse(300, 300, 190, 70), color: C.gold, size: 0.7 },                // golden top
    { test: capsule(170, 380, 260, 270, 11), color: C.ink, size: 0.55 },            // scoring
    { test: capsule(270, 390, 360, 262, 11), color: C.ink, size: 0.55 },
    { test: capsule(370, 390, 450, 280, 11), color: C.ink, size: 0.55 },
  ],
  gym: [
    { test: ellipse(300, 470, 240, 20), color: C.grey, size: 0.55 },
    { test: rrect(140, 278, 320, 44, 14), color: C.teal, size: 0.9 },             // handle
    { test: rrect(88, 186, 56, 228, 20), color: C.ink, size: 0.95 },              // plates
    { test: rrect(140, 214, 34, 172, 14), color: C.ink, size: 0.95 },
    { test: rrect(426, 214, 34, 172, 14), color: C.ink, size: 0.95 },
    { test: rrect(456, 186, 56, 228, 20), color: C.ink, size: 0.95 },
    { test: rrect(56, 286, 34, 28, 10), color: C.tealDark, size: 0.9 },
    { test: rrect(510, 286, 34, 28, 10), color: C.tealDark, size: 0.9 },
  ],
  watch: [
    { test: ellipse(300, 548, 150, 16), color: C.grey, size: 0.55 },
    { test: rrect(244, 30, 112, 100, 16), color: C.ink, size: 0.85 },             // strap
    { test: rrect(244, 410, 112, 110, 16), color: C.ink, size: 0.85 },
    { test: ring(300, 270, 128, 160), color: C.teal, size: 0.95 },                // bezel
    { test: circle(300, 270, 128), color: C.ink, size: 0.9 },                     // dial
    { test: ring(300, 270, 118, 124), color: C.tealDark, size: 0.6 },               // inner rim
    { test: rrect(452, 254, 26, 32, 8), color: C.tealDark, size: 0.9 },           // crown
    { test: capsule(300, 270, 300, 168, 9), color: C.yellow, size: 1, cls: 'hm' }, // minute hand
    { test: capsule(300, 270, 372, 300, 11), color: C.white, size: 1, cls: 'hh' }, // hour hand
  ],
};

// Steam over the bread: three curly wisps, each a wavy line of solid dots in the bread's colours,
// thinning out as it rises.
const steamWisps = () => [[228, 0.2], [300, 1.9], [372, 3.5]].map(([x0, phase], w) => {
  const dots = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + 16 * Math.sin(phase + t * Math.PI * 2.2);
    const y = 184 - t * 130;
    const r = 7.2 - t * 4.4;
    const color = [C.crust, C.gold, C.yellow][i % 3];
    dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}"/>`);
  }
  return `<g class="wisp w${w + 1}">${dots.join('')}</g>`;
}).join('');

// moving extras that sit on top of each scene (drawn as dots too)
const extras = {
  chairs: `<g class="fx fall">
      <g class="f1"><circle r="9" fill="${C.yellow}"/><circle cx="-14" cy="6" r="6" fill="${C.yellow}"/><circle cx="12" cy="10" r="5" fill="${C.gold}"/></g>
      <g class="f2"><circle r="7" fill="${C.ink}"/><circle cx="12" cy="-4" r="7" fill="${C.ink}"/><circle cx="24" cy="2" r="7" fill="${C.ink}"/><circle cx="6" cy="10" r="5" fill="${C.teal}"/></g>
      <g class="f3"><circle r="11" fill="${C.gold}"/><circle cx="-4" cy="-4" r="4" fill="${C.yellow}"/></g>
      <g class="f4"><circle r="6" fill="${C.tealDark}"/><circle cx="10" cy="8" r="5" fill="${C.tealDark}"/><circle cx="-8" cy="10" r="4" fill="${C.teal}"/></g>
    </g>`,
  bread: `<g class="fx steam">${steamWisps()}</g><g class="fx crumbs">${[[230, 290, 7], [330, 260, 6], [410, 320, 8], [270, 270, 5], [370, 290, 6], [200, 320, 5]].map(([x, y, r], i) => `<circle class="c${i + 1}" cx="${x}" cy="${y}" r="${r}" fill="${C.crust}"/>`).join('')}</g>`,
  gym: `<g class="fx drops">${[[120, 220, 9], [480, 230, 10], [300, 300, 7], [160, 240, 6], [440, 250, 7]].map(([x, y, r], i) => `<circle class="d${i + 1}" cx="${x}" cy="${y}" r="${r}" fill="${C.teal}"/>`).join('')}</g>`,
  watch: `<g class="fx sand">${Array.from({ length: 10 }, (_, i) => `<circle class="g${i + 1}" cx="${410 + ((i * 7) % 9) - 4}" cy="384" r="${3 + (i % 3)}" fill="${C.sand}"/>`).join('')}<path class="pile" d="M330 540q80-56 160 0z" fill="${C.gold}"/></g>`,
};

let html = '';
const counts = {};
for (const [name, layers] of Object.entries(scenes)) {
  const dots = render(layers);
  counts[name] = dots.length;
  // stagger: each dot pops in by its distance from the scene's centre
  const dot = (d) => {
    const delay = Math.round((Math.hypot(d.x - 300, d.y - 300) / 420) * 700);
    return `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}" fill="${d.color}" style="--d:${delay}ms"/>`;
  };
  const body = dots.filter((d) => !d.cls).map(dot).join('');
  const hands = ['hh', 'hm'].map((k) => { const ds = dots.filter((d) => d.cls === k); return ds.length ? `<g class="hand-${k}">${ds.map(dot).join('')}</g>` : ''; }).join('');
  html += `          <svg class="stage-img dot-scene scene-${name}" viewBox="0 0 600 600" aria-hidden="true"><g class="dots">${body}${hands}</g>${extras[name]}</svg>\n`;
}
fs.writeFileSync(process.argv[2], html);
console.log(counts, Math.round(html.length / 1024) + ' KB');
