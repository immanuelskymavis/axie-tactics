import sys, os, json, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import (KIT, STARTERS, CHIMERAS, SKINS, PORTRAITS, BOSS,
                   BOSS_TOKEN_PORTRAIT, POSES, load, build_unit, apply,
                   pose_bounds, build_window, resolve_pose)
from PIL import Image

DEST = os.environ.get(
    'ORIGINS_DEST',
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)))), 'assets', 'origins'))
for d in ('units', 'portraits', 'boss', 'arena'):
    os.makedirs(f'{DEST}/{d}', exist_ok=True)

manifest = {
    'source': 'https://github.com/axieinfinity/axie-origins-asset-kit',
    'note': ('Sprites rendered from the kit\'s official Spine 3.8 starter-Axie '
             'and chimera skeletons (Assets/OriginsKit/PvE). Portraits and '
             'arena backdrops are shipped kit art, resized only.'),
    'units': {}, 'boss': {}, 'arena': {},
}

# ---- unit sprites + portraits ----
for uid, (folder, axie) in SKINS.items():
    written = build_unit(folder, f'{DEST}/units', uid, size=256)
    src_portrait = f'{KIT}/PvE/Avatars/starters/{PORTRAITS[uid]}.png'
    shutil.copyfile(src_portrait, f'{DEST}/portraits/{uid}.png')
    manifest['units'][uid] = {
        'axie': axie,
        'skeleton': f'Assets/OriginsKit/PvE/Starters/{folder}',
        'portrait': f'Assets/OriginsKit/PvE/Avatars/starters/{PORTRAITS[uid]}.png',
        'poses': {k: {'file': v[0], 'animation': v[1], 'time': v[2]}
                  for k, v in written.items()},
    }
    print(f'{uid:10s} <- {axie}')

# ---- boss ----
BOSS_POSES = {'idle': POSES['idle'], 'attack': POSES['attack'],
              'hit': POSES['hit'], 'death': POSES['death']}
for name, chimera in BOSS.items():
    written = build_unit(chimera, f'{DEST}/boss', name, size=320,
                         root=CHIMERAS, poses=BOSS_POSES)
    manifest['boss'][name] = {
        'chimera': chimera,
        'skeleton': f'Assets/OriginsKit/PvE/Chimeras/{chimera}',
        'poses': {k: {'file': v[0], 'animation': v[1], 'time': v[2]}
                  for k, v in written.items()},
    }
    print(f'{name} <- {chimera}')
shutil.copyfile(f'{KIT}/PvE/Avatars/portraits/{BOSS_TOKEN_PORTRAIT}.png',
                f'{DEST}/boss/chimera_token.png')
manifest['boss']['chimera_token'] = {
    'chimera': BOSS_TOKEN_PORTRAIT,
    'portrait': f'Assets/OriginsKit/PvE/Avatars/portraits/{BOSS_TOKEN_PORTRAIT}.png',
}

# ---- arena backdrops ----
ARENAS = {
    'arena-plant': 'bg-plant.jpg',
    'arena-aquatic': 'bg-aquatic.jpg',
    'arena-beast': 'bg-beast.jpg',
    'arena-bird': 'bg-bird.jpg',
    'arena-boss': 'bg-dusk.jpg',
}
BG = f'{KIT}/PvE/Backgrounds/class'
for out, src in ARENAS.items():
    im = Image.open(f'{BG}/{src}').convert('RGB')
    im = im.resize((1280, 720), Image.LANCZOS)
    im.save(f'{DEST}/arena/{out}.jpg', quality=80, optimize=True,
            progressive=True)
    manifest['arena'][out] = f'Assets/OriginsKit/PvE/Backgrounds/class/{src}'
    print(f'{out}.jpg <- {src} ({os.path.getsize(f"{DEST}/arena/{out}.jpg")//1024} KB)')

with open(f'{DEST}/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2, sort_keys=True)
print('manifest written')
