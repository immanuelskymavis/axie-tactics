// Generates Axie-style SVG portraits for every unit without official 3D art.
//
//   node tools/make-svg-axies.mjs
//
// One shared template keeps all 30 units reading as a single family alongside the three
// rendered from Sky Mavis's official models: round pastel body, oversized eyes, four
// stubby legs, and swappable horn / mouth / back / tail parts drawn from the vocabulary
// below. Class drives the palette, so adding a class needs no new art code.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROSTER, RENDERED, CLASS_COLORS } from './roster.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'assets', 'axies', 'svg');

const W = 128;
const CX = 64;
const CY = 76;   // body centre
const RX = 37;   // body radius
const RY = 34;

// ---------------------------------------------------------------- back parts
// Drawn first, behind the body.
const BACK = {
  none: () => '',
  leaf: (c) => `
    <g fill="${c.dark}" opacity=".95">
      <path d="M${CX - 30} ${CY - 12} q-22 -8 -28 -26 q22 -2 32 14 z"/>
      <path d="M${CX + 30} ${CY - 12} q22 -8 28 -26 q-22 -2 -32 14 z"/>
    </g>`,
  wing: (c) => `
    <g fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round">
      <path d="M${CX - 28} ${CY - 8} q-26 2 -30 22 q18 8 32 -6 z"/>
      <path d="M${CX + 28} ${CY - 8} q26 2 30 22 q-18 8 -32 -6 z"/>
    </g>`,
  shell: (c) => `
    <g>
      <ellipse cx="${CX}" cy="${CY - 6}" rx="${RX + 5}" ry="${RY + 2}" fill="${c.dark}" opacity=".55"/>
      <path d="M${CX - 36} ${CY - 10} a36 30 0 0 1 72 0" fill="none" stroke="${c.accent}" stroke-width="3" opacity=".5"/>
    </g>`,
  spike: (c) => `
    <g fill="${c.dark}">
      ${[-26, -9, 8, 25].map((d) => `<path d="M${CX + d} ${CY - 26} l7 -16 l7 16 z"/>`).join('')}
    </g>`,
  sail: (c) => `
    <path d="M${CX - 26} ${CY - 14} q26 -34 52 0 q-26 -12 -52 0 z" fill="${c.dark}"/>
    <path d="M${CX - 18} ${CY - 20} q18 -18 36 0" fill="none" stroke="${c.accent}" stroke-width="2.5" opacity=".6"/>`,
};

// ---------------------------------------------------------------- horn parts
// Drawn on top of the head.
const HORN = {
  nut: (c) => `
    <g fill="${c.dark}">
      <ellipse cx="${CX - 19} " cy="${CY - 34}" rx="9" ry="11" transform="rotate(-16 ${CX - 19} ${CY - 34})"/>
      <ellipse cx="${CX + 19}" cy="${CY - 34}" rx="9" ry="11" transform="rotate(16 ${CX + 19} ${CY - 34})"/>
    </g>`,
  fin: (c) => `
    <g fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round">
      <path d="M${CX - 16} ${CY - 28} q-14 -14 -2 -20 q10 6 10 20 z"/>
      <path d="M${CX + 16} ${CY - 28} q14 -14 2 -20 q-10 6 -10 20 z"/>
    </g>`,
  cap: (c) => `
    <path d="M${CX - 30} ${CY - 26} a30 20 0 0 1 60 0 z" fill="${c.dark}"/>
    <g fill="${c.light}" opacity=".85">
      <circle cx="${CX - 12}" cy="${CY - 33}" r="4"/>
      <circle cx="${CX + 10}" cy="${CY - 36}" r="3"/>
    </g>`,
  shell: (c) => `
    <g fill="${c.light}" stroke="${c.dark}" stroke-width="2">
      <path d="M${CX - 20} ${CY - 30} q4 -18 18 -18 q-4 12 -6 20 z"/>
      <path d="M${CX + 20} ${CY - 30} q-4 -18 -18 -18 q4 12 6 20 z"/>
    </g>`,
  antenna: (c) => `
    <g stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M${CX - 12} ${CY - 30} q-8 -16 -18 -20"/>
      <path d="M${CX + 12} ${CY - 30} q8 -16 18 -20"/>
    </g>
    <circle cx="${CX - 30}" cy="${CY - 50}" r="5" fill="${c.light}"/>
    <circle cx="${CX + 30}" cy="${CY - 50}" r="5" fill="${c.light}"/>`,
  spike: (c) => `
    <g fill="${c.dark}">
      <path d="M${CX - 20} ${CY - 28} l4 -20 l10 16 z"/>
      <path d="M${CX + 20} ${CY - 28} l-4 -20 l-10 16 z"/>
      <path d="M${CX} ${CY - 34} l0 -18 l8 16 z"/>
    </g>`,
  twig: (c) => `
    <g stroke="${c.dark}" stroke-width="3.5" fill="none" stroke-linecap="round">
      <path d="M${CX - 14} ${CY - 30} l-8 -14 m0 0 l-9 3 m9 -3 l1 -9"/>
      <path d="M${CX + 14} ${CY - 30} l8 -14 m0 0 l9 3 m-9 -3 l-1 -9"/>
    </g>`,
  bud: (c) => `
    <g>
      <path d="M${CX} ${CY - 30} q-16 -12 -6 -24 q10 6 6 24" fill="${c.dark}"/>
      <path d="M${CX} ${CY - 30} q16 -12 6 -24 q-10 6 -6 24" fill="${c.light}"/>
      <circle cx="${CX}" cy="${CY - 52}" r="5" fill="${c.light}"/>
    </g>`,
  feather: (c) => `
    <g fill="${c.light}" stroke="${c.dark}" stroke-width="1.8" stroke-linejoin="round">
      <path d="M${CX - 4} ${CY - 32} q-6 -22 -18 -26 q2 20 10 28 z"/>
      <path d="M${CX + 4} ${CY - 32} q6 -22 18 -26 q-2 20 -10 28 z"/>
      <path d="M${CX} ${CY - 36} q0 -22 0 -28 q8 18 4 30 z"/>
    </g>`,
  frond: (c) => `
    <g stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round">
      ${[-24, -10, 4, 18].map((d, i) => `<path d="M${CX + d + 3} ${CY - 28} q${d / 2} -${16 + (i % 2) * 8} ${d / 1.4} -${20 + (i % 2) * 8}"/>`).join('')}
    </g>`,
  crown: (c) => `
    <path d="M${CX - 24} ${CY - 26} l6 -20 l8 12 l10 -18 l10 18 l8 -12 l6 20 z"
          fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>`,
  crest: (c) => `
    <g fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round">
      <path d="M${CX - 10} ${CY - 30} q-4 -24 8 -30 q10 8 6 30 z"/>
      <path d="M${CX + 6} ${CY - 30} q8 -20 18 -20 q-4 14 -10 22 z"/>
    </g>`,
};

// ---------------------------------------------------------------- mouth parts
const MOUTH = {
  smile: (c) => `<path d="M${CX - 9} ${CY + 9} q9 9 18 0" fill="none" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>`,
  grin: (c) => `
    <path d="M${CX - 12} ${CY + 7} q12 14 24 0 z" fill="${c.accent}"/>
    <path d="M${CX - 12} ${CY + 7} h24" stroke="${c.accent}" stroke-width="2"/>`,
  fang: (c) => `
    <path d="M${CX - 11} ${CY + 7} q11 12 22 0 z" fill="${c.accent}"/>
    <path d="M${CX - 6} ${CY + 8} l3 6 l3 -6 z M${CX + 1} ${CY + 8} l3 6 l3 -6 z" fill="#fff"/>`,
  beak: (c) => `
    <path d="M${CX - 9} ${CY + 5} l9 12 l9 -12 z" fill="${c.accent}"/>
    <path d="M${CX - 9} ${CY + 5} h18" stroke="${c.dark}" stroke-width="1.5"/>`,
  pincer: (c) => `
    <g stroke="${c.accent}" stroke-width="3.5" fill="none" stroke-linecap="round">
      <path d="M${CX - 3} ${CY + 6} q-10 4 -12 12"/>
      <path d="M${CX + 3} ${CY + 6} q10 4 12 12"/>
    </g>`,
  kiss: (c) => `
    <ellipse cx="${CX}" cy="${CY + 11}" rx="7" ry="5.5" fill="none" stroke="${c.accent}" stroke-width="3"/>`,
};

// ---------------------------------------------------------------- tail parts
const TAIL = {
  stub: (c) => `<ellipse cx="${CX + RX + 3}" cy="${CY + 12}" rx="8" ry="6" fill="${c.dark}"/>`,
  fin: (c) => `<path d="M${CX + RX - 4} ${CY + 6} q22 -4 26 14 q-18 2 -26 -6 z" fill="${c.light}" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>`,
  feather: (c) => `
    <g fill="${c.light}" stroke="${c.dark}" stroke-width="1.8" stroke-linejoin="round">
      <path d="M${CX + RX - 6} ${CY + 4} q20 0 28 10 q-16 8 -28 0 z"/>
      <path d="M${CX + RX - 6} ${CY + 12} q18 4 24 14 q-16 4 -26 -6 z"/>
    </g>`,
  spiky: (c) => `
    <g fill="${c.dark}">
      <path d="M${CX + RX - 6} ${CY + 6} l24 -6 l-8 12 l14 2 l-24 8 z"/>
    </g>`,
  coil: (c) => `
    <path d="M${CX + RX - 6} ${CY + 8} q20 -2 20 10 q0 10 -12 8 q-8 -2 -6 -8"
          fill="none" stroke="${c.dark}" stroke-width="6" stroke-linecap="round"/>`,
  leafy: (c) => `
    <g fill="${c.dark}">
      <path d="M${CX + RX - 6} ${CY + 6} q20 -10 28 2 q-14 12 -28 4 z"/>
      <path d="M${CX + RX + 2} ${CY + 12} q14 2 18 14 q-14 2 -20 -8 z" opacity=".8"/>
    </g>`,
};

// Higher tiers read bigger and meaner, so rarity is legible at board size without
// relying on the star overlay alone.
const tierScale = (t) => 0.9 + (t - 1) * 0.032;
const brow = (c, tier) =>
  tier < 4
    ? ''
    : `<g stroke="${c.accent}" stroke-width="3.4" stroke-linecap="round">
      <path d="M${CX - 23} ${CY - 17} l14 5"/>
      <path d="M${CX + 23} ${CY - 17} l-14 5"/>
    </g>`;

// ---------------------------------------------------------------- template
function axieSvg(unit) {
  const c = CLASS_COLORS[unit.class];
  const a = unit.art || {};
  const back = (BACK[a.back] || BACK.none)(c);
  const horn = (HORN[a.horn] || HORN.spike)(c);
  const mouth = (MOUTH[a.mouth] || MOUTH.smile)(c);
  const tail = (TAIL[a.tail] || TAIL.stub)(c);
  const gid = `g_${unit.id}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" role="img" aria-label="${unit.name}">
  <title>${unit.name}</title>
  <defs>
    <radialGradient id="${gid}" cx="38%" cy="30%" r="78%">
      <stop offset="0" stop-color="${c.light}"/>
      <stop offset="0.62" stop-color="${c.body}"/>
      <stop offset="1" stop-color="${c.dark}"/>
    </radialGradient>
  </defs>

  <g class="axie" transform="translate(${CX} ${CY + 8}) scale(${tierScale(unit.tier).toFixed(3)}) translate(${-CX} ${-(CY + 8)})">
    ${tail}
    ${back}

    <!-- legs -->
    <g fill="${c.dark}">
      <ellipse cx="${CX - 22}" cy="${CY + RY - 2}" rx="9" ry="7"/>
      <ellipse cx="${CX - 7}"  cy="${CY + RY + 1}" rx="9" ry="7"/>
      <ellipse cx="${CX + 8}"  cy="${CY + RY + 1}" rx="9" ry="7"/>
      <ellipse cx="${CX + 23}" cy="${CY + RY - 2}" rx="9" ry="7"/>
    </g>

    <!-- body -->
    <ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="url(#${gid})"/>

    ${horn}

    <!-- eyes -->
    <g>
      <ellipse cx="${CX - 14}" cy="${CY - 6}" rx="10" ry="11" fill="#20242b"/>
      <ellipse cx="${CX + 14}" cy="${CY - 6}" rx="10" ry="11" fill="#20242b"/>
      <circle cx="${CX - 17}" cy="${CY - 10}" r="3.6" fill="#fff"/>
      <circle cx="${CX + 11}" cy="${CY - 10}" r="3.6" fill="#fff"/>
      <circle cx="${CX - 10}" cy="${CY - 1}" r="1.8" fill="#fff" opacity=".75"/>
      <circle cx="${CX + 18}" cy="${CY - 1}" r="1.8" fill="#fff" opacity=".75"/>
    </g>
    ${brow(c, unit.tier)}

    <!-- blush -->
    <g fill="${c.dark}" opacity=".38">
      <ellipse cx="${CX - 27}" cy="${CY + 7}" rx="6" ry="4"/>
      <ellipse cx="${CX + 27}" cy="${CY + 7}" rx="6" ry="4"/>
    </g>

    ${mouth}
  </g>
</svg>
`;
}

// ---------------------------------------------------------------- boss
// Chimera are the canonical antagonists of Axie Origins' adventure mode, so the boss
// keeps its name and reads as a corrupted Axie rather than a generic demon: same round
// silhouette, but desaturated, spiked, and lit from within.
function chimeraSvg({ enraged = false, token = false } = {}) {
  const body = enraged ? '#8e1f3a' : '#3a3350';
  const dark = enraged ? '#4d0f20' : '#1e1a2d';
  const light = enraged ? '#d4426a' : '#645a86';
  const glow = enraged ? '#ff5a7a' : '#7cf0ff';
  const size = token ? 96 : 160;
  const s = size / 128;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${size}" height="${size}" role="img" aria-label="Chimera Elite">
  <title>Chimera Elite${enraged ? ' (enraged)' : ''}</title>
  <defs>
    <radialGradient id="cbody${enraged ? 2 : 1}${token ? 't' : ''}" cx="40%" cy="28%" r="80%">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="0.6" stop-color="${body}"/>
      <stop offset="1" stop-color="${dark}"/>
    </radialGradient>
    <filter id="cglow${enraged ? 2 : 1}${token ? 't' : ''}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g transform="translate(${CX} ${CY}) scale(${(token ? 1.0 : 1.08).toFixed(2)}) translate(${-CX} ${-CY})">
    <!-- ragged crest -->
    <g fill="${dark}">
      ${[-30, -16, -1, 14, 28]
        .map((d, i) => `<path d="M${CX + d} ${CY - 24} l${5 + (i % 2) * 2} -${22 + (i % 3) * 9} l${8 + (i % 2) * 3} ${22 + (i % 3) * 9} z"/>`)
        .join('')}
    </g>
    <!-- twin horns -->
    <g fill="${light}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M${CX - 26} ${CY - 24} q-20 -18 -14 -34 q16 8 22 32 z"/>
      <path d="M${CX + 26} ${CY - 24} q20 -18 14 -34 q-16 8 -22 32 z"/>
    </g>
    <!-- legs -->
    <g fill="${dark}">
      <ellipse cx="${CX - 24}" cy="${CY + RY}" rx="11" ry="8"/>
      <ellipse cx="${CX - 8}"  cy="${CY + RY + 3}" rx="11" ry="8"/>
      <ellipse cx="${CX + 9}"  cy="${CY + RY + 3}" rx="11" ry="8"/>
      <ellipse cx="${CX + 25}" cy="${CY + RY}" rx="11" ry="8"/>
    </g>
    <ellipse cx="${CX}" cy="${CY}" rx="${RX + 3}" ry="${RY + 2}" fill="url(#cbody${enraged ? 2 : 1}${token ? 't' : ''})"/>
    <!-- cracks -->
    <g stroke="${glow}" stroke-width="1.8" fill="none" opacity=".75" filter="url(#cglow${enraged ? 2 : 1}${token ? 't' : ''})">
      <path d="M${CX - 20} ${CY + 20} l7 -10 l-4 -8 l9 -6"/>
      <path d="M${CX + 22} ${CY + 14} l-8 -8 l3 -9"/>
    </g>
    <!-- eyes -->
    <g filter="url(#cglow${enraged ? 2 : 1}${token ? 't' : ''})">
      <ellipse cx="${CX - 15}" cy="${CY - 5}" rx="9" ry="10" fill="${glow}"/>
      <ellipse cx="${CX + 15}" cy="${CY - 5}" rx="9" ry="10" fill="${glow}"/>
      <ellipse cx="${CX - 15}" cy="${CY - 5}" rx="3" ry="7" fill="${dark}"/>
      <ellipse cx="${CX + 15}" cy="${CY - 5}" rx="3" ry="7" fill="${dark}"/>
    </g>
    <g stroke="${dark}" stroke-width="4" stroke-linecap="round">
      <path d="M${CX - 25} ${CY - 17} l15 6"/>
      <path d="M${CX + 25} ${CY - 17} l-15 6"/>
    </g>
    <!-- maw -->
    <path d="M${CX - 15} ${CY + 8} q15 16 30 0 z" fill="${dark}"/>
    <g fill="#f2ecff">
      ${[-11, -4, 3, 10].map((d) => `<path d="M${CX + d} ${CY + 9} l3.5 7 l3.5 -7 z"/>`).join('')}
    </g>
  </g>
</svg>
`;
}

await mkdir(OUT, { recursive: true });

const svgUnits = ROSTER.filter((u) => !RENDERED.includes(u.id));
let bytes = 0;
for (const unit of svgUnits) {
  const svg = axieSvg(unit);
  bytes += Buffer.byteLength(svg);
  await writeFile(join(OUT, `${unit.id}.svg`), svg);
}

const BOSS_OUT = join(HERE, '..', 'assets', 'boss');
await mkdir(BOSS_OUT, { recursive: true });
const bossFiles = {
  'chimera_phase1.svg': chimeraSvg(),
  'chimera_phase2.svg': chimeraSvg({ enraged: true }),
  'chimera_token.svg': chimeraSvg({ token: true }),
};
for (const [name, svg] of Object.entries(bossFiles)) {
  await writeFile(join(BOSS_OUT, name), svg);
}

console.log(`${svgUnits.length} SVG axies -> assets/axies/svg/ (${(bytes / 1024).toFixed(0)} KB total)`);
console.log(`${Object.keys(bossFiles).length} boss SVGs -> assets/boss/`);
console.log(`${RENDERED.length} rendered from official models: ${RENDERED.join(', ')}`);

// Sanity: every roster entry must end up with art from exactly one source.
const missing = ROSTER.filter(
  (u) => !RENDERED.includes(u.id) && !svgUnits.find((s) => s.id === u.id),
);
if (missing.length) {
  console.error(`unaccounted units: ${missing.map((u) => u.id).join(', ')}`);
  process.exit(1);
}
