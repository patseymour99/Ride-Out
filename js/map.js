/* Your New York — the map. MapLibre GL with OpenFreeMap vector tiles (no key needed). */
App.map = (() => {
  "use strict";
  const { $, esc, ic, HOTEL, LEVEL, CAT_ICON, state, store, placeById, zoneAt, distKm, distText, origin, meInNYC, lv, bullets, toast, isDarkNow } = App;

  const BEARING = 29; // turn the map so the avenues run straight up the screen: uptown is up
  const HOME_VIEW = { center: [-73.9905, 40.7555], zoom: 13.3 };
  const BASE = { day: "https://tiles.openfreemap.org/styles/positron", night: "https://tiles.openfreemap.org/styles/dark" };
  const INK = "#0d0f12", AMBER = "#e08a00", RED = "#d23b2c", GOLD = "#fccc0a";
  const ZONE_LABEL = { home: "Hudson Yards", tunnel: "Lincoln Tunnel", pabt: "Port Authority", penn: "Penn Station", garment: "Garment District", tsq: "Times Square", hk: "Hell's Kitchen", midtown: "Midtown", nomad: "NoMad", chelsea: "Chelsea", flatiron: "Flatiron", park: "Central Park", uws: "Upper West Side", ues: "Upper East Side", village: "West Village", eastvillage: "East Village", soho: "SoHo", chinatown: "Chinatown", fidi: "Financial District", dumbo: "DUMBO" };
  const SHORT = { "hudson-yards": "Hudson Yards Shops", edge: "Edge", mercado: "Little Spain", highline: "High Line", whitney: "Whitney", moynihan: "Moynihan Food Hall", "bryant-park": "Bryant Park", nypl: "Public Library", "grand-central": "Grand Central", summit: "SUMMIT", "rock-tree": "Rockefeller Tree", "fifth-windows": "Fifth Ave windows", "st-patricks": "St. Patrick's", "radio-city": "Radio City", broadway: "Broadway", "empire-state": "Empire State", macys: "Macy's", morgan: "Morgan Library", "hells-kitchen": "Restaurant Row", "columbus-circle": "Columbus Circle Market", "central-park": "Central Park loop", met: "The Met", amnh: "Natural History Museum", "lincoln-center": "Lincoln Center", "union-square": "Union Sq Market", flatiron: "Flatiron & Eataly", "west-village": "West Village", "washington-square": "Washington Sq", soho: "SoHo", "911": "9/11 Memorial", "brooklyn-bridge": "Brooklyn Bridge", ferry: "Staten Island Ferry" };

  let map = null, ready = false, styleMode = null;
  let modeOverride = null; // "day" | "night"; null = follow the clock in New York
  let filter = "all", activeId = null;
  let meMarker = null, activeMarker = null, stopMarkers = [];
  const pinImages = {};

  const ll = (p) => [p.lng, p.lat];
  const mode = () => modeOverride || (isDarkNow() ? "night" : "day");
  const pad = (bottom) => ({ top: 90, bottom: bottom || 60, left: 40, right: 64 });
  const cardHeight = () => { const c = $("#mapCard"); return c.hidden ? 0 : c.offsetHeight; };
  const planDay = () => DAYS[state.dayIndex == null ? App.views.defaultDayIndex() : state.dayIndex];
  const planStops = () => [...new Set(planDay().steps.map((s) => s.place).filter(Boolean))].map((id) => placeById[id]);

  function places() {
    if (filter === "plan") return planStops();
    const from = origin();
    return PLACES.filter((p) => filter === "all" || (filter === "festive" ? p.festive : p.cat === filter))
      .map((p) => ({ p, km: distKm(from, p) })).sort((a, b) => a.km - b.km).map((x) => x.p);
  }

  /* Pull each area in slightly and round its corners so it reads as a soft district, not a hard box. */
  function soften(poly) {
    const n = poly.length, K = 0.757;
    const cy = poly.reduce((s, p) => s + p[0], 0) / n, cx = poly.reduce((s, p) => s + p[1], 0) / n;
    const pts = poly.map(([y, x]) => [cy + (y - cy) * 0.975, cx + (x - cx) * 0.975]);
    const len = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * K);
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const out = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const a = lerp(p1, p0, Math.min(0.45, 0.0008 / len(p1, p0)));
      const b = lerp(p1, p2, Math.min(0.45, 0.0008 / len(p1, p2)));
      for (let s = 0; s <= 6; s++) { const t = s / 6; out.push(lerp(lerp(a, p1, t), lerp(p1, b, t), t)); }
    }
    return out;
  }
  const fc = (features) => ({ type: "FeatureCollection", features });
  const line = (pts) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: pts } });
  const zonesGeo = () => fc(ZONES.map((z) => {
    const ring = soften(z.poly).map(([y, x]) => [x, y]);
    ring.push(ring[0]);
    return { type: "Feature", properties: { id: z.id, day: z.day, night: z.night }, geometry: { type: "Polygon", coordinates: [ring] } };
  }));
  const placesGeo = (list) => fc(list.map((p, i) => ({
    type: "Feature", properties: { id: p.id, name: SHORT[p.id] || p.name, cat: p.cat, rank: i, active: p.id === activeId ? 1 : 0 },
    geometry: { type: "Point", coordinates: ll(p) },
  })));

  /* Pins are drawn from the same icon set as the rest of the app. */
  function buildPins() {
    const art = Object.entries(CAT_ICON).map(([cat, icon]) => [cat, 90, `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12.5" fill="${INK}" stroke="#fff" stroke-width="2.2"/><g transform="translate(8.4 8.4) scale(0.55)" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</g></svg>`]);
    art.push(["dot", 36, `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="${INK}" stroke="#fff" stroke-width="1.6"/></svg>`]);
    return Promise.all(art.map(([cat, size, svg]) => new Promise((done) => {
      const img = new Image(size, size);
      img.onload = () => { pinImages[cat] = img; done(); };
      img.onerror = done;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    })));
  }

  /* ---------- basemap + our layers; rebuilt whenever the basemap changes (day <-> night) ---------- */
  function tuneBase() {
    const night = styleMode === "night";
    map.getStyle().layers.forEach((l) => {
      if (/shield|airport|oneway|boundary|aeroway|ne2|water_name|waterway_line_label/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
      // Street names are how she will navigate: a touch larger and darker than the stock style.
      if (l.type === "symbol" && /highway[-_]name/.test(l.id)) {
        map.setPaintProperty(l.id, "text-color", night ? "#aab1bd" : "#5b6472");
        map.setLayoutProperty(l.id, "text-size", ["interpolate", ["linear"], ["zoom"], 13, 10, 16, 13]);
      }
      if (l.type === "symbol" && /^(label_|place_)/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
    });
  }
  function addOverlays() {
    const m = mode(), night = m === "night";
    const base = map.getStyle().layers;
    let lastShape = -1;
    base.forEach((l, i) => { if (l.type !== "symbol") lastShape = i; });
    const under = (base[lastShape + 1] || {}).id; // above roads and buildings, below labels
    const level = ["get", m];

    map.addSource("zones", { type: "geojson", data: zonesGeo() });
    map.addLayer({ id: "zone-fill", type: "fill", source: "zones", paint: {
      "fill-color": ["match", level, "sharp", AMBER, "skip", RED, "#000000"],
      "fill-opacity": ["match", level, "sharp", night ? 0.26 : 0.18, "skip", night ? 0.38 : 0.26, 0],
    } }, under);
    map.addLayer({ id: "zone-line-sharp", type: "line", source: "zones", filter: ["==", level, "sharp"], paint: { "line-color": AMBER, "line-width": 1.5, "line-opacity": 0.9 } }, under);
    map.addLayer({ id: "zone-line-skip", type: "line", source: "zones", filter: ["==", level, "skip"], paint: { "line-color": RED, "line-width": 2, "line-dasharray": [2, 2] } }, under);

    if (night) { // the recommended walk back to the hotel
      const walk = [g(8, 34), g(10, 34), [HOTEL.lat, HOTEL.lng]].map(([y, x]) => [x, y]);
      const spur = [g(10.62, 33.9), g(10, 34)].map(([y, x]) => [x, y]);
      map.addSource("walk", { type: "geojson", data: fc([line(walk), line(spur)]) });
      map.addLayer({ id: "walk-case", type: "line", source: "walk", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#000000", "line-width": 9, "line-opacity": 0.55 } });
      map.addLayer({ id: "walk-line", type: "line", source: "walk", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": GOLD, "line-width": 5 } });
      map.addLayer({ id: "walk-label", type: "symbol", source: "walk", minzoom: 14, layout: { "symbol-placement": "line-center", "text-field": "Walk home this way", "text-font": ["Noto Sans Bold"], "text-size": 11.5, "text-offset": [0, -1.1], "text-allow-overlap": true }, paint: { "text-color": GOLD, "text-halo-color": "#000000", "text-halo-width": 2 } });
    }

    map.addSource("zone-names", { type: "geojson", data: fc(ZONES.filter((z) => ZONE_LABEL[z.id]).map((z) => ({
      type: "Feature", properties: { name: ZONE_LABEL[z.id].toUpperCase() },
      geometry: { type: "Point", coordinates: [z.poly.reduce((a, p) => a + p[1], 0) / z.poly.length, z.poly.reduce((a, p) => a + p[0], 0) / z.poly.length] },
    }))) });
    map.addLayer({ id: "zone-names", type: "symbol", source: "zone-names", minzoom: 11.5, maxzoom: 15.2, layout: {
      "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 11.5, 9, 15, 11],
      "text-letter-spacing": 0.14, "text-max-width": 7, "text-padding": 8,
    }, paint: { "text-color": night ? "#8a93a2" : "#8b93a1", "text-halo-color": night ? "#0b0c0e" : "#f6f6f4", "text-halo-width": 1.4 } });

    map.addSource("route", { type: "geojson", data: fc([]) });
    map.addLayer({ id: "route-case", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": night ? "#0b0c0e" : "#ffffff", "line-width": 9 } });
    map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": INK, "line-width": 5 } });

    Object.entries(pinImages).forEach(([cat, img]) => { if (!map.hasImage("pin-" + cat)) map.addImage("pin-" + cat, img, { pixelRatio: 3 }); });
    const labelPaint = { "text-color": night ? "#ffffff" : "#16191f", "text-halo-color": night ? "#0b0c0e" : "#ffffff", "text-halo-width": 1.8 };
    map.addSource("places", { type: "geojson", data: placesGeo([]) });
    // Places that don't fit as a full pin at this zoom show as a small dot, and only where there is room.
    map.addLayer({ id: "places-dot", type: "symbol", source: "places", filter: ["!=", ["get", "active"], 1], layout: {
      "icon-image": "pin-dot", "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.7, 14, 1], "icon-padding": 2, "symbol-sort-key": ["get", "rank"],
    } });
    map.addLayer({ id: "places-pin", type: "symbol", source: "places", filter: ["!=", ["get", "active"], 1], layout: {
      "icon-image": ["concat", "pin-", ["get", "cat"]], "icon-size": ["interpolate", ["linear"], ["zoom"], 11.5, 0.72, 15, 1],
      "icon-padding": 1, "symbol-sort-key": ["get", "rank"],
      "text-field": ["step", ["zoom"], "", 12.6, ["get", "name"]], "text-font": ["Noto Sans Bold"], "text-optional": true,
      "text-size": ["interpolate", ["linear"], ["zoom"], 12.6, 10.5, 16, 12.5], "text-max-width": 7.5, "text-line-height": 1.1,
      "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 1.35, "text-justify": "auto", "text-padding": 3,
    }, paint: labelPaint });
    map.addLayer({ id: "places-name", type: "symbol", source: "places", layout: {
      visibility: "none", "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": 11.5, "text-max-width": 7.5,
      "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 1.5, "text-justify": "auto", "symbol-sort-key": ["get", "rank"],
    }, paint: { ...labelPaint, "text-opacity": ["case", ["==", ["get", "active"], 1], 0, 1] } });

    ready = true;
    render();
  }

  /* ---------- chrome: filters, legend, mode ---------- */
  function renderChips() {
    const d = planDay();
    const chips = [["all", "All places"], ["plan", `${d.short} route`], ["festive", "Festive"], ["sights", "Sights"], ["views", "Views"], ["museums", "Museums"], ["walks", "Walks"], ["food", "Food"], ["shops", "Shops"], ["shows", "Shows"]];
    $("#mapChips").innerHTML = chips.map(([k, label]) => `<button class="chip${k === filter ? " on" : ""}" data-mapfilter="${k}">${k === "plan" ? `<span class="bullet" style="--c:${d.color}">${esc(d.letter)}</span>` : ""}${esc(label)}</button>`).join("");
  }
  function renderLegend() {
    const m = mode();
    $("#mapLegend").innerHTML = `<span class="lg-mode">${ic(m === "night" ? "moon" : "sun")}${m === "night" ? "After dark" : "Daytime"}</span><span class="lg-key lg-sharp">Stay sharp</span><span class="lg-key lg-skip">Skip</span>`;
    const b = $("#modeBtn");
    b.innerHTML = ic(m === "night" ? "moon" : "sun");
    b.classList.toggle("on", !!modeOverride);
    b.setAttribute("aria-label", m === "night" ? "Showing after dark. Switch to daytime" : "Showing daytime. Switch to after dark");
    $("#view-map").classList.toggle("night", m === "night");
  }
  function syncMode() {
    renderLegend();
    if (!map) return;
    const m = mode();
    if (styleMode !== m) { styleMode = m; ready = false; map.setStyle(BASE[m], { diff: false }); }
  }
  function toggleMode() {
    const actual = isDarkNow() ? "night" : "day";
    const next = mode() === "night" ? "day" : "night";
    modeOverride = next === actual ? null : next;
    toast(next === "night" ? "Showing how areas feel after dark" : "Showing how areas feel by day");
    syncMode();
    refreshCard();
  }

  /* ---------- the card at the bottom: one thing at a time ---------- */
  let card = null; // { type: "place" | "zone" | "intro", id }
  function setCard(next) {
    card = next;
    const el = $("#mapCard");
    if (!card) { el.hidden = true; $("#view-map").classList.remove("has-card"); return; }
    const m = mode();
    let html = "";
    if (card.type === "place") {
      const p = placeById[card.id], level = p.zone ? p.zone[m] : "easy";
      const stops = filter === "plan" ? planStops() : null, idx = stops ? stops.findIndex((x) => x.id === p.id) : -1;
      html = `<div class="mc-head">
          <span class="mc-ic">${idx >= 0 ? `<b>${idx + 1}</b>` : ic(CAT_ICON[p.cat])}</span>
          <div class="mc-title"><h3>${esc(p.name)}</h3><p>${esc(CATS[p.cat].label)} · ${esc(p.area)}</p></div>
        </div>
        <p class="mc-meta"><span>${distText(distKm(origin(), p))} ${meInNYC() ? "from you" : "from the hotel"}</span><span>${esc(p.price)}</span>${level !== "easy" ? lv(level, m === "night" ? (level === "skip" ? "Not after dark" : "Stay sharp after dark") : "Stay sharp") : ""}</p>
        <div class="mc-actions">
          <a class="btn primary" href="${App.placeDir(p)}" target="_blank" rel="noopener">${ic("navigation")}Directions</a>
          <button class="btn" data-place="${p.id}">Details</button>
          ${idx >= 0 ? `<span class="mc-step"><button class="btn sq" data-mapstep="-1" aria-label="Previous stop"${idx === 0 ? " disabled" : ""}>${ic("chevron-left")}</button><button class="btn sq" data-mapstep="1" aria-label="Next stop"${idx === stops.length - 1 ? " disabled" : ""}>${ic("chevron-right")}</button></span>` : ""}
        </div>`;
    } else if (card.type === "zone") {
      const z = ZONES.find((x) => x.id === card.id);
      html = `<p class="over">${m === "night" ? "After dark" : "Daytime"}</p>
        <div class="mc-zone"><h3>${esc(z.name)}</h3>${lv(z[m])}</div>
        <p class="mc-note">${esc(z.note)}</p>
        <p class="mc-foot">${m === "night" ? "By day" : "After dark"}: ${LEVEL[m === "night" ? z.day : z.night]}</p>`;
    } else {
      html = `<p class="over">Reading the map</p>
        <ul class="mc-intro">
          <li>${ic("navigation")}<span><b>Uptown is up.</b> Avenues run up the screen, cross streets run side to side.</span></li>
          <li>${ic("triangle-alert")}<span><b>Shaded areas need a second thought.</b> Everywhere else is relaxed. Tap any area to see why.</span></li>
          <li>${ic("moon")}<span><b>It changes after dark.</b> The map follows the real time in New York.</span></li>
        </ul>
        <button class="btn primary wide" data-act="map-intro-done">Got it</button>`;
    }
    el.innerHTML = (card.type === "intro" ? "" : `<button class="x" data-act="map-card-close" aria-label="Close">${ic("x")}</button>`) + html;
    el.hidden = false;
    $("#view-map").classList.add("has-card");
  }
  const refreshCard = () => { if (card) setCard(card); };

  /* ---------- markers ---------- */
  function domMarker(html, lngLat, onClick, cls) {
    const el = document.createElement("div");
    el.className = "mk" + (cls ? " " + cls : "");
    el.innerHTML = html;
    if (onClick) el.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
    return new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
  }
  function placeActive() {
    if (activeMarker) { activeMarker.remove(); activeMarker = null; }
    const p = placeById[activeId];
    if (!p || !map) return;
    const idx = filter === "plan" ? planStops().findIndex((x) => x.id === p.id) : -1;
    activeMarker = domMarker(`<span class="pin pin-on">${idx >= 0 ? `<b>${idx + 1}</b>` : ic(CAT_ICON[p.cat])}</span>`, ll(p), () => App.views.openPlace(p.id), "mk-top");
  }

  /* ---------- drawing the current selection ---------- */
  function render(fit) {
    renderChips();
    if (!map || !ready) return;
    const list = places(), plan = filter === "plan";
    if (activeId && !list.some((p) => p.id === activeId)) { activeId = null; if (card && card.type === "place") setCard(null); }
    stopMarkers.forEach((mk) => mk.remove()); stopMarkers = [];
    map.getSource("places").setData(placesGeo(list));
    map.setLayoutProperty("places-pin", "visibility", plan ? "none" : "visible");
    map.setLayoutProperty("places-dot", "visibility", plan ? "none" : "visible");
    map.setLayoutProperty("places-name", "visibility", plan ? "visible" : "none");
    map.setLayoutProperty("places-pin", "text-field", filter === "all" ? ["step", ["zoom"], "", 12.6, ["get", "name"]] : ["get", "name"]);
    map.getSource("route").setData(fc(plan && list.length > 1 ? [line([ll(HOTEL), ...list.map(ll)])] : []));
    map.setPaintProperty("route-line", "line-color", planDay().color);
    if (plan) list.forEach((p, i) => { if (p.id !== activeId) stopMarkers.push(domMarker(`<span class="stop-pin"><b>${i + 1}</b></span>`, ll(p), () => select(p.id))); });
    placeActive();
    if (fit === "home") map.easeTo({ center: HOME_VIEW.center, zoom: HOME_VIEW.zoom, bearing: BEARING, duration: 600 });
    else if (fit && list.length) {
      const b = new maplibregl.LngLatBounds(ll(HOTEL), ll(HOTEL));
      list.forEach((p) => b.extend(ll(p)));
      map.fitBounds(b, { padding: pad(cardHeight() + 40), bearing: BEARING, maxZoom: 15, duration: 600 });
    }
  }
  function select(id, opts = {}) {
    activeId = id;
    setCard({ type: "place", id });
    render();
    const p = placeById[id];
    if (opts.pan !== false && p) map.easeTo({ center: ll(p), zoom: Math.max(map.getZoom(), opts.zoom || 14.2), offset: [0, -cardHeight() / 2 + 20], duration: 500 });
  }
  function deselect() {
    if (!activeId && !card) return;
    activeId = null; setCard(null);
    if (ready) render();
  }
  function setFilter(next) {
    filter = next; activeId = null; setCard(null);
    render(filter === "all" ? "home" : true);
    if (filter === "plan") { const first = planStops()[0]; if (first) setTimeout(() => select(first.id, { pan: false }), 50); }
  }
  function step(delta) {
    const stops = planStops(), i = stops.findIndex((p) => p.id === activeId);
    const next = stops[i + delta];
    if (next) select(next.id);
  }

  /* ---------- setup ---------- */
  function init() {
    if (map) return;
    const holder = $("#map");
    if (typeof maplibregl === "undefined") { holder.innerHTML = `<p class="map-fail">The map couldn't load. Check your connection and open this tab again.</p>`; return; }
    try {
      map = new maplibregl.Map({
        container: "map", style: BASE[mode()], center: HOME_VIEW.center, zoom: HOME_VIEW.zoom, bearing: BEARING,
        minZoom: 11, maxZoom: 18, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
      });
    } catch (e) { map = null; holder.innerHTML = `<p class="map-fail">This browser can't draw the map. Everything else in the guide still works.</p>`; return; }
    styleMode = mode();
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.on("moveend", () => { if (Math.abs(map.getBearing() - BEARING) > 0.5) map.setBearing(BEARING); });

    // Re-attach our layers whenever a basemap finishes loading (first load, and each day/night switch).
    const ensure = () => {
      if (!map.isStyleLoaded() || map.getSource("zones")) return;
      try { tuneBase(); addOverlays(); holder.classList.add("is-ready"); } catch (err) { console.error("map layers: " + err.message); }
    };
    buildPins().then(() => { map.on("styledata", ensure); map.on("idle", ensure); ensure(); });
    // If the vector basemap can't be reached, fall back to plain OpenStreetMap tiles, toned down to grey.
    setTimeout(() => {
      if (!map || map.getSource("zones")) return;
      map.setStyle({
        version: 8, glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
        sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19 } },
        layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.9, "raster-contrast": -0.15, "raster-brightness-max": mode() === "night" ? 0.45 : 1 } }],
      }, { diff: false });
    }, 10000);

    domMarker(`<span class="pin pin-home">${ic("house")}</span><span class="pin-tag">Hotel</span>`, ll(HOTEL), () => App.views.openDriver(), "mk-top");
    STATIONS.forEach((s) => domMarker(`<span class="stn">${bullets(s.lines)}</span>`, [s.lng, s.lat], () => toast(`${s.name}${s.home ? " · your station" : ""}`), "mk-stn" + (s.home ? " mk-stn-home" : "")));
    const onZoom = () => { const z = map.getZoom(), c = map.getContainer().classList; c.toggle("z-far", z < 12.4); c.toggle("z-mid", z < 13.6); };
    map.on("zoom", onZoom); onZoom();

    map.on("click", (e) => {
      if (!ready) return;
      if (card && card.type === "intro") return;
      const r = 18, hits = map.queryRenderedFeatures([[e.point.x - r, e.point.y - r], [e.point.x + r, e.point.y + r]], { layers: ["places-pin", "places-dot", "places-name"] });
      if (hits.length) {
        let best = hits[0], gap = Infinity;
        hits.forEach((f) => { const pt = map.project(f.geometry.coordinates), d = Math.hypot(pt.x - e.point.x, pt.y - e.point.y); if (d < gap) { gap = d; best = f; } });
        select(best.properties.id, { pan: false });
        return;
      }
      const z = zoneAt(e.lngLat.lat, e.lngLat.lng);
      const shaded = z && z[mode()] !== "easy";
      if (shaded || (z && !card)) { activeId = null; setCard({ type: "zone", id: z.id }); render(); } else deselect();
    });

    syncMode(); renderChips();
    if (!store.get("mapIntro", false)) setCard({ type: "intro" });
  }

  function onShow() {
    const first = !map;
    init();
    if (!map) return;
    map.resize();
    if (!first) { syncMode(); render(); }
  }
  function locateMe() {
    toast("Finding you…");
    App.locate((pos) => {
      if (!map) return;
      if (!meMarker) meMarker = domMarker(`<span class="me-dot"></span>`, ll(pos), null, "mk-top");
      else meMarker.setLngLat(ll(pos));
      if (!meInNYC()) { toast("You're not in New York yet. Showing the hotel."); goHome(); return; }
      const z = zoneAt(pos.lat, pos.lng);
      activeId = null; setCard(z ? { type: "zone", id: z.id } : null);
      render();
      map.easeTo({ center: ll(pos), zoom: 15.5, offset: [0, -cardHeight() / 2], duration: 500 });
    });
  }
  function goHome() { if (map) { deselect(); map.easeTo({ center: ll(HOTEL), zoom: 15, bearing: BEARING, duration: 500 }); } }

  /* ---------- entry points used by the rest of the app ---------- */
  function focusPlace(id) {
    App.views.show("map");
    if (!map) return;
    if (filter !== "all" && !places().some((p) => p.id === id)) filter = "all";
    const go = () => select(id, { zoom: 15.5 });
    if (ready) go(); else map.once("idle", go);
  }
  function focusZone(id, night) {
    if (night) modeOverride = isDarkNow() ? null : "night";
    App.views.show("map");
    if (!map) return;
    const z = ZONES.find((x) => x.id === id);
    activeId = null; setCard({ type: "zone", id });
    const b = new maplibregl.LngLatBounds();
    z.poly.forEach(([y, x]) => b.extend([x, y]));
    map.fitBounds(b, { padding: pad(cardHeight() + 40), bearing: BEARING, maxZoom: 15.2, duration: 600 });
  }
  function showPlan() {
    App.views.show("map");
    if (!map) return;
    const go = () => setFilter("plan");
    if (ready) go(); else map.once("idle", go);
  }
  function introDone() { store.set("mapIntro", true); setCard(null); }

  return { onShow, setFilter, toggleMode, locateMe, goHome, focusPlace, focusZone, showPlan, deselect, step, introDone, tick: () => { if (map && !modeOverride) syncMode(); }, instance: () => map };
})();
