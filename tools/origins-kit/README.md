# Origins kit + gtk2d → game assets and data

Regenerates everything under `assets/origins/` — and the game's Axie data block
— from the two official Axie Infinity repositories:

- [axie-origins-asset-kit](https://github.com/axieinfinity/axie-origins-asset-kit)
- [unity-axie-gtk2d](https://github.com/axieinfinity/unity-axie-gtk2d)

The kit ships Axie bodies as Spine 3.8 skeletons plus a packed atlas, not as flat
images, so these scripts pose the skeletons and composite the frames the game
loads. They also read the kit catalogs so the roster's classes, body parts and
ability cards are the real Origins data rather than hand-typed copies.

## Usage

```bash
git clone https://github.com/axieinfinity/axie-origins-asset-kit.git
git clone https://github.com/axieinfinity/unity-axie-gtk2d.git
pip install pillow numpy

ORIGINS_KIT=./axie-origins-asset-kit \
GTK2D=./unity-axie-gtk2d \
ORIGINS_DEST=./assets/origins \
  python3 tools/origins-kit/make_assets2.py

# then refresh the data block pasted into axie-merge-tactics.html
python3 tools/origins-kit/gen_js.py assets/origins
```

`ORIGINS_KIT` and `GTK2D` default to `~/axie-origins-asset-kit` and
`~/unity-axie-gtk2d`; `ORIGINS_DEST` defaults to `assets/origins/` relative to
the repo. The run is deterministic — re-running it reproduces the committed PNGs
byte for byte.

## Files

| File | What it does |
| --- | --- |
| `skel.py` | Reader for the kit's binary Spine 3.8 `.skel` files (most starter and chimera bodies ship as binary, not JSON). Emits the same dict shape as the JSON skeletons. |
| `spine.py` | Minimal Spine 3.8 renderer: bone hierarchy with all five transform modes, 1- and 2-bone IK, region and weighted-mesh attachments, animation sampling (rotate/translate/scale/shear, slot attachment and colour, draw order). Composites with Pillow. |
| `roster.py` | Builds the 19-Axie roster from `pve-starters.json` + `cards.json`: class, purity, six part ids, and the four real Origins ability cards each Axie's mouth / horn / back / tail grants. Holds the tier, trait and skill-part assignments. |
| `build2.py` | Pose table (which animation and timestamp each combat state samples) and the shared framing window. |
| `make_assets2.py` | Entry point: writes sprites, portraits, summons, boss art, arenas, every icon set and `manifest.json`. |
| `gen_js.py` | Prints the `AXIE_CLASSES` / `CLASS_BLOODLINE` / `UNIT_DEFS` block that lives in `axie-merge-tactics.html`, so the game data and the manifest cannot drift. |

## Changing the roster

Edit `ROSTER` in `roster.py` — one row per Axie:
`(id, starter folder, tier, trait, skill part, range, mystic, atk, hp)`.
The skill part must be `hornId`, `backId` or `tailId` so it never collides with
the mouth card that drives the basic attack. Folder `N` is an Axie's base body
and `N-1` its awakened body. Stats live in `STATS` in `gen_js.py`.

Then re-run `make_assets2.py` and `gen_js.py`, and paste the printed block over
the existing one in `axie-merge-tactics.html` (it runs from `const CLASS_LIST`
down to the end of `UNIT_DEFS`).

## Framing

Each body's poses share one square world-space window, sized from the idle pose
and anchored on its ground line, so swapping frames mid-combat never makes an
Axie jump, resize, or drift off its hex. Poses that swing wider than the window
(the death knockout, mostly) are clipped at its edge rather than being allowed
to shrink every other frame.

## Not rendered

Mesh deform timelines and clipping attachments are parsed but not applied — no
body needs them for the sampled frames. Path constraints and two-colour tinting
are skipped for the same reason.
