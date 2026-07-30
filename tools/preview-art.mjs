// Renders a contact sheet of every unit's art so the whole roster can be eyeballed at
// once — SVG axies and the sprite-rendered ones side by side.
//
//   node tools/preview-art.mjs [out.png]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ROSTER, RENDERED, CLASS_COLORS } from './roster.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = process.argv[2] || join(HERE, 'out', 'roster-contact-sheet.png');

const MIME = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
// The sheet is served from the same origin as the art so relative <img> srcs resolve.
let sheetHtml = '';
const server = await new Promise((r) => {
  const s = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    if (path === '/__sheet') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(sheetHtml);
      return;
    }
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  });
  s.listen(8734, () => r(s));
});

const CLASSES = ['Beast', 'Aquatic', 'Plant', 'Bird', 'Bug', 'Reptile'];
const cell = (u) => {
  const src = RENDERED.includes(u.id)
    ? `/assets/axies/${u.id}/portrait.png`
    : `/assets/axies/svg/${u.id}.svg`;
  const c = CLASS_COLORS[u.class];
  return `<div class="cell" style="--edge:${c.body}">
    <img src="${src}" alt="${u.name}">
    <div class="nm">${u.name}</div>
    <div class="sub">T${u.tier} ${u.trait}</div>
  </div>`;
};

const rows = [1, 2, 3, 4, 5]
  .map((t) => {
    const cells = CLASSES.map((cl) => {
      const u = ROSTER.find((x) => x.tier === t && x.class === cl);
      return u ? cell(u) : '<div class="cell empty">—</div>';
    }).join('');
    return `<div class="row"><div class="tier">Tier ${t}</div>${cells}</div>`;
  })
  .join('');

sheetHtml = `<!doctype html><meta charset="utf-8">
<style>
  body{margin:0;background:#12161c;color:#e8eef5;font:13px ui-sans-serif,system-ui,sans-serif;padding:18px}
  .hdr{display:grid;grid-template-columns:70px repeat(6,1fr);gap:10px;margin-bottom:10px;font-weight:700;letter-spacing:.4px}
  .hdr div{text-align:center;font-size:12px;text-transform:uppercase;opacity:.75}
  .row{display:grid;grid-template-columns:70px repeat(6,1fr);gap:10px;margin-bottom:10px;align-items:center}
  .tier{font-weight:800;opacity:.6;font-size:12px}
  .cell{background:#1b212b;border:2px solid var(--edge,#333);border-radius:14px;padding:8px 4px;text-align:center}
  .cell.empty{opacity:.25;border-style:dashed}
  .cell img{width:78px;height:78px;object-fit:contain;display:block;margin:0 auto}
  .nm{font-weight:700;margin-top:4px;font-size:12px}
  .sub{opacity:.6;font-size:11px}
</style>
<div class="hdr"><div></div>${CLASSES.map((c) => `<div>${c}</div>`).join('')}</div>
${rows}
<div class="row" style="margin-top:18px">
  <div class="tier">Boss</div>
  ${['phase1', 'phase2', 'token']
    .map(
      (p) => `<div class="cell" style="--edge:#7cf0ff">
        <img src="/assets/boss/chimera_${p}.svg" alt="${p}">
        <div class="nm">Chimera</div><div class="sub">${p}</div>
      </div>`,
    )
    .join('')}
</div>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
const failed = [];
page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
await page.goto('http://127.0.0.1:8734/__sheet', { waitUntil: 'networkidle' });
await page.waitForFunction(
  () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  { timeout: 30_000 },
);
if (failed.length) {
  console.error(`missing art:\n  ${failed.join('\n  ')}`);
}

const { mkdir } = await import('node:fs/promises');
await mkdir(dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT, fullPage: true });
console.log(`contact sheet -> ${OUT}`);

await browser.close();
server.close();
