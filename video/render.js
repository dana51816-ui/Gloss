// Usage:
//   node render.js frames <out_dir> t1 t2 ...      -> PNG stills at given seconds
//   node render.js video  <out.mp4> [audio.wav]     -> full render piped to ffmpeg
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  const stage = await page.$('#stage');

  const renderAt = async (t) => {
    await page.evaluate(t => window.render(t), t);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  };

  if (mode === 'frames') {
    fs.mkdirSync(out, { recursive: true });
    for (const ts of rest) {
      const t = parseFloat(ts);
      await renderAt(t);
      await stage.screenshot({ path: path.join(out, `f_${t.toFixed(2).padStart(6, '0')}.png`) });
    }
  } else {
    const FPS = 30;
    const dur = await page.evaluate(() => window.DURATION);
    const N = Math.round(dur * FPS);
    const audio = rest[0];
    const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
    if (audio) args.push('-i', audio);
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-level', '4.2',
      '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-r', String(FPS), '-movflags', '+faststart');
    if (audio) args.push('-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest');
    args.push(out);
    const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < N; f++) {
      await renderAt(f / FPS);
      const buf = await stage.screenshot({ type: 'jpeg', quality: 97 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 60 === 0) console.log(`frame ${f}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
