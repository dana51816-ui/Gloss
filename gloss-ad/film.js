// Studio GLOSS · "מגיע שער" — Swiss Motion Graphics, vertical 1080×1920, 120 BPM, Hebrew RTL.
// Everything is a pure function of t. Two curves only: the precise ease and linear.

// ---------- time and easing ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
function cubicBezier(x1, y1, x2, y2) {
  const bx = u => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = u => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  return t => {
    if (t <= 0) return 0; if (t >= 1) return 1;
    let lo = 0, hi = 1, u = t;
    for (let i = 0; i < 30; i++) { const x = bx(u); if (Math.abs(x - t) < 1e-6) break; if (x < t) lo = u; else hi = u; u = (lo + hi) / 2; }
    return by(u);
  };
}
const E = cubicBezier(.7, 0, .2, 1);
const BEAT = .5, E8 = .25, E16 = .125, BAR = 2;
const snap = (t, t1, d = E16) => E(seg(t, t1 - d, t1));   // lands on t1
const leave = (t, t0, d = E8) => E(seg(t, t0, t0 + d));    // starts at t0

export const DUR = 32;

// ---------- page ----------
const W = 1080, H = 1920, M = 72, R = W - M, GUT = 24, COLW = (W - 2 * M - 5 * GUT) / 6;
const C = {
  page: '#F6F1EE', paper: '#FFFFFF', ink: '#3A0610', red: '#D7191F', white: '#FFFFFF',
  g1: '#EAE1DD', g2: '#D9CCC8', g3: '#9A8682',
};

// ---------- timeline (seconds; every value sits on a whole frame at 24 fps) ----------
const T = {
  l1: 0, l2: .5, l3: 1.0, cut: [4.0, 4.5, 5.0], cutK: 5.5,
  stop: 6.0, land: 6.5, lead: 7.0, claim: 7.25, outB: 9.5, open: 10.0,
  mast: 10.5, issue: 10.75, lines: [11.0, 11.5, 12.0, 12.5, 13.0, 13.5], head: 14.0, kick: 14.5, capC: 15.0, outC: 17.75,
  pull: 19.0, ring1: 19.25, ring2: 19.5, capD1: 20.0, capD2: 20.25, outD: 23.5, push: 24.0,
  wipe: 24.5, slo1: 25.0, slo2: 25.25, det: 26.0, cta: 27.5, dot: 30.0,
};

let g, LOGO_RED, LOGO_PINK, TX = [];

// ---------- text ----------
function font(w, s) { g.font = `${w} ${s}px Heebo`; }
// clip-reveal from below the baseline (pin 0→1), leave upward (pout 0→1); returns the box in screen pixels
function text(id, s, x, base, size, w, col, pin = 1, pout = 0, align = 'right', opt = {}) {
  if (pin <= 0 || pout >= 1) return;
  font(w, size); g.direction = opt.ltr ? 'ltr' : 'rtl'; g.textAlign = align;
  const wd = g.measureText(s).width;
  const x0 = align === 'right' ? x - wd : align === 'center' ? x - wd / 2 : x;
  const dy = (1 - pin) * size * 1.2 - pout * size * 1.2;
  g.save(); g.beginPath(); g.rect(x0 - 6, base - size * 1.02, wd + 12, size * 1.34); g.clip();
  g.fillStyle = col; g.fillText(s, x, base + dy); g.restore();
  reg(id, s, x0, base - size * .78, x0 + wd, base + size * .26, opt.pass);
  return { x0, x1: x0 + wd, w: wd };
}
function reg(id, s, x0, y0, x1, y1, pass) {
  const m = g.getTransform();
  const p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const [ax, ay] = p(x0, y0), [bx, by] = p(x1, y1);
  TX.push({ id, text: s, x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by), ...(pass ? { pass: true } : {}) });
}
function rule(x0, x1, y, p = 1, col = C.ink, lw = 1.5) {   // grows right → left (RTL), linear
  if (p <= 0) return; g.fillStyle = col; g.fillRect(x1 - (x1 - x0) * p, y - lw / 2, (x1 - x0) * p, lw);
}
// knife cut: a thin line crosses the line right → left in 1/16, then it collapses to its midline in 1/8
function knifed(t, tc, mid, x0, x1, draw) {
  if (t >= tc + E8) return;
  const sy = 1 - E(seg(t, tc, tc + E8));
  g.save(); g.translate(0, mid); g.scale(1, Math.max(sy, .001)); g.translate(0, -mid); draw(); g.restore();
  const kp = seg(t, tc - E16, tc);
  if (kp > 0) rule(x0 - 30, x1 + 30, mid, kp, C.ink, 3);
}

// ---------- grid and furniture ----------
function grid(alpha = 1) {
  g.fillStyle = C.g1;
  for (let k = 0; k < 6; k++) { const x = M + k * (COLW + GUT); g.fillRect(x, 0, 1, H); g.fillRect(x + COLW, 0, 1, H); }
}
function furniture(t) {
  if (t > 23.9 && t < T.wipe + E8) return;
  const bar = Math.min(16, Math.floor(t / BAR) + 1);
  text('bar', `${String(bar).padStart(2, '0')}/16`, M, 110, 20, 500, C.g3, 1, 0, 'left', { pass: true, ltr: true });
  text('studio', 'סטודיו GLOSS · מגזין אישי במתנה', R, 110, 20, 500, C.g3, 1, 0, 'right', { pass: true });
}

// ---------- section A: the list that gets cut ----------
const LIST = [['כרטיס ברכה.', 860], ['בושם.', 1070], ['שובר מתנה.', 1280]];
function sectionA(t) {
  if (t >= T.cutK + E8) return;
  const kmid = 598;
  knifed(t, T.cutK, kmid, M, R, () => {
    rule(M, R, 560, 1);
    text('kick', 'רעיונות למתנה ליום הולדת', R, 610, 28, 500, C.g3);
    text('count', '3 פריטים', M, 610, 28, 500, C.g3, 1, 0, 'left');
  });
  LIST.forEach(([s, base], i) => {
    const tin = [T.l1, T.l2, T.l3][i], pin = i === 0 ? 1 : snap(t, tin);
    const size = 160, mid = base - size * .36;
    font(800, size); const wd = g.measureText(s).width;
    knifed(t, T.cut[i], mid, R - wd, R, () => {
      text('l' + i, s, R, base, size, 800, C.ink, pin);
      text('n' + i, '0' + (i + 1), M, base - 132, 24, 500, C.g3, pin, 0, 'left', { ltr: true });
    });
  });
}

// ---------- section B: the exception ----------
function squareRect(t) {          // screen rect of the red square / cover before the camera takes over
  const S = 136;
  const fall = seg(t, T.stop, T.land);                       // linear fall: the only unsnapped move
  const drift = seg(t, T.land, T.outB);
  let x = lerp(596, 556, drift), y = lerp(-S, 560, fall) - drift * 26;
  let r = { x, y, w: S, h: S };
  const o = snap(t, T.open, .5);                              // opens into the cover, landing on the downbeat
  return { x: lerp(r.x, 162, o), y: lerp(r.y, 330, o), w: lerp(S, 756, o), h: lerp(S, 1008, o), o };
}
function sectionB(t) {
  if (t < T.stop || t >= T.open) return;
  const r = squareRect(t);
  g.fillStyle = C.red; g.fillRect(r.x, r.y, r.w, r.h);
  if (t >= T.land + .1 && t < T.outB) {
    const cx = ((r.x - M) / (COLW + GUT) + 1).toFixed(2), cy = ((r.y) / 96).toFixed(2);
    text('ro1', `עמודה ${cx} · שורה ${cy}`, r.x - 24, r.y + 30, 22, 500, C.g3, 1, 0, 'right', { pass: true });
    text('ro2', 'מחוץ לגריד', r.x - 24, r.y + 60, 22, 700, C.red, 1, 0, 'right', { pass: true });
  }
  const out = leave(t, T.outB, E8);
  text('lead', 'למי שאוהבים,', R, 1000, 72, 300, C.g3, snap(t, T.lead), out);
  text('claim', 'מגיע שער.', R, 1210, 210, 900, C.ink, snap(t, T.claim), out);
}

// ---------- the cover (world coordinates, origin = cover top-left, 840×1120) ----------
const COVER = { x: 120, y: 400, w: 840, h: 1120 };
const CLINES = [['ראיון בלעדי', '04'], ['הטופ 5 שלה', '06'], ['הפלייליסט של החיים', '08'], ['המתכון המפורסם', '10'], ['תשבץ וחידון', '12'], ['האלבום והברכות', '14']];
function heroCover(t) {
  const { x, y, w, h } = COVER, r = w - 48;
  g.save(); g.translate(x, y);
  g.fillStyle = C.red; g.fillRect(0, 0, w, h);
  // masthead: the brand's pink logo, wiped in top → bottom
  const mp = snap(t, T.mast, E8);
  if (mp > 0) {
    const lw = 620, lh = lw * LOGO_PINK.height / LOGO_PINK.width;
    g.save(); g.beginPath(); g.rect(r - lw - 4, 44, lw + 8, (lh + 8) * mp); g.clip();
    g.drawImage(LOGO_PINK, r - lw, 48, lw, lh); g.restore();
  }
  rule(48, r, 300, snap(t, T.issue, E8) , C.white, 1.5);
  text('issue', 'גיליון 01 · עותק אחד בלבד', r, 342, 24, 500, C.white, snap(t, T.issue));
  text('pages', '16 עמ׳', 48, 342, 24, 500, C.white, snap(t, T.issue), 0, 'left');
  CLINES.forEach(([s, f], i) => {
    const p = snap(t, T.lines[i]), base = 432 + i * 62;
    text('cl' + i, s, r, base, 40, 700, C.white, p);
    text('cf' + i, f, 48, base, 24, 500, C.white, p, 0, 'left', { ltr: true });
  });
  text('ckick', 'גיליון מיוחד ליום ההולדת', r, 828, 28, 500, C.white, snap(t, T.kick));
  // the headline climbs in four eased steps
  const hp = (() => { const q = seg(t, T.head - BEAT, T.head) * 4, i = Math.floor(q); return i >= 4 ? 1 : (i + E(q - i)) / 4; })();
  text('head', 'אמא.', r + 6, 1078, 300, 900, C.white, hp);
  g.restore();
}
// the other issues on the wall: paper, ink, grey modules; one headline each
const WALL = [
  [-1, -1, 'סבא וסבתא.'], [0, -1, 'שנה ביחד.'], [1, -1, 'אבא, 70.'],
  [-1, 0, 'נועה, 30.'], [1, 0, '50 שנה ביחד.'],
  [-1, 1, 'החברה הכי טובה.'], [0, 1, 'רוני ודניאל.'], [1, 1, 'סבתא רחל.'],
];
function wallCover(t, j, i, head, k) {
  const x = COVER.x + j * 900, y = COVER.y + i * 1180, w = 840, h = 1120, r = w - 48;
  const t1 = Math.abs(i) + Math.abs(j) === 1 ? T.ring1 : T.ring2;
  const p = snap(t, t1, E8); if (p <= 0) return;
  g.save(); g.translate(x, y); g.beginPath(); g.rect(-2, -2, w + 4, (h + 4) * p); g.clip();
  g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
  g.fillStyle = C.g2; g.fillRect(r - 560, 60, 560, 150);            // masthead module
  g.fillStyle = C.g1; g.fillRect(48, 298, w - 96, 2);
  for (let n = 0; n < 5; n++) { g.fillStyle = C.g1; g.fillRect(r - [420, 300, 520, 360, 460][(n + k) % 5], 400 + n * 70, [420, 300, 520, 360, 460][(n + k) % 5], 30); }
  font(900, 300); let size = Math.min(300, 300 * (w - 96) / g.measureText(head).width);
  text('w' + k, head, r, 1078, size, 900, C.ink, 1);
  g.restore();
}

// ---------- camera for sections C and D (world → screen) ----------
const CAM = [[0, [.9, 540, 1100]], [T.head, [.936, 540, 1100], E8], [T.pull, [.27, 540, 1737.8], 1.0], [T.push, [2.4, 540, 960], .5]];
function cam(t) {
  let v = CAM[0][1];
  for (let i = 1; i < CAM.length; i++) {
    const [t1, v1, d] = CAM[i]; if (t < t1 - d) break;
    const p = snap(t, t1, d); v = v.map((a, k) => lerp(a, v1[k], p)); if (p < 1) break;
  }
  return v;
}
function sectionCD(t) {
  if (t < T.open || t >= T.wipe) return;
  const [s, cx, cy] = cam(t);
  g.save(); g.translate(540, 960); g.scale(s, s); g.translate(-cx, -cy);
  if (t >= T.pull - 1) WALL.forEach(([j, i, head], k) => wallCover(t, j, i, head, k));
  heroCover(t);
  g.restore();
  // caption rows in screen space
  const oC = leave(t, T.outC, E8);
  if (t < T.outC + E8) {
    const p = snap(t, T.capC, E8);
    rule(M, R, 1392, seg(t, T.capC - E8, T.capC));
    text('capC', 'גיליון אישי · 16 עמודים', R, 1440, 28, 500, C.ink, p, oC);
    text('capCn', '01/01', M, 1440, 28, 500, C.g3, p, oC, 'left', { ltr: true });
  }
  const oD = leave(t, T.outD, E8);
  text('capD1', '16 עמודים.', R, 1330, 52, 300, C.g3, snap(t, T.capD1), oD);
  text('capD2', 'כל מילה, עליהם.', R, 1446, 96, 800, C.ink, snap(t, T.capD2), oD);
}

// ---------- section E: end card ----------
function sectionE(t) {
  if (t < T.push) return;
  const wp = snap(t, T.wipe, BEAT);
  if (wp <= 0) return;
  g.save(); g.beginPath(); g.rect(0, H * (1 - wp), W, H * wp); g.clip();
  g.fillStyle = C.page; g.fillRect(0, 0, W, H); grid();
  const lw = 780, lh = lw * LOGO_RED.height / LOGO_RED.width, lp = snap(t, T.wipe + E8, E8);
  if (lp > 0) { g.save(); g.beginPath(); g.rect(R - lw * lp - 4, 300, lw * lp + 8, lh + 40); g.clip(); g.drawImage(LOGO_RED, R - lw, 320, lw, lh); g.restore(); }
  text('slo1', 'הסיפור שלהם.', R, 800, 132, 900, C.ink, snap(t, T.slo1));
  text('slo2', 'בעיתון אחד.', R, 945, 132, 900, C.ink, snap(t, T.slo2));
  rule(M, R, 1030, seg(t, T.det - E8, T.det));
  text('det', 'מגזין אישי במתנה · 16 עמודים · גיליון דיגיטלי 300 ₪', R, 1084, 30, 500, C.ink, snap(t, T.det));
  const cp = snap(t, T.cta, E8);
  if (cp > 0) {
    const y0 = 1150, hh = 150;
    g.save(); g.beginPath(); g.rect(R - (R - M) * cp, y0, (R - M) * cp, hh); g.clip();
    g.fillStyle = C.ink; g.fillRect(M, y0, R - M, hh);
    text('cta', 'להזמנה בוואטסאפ', R - 44, y0 + 94, 56, 800, C.white, 1);
    text('tel', '050-385-0012', M + 44, y0 + 92, 40, 500, C.white, 1, 0, 'left', { ltr: true });
    g.restore();
  }
  // the person again: one red square, off the grid, falling in on the last downbeat
  if (t > T.dot - .5) { const f = seg(t, T.dot - .5, T.dot); g.fillStyle = C.red; g.fillRect(M + 7, lerp(-80, 1336, f), 64, 64); }
  g.restore();
}

// ---------- frame ----------
export function render(ctx, t) {
  g = ctx; TX = [];
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  grid();
  sectionA(t); sectionB(t); sectionCD(t); sectionE(t);
  furniture(t);
  return TX;
}

// ---------- events for the mixer ----------
export function events() {
  const ev = [], add = (t, type, o = {}) => ev.push({ t, type, ...o });
  add(0, 'clack', { big: 1 }); add(T.l2, 'clack', { big: 1 }); add(T.l3, 'clack', { big: 1 });
  T.cut.forEach(c => add(c, 'knife')); add(T.cutK, 'knife', { g: .6 });
  add(T.land, 'thump');
  add(T.lead, 'clack'); add(T.claim, 'clackBig');
  add(T.outB, 'slide'); add(T.open, 'snap', { g: 1.4 }); add(T.open, 'paper');
  add(T.mast, 'paper', { g: .7 }); add(T.issue, 'rule');
  T.lines.forEach(c => add(c, 'clack'));
  [0, 1, 2, 3].forEach(k => add(T.head - BEAT + (k + 1) * BEAT / 4, 'thunk'));
  add(T.head, 'stamp');
  add(T.kick, 'clack'); add(T.capC, 'rule'); add(T.capC, 'clack');
  add(T.outC, 'slide'); add(T.pull - 1, 'swish', { d: 1.0 });
  add(T.ring1, 'slap'); add(T.ring2, 'slap', { g: 1.2 });
  add(T.capD1, 'clack'); add(T.capD2, 'clackBig');
  add(T.outD, 'swish', { d: .5 });
  add(T.wipe, 'paper', { g: 1.2 }); add(T.wipe + E8, 'stamp', { g: .8 });
  add(T.slo1, 'clackBig'); add(T.slo2, 'clackBig'); add(T.det, 'rule'); add(T.det, 'clack');
  add(T.cta, 'snap', { g: 1.3 }); add(T.dot, 'thump', { g: 1.1 });
  return ev;
}
export const TIMES = T;

// ---------- boot ----------
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
await Promise.all([300, 500, 700, 800, 900].map(w => document.fonts.load(`${w} 40px Heebo`, 'אבג')));
[LOGO_RED, LOGO_PINK] = await Promise.all([load('assets/gloss-logo-red.png'), load('assets/gloss-logo-pink.png')]);
window.DUR = DUR;
window.EV = events();
window.render = t => render(ctx, t);
window.TEXTS = t => render(ctx, t);
window.READY = true;
