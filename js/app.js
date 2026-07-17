/* ============================================================
   THE GARAGE — dashboard app
   Reads BIKES from js/data.js and renders every view.
   No dependencies; all charts are hand-rolled SVG.
   ============================================================ */

(function () {
  "use strict";

  const NOW = new Date().getFullYear();
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------- data prep ---------- */

  const bikes = BIKES.map((b, i) => ({ ...b, seq: i + 1 }));

  const CATEGORIES = ["Off-road", "Trials", "Road", "Adventure", "Scooter", "Classic", "Mini"];

  // Brand counts; the top 7 marques get the categorical slots (fixed order,
  // never cycled), everything else folds into a grey "Other marques".
  const brandCount = new Map();
  bikes.forEach((b) => brandCount.set(b.make, (brandCount.get(b.make) || 0) + 1));
  const brandsByCount = [...brandCount.keys()].sort((a, b) =>
    brandCount.get(b) - brandCount.get(a) ||
    bikes.findIndex((x) => x.make === a) - bikes.findIndex((x) => x.make === b)
  );
  const topBrands = brandsByCount.slice(0, 7);
  const brandColor = (make) => {
    const idx = topBrands.indexOf(make);
    return idx >= 0 ? `var(--series-${idx + 1})` : "var(--text-muted)";
  };

  const knownYears = bikes.filter((b) => b.year !== null);
  const oldest = knownYears.reduce((a, b) => (b.year < a.year ? b : a));
  const newest = knownYears.reduce((a, b) => (b.year > a.year ? b : a));

  /* ---------- tiny DOM/SVG helpers ---------- */

  const $ = (sel) => document.querySelector(sel);
  function el(tag, attrs, text) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function svgEl(tag, attrs, text) {
    const n = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* ---------- tooltip ---------- */

  const tip = $("#tooltip");
  function showTip(html, evt) {
    tip.innerHTML = html;
    tip.hidden = false;
    const pad = 14;
    let x = evt.clientX + pad;
    let y = evt.clientY + pad;
    const r = tip.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - pad;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  function hideTip() { tip.hidden = true; }
  function bindTip(node, htmlFn) {
    node.addEventListener("mousemove", (e) => showTip(htmlFn(), e));
    node.addEventListener("mouseleave", hideTip);
  }
  const bikeTip = (b) =>
    `<div class="tt-title">#${b.seq} · ${b.make} ${b.model}</div>
     <div class="tt-sub">${b.year !== null ? b.year + " · " : ""}${b.cc}cc · ${b.category}</div>`;

  /* ---------- theme toggle ---------- */

  const root = document.documentElement;
  const savedTheme = localStorage.getItem("garage-theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeToggle").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("garage-theme", next);
  });

  if (typeof SAMPLE_DATA !== "undefined" && SAMPLE_DATA) {
    $("#sampleBanner").hidden = false;
  }
  $("#taglineText").textContent =
    `Every motorbike Dad has owned since ${COLLECTING_SINCE} — all ${bikes.length} of them`;

  /* ---------- KPI row ---------- */

  function renderKpis() {
    const row = $("#kpiRow");
    const years = NOW - COLLECTING_SINCE;
    const biggest = bikes.reduce((a, b) => (b.cc > a.cc ? b : a));
    const kpis = [
      { label: "Bikes owned", value: bikes.length, note: `since ${COLLECTING_SINCE}` },
      { label: "Buying rate", value: (bikes.length / years).toFixed(1), note: "bikes a year, every year" },
      { label: "Marques ridden", value: brandsByCount.length, note: `${topBrands[0]} leads with ${brandCount.get(topBrands[0])}` },
      { label: "Vintage span", value: `${newest.year - oldest.year} yrs`, note: `${oldest.year} Bullet to ${newest.year} ${newest.model}` },
      { label: "Biggest engine", value: `${biggest.cc}cc`, note: `${biggest.make} ${biggest.model}` },
    ];
    kpis.forEach((k) => {
      const t = el("div", { class: "stat-tile" });
      t.append(
        el("div", { class: "stat-label" }, k.label),
        el("div", { class: "stat-value" }, String(k.value)),
        el("div", { class: "stat-note" }, k.note)
      );
      row.append(t);
    });
  }

  /* ---------- brand legend ---------- */

  function renderLegend() {
    const box = $("#brandLegend");
    [...topBrands, "Other marques"].forEach((m) => {
      const item = el("span", { class: "legend-item" });
      const sw = el("span", { class: "legend-swatch" });
      sw.style.background = m === "Other marques" ? "var(--text-muted)" : brandColor(m);
      item.append(sw, document.createTextNode(m));
      box.append(item);
    });
  }

  /* ---------- vintage timeline (stacked dots per model year) ---------- */

  function renderVintage() {
    const padL = 20, padR = 20, padB = 30, padT = 30;
    const W = 1080, dotR = 6, dotGap = 15;
    const y0 = 1950, y1 = NOW + 1;
    const x = (yr) => padL + ((yr - y0) / (y1 - y0)) * (W - padL - padR);

    const byYear = new Map();
    knownYears.forEach((b) => {
      if (!byYear.has(b.year)) byYear.set(b.year, []);
      byYear.get(b.year).push(b);
    });
    const maxStack = Math.max(...[...byYear.values()].map((v) => v.length));
    const H = padT + maxStack * dotGap + padB + 10;
    const baseY = H - padB;

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bikes by model year" });

    for (let yr = 1950; yr <= y1; yr += 10) {
      svg.append(svgEl("line", { x1: x(yr), y1: padT - 6, x2: x(yr), y2: baseY, class: "gridline" }));
      svg.append(svgEl("text", { x: x(yr), y: baseY + 18, "text-anchor": "middle", class: "axis-label" }, String(yr)));
    }
    svg.append(svgEl("line", { x1: padL, y1: baseY, x2: W - padR, y2: baseY, class: "baseline-line" }));

    byYear.forEach((list, yr) => {
      list.forEach((b, i) => {
        const dot = svgEl("circle", {
          cx: x(yr), cy: baseY - dotR - 1 - i * dotGap, r: dotR,
          fill: brandColor(b.make), stroke: "var(--surface-1)", "stroke-width": 2,
        });
        bindTip(dot, () => bikeTip(b));
        svg.append(dot);
      });
    });

    // selective labels on the two ends of the span, pinned to the top edge
    svg.append(svgEl("text", { x: x(oldest.year), y: 14, "text-anchor": "start", class: "bar-label" },
      `’${String(oldest.year).slice(2)} ${oldest.make} ${oldest.model}`));
    svg.append(svgEl("text", { x: W - padR, y: 14, "text-anchor": "end", class: "bar-label" },
      `’${String(newest.year).slice(2)} ${newest.make} ${newest.model}`));

    $("#vintageChart").append(svg);
    const unknown = bikes.length - knownYears.length;
    $("#vintageNote").textContent =
      `${unknown} bikes without a recorded model year appear in the garage below but not on this axis. Hover any dot for the bike.`;
  }

  /* ---------- bike silhouettes (consistent placeholders by category) ---------- */

  function silWheels(g, pairs, r, ink) {
    pairs.forEach(([cx, cy]) => {
      g.append(svgEl("circle", { cx, cy, r, "stroke-width": 7 }));
      g.append(svgEl("circle", { cx, cy, r: 7, fill: ink, stroke: "none" }));
    });
  }

  function silhouette(category, make) {
    const c = brandColor(make);
    const ink = "var(--text-primary)";
    const svg = svgEl("svg", { viewBox: "0 0 320 200", role: "img", "aria-label": `${make} ${category} silhouette placeholder` });
    const g = svgEl("g", { fill: "none", stroke: ink, "stroke-linecap": "round" });
    g.style.opacity = "0.82";
    g.append(svgEl("line", { x1: 20, y1: 188, x2: 300, y2: 188, "stroke-width": 2, class: "baseline-line" }));

    const kind =
      category === "Scooter" ? "scooter" :
      category === "Road" ? "sport" :
      category === "Classic" ? "classic" :
      category === "Mini" ? "mini" : "offroad"; // Off-road, Trials, Adventure

    if (kind === "offroad") {
      silWheels(g, [[78, 144], [246, 144]], 36, ink);
      g.append(svgEl("path", { d: "M246,144 L214,50 L192,42", "stroke-width": 6 }));
      g.append(svgEl("path", { d: "M186,82 Q222,68 258,82", "stroke-width": 6 }));
      g.append(svgEl("path", { d: "M64,96 Q120,80 178,86 L180,98 Q120,96 66,106 Z", fill: ink, stroke: "none" }));
      g.append(svgEl("path", { d: "M78,144 L152,92 M196,90 L246,144", "stroke-width": 5 }));
      g.append(svgEl("rect", { x: 140, y: 100, width: 44, height: 28, rx: 8, fill: ink, stroke: "none" }));
      g.append(svgEl("path", { d: "M150,132 L238,118", "stroke-width": 6 }));
      svg.append(g);
      svg.append(svgEl("path", { d: "M150,78 Q176,62 202,73 Q205,87 190,92 Q163,94 151,90 Z", fill: c }));
    } else if (kind === "sport") {
      silWheels(g, [[74, 148], [250, 148]], 34, ink);
      g.append(svgEl("path", { d: "M250,148 L228,72", "stroke-width": 6 }));
      g.append(svgEl("path", { d: "M220,70 L238,52", "stroke-width": 5 }));
      g.append(svgEl("path", { d: "M70,92 Q98,82 124,88 L126,100 Q96,104 72,100 Z", fill: ink, stroke: "none" }));
      g.append(svgEl("path", { d: "M74,148 L140,100 M210,96 L250,148", "stroke-width": 5 }));
      g.append(svgEl("rect", { x: 148, y: 104, width: 48, height: 30, rx: 8, fill: ink, stroke: "none" }));
      g.append(svgEl("path", { d: "M160,140 L246,130", "stroke-width": 6 }));
      svg.append(g);
      svg.append(svgEl("path", { d: "M118,86 Q170,58 226,72 L244,106 Q196,90 148,100 Q124,98 118,86 Z", fill: c }));
    } else if (kind === "scooter") {
      silWheels(g, [[86, 160], [240, 160]], 24, ink);
      g.append(svgEl("path", { d: "M240,160 L214,60 L190,52", "stroke-width": 6 }));
      g.append(svgEl("path", { d: "M206,66 Q186,74 182,112 Q180,126 172,130", "stroke-width": 7 }));
      g.append(svgEl("path", { d: "M70,90 Q104,82 138,90 L138,102 L72,102 Z", fill: ink, stroke: "none" }));
      svg.append(g);
      svg.append(svgEl("path", { d: "M54,130 Q52,104 86,100 L148,102 Q170,106 176,124 L148,136 Q92,146 54,130 Z", fill: c }));
    } else { // classic & mini
      const s = kind === "mini" ? 0.68 : 1;
      const gg = svgEl("g", { transform: kind === "mini" ? "translate(50,60) scale(0.68)" : "" });
      const inner = svgEl("g", { fill: "none", stroke: ink, "stroke-linecap": "round" });
      inner.style.opacity = "0.82";
      silWheels(inner, [[72, 148], [252, 148]], 36, ink);
      inner.append(svgEl("path", { d: "M252,148 L226,60 L206,50", "stroke-width": 6 }));
      inner.append(svgEl("path", { d: "M72,148 L128,96 M72,148 L150,128 M210,96 L252,148", "stroke-width": 5 }));
      inner.append(svgEl("rect", { x: 140, y: 100, width: 52, height: 34, rx: 8, fill: ink, stroke: "none" }));
      inner.append(svgEl("path", { d: "M158,138 L246,143", "stroke-width": 6 }));
      inner.append(svgEl("path", { d: "M84,88 Q110,78 130,85 L132,97 Q104,101 84,97 Z", fill: ink, stroke: "none" }));
      gg.append(inner);
      gg.append(svgEl("path", { d: "M130,84 Q162,64 198,78 Q204,92 190,99 Q152,104 131,97 Z", fill: c }));
      // mini keeps the full-size ground line drawn on g above
      svg.append(g, gg);
    }
    return svg;
  }

  /* ---------- garage grid ---------- */

  let activeCategory = "All";
  let activeBrand = "All";
  let sortKey = "seq";

  function renderFilters() {
    const box = $("#categoryChips");
    ["All", ...CATEGORIES].forEach((cat) => {
      const chip = el("button", { class: "chip", "aria-pressed": cat === activeCategory ? "true" : "false" });
      chip.append(document.createTextNode(cat));
      chip.addEventListener("click", () => {
        activeCategory = cat;
        box.querySelectorAll(".chip").forEach((ch) => ch.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        renderGarage();
      });
      box.append(chip);
    });
    const sel = $("#brandSelect");
    brandsByCount.forEach((m) => {
      sel.append(el("option", { value: m }, `${m} (${brandCount.get(m)})`));
    });
    sel.addEventListener("change", (e) => { activeBrand = e.target.value; renderGarage(); });
    $("#sortSelect").addEventListener("change", (e) => { sortKey = e.target.value; renderGarage(); });
  }

  function renderGarage() {
    const grid = $("#garageGrid");
    grid.innerHTML = "";
    let list = bikes.filter((b) =>
      (activeCategory === "All" || b.category === activeCategory) &&
      (activeBrand === "All" || b.make === activeBrand)
    );
    list = [...list].sort((a, b) =>
      sortKey === "seq" ? a.seq - b.seq :
      sortKey === "cc" ? b.cc - a.cc :
      (a.year ?? 9999) - (b.year ?? 9999)
    );
    list.forEach((b) => {
      const card = el("article", { class: "bike-card" });
      const media = el("div", { class: "card-media" });
      if (b.image) {
        media.append(el("img", { src: b.image, alt: `${b.make} ${b.model}`, loading: "lazy" }));
      } else {
        media.append(silhouette(b.category, b.make));
      }
      const body = el("div", { class: "card-body" });
      const top = el("div", { class: "card-top" });
      const chip = el("span", { class: "brand-chip" });
      const sw = el("span", { class: "legend-swatch" });
      sw.style.background = brandColor(b.make);
      chip.append(sw, document.createTextNode(b.make));
      top.append(chip, el("span", { class: "seq-badge" }, `#${b.seq}`));
      body.append(top, el("h3", null,
        b.model + (b.year !== null ? ` (’${String(b.year).slice(2)})` : "")));
      body.append(el("div", { class: "card-years" },
        b.year !== null ? `${b.year} model` : "model year unrecorded"));
      const specs = el("div", { class: "card-specs" });
      specs.append(el("span", null, `${b.cc}cc`), el("span", null, b.category));
      body.append(specs);
      if (b.note) body.append(el("p", { class: "card-story" }, `“${b.note}”`));
      card.append(media, body);
      grid.append(card);
    });
  }

  /* ---------- the buying spree (scatter: arrival order vs cc) ---------- */

  function renderSpree() {
    const W = 520, H = 280, padL = 52, padR = 16, padT = 18, padB = 34;
    const yMax = Math.ceil(Math.max(...bikes.map((b) => b.cc)) / 500) * 500;
    const x = (seq) => padL + ((seq - 1) / (bikes.length - 1)) * (W - padL - padR);
    const y = (cc) => padT + (1 - cc / yMax) * (H - padT - padB);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Engine size by order of arrival" });

    for (let cc = 0; cc <= yMax; cc += 500) {
      svg.append(svgEl("line", { x1: padL, y1: y(cc), x2: W - padR, y2: y(cc), class: cc === 0 ? "baseline-line" : "gridline" }));
      svg.append(svgEl("text", { x: padL - 8, y: y(cc) + 4, "text-anchor": "end", class: "axis-label" }, String(cc)));
    }
    [1, 10, 20, 30, 40, 50, bikes.length].forEach((n) => {
      svg.append(svgEl("text", { x: x(n), y: H - padB + 18, "text-anchor": "middle", class: "axis-label" }, `#${n}`));
    });

    const biggest = bikes.reduce((a, b) => (b.cc > a.cc ? b : a));
    bikes.forEach((b) => {
      const dot = svgEl("circle", {
        cx: x(b.seq), cy: y(b.cc), r: 5,
        fill: brandColor(b.make), stroke: "var(--surface-1)", "stroke-width": 1.5,
      });
      bindTip(dot, () => bikeTip(b));
      svg.append(dot);
    });
    svg.append(svgEl("text", {
      x: x(biggest.seq), y: y(biggest.cc) - 10, "text-anchor": "middle", class: "bar-label",
    }, `${biggest.make} ${biggest.cc}cc`));

    $("#spreeChart").append(svg);
  }

  /* ---------- category mix (horizontal bars, single hue) ---------- */

  function renderCategoryChart() {
    const counts = CATEGORIES.map((cat) => ({ cat, n: bikes.filter((b) => b.category === cat).length }))
      .sort((a, b) => b.n - a.n);
    const rowH = 34, barH = 18, padL = 92, padR = 40, padT = 6;
    const W = 520, H = padT + counts.length * rowH + 10;
    const maxN = Math.max(...counts.map((c) => c.n));
    const x = (n) => padL + (n / maxN) * (W - padL - padR);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bikes per category" });
    counts.forEach((c, i) => {
      const yy = padT + i * rowH + (rowH - barH) / 2;
      svg.append(svgEl("text", { x: padL - 10, y: yy + barH / 2 + 4, "text-anchor": "end", class: "bar-label" }, c.cat));
      const bar = svgEl("rect", { x: padL, y: yy, width: x(c.n) - padL, height: barH, rx: 4, fill: "var(--seq-450)" });
      bindTip(bar, () => {
        const models = bikes.filter((b) => b.category === c.cat).map((b) => `${b.make} ${b.model}`);
        return `<div class="tt-title">${c.cat} · ${c.n}</div><div class="tt-sub">${models.join("<br>")}</div>`;
      });
      svg.append(bar);
      svg.append(svgEl("text", { x: x(c.n) + 8, y: yy + barH / 2 + 4, class: "bar-label" }, String(c.n)));
    });
    svg.append(svgEl("line", { x1: padL, y1: padT, x2: padL, y2: H - 8, class: "baseline-line" }));
    $("#categoryChart").append(svg);
  }

  /* ---------- marque tally (all brands, colour follows the marque) ---------- */

  function renderBrandChart() {
    const rowH = 26, barH = 15, padL = 104, padR = 36, padT = 6;
    const W = 520, H = padT + brandsByCount.length * rowH + 10;
    const maxN = brandCount.get(brandsByCount[0]);
    const x = (n) => padL + (n / maxN) * (W - padL - padR);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bikes owned per marque" });
    brandsByCount.forEach((m, i) => {
      const n = brandCount.get(m);
      const yy = padT + i * rowH + (rowH - barH) / 2;
      svg.append(svgEl("text", { x: padL - 10, y: yy + barH / 2 + 4, "text-anchor": "end", class: "bar-label" }, m));
      const bar = svgEl("rect", { x: padL, y: yy, width: x(n) - padL, height: barH, rx: 4, fill: brandColor(m) });
      bindTip(bar, () => {
        const models = bikes.filter((b) => b.make === m).map((b) => b.model);
        return `<div class="tt-title">${m}</div><div class="tt-sub">${models.join("<br>")}</div>`;
      });
      svg.append(bar);
      svg.append(svgEl("text", { x: x(n) + 8, y: yy + barH / 2 + 4, class: "bar-label" }, String(n)));
    });
    svg.append(svgEl("line", { x1: padL, y1: padT, x2: padL, y2: H - 8, class: "baseline-line" }));
    $("#brandChart").append(svg);
  }

  /* ---------- vintages by decade (columns, single hue) ---------- */

  function renderDecadeChart() {
    const byDecade = new Map();
    knownYears.forEach((b) => {
      const d = Math.floor(b.year / 10) * 10;
      byDecade.set(d, (byDecade.get(d) || 0) + 1);
    });
    const decades = [];
    for (let d = 1950; d <= NOW; d += 10) decades.push({ d, n: byDecade.get(d) || 0 });

    const W = 520, H = 280, padL = 40, padR = 20, padT = 16, padB = 34;
    const maxN = Math.max(...decades.map((c) => c.n));
    const plotW = W - padL - padR;
    const slot = plotW / decades.length;
    const barW = Math.min(48, slot - 12);
    const y = (n) => padT + (1 - n / maxN) * (H - padT - padB);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bikes by decade of manufacture" });
    svg.append(svgEl("line", { x1: padL, y1: y(0), x2: W - padR, y2: y(0), class: "baseline-line" }));
    decades.forEach((c, i) => {
      const cx = padL + slot * i + slot / 2;
      if (c.n > 0) {
        const bar = svgEl("rect", {
          x: cx - barW / 2, y: y(c.n), width: barW, height: y(0) - y(c.n), rx: 4, fill: "var(--seq-450)",
        });
        bindTip(bar, () => {
          const models = knownYears.filter((b) => Math.floor(b.year / 10) * 10 === c.d).map((b) => `’${String(b.year).slice(2)} ${b.make} ${b.model}`);
          return `<div class="tt-title">${c.d}s · ${c.n}</div><div class="tt-sub">${models.join("<br>")}</div>`;
        });
        svg.append(bar);
        svg.append(svgEl("text", { x: cx, y: y(c.n) - 7, "text-anchor": "middle", class: "bar-label" }, String(c.n)));
      }
      svg.append(svgEl("text", { x: cx, y: H - padB + 18, "text-anchor": "middle", class: "axis-label" }, `${String(c.d).slice(2)}s`));
    });
    $("#decadeChart").append(svg);
    $("#decadeNote").textContent =
      `${bikes.length - knownYears.length} bikes without a recorded model year are not counted here.`;
  }

  /* ---------- bought it again ---------- */

  function renderRepeats() {
    const byModel = new Map();
    bikes.forEach((b) => {
      const key = `${b.make} ${b.model}`;
      if (!byModel.has(key)) byModel.set(key, []);
      byModel.get(key).push(b);
    });
    const repeats = [...byModel.entries()].filter(([, v]) => v.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    const row = $("#repeatRow");
    repeats.forEach(([name, list]) => {
      const c = el("div", { class: "record-card" });
      c.append(
        el("div", { class: "rec-label" }, `owned ×${list.length}`),
        el("div", { class: "rec-value" }, name),
        el("div", { class: "rec-note" }, `arrivals #${list.map((b) => b.seq).join(", #")}`)
      );
      row.append(c);
    });
  }

  /* ---------- records ---------- */

  function renderRecords() {
    const biggest = bikes.reduce((a, b) => (b.cc > a.cc ? b : a));
    const smallest = bikes.reduce((a, b) => (b.cc < a.cc ? b : a));
    const avgCc = Math.round(bikes.reduce((s, b) => s + b.cc, 0) / bikes.length);
    const totalCc = bikes.reduce((s, b) => s + b.cc, 0);
    const records = [
      { label: "The elder", value: `${oldest.make} ${oldest.model}`, note: `${oldest.year} — the oldest machine in the story` },
      { label: "Box fresh", value: `${newest.make} ${newest.model}`, note: `${newest.year} — the newest` },
      { label: "The monster", value: `${biggest.make} ${biggest.model}`, note: `${biggest.cc}cc — the biggest engine` },
      { label: "The tiddler", value: `${smallest.make} ${smallest.model}`, note: `${smallest.cc}cc — the smallest` },
      { label: "Average engine", value: `${avgCc}cc`, note: "across all 57" },
      { label: "Lifetime displacement", value: `${(totalCc / 1000).toFixed(1)} litres`, note: "all engines combined" },
    ];
    const row = $("#recordsRow");
    records.forEach((r) => {
      const c = el("div", { class: "record-card" });
      c.append(
        el("div", { class: "rec-label" }, r.label),
        el("div", { class: "rec-value" }, r.value),
        el("div", { class: "rec-note" }, r.note)
      );
      row.append(c);
    });
  }

  /* ---------- table view ---------- */

  function renderTable() {
    const table = $("#bikeTable");
    const head = el("tr");
    [["#", true], ["Make", false], ["Model", false], ["Model year", true], ["cc", true], ["Category", false]]
      .forEach(([h, num]) => head.append(el("th", { class: num ? "num" : "" }, h)));
    const thead = el("thead"); thead.append(head);
    const tbody = el("tbody");
    bikes.forEach((b) => {
      const tr = el("tr");
      tr.append(
        el("td", { class: "num" }, String(b.seq)),
        el("td", null, b.make),
        el("td", null, b.model),
        el("td", { class: "num" }, b.year !== null ? String(b.year) : "—"),
        el("td", { class: "num" }, String(b.cc)),
        el("td", null, b.category)
      );
      tbody.append(tr);
    });
    table.append(thead, tbody);

    const btn = $("#tableToggle");
    btn.addEventListener("click", () => {
      const panel = $("#tablePanel");
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-pressed", panel.hidden ? "false" : "true");
      if (!panel.hidden) panel.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- boot ---------- */

  renderKpis();
  renderLegend();
  renderVintage();
  renderFilters();
  renderGarage();
  renderSpree();
  renderCategoryChart();
  renderBrandChart();
  renderDecadeChart();
  renderRepeats();
  renderRecords();
  renderTable();
})();
