# Origins asset kit → game sprites

Regenerates everything under `assets/origins/` from the official
[axie-origins-asset-kit](https://github.com/axieinfinity/axie-origins-asset-kit).

The kit ships Axie bodies as Spine 3.8 skeletons plus a packed atlas, not as
flat images, so these scripts pose the skeletons and composite the frames the
game loads.

## Usage

```bash
git clone https://github.com/axieinfinity/axie-origins-asset-kit.git
pip install pillow numpy
ORIGINS_KIT=./axie-origins-asset-kit python3 tools/origins-kit/make_assets.py
```

`ORIGINS_KIT` defaults to `~/axie-origins-asset-kit`; `ORIGINS_DEST` defaults to
`assets/origins/` in this repo. The run is deterministic — re-running it
reproduces the committed PNGs.

## Files

| File | What it does |
| --- | --- |
| `skel.py` | Reader for the kit's binary Spine 3.8 `.skel` files (26 of the 38 starter bodies ship as binary, not JSON). Emits the same dict shape as the JSON skeletons. |
| `spine.py` | Minimal Spine 3.8 renderer: bone hierarchy with all five transform modes, 1- and 2-bone IK, region and weighted-mesh attachments, animation sampling (rotate/translate/scale/shear, slot attachment and colour, draw order). Composites to an RGBA image with Pillow. |
| `build.py` | The unit → Axie skin table, the pose table (which animation and timestamp each combat state samples), and the framing logic. |
| `make_assets.py` | Entry point: writes the sprites, portraits, boss art, arenas and `manifest.json`. |

## Adding or re-skinning a unit

Edit `SKINS` in `build.py` — `'unit_id': ('<starter folder>', '<Axie name>')` —
then re-run `make_assets.py` and update `ORIGINS_SKINS` in
`axie-merge-tactics.html` to match. Folder `N` is an Axie's base body and `N-1`
its awakened body; `assets/origins/manifest.json` lists what is currently in use.

## Framing

Each unit's six poses share one square world-space window, sized from the idle
pose and anchored on its ground line, so swapping frames mid-combat never makes
an Axie jump, resize, or drift off its hex. Poses that swing wider than the
window (the death knockout, mostly) are clipped at its edge rather than being
allowed to shrink every other frame.

## Not rendered

Mesh deform timelines and clipping attachments are parsed but not applied — no
starter body needs them for the sampled frames. Path constraints and
two-colour tinting are skipped for the same reason.
