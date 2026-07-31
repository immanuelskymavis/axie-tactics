# Axie Merge Tactics

A browser auto-battler set in Lunacia. Buy Axies from a rerolling shop, place them on
your half of a hex board, merge duplicates into higher stars, and let the round fight
itself. Ten stages, Chimera Elite bosses at 5 and 10, then Endless.

## Running it

The game is a single dependency-free static file, but art is loaded over relative paths,
so it needs to be served rather than opened from `file://`:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/axie-merge-tactics.html
```

There is no build step. Editing `axie-merge-tactics.html` and reloading is the whole
development loop.

## Roster

30 units across Axie's six canonical classes — Beast, Aquatic, Plant, Bird, Bug,
Reptile — five tiers deep. Tier 5 is the six starter Axies, one per class and one per
trait: **Buba**, **Puffy**, **Olek**, **Momo**, **Pomodoro**, **Venoki**. Tiers 1–4 use
real Axie body-part names matched to the class those parts belong to.

Classes and traits are defined once in `CLASSES` and `TRAITS` near the top of the
script; synergy counting, combat buffs, badges, shop icons and board colours all derive
from them.

## Art

| Source | Units |
|---|---|
| Rendered from Sky Mavis's official 3D models | Buba, Puffy, Pomodoro |
| Generated SVG from a shared Axie template | the other 27, plus the Chimera |

Official models come from [`axieinfinity/axie-starter-3d-assets`][a] and
[`axieinfinity/r3f-axie-starter`][b], pinned to commit SHAs in `tools/axie-sources.mjs`
so renders are reproducible. Axie's own CDNs are not reachable from every environment;
`raw.githubusercontent.com` is.

[a]: https://github.com/axieinfinity/axie-starter-3d-assets
[b]: https://github.com/axieinfinity/r3f-axie-starter

## Tooling

Everything under `tools/` is build-time only — none of it ships to the browser.

```sh
cd tools && npm install

npm run fetch:axies     # download official GLBs + textures into tools/.cache/
npm run render:sprites  # render them to transparent sprite strips in assets/axies/
npm run build:art       # both of the above
npm run smoke           # end-to-end check of the served game (see below)

npm run build:mobile     # 64px sprite profile -> assets/axies-mobile/
npm run build:standalone # single self-contained file -> dist/
npm run verify:standalone# prove dist/ is self-contained and plays on phone viewports

node make-svg-axies.mjs # regenerate the SVG roster + boss art
node preview-art.mjs    # contact sheet of every unit -> tools/out/
node probe-glb.mjs      # diagnostic: meshes, materials, clips in each GLB
```

`tools/roster.mjs` is the single source of truth for the roster. After editing it, run
`node emit-unitdefs.mjs` and paste the output over `UNIT_DEFS` in the game, then
`node make-svg-axies.mjs` to regenerate art.

### Sprite rendering notes

Two quirks of the official models are handled in `render-sprites.mjs`:

- The GLBs come out of an FBX pipeline with body meshes left on Maya's default grey, and
  the shipped 2048px atlas only covers accessories — its UVs do not address the body, so
  binding it smears patches over the model. Body colours are restored from
  `BODY_TINTS`, sampled off the official starter banner.
- Puffy has no idle clip in the 3D repo. The r3f package has one, but its accessories
  come through grey rather than yellow, so switching between them would change Puffy's
  horns mid-game. Puffy's idle uses the 3D repo's slow walk instead.

## Verification

`npm run smoke` boots the real page in headless Chromium and checks: no console errors,
no failed requests, every roster id resolves to art that exists, a full prep-to-combat
cycle runs, combat actors carry the animation hooks, the stage-5 Chimera spawns and
swaps to its enraged art, CMS overrides apply and reject invalid input, and the 390px
layout does not scroll horizontally. Screenshots land in `tools/out/`.

## Single-file build

`npm run build:standalone` inlines every asset as a `data:` URI and emits two files to
`dist/`:

- `axie-merge-tactics.standalone.html` — a complete document, droppable on any static host
  or opened straight off disk.
- `axie-merge-tactics.artifact.html` — the same content with no `<!doctype>`/`<html>`/
  `<head>`/`<body>`, for hosts that supply their own document skeleton.

Both default to the `mobile` sprite profile (`--profile full` for the large one). At the
520px breakpoint hexes are 47x41, so the full-resolution 128px frames are about three
times larger than a phone will ever draw them; the small profile takes the bundle from
1.56 MB to 0.69 MB. Every art path in the game resolves through `assetUrl()`, which reads
`window.__ASSETS` — the map this build writes.

`npm run verify:standalone` is the check that matters: it serves *only* the built file, so
any asset the page still tries to fetch 404s. Passing with **zero subresource requests** is
what proves the page survives a strict CSP instead of loading with missing art.

## CMS

`cms/index.html` is a balance-tuning tool. It writes to `localStorage`, and the game
reads those overrides on its next reload in the same browser.

It is an override layer, not a data source: it can retune units that already exist, but
cannot add new ones, since a new unit would also need art and a skill implementation.
Unknown ids are skipped and invalid class/trait values are discarded.
