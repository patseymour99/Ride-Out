#!/usr/bin/env node
/**
 * Fetch a photo for each bike from Wikimedia Commons into images/.
 *
 * Run this on a machine WITH internet access (it can't run in a sandboxed
 * environment that blocks the web):
 *
 *     node scripts/fetch_images.mjs
 *
 * For each bike it searches Commons for "<make> <model> motorcycle", downloads
 * the first result as images/bike-<nn>.jpg, and records the source page in
 * images/ATTRIBUTIONS.md (Commons images are freely licensed but most require
 * attribution). The dashboard automatically shows any images/bike-<nn>.jpg it
 * finds — no data edits needed. Delete a file to fall back to the illustration,
 * or replace it with a better photo of the actual bike.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataSrc = await readFile(path.join(root, "js", "data.js"), "utf8");

// Pull make/model/search out of data.js without executing browser globals.
const bikes = [...dataSrc.matchAll(/make:\s*"([^"]+)",\s*model:\s*"([^"]+)",\s*year:\s*(?:\d+|null),\s*cc:\s*\d+,\s*category:\s*"[^"]+",\s*search:\s*"([^"]+)"/g)]
  .map(([, make, model, search], i) => ({ seq: i + 1, make, model, search }));

if (bikes.length === 0) {
  console.error("Could not parse any bikes out of js/data.js");
  process.exit(1);
}
console.log(`Found ${bikes.length} bikes. Fetching from Wikimedia Commons…\n`);

await mkdir(path.join(root, "images"), { recursive: true });
const attributions = ["# Image sources", "", "Photos fetched from Wikimedia Commons — check each file page for its licence and author.", ""];
const API = "https://commons.wikimedia.org/w/api.php";
let ok = 0;

for (const b of bikes) {
  const file = `bike-${String(b.seq).padStart(2, "0")}.jpg`;
  const query = `${b.search || `${b.make} ${b.model}`} motorcycle`;
  try {
    const url = `${API}?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "garage-dashboard/1.0 (personal project)" } });
    const json = await res.json();
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const info = pages[0]?.imageinfo?.[0];
    if (!info?.thumburl) throw new Error("no result");
    const imgRes = await fetch(info.thumburl, { headers: { "User-Agent": "garage-dashboard/1.0 (personal project)" } });
    if (!imgRes.ok) throw new Error(`download failed (${imgRes.status})`);
    await writeFile(path.join(root, "images", file), Buffer.from(await imgRes.arrayBuffer()));
    attributions.push(`- \`${file}\` (#${b.seq} ${b.make} ${b.model}): ${info.descriptionurl || info.url}`);
    ok++;
    console.log(`  ✔ #${b.seq} ${b.make} ${b.model} → images/${file}`);
  } catch (e) {
    console.log(`  ✘ #${b.seq} ${b.make} ${b.model}: ${e.message} — card keeps its illustration`);
  }
  await new Promise((r) => setTimeout(r, 400)); // be polite to the API
}

await writeFile(path.join(root, "images", "ATTRIBUTIONS.md"), attributions.join("\n") + "\n");
console.log(`\nDone: ${ok}/${bikes.length} images saved. Review them — a generic model photo`);
console.log("may not match the exact bike; swap in your own photos with the same filenames.");
