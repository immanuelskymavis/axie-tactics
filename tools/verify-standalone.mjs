// Verifies the built single-file game is genuinely self-contained and plays on a phone.
//
//   node tools/verify-standalone.mjs
//
// The decisive check is that the page issues ZERO network requests for images. That is
// what proves it will survive a strict CSP that blocks every external host, rather than
// silently rendering with missing art once published.
//
// Kept separate from smoke.mjs because the target is different: smoke.mjs exercises the
// served source tree, this exercises the built artefact in dist/.

import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ROSTER } from './roster.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SHOTS = join(HERE, 'out');
const PORT = 8736;
const FILE = 'dist/axie-merge-tactics.standalone.html';

try {
  await stat(join(ROOT, FILE));
} catch {
  console.error(`${FILE} not found — run: node tools/build-standalone.mjs`);
  process.exit(1);
}

// Serves ONLY the one file. Any asset the page tries to fetch 404s loudly, which is
// exactly the signal we want.
const server = await new Promise((r) => {
  const s = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    if (path === '/' || path === '/' + FILE.split('/').pop()) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(await readFile(join(ROOT, FILE)));
      return;
    }
    res.writeHead(404).end();
  });
  s.listen(PORT, () => r(s));
});

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const problems = [];
await mkdir(SHOTS, { recursive: true });

const DEVICES = [
  { name: 'iphone', width: 390, height: 844, dpr: 3 },
  { name: 'android', width: 412, height: 915, dpr: 2.6 },
];

for (const d of DEVICES) {
  const ctx = await browser.newContext({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: d.dpr,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  });
  const page = await ctx.newPage();

  const subresources = [];
  page.on('request', (r) => {
    if (r.url().startsWith('data:')) return;
    if (r.resourceType() === 'document') return;
    subresources.push(`${r.resourceType()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && problems.push(`[${d.name}] console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`[${d.name}] pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`[${d.name}] http ${r.status()}: ${r.url()}`);
  });

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });

  // 1. self-contained: no subresource requests at all
  if (subresources.length) {
    problems.push(`[${d.name}] not self-contained, ${subresources.length} request(s): ${subresources.slice(0, 4).join(', ')}`);
  }

  // 2. viewport meta present (the artifact build drops <head>, so a guard injects it)
  const vp = await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.content || null);
  if (!vp) problems.push(`[${d.name}] no viewport meta — page would render at desktop width`);

  // 3. every image actually decoded, none broken
  const art = await page.evaluate(() => {
    const imgs = [...document.images];
    return {
      total: imgs.length,
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.alt || i.src.slice(0, 40)),
      dataUris: imgs.filter((i) => i.src.startsWith('data:')).length,
    };
  });
  if (art.broken.length) problems.push(`[${d.name}] broken images: ${art.broken.join(', ')}`);

  // 4. roster intact and art resolving through the inlined map
  const probe = await page.evaluate(async () => {
    const g = window.__game;
    const bad = [];
    for (const u of g.UNIT_DEFS) {
      const src = g.UNIT_ASSETS[u.id];
      if (!src.startsWith('data:')) { bad.push(u.id); continue; }
      const ok = await new Promise((res) => {
        const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = src;
      });
      if (!ok) bad.push(u.id);
    }
    return { units: g.UNIT_DEFS.length, bad, boss: g.BOSS_ASSETS.phase1.startsWith('data:') };
  });
  if (probe.units !== ROSTER.length) problems.push(`[${d.name}] roster ${probe.units}, expected ${ROSTER.length}`);
  if (probe.bad.length) problems.push(`[${d.name}] art not inlined/loadable: ${probe.bad.join(', ')}`);
  if (!probe.boss) problems.push(`[${d.name}] boss art not inlined`);

  // 5. no horizontal scroll
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  if (overflow) problems.push(`[${d.name}] page scrolls horizontally`);

  // 6. tap targets: shop cards must be comfortably tappable
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('#shop .card, #shopFightBtn, .benchSlot')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && Math.min(r.width, r.height) < 32) {
        out.push(`${el.id || el.className.split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  });
  if (small.length) problems.push(`[${d.name}] tap targets under 32px: ${small.join(', ')}`);

  await page.screenshot({ path: join(SHOTS, `standalone-${d.name}-prep.png`) });

  // 7. touch drag: bench -> board, using real touch events
  const drag = await page.evaluate(async () => {
    const g = window.__game;
    g.state.energy = 999;
    for (let i = 0; i < 3; i++) if (g.state.shop[i]) { try { g.buyShop(i); } catch {} }
    g.renderPrepUnits(); g.renderTop();
    return { bench: g.state.bench.filter(Boolean).length };
  });
  if (!drag.bench) problems.push(`[${d.name}] could not buy a unit to drag`);

  // The game drags with Pointer Events (it reads e.pointerId), not Touch events, so the
  // drag must be dispatched as pointerdown/pointermove/pointerup with pointerType touch.
  const src = await page.$('#bench .slotUnit');
  const dst = await page.$('.hex.playerZone');
  if (src && dst) {
    const a = await src.boundingBox();
    const b = await dst.boundingBox();
    await page.evaluate(([ax, ay, bx, by]) => {
      const el = document.querySelector('#bench .slotUnit');
      const ev = (type, x, y, target) => {
        const e = new PointerEvent(type, {
          pointerId: 1, pointerType: 'touch', isPrimary: true,
          clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 1,
        });
        (target || el).dispatchEvent(e);
      };
      ev('pointerdown', ax, ay);
      ev('pointermove', (ax + bx) / 2, (ay + by) / 2);
      ev('pointermove', bx, by);
      ev('pointerup', bx, by);
    }, [a.x + a.width / 2, a.y + a.height / 2, b.x + b.width / 2, b.y + b.height / 2]);
    await page.waitForTimeout(250);
    const placed = await page.evaluate(() => {
      const g = window.__game;
      let n = 0;
      for (let r = 5; r < 10; r++) for (let c = 0; c < 5; c++) if (g.state.grid[r][c]) n++;
      return n;
    });
    if (!placed) problems.push(`[${d.name}] pointer drag did not place a unit on the board`);
  } else {
    problems.push(`[${d.name}] no bench unit or player hex to drag between`);
  }

  // 8. combat runs on the phone layout
  const fought = await page.evaluate(async () => {
    const g = window.__game;
    const cap = g.boardCapForStage(g.state.stage);
    let placed = 0;
    for (let r = 5; r < 10; r++) for (let c = 0; c < 5; c++) if (g.state.grid[r][c]) placed++;
    for (let b = 0; b < g.state.bench.length && placed < cap; b++) {
      const uid = g.state.bench[b]; if (!uid) continue;
      outer: for (let r = 9; r >= 5; r--) for (let c = 0; c < 5; c++) {
        if (!g.state.grid[r][c]) { g.state.grid[r][c] = uid; g.state.bench[b] = null; placed++; break outer; }
      }
    }
    g.renderPrepUnits(); g.startBattle();
    return { inBattle: g.state.inBattle, actors: document.querySelectorAll('.actor').length };
  });
  if (!fought.inBattle) problems.push(`[${d.name}] battle did not start`);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: join(SHOTS, `standalone-${d.name}-combat.png`) });

  console.log(`${d.name.padEnd(8)} ${d.width}x${d.height}  subresources=${subresources.length}  images=${art.total} (${art.dataUris} inlined)  actors=${fought.actors}  viewport="${vp}"`);
  await ctx.close();
}

await browser.close();
server.close();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('\nself-contained: zero subresource requests. plays on both phone profiles.');
