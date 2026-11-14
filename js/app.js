/* Your New York — app logic. Content lives in data.js. */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HOTEL = TRIP.hotel;
  const LEVEL = {
    easy: { label: "Relaxed", color: "#1f8a4c" },
    sharp: { label: "Stay sharp", color: "#d98a00" },
    skip: { label: "Skip", color: "#c8321e" },
  };
  const RANK = { easy: 0, sharp: 1, skip: 2 };


  /* ---------- icons (one consistent stroke set) ---------- */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8z"/>',
    car: '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2M18 17v2M7.5 14h.01M16.5 14h.01"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    tree: '<path d="M12 3l4.5 5.5H14l4 5h-3l4 5.500H5l4-5.500H6l4-5H7.500zM12 19v2.500"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    museum: '<path d="M3 21h18M5 21V10M19 21V10M9.500 21V10M14.500 21V10M3 10l9-6 9 6z"/>',
    leaf: '<path d="M12 22v-7M7 15a5 5 0 0 1-1-9.500 6 6 0 0 1 12 0A5 5 0 0 1 17 15z"/>',
    food: '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18M17 21V3c-2 1.500-3 4-3 8h3"/>',
    bag: '<path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM9 8V6a3 3 0 0 1 6 0v2"/>',
    ticket: '<path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6zM14 5v3M14 11v2M14 16v3"/>',
    heart: '<path d="M12 20s-7-4.500-9-9.200C1.700 7.300 4 4 7.200 4 9.100 4 10.800 5 12 6.800 13.200 5 14.900 4 16.800 4 20 4 22.300 7.300 21 10.800 19 15.500 12 20 12 20z"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500 19 19M19 5l-1.500 1.500M6.500 17.500 5 19"/>',
    moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z"/>',
    pin: '<path d="M12 21s-7-6.200-7-11a7 7 0 0 1 14 0c0 4.800-7 11-7 11z"/><circle cx="12" cy="10" r="2.500"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  };
  const ic = (name) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(ICONS[name] || "").replace(/(\d)\.(\d)00\b/g, "$1.$2")}</svg>`;
  Object.values(CATS).forEach((c) => { c.glyph = ic(c.icon); });

  /* ---------- storage ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("nyc." + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem("nyc." + key, JSON.stringify(value)); } catch (e) { /* private mode */ } },
  };
  let settings = store.get("settings", { her: "", partner: "", phone: "" });
  let saved = new Set(store.get("saved", []));

  /* ---------- New York clock ---------- */
  const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  function nyNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TRIP.tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "long",
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute), weekday: p.weekday };
  }
  const SUNSET = hm(TRIP.sunset), SUNRISE = hm(TRIP.sunrise);
  const isDarkNow = () => { const m = nyNow().minutes; return m >= SUNSET + 15 || m < SUNRISE - 15; };
  const dayDiff = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
  const fmtClock = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const fmtSpan = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`);

  /* ---------- geometry ---------- */
  function distKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function fmtDist(km) {
    const street = km * 1.3; // street-grid walking is longer than a straight line
    const mi = km * 0.621;
    if (street < 2.2) return `${Math.max(1, Math.round(street * 12.5))} min walk`;
    return `${mi.toFixed(1)} mi`;
  }
  function inPoly(lat, lng, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [yi, xi] = poly[i], [yj, xj] = poly[j];
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function zoneAt(lat, lng) {
    let best = null;
    for (const z of ZONES) if (inPoly(lat, lng, z.poly) && (!best || RANK[z.night] > RANK[best.night])) best = z;
    return best;
  }
  PLACES.forEach((p) => { p.zone = zoneAt(p.lat, p.lng); });
  const placeById = Object.fromEntries(PLACES.map((p) => [p.id, p]));

  /* ---------- links ---------- */
  const hotelQuery = `${HOTEL.name}, ${HOTEL.address}, ${HOTEL.cityLine}`;
  const dirUrl = (dest) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=transit`;
  const placeDir = (p) => dirUrl(`${p.name}, New York, NY`);
  const searchUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  /* ---------- small renderers ---------- */
  const BUS = new Set(["M34"]);
  const bullets = (lines) => (lines || []).map((l) => (BUS.has(l) ? `<span class="bus">${l}</span>` : `<span class="bullet b-${l}">${l}</span>`)).join("");
  const lv = (level, text) => `<span class="lv lv-${level}">${esc(text || LEVEL[level].label)}</span>`;
  const partnerName = () => settings.partner || "him";

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  /* ---------- location ---------- */
  let me = null;
  function locate(onDone, quiet) {
    if (!navigator.geolocation) { if (!quiet) toast("This phone isn't sharing its location."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { me = { lat: pos.coords.latitude, lng: pos.coords.longitude }; onDone && onDone(me); },
      () => { if (!quiet) toast("Couldn't get your location — check the browser has permission."); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }
  // Only treat her location as meaningful if she is actually in or near the city.
  const meInNYC = () => me && distKm(me, HOTEL) < 40;
  const origin = () => (meInNYC() ? me : HOTEL);

  /* =========================================================
     TODAY
     ========================================================= */
  let dayIndex = null;
  function defaultDayIndex() {
    const today = nyNow().date;
    const i = DAYS.findIndex((d) => d.date === today);
    return i >= 0 ? i : 0;
  }

  function statusBlock() {
    const now = nyNow();
    const before = dayDiff(now.date, TRIP.start);
    const after = dayDiff(TRIP.end, now.date);
    const inTrip = before <= 0 && after <= 0;
    const m = now.minutes;
    const name = settings.her ? `, ${esc(settings.her)}` : "";
    let eyebrow, head, line = "", meter = "";
    if (before > 0) {
      eyebrow = "Wed 9 – Sun 13 December";
      head = `<span class="hero-num">${before}</span><span class="hero-unit">${before === 1 ? "day" : "days"} to go</span>`;
      line = `Sunset is at ${fmtClock(SUNSET)} in December. Every day plan below is built around that.`;
    } else if (after > 0) {
      eyebrow = "9 – 13 December";
      head = `<span class="hero-title">Back home${name}</span>`;
      line = "Everything here still works as a scrapbook.";
    } else {
      const n = dayDiff(TRIP.start, now.date) + 1;
      const hello = m < 12 * 60 ? "Good morning" : m < SUNSET ? "Good afternoon" : "Good evening";
      eyebrow = `${now.weekday} · Day ${n} of 5 · ${fmtClock(m)}`;
      head = `<span class="hero-title">${hello}${name}</span>`;
      if (m < SUNRISE) line = `Still dark. Sunrise is at ${fmtClock(SUNRISE)}.`;
      else if (m < SUNSET) line = `<b>${fmtSpan(SUNSET - m)}</b> of daylight left. Do parks and quiet streets before ${fmtClock(SUNSET)}.`;
      else line = `<b>It's dark now.</b> Stick to busy streets — the map is showing after-dark guidance.`;
      const pct = Math.max(0, Math.min(100, ((m - SUNRISE) / (SUNSET - SUNRISE)) * 100));
      meter = `<div class="meter" role="img" aria-label="Daylight: sunrise ${fmtClock(SUNRISE)}, sunset ${fmtClock(SUNSET)}"><div class="meter-track"><span style="width:${pct}%"></span></div><div class="meter-ends"><span>${ic("sun")} ${fmtClock(SUNRISE)}</span><span>${fmtClock(SUNSET)} ${ic("moon")}</span></div></div>`;
    }
    return `<div class="status hero${inTrip && (m >= SUNSET || m < SUNRISE) ? " is-night" : ""}">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h2>${head}</h2>
      <p class="hero-line">${line}</p>
      ${meter}
      <div class="hero-foot">
        <div><small>Home base</small><b>${esc(HOTEL.name)}, ${esc(HOTEL.area)}</b></div>
        <div id="weather" class="weather"></div>
      </div>
    </div>`;
  }

  function actionGrid() {
    const call = settings.phone
      ? `<a class="act" href="tel:${esc(settings.phone.replace(/[^\d+]/g, ""))}">${ic("phone")}<b>Call ${esc(partnerName())}</b></a>`
      : `<button class="act" data-act="settings">${ic("phone")}<b>Add a number</b></button>`;
    return `<div class="acts">
      <a class="act act-main" href="${dirUrl(hotelQuery)}" target="_blank" rel="noopener">${ic("nav")}<span><b>Take me home</b><small>Directions to ${esc(HOTEL.name)} from where you are</small></span>${ic("chev")}</a>
      <button class="act" data-act="driver">${ic("car")}<b>Show a driver</b></button>
      <button class="act" data-act="share">${ic("send")}<b>Send location</b></button>
      ${call}
    </div>`;
  }

  function dayBlock() {
    const d = DAYS[dayIndex];
    const chips = DAYS.map((x, i) => `<button class="chip${i === dayIndex ? " on" : ""}" data-day="${i}">${x.short}${x.date === nyNow().date ? " ·" : ""}</button>`).join("");
    const steps = d.steps.map((s) => {
      const p = s.place && placeById[s.place];
      const inner = `<span class="step-time">${esc(s.time)}</span><span class="step-body">${p ? `<b>${esc(p.name)}</b>` : ""}<span>${esc(s.text)}</span></span>`;
      return p ? `<li><button class="step" data-place="${p.id}">${inner}<span class="chev" aria-hidden="true">${ic("chev")}</span></button></li>` : `<li><div class="step">${inner}</div></li>`;
    }).join("");
    return `<section class="block">
      <div class="chips" role="group" aria-label="Choose a day">${chips}</div>
      <div class="plan">
        <p class="eyebrow">${d.solo ? "Solo day" : "With " + esc(partnerName())}${d.date === "spare" ? " · swap in any day" : ""}</p>
        <h3>${esc(d.title)}</h3>
        <p class="sub">${esc(d.sub)}</p>
        <p>${esc(d.intro)}</p>
        <ol class="steps">${steps}</ol>
        ${d.home ? `<div class="home-note"><b>Getting home</b><p>${esc(d.home)}</p></div>` : ""}
      </div>
    </section>`;
  }

  function nearBlock() {
    const from = origin();
    const list = PLACES.map((p) => ({ p, km: distKm(from, p) })).sort((a, b) => a.km - b.km).slice(0, 4);
    const rows = list.map(({ p, km }) => `<li><button class="row" data-place="${p.id}"><span class="tile t-${p.cat}">${CATS[p.cat].glyph}</span><span class="row-body"><b>${esc(p.name)}</b><small>${fmtDist(km)} · ${esc(p.cost)}</small></span><span class="chev" aria-hidden="true">${ic("chev")}</span></button></li>`).join("");
    return `<section class="block">
      <div class="block-head"><h3>${meInNYC() ? "Near you now" : "Nearest to the hotel"}</h3><button class="link" data-act="near">${meInNYC() ? "Refresh" : "Use my location"}</button></div>
      <ul class="rows">${rows}</ul>
    </section>`;
  }

  function listingsBlock() {
    return `<section class="block">
      <div class="block-head"><h3>What's on today</h3></div>
      <p class="muted">Live listings — pop-ups, gigs, one-off events — from people who update them daily.</p>
      <ul class="rows">${LISTINGS.map((l) => `<li><a class="row" href="${l.url}" target="_blank" rel="noopener"><span class="row-body"><b>${esc(l.name)}</b><small>${esc(l.note)}</small></span><span class="chev" aria-hidden="true">${ic("ext")}</span></a></li>`).join("")}</ul>
    </section>`;
  }

  function renderToday() {
    if (dayIndex === null) dayIndex = defaultDayIndex();
    $("#view-today").innerHTML = statusBlock() + actionGrid() + dayBlock() + nearBlock() + listingsBlock();
    renderWeather();
  }

  /* ---------- weather (Open-Meteo, no key) ---------- */
  const WMO = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Showers", 81: "Showers", 82: "Heavy showers", 85: "Snow showers", 86: "Snow showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm" };
  const cf = (c) => `${Math.round(c)}°C <span class="f">/ ${Math.round(c * 9 / 5 + 32)}°F</span>`;
  let weather = null;
  function loadWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${HOTEL.lat}&longitude=${HOTEL.lng}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=${encodeURIComponent(TRIP.tz)}&forecast_days=16`;
    fetch(url).then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { weather = j; renderWeather(); }).catch(() => {});
  }
  function renderWeather() {
    const el = $("#weather");
    if (!el) return;
    const now = nyNow();
    const inTrip = dayDiff(now.date, TRIP.start) <= 0 && dayDiff(TRIP.end, now.date) <= 0;
    const typical = `<small>Typical weather</small><b>3–8°C <span class="f">· 37–46°F</span></b>`;
    if (!weather) { el.innerHTML = typical; return; }
    const d = weather.daily;
    if (inTrip) {
      const c = weather.current, i = Math.max(0, d.time.indexOf(now.date));
      el.innerHTML = `<small>${esc(WMO[c.weather_code] || "Now")} · feels ${Math.round(c.apparent_temperature)}° · ${d.precipitation_probability_max[i] ?? 0}% rain</small><b>${cf(c.temperature_2m)}</b>`;
      return;
    }
    const days = DAYS.filter((x) => d.time.includes(x.date)).map((x) => {
      const i = d.time.indexOf(x.date);
      return `${x.short} ${Math.round(d.temperature_2m_max[i])}°`;
    });
    el.innerHTML = days.length ? `<small>Forecast highs, °C</small><b>${days.join(" · ")}</b>` : typical;
  }

  /* =========================================================
     EXPLORE
     ========================================================= */
  let filter = "all";
  const FILTERS = [["all", "All"], ["saved", "Saved"], ["festive", "Festive"], ["free", "Free"], ["indoor", "Indoors"], ["sights", "Sights"], ["views", "Views"], ["museums", "Museums"], ["walks", "Walks"], ["food", "Food"], ["shops", "Shops"], ["shows", "Shows"]];
  function matches(p) {
    if (filter === "all") return true;
    if (filter === "saved") return saved.has(p.id);
    if (filter === "festive") return !!p.festive;
    if (filter === "free") return !!p.free;
    if (filter === "indoor") return !!p.indoor;
    return p.cat === filter;
  }
  function renderExplore() {
    const from = origin();
    const dark = isDarkNow();
    const list = PLACES.filter(matches).map((p) => ({ p, km: distKm(from, p) })).sort((a, b) => a.km - b.km);
    const cards = list.map(({ p, km }) => {
      const level = p.zone ? (dark ? p.zone.night : p.zone.day) : "easy";
      return `<li><article class="card">
        <button class="card-main" data-place="${p.id}">
          <span class="tile t-${p.cat}">${CATS[p.cat].glyph}</span>
          <span class="card-text">
            <span class="eyebrow">${esc(CATS[p.cat].label)} · ${esc(p.area)}</span>
            <h3>${esc(p.name)}</h3>
            <p>${esc(p.blurb)}</p>
            <span class="meta"><span>${fmtDist(km)} ${meInNYC() ? "from you" : "from hotel"}</span><span>${esc(p.cost)}</span>${p.zone && level !== "easy" ? lv(level, dark ? (level === "skip" ? "Not after dark" : "Stay sharp tonight") : "Stay sharp") : ""}</span>
          </span>
        </button>
        <button class="heart${saved.has(p.id) ? " on" : ""}" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="Save ${esc(p.name)}">${ic("heart")}</button>
      </article></li>`;
    }).join("");
    $("#view-explore").innerHTML = `
      <div class="filterbar"><div class="chips scroll" role="group" aria-label="Filter">${FILTERS.map(([k, l]) => `<button class="chip${k === filter ? " on" : ""}" data-filter="${k}">${l}</button>`).join("")}</div></div>
      <div class="pad">
        <p class="muted">${list.length} place${list.length === 1 ? "" : "s"}, nearest first${meInNYC() ? "" : " (from the hotel)"}. <button class="link" data-act="near">${meInNYC() ? "Update my location" : "Sort from where I am"}</button></p>
        ${list.length ? `<ul class="cards">${cards}</ul>` : `<p class="empty">Nothing saved yet. Tap the heart on anything you like the look of and it'll collect here.</p>`}
      </div>`;
  }

  /* ---------- place sheet ---------- */
  function openPlace(id) {
    const p = placeById[id];
    if (!p) return;
    const z = p.zone;
    const zoneHtml = z ? `<div class="zone-line"><span>By day ${lv(z.day)}</span><span>After dark ${lv(z.night)}</span></div><p class="muted small">${esc(z.name)} — ${esc(z.note)}</p>` : "";
    openSheet(`
      <div class="sheet-head"><span class="tile t-${p.cat}">${CATS[p.cat].glyph}</span><p class="eyebrow">${esc(CATS[p.cat].label)} · ${esc(p.area)}</p></div>
      <h2 id="sheetTitle">${esc(p.name)}</h2>
      <p>${esc(p.blurb)}</p>
      <div class="tipbox"><b>Tip</b><p>${esc(p.tip)}</p></div>
      <dl class="facts">
        <div><dt>When</dt><dd>${esc(p.when)}</dd></div>
        <div><dt>Cost</dt><dd>${esc(p.cost)}</dd></div>
        <div><dt>From the hotel</dt><dd>${bullets(p.lines)} ${esc(p.go)}</dd></div>
      </dl>
      ${zoneHtml}
      <div class="btns">
        <a class="btn primary" href="${placeDir(p)}" target="_blank" rel="noopener">${ic("nav")} Directions from here</a>
        <button class="btn" data-showmap="${p.id}">${ic("map")} Map</button>
        <a class="btn" href="${p.url}" target="_blank" rel="noopener">Website ${ic("ext")}</a>
        <button class="btn${saved.has(p.id) ? " on" : ""}" data-save="${p.id}" aria-pressed="${saved.has(p.id)}">${ic("heart")} ${saved.has(p.id) ? "Saved" : "Save"}</button>
      </div>`);
  }

  let lastFocus = null;
  function openSheet(html) {
    lastFocus = document.activeElement;
    const s = $("#sheet");
    s.innerHTML = `<span class="grab" aria-hidden="true"></span><button class="sheet-close" data-act="close" aria-label="Close">×</button><div class="sheet-body">${html}</div>`;
    s.setAttribute("aria-labelledby", "sheetTitle");
    s.hidden = false; $("#scrim").hidden = false;
    s.scrollTop = 0;
    $(".sheet-close", s).focus();
  }
  function closeSheet() {
    $("#sheet").hidden = true; $("#scrim").hidden = true; $("#driver").hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openSettings() {
    openSheet(`
      <h2 id="sheetTitle">Make it yours</h2>
      <p class="muted">Stays on this phone only. Nothing is sent anywhere.</p>
      <form id="settingsForm" class="form">
        <label>Your name<input name="her" autocomplete="given-name" value="${esc(settings.her)}" placeholder="Shown in the title"></label>
        <label>Who to call<input name="partner" value="${esc(settings.partner)}" placeholder="His name"></label>
        <label>Their mobile number<input name="phone" type="tel" inputmode="tel" value="${esc(settings.phone)}" placeholder="+1 … or +44 …"></label>
        <button class="btn primary" type="submit">Save</button>
      </form>
      <p class="muted small">Tip: also share your live location for the day in WhatsApp, Google Maps or Find My — it updates on its own while you walk.</p>`);
  }

  function openDriver() {
    lastFocus = document.activeElement;
    const d = $("#driver");
    d.innerHTML = `<button class="sheet-close" data-act="close" aria-label="Close">×</button>
      <p class="eyebrow">Please take me to</p>
      <p class="driver-big">10th Avenue<br>&amp; 35th Street</p>
      <p class="driver-mid">${esc(HOTEL.name)} · ${esc(HOTEL.address)}</p>
      <p class="driver-small">${esc(HOTEL.cross)}, ${esc(HOTEL.area)}<br>${esc(HOTEL.cityLine)}</p>
      <button class="btn" data-act="copy">${ic("copy")} Copy address</button>`;
    d.hidden = false;
    $(".sheet-close", d).focus();
  }

  function shareLocation() {
    toast("Finding you…");
    locate((pos) => {
      const url = `https://maps.google.com/?q=${pos.lat.toFixed(5)},${pos.lng.toFixed(5)}`;
      const text = `I'm here right now: ${url}`;
      if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
      if (settings.phone) { location.href = `sms:${settings.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(text)}`; return; }
      copy(text, "Location link copied — paste it into a message.");
    });
  }
  function copy(text, msg) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(msg), () => toast(text));
  }

  /* =========================================================
     MAP
     ========================================================= */
  let map = null, zoneLayers = [], markers = {}, meMarker = null;
  let mapMode = null; // "day" | "night"; null = follow the clock
  const currentMode = () => mapMode || (isDarkNow() ? "night" : "day");

  function zoneStyle(z) {
    const level = z[currentMode()];
    return { color: LEVEL[level].color, weight: level === "skip" ? 2 : 1, dashArray: level === "skip" ? "6 5" : null, opacity: 0.9, fillColor: LEVEL[level].color, fillOpacity: level === "easy" ? 0.14 : level === "sharp" ? 0.28 : 0.36 };
  }
  function paintZones() {
    zoneLayers.forEach(({ z, layer }) => layer.setStyle(zoneStyle(z)));
    const m = currentMode();
    $("#modeDay").setAttribute("aria-pressed", m === "day");
    $("#modeNight").setAttribute("aria-pressed", m === "night");
    $("#view-map").classList.toggle("night", m === "night");
  }
  function showZone(z) {
    const m = currentMode();
    const c = $("#zoneCard");
    c.innerHTML = `<button class="sheet-close" data-act="zoneclose" aria-label="Close">×</button>
      <p class="eyebrow">${m === "night" ? "After dark" : "Daytime"}</p>
      <h3>${esc(z.name)} ${lv(z[m])}</h3>
      <p>${esc(z.note)}</p>
      <p class="muted small">${m === "night" ? "By day: " + LEVEL[z.day].label : "After dark: " + LEVEL[z.night].label}</p>`;
    c.hidden = false;
  }

  function initMap() {
    if (map || typeof L === "undefined") return;
    map = L.map("map", { zoomControl: false, attributionControl: true, minZoom: 11, maxZoom: 18 }).setView([HOTEL.lat, HOTEL.lng], 14);
    map.attributionControl.setPrefix(false);
    const carto = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd", maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    let fellBack = false;
    carto.on("tileerror", () => {
      if (fellBack || !navigator.onLine) return;
      fellBack = true;
      map.removeLayer(carto);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map).bringToBack();
    });

    ZONES.forEach((z) => {
      const layer = L.polygon(z.poly, zoneStyle(z)).addTo(map);
      layer.on("click", (e) => { L.DomEvent.stopPropagation(e); showZone(z); });
      zoneLayers.push({ z, layer });
    });
    map.on("click", () => { $("#zoneCard").hidden = true; });

    PLACES.forEach((p) => {
      const icon = L.divIcon({ className: "pin-wrap", html: `<span class="pin">${CATS[p.cat].glyph}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
      markers[p.id] = L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name }).addTo(map).on("click", () => openPlace(p.id));
    });
    L.marker([HOTEL.lat, HOTEL.lng], {
      icon: L.divIcon({ className: "pin-wrap", html: `<span class="pin pin-home">${ic("home")}</span>`, iconSize: [42, 42], iconAnchor: [21, 21] }),
      title: "The Set — your hotel", zIndexOffset: 1000,
    }).addTo(map).on("click", openDriver);

    paintZones();
  }
  function showMe(pan) {
    locate((pos) => {
      if (!map) return;
      if (!meMarker) meMarker = L.marker([pos.lat, pos.lng], { icon: L.divIcon({ className: "pin-wrap", html: `<span class="me-dot"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }), zIndexOffset: 2000, title: "You are here" }).addTo(map);
      else meMarker.setLatLng([pos.lat, pos.lng]);
      if (pan) {
        if (meInNYC()) {
          map.setView([pos.lat, pos.lng], 16, { animate: false });
          const z = zoneAt(pos.lat, pos.lng);
          if (z) { showZone(z); map.panBy([0, $("#zoneCard").offsetHeight / 2], { animate: false }); }
        } else toast("You're not in New York yet — showing the hotel instead.");
      }
    });
  }

  /* =========================================================
     SAFETY
     ========================================================= */
  function renderSafety() {
    const dark = isDarkNow();
    const group = (level) => ZONES.filter((z) => z.night === level).map((z) => `<li><button class="row" data-zone="${z.id}"><span class="row-body"><b>${esc(z.name)}</b><small>By day: ${LEVEL[z.day].label}</small></span><span class="chev" aria-hidden="true">${ic("chev")}</span></button></li>`).join("");
    $("#view-safety").innerHTML = `<div class="pad">
      <div class="status">
        <p class="eyebrow">The honest version</p>
        <h2>New York is safer than its reputation</h2>
        <p>It's one of the safest big cities in America, and the places in this guide are the busiest, most-watched parts of it. Most of what follows is about avoiding hassle, not danger. A handful of spots are worth going around, mainly after dark — and one of them is right next to the hotel, so read that one.</p>
      </div>

      <div class="callout">
        <p class="eyebrow">Read this one</p>
        <h3>Getting back to the hotel at night</h3>
        <p>The hotel is on a quiet stretch of 10th Avenue. South and west of it is Hudson Yards — bright and patrolled. North and east of it are the Lincoln Tunnel ramps and Port Authority — empty and scruffy after dark.</p>
        <ul class="ticks">
          <li><b>Best:</b> the 7 train to Hudson Yards (last stop), then five minutes up Hudson Boulevard.</li>
          <li><b>On foot:</b> come along 34th Street, which is wide, lit and busy, and turn up 10th Avenue for one block.</li>
          <li><b>Don't:</b> walk from Times Square down 8th or 9th Avenue, or cut across the blocks between 36th and 41st Street.</li>
          <li><b>After 10 pm:</b> take a cab to the door.</li>
        </ul>
        <button class="btn" data-zone="tunnel">Show me on the map</button>
      </div>

      <h3 class="h">Six habits</h3>
      <ol class="rules">${SAFETY_RULES.map((r) => `<li><b>${esc(r.h)}</b><p>${esc(r.p)}</p></li>`).join("")}</ol>

      <h3 class="h">Area by area, after dark</h3>
      <p class="muted">It is ${dark ? "dark in New York right now" : "daylight in New York right now"}. Tap any area to see it on the map.</p>
      <h4 class="lvh">${lv("skip", "Skip after dark")} <span>go round, go under, or take a cab</span></h4>
      <ul class="rows">${group("skip")}</ul>
      <h4 class="lvh">${lv("sharp")} <span>fine — bag closed, main streets, don't linger</span></h4>
      <ul class="rows">${group("sharp")}</ul>
      <h4 class="lvh">${lv("easy")} <span>busy and comfortable into the evening</span></h4>
      <ul class="rows">${group("easy")}</ul>

      <h3 class="h">On the subway</h3>
      <ul class="ticks">${SAFETY_SUBWAY.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>

      <h3 class="h">Hustles you'll actually meet</h3>
      <ol class="rules plain">${SCAMS.map((r) => `<li><b>${esc(r.h)}</b><p>${esc(r.p)}</p></li>`).join("")}</ol>

      <h3 class="h">If something goes wrong</h3>
      <ul class="rows">${EMERGENCY.map((e) => {
        const body = `<span class="row-body"><small>${esc(e.label)}</small><b>${esc(e.value)}</b><small>${esc(e.note)}</small></span>`;
        if (e.tel) return `<li><a class="row" href="tel:${e.tel}">${body}<span class="chev">${ic("phone")}</span></a></li>`;
        return `<li><a class="row" href="${searchUrl(e.map)}" target="_blank" rel="noopener">${body}<span class="chev">${ic("ext")}</span></a></li>`;
      }).join("")}</ul>

      <p class="disclaimer">These zones are a local-knowledge guide to how areas feel on foot, drawn in broad strokes. They aren't live crime data or a guarantee, and things change block by block. Your own judgement on the day beats any map.</p>
    </div>`;
  }

  /* =========================================================
     TRANSIT & TIPS
     ========================================================= */
  function renderTips() {
    const list = (items) => `<ol class="rules plain">${items.map((r) => `<li><b>${esc(r.h)}</b><p>${esc(r.p)}</p></li>`).join("")}</ol>`;
    $("#view-tips").innerHTML = `<div class="pad">
      <div class="status">
        <p class="eyebrow">Getting around</p>
        <h2>Two stations and one bus</h2>
        <p>Nearly everything in this guide is reachable from one of these. Each place's page tells you which to use.</p>
      </div>
      <ul class="stations">${TRANSIT.stations.map((s) => `<li><div class="st-head"><span class="st-lines">${bullets(s.lines)}</span><b>${esc(s.name)}</b><small>${esc(s.walk)}</small></div><p>${esc(s.text)}</p></li>`).join("")}</ul>
      <h3 class="h">Paying</h3>${list(TRANSIT.pay)}
      <h3 class="h">Reading the subway</h3>${list(TRANSIT.subway)}
      <h3 class="h">On foot</h3>${list(TRANSIT.walking)}
      <h3 class="h">Cabs</h3>${list(TRANSIT.cabs)}
      <h3 class="h">Good to know</h3>${list(TRANSIT.money)}
      <div class="btns"><a class="btn" href="https://new.mta.info/map/5256" target="_blank" rel="noopener">Official subway map ${ic("ext")}</a><a class="btn" href="https://citymapper.com/nyc" target="_blank" rel="noopener">Citymapper ${ic("ext")}</a></div>
    </div>`;
  }

  /* =========================================================
     NAVIGATION & EVENTS
     ========================================================= */
  const RENDER = { today: renderToday, explore: renderExplore, safety: renderSafety, tips: renderTips, map: () => {} };
  let view = "today";
  function show(name) {
    view = name;
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== "view-" + name; });
    document.querySelectorAll(".tabs button").forEach((b) => { if (b.dataset.view === name) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    document.body.classList.toggle("on-map", name === "map");
    RENDER[name]();
    if (name === "map") { initMap(); if (map) { map.invalidateSize(); paintZones(); } } else window.scrollTo(0, 0);
  }
  function focusOnMap(latlng, zoom, zone) {
    closeSheet();
    show("map");
    if (!map) return;
    if (zone) { showZone(zone); map.fitBounds(L.polygon(zone.poly).getBounds(), { paddingTopLeft: [24, 24], paddingBottomRight: [24, $("#zoneCard").offsetHeight + 36] }); } else map.setView(latlng, zoom);
  }
  function toggleSave(id) {
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    store.set("saved", [...saved]);
  }
  function applyTitle() {
    const t = settings.her ? `${settings.her}'s New York` : "Your New York";
    $("#appTitle").textContent = t;
    document.title = t;
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-view],[data-place],[data-save],[data-day],[data-filter],[data-act],[data-zone],[data-showmap]");
    if (!t) return;
    const d = t.dataset;
    if (d.view) return show(d.view);
    if (d.save) {
      toggleSave(d.save);
      if (!$("#sheet").hidden) openPlace(d.save);
      if (view === "explore") renderExplore();
      return;
    }
    if (d.place) return openPlace(d.place);
    if (d.day) { dayIndex = Number(d.day); renderToday(); return; }
    if (d.filter) { filter = d.filter; renderExplore(); return; }
    if (d.showmap) { const p = placeById[d.showmap]; return focusOnMap([p.lat, p.lng], 16); }
    if (d.zone) { const z = ZONES.find((x) => x.id === d.zone); mapMode = "night"; return focusOnMap(null, null, z); }
    switch (d.act) {
      case "close": return closeSheet();
      case "zoneclose": $("#zoneCard").hidden = true; return;
      case "settings": return openSettings();
      case "driver": return openDriver();
      case "share": return shareLocation();
      case "copy": return copy(`${HOTEL.name}, ${HOTEL.address} (${HOTEL.cross}), ${HOTEL.cityLine}`, "Address copied.");
      case "near": toast("Finding you…"); return locate(() => { if (!meInNYC()) toast("You're not in New York yet — sorting from the hotel."); RENDER[view](); });
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "settingsForm") return;
    e.preventDefault();
    const f = new FormData(e.target);
    settings = { her: f.get("her").trim(), partner: f.get("partner").trim(), phone: f.get("phone").trim() };
    store.set("settings", settings);
    applyTitle(); closeSheet(); RENDER[view](); toast("Saved.");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  $("#scrim").addEventListener("click", closeSheet);
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#modeDay").addEventListener("click", () => { mapMode = "day"; paintZones(); $("#zoneCard").hidden = true; });
  $("#modeNight").addEventListener("click", () => { mapMode = "night"; paintZones(); $("#zoneCard").hidden = true; });
  $("#locateBtn").addEventListener("click", () => showMe(true));
  $("#homeBtn").addEventListener("click", () => map && map.setView([HOTEL.lat, HOTEL.lng], 15));

  /* ---------- go ---------- */
  applyTitle();
  show("today");
  loadWeather();
  // Refresh the clock-driven bits once a minute while the app is open.
  setInterval(() => {
    const st = $("#view-today .status");
    if (st) { st.outerHTML = statusBlock(); renderWeather(); }
    if (view === "map" && !mapMode) paintZones();
  }, 60000);
  // If she has already granted location, quietly pick it up; never prompt on load.
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: "geolocation" }).then((s) => { if (s.state === "granted") locate(() => { if (view !== "map") RENDER[view](); }, true); }).catch(() => {});
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

})();
