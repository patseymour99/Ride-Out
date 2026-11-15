import math, os, sys, time, urllib.request
OUT = sys.argv[1]
T = "https://tiles.openfreemap.org/planet/20261101_080013_pt/14/{x}/{y}.pbf"
def tile(lat, lng, z=14):
    n = 2 ** z
    return int((lng + 180) / 360 * n), int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
x0, y0 = tile(40.800, -74.022); x1, y1 = tile(40.698, -73.928)
print("tiles x", x0, x1, "y", y0, y1, "count", (x1 - x0 + 1) * (y1 - y0 + 1))
for x in range(x0, x1 + 1):
    for y in range(y0, y1 + 1):
        fn = f"{OUT}/{x}_{y}.pbf"
        if os.path.exists(fn): continue
        req = urllib.request.Request(T.format(x=x, y=y), headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=40) as r: data = r.read()
        open(fn, "wb").write(data); time.sleep(0.15)
print("done", len(os.listdir(OUT)))
