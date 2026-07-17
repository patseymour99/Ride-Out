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

  const bikes = BIKES.map((b, i) => ({
    ...b,
    id: i,
    end: b.to === null ? NOW : b.to,
    current: b.to === null,
    tenure: (b.to === null ? NOW : b.to) - b.from,
  }));

  // Brand → categorical slot, assigned in first-appearance order (never cycled).
  const brands = [];
  bikes.forEach((b) => { if (!brands.includes(b.make)) brands.push(b.make); });
  const MAX_SLOTS = 8;
  const brandColor = (make) => {
    const idx = brands.indexOf(make);
    return idx < MAX_SLOTS ? `var(--series-${idx + 1})` : "var(--text-muted)";
  };

  const minYear = Math.min(...bikes.map((b) => b.from));
  const maxYear = NOW;

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

  /* ---------- sample banner ---------- */

  if (typeof SAMPLE_DATA !== "undefined" && SAMPLE_DATA) {
    $("#sampleBanner").hidden = false;
  }

  /* ---------- KPI row ---------- */

  function renderKpis() {
    const row = $("#kpiRow");
    const longest = bikes.reduce((a, b) => (b.tenure > a.tenure ? b : a));
    const biggest = bikes.reduce((a, b) => (b.cc > a.cc ? b : a));
    const kpis = [
      { label: "Bikes owned", value: bikes.length, note: `${bikes.filter((b) => b.current).length} still in the garage` },
      { label: "Years riding", value: NOW - minYear, note: `since ${minYear}` },
      { label: "Marques ridden", value: brands.length, note: brands.slice(0, 3).join(", ") + (brands.length > 3 ? "…" : "") },
      { label: "Biggest engine", value: `${biggest.cc}cc`, note: `${biggest.make} ${biggest.model}` },
      { label: "Longest kept", value: `${longest.tenure} yrs`, note: `${longest.make} ${longest.model}` },
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
    brands.forEach((m) => {
      const item = el("span", { class: "legend-item" });
      const sw = el("span", { class: "legend-swatch" });
      sw.style.background = brandColor(m);
      item.append(sw, document.createTextNode(m));
      box.append(item);
    });
  }

  /* ---------- ownership timeline (gantt) ---------- */

  function renderTimeline() {
    const rowH = 30, barH = 16, padL = 16, padR = 150, padT = 8, padB = 28;
    const W = 1080;
    const plotW = W - padL - padR;
    const H = padT + bikes.length * rowH + padB;
    const x = (yr) => padL + ((yr - minYear) / (maxYear + 1 - minYear)) * plotW;

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Ownership timeline" });

    // year gridlines each 5 years
    for (let yr = Math.ceil(minYear / 5) * 5; yr <= maxYear; yr += 5) {
      svg.append(svgEl("line", { x1: x(yr), y1: padT, x2: x(yr), y2: H - padB, class: "gridline" }));
      svg.append(svgEl("text", { x: x(yr), y: H - padB + 16, "text-anchor": "middle", class: "axis-label" }, String(yr)));
    }

    const ordered = [...bikes].sort((a, b) => a.from - b.from);
    ordered.forEach((b, i) => {
      const y = padT + i * rowH + (rowH - barH) / 2;
      const x0 = x(b.from), x1 = x(b.end + (b.current ? 0.8 : 0));
      const bar = svgEl("rect", {
        x: x0, y, width: Math.max(x1 - x0, 6), height: barH, rx: 4,
        fill: brandColor(b.make),
      });
      bar.style.cursor = "default";
      bindTip(bar, () =>
        `<div class="tt-title">${b.make} ${b.model}</div>
         <div class="tt-sub">${b.from} – ${b.current ? "today" : b.to} · ${b.tenure} year${b.tenure === 1 ? "" : "s"} · ${b.cc}cc ${b.type}</div>`
      );
      svg.append(bar);
      // direct label to the right of the bar, in primary ink (relief for low-contrast fills)
      svg.append(svgEl("text", {
        x: x1 + 8, y: y + barH / 2 + 4, class: "bar-label",
      }, b.model + (b.current ? " →" : "")));
    });

    svg.append(svgEl("line", { x1: padL, y1: H - padB, x2: W - padR + 60, y2: H - padB, class: "baseline-line" }));
    $("#timelineChart").append(svg);
  }

  /* ---------- bike silhouette placeholder ---------- */

  function silhouette(make) {
    const c = brandColor(make);
    const svg = svgEl("svg", { viewBox: "0 0 320 200", role: "img", "aria-label": `${make} silhouette placeholder` });
    const ink = "var(--text-primary)";
    const g = svgEl("g", { fill: "none", stroke: ink, "stroke-linecap": "round" });
    g.style.opacity = "0.82";
    // wheels
    [[72, 148], [252, 148]].forEach(([cx, cy]) => {
      g.append(svgEl("circle", { cx, cy, r: 36, "stroke-width": 7 }));
      g.append(svgEl("circle", { cx, cy, r: 7, fill: ink, stroke: "none" }));
    });
    // fork + handlebar
    g.append(svgEl("path", { d: "M252,148 L226,60 L206,50", "stroke-width": 6 }));
    // frame
    g.append(svgEl("path", { d: "M72,148 L128,96 M72,148 L150,128 M210,96 L252,148", "stroke-width": 5 }));
    // engine
    g.append(svgEl("rect", { x: 140, y: 100, width: 52, height: 34, rx: 8, fill: ink, stroke: "none" }));
    // exhaust
    g.append(svgEl("path", { d: "M158,138 L246,143", "stroke-width": 6 }));
    // seat
    g.append(svgEl("path", { d: "M84,88 Q110,78 130,85 L132,97 Q104,101 84,97 Z", fill: ink, stroke: "none" }));
    // ground
    g.append(svgEl("line", { x1: 20, y1: 188, x2: 300, y2: 188, "stroke-width": 2, class: "baseline-line" }));
    svg.append(g);
    // tank in the brand colour
    svg.append(svgEl("path", {
      d: "M130,84 Q162,64 198,78 Q204,92 190,99 Q152,104 131,97 Z", fill: c,
    }));
    return svg;
  }

  /* ---------- garage grid ---------- */

  let activeBrand = "All";
  let sortKey = "from";

  function renderChips() {
    const box = $("#brandChips");
    ["All", ...brands].forEach((m) => {
      const chip = el("button", { class: "chip", "aria-pressed": m === activeBrand ? "true" : "false" });
      if (m !== "All") {
        const sw = el("span", { class: "legend-swatch" });
        sw.style.background = brandColor(m);
        chip.append(sw);
      }
      chip.append(document.createTextNode(m));
      chip.addEventListener("click", () => {
        activeBrand = m;
        box.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        renderGarage();
      });
      box.append(chip);
    });
    $("#sortSelect").addEventListener("change", (e) => {
      sortKey = e.target.value;
      renderGarage();
    });
  }

  function renderGarage() {
    const grid = $("#garageGrid");
    grid.innerHTML = "";
    let list = bikes.filter((b) => activeBrand === "All" || b.make === activeBrand);
    list = [...list].sort((a, b) =>
      sortKey === "from" ? a.from - b.from : b[sortKey] - a[sortKey]
    );
    list.forEach((b) => {
      const card = el("article", { class: "bike-card" });
      const media = el("div", { class: "card-media" });
      if (b.image) {
        media.append(el("img", { src: b.image, alt: `${b.make} ${b.model}`, loading: "lazy" }));
      } else {
        media.append(silhouette(b.make));
      }
      const body = el("div", { class: "card-body" });
      const top = el("div", { class: "card-top" });
      const chip = el("span", { class: "brand-chip" });
      const sw = el("span", { class: "legend-swatch" });
      sw.style.background = brandColor(b.make);
      chip.append(sw, document.createTextNode(b.make));
      top.append(chip);
      if (b.current) top.append(el("span", { class: "owned-badge" }, "IN THE GARAGE"));
      body.append(top, el("h3", null, `${b.model} (’${String(b.year).slice(2)})`));
      body.append(el("div", { class: "card-years" },
        `${b.from} – ${b.current ? "today" : b.to} · ${b.tenure} year${b.tenure === 1 ? "" : "s"}`));
      const specs = el("div", { class: "card-specs" });
      specs.append(el("span", null, `${b.cc}cc`), el("span", null, b.type));
      body.append(specs);
      if (b.story) body.append(el("p", { class: "card-story" }, `“${b.story}”`));
      card.append(media, body);
      grid.append(card);
    });
  }

  /* ---------- engine size chart (dots + step line, single hue) ---------- */

  function renderCcChart() {
    const W = 520, H = 260, padL = 52, padR = 20, padT = 14, padB = 32;
    const maxCc = Math.max(...bikes.map((b) => b.cc));
    const yMax = Math.ceil(maxCc / 250) * 250;
    const x = (yr) => padL + ((yr - minYear) / (maxYear - minYear)) * (W - padL - padR);
    const y = (cc) => padT + (1 - cc / yMax) * (H - padT - padB);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Engine size at purchase, by year" });

    for (let cc = 0; cc <= yMax; cc += 250) {
      svg.append(svgEl("line", { x1: padL, y1: y(cc), x2: W - padR, y2: y(cc), class: cc === 0 ? "baseline-line" : "gridline" }));
      svg.append(svgEl("text", { x: padL - 8, y: y(cc) + 4, "text-anchor": "end", class: "axis-label" }, String(cc)));
    }
    for (let yr = Math.ceil(minYear / 10) * 10; yr <= maxYear; yr += 10) {
      svg.append(svgEl("text", { x: x(yr), y: H - padB + 18, "text-anchor": "middle", class: "axis-label" }, String(yr)));
    }

    const pts = [...bikes].sort((a, b) => a.from - b.from);
    const path = pts.map((b, i) => `${i ? "L" : "M"}${x(b.from)},${y(b.cc)}`).join(" ");
    svg.append(svgEl("path", { d: path, fill: "none", stroke: "var(--seq-450)", "stroke-width": 2, "stroke-linejoin": "round" }));

    const maxBike = bikes.reduce((a, b) => (b.cc > a.cc ? b : a));
    const minBike = bikes.reduce((a, b) => (b.cc < a.cc ? b : a));
    pts.forEach((b) => {
      const dot = svgEl("circle", {
        cx: x(b.from), cy: y(b.cc), r: 5,
        fill: "var(--seq-450)", stroke: "var(--surface-1)", "stroke-width": 2,
      });
      bindTip(dot, () =>
        `<div class="tt-title">${b.make} ${b.model}</div>
         <div class="tt-sub">bought ${b.from} · ${b.cc}cc</div>`);
      svg.append(dot);
      // selective direct labels: only the extremes
      if (b === maxBike || b === minBike) {
        svg.append(svgEl("text", {
          x: x(b.from), y: y(b.cc) - 10, "text-anchor": "middle", class: "bar-label",
        }, `${b.cc}cc`));
      }
    });

    $("#ccChart").append(svg);
  }

  /* ---------- bikes-in-garage chart (step area, single hue) ---------- */

  function renderStableChart() {
    const W = 520, H = 260, padL = 40, padR = 20, padT = 14, padB = 32;
    const years = [];
    for (let yr = minYear; yr <= maxYear; yr++) {
      // A bike counts for [from, to) — the sale year belongs to its successor —
      // but a bike always counts in its own purchase year.
      const owned = (b, y) => b.from <= y && (b.current ? y <= NOW : y < b.to || y === b.from);
      const n = bikes.filter((b) => owned(b, yr)).length;
      years.push({ yr, n });
    }
    const yMax = Math.max(2, ...years.map((d) => d.n));
    const x = (yr) => padL + ((yr - minYear) / (maxYear - minYear)) * (W - padL - padR);
    const y = (n) => padT + (1 - n / yMax) * (H - padT - padB);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Number of bikes owned simultaneously, by year" });

    for (let n = 0; n <= yMax; n++) {
      svg.append(svgEl("line", { x1: padL, y1: y(n), x2: W - padR, y2: y(n), class: n === 0 ? "baseline-line" : "gridline" }));
      svg.append(svgEl("text", { x: padL - 8, y: y(n) + 4, "text-anchor": "end", class: "axis-label" }, String(n)));
    }
    for (let yr = Math.ceil(minYear / 10) * 10; yr <= maxYear; yr += 10) {
      svg.append(svgEl("text", { x: x(yr), y: H - padB + 18, "text-anchor": "middle", class: "axis-label" }, String(yr)));
    }

    // step path
    let d = `M${x(years[0].yr)},${y(years[0].n)}`;
    for (let i = 1; i < years.length; i++) {
      d += ` L${x(years[i].yr)},${y(years[i - 1].n)} L${x(years[i].yr)},${y(years[i].n)}`;
    }
    const area = d + ` L${x(maxYear)},${y(0)} L${x(minYear)},${y(0)} Z`;
    const fill = svgEl("path", { d: area, fill: "var(--seq-450)", "fill-opacity": 0.18, stroke: "none" });
    svg.append(fill);
    svg.append(svgEl("path", { d, fill: "none", stroke: "var(--seq-450)", "stroke-width": 2 }));

    // invisible hover strips per year
    years.forEach((pt) => {
      const strip = svgEl("rect", {
        x: x(pt.yr) - 4, y: padT, width: 8, height: H - padT - padB, fill: "transparent",
      });
      bindTip(strip, () => {
        const owned = bikes
          .filter((b) => b.from <= pt.yr && (b.current ? pt.yr <= NOW : pt.yr < b.to || pt.yr === b.from))
          .map((b) => `${b.make} ${b.model}`);
        return `<div class="tt-title">${pt.yr} · ${pt.n} bike${pt.n === 1 ? "" : "s"}</div>
                <div class="tt-sub">${owned.join("<br>") || "—"}</div>`;
      });
      svg.append(strip);
    });

    $("#stableChart").append(svg);
  }

  /* ---------- brand tally (horizontal bars, categorical) ---------- */

  function renderBrandChart() {
    const counts = brands.map((m) => ({ m, n: bikes.filter((b) => b.make === m).length }))
      .sort((a, b) => b.n - a.n);
    const rowH = 34, barH = 18, padL = 90, padR = 40, padT = 6;
    const W = 520, H = padT + counts.length * rowH + 10;
    const maxN = Math.max(...counts.map((c) => c.n));
    const x = (n) => padL + (n / maxN) * (W - padL - padR);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bikes owned per brand" });
    counts.forEach((c, i) => {
      const yy = padT + i * rowH + (rowH - barH) / 2;
      svg.append(svgEl("text", { x: padL - 10, y: yy + barH / 2 + 4, "text-anchor": "end", class: "bar-label" }, c.m));
      const bar = svgEl("rect", { x: padL, y: yy, width: x(c.n) - padL, height: barH, rx: 4, fill: brandColor(c.m) });
      bindTip(bar, () => {
        const models = bikes.filter((b) => b.make === c.m).map((b) => b.model);
        return `<div class="tt-title">${c.m}</div><div class="tt-sub">${models.join("<br>")}</div>`;
      });
      svg.append(bar);
      svg.append(svgEl("text", { x: x(c.n) + 8, y: yy + barH / 2 + 4, class: "bar-label" }, String(c.n)));
    });
    svg.append(svgEl("line", { x1: padL, y1: padT, x2: padL, y2: H - 8, class: "baseline-line" }));
    $("#brandChart").append(svg);
  }

  /* ---------- bikes per decade (columns, single hue) ---------- */

  function renderDecadeChart() {
    const byDecade = new Map();
    bikes.forEach((b) => {
      const d = Math.floor(b.from / 10) * 10;
      byDecade.set(d, (byDecade.get(d) || 0) + 1);
    });
    const decades = [];
    for (let d = Math.floor(minYear / 10) * 10; d <= maxYear; d += 10) {
      decades.push({ d, n: byDecade.get(d) || 0 });
    }
    const W = 520, H = 260, padL = 40, padR = 20, padT = 16, padB = 34;
    const maxN = Math.max(...decades.map((c) => c.n));
    const plotW = W - padL - padR;
    const slot = plotW / decades.length;
    const barW = Math.min(56, slot - 14);
    const y = (n) => padT + (1 - n / maxN) * (H - padT - padB);

    const svg = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bikes acquired per decade" });
    for (let n = 0; n <= maxN; n++) {
      svg.append(svgEl("line", { x1: padL, y1: y(n), x2: W - padR, y2: y(n), class: n === 0 ? "baseline-line" : "gridline" }));
    }
    decades.forEach((c, i) => {
      const cx = padL + slot * i + slot / 2;
      if (c.n > 0) {
        const bar = svgEl("rect", {
          x: cx - barW / 2, y: y(c.n), width: barW, height: y(0) - y(c.n), rx: 4, fill: "var(--seq-450)",
        });
        bindTip(bar, () => {
          const models = bikes.filter((b) => Math.floor(b.from / 10) * 10 === c.d).map((b) => `${b.make} ${b.model}`);
          return `<div class="tt-title">${c.d}s · ${c.n} bike${c.n === 1 ? "" : "s"}</div><div class="tt-sub">${models.join("<br>")}</div>`;
        });
        svg.append(bar);
        svg.append(svgEl("text", { x: cx, y: y(c.n) - 7, "text-anchor": "middle", class: "bar-label" }, String(c.n)));
      }
      svg.append(svgEl("text", { x: cx, y: H - padB + 18, "text-anchor": "middle", class: "axis-label" }, `${c.d}s`));
    });
    $("#decadeChart").append(svg);
  }

  /* ---------- records ---------- */

  function renderRecords() {
    const longest = bikes.reduce((a, b) => (b.tenure > a.tenure ? b : a));
    const shortest = bikes.reduce((a, b) => (b.tenure < a.tenure ? b : a));
    const biggest = bikes.reduce((a, b) => (b.cc > a.cc ? b : a));
    const smallest = bikes.reduce((a, b) => (b.cc < a.cc ? b : a));
    const avgTenure = (bikes.reduce((s, b) => s + b.tenure, 0) / bikes.length).toFixed(1);
    const totalCc = bikes.reduce((s, b) => s + b.cc, 0);
    const records = [
      { label: "The keeper", value: `${longest.make} ${longest.model}`, note: `${longest.tenure} years — the longest tenure` },
      { label: "The fling", value: `${shortest.make} ${shortest.model}`, note: `just ${shortest.tenure} year${shortest.tenure === 1 ? "" : "s"} before it moved on` },
      { label: "The monster", value: `${biggest.make} ${biggest.model}`, note: `${biggest.cc}cc — the biggest engine` },
      { label: "The starter", value: `${smallest.make} ${smallest.model}`, note: `${smallest.cc}cc — where it all began` },
      { label: "Average tenure", value: `${avgTenure} years`, note: "per bike, across the lifetime" },
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
    ["Make", "Model", "Model year", "cc", "Type", "Bought", "Sold", "Years kept"].forEach((h, i) => {
      head.append(el("th", { class: i >= 2 && i !== 4 ? "num" : "" }, h));
    });
    const thead = el("thead"); thead.append(head);
    const tbody = el("tbody");
    [...bikes].sort((a, b) => a.from - b.from).forEach((b) => {
      const tr = el("tr");
      tr.append(
        el("td", null, b.make),
        el("td", null, b.model),
        el("td", { class: "num" }, String(b.year)),
        el("td", { class: "num" }, String(b.cc)),
        el("td", null, b.type),
        el("td", { class: "num" }, String(b.from)),
        el("td", { class: "num" }, b.current ? "—" : String(b.to)),
        el("td", { class: "num" }, String(b.tenure))
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
  renderTimeline();
  renderChips();
  renderGarage();
  renderCcChart();
  renderStableChart();
  renderBrandChart();
  renderDecadeChart();
  renderRecords();
  renderTable();
})();
