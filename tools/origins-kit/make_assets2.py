"""Builds every art asset the game loads, from the Origins kit + gtk2d toolkit."""
import sys, os, json, shutil, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build2 import (KIT, STARTERS, CHIMERAS, SUMMONERS, POSES, BOSS_POSES,
                    SUMMON_POSES, build_body)
from roster import build as build_roster, clean
from PIL import Image

GTK = os.path.join(
    os.environ.get('GTK2D', os.path.expanduser('~/unity-axie-gtk2d')),
    'Assets', 'AxieInfinity', 'AxieStandardAssets', 'Sprites')
DEST = os.environ.get(
    'ORIGINS_DEST',
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)))), 'assets', 'origins'))

CLASSES = ['Beast', 'Bug', 'Bird', 'Plant', 'Aquatic', 'Reptile', 'Mech',
           'Dawn', 'Dusk']
# gtk2d ships the three secret classes as hidden_1/2/3; the iconography
# (gear, sun, crescent) identifies them as Mech / Dawn / Dusk.
CLASS_ICON = {'Beast': 'beast', 'Bug': 'bug', 'Bird': 'bird', 'Plant': 'plant',
              'Aquatic': 'aquatic', 'Reptile': 'reptile', 'Mech': 'hidden_1',
              'Dawn': 'hidden_2', 'Dusk': 'hidden_3'}
CLASS_ARENA = {'Beast': 'bg-beast.jpg', 'Bug': 'bg-bug.jpg', 'Bird': 'bg-bird.jpg',
               'Plant': 'bg-plant.jpg', 'Aquatic': 'bg-aquatic.jpg',
               'Reptile': 'bg-reptile.jpg', 'Mech': 'bg-mech.jpg',
               'Dawn': 'bg-dawn.jpg', 'Dusk': 'bg-dusk.jpg'}
PART_TYPES = ['eyes', 'ears', 'mouth', 'horn', 'back', 'tail']
PART_ICON_CLASSES = ['beast', 'bug', 'bird', 'plant', 'aquatic', 'reptile']

BOSS = {'chimera_phase1': 'gray-wolf', 'chimera_phase2': 'werewolf'}
BOSS_TOKEN_PORTRAIT = 'gray-wolf'
SUMMONS = {'sparrow': ('sparrow', 'Sparrow'),
           'hermitcrab': ('truefanhermitcrab', 'TrueFanHermitCrab')}

# combat state -> Origins status icon (statuses.json iconFile stems)
STATUS_ICONS = {
    'poison': 'debuff_poison', 'bleed': 'debuff_bleed', 'weak': 'debuff_weak',
    'fear': 'debuff_fear', 'sleep': 'debuff_sleep', 'stunned': 'debuff_stunned',
    'taunt': 'neutral_taunt', 'rage': 'buff_rage', 'bulwark': 'buff_bulwark',
    'bubble': 'buff_bubble', 'leaf': 'buff_leaf', 'fragile': 'debuff_fragile',
    'meditate': 'buff_meditate', 'alert': 'buff_alert', 'curse': 'power_cursed_doll',
    'stealth': 'buff_stealth', 'reflect': 'secret_reflect', 'fury': 'buff_fury',
    'cleanser': 'buff_cleanser', 'heal_block': 'debuff_heal_block',
}
# Merge Tactics traits have no first-party badge, so each borrows the Origins
# status icon that matches what the trait actually does.
TRAIT_ICONS = {
    'Assassin': 'debuff_death_mark', 'Bastion': 'power_advance_shielding',
    'Vanguard': 'buff_rage', 'Mage': 'buff_meditate',
    'Spikes': 'buff_spike', 'Sniper': 'second_target',
}
# Daily modifiers, drawn from the kit's status art.
DAILY_ICONS = {
    'bloodmoon': 'bloodmoon', 'ironwall': 'rune_mech_defensive_1',
    'arcane': 'power_energy_master', 'glass': 'buff_dmg_boost',
    'slowtime': 'debuff_disarmed', 'bounty': 'rune_neutral_utility_1',
}
RELIC_ICONS = {
    'mint': 'Potion/potion_energy_small', 'cloak': 'Potion/potion_stealth_medium',
    'spores': 'Shell/shell_area_damage_small', 'crest': 'Armor/steel_shield',
    'banner': 'Weapon/long_bow', 'runestone': 'Weapon/silver_staff',
    'scope': 'Weapon/composite_bow', 'capacitor': 'Potion/potion_energy_large',
    'watch': 'Potion/potion_haste_medium', 'scrap': 'Accessory/gold_ring',
    'gem': 'Accessory/gold_ruby_ring', 'glass': 'Potion/potion_might_small',
    'elixir': 'Potion/potion_health_large', 'adrenaline': 'Potion/potion_haste_large',
    'secondwind': 'Potion/potion_cure_ailment_large', 'battery': 'Shell/shell_shock',
    'tax': 'Accessory/gold_necklace', 'bloodmoon': 'Shell/shell_burn',
    'ironwall': 'Armor/iron_plate_mail', 'arcane': 'Weapon/gold_staff',
    'slowtime': 'Shell/shell_slow', 'bounty': 'Shell/shell_concentrated_damage_medium',
}


def copy_icon(src, dst, box=96):
    """Icons ship at art resolution; the game never draws them above ~40px."""
    im = Image.open(src).convert('RGBA')
    if max(im.size) > box:
        im.thumbnail((box, box), Image.LANCZOS)
    im.save(dst, optimize=True)


def ensure(*parts):
    p = os.path.join(DEST, *parts)
    os.makedirs(p, exist_ok=True)
    return p


def icon_tint(path):
    """Dominant saturated colour of a class icon, for CSS accents."""
    im = Image.open(path).convert('RGBA').resize((16, 16), Image.LANCZOS)
    best, score = (150, 150, 160), -1
    px = [im.getpixel((x, y)) for y in range(16) for x in range(16)]
    for r, g, b, a in px:
        if a < 200:
            continue
        mx, mn = max(r, g, b), min(r, g, b)
        s = (mx - mn) + mx * 0.25
        if s > score:
            score, best = s, (r, g, b)
    return '#%02x%02x%02x' % best


def main():
    for d in ('units', 'portraits', 'summons', 'boss', 'arena',
              'icons/class', 'icons/part', 'icons/status', 'icons/intent',
              'icons/node', 'icons/relic', 'icons/trait', 'icons/daily', 'ui'):
        ensure(*d.split('/'))

    roster = build_roster()
    manifest = {
        'sources': {
            'origins-kit': 'https://github.com/axieinfinity/axie-origins-asset-kit',
            'gtk2d': 'https://github.com/axieinfinity/unity-axie-gtk2d',
        },
        'note': ('Units are the 19 official Origins starter Axies. Body sprites '
                 'are frames posed out of the kit Spine 3.8 skeletons; every '
                 'Axie ships a base body and its awakened (stage-1) body. Class '
                 'and part icons come from the gtk2d toolkit; status, intent, '
                 'node and HP art and the arenas are shipped kit art.'),
        'axies': {}, 'summons': {}, 'boss': {}, 'arena': {}, 'classes': {},
        'icons': {'status': {}, 'relic': {}, 'intent': [], 'node': [], 'part': []},
    }

    # ---- Axie bodies (base + awakened) and portraits ----
    for a in roster:
        base = build_body(a['folder'], ensure('units'), a['id'], size=224)
        awk = build_body(f"{a['folder']}-1", ensure('units'),
                         f"{a['id']}-awakened", size=224)
        shutil.copyfile(f"{KIT}/PvE/Avatars/starters/{a['folder']}.png",
                        os.path.join(DEST, 'portraits', f"{a['id']}.png"))
        manifest['axies'][a['id']] = {
            'name': a['name'], 'axieId': a['axieId'], 'class': a['cls'],
            'tier': a['tier'], 'trait': a['trait'], 'purity': a['purity'],
            'parts': a['parts'], 'partClasses': a['partClasses'],
            'kit': a['kit'], 'attack': a['attack'], 'skill': a['skillName'],
            'skillPart': a['skillPart'], 'skillDesc': a['skillDesc'],
            'skeleton': f"Assets/OriginsKit/PvE/Starters/{a['folder']}",
            'skeletonAwakened': f"Assets/OriginsKit/PvE/Starters/{a['folder']}-1",
            'poses': {k: {kk: vv for kk, vv in v.items() if kk != 'bytes'}
                      for k, v in base.items()},
            'posesAwakened': {k: {kk: vv for kk, vv in v.items() if kk != 'bytes'}
                              for k, v in awk.items()},
        }
        print(f"axie {a['id']:9s} {a['name']:9s} {a['cls']:8s} "
              f"{(sum(v['bytes'] for v in base.values()) + sum(v['bytes'] for v in awk.values()))//1024:4d} KB")

    # ---- Bard's summons ----
    for out_id, (folder, stem) in SUMMONS.items():
        w = build_body(folder, ensure('summons'), out_id, size=160,
                       root=SUMMONERS, poses=SUMMON_POSES, stem=stem)
        manifest['summons'][out_id] = {
            'skeleton': f'Assets/OriginsKit/Summoners/{folder}',
            'poses': {k: {kk: vv for kk, vv in v.items() if kk != 'bytes'}
                      for k, v in w.items()},
        }
        print(f'summon {out_id}')

    # ---- Chimera boss ----
    for name, chimera in BOSS.items():
        w = build_body(chimera, ensure('boss'), name, size=288,
                       root=CHIMERAS, poses=BOSS_POSES)
        manifest['boss'][name] = {
            'chimera': chimera,
            'skeleton': f'Assets/OriginsKit/PvE/Chimeras/{chimera}',
            'poses': {k: {kk: vv for kk, vv in v.items() if kk != 'bytes'}
                      for k, v in w.items()},
        }
        print(f'boss {name} <- {chimera}')
    shutil.copyfile(f'{KIT}/PvE/Avatars/portraits/{BOSS_TOKEN_PORTRAIT}.png',
                    os.path.join(DEST, 'boss', 'chimera_token.png'))
    manifest['boss']['chimera_token'] = {'chimera': BOSS_TOKEN_PORTRAIT}

    # ---- one arena per class, plus the boss arena ----
    BG = f'{KIT}/PvE/Backgrounds/class'
    for cls in CLASSES:
        src = f'{BG}/{CLASS_ARENA[cls]}'
        im = Image.open(src).convert('RGB').resize((1280, 720), Image.LANCZOS)
        out = f'arena-{cls.lower()}.jpg'
        im.save(os.path.join(DEST, 'arena', out), quality=80, optimize=True,
                progressive=True)
        manifest['arena'][cls] = out
    im = Image.open(f'{BG}/bg_gauntlet.png').convert('RGB').resize((1280, 720), Image.LANCZOS)
    im.save(os.path.join(DEST, 'arena', 'arena-boss.jpg'), quality=80,
            optimize=True, progressive=True)
    manifest['arena']['Boss'] = 'arena-boss.jpg'

    # ---- class + part icons (gtk2d) ----
    for cls in CLASSES:
        stem = CLASS_ICON[cls]
        src = f'{GTK}/axie-class-icon/{stem}.png'
        dst = os.path.join(DEST, 'icons', 'class', f'{cls.lower()}.png')
        copy_icon(src, dst, 64)
        manifest['classes'][cls] = {
            'icon': f'{cls.lower()}.png', 'gtkIcon': stem,
            'tint': icon_tint(src), 'arena': manifest['arena'][cls],
        }
    for pc in PART_ICON_CLASSES:
        for pt in PART_TYPES:
            src = f'{GTK}/axie-part-icon/{pc}-{pt}.png'
            if not os.path.exists(src):
                continue
            copy_icon(src, os.path.join(DEST, 'icons', 'part',
                                        f'{pc}-{pt}.png'), 72)
            manifest['icons']['part'].append(f'{pc}-{pt}.png')

    # ---- status icons (kit) ----
    for key, stem in STATUS_ICONS.items():
        src = f'{KIT}/Textures/StatusIcons/{stem}.png'
        if not os.path.exists(src):
            print('  missing status icon', stem)
            continue
        copy_icon(src, os.path.join(DEST, 'icons', 'status', f'{key}.png'), 72)
        manifest['icons']['status'][key] = stem

    # ---- trait icons (kit status art) ----
    manifest['icons']['trait'] = {}
    for trait, stem in TRAIT_ICONS.items():
        src = f'{KIT}/Textures/StatusIcons/{stem}.png'
        if not os.path.exists(src):
            print('  missing trait icon', stem)
            continue
        copy_icon(src, os.path.join(DEST, 'icons', 'trait', f'{trait.lower()}.png'), 72)
        manifest['icons']['trait'][trait] = stem

    # ---- daily modifier icons (kit status art) ----
    manifest['icons']['daily'] = {}
    for did, stem in DAILY_ICONS.items():
        src = f'{KIT}/Textures/StatusIcons/{stem}.png'
        if not os.path.exists(src):
            print('  missing daily icon', stem)
            continue
        copy_icon(src, os.path.join(DEST, 'icons', 'daily', f'{did}.png'), 72)
        manifest['icons']['daily'][did] = stem

    # ---- enemy intent + stage node icons (kit) ----
    for f in sorted(os.listdir(f'{KIT}/PvE/Intents')):
        if not f.endswith('.png'):
            continue
        name = re.sub(r'(?<!^)(?=[A-Z])', '-', f[:-4]).lower() + '.png'
        copy_icon(f'{KIT}/PvE/Intents/{f}',
                  os.path.join(DEST, 'icons', 'intent', name), 72)
        manifest['icons']['intent'].append(name)
    for f in sorted(os.listdir(f'{KIT}/PvE/UI/Nodes')):
        if not f.endswith('.png'):
            continue
        copy_icon(f'{KIT}/PvE/UI/Nodes/{f}',
                  os.path.join(DEST, 'icons', 'node', f), 64)
        manifest['icons']['node'].append(f)

    # ---- relic icons (gtk2d land items) ----
    for rid, rel in RELIC_ICONS.items():
        src = f'{GTK}/land-items/Items/{rel}.png'
        if not os.path.exists(src):
            print('  missing relic icon', rel)
            continue
        copy_icon(src, os.path.join(DEST, 'icons', 'relic', f'{rid}.png'), 96)
        manifest['icons']['relic'][rid] = rel

    # ---- battle UI chrome (kit) ----
    # Sizes are per-piece: 9-slice frames need resolution, pips do not.
    UI_ART = [
        ('PvE/UI/Frames/frame_border.png', 'frame-border.png', 192),
        ('PvE/UI/Frames/frame_back.png', 'frame-back.png', 128),
        ('PvE/UI/Frames/star.png', 'star.png', 48),
        ('PvE/UI/HpBar2/hp-bar-small.png', 'hp-track.png', 192),
        ('PvE/UI/HpBar2/hp-small.png', 'hp-fill.png', 192),
        ('PvE/UI/InBattle/avatar_frame.png', 'avatar-frame.png', 128),
        ('PvE/UI/InBattle/energy_jar.png', 'energy-jar.png', 128),
        ('PvE/UI/InBattle/name_panel.png', 'name-panel.png', 256),
        ('PvE/UI/InBattle/icon_shield.png', 'icon-shield.png', 48),
        ('PvE/UI/Chapter/icon_stage_boss.png', 'stage-boss.png', 64),
    ]
    manifest['icons']['ui'] = {}
    for src, dst, box in UI_ART:
        path = f'{KIT}/{src}'
        if not os.path.exists(path):
            print('  missing ui art', src)
            continue
        copy_icon(path, os.path.join(DEST, 'ui', dst), box)
        manifest['icons']['ui'][dst] = src

    with open(os.path.join(DEST, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    print('manifest written ->', DEST)


if __name__ == '__main__':
    main()
