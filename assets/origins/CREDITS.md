# Axie Origins art and data in Axie Tactics

Every unit, class, status, relic, arena and icon in this folder is first-party
**Axie Infinity** art and data, from two official repositories:

- <https://github.com/axieinfinity/axie-origins-asset-kit> — Origins battle kit
  (Spine bodies, catalogs, status/intent/UI art, arenas)
- <https://github.com/axieinfinity/unity-axie-gtk2d> — Axie IP Tool Kit 2D
  (class icons, body-part icons, land items)

Read those repositories' licence files before redistributing.

## The roster is the real starter roster

The game's units **are** the 19 official Origins starter Axies. For each one,
the class, the six body parts, the purity and all four ability cards come
straight from the kit catalogs — `Catalogs/pve-starters.json` for the Axie and
`Catalogs/cards.json` for the 588 real Origins ability cards its parts grant.
Nothing about a unit's identity is invented.

| Axie | Axie # | Class | Tier | Trait | Purity | Ability-part classes | Skill card |
| --- | ---: | --- | ---: | --- | ---: | --- | --- |
| Buba | 1 | Beast | 1 | Vanguard | 4/6 | Beast, Plant | Buba Brush |
| Olek | 2 | Plant | 1 | Bastion | 4/6 | Mech, Plant | Rusty Helm |
| Puffy | 3 | Aquatic | 1 | Assassin | 4/6 | Aquatic, Beast, Reptile | Jellytacle |
| Momo | 12 | Bird | 1 | Sniper | 5/6 | Bird | Death Shower |
| Tripp | 5 | Beast | 2 | Vanguard | 4/6 | Beast, Dawn, Plant | Acorn Cap |
| Shillin | 11 | Bug | 2 | Assassin | 4/6 | Bird, Bug, Mech | Shield Shattering |
| Ena | 16 | Plant | 2 | Mage | 3/6 | Beast, Dawn, Plant | Aegis Talisman |
| Pomodoro | 17 | Bug | 2 | Bastion | 2/6 | Beast, Bug, Mech | Lost Dream |
| Venoki | 7 | Reptile | 3 | Spikes | 4/6 | Bug, Plant, Reptile | Death Shroom |
| Xia | 21 | Beast | 3 | Bastion | 4/6 | Beast, Plant | Pangolin |
| Bing | 22 | Beast | 3 | Vanguard | 5/6 | Beast, Plant | Toy Ball |
| Rouge | 24 | Aquatic | 3 | Sniper | 4/6 | Aquatic, Bug, Plant | Lotus |
| Machito | 18 | Reptile | 4 | Spikes | 5/6 | Dusk, Reptile | Maraca |
| Hope | 19 | Beast | 4 | Sniper | 4/6 | Beast, Bird, Mech | Mainspring |
| Noir | 23 | Aquatic | 4 | Bastion | 5/6 | Aquatic, Beast | Sponge |
| Mit | 25 | Plant | 4 | Mage | 4/6 | Dusk, Plant | Dream Eater |
| Temujin | 14 | Dawn | 5 | Spikes | 3/6 | Beast, Dawn, Dusk | Black Gourd |
| Shufen | 15 | Dusk | 5 | Assassin | 2/6 | Aquatic, Bug, Dusk | Darksea Jellyfish |
| Bard | 20 | Plant | 5 | Mage | 3/6 | Bird, Dawn, Plant | Ballad Of The Shore |

Classes were cross-checked against the gtk2d starter spine folder names
(`01-buba-beast`, `03-puffy-aquatic`, `15-support-dusk`, …), which name the
class directly.

## How the game uses the data

- **Attack** is the Axie's **mouth** card; **skill** is one of its horn, back or
  tail cards. All four are shown in the inspect panel and the Axie Codex.
- **Class synergy** counts every Axie carrying that class on one of its four
  ability parts — the way an Origins deck is actually built — so one Axie can
  feed two or three classes. 3 for Lv1, 5 for Lv2.
- **Class advantage** is the real Axie triangle: Verdant (Plant, Reptile, Dusk)
  beats Tidal (Aquatic, Bird, Dawn) beats Primal (Beast, Bug, Mech) beats
  Verdant, at ±15% damage.
- **Awakening**: merging to 3★ swaps the Axie to its second Origins body stage
  (the kit's `-1` skeletons).
- **Bard's** Ballad Of The Shore and Feather Melody summon a True Fan Hermit
  Crab and a Sparrow, using the kit's actual summoner Spine bodies.
- **Statuses** (Poison, Bleed, Weak, Fear, Sleep, Taunt, Bulwark, Stealth) use
  the kit's Origins status icons and are named after the real statuses in
  `Catalogs/statuses.json`.

## What is in this folder

| Path | Count | Source |
| --- | ---: | --- |
| `units/<id>[-awakened][-pose].png` | 228 | `PvE/Starters/<n>` and `<n>-1` Spine 3.8 skeletons |
| `portraits/<id>.png` | 19 | `PvE/Avatars/starters/<n>.png` |
| `summons/{sparrow,hermitcrab}[-pose].png` | 8 | `Summoners/{sparrow,truefanhermitcrab}` |
| `boss/chimera_phase*[-pose].png` | 8 | `PvE/Chimeras/{gray-wolf,werewolf}` |
| `boss/chimera_token.png` | 1 | `PvE/Avatars/portraits/gray-wolf.png` |
| `arena/arena-<class>.jpg`, `arena-boss.jpg` | 10 | `PvE/Backgrounds/class/bg-*.jpg`, `bg_gauntlet.png` |
| `icons/class/<class>.png` | 9 | gtk2d `axie-class-icon` (hidden_1/2/3 = Mech/Dawn/Dusk) |
| `icons/part/<class>-<part>.png` | 36 | gtk2d `axie-part-icon` |
| `icons/status/<name>.png` | 20 | `Textures/StatusIcons` |
| `icons/trait/<trait>.png` | 6 | `Textures/StatusIcons`, matched to each trait's effect |
| `icons/daily/<id>.png` | 6 | `Textures/StatusIcons` |
| `icons/intent/<name>.png` | 17 | `PvE/Intents` |
| `icons/node/<name>.png` | 6 | `PvE/UI/Nodes` |
| `icons/relic/<id>.png` | 22 | gtk2d `land-items` (weapons, armour, potions, shells, jewellery) |
| `ui/*.png` | 5 | `PvE/UI/{HpBar2,InBattle,Frames,Chapter}` |

`manifest.json` records, for every sprite, which skeleton it came from and which
animation and timestamp the frame was sampled at, plus each Axie's full card kit
and each class's icon tint and arena.

## How the sprites were produced

The kit ships Axie bodies as Spine 3.8 skeletons (`.json` and binary `.skel`)
plus a packed atlas — not as flat images. Each sprite is one frame posed out of
those skeletons and composited to a transparent PNG (224px for Axies, 288 for
the boss, 160 for summons):

* `<id>.png` — `action/idle/normal` at t=0
* `<id>-move.png` — `action/run`, mid-stride
* `<id>-attack.png` — `attack/melee/normal-attack`, at the lunge
* `<id>-cast.png` — `attack/ranged/cast-high`, at the wind-up
* `<id>-hit.png` — `defense/hit-by-normal-crit`, at the recoil
* `<id>-death.png` — `defense/hit-by-normal-dramatic`, at the knockout

Every pose of a body shares one world-space window anchored on the idle pose's
ground line, so swapping frames in combat never makes an Axie jump or resize.

Portraits, arenas and every icon are shipped kit or gtk2d art — copied verbatim
apart from resizing.

## Regenerating

See `tools/origins-kit/README.md`. The run is deterministic: it reproduces the
committed PNGs byte for byte.
