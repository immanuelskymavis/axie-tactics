# Axie Origins art in Axie Tactics

All unit, boss, portrait and arena art in this folder is first-party
**Axie Infinity: Origins** art taken from the official battle kit:

<https://github.com/axieinfinity/axie-origins-asset-kit>

Read that repository's `LICENSE.md` before redistributing.

## What is here

| Path | Count | Kit source |
| --- | ---: | --- |
| `units/<id>[-pose].png` | 120 | `Assets/OriginsKit/PvE/Starters/<n>` Spine 3.8 skeletons |
| `portraits/<id>.png` | 20 | `Assets/OriginsKit/PvE/Avatars/starters/<n>.png` |
| `boss/chimera_phase*[-pose].png` | 8 | `Assets/OriginsKit/PvE/Chimeras/{gray-wolf,werewolf}` |
| `boss/chimera_token.png` | 1 | `Assets/OriginsKit/PvE/Avatars/portraits/gray-wolf.png` |
| `arena/arena-*.jpg` | 5 | `Assets/OriginsKit/PvE/Backgrounds/class/bg-*.jpg` |

`manifest.json` records, for every sprite, which skeleton it came from and
which animation and timestamp the frame was sampled at.

## How the sprites were produced

The kit ships Axie bodies as Spine 3.8 skeletons (`.json` and binary `.skel`)
plus a packed atlas — not as flat images. Each sprite here is one frame posed
out of those skeletons and composited to a transparent 256×256 PNG (320×320 for
the boss):

* `<id>.png` — `action/idle/normal` at t=0
* `<id>-move.png` — `action/run`, mid-stride
* `<id>-attack.png` — `attack/melee/normal-attack`, at the lunge
* `<id>-cast.png` — `attack/ranged/cast-high`, at the wind-up
* `<id>-hit.png` — `defense/hit-by-normal-crit`, at the recoil
* `<id>-death.png` — `defense/hit-by-normal-dramatic`, at the knockout

Every pose of a unit shares one world-space window anchored on the idle pose's
ground line, so swapping frames in combat never makes the Axie jump or resize.

Portraits and arena backdrops are shipped kit art — the portraits are copied
verbatim, the arenas only resized to 1280×720 JPEG.

## Unit → Axie mapping

| Unit | Class | Origins body | Skeleton |
| --- | --- | --- | --- |
| peon | Aqua | Puffy | `Starters/3` |
| bubbles | Aqua | Shufen | `Starters/15` |
| nemo | Aqua | Noir | `Starters/23` |
| siren | Aqua | Rouge (awakened) | `Starters/24-1` |
| immanuel | Aqua | Mit (awakened) | `Starters/25-1` |
| sprout | Plant | Olek | `Starters/2` |
| cactus | Plant | Bard | `Starters/20` |
| pumpkin | Plant | Ena | `Starters/16` |
| yggdrasil | Plant | Olek (awakened) | `Starters/2-1` |
| lotus | Plant | Ena (awakened) | `Starters/16-1` |
| nut | Beast | Tripp | `Starters/5` |
| gnasher | Beast | Xia | `Starters/21` |
| zoro | Beast | Buba | `Starters/1` |
| goliath | Beast | Xia (awakened) | `Starters/21-1` |
| chonky | Beast | Hope (awakened) | `Starters/19-1` |
| pips | Bird | Momo | `Starters/12` |
| kestrel | Bird | Pomodoro | `Starters/17` |
| falcon | Bird | Bing | `Starters/22` |
| raven | Bird | Machito (awakened) | `Starters/18-1` |
| kallaway | Bird | Momo (awakened) | `Starters/12-1` |

Tier 4–5 units use the kit's *awakened* (stage-1) bodies, so a class line reads
as an evolution of the Axies below it.
