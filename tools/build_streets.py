"""Build the street safety model.

Inputs : OpenFreeMap vector tiles (street network + venues), NYPD complaint records.
Output : a walkable street graph for Manhattan with a per-band level for every edge.

Run with PYTHONPATH pointing at the vendored libs. Usage: build_streets.py <geo dir> <out pickle>
"""
import sys, glob, gzip, json, math, pickle, collections
import mapbox_vector_tile as mvt
from shapely.geometry import LineString, MultiLineString, Point, Polygon, box, shape
from shapely.ops import unary_union, linemerge
from shapely.strtree import STRtree

GEO, OUT = sys.argv[1], sys.argv[2]
LAT0, LNG0 = 40.75, -73.99
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110540
to_m = lambda lng, lat: ((lng - LNG0) * KX, (lat - LAT0) * KY)
to_ll = lambda x, y: (x / KX + LNG0, y / KY + LAT0)
HOTEL = to_m(-73.9984, 40.7558)

# Manhattan's street grid as coordinates (same model as the app): g(avenue, street) -> metres
def g(ave, st):
    lat = 40.7524 + (ave - 8) * 0.00122 + (st - 34) * 0.000633
    lng = -73.9933 - (ave - 8) * 0.0029 + (st - 34) * 0.000463
    return to_m(lng, lat)
def grid_rect(aw, ae, ss, sn): return Polygon([g(aw, ss), g(ae, ss), g(ae, sn), g(aw, sn)])
def inv_grid(x, y):  # metres -> (avenue, street), valid in the grid part of the island
    lng, lat = to_ll(x, y)
    a, b, c, d = 0.00122, 0.000633, -0.0029, 0.000463
    u, v = lat - 40.7524, lng + 73.9933
    det = a * d - b * c
    return 8 + (u * d - b * v) / det, 34 + (a * v - c * u) / det

# ---------------------------------------------------------------- tiles
ROAD = {"primary": 2, "secondary": 2, "tertiary": 2, "minor": 1}
EVENING = {"restaurant", "fast_food", "cafe", "bar", "beer", "lodging", "theatre", "cinema", "grocery", "pharmacy", "alcohol_shop", "ice_cream"}
LATE = {"bar", "beer", "lodging", "fast_food"}
roads, venues = [], []
for fn in sorted(glob.glob(GEO + "/tiles/*.pbf")):
    tx, ty = map(int, fn.split("/")[-1][:-4].split("_"))
    raw = open(fn, "rb").read()
    if raw[:2] == b"\x1f\x8b": raw = gzip.decompress(raw)
    t = mvt.decode(raw)
    n = 2 ** 14
    def ll(px, py, ext):
        wx, wy = (tx + px / ext) / n, (ty + 1 - py / ext) / n
        return wx * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * wy))))
    lay = t.get("transportation")
    if lay:
        ext = lay["extent"]; clip = box(0, 0, ext, ext)
        for f in lay["features"]:
            p = f["properties"]
            if p.get("class") not in ROAD or p.get("brunnel") or p.get("ramp"): continue
            geom = shape(f["geometry"]).intersection(clip)
            for part in getattr(geom, "geoms", [geom]):
                if part.geom_type != "LineString" or part.length == 0: continue
                pts = [to_m(*ll(x, y, ext)) for x, y in part.coords]
                roads.append((LineString(pts), ROAD[p["class"]]))
    lay = t.get("poi")
    if lay:
        ext = lay["extent"]
        for f in lay["features"]:
            c = f["properties"].get("class")
            if c in EVENING and f["geometry"]["type"] == "Point":
                x, y = f["geometry"]["coordinates"]
                if 0 <= x <= ext and 0 <= y <= ext: venues.append((to_m(*ll(x, y, ext)), c in LATE))
print("road pieces", len(roads), "venues", len(venues))

# ---------------------------------------------------------------- node the linework into a graph
rnd = lambda v: round(v * 2) / 2
snapped = [LineString([(rnd(x), rnd(y)) for x, y in ln.coords]) for ln, _ in roads]
snapped = [s for s in snapped if s.length > 0]
noded = unary_union(MultiLineString(snapped))
pieces = [p for p in getattr(noded, "geoms", [noded]) if p.length > 0.3]
print("noded pieces", len(pieces))

# cluster endpoints (tile seams leave ends a metre apart)
cell = {}
nodes = []  # representative coordinates
def node_id(pt):
    cx, cy = int(pt[0] // 3), int(pt[1] // 3)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for nid in cell.get((cx + dx, cy + dy), []):
                if math.hypot(nodes[nid][0] - pt[0], nodes[nid][1] - pt[1]) <= 2.5: return nid
    nodes.append(pt); cell.setdefault((cx, cy), []).append(len(nodes) - 1)
    return len(nodes) - 1
raw_edges = []
for p in pieces:
    cs = list(p.coords)
    a, b = node_id(cs[0]), node_id(cs[-1])
    if a != b: raw_edges.append([a, b, cs])

# merge chains through degree-2 nodes so every edge runs junction to junction
def contract(edges):
    adj = collections.defaultdict(list)
    for i, (a, b, _) in enumerate(edges): adj[a].append(i); adj[b].append(i)
    used, out = set(), []
    for i, (a, b, cs) in enumerate(edges):
        if i in used: continue
        used.add(i); chain = list(cs); ends = [a, b]
        for side in (1, 0):
            while True:
                nd = ends[side]
                if len(adj[nd]) != 2: break
                j = adj[nd][0] if adj[nd][1] in used else adj[nd][1]
                if j in used: break
                used.add(j); ja, jb, jcs = edges[j]
                seg = jcs if ja == nd else jcs[::-1]
                if side == 1: chain = chain + seg[1:]
                else: chain = seg[::-1][:-1] + chain
                ends[side] = jb if ja == nd else ja
        if ends[0] != ends[1]: out.append([ends[0], ends[1], chain])
    return out
edges = contract(raw_edges)
# drop short dead-end stubs, then contract again
deg = collections.Counter()
for a, b, _ in edges: deg[a] += 1; deg[b] += 1
edges = [e for e in edges if not (LineString(e[2]).length < 12 and (deg[e[0]] == 1 or deg[e[1]] == 1))]
edges = contract(edges)

# keep only what is reachable on foot from the hotel (drops Queens, Brooklyn, Roosevelt Island)
adjn = collections.defaultdict(set)
for a, b, _ in edges: adjn[a].add(b); adjn[b].add(a)
hotel_node = min(adjn, key=lambda i: math.hypot(nodes[i][0] - HOTEL[0], nodes[i][1] - HOTEL[1]))
seen, stack = {hotel_node}, [hotel_node]
while stack:
    for m in adjn[stack.pop()]:
        if m not in seen: seen.add(m); stack.append(m)
edges = [e for e in edges if e[0] in seen]
print("edges", len(edges), "junctions", len(seen))

lines = [LineString(e[2]) for e in edges]
length = [ln.length for ln in lines]
tree = STRtree(lines)
orig_tree = STRtree([r[0] for r in roads])
cls = [roads[orig_tree.nearest(ln.interpolate(0.5, normalized=True))][1] for ln in lines]

# ---------------------------------------------------------------- venues: how lively is each edge after dark
eve_act = [0.0] * len(edges); late_act = [0.0] * len(edges)
for (pt, is_late) in venues:
    P = Point(pt)
    for i in tree.query(P.buffer(60)):
        if lines[i].distance(P) <= 60:
            eve_act[i] += 1
            if is_late: late_act[i] += 1
per100 = lambda v, i: v / max(length[i], 60) * 100

# ---------------------------------------------------------------- incidents
W = {"ROBBERY": 3, "FELONY ASSAULT": 3, "RAPE": 3, "SEX CRIMES": 2.5, "ASSAULT 3 & RELATED OFFENSES": 2, "OFFENSES AGAINST THE PERSON": 1.5, "HARRASSMENT 2": 1}
BAND_HOURS = {"day": 10, "eve": 5, "late": 9}
def band(h): return "day" if 7 <= h <= 16 else "eve" if 17 <= h <= 21 else "late"
viol = {b: [0.0] * len(edges) for b in BAND_HOURS}; theft = {b: [0.0] * len(edges) for b in BAND_HOURS}
count = {b: [0.0] * len(edges) for b in BAND_HOURS}
inc_pts = []
rows = json.load(open(GEO + "/nypd.json")); placed = 0
# The NYPD records sex offences, and reports it cannot place, at the precinct station house.
# Those points say nothing about the street outside, so find them and leave them out.
sex_at = collections.Counter((r["latitude"], r["longitude"]) for r in rows if r.get("ofns_desc") in ("SEX CRIMES", "RAPE"))
stations = {k for k, n in sex_at.items() if n >= 3}
dropped = sum(1 for r in rows if (r["latitude"], r["longitude"]) in stations or r.get("ofns_desc") in ("SEX CRIMES", "RAPE"))
print("station-house points", len(stations), "records left out", dropped)
park_pts = []
for r in rows:
    if (r["latitude"], r["longitude"]) in stations or r.get("ofns_desc") in ("SEX CRIMES", "RAPE"): continue
    try: x, y = to_m(float(r["longitude"]), float(r["latitude"])); h = int(r["cmplnt_fr_tm"][:2])
    except Exception: continue
    if r.get("prem_typ_desc") != "STREET":   # recorded inside a park: belongs to the park, not to a street
        park_pts.append((x, y, band(h), "FROM PERSON" in (r.get("pd_desc") or ""))); continue
    P = Point(x, y); near = [(lines[i].distance(P), i) for i in tree.query(P.buffer(40))]
    near = [(d, i) for d, i in near if d <= 40]
    if not near: continue
    near.sort(); dmin = near[0][0]
    share = [i for d, i in near if d <= dmin + 8]  # an incident logged at a corner belongs to every street meeting there
    b = band(h); is_theft = "FROM PERSON" in (r.get("pd_desc") or "")
    w = (1.5 if is_theft else W.get(r.get("ofns_desc"), 1)) * (1.3 if r.get("vic_sex") == "F" else 1)
    for i in share:
        (theft if is_theft else viol)[b][i] += w / len(share)
        count[b][i] += 1 / len(share)
    inc_pts.append((x, y, b, is_theft)); placed += 1
print("incidents placed on streets", placed, "of", len(rows))

# rate per 100 m of street per hour of the band, then lightly smoothed along the street
by_node = collections.defaultdict(list)
for i, (a, b_, _) in enumerate(edges): by_node[a].append(i); by_node[b_].append(i)
def smooth(vals):
    out = []
    for i, (a, b_, _) in enumerate(edges):
        nb = [j for j in by_node[a] + by_node[b_] if j != i]
        m = sum(vals[j] for j in nb) / len(nb) if nb else vals[i]
        out.append(0.65 * vals[i] + 0.35 * m)
    return out
score = {}
for b, hrs in BAND_HOURS.items():
    v = smooth([per100(viol[b][i], i) / hrs for i in range(len(edges))])
    t = smooth([per100(theft[b][i], i) / hrs for i in range(len(edges))])
    score[b] = (v, t)

pickle.dump({"nodes": nodes, "edges": edges, "length": length, "cls": cls, "eve_act": eve_act, "late_act": late_act, "score": score, "count": count,
             "hotel_node": hotel_node, "inc_pts": inc_pts, "park_pts": park_pts}, open(OUT, "wb"))

# ---------------------------------------------------------------- diagnostics
def pct(vals, q):
    pairs = sorted(zip(vals, length)); tot = sum(length); acc = 0
    for v, l in pairs:
        acc += l
        if acc >= tot * q: return v
print("total street km", round(sum(length) / 1000, 1))
for b in BAND_HOURS:
    v, t = score[b]
    print(b, "violent pct 50/80/90/95/98:", [round(pct(v, q), 3) for q in (.5, .8, .9, .95, .98)], "theft 90/95/98:", [round(pct(t, q), 3) for q in (.9, .95, .98)])
def probe(name, ave, st):
    x, y = g(ave, st); P = Point(x, y)
    i = min(tree.query(P.buffer(120)), key=lambda k: lines[k].distance(P))
    print(f"  {name:34} len {length[i]:4.0f}m cls {cls[i]} venues {eve_act[i]:3.0f}/{late_act[i]:2.0f}  " + "  ".join(f"{b} v{score[b][0][i]:.2f} t{score[b][1][i]:.2f}" for b in BAND_HOURS))
print("probes (score = weighted incidents per 100 m per hour-of-band, x1000 would be per year scale):")
for nm, a, s in [("8th Ave & 41st (Port Authority)", 8, 41.5), ("W 42nd, 7th-8th", 7.5, 42), ("7th Ave & 33rd (Penn)", 7, 33.5), ("W 34th, 8th-9th", 8.5, 34), ("W 34th, 9th-10th", 9.5, 34),
                 ("7th Ave & 46th (Times Sq)", 7, 46.5), ("5th Ave & 50th", 5, 50.5), ("6th Ave & 42nd (Bryant Pk)", 6, 41.5), ("10th Ave & 35th (hotel)", 10, 35.5), ("W 38th, 10th-11th (tunnel)", 10.5, 38),
                 ("10th Ave & 39th", 10, 39.5), ("9th Ave & 46th (Rest. Row)", 9, 46.5), ("Columbus Ave & 75th", 9, 75.5), ("Madison & 75th", 4.5, 75.5), ("8th Ave & 23rd (Chelsea)", 8, 23.5), ("11th Ave & 50th", 11, 50.5)]:
    probe(nm, a, s)
