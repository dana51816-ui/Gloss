// The 16 printed pages inside the glass: canvas-drawn editorial layouts in the brand's palette (burgundy, powder pink, cream).
const BURG = '#6B0F1E', BURGD = '#3A0610', PINK = '#FFC9DC', PINKD = '#F2A9C0', CREAM = '#F8F2E7', INK = '#2A0A10';
const PW = 768, PH = 1024;

function bodyLines(g, x0, x1, y, n, gap = 22, col = 'rgba(58,6,16,.28)', ragged = 7) {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) { const w = (x1 - x0) * (i % ragged === ragged - 1 ? .55 : .92 + .08 * Math.sin(i * 2.1)); g.fillRect(x1 - w, y + i * gap, w, 7); }
}
function txt(g, s, x, y, font, col, align = 'right') { g.font = font; g.fillStyle = col; g.textAlign = align; g.direction = 'rtl'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); }
function folio(g, n, dark) { txt(g, String(n).padStart(2, '0'), 40, PH - 34, '500 20px Heebo', dark ? 'rgba(248,242,231,.7)' : 'rgba(58,6,16,.55)', 'left'); txt(g, 'STUDIO GLOSS', PW - 40, PH - 34, '500 16px Heebo', dark ? 'rgba(248,242,231,.6)' : 'rgba(58,6,16,.45)'); }
function arch(g, cx, base, w, h) { g.beginPath(); g.moveTo(cx - w / 2, base); g.lineTo(cx - w / 2, base - h + w / 2); g.arc(cx, base - h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, base); g.closePath(); }

const DRAW = [
  // 1 · cover
  (g, L) => {
    const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#FFD5E3'); gr.addColorStop(1, PINKD); g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    arch(g, PW / 2, PH - 150, 520, 640); const ag = g.createLinearGradient(0, 300, 0, PH); ag.addColorStop(0, CREAM); ag.addColorStop(1, '#F6DCD8'); g.fillStyle = ag; g.fill();
    g.strokeStyle = BURG; g.lineWidth = 2; arch(g, PW / 2, PH - 150, 548, 668); g.stroke();
    for (let i = 0; i < 26; i++) { const a = Math.PI + Math.PI * i / 25; g.strokeStyle = 'rgba(107,15,30,.10)'; g.lineWidth = 2; g.beginPath(); g.moveTo(PW / 2, PH - 150); g.lineTo(PW / 2 + Math.cos(a) * 600, PH - 150 + Math.sin(a) * 600); g.stroke(); }
    const lw = 620, lh = lw * L.height / L.width; g.drawImage(L, (PW - lw) / 2, 34, lw, lh);
    txt(g, 'גיליון מיוחד · עותק אחד בלבד', PW - 44, 34 + lh + 34, '500 20px Heebo', BURG);
    txt(g, '16 עמ׳', 44, 34 + lh + 34, '500 20px Heebo', BURG, 'left');
    [['ראיון בלעדי', 'כל מה שלא סיפרה'], ['הטופ 5 שלה', 'מה הכי, ולמה'], ['הפלייליסט', 'שירים של חיים שלמים']].forEach(([a, b], i) => {
      const y = 330 + i * 92; txt(g, a, PW - 44, y, '800 34px Heebo', BURGD); txt(g, b, PW - 44, y + 30, '400 20px Heebo', BURG);
    });
    txt(g, 'אמא.', PW / 2 + 250, PH - 70, '900 300px FrankRuhl', BURG);
    txt(g, 'הסיפור שלה, בעיתון אחד', PW - 44, PH - 26, '500 22px Heebo', BURGD);
  },
  // 2 · contents
  (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, PW, PH); txt(g, 'בגיליון', PW - 50, 150, '900 110px FrankRuhl', BURG);
    ['ראיון בלעדי', 'הטופ 5', 'הפלייליסט של החיים', 'המתכון המפורסם', 'תשבץ וחידון', 'אלבום', 'ברכות'].forEach((s, i) => { const y = 270 + i * 92; txt(g, String(4 + i * 2).padStart(2, '0'), 50, y, '300 54px Heebo', PINKD, 'left'); txt(g, s, PW - 50, y, '700 40px Heebo', BURGD); g.fillStyle = 'rgba(107,15,30,.2)'; g.fillRect(50, y + 24, PW - 100, 2); }); folio(g, 2); },
  // 3 · editor's letter
  (g) => { g.fillStyle = PINK; g.fillRect(0, 0, PW, PH); txt(g, 'מכתב העורכת', PW - 50, 140, '900 76px FrankRuhl', BURG); bodyLines(g, 50, PW - 50, 210, 26, 26); txt(g, 'באהבה,', PW - 50, 930, '700 34px Heebo', BURG); folio(g, 3); },
  // 4 · interview
  (g) => { g.fillStyle = BURG; g.fillRect(0, 0, PW, PH); txt(g, '”', PW - 30, 330, '900 360px FrankRuhl', PINK); txt(g, 'ראיון', PW - 50, 420, '900 120px FrankRuhl', CREAM); txt(g, 'בלעדי', PW - 50, 540, '900 120px FrankRuhl', PINK); bodyLines(g, 50, PW - 50, 610, 13, 26, 'rgba(248,242,231,.35)'); folio(g, 4, true); },
  // 5 · interview body
  (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, PW, PH); txt(g, 'ש:', PW - 50, 110, '800 34px Heebo', BURG); bodyLines(g, 50, PW - 100, 92, 3, 26); txt(g, 'ת:', PW - 50, 230, '800 34px Heebo', PINKD); bodyLines(g, 50, PW - 100, 212, 9, 26);
    g.fillStyle = PINK; g.fillRect(50, 470, PW - 100, 200); txt(g, '“הכי חשוב לי', PW - 90, 560, '900 52px FrankRuhl', BURG); txt(g, 'זה המשפחה”', PW - 90, 630, '900 52px FrankRuhl', BURG); bodyLines(g, 50, PW - 100, 720, 9, 26); folio(g, 5); },
  // 6 · top 5
  (g) => { g.fillStyle = PINK; g.fillRect(0, 0, PW, PH); txt(g, 'הטופ 5', PW - 50, 150, '900 120px FrankRuhl', BURG);
    for (let i = 0; i < 5; i++) { const y = 290 + i * 150; txt(g, String(i + 1), 60, y + 40, '200 140px Heebo', BURG, 'left'); bodyLines(g, 200, PW - 50, y - 20, 3, 26, 'rgba(58,6,16,.32)'); g.fillStyle = BURG; g.fillRect(200, y + 70, PW - 250, 2); } folio(g, 6); },
  // 7 · photo page
  (g) => { g.fillStyle = BURGD; g.fillRect(0, 0, PW, PH); const gr = g.createLinearGradient(0, 60, 0, 760); gr.addColorStop(0, '#C9707F'); gr.addColorStop(1, '#5A1020'); g.fillStyle = gr; g.fillRect(50, 60, PW - 100, 700); arch(g, PW / 2, 760, 360, 520); g.fillStyle = 'rgba(255,201,220,.35)'; g.fill(); txt(g, 'רגעים', PW - 50, 880, '900 90px FrankRuhl', PINK); bodyLines(g, 50, PW - 50, 920, 3, 24, 'rgba(248,242,231,.35)'); folio(g, 7, true); },
  // 8 · playlist
  (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, PW, PH); txt(g, 'הפלייליסט', PW - 50, 140, '900 100px FrankRuhl', BURG); txt(g, 'של החיים', PW - 50, 210, '400 44px Heebo', PINKD);
    g.beginPath(); g.arc(200, 420, 150, 0, 7); g.fillStyle = INK; g.fill(); for (let r = 60; r < 148; r += 7) { g.beginPath(); g.arc(200, 420, r, 0, 7); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.stroke(); } g.beginPath(); g.arc(200, 420, 52, 0, 7); g.fillStyle = PINK; g.fill();
    for (let i = 0; i < 10; i++) { const y = 640 + i * 34; txt(g, String(i + 1).padStart(2, '0'), 50, y, '500 22px Heebo', PINKD, 'left'); g.fillStyle = 'rgba(58,6,16,.3)'; g.fillRect(PW - 50 - (260 + (i * 53) % 180), y - 14, 260 + (i * 53) % 180, 9); } folio(g, 8); },
  // 9 · playlist 2
  (g) => { g.fillStyle = PINK; g.fillRect(0, 0, PW, PH); txt(g, 'צד ב׳', PW - 50, 150, '900 110px FrankRuhl', BURG); for (let i = 0; i < 14; i++) { const y = 260 + i * 46; txt(g, String(i + 11), 50, y, '300 30px Heebo', BURG, 'left'); g.fillStyle = 'rgba(58,6,16,.3)'; g.fillRect(PW - 50 - (200 + (i * 71) % 260), y - 16, 200 + (i * 71) % 260, 10); } folio(g, 9); },
  // 10 · recipe
  (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, PW, PH); g.fillStyle = BURG; g.fillRect(0, 0, PW, 300); txt(g, 'המתכון', PW - 50, 150, '900 110px FrankRuhl', PINK); txt(g, 'המפורסם', PW - 50, 250, '900 80px FrankRuhl', CREAM);
    txt(g, 'מצרכים', PW - 50, 380, '800 34px Heebo', BURG); for (let i = 0; i < 8; i++) { g.fillStyle = PINKD; g.beginPath(); g.arc(PW - 60, 425 + i * 36, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(58,6,16,.3)'; g.fillRect(PW - 90 - 200, 418 + i * 36, 200, 9); }
    txt(g, 'אופן ההכנה', 330, 380, '800 34px Heebo', BURG); bodyLines(g, 50, 330, 410, 20, 26); folio(g, 10); },
  // 11 · recipe photo
  (g) => { g.fillStyle = PINK; g.fillRect(0, 0, PW, PH); g.beginPath(); g.arc(PW / 2, 440, 300, 0, 7); g.fillStyle = CREAM; g.fill(); g.beginPath(); g.arc(PW / 2, 440, 230, 0, 7); g.fillStyle = '#E8B9A6'; g.fill(); g.beginPath(); g.arc(PW / 2, 440, 150, 0, 7); g.fillStyle = '#C98A78'; g.fill(); txt(g, 'בתיאבון!', PW - 50, 900, '900 90px FrankRuhl', BURG); folio(g, 11); },
  // 12 · crossword
  (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, PW, PH); txt(g, 'תשבץ', PW - 50, 140, '900 110px FrankRuhl', BURG); const n = 11, s = 54, x0 = (PW - n * s) / 2, y0 = 200;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const blk = ((i * 7 + j * 3) % 5 === 0) || ((i + j * 2) % 9 === 0); g.fillStyle = blk ? BURG : '#FFFFFF'; g.fillRect(x0 + j * s, y0 + i * s, s - 2, s - 2); if (!blk && (i * 3 + j) % 7 === 1) txt(g, String((i * n + j) % 40 + 1), x0 + j * s + 4, y0 + i * s + 16, '500 12px Heebo', BURG, 'left'); }
    bodyLines(g, 50, PW - 50, 830, 6, 24); folio(g, 12); },
  // 13 · quiz
  (g) => { g.fillStyle = BURG; g.fillRect(0, 0, PW, PH); txt(g, 'כמה אתם', PW - 50, 150, '900 90px FrankRuhl', CREAM); txt(g, 'מכירים אותה?', PW - 50, 250, '900 90px FrankRuhl', PINK);
    for (let i = 0; i < 6; i++) { const y = 340 + i * 110; txt(g, `${i + 1}.`, PW - 50, y, '800 34px Heebo', PINK); g.fillStyle = 'rgba(248,242,231,.4)'; g.fillRect(PW - 90 - 380, y - 22, 380, 10); ['א', 'ב', 'ג'].forEach((c, k) => { g.strokeStyle = PINK; g.lineWidth = 2; g.strokeRect(PW - 90 - k * 150 - 30, y + 18, 26, 26); g.fillStyle = 'rgba(248,242,231,.35)'; g.fillRect(PW - 90 - k * 150 - 130, y + 26, 90, 9); }); } folio(g, 13, true); },
  // 14 · album
  (g) => { g.fillStyle = CREAM; g.fillRect(0, 0, PW, PH); txt(g, 'אלבום', PW - 50, 140, '900 110px FrankRuhl', BURG); const tones = ['#C9707F', '#8E2A3C', '#E8B9A6', '#5A1020', '#F2A9C0', '#B5525F'];
    [[50, 190, 330, 300], [400, 190, 318, 200], [400, 410, 318, 300], [50, 510, 330, 200], [50, 730, 668, 230]].forEach(([x, y, w, h], i) => { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, tones[i]); gr.addColorStop(1, tones[(i + 2) % 6]); g.fillStyle = gr; g.fillRect(x, y, w, h); g.strokeStyle = '#FFFFFF'; g.lineWidth = 8; g.strokeRect(x, y, w, h); }); folio(g, 14); },
  // 15 · greetings
  (g) => { g.fillStyle = PINK; g.fillRect(0, 0, PW, PH); txt(g, 'ברכות', PW - 50, 140, '900 110px FrankRuhl', BURG);
    for (let i = 0; i < 4; i++) { const y = 220 + i * 190; g.fillStyle = CREAM; g.fillRect(50, y, PW - 100, 160); bodyLines(g, 90, PW - 90, y + 36, 3, 28); txt(g, '— ' + ['הילדים', 'הנכדים', 'אבא', 'החברות'][i], 90, y + 140, '700 24px Heebo', BURG, 'left'); } folio(g, 15); },
  // 16 · back cover
  (g, L) => { const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, BURG); gr.addColorStop(1, BURGD); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); g.fillStyle = CREAM; g.fillRect(PW / 2 - 230, PH / 2 - 120, 460, 240); const lw = 380, lh = lw * L.height / L.width; g.drawImage(L, PW / 2 - lw / 2, PH / 2 - lh / 2, lw, lh); txt(g, 'נכתב, נערך ועוצב באהבה', PW / 2, PH - 120, '400 26px Heebo', PINK, 'center'); },
];

export function pageCanvases(logo) {
  return DRAW.map((d, i) => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d'); d(g, logo); return c; });
}
