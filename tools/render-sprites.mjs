// Renders the official Axie GLBs to transparent sprite-sheet strips.
//
//   node tools/render-sprites.mjs [--frames 8] [--size 128] [--debug]
//
// Pipeline: headless Chromium (SwiftShader WebGL) -> three.js -> sample N frames of each
// animation clip -> composite into one horizontal strip -> PNG.
//
// Compositing happens in the browser on a 2D canvas so the toolchain needs no native
// image library (none is available in this environment).

import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { AXIES, BODY_TINTS, clipsFor } from './axie-sources.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CACHE = join(HERE, '.cache');
const OUT = join(ROOT, 'assets', 'axies');

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback;
};
const FRAMES = argOf('frames', 8);
const SIZE = argOf('size', 128);
const DEBUG = argv.includes('--debug');
// The GLBs carry their colour in material properties and ship only a 1x1 placeholder
// map; the separate texture atlas is for the FBX pipeline and smears if applied here.
// Kept behind a flag so the atlas path stays available if a future model needs it.
const USE_ATLAS = argv.includes('--atlas');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

// Serve tools/ so the page can import three from node_modules and load GLBs from .cache.
function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]);
      const file = join(HERE, path);
      if (!file.startsWith(HERE)) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function exists(p) {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
}

const PORT = 8731;
const server = await serve(PORT);

// This container ships a pre-installed Chromium; prefer it over Playwright's own
// download, which may be a different build number than the local playwright version.
const preinstalled = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const executablePath = (await exists(preinstalled)) ? preinstalled : undefined;

const browser = await chromium.launch({
  executablePath,
  args: [
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-gpu-sandbox',
  ],
});
const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
page.on('console', (m) => DEBUG && console.log(`    [page] ${m.text()}`));
page.on('pageerror', (e) => console.error(`    [page error] ${e.message}`));

await page.goto(`http://127.0.0.1:${PORT}/render-harness.html`);
await page.waitForFunction('window.__ready === true', { timeout: 60_000 });

const webgl = await page.evaluate('window.__webgl');
if (!webgl) {
  console.error('WebGL unavailable in headless Chromium — cannot render sprites.');
  await browser.close();
  server.close();
  process.exit(2);
}
console.log(`WebGL up: ${webgl}\n`);

const manifest = {};
let failures = 0;

for (const axie of AXIES) {
  manifest[axie] = {};
  const texture =
    USE_ATLAS && (await exists(join(CACHE, `${axie}/texture.png`)))
      ? `/.cache/${axie}/texture.png`
      : null;

  for (const [state, clip] of Object.entries(clipsFor(axie))) {
    const model = `/.cache/${axie}/${clip}.glb`;
    if (!(await exists(join(CACHE, `${axie}/${clip}.glb`)))) {
      console.error(`  MISSING ${axie}/${clip}.glb`);
      failures++;
      continue;
    }

    // One-shot clips (attack, cast) sample the full range; looping clips (idle, move)
    // stop one step short of the end so frame N wraps cleanly onto frame 0.
    const loop = state === 'idle' || state === 'move';

    let result;
    try {
      result = await page.evaluate(
        (o) => window.__renderStrip(o),
        { model, texture, frames: FRAMES, size: SIZE, loop, bodyTint: BODY_TINTS[axie] || null },
      );
    } catch (err) {
      console.error(`  FAILED  ${axie}/${state} — ${err.message}`);
      failures++;
      continue;
    }

    const dir = join(OUT, axie);
    await mkdir(dir, { recursive: true });
    const file = `${state}.png`;
    const buf = Buffer.from(result.png.split(',')[1], 'base64');
    await writeFile(join(dir, file), buf);

    manifest[axie][state] = {
      file: `assets/axies/${axie}/${file}`,
      frames: FRAMES,
      w: SIZE,
      h: SIZE,
      fps: Math.max(6, Math.round(FRAMES / Math.max(result.duration, 0.35))),
    };

    const pct = (result.alphaCoverage * 100).toFixed(0);
    console.log(
      `  ${axie}/${state.padEnd(7)} ${(buf.length / 1024).toFixed(0).padStart(4)} KB` +
        `  ${FRAMES}f  ${result.duration.toFixed(2)}s  ink ${pct}%`,
    );
    if (result.alphaCoverage < 0.02) {
      console.error(`    ^ nearly empty — model may be off-camera`);
      failures++;
    }
    if (result.alphaCoverage > 0.95) {
      console.error(`    ^ no transparency — alpha channel is not being written`);
      failures++;
    }
  }

  // Shop cards, tooltips and the glossary want a plain <img> src, not a strip.
  // Emit a single high-res idle frame as the portrait.
  const portrait = await page.evaluate((o) => window.__renderStrip(o), {
    model: `/.cache/${axie}/${clipsFor(axie).idle}.glb`,
    texture: null,
    frames: 1,
    size: 256,
    loop: false,
    bodyTint: BODY_TINTS[axie] || null,
  });
  await writeFile(
    join(OUT, axie, 'portrait.png'),
    Buffer.from(portrait.png.split(',')[1], 'base64'),
  );
  manifest[axie].portrait = `assets/axies/${axie}/portrait.png`;
}

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nmanifest -> assets/axies/manifest.json`);

await browser.close();
server.close();

if (failures) {
  console.error(`\n${failures} problem(s).`);
  process.exit(1);
}
