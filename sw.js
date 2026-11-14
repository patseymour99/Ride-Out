/* Offline support: the guide itself is cached so it opens with no signal;
   map tiles are kept as they're viewed. Network-first, so updates show up at once. */
const SHELL = "nyc-shell-v4";
const TILES = "nyc-tiles-v3";
const FILES = ["./", "index.html", "css/style.css", "js/data.js", "js/app.js", "vendor/maplibre/maplibre-gl.js", "vendor/maplibre/maplibre-gl.css", "icons/icon.svg", "icons/icon-180.png", "manifest.webmanifest"];
const TILE_HOSTS = /tiles\.openfreemap\.org/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (TILE_HOSTS.test(url.hostname)) {
    e.respondWith(caches.open(TILES).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") { cache.put(req, res.clone()); trim(cache, 1500); }
      return res;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
