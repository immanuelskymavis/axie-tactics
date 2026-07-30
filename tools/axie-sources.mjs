// Official Sky Mavis art sources, pinned to commit SHAs so sprite renders are reproducible.
//
// Only Buba, Puffy and Pomodoro have official art published on GitHub. Olek, Momo and
// Venoki are authored as SVG instead (see assets/axies/svg/). Axie's own CDNs
// (cdn.axieinfinity.com, axiecdn.axieinfinity.com) and jsDelivr are not reachable from
// this environment's network policy — raw.githubusercontent.com is.

const RAW = 'https://raw.githubusercontent.com';

export const REPOS = {
  assets3d: {
    repo: 'axieinfinity/axie-starter-3d-assets',
    sha: 'a419e0cdddf7d10684547a4b5e5d25af73b7fe5c',
  },
  r3f: {
    repo: 'axieinfinity/r3f-axie-starter',
    sha: '900c5b5b5437748a1f9df3bb9557c946214ff61e',
  },
};

const url = (r, path) => `${RAW}/${REPOS[r].repo}/${REPOS[r].sha}/${path}`;

// Game animation state -> source clip. The 3D repo ships idle/run/walk/jump/cuttree;
// the game wants idle/move/attack/cast/hit/death, so several states share a clip and
// are differentiated at runtime by CSS (tint for hit, fade+fall for death).
export const ANIM_MAP = {
  idle: 'idle',
  move: 'run',
  attack: 'cuttree',
  cast: 'jump',
};

// Puffy has no starter_puffy_idle.glb in the 3D repo. The r3f package's single-file
// model does carry an idle clip, but it is a different export whose accessories come
// through grey where the 3D repo's come through yellow — swapping between them mid-game
// would visibly change Puffy's horns. Use the 3D repo's slow `walk` instead, which reads
// as an idle bob and keeps all four of Puffy's states visually identical.
const CLIP_OVERRIDES = {
  puffy: { idle: 'walk' },
};

export const AXIES = ['buba', 'puffy', 'pomodoro'];

const clipFor = (axie, state) =>
  (CLIP_OVERRIDES[axie] && CLIP_OVERRIDES[axie][state]) || ANIM_MAP[state];

// state -> the clip file this axie should actually load.
export function clipsFor(axie) {
  return Object.fromEntries(
    Object.keys(ANIM_MAP).map((state) => [state, clipFor(axie, state)]),
  );
}

// The FBX->GLB export left each body mesh on Maya's default lambert1 grey (#aaaaaa),
// and the shipped texture atlas only covers accessories (horns, ears, eyes, props) —
// its UVs do not address the body, so binding it just smears patches over the model.
// These are the real body colours, sampled from the official Sky Mavis starter banner
// via tools/sample-banner.mjs and cross-checked against each model's own face material
// (Buba's puffy_face.002 is #efac35, Puffy's Material.001 is #5becd3).
export const BODY_TINTS = {
  buba: '#efac35',
  pomodoro: '#d4415a',
  puffy: null, // model already carries correct per-part colours
};

// Materials three.js should treat as "uncoloured default" and retint.
export const DEFAULT_GREY = ['#aaaaaa'];

export function modelUrl(axie, clip) {
  return url('assets3d', `glb/${axie}/starter_${axie}_${clip}.glb`);
}

export function textureUrl(axie) {
  return url('assets3d', `fbx/${axie}/textures/starter_${axie}_texture.png`);
}

// Every file the fetch step needs, as {dest, url} pairs relative to the cache dir.
export function manifest() {
  const out = [];
  for (const axie of AXIES) {
    for (const clip of new Set(Object.values(clipsFor(axie)))) {
      out.push({ dest: `${axie}/${clip}.glb`, url: modelUrl(axie, clip) });
    }
    out.push({ dest: `${axie}/texture.png`, url: textureUrl(axie) });
  }
  return out;
}
