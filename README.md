# The Garage — a lifetime on two wheels

A dashboard of every motorbike Dad has owned since 2004 — all 57 of them,
from a 1953 Royal Enfield Bullet to a 2026 Honda ADV 350.
Static site, zero dependencies — open `index.html` in a browser and it just works.

## Views

- **Headline stats** — bikes owned, buying rate, marques, vintage span, biggest engine
- **Seven decades of machinery** — every bike placed at its model year, coloured by marque
- **The garage** — a place card for every machine in arrival order, filterable by
  category and marque, sortable by arrival, engine size, or vintage
- **The buying spree** — engine size of each arrival, 1st to 57th
- **What kind of rider?** — the collection by category (off-road leads, obviously)
- **The marque tally** — all the makers, from Yamaha and KTM down to the one-offs
- **Vintages by decade** — when the bikes themselves were built
- **Bought it again** — models owned more than once (WR 450 ×4…)
- **Garage records** — the elder, the monster, the tiddler, lifetime displacement
- **Table view** — the full record, one row per bike

## Updating the data

Everything is driven by `js/data.js`. Each bike is one object, listed in the
order it arrived:

```js
{ make: "Yamaha", model: "WR 450", year: 2008, cc: 450,
  category: "Off-road", image: "images/wr450.jpg",
  note: "WR450 number two." }
```

- `year` is the bike's model year (`null` if unrecorded).
- `category` is one of: Off-road, Trials, Road, Adventure, Scooter, Classic, Mini.
- `image: null` renders a consistent category-matched silhouette; drop photos
  into `images/` and point `image` at them for the real thing.
- Engine sizes and model identifications are best-effort — correct them freely.

Every chart, stat, and record recomputes automatically from the list.
