"""Turn the scored street graph into js/streets.js for the app. Usage: export_streets.py <geo dir> <out js>"""
import sys, glob, gzip, json, math, pickle, heapq, collections
import mapbox_vector_tile as mvt
from shapely.geometry import LineString, Point, Polygon, shape, box
from shapely.strtree import STRtree
GEO, OUT = sys.argv[1], sys.argv[2]
M = pickle.load(open(GEO + "/model.pkl", "rb"))
nodes, edges, length, cls, eve, late, score, count, hotel_node = (M[k] for k in ("nodes", "edges", "length", "cls", "eve_act", "late_act", "score", "count", "hotel_node"))
APP = json.load(open(GEO + "/app.json"))
LAT0, LNG0 = 40.75, -73.99; KX, KY = 111320 * math.cos(math.radians(LAT0)), 110540
to_m = lambda lng, lat: ((lng - LNG0) * KX, (lat - LAT0) * KY)
to_ll = lambda x, y: (x / KX + LNG0, y / KY + LAT0)
def g(ave, st):
    return to_m(-73.9933 - (ave - 8) * 0.0029 + (st - 34) * 0.000463, 40.7524 + (ave - 8) * 0.00122 + (st - 34) * 0.000633)
rect = lambda aw, ae, ss, sn: Polygon([g(aw, ss), g(ae, ss), g(ae, sn), g(aw, sn)])
lines = [LineString(e[2]) for e in edges]; tree = STRtree(lines); N = len(edges)
per100 = lambda v, i: v / max(length[i], 60) * 100
mid = [ln.interpolate(0.5, normalized=True) for ln in lines]

# ---- levels: incidents relative to how busy a block is, plus blocks that are simply empty after dark
def busy(b, i): return 1 + (per100(late[i], i) / 2.0 if b == "late" else per100(eve[i], i) / 4.0)
T1 = {"day": 0.30, "eve": 0.30, "late": 0.25}; T2 = {"day": 9, "eve": 0.60, "late": 0.50}
MIN1, MIN2 = 3, 7   # a block needs this many recorded incidents in the band before it can be flagged
TUNNEL = rect(12.3, 9.35, 35.95, 42.3); FARWEST = rect(12.3, 10.5, 42, 59.5); PARK = rect(7.93, 5.14, 59.4, 110)
by_node = collections.defaultdict(list)
for i, (a_, b_, _) in enumerate(edges): by_node[a_].append(i); by_node[b_].append(i)
nbrs = [[j for j in by_node[edges[i][0]] + by_node[edges[i][1]] if j != i] for i in range(N)]
level = {b: [0] * N for b in score}; why = {b: [""] * N for b in score}
for b in score:
    for i in range(N):
        n = count[b][i] + 0.5 * sum(count[b][j] for j in nbrs[i]) / max(1, len(nbrs[i])) * 2
        v, t = score[b][0][i] / busy(b, i), score[b][1][i]
        if v >= T2[b] and n >= MIN2: level[b][i], why[b][i] = 2, "hot"
        elif v >= T1[b] and n >= MIN1: level[b][i], why[b][i] = 1, "hot"
        elif t >= 0.20 and n >= MIN1: level[b][i], why[b][i] = 1, "theft"
# continuity: bridge one-block gaps along a street, then drop lone short dashes
edge_names_tmp = None
def same_street(i, j):
    (x0, y0), (x1, y1) = lines[i].coords[0], lines[i].coords[-1]; (u0, v0), (u1, v1) = lines[j].coords[0], lines[j].coords[-1]
    a1, a2 = math.atan2(y1 - y0, x1 - x0), math.atan2(v1 - v0, u1 - u0)
    d = abs((a1 - a2 + math.pi / 2) % math.pi - math.pi / 2)
    return d < math.radians(20)
for b in score:
    L = level[b]
    for i in range(N):
        if L[i] == 0 and length[i] <= 320 and score[b][0][i] / busy(b, i) >= 0.5 * T1[b]:
            ends = [any(L[j] > 0 and same_street(i, j) for j in by_node[edges[i][k]] if j != i) for k in (0, 1)]
            if all(ends): L[i], why[b][i] = 1, "hot"
    for i in range(N):
        if L[i] == 1 and length[i] < 130 and not any(L[j] > 0 for j in nbrs[i]): L[i], why[b][i] = 0, ""
# blocks that are empty after dark (local knowledge the incident data cannot see)
for i in range(N):
    P = mid[i]
    for b in ("eve", "late"):
        if PARK.contains(P): level[b][i], why[b][i] = 2, "park"
        elif TUNNEL.contains(P) and per100(eve[i], i) < 1.5 and level[b][i] < 2: level[b][i], why[b][i] = (2 if cls[i] == 1 else 1), "empty"
        elif FARWEST.contains(P) and per100(eve[i], i) < 1.0 and level[b][i] < 1: level[b][i], why[b][i] = (2 if b == "late" else 1), "empty"
reason = [why["eve"][i] or why["late"][i] or why["day"][i] for i in range(N)]
live = [0 if eve[i] == 0 else 2 if per100(eve[i], i) >= 6 else 1 for i in range(N)]   # open doors after dark: none, some, lively
for b in level:
    km = lambda L: sum(length[i] for i in range(N) if level[b][i] == L) / 1000
    print(b, f"stay sharp {km(1):.1f} km, avoid {km(2):.1f} km of {sum(length)/1000:.0f} km; flagged edges", sum(1 for i in range(N) if level[b][i]))
# what is flagged within 350 m of the hotel in the evening?
hx, hy = to_m(-73.9984, 40.7558)
for i in range(N):
    if level["eve"][i] and mid[i].distance(Point(hx, hy)) < 350:
        print("   near hotel:", level["eve"][i], why["eve"][i], f"{length[i]:.0f}m", "incidents d/e/l", round(count['day'][i],1), round(count['eve'][i],1), round(count['late'][i],1), "venues", eve[i])

# ---- street names from the map's own label layer
name_lines, name_vals = [], []
for fn in sorted(glob.glob(GEO + "/tiles/*.pbf")):
    tx, ty = map(int, fn.split("/")[-1][:-4].split("_")); raw = open(fn, "rb").read()
    if raw[:2] == b"\x1f\x8b": raw = gzip.decompress(raw)
    lay = mvt.decode(raw).get("transportation_name")
    if not lay: continue
    ext = lay["extent"]; n = 2 ** 14
    def ll(px, py):
        wx, wy = (tx + px / ext) / n, (ty + 1 - py / ext) / n
        return wx * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * wy))))
    for f in lay["features"]:
        nm = f["properties"].get("name:en") or f["properties"].get("name")
        if not nm: continue
        geom = shape(f["geometry"])
        for part in getattr(geom, "geoms", [geom]):
            if part.geom_type == "LineString" and part.length > 0:
                name_lines.append(LineString([to_m(*ll(x, y)) for x, y in part.coords])); name_vals.append(nm)
ntree = STRtree(name_lines)
def bearing(ln):
    (x0, y0), (x1, y1) = ln.coords[0], ln.coords[-1]
    return math.degrees(math.atan2(y1 - y0, x1 - x0)) % 180
names, name_idx, edge_name = [], {}, []
for i, ln in enumerate(lines):
    best, bd = None, 18
    for j in ntree.query(mid[i].buffer(18)):
        d = name_lines[j].distance(mid[i])
        if d >= bd: continue
        k = name_lines[j].project(mid[i]); seg = LineString([name_lines[j].interpolate(max(0, k - 15)), name_lines[j].interpolate(min(name_lines[j].length, k + 15))])
        diff = abs(bearing(ln) - bearing(seg)) if seg.length > 1 else 0
        if min(diff, 180 - diff) <= 30: best, bd = name_vals[j], d
    if best is None: edge_name.append(0); continue
    short = best.replace("Street", "St").replace("Avenue", "Ave").replace("West ", "W ").replace("East ", "E ").replace("Boulevard", "Blvd")
    if short not in name_idx: names.append(short); name_idx[short] = len(names)
    edge_name.append(name_idx[short])
print("named edges", sum(1 for x in edge_name if x), "of", N, "unique names", len(names))

# ---- walking minutes from the hotel to every place (shortest path along real streets, 80 m a minute)
adj = collections.defaultdict(list)
for i, (a, b, _) in enumerate(edges): adj[a].append((b, i)); adj[b].append((a, i))
dist = {hotel_node: 0.0}; pq = [(0.0, hotel_node)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist.get(u, 1e18): continue
    for v, i in adj[u]:
        nd = d + length[i]
        if nd < dist.get(v, 1e18): dist[v] = nd; heapq.heappush(pq, (nd, v))
used = sorted({e[0] for e in edges} | {e[1] for e in edges}); remap = {old: k for k, old in enumerate(used)}
def nearest_node(x, y, maxd=260):
    best, bd = None, maxd
    for old in used:
        d = math.hypot(nodes[old][0] - x, nodes[old][1] - y)
        if d < bd: best, bd = old, d
    return best, bd
walk = {}
for p in APP["places"]:
    nd, off = nearest_node(*to_m(p["lng"], p["lat"]))
    if nd is not None and nd in dist: walk[p["id"]] = max(1, round((dist[nd] + off) / 80))
print("walk minutes", {k: walk[k] for k in list(walk)[:8]}, "…", len(walk), "of", len(APP["places"]))

# ---- incidents per neighbourhood, for the area cards
inc = M["inc_pts"] + M["park_pts"]; zstats = {}
# incidents recorded inside the parks on the list of places
PARKS = {"bryant-park": 170, "washington-square": 170, "union-square": 150, "central-park": 500, "little-island": 120, "highline": 120}
park_stats = {}
for p_ in APP["places"]:
    if p_["id"] not in PARKS: continue
    px, py = to_m(p_["lng"], p_["lat"]); near = [q for q in M["park_pts"] if math.hypot(q[0] - px, q[1] - py) <= PARKS[p_["id"]]]
    if len(near) >= 5: park_stats[p_["id"]] = {"n": len(near), "theft": sum(1 for q in near if q[3]), "dark": sum(1 for q in near if q[2] != "day")}
print("park stats", park_stats)
for z in APP["zones"]:
    poly = Polygon([to_m(lng, lat) for lat, lng in z["poly"]])
    km = sum(length[i] for i in range(N) if poly.contains(mid[i])) / 1000
    c = collections.Counter(b for x, y, b, _ in inc if poly.contains(Point(x, y)))
    zstats[z["id"]] = {"km": round(km, 1), "day": c["day"], "eve": c["eve"], "late": c["late"]}
rate = lambda s: (s["eve"] + s["late"]) / s["km"] if s["km"] > 0.5 else None
order = sorted([r for r in map(rate, zstats.values()) if r is not None])
for zid, s in zstats.items():
    r = rate(s); s["tier"] = None if (r is None or zid == "park") else (2 if r >= order[int(len(order) * 0.7)] else 0 if r <= order[int(len(order) * 0.3)] else 1)
    z = next(x for x in APP["zones"] if x["id"] == zid)
    print(f"  {zid:12} km {s['km']:5.1f}  day {s['day']:4} eve {s['eve']:4} late {s['late']:4}  after-dark per km {r if r is None else round(r,1)}  tier {s['tier']}  (app says {z['day']}/{z['night']})")

# ---- digest: which named streets carry each neighbourhood's flags after dark
zone_polys = {z["id"]: Polygon([to_m(lng, lat) for lat, lng in z["poly"]]) for z in APP["zones"]}
for zid, poly in zone_polys.items():
    agg = collections.defaultdict(lambda: [0, 0, 0, 0])
    for i in range(N):
        if not edge_name[i] or not poly.contains(mid[i]): continue
        lvl = max(level["eve"][i], level["late"][i])
        if not lvl: continue
        a = agg[names[edge_name[i] - 1]]; a[0] = max(a[0], lvl); a[1] += length[i]; a[2] += count["eve"][i]; a[3] += count["late"][i]
    top = sorted(agg.items(), key=lambda kv: -(kv[1][2] + kv[1][3]))[:6]
    if top: print(f"  [{zid}] " + "; ".join(f"{nm} L{a[0]} {a[1]:.0f}m e{a[2]:.0f}/l{a[3]:.0f}" for nm, a in top))

# ---- write
xs = lambda x, y: (round((to_ll(x, y)[0] + 74.05) * 1e5), round((to_ll(x, y)[1] - 40.69) * 1e5))
nflat = []
for old in used: nflat += xs(*nodes[old])
eflat, geom, info = [], {}, {}
for i, (a, b, cs) in enumerate(edges):
    code = level["day"][i] + 3 * level["eve"][i] + 9 * level["late"][i] + 27 * live[i] + 81 * (cls[i] - 1)
    eflat += [remap[a], remap[b], round(length[i]), code, edge_name[i]]
    if len(cs) > 2:
        ls = LineString(cs).simplify(1.5)
        if len(ls.coords) > 2: geom[i] = [v for c in list(ls.coords)[1:-1] for v in xs(*c)]
    if level["day"][i] or level["eve"][i] or level["late"][i]:
        info[i] = [reason[i], round(count["day"][i]), round(count["eve"][i]), round(count["late"][i])]
out = {"span": "October 2025 to September 2026", "incidents": len(inc), "hotel": remap[hotel_node], "nodes": nflat, "edges": eflat, "geom": geom, "info": info, "names": names, "walk": walk, "zones": zstats, "parks": park_stats}
js = "/* Street safety model. Generated by the build script from NYPD complaint records (NYC Open Data)\n   and the OpenStreetMap street network. Do not edit by hand. */\nconst STREETS = " + json.dumps(out, separators=(",", ":")) + ";\n"
open(OUT, "w").write(js)
print("wrote", OUT, round(len(js) / 1024), "KB;", len(used), "junctions,", N, "edges,", len(info), "flagged,", len(geom), "curved")
