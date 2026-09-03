"""Minimal Spine 3.8 renderer: region attachments only, setup pose + animation sampling."""
import json, math, os
from PIL import Image

DEG = math.pi / 180.0


def parse_atlas(path):
    pages, cur, region = [], None, None
    lines = open(path).read().split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip() == "":
            cur = {"name": None, "regions": {}}
            i += 1
            if i >= len(lines):
                break
            cur["name"] = lines[i].strip()
            pages.append(cur)
            i += 1
            while i < len(lines) and ":" in lines[i]:
                i += 1
            continue
        if cur is None:
            cur = {"name": line.strip(), "regions": {}}
            pages.append(cur)
            i += 1
            while i < len(lines) and ":" in lines[i] and not lines[i].startswith("  "):
                i += 1
            continue
        name = line.strip()
        region = {"rotate": False, "index": -1}
        cur["regions"][name] = region
        i += 1
        while i < len(lines) and ":" in lines[i]:
            k, v = lines[i].split(":", 1)
            k, v = k.strip(), v.strip()
            if k == "rotate":
                region["rotate"] = v == "true"
            elif k in ("xy", "size", "orig", "offset"):
                region[k] = [int(x) for x in v.split(",")]
            elif k == "index":
                region["index"] = int(v)
            i += 1
    return pages


class Bone:
    __slots__ = ("data", "parent", "children", "x", "y", "rotation", "scaleX", "scaleY",
                 "shearX", "shearY", "a", "b", "c", "d", "worldX", "worldY")

    def __init__(self, data, parent):
        self.data = data
        self.parent = parent
        self.children = []
        self.set_to_setup()

    def set_to_setup(self):
        d = self.data
        self.x = d.get("x", 0.0)
        self.y = d.get("y", 0.0)
        self.rotation = d.get("rotation", 0.0)
        self.scaleX = d.get("scaleX", 1.0)
        self.scaleY = d.get("scaleY", 1.0)
        self.shearX = d.get("shearX", 0.0)
        self.shearY = d.get("shearY", 0.0)

    def update_world(self):
        p = self.parent
        rot = self.rotation
        sx, sy = self.scaleX, self.scaleY
        rx = (rot + self.shearX) * DEG
        ry = (rot + 90 + self.shearY) * DEG
        la = math.cos(rx) * sx
        lb = math.cos(ry) * sy
        lc = math.sin(rx) * sx
        ld = math.sin(ry) * sy
        if p is None:
            self.a, self.b, self.c, self.d = la, lb, lc, ld
            self.worldX, self.worldY = self.x, self.y
            return
        pa, pb, pc, pd = p.a, p.b, p.c, p.d
        self.worldX = pa * self.x + pb * self.y + p.worldX
        self.worldY = pc * self.x + pd * self.y + p.worldY
        mode = self.data.get("transform", "normal")
        if mode == "normal":
            self.a = pa * la + pb * lc
            self.b = pa * lb + pb * ld
            self.c = pc * la + pd * lc
            self.d = pc * lb + pd * ld
            return
        if mode == "onlyTranslation":
            self.a, self.b, self.c, self.d = la, lb, lc, ld
            return
        if mode in ("noRotationOrReflection",):
            s = pa * pa + pc * pc
            if s > 0.0001:
                s = abs(pa * pd - pb * pc) / s
                pb = pc * s
                pd = pa * s
            prx = math.atan2(pc, pa)
            rx2 = (rot + self.shearX) * DEG + prx
            ry2 = (rot + 90 + self.shearY) * DEG + prx
            la, lb = math.cos(rx2) * sx, math.cos(ry2) * sy
            lc, ld = math.sin(rx2) * sx, math.sin(ry2) * sy
            self.a = pa * la + pb * lc
            self.b = pa * lb + pb * ld
            self.c = pc * la + pd * lc
            self.d = pc * lb + pd * ld
            return
        # noScale / noScaleOrReflection
        cosr, sinr = math.cos(rot * DEG), math.sin(rot * DEG)
        za = (pa * cosr + pb * sinr)
        zc = (pc * cosr + pd * sinr)
        s = math.hypot(za, zc)
        if s > 0.00001:
            s = 1.0 / s
        za *= s
        zc *= s
        s = math.hypot(za, zc)
        r = math.pi / 2 + math.atan2(zc, za)
        zb, zd = math.cos(r) * s, math.sin(r) * s
        rx2 = self.shearX * DEG
        ry2 = (90 + self.shearY) * DEG
        la, lb = math.cos(rx2) * sx, math.cos(ry2) * sy
        lc, ld = math.sin(rx2) * sx, math.sin(ry2) * sy
        if mode == "noScaleOrReflection" and (pa * pd - pb * pc) < 0:
            zb, zd = -zb, -zd
        self.a = za * la + zb * lc
        self.b = za * lb + zb * ld
        self.c = zc * la + zd * lc
        self.d = zc * lb + zd * ld


class Skeleton:
    def __init__(self, json_path, atlas_path, page_dir):
        if str(json_path).endswith('.skel'):
            import skel as _skel
            self.data = _skel.read_skel(json_path)
        else:
            self.data = json.load(open(json_path))
        self.bones = []
        self.bone_map = {}
        for bd in self.data["bones"]:
            parent = self.bone_map.get(bd.get("parent"))
            b = Bone(bd, parent)
            if parent:
                parent.children.append(b)
            self.bones.append(b)
            self.bone_map[bd["name"]] = b
        self.slots = []
        self.slot_map = {}
        for i, sd in enumerate(self.data["slots"]):
            slot = {"data": sd, "bone": self.bone_map[sd["bone"]], "index": i,
                    "attachment": sd.get("attachment"), "color": sd.get("color", "ffffffff")}
            self.slots.append(slot)
            self.slot_map[sd["name"]] = slot
        self.draw_order = list(range(len(self.slots)))
        skins = self.data["skins"]
        self.skin = skins[0]["attachments"] if isinstance(skins, list) else skins["default"]
        self.pages = parse_atlas(atlas_path)
        self.images = {}
        for p in self.pages:
            self.images[p["name"]] = Image.open(os.path.join(page_dir, p["name"])).convert("RGBA")
        self.ik = self.data.get("ik", [])

    # ---- pose ----
    def reset(self):
        for b in self.bones:
            b.set_to_setup()
        for i, sd in enumerate(self.data["slots"]):
            self.slots[i]["attachment"] = sd.get("attachment")
            self.slots[i]["color"] = sd.get("color", "ffffffff")
        self.draw_order = list(range(len(self.slots)))
        self.ik_state = {c["name"]: {"mix": c.get("mix", 1.0), "bendPositive": c.get("bendPositive", True)}
                         for c in self.ik}

    def apply_animation(self, name, time):
        anim = self.data["animations"][name]
        for bone_name, timelines in anim.get("bones", {}).items():
            bone = self.bone_map.get(bone_name)
            if not bone:
                continue
            for tl, frames in timelines.items():
                vals = sample(frames, time, tl)
                if vals is None:
                    continue
                if tl == "rotate":
                    bone.rotation = bone.data.get("rotation", 0.0) + vals["angle"]
                elif tl == "translate":
                    bone.x = bone.data.get("x", 0.0) + vals["x"]
                    bone.y = bone.data.get("y", 0.0) + vals["y"]
                elif tl == "scale":
                    bone.scaleX = bone.data.get("scaleX", 1.0) * vals["x"]
                    bone.scaleY = bone.data.get("scaleY", 1.0) * vals["y"]
                elif tl == "shear":
                    bone.shearX = bone.data.get("shearX", 0.0) + vals["x"]
                    bone.shearY = bone.data.get("shearY", 0.0) + vals["y"]
        for slot_name, timelines in anim.get("slots", {}).items():
            slot = self.slot_map.get(slot_name)
            if not slot:
                continue
            for tl, frames in timelines.items():
                if tl == "attachment":
                    cur = None
                    for f in frames:
                        if f.get("time", 0) <= time + 1e-6:
                            cur = f.get("name")
                        else:
                            break
                    if cur is not None or any(f.get("time", 0) <= time + 1e-6 for f in frames):
                        slot["attachment"] = cur
                elif tl == "color":
                    vals = sample(frames, time, "color")
                    if vals:
                        slot["color"] = vals["color"]
        do = anim.get("drawOrder") or anim.get("draworder")
        if do:
            cur = None
            for f in do:
                if f.get("time", 0) <= time + 1e-6:
                    cur = f
                else:
                    break
            if cur is not None:
                order = list(range(len(self.slots)))
                offsets = cur.get("offsets", [])
                if offsets:
                    unchanged = []
                    order = [None] * len(self.slots)
                    taken = set()
                    for off in offsets:
                        si = self.slot_map[off["slot"]]["index"]
                        i = 0
                        while i < len(self.slots) and self.slots[i]["index"] != si:
                            i += 1
                        # collect unchanged before
                        pass
                    # simple approach: apply offsets to a list
                    order = list(range(len(self.slots)))
                    for off in offsets:
                        si = self.slot_map[off["slot"]]["index"]
                        order.remove(si)
                        order.insert(min(max(si + off["offset"], 0), len(order)), si)
                self.draw_order = order

    def update_world(self):
        for b in self.bones:
            b.update_world()
        for c in self.ik:
            self.apply_ik(c)

    def apply_ik(self, c):
        st = getattr(self, "ik_state", {}).get(c["name"], {})
        mix = st.get("mix", c.get("mix", 1.0))
        if mix <= 0:
            return
        bend = 1 if st.get("bendPositive", c.get("bendPositive", True)) else -1
        target = self.bone_map[c["target"]]
        bones = [self.bone_map[b] for b in c["bones"]]
        if len(bones) == 1:
            ik1(bones[0], target.worldX, target.worldY, mix)
            for ch in bones[0].children:
                update_subtree(ch)
        elif len(bones) == 2:
            ik2(bones[0], bones[1], target.worldX, target.worldY, bend, mix,
                c.get("softness", 0.0))
            for ch in bones[1].children:
                update_subtree(ch)

    def region_for(self, path):
        for p in self.pages:
            if path in p["regions"]:
                return p, p["regions"][path]
        return None, None

    def region_image(self, page, reg, rot_mode):
        key = (page["name"], id(reg), rot_mode)
        cache = getattr(self, "_imgcache", None)
        if cache is None:
            cache = self._imgcache = {}
        if key in cache:
            return cache[key]
        img = self.images[page["name"]]
        x, y = reg["xy"]
        w, h = reg["size"]
        if reg["rotate"]:
            sub = img.crop((x, y, x + h, y + w)).transpose(rot_mode)
        else:
            sub = img.crop((x, y, x + w, y + h))
        cache[key] = sub
        return sub

    def visible_quads(self):
        out = []
        for si in self.draw_order:
            slot = self.slots[si]
            att_name = slot["attachment"]
            if not att_name:
                continue
            att = self.skin.get(slot["data"]["name"], {}).get(att_name)
            if att is None or att.get("type", "region") not in ("region", "mesh"):
                continue
            page, reg = self.region_for(att.get("path", att_name))
            if reg is None:
                continue
            out.append((slot, att, page, reg))
        return out

    def render(self, pad=8, scale=1.0, rot_mode=Image.ROTATE_270,
               bounds=None):
        quads = self.visible_quads()
        if not quads:
            raise RuntimeError("nothing to draw")
        polys = []
        for slot, att, page, reg in quads:
            if att.get("type", "region") == "mesh":
                polys.append(mesh_points(self, slot, att))
            else:
                polys.append(quad_points(slot["bone"], att, reg))
        if bounds is None:
            xs = [p[0] for poly in polys for p in poly]
            ys = [p[1] for poly in polys for p in poly]
            bounds = (min(xs), min(ys), max(xs), max(ys))
        minx, miny, maxx, maxy = bounds
        W = int(math.ceil((maxx - minx) * scale)) + pad * 2
        H = int(math.ceil((maxy - miny) * scale)) + pad * 2
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        for (slot, att, page, reg), poly in zip(quads, polys):
            if att.get("type", "region") == "mesh":
                layer = draw_mesh(self, slot, att, page, reg, poly, minx, maxy,
                                  scale, pad, W, H, rot_mode)
                if layer is not None:
                    canvas.alpha_composite(layer)
                continue
            sub = self.region_image(page, reg, rot_mode)
            dst = [((px - minx) * scale + pad, (maxy - py) * scale + pad) for (px, py) in poly]
            # poly order: bl, tl, tr, br (y-up) -> after flip: bottom-left, top-left, top-right, bottom-right
            try:
                coeffs = perspective_coeffs([dst[1], dst[2], dst[3], dst[0]], sub.size)
            except Exception:
                continue
            layer = sub.transform((W, H), Image.PERSPECTIVE, coeffs, resample=Image.BICUBIC)
            col = slot["color"]
            if col and col.lower() != "ffffffff":
                r = int(col[0:2], 16) / 255.0
                g = int(col[2:4], 16) / 255.0
                b = int(col[4:6], 16) / 255.0
                a = int(col[6:8], 16) / 255.0
                if a < 0.999:
                    layer = tint(layer, r, g, b, a)
                elif min(r, g, b) < 0.999:
                    layer = tint(layer, r, g, b, 1.0)
            canvas.alpha_composite(layer)
        return canvas, bounds


def tint(img, r, g, b, a):
    src = img.split()
    from PIL import ImageMath
    def mul(ch, f):
        return ch.point(lambda v: int(v * f))
    return Image.merge("RGBA", (mul(src[0], r), mul(src[1], g), mul(src[2], b), mul(src[3], a)))


def perspective_coeffs(dst_quad, size):
    """Return coeffs mapping output->input for Image.PERSPECTIVE.
    dst_quad = [top-left, top-right, bottom-right, bottom-left] in output space."""
    w, h = size
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    import numpy as np
    A = []
    B = []
    for (dx, dy), (sx, sy) in zip(dst_quad, src):
        A.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        B.append(sx)
        A.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
        B.append(sy)
    A = np.array(A, dtype=float)
    B = np.array(B, dtype=float)
    res = np.linalg.solve(A, B)
    return tuple(res)


def quad_points(bone, att, reg):
    """Attachment quad in world space, matching Spine RegionAttachment.updateOffset."""
    aw = att.get("width", 0.0)
    ah = att.get("height", 0.0)
    asx = att.get("scaleX", 1.0)
    asy = att.get("scaleY", 1.0)
    ow, oh = reg["orig"]
    rw, rh = reg["size"]
    ofx, ofy = reg["offset"]
    rsx = aw / ow * asx if ow else asx
    rsy = ah / oh * asy if oh else asy
    lx = -aw / 2.0 * asx + ofx * rsx
    ly = -ah / 2.0 * asy + ofy * rsy
    lx2 = lx + rw * rsx
    ly2 = ly + rh * rsy
    ox = att.get("x", 0.0)
    oy = att.get("y", 0.0)
    rot = att.get("rotation", 0.0) * DEG
    cos, sin = math.cos(rot), math.sin(rot)
    out = []
    for cxp, cyp in ((lx, ly), (lx, ly2), (lx2, ly2), (lx2, ly)):
        px = cxp * cos - cyp * sin + ox
        py = cxp * sin + cyp * cos + oy
        out.append((bone.a * px + bone.b * py + bone.worldX,
                    bone.c * px + bone.d * py + bone.worldY))
    return out


def sample(frames, time, kind):
    if not frames:
        return None
    def get(f):
        if kind == "rotate":
            return {"angle": f.get("angle", 0.0)}
        if kind == "color":
            return {"color": f.get("color", "ffffffff")}
        default = 1.0 if kind == "scale" else 0.0
        return {"x": f.get("x", default), "y": f.get("y", default)}
    if time <= frames[0].get("time", 0):
        return get(frames[0])
    if time >= frames[-1].get("time", 0):
        return get(frames[-1])
    for i in range(len(frames) - 1):
        t0 = frames[i].get("time", 0)
        t1 = frames[i + 1].get("time", 0)
        if t0 <= time <= t1:
            a = (time - t0) / (t1 - t0) if t1 > t0 else 0.0
            curve = frames[i].get("curve")
            if curve == "stepped":
                return get(frames[i])
            if isinstance(curve, list) and len(curve) == 4:
                a = bezier(curve, a)
            v0, v1 = get(frames[i]), get(frames[i + 1])
            if kind == "color":
                return {"color": v0["color"] if a < 0.5 else v1["color"]}
            if kind == "rotate":
                d = v1["angle"] - v0["angle"]
                d = (d + 180) % 360 - 180
                return {"angle": v0["angle"] + d * a}
            return {"x": v0["x"] + (v1["x"] - v0["x"]) * a,
                    "y": v0["y"] + (v1["y"] - v0["y"]) * a}
    return get(frames[-1])


def bezier(curve, t):
    cx1, cy1, cx2, cy2 = curve
    # approximate: solve for t given x
    lo, hi = 0.0, 1.0
    for _ in range(20):
        m = (lo + hi) / 2
        x = 3 * cx1 * m * (1 - m) ** 2 + 3 * cx2 * m ** 2 * (1 - m) + m ** 3
        if x < t:
            lo = m
        else:
            hi = m
    m = (lo + hi) / 2
    return 3 * cy1 * m * (1 - m) ** 2 + 3 * cy2 * m ** 2 * (1 - m) + m ** 3


def update_subtree(bone):
    bone.update_world()
    for c in bone.children:
        update_subtree(c)


def ik1(bone, tx, ty, alpha):
    p = bone.parent
    if p is None:
        rot_ik = math.atan2(ty - bone.worldY, tx - bone.worldX) / DEG
    else:
        pa, pb, pc, pd = p.a, p.b, p.c, p.d
        det = pa * pd - pb * pc
        if abs(det) < 1e-9:
            return
        x = tx - p.worldX
        y = ty - p.worldY
        lx = (x * pd - y * pb) / det - bone.x
        ly = (y * pa - x * pc) / det - bone.y
        rot_ik = math.atan2(ly, lx) / DEG - bone.shearX - bone.data.get("rotation", 0)
        rot_ik += bone.data.get("rotation", 0)
        rot_ik = math.atan2(ly, lx) / DEG - bone.shearX
    if bone.scaleX < 0:
        rot_ik += 180
    d = rot_ik - bone.rotation
    d = (d + 180) % 360 - 180
    bone.rotation += d * alpha
    bone.update_world()


def ik2(parent, child, tx, ty, bend_dir, alpha, softness=0.0):
    px, py = parent.x, parent.y
    psx, psy = parent.scaleX, parent.scaleY
    csx = child.scaleX
    offset1 = offset2 = sign2 = 0
    if psx < 0:
        psx = -psx
        offset1 = 180
        sign2 = -1
    else:
        offset1 = 0
        sign2 = 1
    if psy < 0:
        psy = -psy
        sign2 = -sign2
    if csx < 0:
        csx = -csx
        offset2 = 180
    else:
        offset2 = 0
    pp = parent.parent
    a = child.x
    b = child.y
    if pp is None:
        ttx, tty = tx - parent.worldX, ty - parent.worldY
    else:
        pa, pb, pc, pd = pp.a, pp.b, pp.c, pp.d
        det = pa * pd - pb * pc
        if abs(det) < 1e-9:
            return
        dx = tx - pp.worldX
        dy = ty - pp.worldY
        tlx = (dx * pd - dy * pb) / det - px
        tly = (dy * pa - dx * pc) / det - py
        ttx, tty = tlx, tly
    # child tip in parent space
    cx = child.worldX - parent.worldX
    cy = child.worldY - parent.worldY
    ppa, ppb, ppc, ppd = parent.a, parent.b, parent.c, parent.d
    det = ppa * ppd - ppb * ppc
    if abs(det) < 1e-9:
        return
    id_ = 1.0 / det
    ax = (cx * ppd - cy * ppb) * id_
    ay = (cy * ppa - cx * ppc) * id_
    l1 = math.hypot(ax, ay)
    l2 = child.data.get("length", 0) * csx
    if l1 < 1e-6 or l2 < 1e-6:
        ik1(parent, tx, ty, alpha)
        child.update_world()
        return
    ta2 = tty
    ta1 = ttx
    ll1 = l1
    ll2 = l2
    dd = ta1 * ta1 + ta2 * ta2
    dist = math.sqrt(dd)
    a1 = a2 = 0.0
    if dist < 1e-9:
        return
    if dist > ll1 + ll2:
        a2 = 0.0
        a1 = math.atan2(ta2, ta1)
    elif dist < abs(ll1 - ll2):
        a2 = math.pi
        a1 = math.atan2(ta2, ta1)
    else:
        cosv = (dd - ll1 * ll1 - ll2 * ll2) / (2 * ll1 * ll2)
        cosv = max(-1.0, min(1.0, cosv))
        a2 = math.acos(cosv) * bend_dir
        adj = ll1 + ll2 * cosv
        opp = ll2 * math.sin(a2)
        a1 = math.atan2(ta2 * adj - ta1 * opp, ta1 * adj + ta2 * opp)
    os_ = math.atan2(ay, ax) * sign2
    rot = (a1 - os_) / DEG + offset1
    d = rot - parent.rotation
    d = (d + 180) % 360 - 180
    parent.rotation += d * alpha
    rot2 = (a2 + os_) / DEG * sign2 + offset2
    d2 = rot2 - child.rotation
    d2 = (d2 + 180) % 360 - 180
    child.rotation += d2 * alpha
    parent.update_world()
    child.update_world()


# ---------------- mesh support ----------------

def original_region_image(sk, page, reg, rot_mode):
    """Trimmed region pasted back into its original untrimmed rect."""
    key = ("orig", page["name"], id(reg), rot_mode)
    cache = getattr(sk, "_imgcache", None)
    if cache is None:
        cache = sk._imgcache = {}
    if key in cache:
        return cache[key]
    sub = sk.region_image(page, reg, rot_mode)
    ow, oh = reg["orig"]
    rw, rh = reg["size"]
    ofx, ofy = reg["offset"]
    if (ow, oh) == (rw, rh) and (ofx, ofy) == (0, 0):
        cache[key] = sub
        return sub
    full = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
    top = oh - ofy - rh
    full.paste(sub, (ofx, top))
    cache[key] = full
    return full


def mesh_vertex_count(att):
    return len(att["uvs"]) // 2


def mesh_world_vertices(sk, slot, att):
    vc = mesh_vertex_count(att)
    verts = att["vertices"]
    bone = slot["bone"]
    out = []
    if len(verts) == vc * 2:
        for i in range(vc):
            x, y = verts[i * 2], verts[i * 2 + 1]
            out.append((bone.a * x + bone.b * y + bone.worldX,
                        bone.c * x + bone.d * y + bone.worldY))
        return out
    i = 0
    bones = sk.bones
    for _ in range(vc):
        n = int(verts[i]); i += 1
        wx = wy = 0.0
        for _ in range(n):
            bi = int(verts[i]); vx = verts[i + 1]; vy = verts[i + 2]
            w = verts[i + 3]
            i += 4
            b = bones[bi]
            wx += (b.a * vx + b.b * vy + b.worldX) * w
            wy += (b.c * vx + b.d * vy + b.worldY) * w
        out.append((wx, wy))
    return out


def mesh_points(sk, slot, att):
    return mesh_world_vertices(sk, slot, att)


def draw_mesh(sk, slot, att, page, reg, world, minx, maxy, scale, pad, W, H,
              rot_mode):
    from PIL import ImageDraw
    src_img = original_region_image(sk, page, reg, rot_mode)
    ow, oh = src_img.size
    uvs = att["uvs"]
    tris = att["triangles"]
    dst = [((px - minx) * scale + pad, (maxy - py) * scale + pad) for px, py in world]
    src = [(uvs[i * 2] * ow, uvs[i * 2 + 1] * oh) for i in range(len(world))]
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for t in range(0, len(tris) - 2, 3):
        i0, i1, i2 = tris[t], tris[t + 1], tris[t + 2]
        d = [dst[i0], dst[i1], dst[i2]]
        s = [src[i0], src[i1], src[i2]]
        xs = [p[0] for p in d]
        ys = [p[1] for p in d]
        x0 = int(math.floor(min(xs))) - 1
        y0 = int(math.floor(min(ys))) - 1
        x1 = int(math.ceil(max(xs))) + 1
        y1 = int(math.ceil(max(ys))) + 1
        x0 = max(0, x0); y0 = max(0, y0)
        x1 = min(W, x1); y1 = min(H, y1)
        if x1 <= x0 or y1 <= y0:
            continue
        coeffs = affine_coeffs([(p[0] - x0, p[1] - y0) for p in d], s)
        if coeffs is None:
            continue
        tile = src_img.transform((x1 - x0, y1 - y0), Image.AFFINE, coeffs,
                                 resample=Image.BILINEAR)
        mask = Image.new("L", (x1 - x0, y1 - y0), 0)
        ImageDraw.Draw(mask).polygon(
            [(p[0] - x0, p[1] - y0) for p in expand_tri(d)], fill=255)
        tile.putalpha(Image.composite(tile.getchannel("A"), mask.point(lambda v: 0), mask))
        layer.alpha_composite(tile, (x0, y0))
    col = slot["color"]
    if col and col.lower() != "ffffffff":
        r = int(col[0:2], 16) / 255.0
        g = int(col[2:4], 16) / 255.0
        b = int(col[4:6], 16) / 255.0
        a = int(col[6:8], 16) / 255.0
        layer = tint(layer, r, g, b, a)
    return layer


def expand_tri(d, amount=0.6):
    cx = sum(p[0] for p in d) / 3.0
    cy = sum(p[1] for p in d) / 3.0
    out = []
    for x, y in d:
        dx, dy = x - cx, y - cy
        n = math.hypot(dx, dy)
        if n < 1e-6:
            out.append((x, y))
        else:
            out.append((x + dx / n * amount, y + dy / n * amount))
    return out


def affine_coeffs(dst_tri, src_tri):
    """Coeffs (a,b,c,d,e,f) mapping output (x,y) -> input via src = M*dst."""
    import numpy as np
    A = np.array([[dst_tri[0][0], dst_tri[0][1], 1],
                  [dst_tri[1][0], dst_tri[1][1], 1],
                  [dst_tri[2][0], dst_tri[2][1], 1]], dtype=float)
    if abs(np.linalg.det(A)) < 1e-9:
        return None
    bx = np.array([src_tri[0][0], src_tri[1][0], src_tri[2][0]], dtype=float)
    by = np.array([src_tri[0][1], src_tri[1][1], src_tri[2][1]], dtype=float)
    try:
        cx = np.linalg.solve(A, bx)
        cy = np.linalg.solve(A, by)
    except Exception:
        return None
    return (cx[0], cx[1], cx[2], cy[0], cy[1], cy[2])
