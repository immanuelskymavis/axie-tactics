"""Builds the Starter Axie roster from the Origins kit catalogs."""
import json, os, re

KIT = os.path.join(
    os.environ.get('ORIGINS_KIT', os.path.expanduser('~/axie-origins-asset-kit')),
    'Assets', 'OriginsKit')
CAT = f'{KIT}/Catalogs'

# pve-starters.json class ints -> Axie class. Confirmed against the
# unity-axie-gtk2d starter spine folder names (01-buba-beast, 15-support-dusk...).
CLASS_BY_INT = {None: 'Beast', 0: 'Beast', 1: 'Bug', 2: 'Bird', 3: 'Plant',
                4: 'Aquatic', 5: 'Reptile', 6: 'Mech', 7: 'Dawn', 8: 'Dusk'}
PART_CLASS = {'beast': 'Beast', 'bug': 'Bug', 'bird': 'Bird', 'plant': 'Plant',
              'aquatic': 'Aquatic', 'reptile': 'Reptile', 'mech': 'Mech',
              'dawn': 'Dawn', 'dusk': 'Dusk'}
CARD_PARTS = ('mouthId', 'hornId', 'backId', 'tailId')
ALL_PARTS = ('eyesId', 'earsId', 'mouthId', 'hornId', 'backId', 'tailId')

# id -> (starter folder, tier, trait, skill part, range, mystic, atk, hp)
# Tier spreads class and trait across the shop pool; the canonical starter trio
# (Buba / Puffy / Olek) sits at tier 1, the two secret classes at tier 5.
ROSTER = [
    # id          folder tier trait        skill part  range mystic atk   hp
    ('buba',      '1',   1, 'Vanguard',  'tailId',  1, False,  55,  560),
    ('puffy',     '3',   1, 'Assassin',  'hornId',  1, False,  45,  480),
    ('olek',      '2',   1, 'Bastion',   'hornId',  2, False,  30,  620),
    ('momo',      '12',  1, 'Sniper',    'tailId',  3, False,  35,  430),

    ('tripp',     '5',   2, 'Vanguard',  'hornId',  1, False,  58,  600),
    ('ena',       '16',  2, 'Mage',      'tailId',  3, True,   40,  560),
    ('pomodoro',  '17',  2, 'Bastion',   'hornId',  2, False,  38,  700),
    ('shillin',   '11',  2, 'Assassin',  'tailId',  1, False,  52,  540),

    ('venoki',    '7',   3, 'Spikes',    'backId',  2, False,  48,  720),
    ('xia',       '21',  3, 'Bastion',   'tailId',  2, False,  46,  820),
    ('bing',      '22',  3, 'Vanguard',  'hornId',  1, False,  62,  790),
    ('rouge',     '24',  3, 'Sniper',    'hornId',  4, False,  56,  690),

    ('noir',      '23',  4, 'Bastion',   'backId',  3, False,  58,  980),
    ('mit',       '25',  4, 'Mage',      'hornId',  2, True,   60, 1080),
    ('machito',   '18',  4, 'Spikes',    'tailId',  1, False,  66, 1150),
    ('hope',      '19',  4, 'Sniper',    'tailId',  4, False,  70,  900),

    ('bard',      '20',  5, 'Mage',      'hornId',  3, True,   68, 1250),
    ('temujin',   '14',  5, 'Spikes',    'tailId',  3, False,  82, 1320),
    ('shufen',    '15',  5, 'Assassin',  'hornId',  2, False,  88, 1180),
]


def clean(text):
    """Origins card text carries Unity rich-text colour tags."""
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', text or '')).strip()


def load():
    starters = {s['name'].lower(): s
                for s in json.load(open(f'{CAT}/pve-starters.json'))['starters']}
    by_folder = {}
    for s in json.load(open(f'{CAT}/pve-starters.json'))['starters']:
        by_folder[str(s['axieId'])] = s
    cards = {}
    for c in json.load(open(f'{CAT}/cards.json'))['items']:
        if c.get('stage') == 1 and c.get('abilityId'):
            cards.setdefault(c['abilityId'], c)
    return by_folder, cards


def build():
    by_folder, cards = load()
    out = []
    for uid, folder, tier, trait, skill_part, rng, mystic, atk, hp in ROSTER:
        s = by_folder[folder]
        cls = CLASS_BY_INT[s.get('class')]
        parts = {k[:-2]: s[k] for k in ALL_PARTS}
        purity = sum(1 for p in parts.values() if PART_CLASS[p.split('-')[0]] == cls)
        kit = []
        for k in CARD_PARTS:
            c = cards.get(s[k])
            kit.append({
                'part': k[:-2],
                'partId': s[k],
                'partClass': PART_CLASS[s[k].split('-')[0]],
                'name': c['name'] if c else s[k],
                'desc': clean(c['description']) if c else '',
                'attackType': (c or {}).get('attackType') or 'Melee',
                'abilityType': (c or {}).get('abilityType') or 'Attack',
            })
            # skills come from horn / back / tail, so they never collide with the
        # mouth card that drives the basic attack
        assert skill_part in ('hornId', 'backId', 'tailId'), skill_part
        skill = next(c for c in kit if c['part'] == skill_part[:-2])
        attack = next(c for c in kit if c['part'] == 'mouth')
        out.append({
            'id': uid, 'name': s['name'], 'axieId': s['axieId'], 'folder': folder,
            'cls': cls, 'tier': tier, 'trait': trait, 'purity': purity,
            'range': rng, 'mystic': mystic, 'atk': atk, 'hp': hp,
            'parts': parts,
            'partClasses': sorted({c['partClass'] for c in kit}),
            'kit': kit,
            'attack': attack['name'],
            'skillName': skill['name'],
            'skillPart': skill['part'],
            'skillDesc': skill['desc'],
        })
    return out


if __name__ == '__main__':
    for a in build():
        print(f"{a['id']:9s} {a['name']:9s} {a['cls']:8s} T{a['tier']} "
              f"{a['trait']:9s} pur {a['purity']}/6 parts={','.join(a['partClasses']):28s} "
              f"atk={a['attack']:18s} skill={a['skillName']}")
