"""Spine 3.8 binary .skel reader -> JSON-equivalent dict."""
import struct

TRANSFORM_MODES = ["normal", "onlyTranslation", "noRotationOrReflection",
                   "noScale", "noScaleOrReflection"]
ATTACHMENT_TYPES = ["region", "boundingbox", "mesh", "linkedmesh", "path",
                    "point", "clipping"]
BLEND_MODES = ["normal", "additive", "multiply", "screen"]


class Reader:
    def __init__(self, buf):
        self.b = buf
        self.p = 0
        self.strings = []

    def byte(self):
        v = self.b[self.p]
        self.p += 1
        return v

    def sbyte(self):
        v = self.byte()
        return v - 256 if v > 127 else v

    def boolean(self):
        return self.byte() != 0

    def int32(self):
        v = struct.unpack_from(">i", self.b, self.p)[0]
        self.p += 4
        return v

    def uint32(self):
        v = struct.unpack_from(">I", self.b, self.p)[0]
        self.p += 4
        return v

    def float(self):
        v = struct.unpack_from(">f", self.b, self.p)[0]
        self.p += 4
        return v

    def varint(self, optimize_positive=True):
        b = self.byte()
        result = b & 0x7F
        if b & 0x80:
            b = self.byte()
            result |= (b & 0x7F) << 7
            if b & 0x80:
                b = self.byte()
                result |= (b & 0x7F) << 14
                if b & 0x80:
                    b = self.byte()
                    result |= (b & 0x7F) << 21
                    if b & 0x80:
                        b = self.byte()
                        result |= (b & 0x7F) << 28
        result &= 0xFFFFFFFF
        if optimize_positive:
            return result
        return (result >> 1) ^ -(result & 1)

    def string(self):
        n = self.varint()
        if n == 0:
            return None
        if n == 1:
            return ""
        n -= 1
        s = self.b[self.p:self.p + n].decode("utf-8")
        self.p += n
        return s

    def string_ref(self):
        i = self.varint()
        return None if i == 0 else self.strings[i - 1]

    def color(self):
        v = self.uint32()
        return "%08x" % v

    def float_array(self, n):
        out = struct.unpack_from(">%df" % n, self.b, self.p)
        self.p += 4 * n
        return list(out)

    def short_array(self):
        n = self.varint()
        out = struct.unpack_from(">%dh" % n, self.b, self.p)
        self.p += 2 * n
        return list(out)

    def vertices(self, vertex_count):
        """Returns JSON-compatible vertices array (positions, or weighted encoding)."""
        weighted = self.boolean()
        if not weighted:
            return self.float_array(vertex_count << 1)
        out = []
        for _ in range(vertex_count):
            bone_count = self.varint()
            out.append(float(bone_count))
            for _ in range(bone_count):
                out.append(float(self.varint()))
                out.append(self.float())
                out.append(self.float())
                out.append(self.float())
        return out


def read_skel(path):
    r = Reader(open(path, "rb").read())
    data = {}
    skel = {}
    skel["hash"] = r.string()
    skel["spine"] = r.string()
    skel["x"] = r.float()
    skel["y"] = r.float()
    skel["width"] = r.float()
    skel["height"] = r.float()
    nonessential = r.boolean()
    if nonessential:
        skel["fps"] = r.float()
        skel["images"] = r.string()
        skel["audio"] = r.string()
    data["skeleton"] = skel

    n = r.varint()
    r.strings = [r.string() for _ in range(n)]

    # bones
    bones = []
    for i in range(r.varint()):
        bd = {"name": r.string()}
        if i > 0:
            bd["parent"] = bones[r.varint()]["name"]
        bd["rotation"] = r.float()
        bd["x"] = r.float()
        bd["y"] = r.float()
        bd["scaleX"] = r.float()
        bd["scaleY"] = r.float()
        bd["shearX"] = r.float()
        bd["shearY"] = r.float()
        bd["length"] = r.float()
        bd["transform"] = TRANSFORM_MODES[r.varint()]
        bd["skinRequired"] = r.boolean()
        if nonessential:
            r.uint32()
        bones.append(bd)
    data["bones"] = bones

    # slots
    slots = []
    for i in range(r.varint()):
        sd = {"name": r.string()}
        sd["bone"] = bones[r.varint()]["name"]
        sd["color"] = r.color()
        dark = r.uint32()
        if dark != 0xFFFFFFFF:
            sd["dark"] = "%06x" % (dark & 0xFFFFFF)
        att = r.string_ref()
        if att is not None:
            sd["attachment"] = att
        bm = r.varint()
        if bm:
            sd["blend"] = BLEND_MODES[bm]
        slots.append(sd)
    data["slots"] = slots

    # ik
    iks = []
    for _ in range(r.varint()):
        c = {"name": r.string()}
        c["order"] = r.varint()
        c["skinRequired"] = r.boolean()
        c["bones"] = [bones[r.varint()]["name"] for _ in range(r.varint())]
        c["target"] = bones[r.varint()]["name"]
        c["mix"] = r.float()
        c["softness"] = r.float()
        c["bendPositive"] = r.sbyte() > 0
        c["compress"] = r.boolean()
        c["stretch"] = r.boolean()
        c["uniform"] = r.boolean()
        iks.append(c)
    data["ik"] = iks

    # transform constraints
    transforms = []
    for _ in range(r.varint()):
        c = {"name": r.string()}
        c["order"] = r.varint()
        c["skinRequired"] = r.boolean()
        c["bones"] = [bones[r.varint()]["name"] for _ in range(r.varint())]
        c["target"] = bones[r.varint()]["name"]
        c["local"] = r.boolean()
        c["relative"] = r.boolean()
        c["rotation"] = r.float()
        c["x"] = r.float()
        c["y"] = r.float()
        c["scaleX"] = r.float()
        c["scaleY"] = r.float()
        c["shearY"] = r.float()
        c["rotateMix"] = r.float()
        c["translateMix"] = r.float()
        c["scaleMix"] = r.float()
        c["shearMix"] = r.float()
        transforms.append(c)
    data["transform"] = transforms

    # path constraints
    paths = []
    for _ in range(r.varint()):
        c = {"name": r.string()}
        c["order"] = r.varint()
        c["skinRequired"] = r.boolean()
        c["bones"] = [bones[r.varint()]["name"] for _ in range(r.varint())]
        c["target"] = slots[r.varint()]["name"]
        c["positionMode"] = r.varint()
        c["spacingMode"] = r.varint()
        c["rotateMode"] = r.varint()
        c["rotation"] = r.float()
        c["position"] = r.float()
        c["spacing"] = r.float()
        c["rotateMix"] = r.float()
        c["translateMix"] = r.float()
        paths.append(c)
    data["path"] = paths

    linked = []

    def read_attachment(slot_index, attachment_name):
        name = r.string_ref() or attachment_name
        atype = ATTACHMENT_TYPES[r.byte()]
        if atype == "region":
            path = r.string_ref()
            att = {"type": "region"}
            if path:
                att["path"] = path
            att["rotation"] = r.float()
            att["x"] = r.float()
            att["y"] = r.float()
            att["scaleX"] = r.float()
            att["scaleY"] = r.float()
            att["width"] = r.float()
            att["height"] = r.float()
            att["color"] = r.color()
            return name, att
        if atype == "boundingbox":
            vc = r.varint()
            r.vertices(vc)
            if nonessential:
                r.uint32()
            return name, {"type": "boundingbox"}
        if atype == "mesh":
            path = r.string_ref()
            col = r.color()
            vc = r.varint()
            uvs = r.float_array(vc << 1)
            tris = r.short_array()
            verts = r.vertices(vc)
            hull = r.varint()
            w = h = 0
            if nonessential:
                r.short_array()
                w = r.float()
                h = r.float()
            return name, {"type": "mesh", "path": path or name, "color": col,
                          "uvs": uvs, "triangles": tris, "vertices": verts,
                          "hull": hull, "width": w, "height": h}
        if atype == "linkedmesh":
            path = r.string_ref()
            col = r.color()
            skin_name = r.string_ref()
            parent = r.string_ref()
            deform = r.boolean()
            w = h = 0
            if nonessential:
                w = r.float()
                h = r.float()
            return name, {"type": "linkedmesh", "path": path or name,
                          "skin": skin_name, "parent": parent,
                          "deform": deform, "width": w, "height": h}
        if atype == "path":
            r.boolean()
            r.boolean()
            vc = r.varint()
            r.vertices(vc)
            r.float_array(vc // 3)
            if nonessential:
                r.uint32()
            return name, {"type": "path"}
        if atype == "point":
            rot = r.float()
            x = r.float()
            y = r.float()
            if nonessential:
                r.uint32()
            return name, {"type": "point", "rotation": rot, "x": x, "y": y}
        if atype == "clipping":
            r.varint()
            vc = r.varint()
            r.vertices(vc)
            if nonessential:
                r.uint32()
            return name, {"type": "clipping"}
        raise ValueError("unknown attachment type " + atype)

    def read_skin(default_skin):
        if default_skin:
            slot_count = r.varint()
            if slot_count == 0:
                return None
            skin = {"name": "default", "attachments": {}}
        else:
            skin = {"name": r.string_ref(), "attachments": {}}
            for _ in range(r.varint()):
                r.varint()
            for _ in range(r.varint()):
                r.varint()
            for _ in range(r.varint()):
                r.varint()
            for _ in range(r.varint()):
                r.varint()
            slot_count = r.varint()
        for _ in range(slot_count):
            si = r.varint()
            slot_name = slots[si]["name"]
            bucket = skin["attachments"].setdefault(slot_name, {})
            for _ in range(r.varint()):
                aname = r.string_ref()
                key, att = read_attachment(si, aname)
                bucket[aname] = att
        return skin

    skins = []
    d = read_skin(True)
    if d:
        skins.append(d)
    for _ in range(r.varint()):
        skins.append(read_skin(False))
    data["skins"] = skins

    # events
    events = {}
    for _ in range(r.varint()):
        ename = r.string_ref()
        ev = {"int": r.varint(False), "float": r.float(), "string": r.string()}
        audio = r.string()
        if audio is not None:
            ev["audio"] = audio
            ev["volume"] = r.float()
            ev["balance"] = r.float()
        events[ename] = ev
    data["events"] = events

    # animations
    anims = {}
    for _ in range(r.varint()):
        aname = r.string()
        anims[aname] = read_animation(r, bones, slots, iks, transforms, paths,
                                      skins, events)
    data["animations"] = anims
    return data


def curve(r):
    t = r.byte()
    if t == 1:
        return "stepped"
    if t == 2:
        return [r.float(), r.float(), r.float(), r.float()]
    return None


def read_animation(r, bones, slots, iks, transforms, paths, skins, events):
    anim = {}
    # slot timelines
    slot_tl = {}
    for _ in range(r.varint()):
        slot_name = slots[r.varint()]["name"]
        bucket = slot_tl.setdefault(slot_name, {})
        for _ in range(r.varint()):
            ttype = r.byte()
            fc = r.varint()
            if ttype == 0:  # attachment
                frames = []
                for _ in range(fc):
                    frames.append({"time": r.float(), "name": r.string_ref()})
                bucket["attachment"] = frames
            elif ttype == 1:  # color
                frames = []
                for f in range(fc):
                    fr = {"time": r.float(), "color": r.color()}
                    if f < fc - 1:
                        c = curve(r)
                        if c is not None:
                            fr["curve"] = c
                    frames.append(fr)
                bucket["color"] = frames
            elif ttype == 2:  # two color
                frames = []
                for f in range(fc):
                    fr = {"time": r.float(), "light": r.color(),
                          "dark": "%06x" % (r.uint32() >> 8)}
                    if f < fc - 1:
                        c = curve(r)
                        if c is not None:
                            fr["curve"] = c
                    frames.append(fr)
                bucket["twoColor"] = frames
            else:
                raise ValueError("slot timeline %d" % ttype)
    if slot_tl:
        anim["slots"] = slot_tl

    # bone timelines
    bone_tl = {}
    for _ in range(r.varint()):
        bone_name = bones[r.varint()]["name"]
        bucket = bone_tl.setdefault(bone_name, {})
        for _ in range(r.varint()):
            ttype = r.byte()
            fc = r.varint()
            if ttype == 0:  # rotate
                frames = []
                for f in range(fc):
                    fr = {"time": r.float(), "angle": r.float()}
                    if f < fc - 1:
                        c = curve(r)
                        if c is not None:
                            fr["curve"] = c
                    frames.append(fr)
                bucket["rotate"] = frames
            elif ttype in (1, 2, 3):
                key = {1: "translate", 2: "scale", 3: "shear"}[ttype]
                frames = []
                for f in range(fc):
                    fr = {"time": r.float(), "x": r.float(), "y": r.float()}
                    if f < fc - 1:
                        c = curve(r)
                        if c is not None:
                            fr["curve"] = c
                    frames.append(fr)
                bucket[key] = frames
            else:
                raise ValueError("bone timeline %d" % ttype)
    if bone_tl:
        anim["bones"] = bone_tl

    # ik timelines
    ik_tl = {}
    for _ in range(r.varint()):
        name = iks[r.varint()]["name"]
        fc = r.varint()
        frames = []
        for f in range(fc):
            fr = {"time": r.float(), "mix": r.float(), "softness": r.float(),
                  "bendPositive": r.sbyte() > 0, "compress": r.boolean(),
                  "stretch": r.boolean()}
            if f < fc - 1:
                c = curve(r)
                if c is not None:
                    fr["curve"] = c
            frames.append(fr)
        ik_tl[name] = frames
    if ik_tl:
        anim["ik"] = ik_tl

    # transform constraint timelines
    tr_tl = {}
    for _ in range(r.varint()):
        name = transforms[r.varint()]["name"]
        fc = r.varint()
        frames = []
        for f in range(fc):
            fr = {"time": r.float(), "rotateMix": r.float(),
                  "translateMix": r.float(), "scaleMix": r.float(),
                  "shearMix": r.float()}
            if f < fc - 1:
                c = curve(r)
                if c is not None:
                    fr["curve"] = c
            frames.append(fr)
        tr_tl[name] = frames
    if tr_tl:
        anim["transform"] = tr_tl

    # path constraint timelines
    for _ in range(r.varint()):
        r.varint()
        for _ in range(r.varint()):
            ttype = r.byte()
            fc = r.varint()
            for f in range(fc):
                r.float()
                r.float()
                if ttype == 2:
                    r.float()
                if f < fc - 1:
                    curve(r)

    # deform timelines
    for _ in range(r.varint()):       # skins
        skin_index = r.varint()
        skin_atts = skins[skin_index]["attachments"] if skin_index < len(skins) else {}
        for _ in range(r.varint()):   # slots
            slot_index = r.varint()
            slot_name = slots[slot_index]["name"]
            for _ in range(r.varint()):  # attachments
                att_name = r.string_ref()
                att = skin_atts.get(slot_name, {}).get(att_name, {})
                verts = att.get("vertices", [])
                uvs = att.get("uvs", [])
                weighted = len(verts) != len(uvs)
                deform_length = (len(verts) // 3 * 2) if weighted else len(verts)
                fc = r.varint()
                for f in range(fc):
                    r.float()
                    end = r.varint()
                    if end:
                        r.varint()
                        r.float_array(end)
                    if f < fc - 1:
                        curve(r)
                del deform_length

    # draw order
    do = []
    for _ in range(r.varint()):
        t = r.float()
        offsets = []
        for _ in range(r.varint()):
            si = r.varint()
            offsets.append({"slot": slots[si]["name"], "offset": r.varint()})
        do.append({"time": t, "offsets": offsets})
    if do:
        anim["drawOrder"] = do

    # events
    ev_list = []
    ev_names = list(events.keys())
    for _ in range(r.varint()):
        t = r.float()
        ename = ev_names[r.varint()]
        e = {"time": t, "name": ename, "int": r.varint(False), "float": r.float()}
        if r.boolean():
            e["string"] = r.string()
        if events[ename].get("audio") is not None:
            e["volume"] = r.float()
            e["balance"] = r.float()
        ev_list.append(e)
    if ev_list:
        anim["events"] = ev_list
    return anim
