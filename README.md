# Your New York

A pocket guide for a solo-by-day trip to New York, 9–13 December 2026, based at
The Set in Hudson Yards. Built to be opened on a phone and added to the Home Screen.

## What is in it

- **Today** — a countdown before the trip; during it, daylight left, weather and
  distance home. One yellow button for directions back to the hotel, plus the hotel
  address in large type for a driver, send-my-location and a call button. Each
  day's plan is drawn as a subway line with its stops.
- **Map** — turned so uptown is up. Safety is drawn on the streets themselves, like
  traffic: amber for "stay sharp", red for "avoid if you can", nothing where there is
  nothing to think about. It follows the time in New York (daytime, evening, late
  night). "Take me home" and each place's walking route find the safest reasonable
  walk along real streets and say when riding is the better choice.
- **Places** — 39 picks grouped by neighbourhood, nearest first, with search and
  filters. Each opens a page with a tip, cost, and which train to take from the hotel.
- **Guide** — getting back to the hotel after dark, then short pages on staying
  comfortable and getting around.

## Running it

A static site with no build step:

```
python3 -m http.server 8000
```

Host it anywhere that serves static files over HTTPS (needed for location and
offline use).

## Editing

- `js/data.js` — all content: hotel, places, day plans, safety areas, tips.
  Areas are written in street-grid terms: `rect(9.5, 7.6, 36, 43)` means 9½th to
  7½th Avenue, 36th to 43rd Street.
- `js/core.js` — shared state, helpers and the page sheet.
- `js/views.js` — the Today, Places and Guide tabs and the detail pages.
- `js/map.js` — the map.
- `js/route.js`, `js/streets.js` — the street safety model and walking routes (see below).
- `css/style.css` — the design system; colours and type are tokens at the top.

Names and a phone number are entered in the app and stay on that phone.

## The street safety model

`js/streets.js` is generated, not written by hand. It holds a walkable street graph
of Manhattan below about 96th Street (3,300 junctions, 5,700 blocks) with a level
for every block at three times of day.

- **Incidents**: twelve months of NYPD complaint records from NYC Open Data,
  limited to robbery, assault, harassment and theft from the person that happened
  on the street. Each is attached to the block it happened on.
- **Station-house artefacts**: the NYPD records sex offences, and reports it cannot
  place, at the precinct station house. Those points are detected and removed, and
  sex offences are left out, because their locations say nothing about a street.
- **Exposure**: a block's count is set against how busy it is (restaurants, bars,
  shops, hotels and theatres along it, from OpenStreetMap), per hour of the band.
  A block is flagged when it records a lot for how busy it is, and only with
  enough incidents behind it.
- **Empty blocks**: the Lincoln Tunnel ramps, the far west waterfront and Central
  Park are flagged after dark from local knowledge; incident data cannot see
  places where nobody is.
- **Routing** (`js/route.js`): Dijkstra over the graph. After dark the cost of a
  block rises if it is flagged or has no open doors, and falls on main streets.

To rebuild it (needs Python with `shapely` and `mapbox-vector-tile`):

```
python3 tools/get_tiles.py  <dir>/tiles      # street network and venues
python3 tools/get_nypd.py   <dir>/nypd.json  # NYPD records, last 12 months available
node -e "..."                                # export zones and places to <dir>/app.json (see export_streets.py)
python3 tools/build_streets.py  <dir> <dir>/model.pkl
python3 tools/export_streets.py <dir> js/streets.js
```

## Caveats

- Opening hours, prices and holiday-market dates were checked in mid-November 2026
  and several weren't final. Check the linked official site before crossing town.
- The safety map shows where incidents were reported over the past year. It is not
  a forecast and not a guarantee about any one evening.

## Credits

Map: MapLibre GL (vendored) with OpenFreeMap vector tiles, no API key; © OpenMapTiles,
data © OpenStreetMap contributors. Street safety: NYPD Complaint Data, NYC Open Data.
Weather: Open-Meteo. Icons: Lucide (ISC).
Type: Archivo and Inter (SIL Open Font License).
