"""Poses and framing for every Spine body the game renders."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spine
from PIL import Image

KIT = os.path.join(
    os.environ.get('ORIGINS_KIT', os.path.expanduser('~/axie-origins-asset-kit')),
    'Assets', 'OriginsKit')
STARTERS = f'{KIT}/PvE/Starters'
CHIMERAS = f'{KIT}/PvE/Chimeras'
SUMMONERS = f'{KIT}/Summoners'

# pose key -> ordered (animation, phase-of-duration) candidates
POSES = {
    'idle':   [('action/idle/normal', 0.0), ('action/idle/random-01', 0.0)],
    'move':   [('action/run', 0.45), ('action/move-forward', 0.5),
               ('action/idle/normal', 0.3)],
    'attack': [('attack/melee/normal-attack', 0.45),
               ('attack/melee/scratch-attack', 0.45),
               ('attack/melee/mouth-bite', 0.45), ('attack/melee/horn-gore', 0.45),
               ('attack/ranged/cast', 0.5), ('battle/taunt', 0.5),
               ('action/idle/normal', 0.5)],
    'cast':   [('attack/ranged/cast-high', 0.4), ('attack/ranged/cast-low', 0.4),
               ('attack/ranged/cast-multi', 0.4), ('attack/ranged/cast', 0.4),
               ('battle/get-buff', 0.5), ('action/idle/normal', 0.5)],
    'hit':    [('defense/hit-by-normal-crit', 0.5), ('defense/hit-by-normal', 0.5),
               ('defense/hit-by-ranged-attack', 0.5), ('action/idle/normal', 0.6)],
    'death':  [('defense/hit-by-normal-dramatic', 0.45), ('defense/hit-die', 0.6),
               ('activity/sleep', 0.9), ('defense/hit-by-normal', 0.9),
               ('action/idle/normal', 0.8)],
}
BOSS_POSES = {k: POSES[k] for k in ('idle', 'attack', 'hit', 'death')}
SUMMON_POSES = {k: POSES[k] for k in ('idle', 'attack', 'hit', 'death')}


def load(folder, root=STARTERS, stem=None):
    d = f'{root}/{folder}'
    stem = stem or folder
    data = f'{d}/{stem}.json'
    if not os.path.exists(data):
        data = f'{d}/{stem}.skel'
    return spine.Skeleton(data, f'{d}/{stem}.atlas', d)


def anim_duration(sk, name):
    anim = sk.data['animations'].get(name)
    if anim is None:
        return None
    mx = 0.0
    for group in ('bones', 'slots'):
        for _, tls in anim.get(group, {}).items():
            for _, frames in tls.items():
                if frames:
                    mx = max(mx, frames[-1].get('time', 0.0))
    for f in anim.get('drawOrder', []):
        mx = max(mx, f.get('time', 0.0))
    return mx


def resolve_pose(sk, candidates):
    for name, phase in candidates:
        dur = anim_duration(sk, name)
        if dur is None:
            continue
        return name, dur * phase
    return None, 0.0


def apply(sk, name, t):
    sk.reset()
    if name:
        sk.apply_animation(name, t)
    sk.update_world()


def pose_bounds(sk):
    pts = []
    for slot, att, page, reg in sk.visible_quads():
        if att.get('type', 'region') == 'mesh':
            pts.extend(spine.mesh_points(sk, slot, att))
        else:
            pts.extend(spine.quad_points(slot['bone'], att, reg))
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def build_window(idle_box, union_box, slack=1.30, headroom=0.07):
    """Square world-space window: sized from the idle pose, grown a little for
    extreme poses, anchored on the idle pose's ground line."""
    ix0, iy0, ix1, iy1 = idle_box
    ux0, uy0, ux1, uy1 = union_box
    cx = (ix0 + ix1) / 2.0
    idle_half = max(ix1 - ix0, iy1 - iy0) / 2.0
    union_half = max(ux1 - ux0, uy1 - uy0) / 2.0
    half = min(max(union_half, idle_half), idle_half * slack)
    pad = half * 2.0 * headroom
    x0, x1 = cx - half - pad, cx + half + pad
    y0 = iy0 - pad
    return (x0, y0, x1, y0 + (x1 - x0))


def build_body(folder, out_dir, out_id, size=224, root=STARTERS,
               poses=POSES, stem=None):
    sk = load(folder, root, stem)
    resolved = {k: resolve_pose(sk, c) for k, c in poses.items()}
    boxes = {}
    for key, (name, t) in resolved.items():
        apply(sk, name, t)
        boxes[key] = pose_bounds(sk)
    union = (min(b[0] for b in boxes.values()), min(b[1] for b in boxes.values()),
             max(b[2] for b in boxes.values()), max(b[3] for b in boxes.values()))
    window = build_window(boxes['idle'], union)
    scale = size / (window[2] - window[0])
    written = {}
    for key, (name, t) in resolved.items():
        apply(sk, name, t)
        img, _ = sk.render(scale=scale, bounds=window, pad=0)
        if img.size != (size, size):
            img = img.crop((0, 0, size, size))
        fn = f'{out_id}.png' if key == 'idle' else f'{out_id}-{key}.png'
        path = os.path.join(out_dir, fn)
        img.save(path, optimize=True)
        written[key] = {'file': fn, 'animation': name, 'time': round(t, 3),
                        'bytes': os.path.getsize(path)}
    return written
