// Builds a self-contained single-file version of the game with every asset inlined as a
// data URI, so it runs from anywhere — a static host, a file:// open, or a sandboxed
// page with a strict CSP that forbids external requests.
//
//   node tools/build-standalone.mjs [--profile mobile|full]
//
// Two outputs:
//   dist/axie-merge-tactics.standalone.html  complete document, droppable on any host
//   dist/axie-merge-tactics.artifact.html    same content, no <!doctype>/<html>/<head>/
//                                            <body> — for hosts that supply their own
//                                            document skeleton
//
// The game resolves every art path through assetUrl(), which reads window.__ASSETS. This
// script writes that map. Asset *keys* are always the canonical `assets/axies/...` paths;
// only the bytes behind them change with the profile, so the game needs no profile logic.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROSTER, RENDERED } from './roster.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIST = join(ROOT, 'dist');

const argv = process.argv.slice(2);
const profileIdx = argv.indexOf('--profile');
const PROFILE = profileIdx >= 0 ? argv[profileIdx + 1] : 'mobile';
const SRC_DIR = PROFILE === 'mobile' ? 'axies-mobile' : 'axies';

const SPRITE_STATES = ['idle', 'move', 'attack', 'cast'];

// Every path the game can ask for, paired with the file that should answer it.
function assetPlan() {
  const plan = [];
  for (const u of ROSTER) {
    if (RENDERED.includes(u.id)) {
      plan.push({ key: `assets/axies/${u.id}/portrait.png`, file: `assets/${SRC_DIR}/${u.id}/portrait.png` });
      for (const s of SPRITE_STATES) {
        plan.push({ key: `assets/axies/${u.id}/${s}.png`, file: `assets/${SRC_DIR}/${u.id}/${s}.png` });
      }
    } else {
      plan.push({ key: `assets/axies/svg/${u.id}.svg`, file: `assets/axies/svg/${u.id}.svg` });
    }
  }
  for (const p of ['phase1', 'phase2', 'token']) {
    plan.push({ key: `assets/boss/chimera_${p}.svg`, file: `assets/boss/chimera_${p}.svg` });
  }
  return plan;
}

// SVG stays as percent-encoded text — base64 would inflate it ~33% for no benefit.
function toDataUri(file, buf) {
  if (file.endsWith('.svg')) {
    const svg = buf.toString('utf8').replace(/\s+/g, ' ').trim();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const plan = assetPlan();
const assets = {};
let rawBytes = 0;
const missing = [];

for (const { key, file } of plan) {
  const abs = join(ROOT, file);
  try {
    await stat(abs);
  } catch {
    missing.push(file);
    continue;
  }
  const buf = await readFile(abs);
  rawBytes += buf.length;
  assets[key] = toDataUri(file, buf);
}

if (missing.length) {
  console.error(`missing ${missing.length} asset(s) — run the render/SVG steps first:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

const html = await readFile(join(ROOT, 'axie-merge-tactics.html'), 'utf8');

// The map plus a viewport guard: the artifact build drops <head>, and without a viewport
// meta a phone renders the page at desktop width — a failure that is invisible until
// someone actually opens it on one.
const preamble = `<script>
window.__ASSETS = ${JSON.stringify(assets)};
if(!document.querySelector('meta[name="viewport"]')){
  var m=document.createElement('meta');
  m.name='viewport';
  m.content='width=device-width, initial-scale=1, viewport-fit=cover';
  document.head.appendChild(m);
}
</script>`;

// ---- full document ----
const standalone = html.replace('</head>', `${preamble}\n</head>`);

// ---- artifact fragment: content only, no document wrapper ----
const styleStart = html.indexOf('  <style>');
const styleEnd = html.indexOf('</style>') + '</style>'.length;
const bodyStart = html.indexOf('<body>') + '<body>'.length;
const bodyEnd = html.indexOf('</body>');
if (styleStart < 0 || bodyStart < 6 || bodyEnd < 0) {
  console.error('could not locate <style>/<body> boundaries in the source HTML');
  process.exit(1);
}
// The game deliberately commits to one dark visual world — a lit arena, not a document —
// so it does not offer a light theme. It does have to hold that against a light-theme
// host: pin the background on the root element too (the game only styles <body>), and
// declare color-scheme so scrollbars and form controls match rather than flashing white.
const themeHold = `<style>
  html{background:#0d1020;color-scheme:dark}
  html,body{min-height:100%}
</style>`;

const artifact = [
  preamble,
  themeHold,
  html.slice(styleStart, styleEnd),
  html.slice(bodyStart, bodyEnd).trim(),
].join('\n');

for (const tag of ['<!doctype', '<html', '<head', '<body', '</html>', '</body>']) {
  if (artifact.toLowerCase().includes(tag)) {
    console.error(`artifact build still contains a document tag: ${tag}`);
    process.exit(1);
  }
}

await mkdir(DIST, { recursive: true });
await writeFile(join(DIST, 'axie-merge-tactics.standalone.html'), standalone);
await writeFile(join(DIST, 'axie-merge-tactics.artifact.html'), artifact);

const mb = (n) => (n / 1048576).toFixed(2);
console.log(`profile     : ${PROFILE} (assets read from assets/${SRC_DIR}/)`);
console.log(`inlined     : ${plan.length} assets, ${mb(rawBytes)} MB raw`);
console.log(`standalone  : ${mb(Buffer.byteLength(standalone))} MB  dist/axie-merge-tactics.standalone.html`);
console.log(`artifact    : ${mb(Buffer.byteLength(artifact))} MB  dist/axie-merge-tactics.artifact.html`);
