/* Your New York — shared state, helpers and the page sheet. Content lives in data.js. */
const App = (() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ic = (name, cls) => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const HOTEL = TRIP.hotel;
  const LEVEL = { easy: "Relaxed", sharp: "Stay sharp", skip: "Skip" };
  const RANK = { easy: 0, sharp: 1, skip: 2 };
  const CAT_ICON = { festive: "tree-pine", sights: "camera", views: "binoculars", museums: "landmark", walks: "trees", food: "utensils", shops: "shopping-bag", shows: "drama" };

  /* ---------- storage (this phone only) ---------- */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem("nyc." + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem("nyc." + key, JSON.stringify(value)); } catch (e) { /* private mode */ } },
  };
  const state = {
    settings: store.get("settings", { her: "", partner: "", phone: "" }),
    saved: new Set(store.get("saved", [])),
    checks: new Set(store.get("checks", [])),
    me: null,
    view: "today",
  };

  /* ---------- New York clock ---------- */
  const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const SUNSET = hm(TRIP.sunset), SUNRISE = hm(TRIP.sunrise);
  function nyNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TRIP.tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "long",
    }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute), weekday: p.weekday };
  }
  const isDarkNow = () => { const m = nyNow().minutes; return m >= SUNSET + 15 || m < SUNRISE - 15; };
  const dayDiff = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
  const fmtClock = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const fmtSpan = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`);
  function tripPhase() {
    const now = nyNow();
    const before = dayDiff(now.date, TRIP.start), after = dayDiff(TRIP.end, now.date);
    return { now, before, after, inTrip: before <= 0 && after <= 0, dayNumber: dayDiff(TRIP.start, now.date) + 1 };
  }

  /* ---------- geometry ---------- */
  function distKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  // Walking along the street grid is longer than a straight line; ~12.5 minutes a kilometre.
  function dist(km) {
    const street = km * 1.3;
    if (street < 2.2) return { n: String(Math.max(1, Math.round(street * 12.5))), unit: "min walk" };
    return { n: (km * 0.621).toFixed(1), unit: "miles" };
  }
  const distText = (km) => { const d = dist(km); return `${d.n} ${d.unit}`; };
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

  /* ---------- places ---------- */
  const REGIONS = ["Hudson Yards & Chelsea", "Midtown", "Uptown", "Downtown & Brooklyn"];
  const REGION_OF = {
    "Hudson Yards": 0, "Hudson Yards → Meatpacking": 0, "Chelsea": 0, "Meatpacking": 0, "Penn Station": 0,
    "Midtown": 1, "Theater District": 1, "Midtown South": 1, "Herald Square": 1, "Murray Hill": 1, "Hell's Kitchen": 1,
    "Central Park South": 2, "Central Park": 2, "Upper East Side": 2, "Upper West Side": 2,
  };
  PLACES.forEach((p) => {
    p.zone = zoneAt(p.lat, p.lng);
    p.region = REGION_OF[p.area] ?? 3;
    p.price = p.free ? "Free" : p.cost.split(" · ")[0].replace(/ — .*/, "").replace(/^From about /, "From ").replace(/^About /, "");
  });
  const placeById = Object.fromEntries(PLACES.map((p) => [p.id, p]));
  const levelNow = (p) => (p.zone ? (isDarkNow() ? p.zone.night : p.zone.day) : "easy");

  /* ---------- links ---------- */
  const hotelQuery = `${HOTEL.name}, ${HOTEL.address}, ${HOTEL.cityLine}`;
  const dirUrl = (dest) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=transit`;
  const placeDir = (p) => dirUrl(`${p.name}, New York, NY`);
  const searchUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const telHref = (n) => "tel:" + String(n).replace(/[^\d+]/g, "");

  /* ---------- small renderers ---------- */
  const BUS = new Set(["M34"]);
  const bullets = (lines) => (lines || []).map((l) => (BUS.has(l) ? `<span class="bus">${l}</span>` : `<span class="bullet b-${l}">${l}</span>`)).join("");
  const lv = (level, text) => `<span class="lv lv-${level}">${esc(text || LEVEL[level])}</span>`;
  const partnerName = () => state.settings.partner || "your partner";

  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function copy(text, msg) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(msg), () => toast(text));
  }

  /* ---------- location ---------- */
  function locate(onDone, quiet, onFail) {
    if (!navigator.geolocation) { if (!quiet) toast("This phone isn't sharing its location."); onFail && onFail(); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { state.me = { lat: pos.coords.latitude, lng: pos.coords.longitude }; onDone && onDone(state.me); },
      () => { if (!quiet) toast("Couldn't find you. Check that location is allowed for this site."); onFail && onFail(); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }
  // Her position only counts once she is actually in or near the city.
  const meInNYC = () => !!state.me && distKm(state.me, HOTEL) < 40;
  const origin = () => (meInNYC() ? state.me : HOTEL);

  /* =========================================================
     The page sheet: one full-height sheet for every detail view.
     It slides up over the current tab, drags down to dismiss, and
     sits in the browser history so the back gesture closes it.
     ========================================================= */
  let pageOpen = false, lastFocus = null, onPageClose = null;
  const page = () => $("#page");

  function openPage({ body, bar = "", variant = "", label = "Details", onClose = null }) {
    const el = page();
    el.className = "page" + (variant ? " page--" + variant : "");
    el.setAttribute("aria-label", label);
    $("#pageScroll").innerHTML = body;
    $("#pageBar").innerHTML = bar;
    $("#pageBar").hidden = !bar;
    $("#pageScroll").scrollTop = 0;
    onPageClose = onClose;
    if (!pageOpen) {
      lastFocus = document.activeElement;
      pageOpen = true;
      history.pushState({ page: true }, "");
      el.hidden = false; $("#scrim").hidden = false;
      el.style.transform = "";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add("in"); $("#scrim").classList.add("in"); }));
    } else el.classList.add("in");
    $("#pageClose").focus({ preventScroll: true });
  }
  function hidePage() {
    if (!pageOpen) return;
    pageOpen = false;
    const el = page();
    el.classList.remove("in"); $("#scrim").classList.remove("in");
    el.style.transform = "";
    const done = () => { if (!pageOpen) { el.hidden = true; $("#scrim").hidden = true; } };
    setTimeout(done, 380);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (onPageClose) { const f = onPageClose; onPageClose = null; f(); }
  }
  const closePage = () => { if (pageOpen) history.back(); };
  window.addEventListener("popstate", hidePage);

  function initPageDrag() {
    const el = page();
    let startY = 0, dy = 0, t0 = 0, dragging = false;
    const down = (e) => {
      if (e.target.closest("button, a, input")) return;
      dragging = true; startY = e.clientY; dy = 0; t0 = performance.now();
      el.style.transition = "none";
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      el.style.transform = `translateY(${dy}px)`;
      $("#scrim").style.opacity = String(Math.max(0, 1 - dy / 500));
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.style.transition = ""; $("#scrim").style.opacity = "";
      const fast = dy / Math.max(1, performance.now() - t0) > 0.55;
      if (dy > 130 || (fast && dy > 30)) closePage(); else el.style.transform = "";
    };
    const grab = $("#pageGrab");
    grab.addEventListener("pointerdown", down);
    grab.addEventListener("pointermove", move);
    grab.addEventListener("pointerup", up);
    grab.addEventListener("pointercancel", up);
  }

  return {
    $, $$, esc, ic, HOTEL, LEVEL, RANK, CAT_ICON, REGIONS, store, state, SUNSET, SUNRISE,
    nyNow, isDarkNow, dayDiff, fmtClock, fmtSpan, tripPhase, distKm, dist, distText, zoneAt, placeById, levelNow,
    hotelQuery, dirUrl, placeDir, searchUrl, telHref, bullets, lv, partnerName, toast, copy, locate, meInNYC, origin,
    openPage, closePage, initPageDrag, isPageOpen: () => pageOpen,
  };
})();
