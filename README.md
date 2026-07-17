# The Garage — a lifetime on two wheels

A dashboard of every motorbike Dad has owned, from the first to the current one.
Static site, zero dependencies — open `index.html` in a browser and it just works.

> **Currently showing sample data.** The real list drops into `js/data.js`.

## Views

- **Headline stats** — bikes owned, years riding, marques, biggest engine, longest kept
- **Ownership timeline** — every bike as a bar from purchase to sale, coloured by brand
- **The garage** — a place card for every machine, filterable by brand and sortable
- **Engine size through the years** — displacement of each bike at purchase
- **Bikes in the garage** — how many he owned simultaneously, year by year
- **Brand tally & bikes per decade** — where the loyalty lies
- **Garage records** — the keeper, the fling, the monster, the starter
- **Table view** — the full record, one row per bike

## Updating the data

Everything is driven by `js/data.js`. Each bike is one object:

```js
{ make: "Honda", model: "CB750F", year: 1981, cc: 748, type: "Standard",
  from: 1982, to: 1986, image: "images/cb750f.jpg",
  story: "The first big four." }
```

- `to: null` means he still owns it (shows the "IN THE GARAGE" badge).
- `image: null` renders a consistent built-in silhouette; drop photos into
  `images/` and point `image` at them for the real thing.
- Set `SAMPLE_DATA = false` once the real list is in to hide the banner.

Every chart, stat, and record recomputes automatically from the list.
