/* Your New York — the four tabs, the detail pages, and all interaction wiring. */
App.views = (() => {
  "use strict";
  const { $, $$, esc, ic, HOTEL, LEVEL, CAT_ICON, REGIONS, store, state, SUNSET, SUNRISE, nyNow, isDarkNow, dayDiff, fmtClock, fmtSpan, tripPhase,
    distKm, dist, distText, placeById, streets, levelNow, hotelQuery, dirUrl, placeDir, searchUrl, telHref, bullets, lv, partnerName, toast, copy, locate, meInNYC, origin, openPage, closePage } = App;

  const head = (over, title) => `<header class="head">
      <div class="head-top"><p class="over">${over}</p><button class="round" data-act="settings" aria-label="Your details">${ic("user")}</button></div>
      <h1 class="title">${title}</h1>
    </header>`;
  const sec = (title, extra = "") => `<div class="sec-head"><h2>${title}</h2>${extra}</div>`;

  // Walking time along real streets where the place is within reach on foot; miles otherwise.
  function howFar(p, km) {
    const from = origin(), mins = streets.minutes(from, p);
    return mins && mins <= 60 ? { n: String(mins), unit: "min walk" } : { n: (km * 0.621).toFixed(1), unit: "miles" };
  }
  function placeRow(p, km) {
    const d = howFar(p, km), level = levelNow(p);
    return `<li><button class="prow" data-place="${p.id}">
        <span class="prow-ic">${ic(CAT_ICON[p.cat])}</span>
        <span class="prow-main"><b>${esc(p.name)}${state.saved.has(p.id) ? ic("heart", "saved") : ""}</b><small>${esc(CATS[p.cat].label)} · ${esc(p.area)} · ${esc(p.price)}</small>${level !== "easy" ? `<span class="prow-flag">${lv(level, isDarkNow() ? (level === "skip" ? "Not after dark" : "Stay sharp after dark") : "Stay sharp")}</span>` : ""}</span>
        <span class="dist"><b>${d.n}</b><small>${d.unit}</small></span>
      </button></li>`;
  }

  /* =========================================================
     TODAY
     ========================================================= */
  function defaultDayIndex() {
    const today = nyNow().date, i = DAYS.findIndex((d) => d.date === today);
    return i >= 0 ? i : 0;
  }
  const dayIndex = () => (state.dayIndex == null ? defaultDayIndex() : state.dayIndex);

  let weather = null;
  const WMO = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow", 80: "Showers", 81: "Showers", 82: "Heavy showers", 85: "Snow showers", 86: "Snow showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm" };
  function loadWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${HOTEL.lat}&longitude=${HOTEL.lng}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=${encodeURIComponent(TRIP.tz)}&forecast_days=16`;
    fetch(url).then((r) => (r.ok ? r.json() : Promise.reject())).then((j) => { weather = j; renderBoard(); }).catch(() => {});
  }
  function weatherRow(t) {
    const typical = ["3–8°C", "Typical for December"];
    if (!weather) return typical;
    const d = weather.daily;
    if (t.inTrip) {
      const c = weather.current, i = Math.max(0, d.time.indexOf(t.now.date));
      return [`${Math.round(c.temperature_2m)}°C · ${WMO[c.weather_code] || "Now"}`, `Feels ${Math.round(c.apparent_temperature)}° · ${d.precipitation_probability_max[i] ?? 0}% rain`];
    }
    const solo = DAYS.filter((x) => x.solo && d.time.includes(x.date));
    if (!solo.length) return typical;
    return [solo.map((x) => `${Math.round(d.temperature_2m_max[d.time.indexOf(x.date)])}°`).join(" · "), `${solo[0].short}–${solo[solo.length - 1].short} highs, °C`];
  }
  function boardHtml() {
    const t = tripPhase(), m = t.now.minutes;
    let light;
    if (!t.inTrip) light = `<div class="brow"><span class="bl">Sunset</span><span class="bv">${fmtClock(SUNSET)}</span><span class="bx">Every plan is built around it</span></div>`;
    else {
      const pct = Math.max(0, Math.min(100, ((m - SUNRISE) / (SUNSET - SUNRISE)) * 100));
      const value = m < SUNRISE ? "Still dark" : m < SUNSET ? `${fmtSpan(SUNSET - m)} left` : "Dark now";
      const extra = m < SUNRISE ? `Sunrise ${fmtClock(SUNRISE)}` : m < SUNSET ? `Sunset ${fmtClock(SUNSET)}` : "Keep to busy streets";
      light = `<div class="brow"><span class="bl">Daylight</span><span class="bv">${value}</span><span class="bx">${extra}</span><div class="meter" role="img" aria-label="Daylight from ${fmtClock(SUNRISE)} to ${fmtClock(SUNSET)}"><span style="width:${pct}%"></span></div></div>`;
    }
    const [w1, w2] = weatherRow(t);
    const home = meInNYC() ? streets.route(state.me, HOTEL, streets.bandNow()) : null;
    const away = home && home.minutes <= 60 ? `${home.minutes} min walk away` : meInNYC() ? `${distText(distKm(state.me, HOTEL))} away` : `${bullets(["7"])}Hudson Yards`;
    return `<section class="board" id="board" aria-label="Right now">
        ${light}
        <div class="brow"><span class="bl">Weather</span><span class="bv">${w1}</span><span class="bx">${w2}</span></div>
        <div class="brow"><span class="bl">Home</span><span class="bv">${esc(HOTEL.name)}</span><span class="bx">${away}</span></div>
      </section>`;
  }
  function renderBoard() { const b = $("#board"); if (b) b.outerHTML = boardHtml(); }

  function actionsHtml() {
    const s = state.settings;
    const call = s.phone
      ? `<a class="act" href="${telHref(s.phone)}">${ic("phone")}<span>Call ${esc(s.partner || "")}</span></a>`
      : `<button class="act" data-act="settings">${ic("phone")}<span>Add a number</span></button>`;
    return `<div class="actions">
        <button class="go-home" data-act="way-home">
          <span class="gh-ic">${ic("house")}</span>
          <span class="gh-text"><b>Take me home</b><small>The safest way back to ${esc(HOTEL.name)} from here</small></span>
          ${ic("chevron-right")}
        </button>
        <div class="act-row">
          <button class="act" data-act="driver">${ic("car-taxi-front")}<span>Show a driver</span></button>
          <button class="act" data-act="share">${ic("send")}<span>Send location</span></button>
          ${call}
        </div>
      </div>`;
  }

  function checklistHtml() {
    const s = state.settings;
    const items = [
      { id: "homescreen", title: "Put this guide on her Home Screen", note: "Open the link on her phone, then Share → Add to Home Screen. It then opens without signal." },
      { id: "details", title: "Add your names and your number", note: "So the call button on this screen works", act: "settings", auto: !!s.phone },
      ...BOOK_AHEAD.map((b) => ({ id: "book-" + b.place, title: "Book: " + placeById[b.place].name, note: b.note, place: b.place })),
    ];
    const isDone = (it) => it.auto || state.checks.has(it.id);
    const rows = items.map((it) => {
      const text = `<span class="ct"><b>${esc(it.title)}</b><small>${esc(it.note)}</small></span>`;
      const main = it.place ? `<button class="check-main" data-place="${it.place}">${text}${ic("chevron-right", "chev")}</button>`
        : it.act ? `<button class="check-main" data-act="${it.act}">${text}${ic("chevron-right", "chev")}</button>`
        : `<div class="check-main">${text}</div>`;
      return `<li class="check${isDone(it) ? " done" : ""}"><button class="box" data-check="${it.id}" aria-pressed="${isDone(it)}" aria-label="Mark done: ${esc(it.title)}">${ic("check")}</button>${main}</li>`;
    }).join("");
    return `<section class="sec">${sec("Before you fly", `<span class="count">${items.filter(isDone).length} of ${items.length} done</span>`)}<ul class="checks">${rows}</ul></section>`;
  }

  function planHtml() {
    const i = dayIndex(), d = DAYS[i], today = nyNow().date;
    const tabs = DAYS.map((x, n) => `<button class="day${n === i ? " on" : ""}" data-day="${n}" style="--c:${x.color}" aria-pressed="${n === i}" aria-label="${esc(x.long)}">
        <span class="bullet">${esc(x.letter)}</span><small>${esc(x.short)}${x.date === today ? " ·" : ""}</small></button>`).join("");
    const stops = d.steps.map((s) => {
      const p = s.place && placeById[s.place];
      const body = `<span class="node"></span><span class="st"><small>${esc(s.time)}</small>${p ? `<b>${esc(p.name)}</b>` : ""}<span>${esc(s.text)}</span></span>`;
      return p ? `<li><button class="stop" data-place="${p.id}">${body}${ic("chevron-right", "chev")}</button></li>` : `<li><div class="stop">${body}</div></li>`;
    }).join("");
    const home = d.home ? `<li><div class="stop stop-home"><span class="node">${ic("house")}</span><span class="st"><small>Getting home</small><span>${esc(d.home)}</span></span></div></li>` : "";
    return `<section class="sec">${sec("The plan")}
        <div class="days" role="group" aria-label="Choose a day">${tabs}</div>
        <article class="plan" style="--c:${d.color}">
          <p class="over">${esc(d.long)} · ${d.solo ? "Solo day" : "Together"}</p>
          <h3 class="plan-title">${esc(d.title)}</h3>
          <p class="plan-sub">${esc(d.sub)}</p>
          <p class="plan-intro">${esc(d.intro)}</p>
          <ol class="strip">${stops}${home}</ol>
          ${d.steps.some((s) => s.place) ? `<button class="btn wide" data-act="planmap">${ic("route")}See this day on the map</button>` : ""}
        </article>
      </section>`;
  }

  function nearHtml() {
    const from = origin();
    const list = PLACES.map((p) => ({ p, km: distKm(from, p) })).sort((a, b) => a.km - b.km).slice(0, 4);
    return `<section class="sec">${sec(meInNYC() ? "Near you now" : "Nearest to the hotel", `<button class="link" data-act="near">${meInNYC() ? "Update" : "Use my location"}</button>`)}
        <ul class="prows">${list.map(({ p, km }) => placeRow(p, km)).join("")}</ul>
        <button class="btn wide" data-view="places">${ic("compass")}All ${PLACES.length} places</button>
      </section>`;
  }

  function renderToday() {
    const t = tripPhase(), name = state.settings.her ? esc(state.settings.her) : "";
    let over, title;
    if (t.before > 0) {
      over = "New York · 9–13 December";
      title = t.before === 1 ? "Tomorrow" : `<span class="num">${t.before}</span> days to go`;
    } else if (t.after > 0) {
      over = "New York · 9–13 December"; title = "Back home";
    } else {
      const m = t.now.minutes, hello = m < 12 * 60 ? "Good morning" : m < SUNSET ? "Good afternoon" : "Good evening";
      over = `${t.now.weekday} · Day ${t.dayNumber} of 5`;
      title = name ? `${hello},<br>${name}` : hello;
    }
    $("#view-today").innerHTML = `<div class="wrap">
        ${head(over, title)}
        ${boardHtml()}
        ${actionsHtml()}
        ${planHtml()}
        ${t.before > 0 ? checklistHtml() : ""}
        ${nearHtml()}
      </div>`;
  }

  /* =========================================================
     PLACES
     ========================================================= */
  let pFilter = "all", pQuery = "";
  const P_FILTERS = [["all", "All"], ["saved", "Saved"], ["festive", "Festive"], ["free", "Free"], ["indoor", "Indoors"], ["sights", "Sights"], ["views", "Views"], ["museums", "Museums"], ["walks", "Walks"], ["food", "Food"], ["shops", "Shops"], ["shows", "Shows"]];
  function pMatch(p) {
    if (pQuery) { // every word typed must start a word in the place's text ("tree" should not match "street")
      const hay = [p.name, p.area, p.blurb, CATS[p.cat].label].join(" ").toLowerCase();
      const ok = pQuery.toLowerCase().split(/\s+/).every((w) => new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(hay));
      if (!ok) return false;
    }
    if (pFilter === "all") return true;
    if (pFilter === "saved") return state.saved.has(p.id);
    if (pFilter === "festive") return !!p.festive;
    if (pFilter === "free") return !!p.free;
    if (pFilter === "indoor") return !!p.indoor;
    return p.cat === pFilter;
  }
  function renderPlaceChips() {
    $("#placeChips").innerHTML = P_FILTERS.map(([k, label]) => `<button class="chip${k === pFilter ? " on" : ""}" data-filter="${k}">${k === "saved" ? ic("heart") : ""}${label}</button>`).join("");
  }
  function renderPlaceList() {
    const from = origin();
    const list = PLACES.filter(pMatch).map((p) => ({ p, km: distKm(from, p) })).sort((a, b) => a.km - b.km);
    let html;
    if (!list.length) {
      html = `<p class="empty">${pFilter === "saved" && !pQuery ? "Nothing saved yet. Open any place and tap Save to collect it here." : "Nothing matches that. Try a different word or filter."}</p>`;
    } else if (pFilter === "all" && !pQuery) {
      const groups = REGIONS.map((name, r) => ({ name, items: list.filter((x) => x.p.region === r) })).filter((gr) => gr.items.length).sort((a, b) => a.items[0].km - b.items[0].km);
      html = groups.map((gr) => `<section class="sec">${sec(esc(gr.name), `<span class="count">${gr.items.length}</span>`)}<ul class="prows">${gr.items.map(({ p, km }) => placeRow(p, km)).join("")}</ul></section>`).join("");
    } else {
      html = `<section class="sec">${sec(`${list.length} place${list.length === 1 ? "" : "s"}`, `<span class="count">Nearest first</span>`)}<ul class="prows">${list.map(({ p, km }) => placeRow(p, km)).join("")}</ul></section>`;
    }
    const live = `<section class="sec">${sec("On today")}
        <p class="sec-note">One-off events, pop-ups and last-minute seats, from people who update them daily.</p>
        <ul class="menu">${LISTINGS.map((l) => `<li><a class="mrow" href="${l.url}" target="_blank" rel="noopener"><span class="mrow-main"><b>${esc(l.name)}</b><small>${esc(l.note)}</small></span>${ic("arrow-up-right", "chev")}</a></li>`).join("")}</ul>
      </section>`;
    $("#placeList").innerHTML = html + (pQuery ? "" : live);
  }
  function renderPlaces() {
    const v = $("#view-places");
    if (!$("#placeList")) {
      v.innerHTML = `<div class="wrap">
          ${head(`${PLACES.length} picks · ${meInNYC() ? "nearest to you first" : "nearest to the hotel first"}`, "Places")}
          <label class="search">${ic("search")}<input id="placeSearch" type="search" placeholder="Search places" autocomplete="off" enterkeyhint="search" aria-label="Search places"></label>
        </div>
        <div class="filterbar"><div class="chips" id="placeChips" role="group" aria-label="Filter places"></div></div>
        <div class="wrap" id="placeList"></div>`;
      $("#placeSearch").addEventListener("input", (e) => { pQuery = e.target.value.trim(); renderPlaceList(); });
    }
    renderPlaceChips(); renderPlaceList();
  }

  /* =========================================================
     GUIDE
     ========================================================= */
  const TOPICS = {
    habits: { group: 0, icon: "shield-check", title: "Six habits", note: "The short version of staying comfortable" },
    areas: { group: 0, icon: "map", title: "Area by area", note: "Every neighbourhood, by day and after dark" },
    subway: { group: 0, icon: "train-front", title: "On the subway", note: "Where to stand, which car to ride" },
    hustles: { group: 0, icon: "hand", title: "Hustles to ignore", note: "The six you will actually meet" },
    help: { group: 0, icon: "siren", title: "If something goes wrong", note: "911, clinics and the nearest ER" },
    method: { group: 0, icon: "info", title: "How the safety map works", note: "What it counts, and what it can't know" },
    stations: { group: 1, icon: "train-front", title: "Your two stations", note: "And the bus along 34th Street" },
    pay: { group: 1, icon: "credit-card", title: "Paying", note: "Tap a card or phone. $3 a ride" },
    reading: { group: 1, icon: "signpost", title: "Reading the subway", note: "Uptown, downtown, local, express" },
    foot: { group: 1, icon: "footprints", title: "On foot", note: "How the grid works" },
    cabs: { group: 1, icon: "car-taxi-front", title: "Cabs", note: "Yellow cabs, Uber and Lyft" },
    know: { group: 1, icon: "info", title: "Good to know", note: "Tipping, tax, toilets, battery" },
  };
  function renderGuide() {
    const menu = (g) => `<ul class="menu">${Object.entries(TOPICS).filter(([, t]) => t.group === g).map(([id, t]) => `<li><button class="mrow" data-topic="${id}"><span class="mrow-ic">${ic(t.icon)}</span><span class="mrow-main"><b>${t.title}</b><small>${t.note}</small></span>${ic("chevron-right", "chev")}</button></li>`).join("")}</ul>`;
    $("#view-guide").innerHTML = `<div class="wrap">
        ${head("Safety and getting around", "Guide")}
        <p class="lead">New York is one of the safest big cities in America, and this guide keeps to its busiest parts. Most of what follows is about avoiding hassle. A few spots are worth going around after dark, and one is beside the hotel.</p>
        <section class="board board-home" aria-label="Getting back to the hotel after dark">
          <h2 class="board-title">${ic("moon")}Back to the hotel after dark</h2>
          <div class="brow"><span class="bl">Best</span><span class="bv">${bullets(["7"])}to Hudson Yards, the last stop. Then five minutes up Hudson Boulevard.</span></div>
          <div class="brow"><span class="bl">On foot</span><span class="bv">Tap Take me home. It picks the streets for the time of night: usually 9th or 10th Avenue, or 34th Street west of 8th.</span></div>
          <div class="brow"><span class="bl">Avoid</span><span class="bv">42nd Street and 8th Avenue by Port Authority, 34th Street outside Penn Station, and the side streets under the tunnel ramps.</span></div>
          <div class="brow"><span class="bl">After 10 pm</span><span class="bv">A cab to the door.</span></div>
          <button class="btn on-board" data-act="way-home">${ic("route")}Take me home</button>
        </section>
        <section class="sec">${sec("Staying comfortable")}${menu(0)}</section>
        <section class="sec">${sec("Getting around")}${menu(1)}</section>
        <p class="fine">Area guidance here is broad-strokes local knowledge about how places feel on foot. It isn't live crime data or a guarantee. Your own judgement on the day beats any map.</p>
      </div>`;
  }

  const pageHead = (over, title, lead = "") => `<p class="over">${over}</p><h2 class="page-title" id="pageTitle">${title}</h2>${lead ? `<p class="lead">${lead}</p>` : ""}`;
  const hpList = (items, numbered) => `<ol class="hp${numbered ? " numbered" : ""}">${items.map((r) => `<li><div><b>${esc(r.h)}</b><p>${esc(r.p)}</p></div></li>`).join("")}</ol>`;
  function openTopic(id) {
    const t = TOPICS[id];
    const over = `${ic(t.icon)}${t.group === 0 ? "Staying comfortable" : "Getting around"}`;
    let body = "";
    if (id === "habits") body = pageHead(over, "Six habits") + hpList(SAFETY_RULES, true);
    else if (id === "method") body = pageHead(over, "How the safety map works", "Every street on the map is scored block by block, for three times of day.")
      + hpList([
        { h: "What it counts", p: `${streets.incidents.toLocaleString("en-GB")} incidents the NYPD recorded on the streets and in the parks of Manhattan below about 96th Street, from ${streets.span}: robbery, assault, harassment, and theft from the person. Anything indoors is left out. Incidents with a woman as the victim count for more.` },
        { h: "What it leaves out, and why", p: "Sex offences are not on the map. To protect victims, the NYPD records them at the precinct station house rather than where they happened, so their locations say nothing about a street. Reports the police could not place are logged the same way and are removed too. Incidents inside parks are counted for the park, not the street beside it." },
        { h: "Allowing for crowds", p: "A packed block will always record more incidents than an empty one. So each block's count is set against how busy it is, using the number of restaurants, bars, shops, hotels and theatres along it. A block is flagged when it records a lot for how busy it is." },
        { h: "Three times of day", p: "Daytime (7 am to 4:45 pm), evening (to 10 pm) and late night are scored separately, each by the hour, so a street can be clear at lunchtime and flagged at 9 pm. The map follows the real time in New York unless you change it." },
        { h: "Empty blocks", p: "Some blocks are flagged after dark because nobody is there, not because of incidents: the Lincoln Tunnel ramps beside the hotel, the far west waterfront, and Central Park. The incident data cannot see those, so they come from local knowledge." },
        { h: "The walking route", p: "\"Take me home\" and each place's walking route find the safest reasonable way along real streets. After dark the route prefers main streets with open doors, goes around amber blocks when that costs little, and goes a long way round red ones. It tells you when riding is the better choice." },
        { h: "What it can't know", p: "This is where incidents were reported, not a forecast, and not a promise about any one evening. Most flagged blocks are perfectly walkable with your wits about you. Your own judgement on the day comes first." },
      ])
      + `<h3 class="rule">Sources</h3><p class="fine" style="margin-top:0">NYPD Complaint Data, NYC Open Data. Street network and venues: © OpenStreetMap contributors, via OpenFreeMap and OpenMapTiles.</p>`;
    else if (id === "subway") body = pageHead(over, "On the subway", "The subway is how New Yorkers get around, and by day it is busy and fine. A few habits make it easier.") + `<ul class="ticks">${SAFETY_SUBWAY.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`;
    else if (id === "hustles") body = pageHead(over, "Hustles to ignore", "None of these are dangerous. They cost money and time, and a flat “no thanks” without stopping ends all of them.") + hpList(SCAMS);
    else if (id === "areas") {
      const dark = isDarkNow();
      const stat = (z) => { const st = streets.zone(z.id); return st && st.tier != null ? ` · ${st.eve + st.late} incidents after dark` : ""; };
      const group = (level) => ZONES.filter((z) => z.night === level).map((z) => `<li><button class="mrow" data-zone="${z.id}"><span class="mrow-main"><b>${esc(z.name)}</b><small>By day: ${LEVEL[z.day]}${stat(z)}</small></span>${ic("chevron-right", "chev")}</button></li>`).join("");
      body = pageHead(over, "Area by area", `Grouped by how each area feels after dark. It is ${dark ? "dark" : "daylight"} in New York right now. Tap an area to see it on the map.`)
        + `<p class="fine" style="margin-top:12px">Incident counts are NYPD street reports for ${streets.span}. <button class="link" data-topic="method">How this is worked out</button></p>`
        + `<h3 class="grp">${lv("skip", "Skip after dark")}<span>Go round, go under, or take a cab</span></h3><ul class="menu">${group("skip")}</ul>`
        + `<h3 class="grp">${lv("sharp")}<span>Fine. Bag closed, main streets, don't linger</span></h3><ul class="menu">${group("sharp")}</ul>`
        + `<h3 class="grp">${lv("easy")}<span>Busy and comfortable into the evening</span></h3><ul class="menu">${group("easy")}</ul>`;
    } else if (id === "help") {
      const s = state.settings;
      const rows = EMERGENCY.map((e) => {
        const main = `<span class="mrow-main"><small>${esc(e.label)}</small><b>${esc(e.value)}</b><small>${esc(e.note)}</small></span>`;
        return e.tel ? `<li><a class="mrow" href="tel:${e.tel}">${main}${ic("phone", "chev")}</a></li>` : `<li><a class="mrow" href="${searchUrl(e.map)}" target="_blank" rel="noopener">${main}${ic("arrow-up-right", "chev")}</a></li>`;
      }).join("");
      const partner = s.phone ? `<li><a class="mrow" href="${telHref(s.phone)}"><span class="mrow-main"><small>Someone who knows where you are</small><b>Call ${esc(s.partner || "your partner")}</b><small>${esc(s.phone)}</small></span>${ic("phone", "chev")}</a></li>` : "";
      body = pageHead(over, "If something goes wrong") + `<ul class="menu">${partner}${rows}<li><button class="mrow" data-act="driver"><span class="mrow-main"><small>Where you are staying</small><b>${esc(HOTEL.name)}, ${esc(HOTEL.address)}</b><small>${esc(HOTEL.cross)}. Tap to show it large.</small></span>${ic("chevron-right", "chev")}</button></li></ul>`;
    } else if (id === "stations") {
      body = pageHead(over, "Your two stations", "Nearly everything in this guide is reachable from one of these. Each place's page says which to use.")
        + `<ul class="stations">${TRANSIT.stations.map((s) => `<li><div class="stn-head"><span class="stn-lines">${bullets(s.lines)}</span><b>${esc(s.name)}</b><small>${esc(s.walk)}</small></div><p>${esc(s.text)}</p></li>`).join("")}</ul>`;
    } else {
      const map = { pay: ["Paying", TRANSIT.pay], reading: ["Reading the subway", TRANSIT.subway], foot: ["On foot", TRANSIT.walking], cabs: ["Cabs", TRANSIT.cabs], know: ["Good to know", TRANSIT.money] }[id];
      body = pageHead(over, map[0]) + hpList(map[1]);
    }
    openPage({ body, label: t.title });
  }

  /* =========================================================
     PLACE PAGE
     ========================================================= */
  function openPlace(id) {
    const p = placeById[id];
    if (!p) return;
    const z = p.zone, d = howFar(p, distKm(origin(), p)), isSaved = state.saved.has(p.id), now = levelNow(p);
    const body = `
      <p class="over">${ic(CAT_ICON[p.cat])}${esc(CATS[p.cat].label)} · ${esc(p.area)}</p>
      <h2 class="page-title" id="pageTitle">${esc(p.name)}</h2>
      <div class="stats">
        <div><small>${meInNYC() ? "From you" : "From the hotel"}</small><b><span class="num">${d.n}</span> ${d.unit}</b></div>
        <div><small>Cost</small><b>${esc(p.price)}</b></div>
        <div><small>Right now</small>${lv(now)}</div>
      </div>
      <p class="lead">${esc(p.blurb)}</p>
      <div class="tip"><p class="over">Tip</p><p>${esc(p.tip)}</p></div>
      <h3 class="rule">Getting there from the hotel</h3>
      <p class="route-line">${p.lines.length ? `<span class="route-bullets">${bullets(p.lines)}</span>` : `<span class="route-walk">${ic("footprints")}</span>`}<span>${esc(p.go)}</span></p>
      <h3 class="rule">Good to know</h3>
      <dl class="facts">
        <div><dt>When</dt><dd>${esc(p.when)}</dd></div>
        <div><dt>Cost</dt><dd>${esc(p.cost)}</dd></div>
        <div><dt>Website</dt><dd><a href="${p.url}" target="_blank" rel="noopener">${esc(new URL(p.url).hostname.replace(/^www\./, ""))}${ic("arrow-up-right")}</a></dd></div>
      </dl>
      ${z ? `<h3 class="rule">The area</h3>
        <p class="area-name">${esc(z.name)}</p>
        <p class="area-lv"><span>By day ${lv(z.day)}</span><span>After dark ${lv(z.night)}</span></p>
        <p class="area-note">${esc(z.note)}</p>
        ${parkStat(p)}${areaStat(z)}` : ""}`;
    const bar = `<button class="btn sq${isSaved ? " saved" : ""}" data-save="${p.id}" aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove from saved" : "Save this place"}">${ic("heart")}</button>
      <button class="btn" data-showmap="${p.id}">${ic("map")}Map</button>
      <a class="btn primary grow" href="${placeDir(p)}" target="_blank" rel="noopener">${ic("navigation")}Directions</a>`;
    openPage({ body, bar, label: p.name });
  }

  function parkStat(p) {
    const k = streets.park(p.id);
    if (!k) return "";
    const theft = k.theft >= k.n / 3 ? ", about half of them thefts" : "";
    return `<p class="area-stat"><b>In the park itself:</b> ${k.n} incidents recorded in the past year${theft}, ${k.dark} of them after dark.</p>`;
  }
  function areaStat(z) {
    const st = streets.zone(z.id);
    if (!st || st.tier == null) return "";
    return `<p class="area-stat">${st.eve + st.late} street incidents were recorded here after dark in the past year, ${["fewer than most areas", "about typical for Manhattan", "more than most areas"][st.tier]} for its size. <button class="link" data-topic="method">How this is worked out</button></p>`;
  }

  function openDriver() {
    openPage({
      variant: "sign", label: "Hotel address",
      body: `<div class="sign-body">
          <p class="over">Please take me to</p>
          <p class="sign-big">10th Avenue<br>&amp; 35th Street</p>
          <p class="sign-mid">${esc(HOTEL.name)} · ${esc(HOTEL.address)}</p>
          <p class="sign-small">${esc(HOTEL.cross)}, ${esc(HOTEL.area)}<br>${esc(HOTEL.cityLine)}</p>
          <button class="btn on-board" data-act="copy-address">${ic("copy")}Copy address</button>
        </div>`,
    });
  }

  function openSettings() {
    const s = state.settings;
    openPage({
      label: "Your details",
      body: `${pageHead(`${ic("user")}This phone only`, "Your details", "These stay on this phone. Nothing is sent anywhere.")}
        <form id="settingsForm" class="form">
          <label for="f-her">Your name<input id="f-her" name="her" autocomplete="given-name" value="${esc(s.her)}" placeholder="Shown on the home screen"></label>
          <label for="f-partner">Who to call<input id="f-partner" name="partner" value="${esc(s.partner)}" placeholder="Their name"></label>
          <label for="f-phone">Their mobile number<input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(s.phone)}" placeholder="+44 … or +1 …"></label>
          <button class="btn primary wide" type="submit">Save</button>
        </form>
        <p class="fine">It also helps to share your live location for the day in WhatsApp, Google Maps or Find My. It updates on its own while you walk.</p>
        <h3 class="rule">About this guide</h3>
        <p class="fine">Map: OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors. Street safety: NYPD Complaint Data from NYC Open Data. Weather: Open-Meteo. Icons: Lucide. Type: Archivo and Inter. Opening hours and prices were checked in November 2026 and can change, so check the linked site before crossing town for something.</p>`,
    });
  }

  function shareLocation() {
    toast("Finding you…");
    locate((pos) => {
      const text = `I'm here right now: https://maps.google.com/?q=${pos.lat.toFixed(5)},${pos.lng.toFixed(5)}`;
      if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
      if (state.settings.phone) { location.href = `sms:${state.settings.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(text)}`; return; }
      copy(text, "Location link copied. Paste it into a message.");
    });
  }

  /* =========================================================
     NAVIGATION & EVENTS
     ========================================================= */
  const TABS = [["today", "Today", "sun"], ["map", "Map", "map"], ["places", "Places", "compass"], ["guide", "Guide", "book-open"]];
  const RENDER = { today: renderToday, places: renderPlaces, guide: renderGuide, map: () => App.map.onShow() };
  const rendered = new Set();

  function show(name) {
    state.view = name;
    $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + name; });
    $$("#tabs button").forEach((b) => { if (b.dataset.view === name) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (name === "guide" && rendered.has("guide")) return;
    RENDER[name]();
    rendered.add(name);
  }
  const refresh = () => { if (state.view !== "map") RENDER[state.view](); };

  function toggleSave(id) {
    if (state.saved.has(id)) state.saved.delete(id); else state.saved.add(id);
    store.set("saved", [...state.saved]);
    const on = state.saved.has(id);
    $$(`[data-save="${id}"]`).forEach((b) => { b.classList.toggle("saved", on); b.setAttribute("aria-pressed", on); });
    toast(on ? "Saved. Find it under Places → Saved." : "Removed from saved.");
    if (rendered.has("places")) renderPlaceList();
  }

  function onClick(e) {
    const t = e.target.closest("[data-view],[data-place],[data-save],[data-day],[data-filter],[data-mapfilter],[data-mapband],[data-maproute],[data-mapstep],[data-topic],[data-zone],[data-check],[data-showmap],[data-act]");
    if (!t) return;
    const d = t.dataset;
    if (d.check) {
      if (state.checks.has(d.check)) state.checks.delete(d.check); else state.checks.add(d.check);
      store.set("checks", [...state.checks]);
      return renderToday();
    }
    if (d.save) return toggleSave(d.save);
    if (d.showmap) { closePage(); return App.map.focusPlace(d.showmap); }
    if (d.zone) { closePage(); return App.map.focusZone(d.zone, true); }
    if (d.place) return openPlace(d.place);
    if (d.topic) return openTopic(d.topic);
    if (d.view) return show(d.view);
    if (d.day) { state.dayIndex = Number(d.day); return renderToday(); }
    if (d.filter) { pFilter = d.filter; renderPlaceChips(); return renderPlaceList(); }
    if (d.mapfilter) return App.map.setFilter(d.mapfilter);
    if (d.mapband) return App.map.setBand(d.mapband);
    if (d.maproute) return App.map.routeToPlace(d.maproute);
    if (d.mapstep) return App.map.step(Number(d.mapstep));
    switch (d.act) {
      case "close": return closePage();
      case "settings": return openSettings();
      case "driver": return openDriver();
      case "share": return shareLocation();
      case "copy-address": return copy(`${HOTEL.name}, ${HOTEL.address} (${HOTEL.cross}), ${HOTEL.cityLine}`, "Address copied.");
      case "planmap": return App.map.showPlan();
      case "near": toast("Finding you…"); return locate(() => { if (!meInNYC()) toast("You're not in New York yet, so this is sorted from the hotel."); refresh(); });
      case "map-card-close": return App.map.deselect();
      case "map-intro-done": return App.map.introDone();
      case "map-locate": return App.map.locateMe();
      case "map-menu-filter": return App.map.openMenu("filter");
      case "map-menu-time": return App.map.openMenu("time");
      case "way-home": return App.map.wayHome();
    }
  }
  function onSubmit(e) {
    if (e.target.id !== "settingsForm") return;
    e.preventDefault();
    const f = new FormData(e.target);
    state.settings = { her: f.get("her").trim(), partner: f.get("partner").trim(), phone: f.get("phone").trim() };
    store.set("settings", state.settings);
    document.title = state.settings.her ? `${state.settings.her}'s New York` : "Your New York";
    closePage();
    setTimeout(() => { refresh(); toast("Saved."); }, 50);
  }

  function boot() {
    $("#tabs").innerHTML = TABS.map(([id, label, icon]) => `<button data-view="${id}">${ic(icon)}<span>${label}</span></button>`).join("");
    $("#locateBtn").innerHTML = ic("locate-fixed");
    $("#wayHomeBtn").innerHTML = `${ic("house")}<span>Take me home</span>`;
    $("#pageClose").innerHTML = ic("x");
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePage(); });
    $("#scrim").addEventListener("click", closePage);
    App.initPageDrag();
    if (state.settings.her) document.title = `${state.settings.her}'s New York`;
    show("today");
    loadWeather();
    setInterval(() => { renderBoard(); App.map.tick(); }, 60000);
    // If location was already granted, pick it up quietly; never prompt on load.
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((s) => { if (s.state === "granted") locate(() => refresh(), true); }).catch(() => {});
    }
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  return { boot, show, openPlace, openDriver, openTopic, defaultDayIndex };
})();
App.views.boot();
