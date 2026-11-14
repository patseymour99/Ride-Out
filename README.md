# Your New York

A pocket guide for a solo-by-day trip to New York, 9–13 December 2026, based at
The Set in Hudson Yards. Built to be opened on a phone.

- **Today** — countdown before the trip, then the day's plan, daylight remaining,
  live weather, and four big buttons: take me home, show the address to a driver,
  send my location, call.
- **Map** — every place in the guide plus colour-coded areas (Relaxed / Stay sharp /
  Skip) that switch between daytime and after-dark guidance on their own.
- **Explore** — 39 places, nearest first, filterable (festive, free, indoors…), each
  with a tip, cost, and exactly which train to take from the hotel.
- **Safety** — how to get back to the hotel at night, six habits, area-by-area
  notes, subway sense, common hustles, emergency numbers.
- **Transit** — the two stations and one bus that reach everything, paying by tap,
  reading the subway, cabs, tipping.

## Running it

It's a static site with no build step. Serve the folder with anything:

```
python3 -m http.server 8000
```

Host it anywhere that serves static files over HTTPS (needed for location and
offline support). On the phone, open the link and use **Share → Add to Home
Screen** so it behaves like an app and opens without signal.

## Editing

Everything on screen comes from `js/data.js`: the hotel, the places, the day
plans, the safety zones and the tips. Zones are written in street-grid terms —
`rect(9.5, 7.6, 36, 43)` means 9½th to 7½th Avenue, 36th to 43rd Street.

Names and a phone number are entered in the app (the person icon, top right) and
stay on that phone.

## Caveats

- Opening hours, prices and holiday-market dates were checked in mid-November
  2026 and several weren't final. Check the linked official site before
  travelling across town for something.
- The safety areas are broad-strokes local knowledge about how places feel on
  foot, not crime data.

Map: Leaflet (vendored), tiles © OpenStreetMap contributors. Weather: Open-Meteo.
