// Studio GLOSS · "16 עמודים של אור" — Glass Product Render, vertical 1080×1920, 90 BPM (beat .6667 s, bar 2.6667 s)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { makePost } from './post.js';
import { clamp, seg, eio, eo, ei, ss, lerp, hash } from '/core/lib.js';
import { makeStudio } from './studio.js';
import { pageCanvases } from './pages.js';

const QS = new URLSearchParams(location.search);
const W = 1080, H = 1920, SSAA = +(QS.get('ssaa') || 2);
export const DUR = 32;
const BEAT = 2 / 3, BAR = 8 / 3;
const b = n => +(n * BEAT).toFixed(4);           // beat → seconds
const T = {
  sweep1: [.2, 2.4], sweep2: [2.67, 4.9], t1: [b(2), b(8) - .25],
  reveal: b(8), frost: [b(8), b(12)], rack: [b(10.5), b(12.5)], t2: [b(11), b(16) - .05], glint2: [b(12), b(13.8)],
  edge: b(16), expl: b(20), spread: [b(20), b(24)], t3: [b(24), b(29.4)], hush: b(30), snap: b(32),
  mono: b(33), t4: [b(33), b(39.4)], end: b(40),
};
// kicks drive the light: from the exploded view on
const KICKS = [];
for (let k = 20; k < 30; k++) { KICKS.push({ t: b(k), big: k % 4 === 0 }); if (k % 4 === 2) KICKS.push({ t: b(k + .5), big: false }); }
for (let k = 32; k < 40; k++) KICKS.push({ t: b(k), big: k === 32 || k === 36 });
const SHOTS = [[0, T.reveal, 'dark'], [T.reveal, T.edge, 'reveal'], [T.edge, T.expl, 'edge'], [T.expl, T.mono, 'explode'], [T.mono, T.end, 'monument'], [T.end, DUR + 1, 'end']];
const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

// ---------- renderer ----------
window.PROF = {};
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 1, 4000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SSAA, ao: false });
post.bloom.strength = .2; post.bloom.threshold = 1.1; post.bloom.radius = .4;
post.vig.uniforms.amt.value = .3; post.vig.uniforms.contrast.value = .1; post.vig.uniforms.sat.value = 1.0;
const studio = makeStudio(renderer, scene);
RectAreaLightUniformsLib.init();
const keyBox = new THREE.RectAreaLight('#fff4f0', 0, 120, 60); scene.add(keyBox);

// ---------- materials ----------
const glass = (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: '#ffffff', metalness: 0, roughness: .015, transmission: 1, thickness: 2.6, ior: 1.52, dispersion: 5, attenuationColor: new THREE.Color('#fbf3f4'), attenuationDistance: 140, specularIntensity: 1, envMapIntensity: 1.3, side: THREE.DoubleSide }, o));
const rose = (r = .22) => new THREE.MeshPhysicalMaterial({ color: '#E3B3A3', metalness: 1, roughness: r, envMapIntensity: 1.3 });
const PINK_A = new THREE.Color('#FFC9DC'), PINK_B = new THREE.Color('#E87A9A');
const WHITE = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 2, 2); return new THREE.CanvasTexture(c); })();
function guideMat() {   // dark polished acrylic with comet pulses along uv.x (the slab's light frame)
  const m = new THREE.MeshPhysicalMaterial({ color: '#1a1416', roughness: .08, clearcoat: 1, clearcoatRoughness: .05, emissive: '#ffffff', emissiveMap: WHITE, envMapIntensity: 1.3 });
  const U = { uP: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, .1, 0, 0)) }, uBase: { value: .02 }, uA: { value: PINK_A }, uB: { value: PINK_B } };
  m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec4 uP[8]; uniform float uBase; uniform vec3 uA, uB;`).replace('#include <emissivemap_fragment>', `{
        float x = vEmissiveMapUv.x; vec3 acc = uA * uBase;
        for (int i = 0; i < 8; i++) { vec4 P = uP[i]; if (P.z <= 0.) continue;
          float d = fract(x - P.x + .5) - .5; float w = abs(P.y), s = sign(P.y + 1e-6), a = d * s;
          float head = exp(-a * a / (w * w * .25)), tail = a < 0. ? exp(a / (w * 4.)) * .55 : 0.;
          float k = max(head, tail); acc += (mix(uA, uB, P.w + (1. - head) * .25) * k + vec3(head * head * head * .35)) * P.z; }
        totalEmissiveRadiance = acc; }`);
  };
  m.customProgramCacheKey = () => 'guide';
  return m;
}
function setPulses(m, list, base) { const U = m.userData.U; U.uBase.value = base; for (let i = 0; i < 8; i++) { const p = list[i]; U.uP.value[i].set(p ? p.p : 0, p ? p.w : .1, p ? p.a : 0, p ? p.h : 0); } }

// ---------- the Issue ----------
const SW_ = 74, SH_ = 98, C = new THREE.Vector3(0, 40, 0);
const issue = new THREE.Group(); issue.position.copy(C); scene.add(issue);
const frontMat = glass(), backMat = glass();
const front = new THREE.Group(), back = new THREE.Group(); issue.add(front, back);
front.add(new THREE.Mesh(new RoundedBoxGeometry(SW_, SH_, 2.6, 6, 1.1), frontMat));
back.add(new THREE.Mesh(new RoundedBoxGeometry(SW_, SH_, 2.6, 6, 1.1), backMat));
// the spine: satin rose metal on the binding edge (right side, as a Hebrew magazine binds)
const spine = new THREE.Mesh(new RoundedBoxGeometry(2.6, SH_ + .6, 10.4, 4, .9), rose(.24)); spine.position.set(SW_ / 2 + 1.0, 0, 2.5); back.add(spine);
// the light frame: a thin guide around the front plate's edge
const guide = guideMat();
{
  const r = 3, x = SW_ / 2 - 1.6, y = SH_ / 2 - 1.6, pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + i / 8 * Math.PI / 2; pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0)); } };
  corner(x - r, y - r, 0); corner(-x + r, y - r, Math.PI / 2); corner(-x + r, -y + r, Math.PI); corner(x - r, -y + r, Math.PI * 1.5);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 400, .32, 10, true), guide);
  front.add(tube);
}
// the pages
let PAGES = [];
async function buildPages() {
  const logo = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = 'assets/gloss-logo.png'; });
  const cv = pageCanvases(logo);
  PAGES = cv.map((c, i) => {
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const g = new THREE.Group();
    const f = new THREE.Mesh(new THREE.PlaneGeometry(SW_ - 5, SH_ - 6.5), new THREE.MeshPhysicalMaterial({ map: tex, roughness: .5, sheen: .3, envMapIntensity: .9, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0 }));
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(SW_ - 5, SH_ - 6.5), new THREE.MeshPhysicalMaterial({ color: '#efe6dc', roughness: .6 })); bk.rotation.y = Math.PI; bk.position.z = -.02;
    g.add(f, bk); g.userData.f = f; issue.add(g); return g;
  });
}
function explode(e, t) {
  front.position.set(0, 0, 2.5 + 86 * e); back.position.set(0, 0, -2.5 - 86 * e);
  front.rotation.set(-.05 * e, .10 * e, 0); back.rotation.set(.05 * e, -.08 * e, 0);
  PAGES.forEach((p, i) => {
    const u = i / 15;
    p.position.set(Math.sin(i * 1.7) * 3 * e, Math.cos(i * 2.3) * 2.5 * e, lerp(1.0, -1.0, u) + lerp(72, -72, u) * e);
    p.rotation.set(Math.sin(i * 1.3 + .4) * .10 * e, (Math.cos(i * 2.1 + .9) * .14 + Math.sin(t * .6 + i) * .03) * e, Math.sin(i * .7) * .05 * e);
  });
}

// ---------- staging ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const orbit = (az, el, d, at = C) => V(at.x + Math.sin(az) * Math.cos(el) * d, at.y + Math.sin(el) * d, at.z + Math.cos(az) * Math.cos(el) * d);
const SWP = (t, a, c) => { const u = seg(t, a, c); return u > 0 && u < 1 ? u : null; };
let FL = 0;
function lightFrame(t, mode) {
  const list = []; let flash = 0, base = 0;
  if (mode === 1) base = .01 + .015 * (.5 + .5 * Math.sin(t * 2.2));
  if (mode >= 2) {
    for (const k of KICKS.filter(k => t >= k.t && t - k.t < 1.6).slice(-3)) {
      const dt = t - k.t, A = (k.big ? 13 : 8) * Math.exp(-dt / .55);
      list.push({ p: .25 + dt * .55, w: .025, a: A, h: clamp(dt * 1.1) }, { p: .25 - dt * .55, w: -.025, a: A, h: clamp(dt * 1.1) });
      flash += (k.big ? 1.6 : 1) * Math.exp(-dt / .12);
    }
    base = .02 + flash * .06;
  }
  if (mode === 3) { const ph = t * .18; list.push({ p: ph, w: .03, a: 8, h: .15 }, { p: ph + .5, w: .03, a: 8, h: .8 }); base = .05; }
  setPulses(guide, list, base);
  return flash;
}

function frame(t) {
  const [t0, t1, name] = shotAt(t), u = seg(t, t0, t1);
  let pos, look = C.clone(), fov = 30, focus = C.clone(), aper = 400;
  const envO = { left: 1, right: 1, top: 1, front: .6, back: 1, key: 0 };
  let bg = .35, sweep = null, frost = 0, e = 0, key = 0, mode = 1, caus = 0, bloom = .2, spot = .02, inner = .04;
  switch (name) {
    case 'dark': {
      const amb = .25 + .75 * ss(seg(t, .3, 4.5));
      Object.assign(envO, { left: .25 * amb, right: .25 * amb, top: .2 * amb, front: 0, back: .35 * amb });
      const s1 = SWP(t, ...T.sweep1), s2 = SWP(t, ...T.sweep2);
      if (s1 != null) sweep = { x: lerp(-1, 1, s1), I: 7 * Math.sin(s1 * Math.PI) };
      if (s2 != null) sweep = { x: lerp(1, -1, s2), I: 7 * Math.sin(s2 * Math.PI), tilt: .25 };
      pos = orbit(lerp(.62, .5, eio(u)), .06, lerp(380, 350, eio(u))); look = C.clone().add(V(0, 22, 0)); frost = 1; inner = .5 * ss(seg(t, .2, 2.4)); bg = .3 * amb + .06; aper = 300; focus = C.clone().add(V(10, 0, 0));
      break;
    }
    case 'reveal': {
      frost = 1 - eio(seg(t, ...T.frost));
      pos = orbit(lerp(.16, .1, eio(u)), lerp(-.03, -.06, u), lerp(380, 350, eio(u))); look = C.clone().add(V(0, 16, 0)); inner = .5 * (1 - seg(t, T.frost[0], T.frost[1])) + .06;
      focus = C.clone().add(V(34, -44, 3)).lerp(C.clone().add(V(0, 0, 3)), eio(seg(t, ...T.rack))); aper = 900; key = 1.4 * ss(seg(t, T.frost[0] + 1, T.frost[1])); bg = .5;
      const s = SWP(t, ...T.glint2); if (s != null) sweep = { x: lerp(-1, 1, s), I: 6 * Math.sin(s * Math.PI), tilt: -.3 };
      Object.assign(envO, { front: 0 });
      break;
    }
    case 'edge': {
      const at = C.clone().add(V(-SW_ / 2, 10, 0));
      pos = orbit(lerp(-1.0, -1.38, eio(u)), .12, 95, at); look = at.clone().add(V(6, 8, 0)); focus = at.clone(); aper = 1400; fov = 32; key = .8; bg = .5;
      for (let k = 0; k < 4; k++) { const s = SWP(t, T.edge + k * BEAT, T.edge + k * BEAT + .45); if (s != null) sweep = { x: lerp(-1, 1, s), I: 5 * Math.sin(s * Math.PI), tilt: -.35 }; }
      mode = 1;
      break;
    }
    case 'explode': {
      if (t < T.spread[1]) e = eo(seg(t, ...T.spread));
      else if (t < T.snap - .45) e = 1 + .03 * seg(t, T.spread[1], T.snap - .45);
      else if (t < T.snap) e = 1.03 * (1 - ei(seg(t, T.snap - .45, T.snap)));
      else e = 0;
      const push = eo(seg(t, T.snap, T.snap + .66));
      pos = orbit(lerp(.72, .9, eio(seg(t, T.expl, T.snap))), .1, lerp(700, 650, eio(seg(t, T.expl, T.snap))) - 260 * push); look = C.clone().add(V(-22 + 16 * push, 30 - 8 * push, 0)); inner = .06;
      focus = C.clone(); aper = lerp(150, 400, push); fov = 32; key = 1.6; bg = .9;
      Object.assign(envO, { left: 1.3, right: 1.3, top: 1.4, front: .5, back: 1.5 });
      if (t >= T.snap) { const k = Math.exp(-(t - T.snap) / .08), fr = Math.floor(t * 24); pos.add(V(hash(fr) - .5, hash(fr + 9) - .5, 0).multiplyScalar(k * 3)); }
      // the hush: lights dim before the snap
      const hush = ss(seg(t, T.hush, T.hush + .3)) * (1 - ss(seg(t, T.snap, T.snap + .05)));
      for (const k in envO) envO[k] *= 1 - .6 * hush;
      mode = t >= T.snap ? 2 : (t >= T.hush ? 0 : 2); caus = t >= T.snap ? .7 : .25 * (1 - hush);
      break;
    }
    case 'monument': {
      pos = orbit(lerp(-.45, .05, eio(u)), lerp(-.02, .02, u), lerp(400, 380, eio(u)), C.clone().add(V(0, 6, 0))); look = C.clone().add(V(0, 32, 0)); inner = .08;
      focus = C.clone(); aper = 350; bg = 1.0; key = .9; mode = 2; caus = .8; spot = .05; bloom = .28;
      const s = SWP(t, b(35), b(37)); if (s != null) sweep = { x: lerp(-1, 1, s), I: 6 * Math.sin(s * Math.PI) };
      Object.assign(envO, { back: 2.2, left: 1.2, right: 1.2, front: 0 });
      break;
    }
    case 'end': {
      pos = orbit(lerp(.2, .26, u), .1, lerp(430, 470, eio(u))); look = C.clone().add(V(0, 46, 0));
      focus = C.clone(); aper = 120; bg = 1.0; key = .6; mode = 3; caus = .6; bloom = .3; spot = .04;
      const s = SWP(t, T.end + .3, T.end + 1.6); if (s != null) sweep = { x: lerp(-1, 1, s), I: 6 * Math.sin(s * Math.PI) };
      Object.assign(envO, { back: 2.4, left: 1, right: 1, front: 0, top: .8 });
      break;
    }
  }
  explode(e, t);
  PAGES.forEach((p, i) => p.userData.f.material.emissiveIntensity = i === 0 ? inner : inner * .3);
  frontMat.roughness = lerp(.015, .42, frost); frontMat.transmission = lerp(1, .84, frost); frontMat.thickness = lerp(2.6, 7, frost); frontMat.dispersion = lerp(5, 1.5, frost); frontMat.color.set(frost > 0 ? '#f4eef0' : '#ffffff');
  FL = lightFrame(t, mode);
  keyBox.intensity = key; keyBox.position.copy(C).add(V(0, 90, 80)); keyBox.lookAt(C);
  scene.backgroundIntensity = bg; studio.U.uBgI.value = bg;
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(look);
  const az = Math.atan2(camera.position.x, camera.position.z);
  if (sweep) sweep.az = az + Math.PI;
  if (!(QS.has('envonce') && window.__env)) { window.__env = 1; studio.updateEnv(Object.assign(envO, { sweep: sweep || { I: 0 }, aura: { I: FL * .8, col: PINK_A } })); }
  post.dof.focus = camera.position.distanceTo(focus); post.dof.aper = aper; post.dof.maxCoc = 14;
  post.bloom.strength = bloom + FL * .05;
  const U = studio.U; U.uTime.value = t * .6; U.uSpot.value = spot;
  const swI = sweep ? sweep.I / 7 : 0;
  U.uC.value[0].set(C.x, C.z, 34, caus * (.35 + FL * .5) + swI * .4); U.uC.value[1].set(0, 0, 1, 0); U.uC.value[2].set(0, 0, 1, 0);
  for (const w of U.uWave.value) w.set(0, 0, 0, 0);
  let wi = 0;
  if (mode === 2) for (const k of KICKS) { const dt = t - k.t; if (dt < 0 || dt > 2.2 || wi >= 12) continue; U.uWave.value[wi++].set(C.x, C.z, 20 + 60 * dt, (k.big ? .8 : .4) * Math.exp(-dt / .6)); }
  return name;
}

// ---------- 2D layer: titles with a glint, the frosted slab, the end card ----------
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; const g = ov.getContext('2d');
let LOGO_P; let TX = [];
const reg = (id, text, x0, y0, x1, y1) => TX.push({ id, text, x0, y0, x1, y1 });
function title(id, lines, t0, t1, t, y0 = 300, size = 96, gx = null) {
  if (t < t0 - .05 || t >= t1) return;
  const a = ss(seg(t, t0, t0 + .5)) * (1 - ss(seg(t, t1 - .4, t1)));
  g.save(); g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  lines.forEach(([s, w], i) => {
    const y = y0 + i * size * 1.22;
    g.font = `${w} ${size}px Heebo`; g.globalAlpha = a; g.fillStyle = 'rgba(248,240,242,.95)'; g.fillText(s, W / 2, y);
    if (a >= .99) { const tw = g.measureText(s).width; reg(id + i, s, W / 2 - tw / 2, y - size * .8, W / 2 + tw / 2, y + size * .2); }
  });
  if (gx != null) {   // glint across the letters, in sync with the sweep
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 1;
    const gr = g.createLinearGradient(gx - 140, 0, gx + 140, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.42, 'rgba(255,201,220,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(.58, 'rgba(232,122,154,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, y0 - size * 1.2, W, size * 1.25 * lines.length + 40);
  }
  g.restore();
}
function frostedSlab(text, sub, cy, a) {
  g.save(); g.globalAlpha = a; g.direction = 'rtl';
  g.font = '400 46px Heebo'; const tw = g.measureText(text).width; const pw = Math.max(tw + 120, 560), ph = 150, x = (W - pw) / 2, y = cy - ph / 2;
  g.save(); g.beginPath(); g.roundRect(x, y, pw, ph, 44); g.clip(); g.filter = 'blur(22px) brightness(1.3)'; g.drawImage(renderer.domElement, 0, 0, W, H); g.filter = 'none'; g.fillStyle = 'rgba(255,225,235,.10)'; g.fillRect(x, y, pw, ph); g.restore();
  g.lineWidth = 1.4; const eg = g.createLinearGradient(x, y, x + pw, y + ph); eg.addColorStop(0, 'rgba(255,255,255,.6)'); eg.addColorStop(.5, 'rgba(255,255,255,.12)'); eg.addColorStop(1, 'rgba(255,255,255,.4)');
  g.strokeStyle = eg; g.beginPath(); g.roundRect(x + .5, y + .5, pw - 1, ph - 1, 44); g.stroke();
  g.strokeStyle = 'rgba(255,201,220,.6)'; g.beginPath(); g.moveTo(x + 44, y + 1.5); g.lineTo(x + pw - 44, y + 1.5); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,250,252,.97)'; g.fillText(text, W / 2, cy - 22);
  g.direction = 'ltr'; g.font = '300 36px Heebo'; g.fillStyle = 'rgba(255,225,235,.9)'; g.fillText(sub, W / 2, cy + 36);
  g.restore();
  if (a >= .99) { reg('cta', text, W / 2 - tw / 2, cy - 50, W / 2 + tw / 2, cy); reg('tel', sub, W / 2 - 140, cy + 14, W / 2 + 140, cy + 58); }
}
function hud(t) {
  g.clearRect(0, 0, W, H); TX = [];
  const gxOf = (a, c, dir = 1) => { const s = seg(t, a, c); return s > 0 && s < 1 ? lerp(dir > 0 ? W * .1 : W * .9, dir > 0 ? W * .9 : W * .1, s) : null; };
  title('t1', [['יש מתנות', 200], ['שנשכחות.', 200]], ...T.t1, t, 300, 104, gxOf(...T.sweep2, -1));
  title('t2', [['ויש גיליון', 200], ['שנכתב רק עליה.', 300]], ...T.t2, t, 290, 96, gxOf(...T.glint2));
  title('t3', [['16 עמודים.', 200], ['כל מילה עליה.', 300]], ...T.t3, t, 300, 100, gxOf(T.t3[0] + .2, T.t3[0] + 1.4));
  title('t4', [['הסיפור שלהם.', 200], ['בעיתון אחד.', 300]], ...T.t4, t, 300, 100, gxOf(b(35), b(37)));
  if (t >= T.end) {
    const a = ss(seg(t, T.end + .2, T.end + .9));
    const lw = 620, lh = lw * LOGO_P.height / LOGO_P.width;
    g.save(); g.globalAlpha = a; g.drawImage(LOGO_P, (W - lw) / 2, 200, lw, lh);
    const gx = gxOf(T.end + .3, T.end + 1.6); if (gx != null) { g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(gx - 120, 0, gx + 120, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 190, W, lh + 20); }
    g.restore();
    const a2 = ss(seg(t, T.end + .7, T.end + 1.3));
    g.save(); g.globalAlpha = a2; g.direction = 'rtl'; g.textAlign = 'center'; g.font = '300 38px Heebo'; g.fillStyle = 'rgba(248,240,242,.92)';
    const s = 'מגזין אישי במתנה · 16 עמודים · 300 ₪'; g.fillText(s, W / 2, 200 + lh + 80); g.restore();
    if (a2 >= .99) { const tw = (g.font = '300 38px Heebo', g.measureText(s).width); reg('det', s, W / 2 - tw / 2, 200 + lh + 50, W / 2 + tw / 2, 200 + lh + 92); }
    frostedSlab('להזמנה בוואטסאפ', '050-385-0012', 200 + lh + 210, ss(seg(t, T.end + 1.2, T.end + 1.8)));
  }
}

// ---------- events (sound) ----------
function events() {
  const ev = [], add = (t, type, o = {}) => ev.push({ t, type, ...o });
  add(T.sweep1[0], 'sweep', { d: T.sweep1[1] - T.sweep1[0], pan: 1 }); add(T.sweep2[0], 'sweep', { d: T.sweep2[1] - T.sweep2[0], pan: -1 });
  add(T.frost[0], 'frost', { d: T.frost[1] - T.frost[0] }); add(T.glint2[0], 'sweep', { d: T.glint2[1] - T.glint2[0], pan: 1, g: .7 });
  for (let k = 0; k < 4; k++) add(T.edge + k * BEAT, 'sweep', { d: .45, pan: 1, g: .5 });
  add(T.spread[0], 'slide', { d: 2.6 }); add(T.hush - .9, 'reverse', { d: .9 + 1.33 });
  add(T.snap, 'snap');
  add(b(35), 'sweep', { d: b(37) - b(35), pan: 1, g: .7 }); add(T.end + .3, 'sweep', { d: 1.3, pan: 1, g: .7 });
  add(b(46), 'ding');
  return ev;
}

// ---------- boot ----------
await Promise.all([document.fonts.load('200 100px Heebo', 'אב'), document.fonts.load('300 100px Heebo', 'אב'), document.fonts.load('400 40px Heebo', 'אב'), document.fonts.load('500 40px Heebo', 'אב'), document.fonts.load('700 40px Heebo', 'אב'), document.fonts.load('800 40px Heebo', 'אב'), document.fonts.load('900 40px FrankRuhl', 'אב')]);
LOGO_P = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = 'assets/gloss-logo-pink.png'; });
await buildPages();
window.DUR = DUR;
window.EV = events();
const glf = () => renderer.getContext().finish();
window.render = t => {
  const n = () => performance.now(); let a = n();
  frame(t); glf(); const b1 = n();
  scene.updateMatrixWorld(); camera.updateMatrixWorld(); if (!QS.has('norefl')) studio.reflect(camera); glf(); const b2 = n();
  if (QS.has('nodof')) post.dof.maxCoc = 0; if (QS.has('nobloom')) post.bloom.enabled = false;
  post.composer.render(); glf(); const b3 = n();
  hud(t); const b4 = n();
  window.PROF = { frame_env: b1 - a, reflect: b2 - b1, composer: b3 - b2, hud: b4 - b3 };
};
window.TEXTS = t => { hud(t); return TX; };
const GRAB = document.createElement('canvas'); GRAB.width = W; GRAB.height = H; const gg = GRAB.getContext('2d');
window.grab = t => { window.render(t); gg.drawImage(renderer.domElement, 0, 0, W, H); gg.drawImage(ov, 0, 0); return GRAB.toDataURL('image/jpeg', .95); };
window.READY = true;
