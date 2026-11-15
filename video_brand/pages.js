/* GLOSS boho brand film: the illustrated sample issue.
   Every page is pure typography + illustration (no photos, no real people).
   buildPage(k) -> element 1080x1620 ; animPage(el,k,p) with p in [0,1] (1 = final state). */
(function () {
  const C = { sand: '#E8DBC7', cream: '#F7F0E4', terra: '#C47A55', terraD: '#A9542F', rose: '#D9A797', sage: '#9BA585', ochre: '#D9A05B', cocoa: '#4A3426', olive: '#7A7350' };
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sg = (t, a, b) => cl((t - a) / (b - a));
  const oE = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p), oC = p => 1 - Math.pow(1 - p, 3);
  const oB = p => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const css = `
  .pg{position:absolute;left:0;top:0;width:1080px;height:1620px;overflow:hidden;background:${C.cream};color:${C.cocoa};font-family:Heebo,sans-serif;direction:rtl}
  .pg .grainp{position:absolute;inset:0;background-image:url(assets/grain3.png);background-size:540px 960px;mix-blend-mode:multiply;opacity:.10}
  .pg .folio{position:absolute;left:70px;right:70px;bottom:52px;display:flex;justify-content:space-between;font-size:22px;letter-spacing:.32em;color:${C.olive}}
  .pg .kick{position:absolute;right:80px;top:84px;font-size:24px;letter-spacing:.42em;color:${C.terraD};font-weight:400}
  .pg .ttl{position:absolute;right:76px;top:130px;font-family:Bellefair,serif;font-size:150px;line-height:1;color:${C.cocoa}}
  .pg .hand{font-family:'Playpen Sans Hebrew',cursive;color:${C.terraD};white-space:nowrap}
  .pg .bell{font-family:Bellefair,serif}
  .pg .ab{position:absolute}
  .pg .ln{position:absolute;height:2px;background:rgba(122,115,80,.35)}
  `;
  if (!document.getElementById('pgcss')) { const st = document.createElement('style'); st.id = 'pgcss'; st.textContent = css; document.head.appendChild(st); }

  const folio = n => `<div class="folio"><span>GLOSS · הגיליון האישי</span><span style="font-family:Karantina;font-weight:700;letter-spacing:.05em;font-size:40px">${n}</span></div>`;
  const arch = (x, y, w, h, fill, extra = '') => `<path d="M ${x} ${y + h} L ${x} ${y + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} L ${x + w} ${y + h} Z" fill="${fill}" ${extra}/>`;
  const rainbow = (cx, cy, r, band, cols, cls = 'rbw') => cols.map((c, i) => { const rr = r - i * band; return `<path class="${cls}" d="M ${cx - rr} ${cy} A ${rr} ${rr} 0 0 1 ${cx + rr} ${cy}" fill="none" stroke="${c}" stroke-width="${band}"/>`; }).join('');

  const B = {};
  /* ---------- 0. COVER ---------- */
  B[0] = () => `
    <div class="pg" style="background:linear-gradient(180deg,#EFE2D0,#E6CDB6)">
      <svg class="ab" width="1080" height="1620" style="left:0;top:0">
        ${arch(90, 560, 520, 1060, C.terra, 'class="cvArch" opacity=".9"')}
        <g class="cvSunG" clip-path="url(#cvClip)"><circle class="cvSun" cx="350" cy="930" r="160" fill="${C.ochre}"/></g>
        <defs><clipPath id="cvClip"><path d="M 90 1620 L 90 820 A 260 260 0 0 1 610 820 L 610 1620 Z"/></clipPath></defs>
        <g class="cvRb">${rainbow(540, 1620, 420, 70, [C.rose, C.sage, C.sand, C.terraD], 'cvR')}</g>
        <g class="cvRays" stroke="${C.cocoa}" stroke-width="3" stroke-linecap="round" opacity=".55"></g>
      </svg>
      <div class="ab" style="left:0;right:0;top:90px;text-align:center;font-size:24px;letter-spacing:.5em;color:${C.terraD}">גיליון אישי · עותק אחד</div>
      <div class="ab cvMast bell" style="left:0;right:0;top:130px;text-align:center;font-size:330px;line-height:1;color:${C.cocoa}">${'שלהם.'.split('').map(c => `<span style="display:inline-block">${c}</span>`).join('')}</div>
      <div class="ab" style="left:80px;top:470px;font-family:'Bodoni Moda';font-style:italic;font-size:64px;color:${C.terraD}" dir="ltr">No. 01</div>
      <div class="ab cvLines" style="right:76px;top:520px;text-align:right">
        <div class="cvL"><div class="bell" style="font-size:58px">ראיון בלעדי</div><div style="font-size:24px;letter-spacing:.2em;color:${C.olive}">כל מה שלא ידעתם</div></div>
        <div class="cvL" style="margin-top:34px"><div class="bell" style="font-size:58px">הטופ 5 של החיים</div></div>
        <div class="cvL" style="margin-top:34px"><div class="bell" style="font-size:58px">הפלייליסט</div></div>
        <div class="cvL" style="margin-top:34px"><div class="bell" style="font-size:58px">המתכון הסודי</div></div>
      </div>
      <div class="ab hand cvHand" style="right:80px;top:1010px;font-size:58px;color:${C.terraD};transform:rotate(-5deg)">עם הרבה אהבה</div>
      <div class="grainp"></div></div>`;
  /* ---------- 1. INTERVIEW ---------- */
  B[1] = () => `
    <div class="pg">
      <svg class="ab" width="1080" height="1620" style="left:0;top:0">${arch(70, 1060, 330, 560, C.sage, 'opacity=".45"')}${arch(125, 1150, 220, 470, C.rose, 'opacity=".55"')}</svg>
      <div class="kick">ראיון בלעדי</div>
      <div class="ab ivQ bell" style="right:40px;top:40px;font-size:620px;line-height:1;color:${C.terra}">”</div>
      <div class="ttl" style="top:400px">שיחה<br>בגובה העיניים</div>
      <div class="ab" style="right:80px;left:80px;top:760px">
        <div style="font-weight:700;font-size:40px">ש: מה הרגע שהכי משמח אותך?</div>
        <div class="hand ivA1" style="font-size:66px;margin-top:18px">כשכולנו סביב השולחן.</div>
        <div style="font-weight:700;font-size:40px;margin-top:60px">ש: ומה החלום הבא?</div>
        <div class="hand ivA2" style="font-size:66px;margin-top:18px">עוד הרבה טיולים ביחד.</div>
      </div>
      ${folio('02')}<div class="grainp"></div></div>`;
  /* ---------- 2. TOP 5 ---------- */
  B[2] = () => {
    const items = ['המקום', 'השיר', 'המאכל', 'הרגע', 'האנשים'];
    return `<div class="pg" style="background:${C.sand}">
      <div class="kick">הטופ 5 של החיים</div>
      <div class="ab t5big" style="left:40px;top:40px;font-family:Karantina;font-weight:700;font-size:760px;line-height:.8;color:${C.terra}">5</div>
      <div class="ttl" style="top:160px">הטופ<br>של החיים</div>
      <div class="ab" style="right:80px;left:80px;top:720px">
        ${items.map((t, i) => `<div class="t5r" style="display:flex;align-items:center;gap:30px;height:150px;border-top:2px solid rgba(74,52,38,.18)">
          <div style="font-family:Karantina;font-weight:700;font-size:96px;color:${C.terraD};width:110px" dir="ltr">0${i + 1}</div>
          <div class="bell" style="font-size:66px">${t}</div>
          <div style="flex:1;border-bottom:3px dotted rgba(74,52,38,.3);margin:0 10px 18px"></div>
          <svg width="56" height="56"><circle cx="28" cy="28" r="${12 + i * 3}" fill="${[C.terra, C.sage, C.ochre, C.rose, C.cocoa][i]}"/></svg>
        </div>`).join('')}
      </div>${folio('04')}<div class="grainp"></div></div>`;
  };
  /* ---------- 3. PLAYLIST ---------- */
  B[3] = () => {
    const tr = ['השיר מהחתונה', 'השיר מהדרך', 'השיר של הבוקר', 'השיר שכולם שרים', 'השיר שמזכיר אותך'];
    return `<div class="pg" style="background:${C.rose}">
      <div class="kick" style="color:${C.cocoa}">הפלייליסט</div>
      <div class="ttl" style="top:130px">הפסקול<br>שלהם</div>
      <div class="ab plSleeve" style="right:110px;top:520px;width:520px;height:520px;background:${C.terra};box-shadow:0 20px 40px rgba(74,52,38,.25)">
        <svg width="520" height="520">${rainbow(260, 520, 230, 46, [C.cream, C.ochre, C.sage, C.rose])}</svg></div>
      <div class="ab plRec" style="right:330px;top:530px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${C.terraD} 0 19%,#2c211b 19.5% 21%,#3a2b22 21% 100%);box-shadow:0 18px 40px rgba(0,0,0,.3)">
        <svg width="500" height="500" style="position:absolute;inset:0">${[60, 90, 120, 150, 180, 210].map(r => `<circle cx="250" cy="250" r="${r + 30}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="2"/>`).join('')}
        <path d="M 250 40 A 210 210 0 0 1 430 150" stroke="rgba(255,255,255,.18)" stroke-width="10" fill="none" stroke-linecap="round"/>
        <circle cx="250" cy="250" r="8" fill="${C.cream}"/><text x="250" y="226" text-anchor="middle" font-family="Bellefair" font-size="30" fill="${C.cream}">צד א׳</text></svg></div>
      <div class="ab" style="right:90px;left:90px;top:1110px">
        ${tr.map((t, i) => `<div class="plT" style="display:flex;gap:24px;align-items:baseline;height:74px;border-bottom:2px solid rgba(74,52,38,.2)"><span style="font-family:Karantina;font-weight:700;font-size:44px;color:${C.terraD}" dir="ltr">0${i + 1}</span><span class="bell" style="font-size:44px">${t}</span>
        <span style="margin-right:auto;display:flex;gap:5px;align-items:flex-end;height:34px">${[0, 1, 2, 3].map(j => `<i class="eq" style="display:block;width:7px;height:20px;background:${C.cocoa};opacity:.55"></i>`).join('')}</span></div>`).join('')}
      </div>${folio('06')}<div class="grainp"></div></div>`;
  };
  /* ---------- 4. RECIPE ---------- */
  B[4] = () => {
    const ing = ['שתי כוסות צחוק', 'קמצוץ שטויות', 'הרבה סבלנות', 'כף אהבה גדושה'];
    return `<div class="pg">
      <div class="kick">מהמטבח</div>
      <div class="ttl">המתכון<br>הסודי</div>
      <svg class="ab" width="1080" height="1620" style="left:0;top:0">
        <path class="rcBowl" d="M 120 640 A 230 230 0 0 0 580 640 Z" fill="${C.terra}"/><rect x="120" y="632" width="460" height="14" rx="7" fill="${C.terraD}"/>
        ${rainbow(350, 640, 190, 24, [C.ochre, C.sage], 'rcB')}
        ${[260, 350, 440].map((x, i) => `<path class="steam" d="M ${x} 600 C ${x - 30} 560, ${x + 30} 530, ${x} 490 C ${x - 30} 450, ${x + 30} 420, ${x} 380" fill="none" stroke="${C.olive}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`).join('')}
      </svg>
      <div class="ab" style="right:90px;left:90px;top:820px;background:${C.sand};padding:50px 60px;transform:rotate(1.5deg);box-shadow:0 14px 30px rgba(74,52,38,.15)">
        <div style="font-size:26px;letter-spacing:.38em;color:${C.terraD}">מצרכים</div>
        ${ing.map(t => `<div class="rcI" style="display:flex;align-items:center;gap:22px;height:96px;border-bottom:2px solid rgba(74,52,38,.15)"><svg width="40" height="40"><circle cx="20" cy="20" r="16" fill="none" stroke="${C.terraD}" stroke-width="3"/><path class="ck" d="M 11 21 L 18 28 L 30 13" fill="none" stroke="${C.terraD}" stroke-width="4" stroke-linecap="round"/></svg><span class="hand" style="font-size:54px">${t}</span></div>`).join('')}
        <div style="font-size:26px;letter-spacing:.38em;color:${C.terraD};margin-top:34px">אופן ההכנה</div>
        <div class="hand rcM" style="font-size:50px;margin-top:10px">מערבבים יחד, שנים על שנים.</div>
      </div>${folio('08')}<div class="grainp"></div></div>`;
  };
  /* ---------- 5. CROSSWORD + QUIZ ---------- */
  // grid 7x6, RTL columns (c=0 is rightmost). Words: מתנה (row1, c1..c4), תודה (col of ת, rows1..4), אהבה (row4)
  const G = {}; const put = (r, c, ch, ord) => G[r + ',' + c] = { ch, ord };
  'מתנה'.split('').forEach((ch, i) => put(1, 1 + i, ch, i));
  'תודה'.split('').forEach((ch, i) => { if (i) put(1 + i, 2, ch, 4 + i); });
  'אהבה'.split('').forEach((ch, i) => { if (G[(4) + ',' + (1 + i)] == null) put(4, 1 + i, ch, 8 + i); });
  B[5] = () => {
    const S = 118, ox = 1080 - 120, oy = 560; let cells = '';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      const g = G[r + ',' + c]; const x = ox - (c + 1) * S, y = oy + r * S;
      if (g) cells += `<div class="cwC" data-o="${g.ord}" style="position:absolute;left:${x}px;top:${y}px;width:${S}px;height:${S}px;border:3px solid ${C.cocoa};background:${C.cream};display:flex;align-items:center;justify-content:center"><span class="bell" style="font-size:84px;color:${C.terraD}">${g.ch}</span></div>`;
      else if ((r * 7 + c) % 3 === 0) cells += `<div style="position:absolute;left:${x}px;top:${y}px;width:${S}px;height:${S}px;background:${C.sage};opacity:.35"></div>`;
    }
    return `<div class="pg" style="background:${C.sand}">
      <div class="kick">משחקים</div><div class="ttl" style="font-size:130px">תשבץ<br>וחידון</div>
      ${cells}
      <div class="ab" style="right:80px;left:80px;top:1300px">
        <div style="font-weight:700;font-size:38px">חידון: מי מכיר אותם הכי טוב?</div>
        <div style="display:flex;gap:46px;margin-top:22px;font-size:40px">${['א. אני', 'ב. אני', 'ג. ברור שאני'].map((t, i) => `<span style="display:flex;align-items:center;gap:14px"><svg width="44" height="44"><circle cx="22" cy="22" r="18" fill="none" stroke="${C.cocoa}" stroke-width="3"/>${i === 2 ? `<circle class="qzK" cx="22" cy="22" r="11" fill="${C.terra}"/>` : ''}</svg>${t}</span>`).join('')}</div>
      </div>${folio('10')}<div class="grainp"></div></div>`;
  };
  /* ---------- 6. ALBUM ---------- */
  const scene = (i) => {
    const s = [
      `<rect width="300" height="300" fill="${C.rose}"/><circle cx="150" cy="170" r="70" fill="${C.ochre}"/><path d="M0 220 Q 75 190 150 220 T 300 220 V300 H0Z" fill="${C.terra}"/>`,
      `<rect width="300" height="300" fill="${C.sand}"/>${rainbow(150, 300, 140, 34, [C.terra, C.rose, C.sage, C.cream])}`,
      `<rect width="300" height="300" fill="${C.sage}"/><path d="M0 230 L90 140 L170 220 L230 170 L300 230 V300 H0Z" fill="${C.olive}"/><circle cx="220" cy="90" r="34" fill="${C.cream}"/>`,
      `<rect width="300" height="300" fill="${C.ochre}"/>${arch(80, 60, 140, 240, C.terraD)}<circle cx="150" cy="150" r="30" fill="${C.cream}"/>`,
      `<rect width="300" height="300" fill="${C.terra}"/><path d="M0 170 Q 50 140 100 170 T 200 170 T 300 170 V300 H0Z" fill="${C.rose}"/><path d="M0 220 Q 50 190 100 220 T 200 220 T 300 220 V300 H0Z" fill="${C.cream}" opacity=".7"/>`,
    ][i];
    return `<svg width="300" height="300" viewBox="0 0 300 300">${s}</svg>`;
  };
  const AL = [[600, 420, -6], [180, 470, 5], [560, 860, 4], [140, 920, -4], [380, 1180, -2]];
  B[6] = () => `<div class="pg">
      <div class="kick">האלבום</div><div class="ttl">רגעים<br>שנשארים</div>
      ${AL.map(([x, y, r], i) => `<div class="alP" style="position:absolute;left:${x}px;top:${y}px;width:340px;height:400px;background:#fffdf8;padding:20px 20px 80px;box-shadow:0 18px 30px rgba(74,52,38,.22);transform:rotate(${r}deg)" data-r="${r}"><div class="alI" style="width:300px;height:300px;overflow:hidden">${scene(i)}</div><div class="hand" style="font-size:30px;margin-top:14px;color:${C.cocoa}">${['שקיעה', 'ביחד', 'הטיול', 'הבית', 'הים'][i]}</div></div>`).join('')}
      ${folio('12')}<div class="grainp"></div></div>`;
  /* ---------- 7. GREETINGS ---------- */
  const GR = [['מזל טוב!', C.rose, 560, 430, -5], ['אוהבים אותך המון', C.sage, 110, 640, 4], ['לעוד הרבה שנים ביחד', C.sand, 420, 900, -3], ['אתם הכי!', C.ochre, 140, 1180, 6]];
  B[7] = () => `<div class="pg" style="background:${C.cream}">
      <div class="kick">ברכות</div><div class="ttl">מכל<br>הלב</div>
      ${GR.map(([t, bg, x, y, r]) => `<div class="grN" style="position:absolute;left:${x}px;top:${y}px;padding:46px 54px;background:${bg};box-shadow:0 14px 26px rgba(74,52,38,.2);transform:rotate(${r}deg)" data-r="${r}">
        <div style="position:absolute;top:-18px;left:50%;width:130px;height:40px;margin-left:-65px;background:rgba(255,253,245,.75);transform:rotate(${-r * 1.5}deg)"></div>
        <div class="hand" style="font-size:62px;color:${C.cocoa}">${t}</div></div>`).join('')}
      ${folio('14')}<div class="grainp"></div></div>`;
  /* ---------- 8. BACK COVER ---------- */
  B[8] = () => `<div class="pg" style="background:${C.cream}">
      <svg class="ab" width="1080" height="1620" style="left:0;top:0">${rainbow(540, 1620, 330, 60, [C.terra, C.rose, C.sage, C.sand])}</svg>
      <img src="assets/gloss-logo.png" style="position:absolute;left:190px;top:620px;width:700px">
      <div class="grainp"></div></div>`;

  window.buildPage = k => { const w = document.createElement('div'); w.innerHTML = B[k]().trim(); const el = w.firstElementChild; el.dataset.k = k; prepare(el, k); return el; };
  function prepare(el, k) {
    el.querySelectorAll('.cvR,.rbw,.rcB').forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.dataset.L = L; });
    if (k === 0) { const g = el.querySelector('.cvRays'); let h = ''; for (let i = 0; i < 11; i++) { const a = Math.PI * (i / 10); h += `<line x1="${350 - Math.cos(a) * 195}" y1="${930 - Math.sin(a) * 195}" x2="${350 - Math.cos(a) * 240}" y2="${930 - Math.sin(a) * 240}"/>`; } g.innerHTML = h; }
  }
  const mask = (e, p) => { e.style.webkitMaskImage = e.style.maskImage = `linear-gradient(to left,#000 ${p * 104 - 4}%,transparent ${p * 104}%)`; };
  window.animPage = (el, k, p, t = 0) => {
    const q = s => el.querySelectorAll(s);
    if (k === 0) {
      q('.cvR').forEach((r, i) => r.style.strokeDashoffset = r.dataset.L * (1 - oC(sg(p, 0.05 + i * .06, 0.5 + i * .06))));
      el.querySelector('.cvSun').setAttribute('transform', `translate(0 ${260 * (1 - oC(sg(p, .1, .7)))})`);
      el.querySelector('.cvArch').style.transform = `translateY(${300 * (1 - oE(sg(p, 0, .5)))}px)`;
      q('.cvMast span').forEach((s, i) => { const v = oB(sg(p, .15 + i * .07, .5 + i * .07)); s.style.transform = `translateY(${(1 - v) * -260}px)`; s.style.opacity = cl(v * 3); });
      q('.cvL').forEach((s, i) => { const v = oE(sg(p, .45 + i * .08, .8 + i * .08)); s.style.transform = `translateX(${(1 - v) * -80}px)`; s.style.opacity = v; });
      el.querySelector('.cvRays').style.opacity = .55 * sg(p, .6, .9); el.querySelector('.cvRays').setAttribute('transform', `rotate(${t * 6} 350 930)`);
      mask(el.querySelector('.cvHand'), sg(p, .7, 1));
    }
    if (k === 1) {
      const v = oB(sg(p, 0, .4)); el.querySelector('.ivQ').style.transform = `scale(${0.3 + .7 * v}) rotate(${(1 - v) * 20}deg)`; el.querySelector('.ivQ').style.opacity = cl(v * 2);
      mask(el.querySelector('.ivA1'), sg(p, .25, .6)); mask(el.querySelector('.ivA2'), sg(p, .62, .98));
    }
    if (k === 2) {
      const v = oE(sg(p, 0, .5)); el.querySelector('.t5big').style.transform = `translateY(${(1 - v) * 500}px) rotate(${(1 - v) * -12}deg)`;
      q('.t5r').forEach((r, i) => { const w = oE(sg(p, .15 + i * .1, .5 + i * .1)); r.style.transform = `translateX(${(1 - w) * -700}px)`; r.style.opacity = w; });
    }
    if (k === 3) {
      const out = oC(sg(p, .05, .55)); const rec = el.querySelector('.plRec');
      rec.style.transform = `translateX(${(1 - out) * -220}px) rotate(${t * 200}deg)`;
      el.querySelector('.plSleeve').style.transform = `rotate(${(1 - out) * 3}deg)`;
      q('.plT').forEach((r, i) => { const w = oE(sg(p, .3 + i * .1, .6 + i * .1)); r.style.opacity = w; r.style.transform = `translateY(${(1 - w) * 30}px)`; });
      q('.eq').forEach((e, i) => e.style.height = (10 + 26 * Math.abs(Math.sin(t * (7 + i % 5) + i))) + 'px');
    }
    if (k === 4) {
      q('.rcB').forEach((r, i) => r.style.strokeDashoffset = r.dataset.L * (1 - oC(sg(p, 0, .4))));
      q('.steam').forEach((s, i) => { s.style.transform = `translateY(${-14 * Math.sin(t * 3 + i)}px)`; s.style.opacity = .6 * sg(p, .1, .4); });
      q('.rcI').forEach((r, i) => { mask(r.querySelector('.hand'), sg(p, .15 + i * .17, .3 + i * .17)); const ck = r.querySelector('.ck'); ck.style.strokeDasharray = 30; ck.style.strokeDashoffset = 30 * (1 - sg(p, .28 + i * .17, .34 + i * .17)); });
      mask(el.querySelector('.rcM'), sg(p, .82, 1));
    }
    if (k === 5) {
      q('.cwC').forEach(c => { const o = +c.dataset.o; const v = oB(sg(p, .05 + o * .065, .2 + o * .065)); const s = c.querySelector('span'); s.style.transform = `scale(${v})`; s.style.opacity = cl(v * 2); });
      const qz = el.querySelector('.qzK'); qz.setAttribute('r', 11 * oB(sg(p, .88, 1)));
    }
    if (k === 6) {
      q('.alP').forEach((a, i) => { const v = oB(sg(p, i * .12, i * .12 + .35)); const r = +a.dataset.r; a.style.transform = `translateY(${(1 - v) * -900}px) rotate(${r + (1 - v) * 30}deg) scale(${1 + (1 - v) * .2})`; a.style.opacity = cl(v * 3); a.querySelector('.alI').style.filter = `saturate(${sg(p, i * .12 + .25, i * .12 + .6)}) brightness(${1 + 1.2 * (1 - sg(p, i * .12 + .25, i * .12 + .6))})`; });
    }
    if (k === 7) {
      q('.grN').forEach((a, i) => { const v = oB(sg(p, i * .16, i * .16 + .3)); const r = +a.dataset.r; a.style.transform = `scale(${1.6 - .6 * v}) rotate(${r + (1 - v) * -14}deg)`; a.style.opacity = cl(v * 3); });
    }
  };
})();
