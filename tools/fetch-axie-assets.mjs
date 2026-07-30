// Downloads the official Sky Mavis Axie models + textures into tools/.cache/.
// Idempotent: files already present with a non-zero size are skipped.
//
//   node tools/fetch-axie-assets.mjs

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifest } from './axie-sources.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, '.cache');

async function exists(p) {
  try {
    const s = await stat(p);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`empty body — ${url}`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf.length;
}

const files = manifest();
let fetched = 0;
let skipped = 0;
const failures = [];

for (const f of files) {
  const dest = join(CACHE, f.dest);
  if (await exists(dest)) {
    skipped++;
    continue;
  }
  try {
    const bytes = await download(f.url, dest);
    console.log(`  fetched ${f.dest.padEnd(24)} ${(bytes / 1024).toFixed(0)} KB`);
    fetched++;
  } catch (err) {
    console.error(`  FAILED  ${f.dest} — ${err.message}`);
    failures.push(f.dest);
  }
}

console.log(`\n${fetched} fetched, ${skipped} cached, ${failures.length} failed -> ${CACHE}`);
if (failures.length) process.exit(1);
