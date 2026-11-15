// Frame renderer for software WebGL: renders frames [a, b) to out/frames/f_00000.jpg, skipping frames already on disk (resumable).
// node render_frames.mjs <a> <b>   (run from anywhere; LIB must point to the library)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { openDemo, closeServer } = await import(path.join(process.env.LIB, 'core/render/page.mjs'));
const [a, b] = process.argv.slice(2).map(Number), FPS = 24, dir = path.join(HERE, 'out', 'frames');
fs.mkdirSync(dir, { recursive: true });
const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: 'ssaa=1' });
for (let f = a; f < b; f++) {
  const file = path.join(dir, `f_${String(f).padStart(5, '0')}.jpg`);
  if (fs.existsSync(file)) continue;
  const url = await page.evaluate(t => window.grab(t), f / FPS);
  fs.writeFileSync(file + '.tmp', Buffer.from(url.split(',')[1], 'base64')); fs.renameSync(file + '.tmp', file);
  if (f % 24 === 0) console.log(`frame ${f}`);
}
await browser.close(); closeServer();
