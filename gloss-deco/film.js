// Studio GLOSS · "הערב, על השער" — Art Deco, vertical 1080×1920, slow foxtrot 96 BPM (beat .625 s, bar 2.5 s), Hebrew.
import * as D from './engine/deco.js';
import * as TY from './engine/type.js';
const { C, TAU, clamp, lerp, seg, ss, eio, eo, ei, back, mix, rgba, gline, airbrush, sunburst, sparkle, glow, toPath, arcPts, polyLen } = D;

export const DUR = 32.5;
const W = 1080, H = 1920, CX = 540;
const BEAT = .625, E8 = .3125, BAR = 2.5;
const PINK = '#FFC9DC', BURG = '#6B0F1E', BURGD = '#3A0610', CREAM = '#F8F2E7';
const mech = p => back(clamp(p), .9);                 // firm, with a small settle

// ---------- timeline ----------
const T = {
  line: 0, burst: .625, arch: [.625, 1.875], title: 1.875, bulbs: 2.5, sheen1: 3.75,
  rooms: [5.0, 7.5, 10.0, 12.5], roll: 14.375, reveal: 15.0, head: 17.5, sheen2: 20.0, capR: 19.375,
  kal: 22.5, lock: 25.0, capK: 24.0, end: 27.5, plaque: 27.8, slogan: 28.125, cta: 29.0, fin: 31.25,
};
// door cycles: [start closing, closed, open duration]
const DOORS = [[4.6875, 5.0, .5], [7.1875, 7.5, .5], [9.6875, 10.0, .5], [12.1875, 12.5, .5], [14.375, 15.0, .9], [27.1875, 27.5, 99]];
function doorClosed(t) {
  let c = 0;
  for (const [a, b, d] of DOORS) {
    if (t < a) continue;
    if (t < b) c = Math.max(c, eio(seg(t, a, Math.min(b, a + .3125))));
    else c = Math.max(c, 1 - mech(seg(t, b, b + d)));
  }
  return clamp(c);
}

let g, LOGO, LOGO_PINK, TX = [];
function reg(id, text, x0, y0, x1, y1, pass) { TX.push({ id, text, x0, y0, x1, y1, ...(pass ? { pass: true } : {}) }); }

// ---------- background: lacquer, slow burgundy wedges ----------
function background(t, cy = 820) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1C070C'); gr.addColorStop(.55, '#140508'); gr.addColorStop(1, '#0B0304');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  sunburst(g, CX, cy, { rays: 40, r1: 2200, mode: 'wedges', rot: t * .025, colorA: 'rgba(107,15,30,.30)' });
  glow(g, CX, cy, 900, '#6B0F1E', .35);
}

// ---------- bulbs ----------
function bulb(x, y, r, v) {
  g.beginPath(); g.arc(x, y, r * 1.3, 0, TAU); g.fillStyle = '#2A0C10'; g.fill();
  g.beginPath(); g.arc(x, y, r * 1.3, 0, TAU); g.strokeStyle = v > .05 ? C.gold2 : C.gold0; g.lineWidth = Math.max(1, r * .25); g.stroke();
  if (v <= .02) {
    const gr = g.createRadialGradient(x - r * .35, y - r * .35, 0, x, y, r); gr.addColorStop(0, '#4A2A2A'); gr.addColorStop(1, '#120507');
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = gr; g.fill(); return;
  }
  const vv = clamp(v, 0, 1.6);
  g.save(); g.globalCompositeOperation = 'lighter';
  const hr = r * (3.4 + 1.8 * Math.max(0, vv - 1));
  const gh = g.createRadialGradient(x, y, 0, x, y, hr); gh.addColorStop(0, `rgba(255,200,180,${.55 * Math.min(1, vv)})`); gh.addColorStop(.35, `rgba(255,170,160,${.16 * Math.min(1, vv)})`); gh.addColorStop(1, 'rgba(255,170,160,0)');
  g.fillStyle = gh; g.fillRect(x - hr, y - hr, hr * 2, hr * 2); g.restore();
  const cr = g.createRadialGradient(x, y, 0, x, y, r); cr.addColorStop(0, '#FFFAF6'); cr.addColorStop(.55, mix('#3A1A18', '#FFE3D6', Math.min(1, vv))); cr.addColorStop(1, mix('#1A0A0A', '#C08070', Math.min(1, vv)));
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = cr; g.fill();
}
const ign = (t, t0) => { if (t < t0) return 0; const d = t - t0; let v = d < .18 ? 1 + .6 * (1 - d / .18) : 1; if (d < .05) v *= d / .05 * .7 + .3; return v; };
function along(pts, n) {          // n points evenly spaced along a polyline
  const L = polyLen(pts), out = []; let acc = 0, i = 1;
  for (let k = 0; k < n; k++) {
    const want = L * (k + .5) / n;
    while (i < pts.length) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + d >= want) { const f = (want - acc) / d; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; } acc += d; i++; }
  }
  return out;
}

// ---------- door leaves (slide from the edges; when shut, the seam medallion is whole) ----------
function doors(t) {
  const c = doorClosed(t); if (c <= 0) return;
  const off = (1 - c) * 560;
  for (const s of [-1, 1]) {
    g.save();
    g.translate(s * off, 0);
    const x0 = s < 0 ? 0 : CX, x1 = s < 0 ? CX : W;
    g.beginPath(); g.rect(x0, 0, x1 - x0, H); g.clip();
    airbrush(g, [[x0, 0], [x1, 0], [x1, H], [x0, H]], { base: BURG, dark: '#22040A', light: '#8E1E32', dir: s < 0 ? -2.6 : -.5 });
    // panels
    const px0 = x0 + 46, px1 = x1 - 46;
    gline(g, D.rectPts(px0, 120, px1 - px0, 560), { w: 2.2, closed: true });
    gline(g, D.rectPts(px0, 1100, px1 - px0, 700), { w: 2.2, closed: true });
    gline(g, D.rectPts(px0 + 16, 136, px1 - px0 - 32, 528), { w: 1, closed: true });
    D.chevrons(g, px0 + 20, px1 - 20, 1160, { n: 8, h: 26, rows: 3, gap: 14, w: 1.6 });
    D.fishScale(g, px0 + 18, 1290, px1 - px0 - 36, 490, 36, { stroke: 'rgba(185,128,111,.65)', fillA: '#4A0A16', fillB: '#5A0E1C' });
    // seam rules
    const sx = s < 0 ? CX - 14 : CX + 14;
    D.rules(g, sx, 0, sx, H, 2, 7, 1.4);
    g.restore();
  }
  // the medallion: two halves meet at the seam (the end card's plaque takes its place)
  if (t >= T.end + .2) return;
  const r = 190, cy = 870;
  for (const s of [-1, 1]) {
    g.save(); g.translate(s * off, 0);
    g.beginPath(); g.rect(s < 0 ? 0 : CX, 0, CX, H); g.clip();
    g.beginPath(); g.arc(CX, cy, r, 0, TAU); const gr = g.createRadialGradient(CX - 60, cy - 60, 0, CX, cy, r); gr.addColorStop(0, '#5A1020'); gr.addColorStop(1, '#1A0408'); g.fillStyle = gr; g.fill();
    sunburst(g, CX, cy, { rays: 32, r0: r * .32, r1: r * .92, mode: 'lines', w: 1.6, alpha: .9 });
    gline(g, arcPts(CX, cy, r, 0, TAU, 80), { w: 3 }); gline(g, arcPts(CX, cy, r * .3, 0, TAU, 40), { w: 1.6 });
    g.restore();
  }
}

// ---------- the arch with counted bulbs ----------
function archWithBulbs(t, cx, base, w, h, part, bulbsT, n, rOpt = {}) {
  D.archFrame(g, cx, base, w, h, { rings: 3, gap: 16, part, burst: true, glow: .25, sheen: .3 + .1 * Math.sin(t * .8), lw: 2.6 });
  const outer = D.stepArchPts(cx, base, w + 70, h + 35, { steps: 3 });
  const P = along(outer, n);
  P.forEach(([x, y], i) => {
    // symmetric ignition: from both feet up to the crown
    const k = Math.min(i, n - 1 - i), t0 = bulbsT(k, i);
    let v = ign(t, t0);
    if (rOpt.chase != null && t > rOpt.chase) { const ph = ((i - (t - rOpt.chase) * 10) % 4 + 4) % 4; v = ph < 1.2 ? 1.25 : .7; }
    if (part > .02) bulb(x, y, rOpt.r ?? 9, v * clamp(part * 3));
  });
}

// ---------- scene 1: the overture ----------
function scene1(t) {
  if (t >= 5.0) return;
  const push = 1 + .05 * ss(seg(t, 0, 5));
  g.save(); g.translate(CX, 820); g.scale(push, push); g.translate(-CX, -820);
  const lp = eo(seg(t, 0, T.burst));
  if (lp > 0 && t < T.arch[1]) gline(g, [[CX, 820 - 560 * lp], [CX, 820 + 560 * lp]], { w: 2.4, glow: 1 });
  glow(g, CX, 820, 120 + 260 * lp, '#FFC2B0', .5 * (1 - seg(t, T.burst, 2)));
  const bp = eo(seg(t, T.burst, T.burst + .7));
  if (bp > 0) sunburst(g, CX, 820, { rays: 72, r0: 40, r1: 1400 * bp, mode: 'lines', w: 2.2, alpha: .55, rot: t * .04, sheen: lerp(-.2, 1.2, seg(t, T.sheen1, T.sheen1 + 1)) });
  const ap = ss(seg(t, T.arch[0], T.arch[1]));
  archWithBulbs(t, CX, 1330, 880, 1010, ap, k => T.bulbs + k * (E8 / 2), 34, { chase: 4.0, r: 9 });
  // the title unfolds from the centre
  const tp = seg(t, T.title, T.title + 1.0);
  TY.titleBar(g, 'הערב, על השער', CX, 820, { p: tp, size: 92, track: 0, sub: 'סטודיו GLOSS מציג', subSize: 30, sheen: lerp(-.2, 1.2, seg(t, T.sheen1, T.sheen1 + .9)) });
  if (tp >= .86) reg('title', 'הערב, על השער', 140, 740, 940, 900);
  // sparkles at the crown
  [[CX, 380, 0], [CX - 260, 560, .4], [CX + 260, 560, .8]].forEach(([x, y, d]) => { const s = Math.sin(clamp((t - 2.6 - d) / .7) * Math.PI); sparkle(g, x, y, 46 * s, { alpha: s }); });
  g.restore();
}

// ---------- scene 2: four rooms ----------
const ROOMS = [['ראיון בלעדי', 4], ['הפלייליסט', 8], ['המתכון', 10], ['אלבום וברכות', 14]];
function roomIndex(t) { let k = -1; T.rooms.forEach((r, i) => { if (t >= r) k = i; }); return k; }
function mic(t, cx, cy, k) {
  // sound rings radiate on every beat
  for (let i = 0; i < 4; i++) { const ph = ((t - T.rooms[0]) / BEAT + i / 4) % 1; gline(g, arcPts(cx, cy - 70, 180 + ph * 260, -Math.PI * .85, -Math.PI * .15, 40), { w: 2, alpha: (1 - ph) * .9 * k }); }
  const rot = Math.sin((t - T.rooms[0]) * 2.2) * .05;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(k, k);
  const cap = new Path2D(); cap.roundRect(-105, -260, 210, 330, 105);
  airbrush(g, cap, { base: '#C99484', dark: '#5E2F2B', light: '#FFE6DA', bbox: [-105, -260, 105, 70], rim: 3 });
  g.save(); g.clip(cap); for (let y = -230; y < 70; y += 22) gline(g, [[-110, y], [110, y]], { w: 1.4, color: '#4A1A18' }); g.restore();
  gline(g, [[-105, -95], [105, -95]], { w: 6 });
  gline(g, [[0, 70], [0, 210]], { w: 10 });
  const st = [[-150, 250], [-150, 228], [-90, 228], [-90, 210], [90, 210], [90, 228], [150, 228], [150, 250], [-150, 250]];
  airbrush(g, st, { base: '#B9806F', rim: 2 }); gline(g, st, { w: 2, closed: true });
  g.restore();
}
function record(t, cx, cy, k) {
  const a = (t - T.rooms[1]) * 3.4, R = 260 * k;
  g.save(); g.translate(cx, cy);
  g.beginPath(); g.arc(0, 0, R, 0, TAU); const gr = g.createRadialGradient(-60, -60, 0, 0, 0, R); gr.addColorStop(0, '#3A1418'); gr.addColorStop(1, '#0B0304'); g.fillStyle = gr; g.fill();
  for (let r = R * .42; r < R * .97; r += 9) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.strokeStyle = 'rgba(185,128,111,.22)'; g.lineWidth = 1; g.stroke(); }
  g.save(); g.rotate(a); for (const s of [0, Math.PI]) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, s - .22, s + .22); g.closePath(); g.fillStyle = 'rgba(255,220,205,.10)'; g.fill(); }
  g.beginPath(); g.arc(0, 0, R * .36, 0, TAU); g.fillStyle = BURG; g.fill(); sunburst(g, 0, 0, { rays: 16, r0: R * .08, r1: R * .34, mode: 'lines', w: 1.4 }); g.restore();
  gline(g, arcPts(0, 0, R, 0, TAU, 90), { w: 2.6 }); gline(g, arcPts(0, 0, R * .36, 0, TAU, 40), { w: 1.6 });
  g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fillStyle = C.gold2; g.fill();
  // tone arm swings in
  const arm = lerp(-.5, .32, mech(seg(t, T.rooms[1] + .2, T.rooms[1] + .8)));
  g.translate(R * .95, -R * .95); g.rotate(arm);
  gline(g, [[0, 0], [-20, R * .75], [-80, R * 1.05]], { w: 7 });
  g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fillStyle = '#B9806F'; g.fill(); gline(g, arcPts(0, 0, 26, 0, TAU, 30), { w: 2 });
  g.restore();
}
function cake(t, cx, base, k) {
  const tiers = [[460, 150], [340, 130], [220, 110]];
  let y = base;
  tiers.forEach(([w, h], i) => {
    const p = mech(seg(t, T.rooms[2] + .1 + i * .3125, T.rooms[2] + .45 + i * .3125)); if (p <= 0) return;
    const yy = y - h, dy = (1 - p) * 120;
    g.save(); g.globalAlpha = clamp(p * 2);
    const pts = D.rectPts(cx - w / 2, yy + dy, w, h);
    airbrush(g, pts, { base: '#F3E6DA', dark: '#B99A8C', light: '#FFFFFF', rim: 3 });
    gline(g, pts, { w: 2.4, closed: true });
    D.chevrons(g, cx - w / 2 + 12, cx + w / 2 - 12, yy + dy + h * .38, { n: Math.round(w / 40), h: 16, rows: 2, gap: 12, w: 1.6 });
    g.restore();
    y = yy;
  });
  const cp = seg(t, T.rooms[2] + 1.2, T.rooms[2] + 1.5);
  if (cp > 0) {
    gline(g, [[cx, y], [cx, y - 80 * cp]], { w: 8 });
    const fl = 1 + .12 * Math.sin(t * 31) + .08 * Math.sin(t * 17);
    glow(g, cx, y - 110, 140 * cp, '#FFC2B0', .6 * cp);
    g.save(); g.translate(cx, y - 108); g.scale(cp, cp * fl);
    g.beginPath(); g.moveTo(0, -38); g.quadraticCurveTo(20, 0, 0, 22); g.quadraticCurveTo(-20, 0, 0, -38); g.fillStyle = '#FFE8DC'; g.fill(); g.restore();
  }
}
function album(t, cx, cy, k) {
  const open = mech(seg(t, T.rooms[3] + .1, T.rooms[3] + .8));
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * .26 * open;
    g.save(); g.translate(cx, cy + 260); g.rotate(a); g.translate(0, -260);
    const w = 250, h = 320, pts = D.rectPts(-w / 2, -h / 2, w, h);
    airbrush(g, pts, { base: '#F3E6DA', dark: '#C9B4A6', light: '#FFFFFF' });
    gline(g, pts, { w: 2, closed: true });
    const win = D.rectPts(-w / 2 + 22, -h / 2 + 22, w - 44, h - 92);
    g.save(); g.beginPath(); g.rect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 92); g.clip();
    g.fillStyle = [BURG, '#5A1020', '#7A1A2C', '#4A0A16', '#8E1E32'][i]; g.fillRect(-w / 2, -h / 2, w, h);
    sunburst(g, 0, h / 2 - 70, { rays: 18, r1: 260, mode: 'lines', w: 1.6, alpha: .8, a0: Math.PI, a1: TAU });
    g.beginPath(); g.arc(0, h / 2 - 70, 46, Math.PI, TAU); g.fillStyle = C.gold1; g.fill();
    g.restore();
    gline(g, win, { w: 1.4, closed: true });
    g.restore();
  }
}
function scene2(t) {
  if (t < T.rooms[0] - .4 || t >= T.reveal) return;
  const k = roomIndex(t); if (k < 0) return;
  const t0 = T.rooms[k];
  archWithBulbs(t, CX, 1250, 780, 780, 1, () => -1, 28, { chase: t0, r: 8 });
  const p = eo(seg(t, t0, t0 + .5));
  if (k === 0) mic(t, CX, 800, lerp(.85, 1, p));
  if (k === 1) record(t, CX, 820, lerp(.85, 1, p));
  if (k === 2) cake(t, CX, 1060, 1);
  if (k === 3) album(t, CX, 830, 1);
}
// the dial and the room card ride above the doors
function roomHUD(t) {
  if (t < T.rooms[0] - .3 || t >= T.reveal + .2) return;
  const a = eio(seg(t, T.rooms[0] - .3, T.rooms[0])) * (1 - eio(seg(t, T.reveal - .1, T.reveal + .2)));
  if (a <= 0) return;
  const k = Math.max(0, roomIndex(t));
  // page dial: needle swings mechanically to each room's page
  const pages = ROOMS.map(r => r[1]);
  let v = 0; T.rooms.forEach((r, i) => { v = lerp(v, (pages[i] - 1) / 15, mech(seg(t, r, r + .5))); });
  g.save(); g.globalAlpha = a;
  TY.dial(g, CX, 300, 120, v, { labels: ['01', '04', '08', '12', '16'], ticks: 15 });
  TY.goldText(g, 'עמוד', CX, 362, { size: 26, font: 'Heebo', weight: 500, shadow: false });
  g.restore();
  // the card: text swaps upward on each door hit
  const cy = 1330, idx = roomIndex(t);
  TY.subtitleCard(g, ROOMS[Math.max(0, idx)][0], { p: seg(t, T.rooms[0] - .3, T.rooms[0] + .2), out: seg(t, T.reveal - .1, T.reveal + .2), cx: CX, cy, size: 50, maxW: 760 });
  if (idx >= 0 && t >= T.rooms[0] + .2 && t < T.reveal - .1) {
    const s = ROOMS[idx][0]; const w = TY.measure(g, s, 50, 'Heebo', 0, 500);
    reg('room', s, CX - w / 2, cy - 30, CX + w / 2, cy + 30);
  }
}

// ---------- the cover ----------
const CLINES = ['ראיון בלעדי', 'הטופ 5 שלה', 'הפלייליסט של החיים', 'המתכון המפורסם'];
function cover(t, cx, cy, s, o = {}) {
  const w = 560, h = 760;
  g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-w / 2, -h / 2);
  const pts = D.rectPts(0, 0, w, h);
  g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = PINK; g.fillRect(0, 0, w, h); g.restore();
  airbrush(g, pts, { base: PINK, dark: '#E9A9BE', light: '#FFF0F5', dir: -2.2 });
  // masthead
  const lw = 440, lh = lw * LOGO.height / LOGO.width;
  g.drawImage(LOGO, (w - lw) / 2, 34, lw, lh);
  g.fillStyle = BURG; g.fillRect(36, 34 + lh + 18, w - 72, 2);
  g.direction = 'rtl'; g.textAlign = 'right'; g.font = '500 20px Heebo'; g.fillStyle = BURG;
  g.fillText('גיליון מיוחד · עותק אחד בלבד', w - 36, 34 + lh + 50);
  g.font = '700 26px Heebo';
  CLINES.forEach((s2, i) => g.fillText(s2, w - 36, 34 + lh + 108 + i * 44));
  // a deco ornament: half sunburst rising behind the headline
  g.save(); g.globalAlpha = .55; sunburst(g, w / 2, h - 40, { rays: 26, r0: 60, r1: 340, a0: Math.PI, a1: TAU, mode: 'lines', w: 1.6, color: BURG }); g.restore();
  // headline, engraved right → left
  const hp = o.head ?? 1;
  if (hp > 0) {
    g.font = '900 200px FrankRuhl'; g.textAlign = 'center';
    const tw = g.measureText('אמא.').width;
    g.save(); g.beginPath(); g.rect(w / 2 + tw / 2 + 20 - (tw + 40) * hp, h - 260, (tw + 40) * hp, 260); g.clip();
    g.fillStyle = BURG; g.fillText('אמא.', w / 2, h - 48); g.restore();
    if (hp < 1) sparkle(g, w / 2 + tw / 2 + 20 - (tw + 40) * hp, h - 130, 40);
  }
  gline(g, pts, { w: 3, closed: true, sheen: o.sheen ?? .4 });
  gline(g, D.rectPts(12, 12, w - 24, h - 24), { w: 1.2, closed: true });
  // sheen sweep: a diagonal band of light across the paper
  if (o.sheen != null && o.sheen > -.15 && o.sheen < 1.15) {
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip(); g.globalCompositeOperation = 'lighter';
    const x = lerp(-w, w * 2, o.sheen);
    const gr = g.createLinearGradient(x - 160, 0, x + 160, h * .4); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,245,240,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
  }
  g.restore();
  return { w: w * s, h: h * s };
}

// ---------- scene 3: the reveal ----------
function scene3(t) {
  if (t < T.reveal - .2 || t >= T.kal + 1.2) return;
  const push = 1 + .06 * ss(seg(t, 16, 22.5));
  g.save(); g.translate(CX, 800); g.scale(push, push); g.translate(-CX, -800);
  sunburst(g, CX, 800, { rays: 64, r0: 330, r1: 1300, mode: 'lines', w: 2, alpha: .5, rot: t * .05 });
  glow(g, CX, 800, 700, '#FFC2B0', .25 + .1 * Math.sin(t * 2));
  archWithBulbs(t, CX, 1340, 900, 1120, 1, (k, i) => T.reveal + (i < 16 ? i : 31 - i) * 0 + Math.min(i, 31 - i) * E8 * 1.0, 32, { chase: 20.0, r: 10 });
  const sc = lerp(.82, 1, mech(seg(t, T.reveal + .1, T.reveal + .9)));
  cover(t, CX, 790, sc, { head: seg(t, T.head, T.head + .6), sheen: lerp(-.3, 1.3, seg(t, T.sheen2, T.sheen2 + 1)) });
  if (t >= T.head + .6) reg('head', 'אמא.', CX - 200, 900, CX + 200, 1110);
  // sparkle burst on the sheen
  for (let i = 0; i < 6; i++) { const s = Math.sin(clamp((t - T.sheen2 - i * .15) / .6) * Math.PI); const a = i / 6 * TAU; sparkle(g, CX + Math.cos(a) * 340, 790 + Math.sin(a) * 420, 34 * s, { alpha: s }); }
  g.restore();
  // page count medallion below the arch: 01 → 16 with the bulbs
  const n = clamp(Math.floor((t - T.reveal) / E8) + 1, 1, 16);
  if (t >= T.reveal && t < T.kal) TY.floorMedallion(g, String(n).padStart(2, '0'), CX, 1470, 70, { lit: 1 });
  if (t >= T.reveal && t < T.kal) reg('n', String(n), CX - 40, 1440, CX + 40, 1500, true);
  // caption card
  TY.subtitleCard(g, '16 עמודים. רק עליה.', { p: seg(t, T.capR, T.capR + .5), out: seg(t, T.kal, T.kal + .3), cx: CX, cy: 1610, size: 40, maxW: 800 });
  if (t >= T.capR + .5 && t < T.kal) reg('capR', '16 עמודים. רק עליה.', 300, 1580, 780, 1640);
}

// ---------- scene 4: the kaleidoscope ----------
const NAMES = ['סבא וסבתא', 'שנה ביחד', 'אבא, 70', 'נועה, 30', '50 שנה', 'החברה הכי טובה', 'רוני ודניאל', 'סבתא רחל'];
function smallCover(name, s) {
  const w = 560, h = 760;
  g.save(); g.scale(s, s); g.translate(-w / 2, -h / 2);
  const pts = D.rectPts(0, 0, w, h);
  airbrush(g, pts, { base: CREAM, dark: '#D9C7B5', light: '#FFFFFF' });
  const lw = 400, lh = lw * LOGO.height / LOGO.width; g.drawImage(LOGO, (w - lw) / 2, 40, lw, lh);
  g.save(); g.globalAlpha = .5; sunburst(g, w / 2, h - 40, { rays: 22, r0: 60, r1: 320, a0: Math.PI, a1: TAU, mode: 'lines', w: 1.6 }); g.restore();
  g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = BURG;
  let fs = 130; g.font = `900 ${fs}px FrankRuhl`; const tw = g.measureText(name).width; if (tw > w - 70) { fs = fs * (w - 70) / tw; g.font = `900 ${fs}px FrankRuhl`; }
  g.fillText(name, w / 2, h - 70);
  gline(g, pts, { w: 3, closed: true });
  g.restore();
}
function scene4(t) {
  if (t < T.kal - .1 || t >= T.end + .2) return;
  const cy = 780, p = seg(t, T.kal, T.lock);
  const spin = (1 - eo(p)) * 5.5 + ((t > T.lock) ? 0 : 0);          // decelerates, locks on the downbeat
  const out = mech(seg(t, T.kal, T.kal + 1.0));
  sunburst(g, CX, cy, { rays: 48, r0: 200, r1: 1400, mode: 'lines', w: 2, alpha: .45, rot: -spin * .4 });
  const clang = Math.sin(clamp((t - T.lock) / .5) * Math.PI);
  if (clang > 0) glow(g, CX, cy, 800, '#FFC2B0', .4 * clang);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU - Math.PI / 2 + spin, R = 360 * out;
    g.save(); g.translate(CX + Math.cos(a) * R, cy + Math.sin(a) * R); g.rotate(a + Math.PI / 2);
    smallCover(NAMES[i], .3 * out + .001);
    g.restore();
  }
  // the hero cover, centre, shrinking from full size
  const s = lerp(1, .4, mech(seg(t, T.kal, T.kal + 1.0)));
  cover(t, CX, lerp(790, cy, seg(t, T.kal, T.kal + 1)), s, { head: 1 });
  // a rose-gold ring locks around the wheel
  const rp = eo(seg(t, T.lock - .3, T.lock));
  if (rp > 0) { gline(g, arcPts(CX, cy, 590, -Math.PI / 2, -Math.PI / 2 + TAU * rp, 120), { w: 3, glow: .6 }); gline(g, arcPts(CX, cy, 604, -Math.PI / 2, -Math.PI / 2 + TAU * rp, 120), { w: 1.2 }); }
  TY.subtitleCard(g, 'לכל אחד, השער שלו.', { p: seg(t, T.capK, T.capK + .5), out: seg(t, T.end - .35, T.end - .05), cx: CX, cy: 1470, size: 46, maxW: 820 });
  if (t >= T.capK + .5 && t < T.end - .35) reg('capK', 'לכל אחד, השער שלו.', 260, 1440, 820, 1500);
}

// ---------- scene 5: the end card, on the shut doors ----------
function scene5(t) {
  if (t < T.end) return;
  // plaque unfolds from the centre
  const pp = seg(t, T.plaque, T.plaque + .6), pw = 820 * eio(seg(pp, 0, .6)), ph = 330 * eio(seg(pp, .3, 1));
  if (pw > 2) {
    const pts = D.rectPts(CX - pw / 2, 560 - ph / 2, pw, Math.max(2, ph));
    if (ph > 2) airbrush(g, pts, { base: CREAM, dark: '#E2D3C2', light: '#FFFFFF' });
    gline(g, pts, { w: 3, closed: true, glow: .4 });
    if (ph > 20) gline(g, D.rectPts(CX - pw / 2 + 14, 560 - ph / 2 + 14, pw - 28, ph - 28), { w: 1.2, closed: true });
    const la = ss(seg(pp, .6, 1));
    if (la > 0) { const lw = 640, lh = lw * LOGO.height / LOGO.width; g.save(); g.globalAlpha = la; g.drawImage(LOGO, CX - lw / 2, 560 - lh / 2 + (1 - la) * 20, lw, lh); g.restore(); }
    // sheen across the plaque at the end
    const sh = seg(t, T.fin, T.fin + .9);
    if (sh > 0 && sh < 1) { g.save(); g.beginPath(); g.rect(CX - pw / 2, 560 - ph / 2, pw, ph); g.clip(); g.globalCompositeOperation = 'lighter'; const x = lerp(CX - pw, CX + pw, sh); const gr = g.createLinearGradient(x - 120, 400, x + 120, 720); gr.addColorStop(0, 'rgba(255,240,230,0)'); gr.addColorStop(.5, 'rgba(255,240,230,.5)'); gr.addColorStop(1, 'rgba(255,240,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
  }
  // slogan bar
  const sp = seg(t, T.slogan, T.slogan + 1.0);
  TY.titleBar(g, 'הסיפור שלהם. בעיתון אחד.', CX, 900, { p: sp, size: 66, track: 0, sub: 'מגזין אישי במתנה · 16 עמודים · 300 ₪', subSize: 26, wings: false });
  if (sp >= .86) { reg('slogan', 'הסיפור שלהם. בעיתון אחד.', 160, 850, 920, 930); reg('det', 'מגזין אישי במתנה · 16 עמודים · 300 ₪', 220, 930, 860, 990); }
  // the button, framed in bulbs that light one by one, then chase
  const bp = seg(t, T.cta, T.cta + .5);
  if (bp > 0) {
    const bw = 760 * eio(bp), bh = 210, by = 1180;
    const pts = D.rectPts(CX - bw / 2, by - bh / 2, bw, bh);
    g.fillStyle = 'rgba(26,4,8,.94)'; g.fill(toPath(pts, true));
    gline(g, pts, { w: 3, closed: true }); gline(g, D.rectPts(CX - bw / 2 + 12, by - bh / 2 + 12, bw - 24, bh - 24), { w: 1, closed: true });
    if (bp >= 1) {
      const per = along(pts, 34);
      per.forEach(([x, y], i) => { let v = ign(t, T.cta + .5 + i * .03); if (t > T.cta + 1.6) { const ph = ((i - (t - T.cta - 1.6) * 12) % 5 + 5) % 5; v = ph < 1.5 ? 1.25 : .65; } bulb(x, y, 7, v); });
      const ta = ss(seg(t, T.cta + .4, T.cta + .8));
      TY.goldText(g, 'להזמנה בוואטסאפ', CX, by + 10, { size: 64, sheen: lerp(-.2, 1.2, seg(t, T.fin, T.fin + 1)), alpha: ta });
      g.save(); g.globalAlpha = ta; g.direction = 'ltr'; g.textAlign = 'center'; g.font = '40px Bellefair'; g.fillStyle = CREAM; g.fillText('050-385-0012', CX, by + 70); g.restore();
      if (ta >= 1) { reg('cta', 'להזמנה בוואטסאפ', CX - 270, by - 50, CX + 270, by + 20); reg('tel', '050-385-0012', CX - 130, by + 40, CX + 130, by + 80); }
    }
  }
  [[CX + 380, 410, 0], [CX - 380, 710, .25], [CX, 1300, .5]].forEach(([x, y, d]) => { const s = Math.sin(clamp((t - T.fin - d) / .8) * Math.PI); sparkle(g, x, y, 50 * s, { alpha: s }); });
}

// ---------- frame ----------
export function render(ctx, t) {
  g = ctx; TX = [];
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  background(t, t < T.kal ? 820 : 780);
  scene1(t); scene2(t); scene3(t); scene4(t);
  doors(t);
  roomHUD(t);
  scene5(t);
  D.vignette(g, W, H, .45);
  return TX;
}

// ---------- events for the mixer ----------
export function events() {
  const ev = [], add = (t, type, o = {}) => ev.push({ t, type, ...o });
  add(0, 'engrave', { d: .62 }); add(T.burst, 'shimmer', { g: 1.2 }); add(T.arch[0], 'engrave', { d: 1.2, g: .6 });
  add(T.title, 'chunk', { g: .6 }); add(T.title + .5, 'shimmer', { g: .6 });
  for (let k = 0; k < 17; k++) add(T.bulbs + k * E8 / 2, 'relay', { g: .5 });
  add(T.sheen1, 'shimmer', { g: .8 });
  DOORS.forEach(([a, b, d]) => { add(b, 'chunk'); if (d < 50) add(b + .02, 'spring', { g: .6 }); });
  T.rooms.forEach(r => add(r + .5, 'click'));
  add(T.rooms[1] + .8, 'needle'); [0, 1, 2].forEach(i => add(T.rooms[2] + .45 + i * .3125, 'thud', { g: .7 })); add(T.rooms[2] + 1.2, 'match');
  add(T.rooms[3] + .1, 'flutter');
  add(T.reveal + .05, 'cork'); add(T.reveal, 'hum', { d: 7.5 });
  for (let i = 0; i < 16; i++) add(T.reveal + i * E8, 'relay', { g: .8 });
  add(T.head, 'engrave', { d: .6, g: .9 }); add(T.sheen2, 'shimmer', { g: 1.1 });
  add(T.kal, 'whir', { d: 2.5 }); add(T.lock, 'clang');
  add(T.plaque, 'shimmer', { g: .7 }); add(T.slogan, 'chunk', { g: .5 });
  for (let i = 0; i < 34; i++) add(T.cta + .5 + i * .03, 'relay', { g: .25 });
  add(T.fin, 'shimmer', { g: 1.1 });
  return ev;
}

// ---------- boot ----------
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
await Promise.all([...[300, 500, 700, 900].map(w => document.fonts.load(`${w} 40px Heebo`, 'אב')), document.fonts.load('900 40px FrankRuhl', 'אב'), document.fonts.load('40px Bellefair', '0123')]);
[LOGO, LOGO_PINK] = await Promise.all([load('assets/gloss-logo.png'), load('assets/gloss-logo-pink.png')]);
window.DUR = DUR;
window.EV = events();
window.render = t => render(ctx, t);
window.TEXTS = t => render(ctx, t);
window.READY = true;
