"""Emits the game's Axie data block from assets/origins/manifest.json."""
import json, os, sys

DEST = sys.argv[1] if len(sys.argv) > 1 else 'assets/origins'
m = json.load(open(os.path.join(DEST, 'manifest.json')))
ax = m['axies']

TIER_ORDER = sorted(ax, key=lambda k: (ax[k]['tier'], ax[k]['axieId']))
CLASS_LIST = ['Beast', 'Bug', 'Bird', 'Plant', 'Aquatic', 'Reptile', 'Mech',
              'Dawn', 'Dusk']

# Stats live here rather than in the manifest so balance edits stay in one place.
STATS = {
    'buba':     (55,  560, 1, False), 'puffy':   (45,  480, 1, False),
    'olek':     (30,  620, 2, False), 'momo':    (35,  430, 3, False),
    'tripp':    (58,  600, 1, False), 'ena':     (40,  560, 3, True),
    'pomodoro': (38,  700, 2, False), 'shillin': (52,  540, 1, False),
    'venoki':   (48,  720, 2, False), 'xia':     (46,  820, 2, False),
    'bing':     (62,  790, 1, False), 'rouge':   (56,  690, 4, False),
    'noir':     (58,  980, 3, False), 'mit':     (60, 1080, 2, True),
    'machito':  (66, 1150, 1, False), 'hope':    (70,  900, 4, False),
    'bard':     (68, 1250, 3, True),  'temujin': (82, 1320, 3, False),
    'shufen':   (88, 1180, 2, False),
}


def js(s):
    return "'" + str(s).replace('\\', '\\\\').replace("'", "\\'") + "'"


lines = []
w = lines.append

w("    // ---- Axie Origins data -------------------------------------------------")
w("    // Units are the 19 official Origins starter Axies. Class, purity, body")
w("    // parts and every ability card below come from the kit catalogs")
w("    // (pve-starters.json + cards.json); art comes from the kit Spine bodies")
w("    // and the gtk2d icon sets. See assets/origins/manifest.json.")
w("    const ORIGINS_ART_ROOT = 'assets/origins';")
w("    const CLASS_LIST = [" + ','.join(js(c) for c in CLASS_LIST) + "];")
w("    const AXIE_CLASSES = {")
for c in CLASS_LIST:
    v = m['classes'][c]
    w(f"      {c}:{{tint:{js(v['tint'])},icon:{js(v['icon'])},arena:{js(v['arena'])}}},")
w("    };")
w("    // Real Axie class advantage: each bloodline deals +15% to the next and")
w("    // -15% into the one that beats it.")
w("    const CLASS_BLOODLINE = {")
w("      Plant:'Verdant', Reptile:'Verdant', Dusk:'Verdant',")
w("      Aquatic:'Tidal', Bird:'Tidal', Dawn:'Tidal',")
w("      Beast:'Primal', Bug:'Primal', Mech:'Primal'")
w("    };")
w("    const BLOODLINE_BEATS = {Verdant:'Tidal', Tidal:'Primal', Primal:'Verdant'};")
w("    const CLASS_ADVANTAGE = 0.15;")
w("")
w("    const UNIT_DEFS = [")
last_tier = None
for uid in TIER_ORDER:
    a = ax[uid]
    atk, hp, rng, mystic = STATS[uid]
    if last_tier is not None and a['tier'] != last_tier:
        w("")
    last_tier = a['tier']
    kit = ','.join(
        "{part:%s,partId:%s,partClass:%s,name:%s,desc:%s,type:%s}" % (
            js(c['part']), js(c['partId']), js(c['partClass']), js(c['name']),
            js(c['desc']), js(f"{c['attackType']} {c['abilityType']}"))
        for c in a['kit'])
    parts = ','.join(f"{k}:{js(v)}" for k, v in a['parts'].items())
    w(f"      {{id:{js(uid)},name:{js(a['name'])},axieId:{a['axieId']},"
      f"tier:{a['tier']},class:{js(a['class'])},trait:{js(a['trait'])},"
      f"purity:{a['purity']},atk:{atk},hp:{hp},range:{rng},"
      f"mystic:{'true' if mystic else 'false'},")
    w(f"       attack:{js(a['attack'])},skill:{js(a['skill'])},"
      f"skillPart:{js(a['skillPart'])},skillDesc:{js(a['skillDesc'])},")
    w(f"       partClasses:[{','.join(js(c) for c in a['partClasses'])}],"
      f"parts:{{{parts}}},")
    w(f"       kit:[{kit}]}},")
w("    ];")

print('\n'.join(lines))
