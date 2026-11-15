// v2 renderer with true motion blur (sub-frame accumulation) and parallel chunks.
//   node render.js frames <dir> t1 t2 ...           stills (no blur)
//   node render.js chunk <out.mkv> <f0> <f1> [sub]  frames [f0,f1) with motion blur
//   node render.js video <out.mp4> [audio] [workers] [sub]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const FPS = 30, SHUTTER = 0.5; // 180 degree shutter

async function open() {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  const stage = await page.$('#stage');
  const at = async t => {
    await page.evaluate(t => window.render(t), t);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  };
  return { browser, page, stage, at };
}
const run = (cmd, args) => new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: 'inherit' }); p.on('close', c => c ? rej(new Error(cmd + ' ' + c)) : res()); });

(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  if (mode === 'frames') {
    const { browser, stage, at } = await open();
    fs.mkdirSync(out, { recursive: true });
    for (const ts of rest) { const t = parseFloat(ts); await at(t); await stage.screenshot({ path: path.join(out, `f_${t.toFixed(2).padStart(6, '0')}.png`) }); }
    await browser.close(); return;
  }
  if (mode === 'chunk') {
    const f0 = +rest[0], f1 = +rest[1];
    let subFor; subFor = t => { let n = 3; for (const [a, b, k] of FAST) if (t >= a - 0.05 && t <= b + 0.05) n = Math.max(n, k); return n; };
    const { browser, page, stage, at } = await open();
    const FAST = await page.evaluate(() => window.FAST || []);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1080x1920', '-r', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv444p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const acc = spawn('python3', ['-I', path.join(__dirname, 'accum.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
    acc.stdout.pipe(ff.stdin);
    const w = async buf => { if (!acc.stdin.write(buf)) await new Promise(r => acc.stdin.once('drain', r)); };
    const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const SUB = subFor(f / FPS);
      await w(u32(SUB));
      for (let k = 0; k < SUB; k++) {
        const t = f / FPS + (SUB > 1 ? (k - (SUB - 1) / 2) * (SHUTTER / FPS) / (SUB - 1) : 0);
        await at(Math.max(0, t));
        const buf = await stage.screenshot({ type: 'jpeg', quality: 95 });
        await w(u32(buf.length)); await w(buf);
      }
      if ((f - f0) % 60 === 0) console.log(`[${f0}-${f1}] frame ${f} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    acc.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close(); return;
  }
  if (mode === 'video') {
    const audio = rest[0] && rest[0] !== '-' ? rest[0] : null, W = +(rest[1] || 3), SUB = rest[2] || '3';
    const { browser, page } = await open(); const dur = await page.evaluate(() => window.DURATION); await browser.close();
    const N = Math.round(dur * FPS), per = Math.ceil(N / W), parts = [];
    const jobs = [];
    for (let i = 0; i < W; i++) {
      const a = i * per, b = Math.min(N, (i + 1) * per); if (a >= b) continue;
      const part = path.join(__dirname, `.part${i}.mkv`); parts.push(part);
      jobs.push(run('node', [__filename, 'chunk', part, String(a), String(b), SUB]));
    }
    await Promise.all(jobs);
    fs.writeFileSync(path.join(__dirname, '.parts.txt'), parts.map(p => `file '${p}'`).join('\n'));
    const args = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(__dirname, '.parts.txt')];
    if (audio) args.push('-i', audio);
    args.push('-map', '0:v'); if (audio) args.push('-map', '1:a');
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS), '-movflags', '+faststart');
    if (audio) args.push('-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest');
    args.push(out);
    await run('ffmpeg', args);
    parts.forEach(p => fs.unlinkSync(p));
  }
})();
