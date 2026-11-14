# Your New York

A pocket guide for a solo-by-day trip to New York, 9–13 December 2026, based at
The Set in Hudson Yards. Built to be opened on a phone and added to the Home Screen.

## What is in it

- **Today** — a countdown before the trip; during it, daylight left, weather and
  distance home. One yellow button for directions back to the hotel, plus the hotel
  address in large type for a driver, send-my-location and a call button. Each
  day's plan is drawn as a subway line with its stops.
- **Map** — turned so uptown is up. Only areas that need care are shaded
  (Stay sharp / Skip), switching to after-dark guidance at sunset in New York.
  Places, her subway stations, each day's route, and the walk home after dark.
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
- `css/style.css` — the design system; colours and type are tokens at the top.

Names and a phone number are entered in the app and stay on that phone.

## Caveats

- Opening hours, prices and holiday-market dates were checked in mid-November 2026
  and several weren't final. Check the linked official site before crossing town.
- The safety areas are broad-strokes local knowledge about how places feel on foot,
  not crime data.

## Credits

Map: MapLibre GL (vendored) with OpenFreeMap vector tiles, no API key; © OpenMapTiles,
data © OpenStreetMap contributors. Weather: Open-Meteo. Icons: Lucide (ISC).
Type: Archivo and Inter (SIL Open Font License).
