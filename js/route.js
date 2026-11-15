/* Your New York — the street model: per-block safety levels and walking routes.
   The data (STREETS) is generated from NYPD complaint records and the OpenStreetMap street
   network by the build script; this file only reads it. */
App.streets = (() => {
  "use strict";
  const S = STREETS, { HOTEL, distKm } = App;
  const NODES = S.nodes.length / 2, EDGES = S.edges.length / 5;
  const BANDS = { day: 0, eve: 1, late: 2 };
  const LABEL = { day: "Daytime", eve: "Evening", late: "Late night" };
  const WALK = 80; // metres a minute

  const lng = (n) => S.nodes[2 * n] / 1e5 - 74.05;
  const lat = (n) => S.nodes[2 * n + 1] / 1e5 + 40.69;
  const A = (e) => S.edges[5 * e], B = (e) => S.edges[5 * e + 1], LEN = (e) => S.edges[5 * e + 2];
  const code = (e) => S.edges[5 * e + 3];
  const level = (e, band) => Math.floor(code(e) / [1, 3, 9][BANDS[band]]) % 3;
  const live = (e) => Math.floor(code(e) / 27) % 3; // open doors after dark: 0 none, 1 some, 2 lively
  const major = (e) => code(e) >= 81;
  const name = (e) => (S.edges[5 * e + 4] ? S.names[S.edges[5 * e + 4] - 1] : "");

  /* Which band applies right now in New York: dark at 4:45 pm in December, "late" from 10 pm. */
  function bandNow() {
    const m = App.nyNow().minutes;
    if (m >= 22 * 60 || m < 7 * 60) return "late";
    return m >= App.SUNSET + 17 ? "eve" : "day";
  }

  // geometry of an edge from A to B as [lng, lat] pairs
  function coords(e) {
    const out = [[lng(A(e)), lat(A(e))]], g = S.geom[e];
    if (g) for (let i = 0; i < g.length; i += 2) out.push([g[i] / 1e5 - 74.05, g[i + 1] / 1e5 + 40.69]);
    out.push([lng(B(e)), lat(B(e))]);
    return out;
  }
  const flagged = (band) => ({
    type: "FeatureCollection",
    features: Object.keys(S.info).map(Number).filter((e) => level(e, band) > 0).map((e) => ({
      type: "Feature", properties: { e, lv: level(e, band) }, geometry: { type: "LineString", coordinates: coords(e) },
    })),
  });

  let adj = null;
  function graph() {
    if (adj) return adj;
    adj = Array.from({ length: NODES }, () => []);
    for (let e = 0; e < EDGES; e++) { adj[A(e)].push(e); adj[B(e)].push(e); }
    return adj;
  }
  function nearestNode(p, maxMetres = 320) {
    let best = -1, bd = Infinity;
    const k = Math.cos(p.lat * Math.PI / 180);
    for (let n = 0; n < NODES; n++) {
      const dx = (lng(n) - p.lng) * k, dy = lat(n) - p.lat, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = n; }
    }
    const metres = Math.sqrt(bd) * 111320;
    return metres <= maxMetres ? { node: best, metres } : null;
  }

  /* Dijkstra over the street graph. `weight(e)` returns the cost of walking edge e. */
  function search(from, weight, target = -1) {
    const g = graph(), dist = new Float64Array(NODES).fill(Infinity), prev = new Int32Array(NODES).fill(-1);
    const heap = [[0, from]]; dist[from] = 0;
    const push = (item) => { heap.push(item); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } }
      return top;
    };
    while (heap.length) {
      const [d, u] = pop();
      if (d > dist[u]) continue;
      if (u === target) break;
      for (const e of g[u]) {
        const v = A(e) === u ? B(e) : A(e), nd = d + weight(e);
        if (nd < dist[v]) { dist[v] = nd; prev[v] = e; push([nd, v]); }
      }
    }
    return { dist, prev };
  }
  function trace(prev, from, to) {
    const edges = [];
    for (let n = to; n !== from;) { const e = prev[n]; if (e < 0) return null; edges.push(e); n = A(e) === n ? B(e) : A(e); }
    return edges.reverse();
  }

  /* After dark the walk prefers main streets with open doors, goes round "stay sharp" blocks
     when that is cheap, and goes a long way round blocks marked "avoid". */
  function safeWeight(band) {
    const dark = band !== "day";
    return (e) => {
      const lv = level(e, band);
      let f = lv === 2 ? 9 : lv === 1 ? 2.2 : 1;
      if (dark) { f *= [1.45, 1.1, 0.9][live(e)]; if (major(e)) f *= 0.88; }
      return LEN(e) * f;
    };
  }
  function summarise(edges, start, band) {
    let metres = 0, sharp = 0, avoid = 0, node = start;
    const line = [[lng(start), lat(start)]], byName = new Map(), order = [];
    for (const e of edges) {
      const fwd = A(e) === node, pts = coords(e);
      if (!fwd) pts.reverse();
      line.push(...pts.slice(1)); node = fwd ? B(e) : A(e);
      metres += LEN(e);
      const lv = level(e, band); if (lv === 1) sharp += LEN(e); if (lv === 2) avoid += LEN(e);
      const nm = name(e);
      if (nm) { if (!byName.has(nm)) { byName.set(nm, 0); order.push(nm); } byName.set(nm, byName.get(nm) + LEN(e)); }
    }
    const main = order.filter((nm) => byName.get(nm) >= Math.max(90, metres * 0.12)).slice(0, 3);
    return { edges, line, metres, sharp, avoid, main };
  }

  /* The walk between two points at a given time: the safest reasonable way, compared with the shortest. */
  function route(fromPoint, toPoint, band) {
    const a = nearestNode(fromPoint), b = nearestNode(toPoint);
    if (!a || !b) return null;
    const safe = search(a.node, safeWeight(band), b.node), short = search(a.node, LEN, b.node);
    const se = trace(safe.prev, a.node, b.node), he = trace(short.prev, a.node, b.node);
    if (!se || !he) return null;
    const r = summarise(se, a.node, band), s = summarise(he, a.node, band);
    const extra = a.metres + b.metres;
    r.minutes = Math.max(1, Math.round((r.metres + extra) / WALK));
    r.shortestMinutes = Math.max(1, Math.round((s.metres + extra) / WALK));
    // which flagged streets on the direct way does this route go around?
    const used = new Set(se), skipped = new Map();
    he.forEach((e) => { if (!used.has(e) && level(e, band) > 0 && name(e)) skipped.set(name(e), (skipped.get(name(e)) || 0) + LEN(e)); });
    r.goesAround = [...skipped.entries()].filter(([, m]) => m >= 60).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([nm]) => nm);
    r.line.unshift([fromPoint.lng, fromPoint.lat]); r.line.push([toPoint.lng, toPoint.lat]);
    return r;
  }

  /* Walking minutes along real streets. From the hotel they are precomputed; from anywhere else
     one search gives the time to every junction, which is then reused for every place. */
  let fromKey = "", fromDist = null;
  function minutes(fromPoint, place) {
    const straight = Math.ceil(distKm(fromPoint, place) * 1000 * 1.45 / WALK);
    if (fromPoint === HOTEL) return S.walk[place.id] ? Math.max(1, Math.min(S.walk[place.id], straight)) : null;
    const key = fromPoint.lat.toFixed(4) + "," + fromPoint.lng.toFixed(4);
    if (key !== fromKey) { const a = nearestNode(fromPoint); fromDist = a ? { d: search(a.node, LEN).dist, off: a.metres } : null; fromKey = key; }
    if (!fromDist) return null;
    if (place._node === undefined) place._node = nearestNode(place, 260);
    if (!place._node || !isFinite(fromDist.d[place._node.node])) return null;
    return Math.max(1, Math.min(Math.round((fromDist.d[place._node.node] + fromDist.off + place._node.metres) / WALK), straight));
  }

  const info = (e) => { const i = S.info[e]; return i ? { why: i[0], day: i[1], eve: i[2], late: i[3], name: name(e) } : null; };
  return { BANDS, LABEL, bandNow, flagged, route, minutes, info, level, zone: (id) => S.zones[id], park: (id) => S.parks[id], span: S.span, incidents: S.incidents };
})();
