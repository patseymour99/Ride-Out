/* Your New York — the map. MapLibre GL with OpenFreeMap vector tiles (no key needed).
   Safety is drawn on the streets themselves, the way traffic is: nothing on a street means
   nothing to think about; amber means stay sharp; red means avoid it if you can. */
App.map = (() => {
  "use strict";
  const { $, esc, ic, HOTEL, LEVEL, CAT_ICON, state, store, placeById, zoneAt, distKm, origin, meInNYC, lv, bullets, toast, streets } = App;

  const BEARING = 29; // turn the map so the avenues run straight up the screen: uptown is up
  const HOME_VIEW = { center: [-73.9905, 40.7555], zoom: 13.3 };
  const BASE = { day: "https://tiles.openfreemap.org/styles/positron", night: "https://tiles.openfreemap.org/styles/dark" };
  const INK = "#0d0f12", AMBER = "#f59e0b", RED = "#dc2626", BLUE = "#2563eb";
  const EXAMPLE = { lat: 40.758, lng: -73.9855, name: "Times Square" };
  const SEVEN = [{ name: "Times Sq–42 St", lat: 40.7553, lng: -73.987, stops: 1 }, { name: "5 Av–Bryant Park", lat: 40.7537, lng: -73.9819, stops: 2 }, { name: "Grand Central–42 St", lat: 40.7518, lng: -73.9768, stops: 3 }];
  const ZONE_LABEL = { home: "Hudson Yards", tunnel: "Lincoln Tunnel", pabt: "Port Authority", penn: "Penn Station", garment: "Garment District", tsq: "Times Square", hk: "Hell's Kitchen", midtown: "Midtown", nomad: "NoMad", chelsea: "Chelsea", flatiron: "Flatiron", park: "Central Park", uws: "Upper West Side", ues: "Upper East Side", village: "West Village", eastvillage: "East Village", soho: "SoHo", chinatown: "Chinatown", fidi: "Financial District", dumbo: "DUMBO" };
  const SHORT = { "hudson-yards": "Hudson Yards Shops", edge: "Edge", mercado: "Little Spain", highline: "High Line", whitney: "Whitney", moynihan: "Moynihan Food Hall", "bryant-park": "Bryant Park", nypl: "Public Library", "grand-central": "Grand Central", summit: "SUMMIT", "rock-tree": "Rockefeller Tree", "fifth-windows": "Fifth Ave windows", "st-patricks": "St. Patrick's", "radio-city": "Radio City", broadway: "Broadway", "empire-state": "Empire State", macys: "Macy's", morgan: "Morgan Library", "hells-kitchen": "Restaurant Row", "columbus-circle": "Columbus Circle Market", "central-park": "Central Park loop", met: "The Met", amnh: "Natural History Museum", "lincoln-center": "Lincoln Center", "union-square": "Union Sq Market", flatiron: "Flatiron & Eataly", "west-village": "West Village", "washington-square": "Washington Sq", soho: "SoHo", "911": "9/11 Memorial", "brooklyn-bridge": "Brooklyn Bridge", ferry: "Staten Island Ferry" };
  const FILTERS = [["all", "All places"], ["plan", ""], ["festive", "Festive"], ["sights", "Sights"], ["views", "Views"], ["museums", "Museums"], ["walks", "Parks & walks"], ["food", "Food"], ["shops", "Shopping"], ["shows", "Shows"]];
  const TIMES = [[null, "Follow the clock", ""], ["day", "Daytime", "Until 4:45 pm"], ["eve", "Evening", "4:45 to 10 pm"], ["late", "Late night", "After 10 pm"]];

  let map = null, ready = false, styleMode = null;
  let bandOverride = null; // null = follow the clock in New York
  let filter = "all", activeId = null, card = null, route = null, focusZoneId = null;
  let meMarker = null, activeMarker = null, stopMarkers = [];
  const images = {};

  const ll = (p) => [p.lng, p.lat];
  const band = () => bandOverride || streets.bandNow();
  const dark = () => band() !== "day";
  const zoneLevel = (z) => (dark() ? z.night : z.day);
  const pad = (bottom) => ({ top: 84, bottom: (bottom || 0) + 70, left: 44, right: 60 });
  const cardHeight = () => { const c = $("#mapCard"); return c.hidden ? 0 : c.offsetHeight; };
  const planDay = () => DAYS[state.dayIndex == null ? App.views.defaultDayIndex() : state.dayIndex];
  const planStops = () => [...new Set(planDay().steps.map((s) => s.place).filter(Boolean))].map((id) => placeById[id]);
  const filterLabel = (k) => (k === "plan" ? `${planDay().short === "Spare" ? "Spare day" : planDay().long.split(" ")[0]}'s plan` : FILTERS.find((f) => f[0] === k)[1]);

  function places() {
    if (filter === "plan") return planStops();
    const from = origin();
    return PLACES.filter((p) => filter === "all" || (filter === "festive" ? p.festive : p.cat === filter))
      .map((p) => ({ p, km: distKm(from, p) })).sort((a, b) => a.km - b.km).map((x) => x.p);
  }
  const fc = (features) => ({ type: "FeatureCollection", features });
  const line = (pts, props = {}) => ({ type: "Feature", properties: props, geometry: { type: "LineString", coordinates: pts } });
  const placesGeo = (list) => fc(list.map((p, i) => ({
    type: "Feature", properties: { id: p.id, name: SHORT[p.id] || p.name, rank: i, active: p.id === activeId ? 1 : 0 }, geometry: { type: "Point", coordinates: ll(p) },
  })));

  function buildImages() {
    const dot = (fill, stroke) => `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 14 14"><circle cx="7" cy="7" r="4.6" fill="${fill}" stroke="${stroke}" stroke-width="2"/></svg>`;
    const art = [["dot", 42, dot(INK, "#fff")], ["dot-night", 42, dot("#fff", "#0b0c0e")]];
    return Promise.all(art.map(([key, size, svg]) => new Promise((done) => {
      const img = new Image(size, size);
      img.onload = () => { images[key] = img; done(); };
      img.onerror = done;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    })));
  }

  /* ---------- basemap + our layers; rebuilt whenever the basemap changes (light <-> dark) ---------- */
  function tuneBase() {
    const night = styleMode === "night";
    map.getStyle().layers.forEach((l) => {
      if (/shield|airport|oneway|boundary|aeroway|ne2|water_name|waterway_line_label/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
      if (l.type === "symbol" && /highway[-_]name/.test(l.id)) {
        map.setPaintProperty(l.id, "text-color", night ? "#aab1bd" : "#5b6472");
        map.setLayoutProperty(l.id, "text-size", ["interpolate", ["linear"], ["zoom"], 13, 10, 16, 13]);
      }
      if (l.type === "symbol" && /^(label_|place_)/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
    });
  }
  function addOverlays() {
    const night = styleMode === "night";
    const base = map.getStyle().layers;
    let lastShape = -1;
    base.forEach((l, i) => { if (l.type !== "symbol") lastShape = i; });
    const under = (base[lastShape + 1] || {}).id; // above the roads, below every label
    const round = { "line-cap": "round", "line-join": "round" };
    const width = ["interpolate", ["exponential", 1.6], ["zoom"], 11, 1.6, 14, 4.5, 16, 9, 18, 18];

    map.addSource("flags", { type: "geojson", data: streets.flagged(band()) });
    map.addLayer({ id: "flag-1", type: "line", source: "flags", filter: ["==", ["get", "lv"], 1], layout: round, paint: { "line-color": AMBER, "line-width": width, "line-opacity": night ? 0.9 : 0.8 } }, under);
    map.addLayer({ id: "flag-2", type: "line", source: "flags", filter: ["==", ["get", "lv"], 2], layout: round, paint: { "line-color": RED, "line-width": width, "line-opacity": night ? 0.95 : 0.85 } }, under);

    map.addSource("zone-focus", { type: "geojson", data: fc([]) });
    map.addLayer({ id: "zone-focus", type: "line", source: "zone-focus", paint: { "line-color": night ? "#ffffff" : INK, "line-width": 1.5, "line-dasharray": [3, 3], "line-opacity": 0.7 } }, under);

    map.addSource("zone-names", { type: "geojson", data: fc(ZONES.filter((z) => ZONE_LABEL[z.id]).map((z) => ({
      type: "Feature", properties: { name: ZONE_LABEL[z.id].toUpperCase() },
      geometry: { type: "Point", coordinates: [z.poly.reduce((a, p) => a + p[1], 0) / z.poly.length, z.poly.reduce((a, p) => a + p[0], 0) / z.poly.length] },
    }))) });
    map.addLayer({ id: "zone-names", type: "symbol", source: "zone-names", minzoom: 11.5, maxzoom: 14.6, layout: {
      "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 11.5, 9, 14.5, 10.5],
      "text-letter-spacing": 0.16, "text-max-width": 7, "text-padding": 10,
    }, paint: { "text-color": night ? "#7f8898" : "#9097a3", "text-halo-color": night ? "#0b0c0e" : "#f6f6f4", "text-halo-width": 1.2 } });

    map.addSource("route", { type: "geojson", data: fc([]) });
    map.addLayer({ id: "route-ride", type: "line", source: "route", filter: ["==", ["get", "kind"], "ride"], layout: round, paint: { "line-color": night ? "#9db8ff" : BLUE, "line-width": 3, "line-dasharray": [0.1, 2.2], "line-opacity": 0.9 } });
    map.addLayer({ id: "route-case", type: "line", source: "route", filter: ["==", ["get", "kind"], "walk"], layout: round, paint: { "line-color": night ? "#0b0c0e" : "#ffffff", "line-width": 9 } });
    map.addLayer({ id: "route-line", type: "line", source: "route", filter: ["==", ["get", "kind"], "walk"], layout: round, paint: { "line-color": night ? "#6ea0ff" : BLUE, "line-width": 5 } });

    Object.entries(images).forEach(([k, img]) => { if (!map.hasImage("pin-" + k)) map.addImage("pin-" + k, img, { pixelRatio: 3 }); });
    map.addSource("places", { type: "geojson", data: placesGeo([]) });
    map.addLayer({ id: "places", type: "symbol", source: "places", filter: ["!=", ["get", "active"], 1], layout: {
      "icon-image": night ? "pin-dot-night" : "pin-dot", "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.75, 15, 1.1], "icon-allow-overlap": true, "icon-ignore-placement": false,
      "symbol-sort-key": ["get", "rank"], "text-optional": true,
      "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10.5, 16, 12.5],
      "text-max-width": 7.5, "text-line-height": 1.1, "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 0.75, "text-justify": "auto", "text-padding": 3,
    }, paint: { "text-color": night ? "#ffffff" : "#16191f", "text-halo-color": night ? "#0b0c0e" : "#ffffff", "text-halo-width": 1.6, "icon-opacity": night ? 0.95 : 1 } });

    ready = true;
    render();
  }

  /* ---------- the two controls at the top ---------- */
  function renderPills() {
    const b = band();
    $("#filterPill").innerHTML = `${filter === "plan" ? `<span class="bullet" style="--c:${planDay().color}">${esc(planDay().letter)}</span>` : ic("list")}<span>${esc(filterLabel(filter))}</span>${ic("chevron-down", "caret")}`;
    $("#timePill").innerHTML = `${ic(b === "day" ? "sun" : "moon")}<span>${streets.LABEL[b]}</span>${ic("chevron-down", "caret")}`;
    $("#timePill").classList.toggle("set", !!bandOverride);
    $("#view-map").classList.toggle("night", dark());
  }
  let menuOpen = null;
  function closeMenu() { menuOpen = null; $("#mapMenu").hidden = true; }
  function openMenu(which) {
    if (menuOpen === which) return closeMenu();
    menuOpen = which;
    const m = $("#mapMenu");
    const row = (attr, on, label, note) => `<li><button class="menu-row${on ? " on" : ""}" ${attr} role="menuitemradio" aria-checked="${on}"><span><b>${esc(label)}</b>${note ? `<small>${esc(note)}</small>` : ""}</span>${on ? ic("check") : ""}</button></li>`;
    if (which === "filter") m.innerHTML = `<ul role="menu">${FILTERS.map(([k]) => row(`data-mapfilter="${k}"`, k === filter, filterLabel(k), k === "plan" ? planDay().title : "")).join("")}</ul>`;
    else m.innerHTML = `<ul role="menu">${TIMES.map(([k, label, note]) => row(`data-mapband="${k || "auto"}"`, k === bandOverride, label, k ? note : `Now: ${streets.LABEL[streets.bandNow()].toLowerCase()} in New York`)).join("")}</ul>`;
    m.className = "map-menu " + (which === "filter" ? "left" : "right");
    m.hidden = false;
  }
  function syncBand() {
    renderPills();
    if (!map) return;
    const want = dark() ? "night" : "day";
    if (styleMode !== want) { styleMode = want; ready = false; map.setStyle(BASE[want], { diff: false }); return; }
    if (ready) { map.getSource("flags").setData(streets.flagged(band())); refreshCard(); }
  }
  function setBand(next) {
    bandOverride = next === "auto" ? null : next;
    closeMenu();
    if (route) rerunRoute(); else syncBand();
  }

  /* ---------- the card at the bottom: one thing at a time ---------- */
  function setCard(next) {
    card = next;
    const el = $("#mapCard"), view = $("#view-map");
    if (!card) { el.hidden = true; view.classList.remove("has-card"); return; }
    el.innerHTML = (card.type === "intro" ? "" : `<button class="x" data-act="map-card-close" aria-label="Close">${ic("x")}</button>`) + CARDS[card.type](card);
    el.hidden = false; view.classList.add("has-card");
  }
  const refreshCard = () => { if (card) setCard(card); };
  const walkText = (p) => {
    const from = origin(), mins = streets.minutes(from === HOTEL ? HOTEL : from, p);
    return mins && mins <= 60 ? `${mins} min walk ${meInNYC() ? "from you" : "from the hotel"}` : `${(distKm(from, p) * 0.621).toFixed(1)} miles ${meInNYC() ? "from you" : "from the hotel"}`;
  };
  const CARDS = {
    place(c) {
      const p = placeById[c.id], z = p.zone, level = z ? zoneLevel(z) : "easy";
      const stops = filter === "plan" ? planStops() : null, idx = stops ? stops.findIndex((x) => x.id === p.id) : -1;
      return `<p class="over">${idx >= 0 ? `Stop ${idx + 1} of ${stops.length} · ` : ""}${esc(CATS[p.cat].label)} · ${esc(p.area)}</p>
        <h3 class="mc-name">${esc(p.name)}</h3>
        <p class="mc-meta"><span>${walkText(p)}</span><span>${esc(p.price)}</span>${level !== "easy" ? lv(level, dark() ? (level === "skip" ? "Not after dark" : "Stay sharp after dark") : "Stay sharp") : ""}</p>
        <div class="mc-actions">
          <button class="btn primary" data-maproute="${p.id}">${ic("footprints")}Walking route</button>
          <button class="btn" data-place="${p.id}">Details</button>
          ${idx >= 0 ? `<span class="mc-step"><button class="btn sq" data-mapstep="-1" aria-label="Previous stop"${idx === 0 ? " disabled" : ""}>${ic("chevron-left")}</button><button class="btn sq" data-mapstep="1" aria-label="Next stop"${idx === stops.length - 1 ? " disabled" : ""}>${ic("chevron-right")}</button></span>` : ""}
        </div>`;
    },
    street(c) {
      const i = streets.info(c.e), b = band(), level = streets.level(c.e, b), n = i[b];
      const when = { day: "by day", eve: "in the evening", late: "late at night" }[b];
      const hot = n >= 3
        ? `${n} street incidents were recorded on this one block ${when} in the past year: robbery, assault or harassment. For a single block that is a lot, even allowing for the crowds.`
        : `This block sits in a run of streets that record more incidents ${when} than most of Manhattan, even allowing for the crowds.`;
      const text = {
        hot: `${hot} ${level === 2 ? "Take the next street over if you can. If you are passing through, keep moving, with your phone away." : "Fine to walk, with your bag closed and your phone in your pocket."}`,
        theft: "Pickpocketing and phone snatches are reported here more than on most blocks. Bag zipped and in front, phone away from the kerb.",
        empty: "Empty after dark. Tunnel ramps, bus garages and long blank walls, with nobody about. Walk round it on a street with shops, or ride.",
        park: "The park is for daylight. After dark, walk around it on the avenues or take a cab.",
      }[i.why] || "";
      return `<p class="over">${streets.LABEL[b]} · this block</p>
        <div class="mc-zone"><h3 class="mc-name">${esc(i.name || "This street")}</h3>${lv(level === 2 ? "skip" : "sharp", level === 2 ? "Avoid if you can" : "Stay sharp")}</div>
        <p class="mc-note">${text}</p>
        <button class="link" data-topic="method">How this is worked out</button>`;
    },
    zone(c) {
      const z = ZONES.find((x) => x.id === c.id), s = streets.zone(z.id), after = s ? s.eve + s.late : 0;
      const tier = s && s.tier != null ? ["fewer than most areas", "about typical for Manhattan", "more than most areas"][s.tier] : "";
      return `<p class="over">${streets.LABEL[band()]} · the neighbourhood</p>
        <div class="mc-zone"><h3 class="mc-name">${esc(z.name)}</h3>${lv(zoneLevel(z))}</div>
        <p class="mc-note">${esc(z.note)}</p>
        ${tier ? `<p class="mc-foot">${after} street incidents recorded here after dark in the past year, ${tier} for its size.</p>` : ""}`;
    },
    route(c) {
      const r = c.r, b = band(), home = c.to === HOTEL;
      const via = r.main.length ? `Via ${r.main.length > 1 ? r.main.slice(0, -1).join(", ") + " and " + r.main[r.main.length - 1] : r.main[0]}.` : "";
      const around = r.goesAround.length ? ` Goes around ${r.goesAround.join(" and ")}.` : "";
      const extra = r.minutes - r.shortestMinutes;
      const cost = extra >= 1 && r.goesAround.length ? ` ${extra} min longer than the direct way.` : "";
      const status = r.avoid > 50 ? lv("skip", "Passes blocks to avoid") : r.sharp > 80 ? lv("sharp", `${Math.round(r.sharp / 10) * 10} m on stay-sharp blocks`) : lv("easy", b === "day" ? "Relaxed streets all the way" : "Keeps to relaxed streets");
      const ride = home ? rideHome(c.from) : "";
      const advise = home && (b === "late" || r.minutes > 25 || r.avoid > 50);
      return `<p class="over">${streets.LABEL[b]} · safest walk</p>
        <h3 class="mc-name">${home ? "Home" : esc(SHORT[c.placeId] || c.name)} in <span class="num">${r.minutes}</span> min</h3>
        <p class="mc-note">${c.example ? `You're not in New York yet, so this is an example from ${esc(EXAMPLE.name)}. ` : ""}${esc(via + around + cost)}</p>
        <p class="mc-status">${status}</p>
        ${ride ? `<p class="mc-ride${advise ? " strong" : ""}"><b>${advise ? (b === "late" ? "Late at night, ride instead." : "Riding is easier.") : "Or ride."}</b> ${ride}</p>` : home && advise ? `<p class="mc-ride strong"><b>${b === "late" ? "Late at night, ride instead." : "It's a long walk."}</b> A yellow cab or an Uber to the door is the simple option.</p>` : ""}
        <div class="mc-actions"><a class="btn" href="${home ? App.dirUrl(App.hotelQuery) : App.placeDir(placeById[c.placeId])}" target="_blank" rel="noopener">${ic("arrow-up-right")}Open in Google Maps</a></div>`;
    },
    far(c) {
      const p = placeById[c.id];
      return `<p class="over">Too far to walk · ${esc(p.area)}</p>
        <h3 class="mc-name">${esc(p.name)}</h3>
        <p class="mc-ride strong">${p.lines.length ? `<span class="route-bullets">${bullets(p.lines)}</span>` : ""}${esc(p.go)}</p>
        <div class="mc-actions"><a class="btn primary" href="${App.placeDir(p)}" target="_blank" rel="noopener">${ic("navigation")}Directions</a><button class="btn" data-place="${p.id}">Details</button></div>`;
    },
    intro() {
      return `<p class="over">Reading the map</p>
        <ul class="mc-intro">
          <li><span class="sw sw-1"></span><span><b>Amber streets: stay sharp.</b> More street incidents are recorded here than on most blocks.</span></li>
          <li><span class="sw sw-2"></span><span><b>Red streets: avoid if you can.</b> A hot spot, or empty after dark.</span></li>
          <li>${ic("clock")}<span><b>It follows the clock.</b> The streets change in the evening and again late at night.</span></li>
          <li>${ic("navigation")}<span><b>Uptown is up.</b> Avenues run up the screen, cross streets side to side.</span></li>
        </ul>
        <button class="btn primary wide" data-act="map-intro-done">Got it</button>`;
    },
  };
  function rideHome(from) {
    const near = SEVEN.map((s) => ({ s, km: distKm(from, s) })).sort((a, b) => a.km - b.km)[0];
    if (near.km > 0.7) return "";
    return `${bullets(["7"])}from ${esc(near.s.name)}, ${near.s.stops} stop${near.s.stops === 1 ? "" : "s"} to Hudson Yards, then five minutes up Hudson Boulevard.`;
  }

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
    activeMarker = domMarker(`<span class="pin pin-on">${idx >= 0 ? `<b>${idx + 1}</b>` : ic(CAT_ICON[p.cat])}</span><span class="pin-tag">${esc(SHORT[p.id] || p.name)}</span>`, ll(p), () => App.views.openPlace(p.id), "mk-top");
  }

  /* ---------- routes ---------- */
  function drawRoute(features, fitPoints) {
    if (!ready) return;
    map.getSource("route").setData(fc(features));
    if (fitPoints) {
      const b = new maplibregl.LngLatBounds(fitPoints[0], fitPoints[0]);
      fitPoints.forEach((pt) => b.extend(pt));
      map.fitBounds(b, { padding: pad(cardHeight()), bearing: BEARING, maxZoom: 15.5, duration: 600 });
    }
  }
  function showRoute(spec) { // spec: { from, to, name, placeId, example }
    const r = streets.route(spec.from, spec.to, band());
    if (!r || r.minutes > 45) return false;
    route = spec; activeId = spec.placeId || null;
    if (ready) { map.getSource("places").setData(placesGeo([])); placeActive(); }
    setCard({ type: "route", r, ...spec });
    drawRoute([line(r.line, { kind: "walk" })], r.line);
    return true;
  }
  function rerunRoute() { const spec = route; syncBand(); const again = () => showRoute(spec); if (ready) again(); else map.once("idle", again); }
  function clearRoute() {
    if (!route) return;
    route = null;
    if (ready && filter !== "plan") { map.getSource("route").setData(fc([])); map.getSource("places").setData(placesGeo(places())); }
  }
  function routeToPlace(id) {
    const p = placeById[id], from = meInNYC() ? state.me : HOTEL;
    if (!showRoute({ from, to: p, name: p.name, placeId: id })) { clearRoute(); setCard({ type: "far", id }); }
  }
  function wayHome() {
    App.views.show("map");
    if (!map) return;
    const go = (from, example) => {
      const run = () => { if (!showRoute({ from, to: HOTEL, example })) { clearRoute(); toast(example ? "Couldn't draw that route." : "That's too far to walk. Take the subway or a cab."); } };
      if (ready) run(); else map.once("idle", run);
    };
    if (meInNYC()) return go(state.me);
    toast("Finding you…");
    App.locate((pos) => { showMe(pos); if (meInNYC()) go(pos); else { toast("You're not in New York yet, so here is an example."); go(EXAMPLE, true); } }, true, () => { toast("Couldn't find you, so here is an example."); go(EXAMPLE, true); });
  }

  /* ---------- drawing the current selection ---------- */
  function render(fit) {
    renderPills();
    if (!map || !ready) return;
    const list = places(), plan = filter === "plan";
    if (activeId && !list.some((p) => p.id === activeId)) { activeId = null; if (card && card.type === "place") setCard(null); }
    stopMarkers.forEach((mk) => mk.remove()); stopMarkers = [];
    map.getSource("places").setData(placesGeo(plan || route ? [] : list)); // a route or a plan gets the map to itself
    map.getSource("flags").setData(streets.flagged(band()));
    const z = focusZoneId && ZONES.find((x) => x.id === focusZoneId);
    map.getSource("zone-focus").setData(fc(z ? [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...z.poly.map(([y, x]) => [x, y]), [z.poly[0][1], z.poly[0][0]]]] } }] : []));
    if (plan) {
      // a light connector showing the order of the day; the walking route itself is one tap away on each stop
      map.getSource("route").setData(fc([line([ll(HOTEL), ...list.map(ll)], { kind: "ride" })]));
      map.setPaintProperty("route-ride", "line-color", planDay().color);
      list.forEach((p, i) => { if (p.id !== activeId) stopMarkers.push(domMarker(`<span class="stop-pin" style="--c:${planDay().color}"><b>${i + 1}</b></span>`, ll(p), () => select(p.id))); });
    } else if (!route) map.getSource("route").setData(fc([]));
    if (!plan) map.setPaintProperty("route-ride", "line-color", styleMode === "night" ? "#9db8ff" : BLUE);
    placeActive();
    if (fit === "home") map.easeTo({ center: HOME_VIEW.center, zoom: HOME_VIEW.zoom, bearing: BEARING, duration: 600 });
    else if (fit && list.length) {
      const b = new maplibregl.LngLatBounds(ll(HOTEL), ll(HOTEL));
      list.forEach((p) => b.extend(ll(p)));
      map.fitBounds(b, { padding: pad(cardHeight()), bearing: BEARING, maxZoom: 15, duration: 600 });
    }
  }
  function select(id, opts = {}) {
    clearRoute(); focusZoneId = null;
    activeId = id;
    setCard({ type: "place", id });
    render();
    const p = placeById[id];
    if (opts.pan !== false && p) map.easeTo({ center: ll(p), zoom: Math.max(map.getZoom(), opts.zoom || 14.2), offset: [0, -cardHeight() / 2 + 20], duration: 500 });
  }
  function deselect() {
    closeMenu();
    if (!activeId && !card && !route && !focusZoneId) return;
    activeId = null; focusZoneId = null; clearRoute(); setCard(null);
    if (ready) render();
  }
  function setFilter(next) {
    closeMenu(); clearRoute(); focusZoneId = null;
    filter = next; activeId = null; setCard(null);
    render(filter === "all" ? "home" : true);
    if (filter === "plan") { const first = planStops()[0]; if (first) setTimeout(() => select(first.id, { pan: false }), 60); }
  }
  function step(delta) {
    const stops = planStops(), next = stops[stops.findIndex((p) => p.id === activeId) + delta];
    if (next) select(next.id);
  }

  /* ---------- setup ---------- */
  function init() {
    if (map) return;
    const holder = $("#map");
    if (typeof maplibregl === "undefined") { holder.innerHTML = `<p class="map-fail">The map couldn't load. Check your connection and open this tab again.</p>`; return; }
    try {
      map = new maplibregl.Map({
        container: "map", style: BASE[dark() ? "night" : "day"], center: HOME_VIEW.center, zoom: HOME_VIEW.zoom, bearing: BEARING,
        minZoom: 11, maxZoom: 18, attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
      });
    } catch (e) { map = null; holder.innerHTML = `<p class="map-fail">This browser can't draw the map. Everything else in the guide still works.</p>`; return; }
    styleMode = dark() ? "night" : "day";
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.on("moveend", () => { if (Math.abs(map.getBearing() - BEARING) > 0.5) map.setBearing(BEARING); });
    map.on("movestart", closeMenu);

    // Re-attach our layers whenever a basemap finishes loading (first load, and each light/dark switch).
    const ensure = () => {
      if (!map.isStyleLoaded() || map.getSource("flags")) return;
      try { tuneBase(); addOverlays(); holder.classList.add("is-ready"); } catch (err) { console.error("map layers: " + err.message); }
    };
    buildImages().then(() => { map.on("styledata", ensure); map.on("idle", ensure); ensure(); });
    // If the vector basemap can't be reached, fall back to plain OpenStreetMap tiles, toned down to grey.
    setTimeout(() => {
      if (!map || map.getSource("flags")) return;
      map.setStyle({
        version: 8, glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
        sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19 } },
        layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.9, "raster-contrast": -0.15, "raster-brightness-max": dark() ? 0.45 : 1 } }],
      }, { diff: false });
    }, 10000);

    domMarker(`<span class="pin pin-home">${ic("house")}</span><span class="pin-tag">${esc(HOTEL.name)}</span>`, ll(HOTEL), () => App.views.openDriver(), "mk-top");
    STATIONS.forEach((s) => domMarker(`<span class="stn">${bullets(s.lines)}</span>`, [s.lng, s.lat], () => toast(`${s.name}${s.home ? " · your station" : ""}`), "mk-stn" + (s.home ? " mk-stn-home" : "")));
    const onZoom = () => { const z = map.getZoom(), c = map.getContainer().classList; c.toggle("z-far", z < 12.6); c.toggle("z-mid", z < 14); };
    map.on("zoom", onZoom); onZoom();

    map.on("click", (e) => {
      closeMenu();
      if (!ready || (card && card.type === "intro")) return;
      const box = (r) => [[e.point.x - r, e.point.y - r], [e.point.x + r, e.point.y + r]];
      const hits = map.queryRenderedFeatures(box(18), { layers: ["places"] });
      if (hits.length) {
        let best = hits[0], gap = Infinity;
        hits.forEach((f) => { const pt = map.project(f.geometry.coordinates), d = Math.hypot(pt.x - e.point.x, pt.y - e.point.y); if (d < gap) { gap = d; best = f; } });
        return select(best.properties.id, { pan: false });
      }
      const flag = map.queryRenderedFeatures(box(9), { layers: ["flag-2", "flag-1"] }).sort((a, b) => b.properties.lv - a.properties.lv)[0];
      if (flag) { activeId = null; focusZoneId = null; clearRoute(); setCard({ type: "street", e: flag.properties.e }); return render(); }
      if (!route) deselect();
    });

    syncBand();
    if (!store.get("mapIntro2", false)) setCard({ type: "intro" });
  }

  function onShow() {
    const first = !map;
    init();
    if (!map) return;
    map.resize();
    if (!first) { syncBand(); if (ready) render(); }
  }
  function showMe(pos) {
    if (!map) return;
    if (!meMarker) meMarker = domMarker(`<span class="me-dot"></span>`, ll(pos), null, "mk-top");
    else meMarker.setLngLat(ll(pos));
  }
  function locateMe() {
    toast("Finding you…");
    App.locate((pos) => {
      showMe(pos);
      if (!meInNYC()) { toast("You're not in New York yet. Showing the hotel."); return goHome(); }
      clearRoute(); activeId = null; focusZoneId = null; setCard(null); render();
      map.easeTo({ center: ll(pos), zoom: 15.5, bearing: BEARING, duration: 500 });
      const z = zoneAt(pos.lat, pos.lng);
      if (z) toast(`${ZONE_LABEL[z.id] || z.name}: ${zoneLevel(z) === "easy" ? "relaxed" : zoneLevel(z) === "sharp" ? "stay sharp" : "not for walking"} ${dark() ? "after dark" : "by day"}`);
    });
  }
  function goHome() { if (map) { deselect(); map.easeTo({ center: ll(HOTEL), zoom: 15, bearing: BEARING, duration: 500 }); } }

  /* ---------- entry points used by the rest of the app ---------- */
  const whenReady = (fn) => { if (ready) fn(); else map.once("idle", fn); };
  function focusPlace(id) {
    App.views.show("map");
    if (!map) return;
    if (filter !== "all" && !places().some((p) => p.id === id)) filter = "all";
    whenReady(() => select(id, { zoom: 15.5 }));
  }
  function focusZone(id, night) {
    if (night && !dark()) bandOverride = "eve";
    App.views.show("map");
    if (!map) return;
    whenReady(() => {
      const z = ZONES.find((x) => x.id === id);
      clearRoute(); activeId = null; focusZoneId = id; setCard({ type: "zone", id }); render();
      const b = new maplibregl.LngLatBounds();
      z.poly.forEach(([y, x]) => b.extend([x, y]));
      map.fitBounds(b, { padding: pad(cardHeight()), bearing: BEARING, maxZoom: 15.2, duration: 600 });
    });
  }
  function showPlan() { App.views.show("map"); if (map) whenReady(() => setFilter("plan")); }
  function introDone() { store.set("mapIntro2", true); setCard(null); }

  return { onShow, setFilter, setBand, openMenu, locateMe, goHome, wayHome, routeToPlace, focusPlace, focusZone, showPlan, deselect, step, introDone,
    tick: () => { if (map && !bandOverride) syncBand(); }, instance: () => map };
})();
