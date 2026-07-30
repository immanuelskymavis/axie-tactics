// Diagnostic: report meshes, materials, embedded textures and animation clips for each
// candidate GLB, so the renderer can pick the source that actually carries textures.
//
//   node tools/probe-glb.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png' };

const server = await new Promise((r) => {
  const s = createServer(async (req, res) => {
    try {
      const f = join(HERE, decodeURIComponent(req.url.split('?')[0]));
      const body = await readFile(f);
      res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  });
  s.listen(8732, () => r(s));
});

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto('http://127.0.0.1:8732/render-harness.html');
await page.waitForFunction('window.__ready === true');

const targets = [];
for (const a of ['buba', 'puffy', 'pomodoro']) {
  for (const c of ['idle', 'run', 'cuttree', 'jump']) targets.push(`/.cache/${a}/${c}.glb`);
}




for (const t of targets) {
  const info = await page.evaluate(async (url) => {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const g = await new GLTFLoader().loadAsync(url).catch((e) => ({ err: e.message }));
    if (g.err) return { err: g.err };
    const mats = [], maps = [], uvsets = new Set();
    let meshes = 0;
    const seen = new Set();
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      meshes++;
      const hasVC = !!o.geometry.attributes.color;
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        const key = m.name || m.type;
        if (!seen.has(key)) {
          seen.add(key);
          mats.push(
            `${key} col=#${m.color ? m.color.getHexString() : '??'}` +
            ` vc=${m.vertexColors ? 'on' : 'off'}${hasVC ? '(attr)' : ''}` +
            ` map=${m.map ? (m.map.image ? `${m.map.image.width}x${m.map.image.height}` : 'yes') : 'no'}`,
          );
        }
        maps.push(m.map ? (m.map.image ? `${m.map.image.width}x${m.map.image.height}` : 'map(no image)') : 'NO MAP');
      }
      uvsets.add(Object.keys(o.geometry.attributes).filter((k) => k.startsWith('uv')).join(','));
    });
    return {
      meshes,
      materials: [...mats],
      maps: [...new Set(maps)],
      uv: [...uvsets],
      clips: (g.animations || []).map((a) => `${a.name}(${a.duration.toFixed(2)}s)`),
    };
  }, t);
  const label = t.startsWith('http') ? `r3f:${t.split('/').pop()}` : t.replace('/.cache/', '');
  console.log(`\n${label}`);
  if (info.err) { console.log(`  ERROR ${info.err}`); continue; }
  console.log(`  meshes=${info.meshes} uv=[${info.uv}]`);
  for (const m of info.materials) console.log(`    ${m}`);
  console.log(`  clips: ${info.clips.join(', ') || '(none)'}`);
}

await browser.close();
server.close();
