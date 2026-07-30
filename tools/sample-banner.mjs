// One-off: sample body colours from the official Sky Mavis starter banner so the
// renderer can restore the body tint that the FBX->GLB export dropped.
//
//   node tools/sample-banner.mjs

import { chromium } from 'playwright';

const BANNER =
  'https://raw.githubusercontent.com/axieinfinity/r3f-axie-starter/900c5b5b5437748a1f9df3bb9557c946214ff61e/docs/assets/banner.png';

const res = await fetch(BANNER);
const dataUri = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();

const out = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Banner is three Axies side by side: pomodoro | buba | puffy.
  const thirds = [
    ['pomodoro', 0],
    ['buba', 1],
    ['puffy', 2],
  ];
  const result = {};
  for (const [name, i] of thirds) {
    const x0 = Math.floor((img.width / 3) * i);
    const x1 = Math.floor((img.width / 3) * (i + 1));
    // Histogram the lower-middle of each panel: that region is dominated by body,
    // away from horns/hats up top.
    const y0 = Math.floor(img.height * 0.55);
    const y1 = Math.floor(img.height * 0.8);
    const bins = new Map();
    const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    for (let p = 0; p < d.length; p += 4) {
      if (d[p + 3] < 250) continue;
      const [r, g, b] = [d[p], d[p + 1], d[p + 2]];
      if (r + g + b < 60) continue; // skip the black backdrop
      const key = `${r >> 3}_${g >> 3}_${b >> 3}`;
      const e = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      bins.set(key, e);
    }
    const top = [...bins.values()].sort((a, b) => b.n - a.n)[0];
    const hex = (v) => Math.round(v).toString(16).padStart(2, '0');
    result[name] = top
      ? `#${hex(top.r / top.n)}${hex(top.g / top.n)}${hex(top.b / top.n)}`
      : null;
  }
  return result;
}, dataUri);

console.log(out);
await browser.close();
