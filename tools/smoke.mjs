// End-to-end smoke test. There is no unit-test suite, so this is the safety net:
// boots the real page, asserts no console errors and no failed asset requests, then
// drives a full prep -> battle cycle and screenshots the result.
//
//   node tools/smoke.mjs [--keep-open]

import { createServer } from 'node:http';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ROSTER, RENDERED } from './roster.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SHOTS = join(HERE, 'out');
const PORT = 8735;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.css': 'text/css',
};

const server = await new Promise((r) => {
  const s = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    try {
      const body = await readFile(join(ROOT, path === '/' ? '/axie-merge-tactics.html' : path));
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  });
  s.listen(PORT, () => r(s));
});

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const problems = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(`console: ${m.text()}`);
});
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('response', (r) => {
  const u = r.url().replace(`http://127.0.0.1:${PORT}`, '');
  if (r.status() >= 400 && !u.includes('favicon')) problems.push(`http ${r.status()}: ${u}`);
});

await mkdir(SHOTS, { recursive: true });
await page.goto(`http://127.0.0.1:${PORT}/axie-merge-tactics.html`, { waitUntil: 'networkidle' });

// ---- 1. every roster id resolves to art that exists ----
const artProbe = await page.evaluate(async () => {
  const g = window.__game;
  const out = [];
  for (const u of g.UNIT_DEFS) {
    const src = g.UNIT_ASSETS[u.id];
    const ok = await new Promise((res) => {
      const i = new Image();
      i.onload = () => res(true);
      i.onerror = () => res(false);
      i.src = src;
    });
    if (!ok) out.push(`${u.id} -> ${src}`);
  }
  return out;
});
if (artProbe.length) problems.push(`missing unit art: ${artProbe.join(', ')}`);

// ---- 2. roster shape ----
const shape = await page.evaluate(() => { const g = window.__game; return ({
  units: g.UNIT_DEFS.length,
  classes: [...new Set(g.UNIT_DEFS.map((u) => u.class))],
  traits: [...new Set(g.UNIT_DEFS.map((u) => u.trait))],
  perClass: Object.fromEntries(
    [...new Set(g.UNIT_DEFS.map((u) => u.class))].map((c) => [
      c, g.UNIT_DEFS.filter((u) => u.class === c).length,
    ]),
  ),
  noSkill: g.UNIT_DEFS.filter((u) => !u.skillKey).map((u) => u.id),
}); });
if (shape.units !== ROSTER.length) problems.push(`roster size ${shape.units}, expected ${ROSTER.length}`);
if (shape.classes.length !== 6) problems.push(`classes ${shape.classes.length}, expected 6`);
if (shape.noSkill.length) problems.push(`units without skillKey: ${shape.noSkill.join(', ')}`);

await page.screenshot({ path: join(SHOTS, 'smoke-1-prep.png'), fullPage: true });

// ---- 3. drive a battle: grant energy, buy out the shop, place, fight ----
const battle = await page.evaluate(async () => {
  const g = window.__game;
  const log = [];
  g.state.energy = 999;
  // Buy whatever the shop offers, rerolling to gather a few units.
  for (let round = 0; round < 6; round++) {
    for (let i = 0; i < 3; i++) {
      if (g.state.shop[i]) { try { g.buyShop(i); } catch (e) { log.push('buy: ' + e.message); } }
    }
    try { g.refreshShop(); } catch {}
    g.state.energy = 999;
  }
  // Place everything on the bench onto the player half.
  let placed = 0;
  const cap = g.boardCapForStage(g.state.stage);
  for (let b = 0; b < g.state.bench.length && placed < cap; b++) {
    const uid = g.state.bench[b];
    if (!uid) continue;
    outer: for (let r = 9; r >= 5; r--) {
      for (let c = 0; c < 5; c++) {
        if (!g.state.grid[r][c]) {
          g.state.grid[r][c] = uid;
          g.state.bench[b] = null;
          placed++;
          break outer;
        }
      }
    }
  }
  g.renderPrepUnits(); g.renderTop();
  log.push(`placed ${placed} (cap ${cap})`);
  const syn = g.getSynergyState();
  log.push(`synergies: ${Object.entries(syn.cls).filter(([, n]) => n > 0).map(([k, n]) => k + ':' + n).join(' ')}`);
  g.startBattle();
  const gameLog=[...document.querySelectorAll('#log div')].slice(0,4).map(d=>d.textContent);
  return { log, gameLog, inBattle: g.state.inBattle, actors: document.querySelectorAll('.actor').length };
});
if (!battle.inBattle) problems.push('startBattle did not enter combat');
if (!battle.actors) problems.push('no combat actors rendered');

await page.waitForTimeout(2500);
await page.screenshot({ path: join(SHOTS, 'smoke-2-combat.png'), fullPage: true });

// ---- 4. animation hooks actually reach the DOM ----
const anim = await page.evaluate(() => {
  const models = [...document.querySelectorAll('.actor [data-model]')];
  const sprites = models.filter((m) => m.dataset.kind === 'sprite');
  return {
    models: models.length,
    sprites: sprites.length,
    animStates: [...new Set(models.map((m) => m.dataset.anim))],
  };
});
if (!anim.models) problems.push('combat actors have no [data-model] element — setCombatAnim would be a no-op');

// ---- 5. mobile breakpoint ----
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
mobile.on('pageerror', (e) => problems.push(`mobile pageerror: ${e.message}`));
await mobile.goto(`http://127.0.0.1:${PORT}/axie-merge-tactics.html`, { waitUntil: 'networkidle' });
await mobile.screenshot({ path: join(SHOTS, 'smoke-3-mobile.png') });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
if (overflow) problems.push('page scrolls horizontally at 390px');


// ---- 6. boss stage: Chimera spawns and phase art swaps ----
const bossPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
bossPage.on('pageerror', (e) => problems.push(`boss pageerror: ${e.message}`));
bossPage.on('console', (m) => m.type() === 'error' && problems.push(`boss console: ${m.text()}`));
await bossPage.goto(`http://127.0.0.1:${PORT}/axie-merge-tactics.html`, { waitUntil: 'networkidle' });
const boss = await bossPage.evaluate(async () => {
  const g = window.__game;
  g.state.stage = 5;
  g.state.energy = 999;
  for (let round = 0; round < 8; round++) {
    for (let i = 0; i < 3; i++) if (g.state.shop[i]) { try { g.buyShop(i); } catch {} }
    g.refreshShop(); g.state.energy = 999;
  }
  let placed = 0;
  const cap = g.boardCapForStage(5);
  for (let b = 0; b < g.state.bench.length && placed < cap; b++) {
    const uid = g.state.bench[b]; if (!uid) continue;
    outer: for (let r = 9; r >= 5; r--) for (let c = 0; c < 5; c++) {
      if (!g.state.grid[r][c]) { g.state.grid[r][c] = uid; g.state.bench[b] = null; placed++; break outer; }
    }
  }
  g.renderPrepUnits(); g.renderTop();
  g.startBattle();
  const bossUnit = (g.state.combat?.units || []).find((u) => u.boss);
  const before = document.querySelector('#actor-' + (bossUnit?.id) + ' img.actorArt')?.getAttribute('src');
  // Force the phase threshold rather than waiting out a full fight.
  if (bossUnit) bossUnit.hp = bossUnit.maxHp * 0.4;
  return { placed, hasBoss: !!bossUnit, before, phase1: g.BOSS_ASSETS.phase1, phase2: g.BOSS_ASSETS.phase2 };
});
if (!boss.hasBoss) problems.push('stage 5 produced no Chimera boss');
await bossPage.waitForTimeout(900);
const bossAfter = await bossPage.evaluate(() => {
  const g = window.__game;
  const u = (g.state.combat?.units || []).find((x) => x.boss);
  return { phase2: !!u?.phase2, src: document.querySelector('.actor img.actorArt')?.getAttribute('src') };
});
if (boss.hasBoss && !bossAfter.phase2) problems.push('boss did not enter phase 2 below 50% HP');
await bossPage.screenshot({ path: join(SHOTS, 'smoke-4-boss.png'), fullPage: true });

// ---- 7. CMS override actually reaches the game ----
const cmsPage = await browser.newPage();
cmsPage.on('pageerror', (e) => problems.push(`cms pageerror: ${e.message}`));
await cmsPage.goto(`http://127.0.0.1:${PORT}/cms/index.html`, { waitUntil: 'networkidle' });
await cmsPage.screenshot({ path: join(SHOTS, 'smoke-5-cms.png'), fullPage: true });
await cmsPage.evaluate(() => {
  localStorage.setItem('cms_data_v1', JSON.stringify({
    units: [
      { id: 'goldfish', name: 'Goldfish', class: 'Aquatic', trait: 'Assassin', tier: 1, atk: 999, hp: 4321, range: 1 },
      { id: 'does-not-exist', name: 'Ghost', atk: 1 },
      { id: 'larva', class: 'NotAClass', atk: 77 },
    ],
    synergies: {},
  }));
});
const overridden = await cmsPage.evaluate(async (port) => {
  const w = window.open(`http://127.0.0.1:${port}/axie-merge-tactics.html`, '_blank');
  await new Promise((r) => setTimeout(r, 2500));
  const g = w.__game;
  const gf = g.UNIT_DEFS.find((u) => u.id === 'goldfish');
  const lv = g.UNIT_DEFS.find((u) => u.id === 'larva');
  const out = { atk: gf.atk, hp: gf.hp, larvaAtk: lv.atk, larvaClass: lv.class, count: g.UNIT_DEFS.length };
  w.close();
  return out;
}, PORT);
if (overridden.atk !== 999 || overridden.hp !== 4321) problems.push(`cms override not applied: ${JSON.stringify(overridden)}`);
if (overridden.larvaClass !== 'Bug') problems.push(`cms let an invalid class through: ${overridden.larvaClass}`);
if (overridden.larvaAtk !== 77) problems.push('cms valid field on a partially-invalid entry was dropped');
if (overridden.count !== 30) problems.push(`cms changed roster size to ${overridden.count}`);
console.log(`boss: spawned=${boss.hasBoss} phase2=${bossAfter.phase2}`);
console.log(`cms override: goldfish atk ${overridden.atk}/hp ${overridden.hp}, invalid class rejected -> ${overridden.larvaClass}`);


// ---- 8. the sprite-sheet path specifically (random buys rarely hit the 3 rendered axies) ----
const spritePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
spritePage.on('pageerror', (e) => problems.push(`sprite pageerror: ${e.message}`));
spritePage.on('console', (m) => m.type() === 'error' && problems.push(`sprite console: ${m.text()}`));
await spritePage.goto(`http://127.0.0.1:${PORT}/axie-merge-tactics.html`, { waitUntil: 'networkidle' });
const spriteCheck = await spritePage.evaluate(async (ids) => {
  const g = window.__game;
  // Place one of each rendered axie directly, bypassing the shop.
  let r = 9;
  for (const id of ids) {
    const uid = 'u' + g.state.nextUid++;
    g.state.units[uid] = { uid, defId: id, star: 1 };
    g.state.grid[r][1] = uid;
    r--;
  }
  g.renderPrepUnits();
  const prep = [...document.querySelectorAll('#board [data-model]')].map((m) => m.dataset.kind);
  g.state.stage = 3;
  g.startBattle();
  await new Promise((res) => setTimeout(res, 400));
  const actors = [...document.querySelectorAll('.actor [data-model]')];
  const strips = [...document.querySelectorAll('.actor .spriteAnim')].map((n) => ({
    img: n.style.backgroundImage.replace(/^url\("?|"?\)$/g, ''),
    frames: n.style.getPropertyValue('--f'),
  }));
  return { prep, kinds: actors.map((a) => a.dataset.kind), strips };
}, RENDERED);
const spriteActors = spriteCheck.kinds.filter((k) => k === 'sprite').length;
if (spriteActors < RENDERED.length) {
  problems.push(`expected ${RENDERED.length} sprite actors in combat, saw ${spriteActors}`);
}
if (spriteCheck.strips.some((s) => !s.img || s.frames !== '8')) {
  problems.push(`sprite strips malformed: ${JSON.stringify(spriteCheck.strips)}`);
}
await spritePage.waitForTimeout(1200);
await spritePage.screenshot({ path: join(SHOTS, 'smoke-6-sprites.png'), fullPage: true });
console.log(`sprite path: ${spriteActors}/${RENDERED.length} rendered axies animating from strips`);

console.log(`roster: ${shape.units} units, ${shape.classes.length} classes ${JSON.stringify(shape.perClass)}`);
console.log(`battle: ${battle.log.join(' | ')}`);
console.log(`game log: ${(battle.gameLog||[]).join(' // ')}`);
console.log(`actors: ${battle.actors}, models: ${anim.models} (${anim.sprites} sprite), states: ${anim.animStates.join(',')}`);
console.log(`screenshots -> ${SHOTS}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
} else {
  console.log('\nno console errors, no failed requests, no missing art.');
}

await browser.close();
server.close();
process.exit(problems.length ? 1 : 0);
