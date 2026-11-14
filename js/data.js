/* ============================================================
   Your New York — all the content lives here.
   Edit freely: every screen is rendered from these lists.
   ============================================================ */

const TRIP = {
  start: "2026-12-09",
  end: "2026-12-13",
  tz: "America/New_York",
  // Early-December light in New York: it is properly dark by about 4:45 pm.
  sunrise: "07:08",
  sunset: "16:28",
  hotel: {
    name: "The Set",
    address: "455 10th Avenue",
    cross: "between W 35th & W 36th St",
    cityLine: "New York, NY 10018",
    area: "Hudson Yards",
    lat: 40.7558,
    lng: -73.9984,
  },
};

/* Manhattan's street grid as a coordinate system, so zones can be written the
   way people talk about them: "8th to 9th Avenue, 37th to 43rd Street".
   Anchored on 8th Ave & 34th St. Madison ≈ 4.5, Park ≈ 4, Lexington ≈ 3.5. */
function g(ave, st) {
  return [
    40.7524 + (ave - 8) * 0.00122 + (st - 34) * 0.000633,
    -73.9933 - (ave - 8) * 0.0029 + (st - 34) * 0.000463,
  ];
}
function rect(aveWest, aveEast, stSouth, stNorth) {
  return [g(aveWest, stSouth), g(aveEast, stSouth), g(aveEast, stNorth), g(aveWest, stNorth)];
}

/* ---------- Safety zones ----------
   level: "easy" (relaxed), "sharp" (fine, but keep your wits about you),
          "skip" (not on foot / not right now).
   Each zone has a daytime level and an after-dark level. */
const ZONES = [
  {
    id: "home", name: "Hudson Yards (home turf)", day: "easy", night: "easy",
    poly: rect(12.7, 9.5, 29.5, 36),
    note: "New, bright, privately patrolled and busy until the shops close around 8–9 pm. The hotel's own block on 10th Avenue is quiet at night but fine — walk home along 34th Street or through the park on Hudson Boulevard.",
  },
  {
    id: "tunnel", name: "Lincoln Tunnel blocks", day: "easy", night: "skip",
    poly: rect(12.2, 9.5, 36, 43),
    note: "Directly north of the hotel: tunnel ramps, bus garages and long blank blocks. Dull but harmless by day. After dark there is nobody about, so don't walk through here to or from Times Square — take the 7 train one stop, or a cab.",
  },
  {
    id: "pabt", name: "Port Authority & 8th Avenue", day: "sharp", night: "skip",
    poly: rect(9.5, 7.6, 36, 43),
    note: "The bus terminal and the 8th Avenue blocks around it are the scruffiest part of Midtown: people asking for money, some erratic behaviour. Walk through with purpose by day; after dark go around it or under it (the 7 train).",
  },
  {
    id: "penn", name: "Penn Station & Herald Square", day: "sharp", night: "sharp",
    poly: rect(9.5, 6.4, 29.5, 36),
    note: "Very busy at all hours, which keeps it safe, but it attracts hustlers and people in a bad way — especially 7th and 8th Avenues right by the station. 34th Street itself is your main walking corridor home and is fine. Late at night, take a cab instead.",
  },
  {
    id: "garment", name: "Garment District", day: "easy", night: "sharp",
    poly: rect(7.6, 6.4, 36, 40),
    note: "Offices and wholesale shops. Fine by day; the side streets empty out after work, so stick to the avenues in the evening.",
  },
  {
    id: "tsq", name: "Times Square", day: "sharp", night: "sharp",
    poly: rect(7.6, 6.3, 40, 50),
    note: "Packed day and night, so the risk here is your wallet, not you. Costumed characters, 'free' CD sellers and bracelet-tying 'monks' all want cash — don't take anything handed to you and keep walking. Bag zipped and in front.",
  },
  {
    id: "hk", name: "Theater District & Hell's Kitchen", day: "easy", night: "easy",
    poly: rect(10.5, 7.6, 43, 59.3),
    note: "Broadway theatres and 9th Avenue's long strip of restaurants. Lively until late with theatre crowds. Stay on 8th–9th Avenue rather than drifting further west at night.",
  },
  {
    id: "hkwest", name: "Far West Side (waterfront)", day: "easy", night: "sharp",
    poly: rect(12.2, 10.5, 43, 59),
    note: "Car dealerships, piers and the highway. Nothing wrong with it by day; little reason to be here on foot after dark.",
  },
  {
    id: "midtown", name: "Midtown — Fifth Ave, Rockefeller, Bryant Park", day: "easy", night: "easy",
    poly: rect(6.3, 3, 40, 59),
    note: "The Christmas heart of the city. Crowded, bright and heavily policed well into the evening. Watch your bag in the crush around the tree and the markets.",
  },
  {
    id: "nomad", name: "Murray Hill, NoMad & Koreatown", day: "easy", night: "easy",
    poly: rect(6.4, 3, 23, 40),
    note: "Empire State Building, Koreatown's late-night restaurants on 32nd Street, the Morgan Library. Comfortable day and evening.",
  },
  {
    id: "chelsea", name: "Chelsea, High Line & Meatpacking", day: "easy", night: "easy",
    poly: rect(12.7, 6.4, 14, 29.5),
    note: "Galleries, the High Line, Chelsea Market, good restaurants. The High Line closes at 8 pm in winter; after that walk on 8th or 9th Avenue rather than the quiet blocks west of 10th.",
  },
  {
    id: "flatiron", name: "Flatiron, Union Square & Gramercy", day: "easy", night: "easy",
    poly: rect(6.4, 3, 14, 23),
    note: "Shopping, Eataly, the holiday market. Busy into the evening. Union Square park itself gets a bit ragged late at night — the streets around it are fine.",
  },
  {
    id: "park", name: "Central Park", day: "easy", night: "skip",
    poly: rect(7.97, 5.12, 59.3, 110),
    note: "Glorious and full of people in daylight — stay south of 96th Street. It is dark by 4:45 pm in December and the paths empty fast, so plan to be out of the park by 4 pm and don't cut through it at night.",
  },
  {
    id: "uws", name: "Upper West Side", day: "easy", night: "easy",
    poly: rect(11.6, 7.97, 59.3, 96),
    note: "Residential, leafy, families and brownstones. Lincoln Center and the Natural History Museum. One of the most relaxed parts of Manhattan.",
  },
  {
    id: "ues", name: "Upper East Side & Museum Mile", day: "easy", night: "easy",
    poly: rect(5.12, 2.5, 59, 96),
    note: "The Met, the Guggenheim, Madison Avenue shops. Quiet, wealthy and very comfortable to walk around.",
  },
  {
    id: "village", name: "West Village & Greenwich Village", day: "easy", night: "easy",
    poly: [[40.7428, -74.0125], [40.7373, -73.9968], [40.7347, -73.9907], [40.7255, -73.9968], [40.7285, -74.0025], [40.7290, -74.0125]],
    note: "Crooked little streets, cafés and boutiques, busy with people eating out until late. Washington Square Park is lovely by day; skip the park itself after dark and walk the streets around it.",
  },
  {
    id: "eastvillage", name: "East Village", day: "easy", night: "sharp",
    poly: [[40.7347, -73.9907], [40.7285, -73.9760], [40.7205, -73.9800], [40.7243, -73.9927], [40.7255, -73.9968]],
    note: "Bars, vintage shops, cheap great food. Fine by day. It's a late-night drinking area — fun with company, a bit rowdy alone after 10 pm.",
  },
  {
    id: "soho", name: "SoHo, Nolita & Tribeca", day: "easy", night: "easy",
    poly: [[40.7290, -74.0110], [40.7285, -74.0025], [40.7255, -73.9968], [40.7243, -73.9927], [40.7160, -73.9965], [40.7190, -74.0010], [40.7142, -74.0064], [40.7175, -74.0130]],
    note: "Cast-iron buildings and serious shopping. Safe, but the streets go quiet once the shops shut around 8 pm — stay on Broadway, Prince and Spring.",
  },
  {
    id: "chinatown", name: "Chinatown & Lower East Side", day: "easy", night: "sharp",
    poly: [[40.7243, -73.9927], [40.7205, -73.9800], [40.7120, -73.9790], [40.7105, -73.9920], [40.7085, -74.0005], [40.7142, -74.0064], [40.7190, -74.0010], [40.7160, -73.9965]],
    note: "Brilliant for daytime wandering and dumplings. At night the main streets are busy but the side streets and the blocks near the bridges get dark and empty.",
  },
  {
    id: "fidi", name: "Lower Manhattan & the Financial District", day: "easy", night: "sharp",
    poly: [[40.7175, -74.0130], [40.7142, -74.0064], [40.7085, -74.0005], [40.7055, -74.0020], [40.7005, -74.0125], [40.7010, -74.0170], [40.7110, -74.0170]],
    note: "9/11 Memorial, Wall Street, the ferry. Full of office workers and visitors by day. It isn't dangerous at night, just deserted — head back uptown once the offices empty.",
  },
  {
    id: "dumbo", name: "DUMBO & Brooklyn Heights", day: "easy", night: "sharp",
    poly: [[40.7050, -73.9975], [40.7045, -73.9850], [40.6990, -73.9860], [40.6930, -73.9930], [40.6935, -74.0000], [40.7000, -73.9990]],
    note: "Cobbled streets and the best skyline views. Walk the Brooklyn Bridge in daylight (it's windy, cold and thinly peopled after dark). DUMBO itself is fine in the early evening — take the subway or a cab back, don't walk the bridge.",
  },
];

/* ---------- Places ----------
   lines: subway bullets to show. go: how to get there from the hotel. */
const CATS = {
  festive: { label: "Festive", icon: "tree" },
  sights: { label: "Sights", icon: "camera" },
  views: { label: "Views", icon: "eye" },
  museums: { label: "Museums", icon: "museum" },
  walks: { label: "Parks & walks", icon: "leaf" },
  food: { label: "Food", icon: "food" },
  shops: { label: "Shopping", icon: "bag" },
  shows: { label: "Shows", icon: "ticket" },
};

const PLACES = [
  /* ---- On the doorstep ---- */
  {
    id: "hudson-yards", name: "The Shops at Hudson Yards", cat: "festive", lat: 40.7538, lng: -74.0010,
    area: "Hudson Yards", free: true, indoor: true, festive: true,
    blurb: "Seven floors of shops and restaurants, five minutes from the hotel, usually wrapped in a couple of million fairy lights for Christmas.",
    tip: "Your wet-weather fallback, your nearest clean toilets and the easiest place for a solo dinner. Mercado Little Spain is on the ground floor.",
    when: "Daily, roughly 10 am – 8 pm (restaurants later)", cost: "Free to wander",
    lines: [], go: "7-minute walk: cross 10th Avenue and head down Hudson Boulevard through the little park.",
    url: "https://www.hudsonyardsnewyork.com/",
  },
  {
    id: "edge", name: "Edge observation deck", cat: "views", lat: 40.7541, lng: -74.0009,
    area: "Hudson Yards", indoor: false,
    blurb: "A glass-floored triangle jutting out of the 100th floor — the highest outdoor sky deck in the Western Hemisphere, and it's practically next door.",
    tip: "Book the 3:45 pm slot: you get daylight, sunset at 4:28 and the city lighting up, all on one ticket. Sunset slots cost a little more and sell out.",
    when: "Daily, timed tickets", cost: "From about $40 — book online",
    lines: [], go: "7-minute walk. The entrance is on level 4 of the Shops at Hudson Yards.",
    url: "https://www.edgenyc.com/",
  },
  {
    id: "vessel", name: "Vessel", cat: "sights", lat: 40.7538, lng: -74.0022,
    area: "Hudson Yards", free: true, indoor: false,
    blurb: "The copper honeycomb staircase in the middle of Hudson Yards plaza. Great to photograph from below; you can also climb it.",
    tip: "The plaza view is free and arguably the best one. Go at dusk when the lights come on.",
    when: "Plaza always open; climbing is ticketed", cost: "Free from the ground · about $10–15 to climb",
    lines: [], go: "8-minute walk via Hudson Boulevard.",
    url: "https://www.vesselnyc.com/",
  },
  {
    id: "mercado", name: "Mercado Little Spain", cat: "food", lat: 40.7533, lng: -74.0018,
    area: "Hudson Yards", indoor: true,
    blurb: "José Andrés' Spanish food hall: tapas counters, churros with hot chocolate, jamón, a proper sit-down grill.",
    tip: "Counter seating makes eating alone feel completely natural. Churros and chocolate is the December order.",
    when: "Daily, lunch through dinner", cost: "$$",
    lines: [], go: "8-minute walk — under the High Line at 10th Avenue & 30th Street.",
    url: "https://www.littlespain.com/",
  },
  {
    id: "highline", name: "The High Line", cat: "walks", lat: 40.7527, lng: -74.0030,
    area: "Hudson Yards → Meatpacking", free: true, indoor: false,
    blurb: "A mile and a half of garden walkway on an old elevated railway, running from Hudson Yards down to the Whitney. No traffic, no crossings, just the city sliding past.",
    tip: "Start at the top (Hudson Yards) and walk south — about 40 minutes with photo stops — and you finish at Chelsea Market for lunch. Do it in daylight; it closes at 8 pm in winter.",
    when: "Daily 7 am – 8 pm (winter hours)", cost: "Free",
    lines: [], go: "8-minute walk. Stairs and lift at 30th Street & 10th Avenue, or the ramp at 34th Street & 12th Avenue.",
    url: "https://www.thehighline.org/",
  },
  {
    id: "chelsea-market", name: "Chelsea Market", cat: "food", lat: 40.7424, lng: -74.0061,
    area: "Chelsea", free: true, indoor: true,
    blurb: "An old biscuit factory turned food hall: tacos, lobster rolls, noodles, doughnuts, a good bookshop and an indoor makers' market.",
    tip: "Los Tacos No. 1 has the queue for a reason. Go before 12 or after 2 to avoid the lunch crush.",
    when: "Daily, roughly 7 am – 10 pm", cost: "Free to enter · lunch $15–25",
    lines: ["A", "C", "E"], go: "Walk the High Line south and come down at 16th Street (40 min). Or A/C/E downtown from 34 St–Penn Station to 14 St, then 5 minutes west.",
    url: "https://www.chelseamarket.com/",
  },
  {
    id: "little-island", name: "Little Island", cat: "walks", lat: 40.7420, lng: -74.0103,
    area: "Meatpacking", free: true, indoor: false,
    blurb: "A tiny hilly park floating on concrete tulips in the Hudson. Ten minutes to walk round, with a good view back at the skyline.",
    tip: "Pair it with Chelsea Market — it's straight across the road. Windy in December, so it's a quick stop.",
    when: "Daily, daytime", cost: "Free",
    lines: ["A", "C", "E"], go: "From the bottom of the High Line, cross the West Side Highway at 13th Street.",
    url: "https://littleisland.org/",
  },
  {
    id: "whitney", name: "Whitney Museum of American Art", cat: "museums", lat: 40.7396, lng: -74.0089,
    area: "Meatpacking", indoor: true,
    blurb: "Hopper, O'Keeffe, Basquiat and whatever is new in American art, in a building with outdoor terraces on every floor.",
    tip: "Closed Tuesdays. Friday evenings (5–10 pm) are free but need booking ahead. The terraces are worth the cold.",
    when: "Wed–Mon from 10:30 am; late on Fridays", cost: "About $30 · free Friday nights",
    lines: ["A", "C", "E"], go: "It's at the very bottom of the High Line. Or A/C/E to 14 St and walk 8 minutes west.",
    url: "https://whitney.org/",
  },
  {
    id: "moynihan", name: "Moynihan Train Hall", cat: "food", lat: 40.7513, lng: -73.9955,
    area: "Penn Station", free: true, indoor: true,
    blurb: "The handsome glass-roofed half of Penn Station, with a food hall — good coffee, bagels, burgers, ramen — and clean toilets.",
    tip: "Your nearest decent breakfast outside the hotel. Use the 9th Avenue entrance, not the 8th Avenue side.",
    when: "Daily, early till late", cost: "$",
    lines: [], go: "10-minute walk: east along 33rd or 34th Street to 9th Avenue.",
    url: "https://moynihantrainhall.nyc/",
  },

  /* ---- Midtown ---- */
  {
    id: "bryant-park", name: "Bryant Park Winter Village", cat: "festive", lat: 40.7536, lng: -73.9832,
    area: "Midtown", free: true, indoor: false, festive: true,
    blurb: "The best of the Christmas markets: glass kiosks round a free-entry ice rink, with a big tree and a rinkside bar under the skyscrapers.",
    tip: "Skating is free if you have skates — hire is pricey and needs booking. Weekday mornings are calm; after 5 pm it's shoulder to shoulder. The park toilets are famously the nicest public ones in New York.",
    when: "Daily through early January; shops about 11 am – 8 pm", cost: "Free · skate hire extra",
    lines: ["7"], go: "7 train from Hudson Yards, two stops to 5 Av. Come up the stairs and you're in the park.",
    url: "https://bryantpark.org/activities/winter-village",
  },
  {
    id: "nypl", name: "New York Public Library", cat: "sights", lat: 40.7532, lng: -73.9822,
    area: "Midtown", free: true, indoor: true,
    blurb: "The one with the stone lions. Marble halls, the vast Rose Main Reading Room, and a free treasures gallery with the original Winnie-the-Pooh toys.",
    tip: "Twenty warm, quiet, free minutes right next to Bryant Park. The lions wear wreaths in December.",
    when: "Mon–Sat from 10 am (closed or short hours Sunday)", cost: "Free",
    lines: ["7"], go: "7 train to 5 Av. It's the Fifth Avenue side of Bryant Park.",
    url: "https://www.nypl.org/locations/schwarzman",
  },
  {
    id: "grand-central", name: "Grand Central Terminal", cat: "sights", lat: 40.7527, lng: -73.9772,
    area: "Midtown", free: true, indoor: true, festive: true,
    blurb: "The great concourse with the starry ceiling and the four-faced clock. In December there's a holiday craft fair in Vanderbilt Hall.",
    tip: "Try the Whispering Gallery outside the Oyster Bar: stand in opposite corners of the arch and whisper into the wall.",
    when: "Daily, early till late · holiday fair until Dec 24", cost: "Free",
    lines: ["7"], go: "7 train from Hudson Yards, three stops to Grand Central–42 St.",
    url: "https://www.grandcentralterminal.com/",
  },
  {
    id: "summit", name: "SUMMIT One Vanderbilt", cat: "views", lat: 40.7530, lng: -73.9785,
    area: "Midtown", indoor: true,
    blurb: "Mirrored rooms, floating silver balloons and glass ledges a thousand feet up, beside Grand Central. Half view, half art installation.",
    tip: "Entirely indoors, so it's the one to choose on a wet or bitter day. Mirrored floors: wear trousers. Bring sunglasses on a bright day.",
    when: "Daily, timed tickets", cost: "From about $45 — book online",
    lines: ["7"], go: "7 train to Grand Central–42 St. The entrance is inside the terminal's Vanderbilt passage.",
    url: "https://summitov.com/",
  },
  {
    id: "rock-tree", name: "Rockefeller Center Christmas Tree", cat: "festive", lat: 40.7587, lng: -73.9787,
    area: "Midtown", free: true, indoor: false, festive: true,
    blurb: "The tree. Fifty thousand lights above the ice rink and the gold Prometheus, with the angels blowing trumpets down the Channel Gardens.",
    tip: "Evenings are a slow-moving crush. Before 9 am you can walk straight up to it; it's lit from 5 am. Approach down the Channel Gardens from Fifth Avenue for the classic view.",
    when: "Lit daily 5 am – midnight, early December to mid-January", cost: "Free",
    lines: ["7"], go: "7 train to 5 Av, then a bright 10-minute walk up Fifth Avenue to 49th Street.",
    url: "https://www.rockefellercenter.com/holidays/rockefeller-center-christmas-tree-lighting/",
  },
  {
    id: "top-rock", name: "Top of the Rock", cat: "views", lat: 40.7593, lng: -73.9794,
    area: "Midtown", indoor: false,
    blurb: "The observation deck with the Empire State Building in the view, and Central Park laid out on the other side.",
    tip: "If you only do one viewpoint besides Edge, do this one — and you can look down on the tree and rink on the way in.",
    when: "Daily until late, timed tickets", cost: "From about $40",
    lines: ["7"], go: "Same as the tree: 7 train to 5 Av, walk up Fifth to 50th Street.",
    url: "https://www.rockefellercenter.com/attractions/top-of-the-rock-observation-deck/",
  },
  {
    id: "fifth-windows", name: "Fifth Avenue Christmas windows", cat: "festive", lat: 40.7582, lng: -73.9772,
    area: "Midtown", free: true, indoor: false, festive: true,
    blurb: "Saks (facing the tree), then Cartier wrapped in a giant bow, Tiffany, and Bergdorf Goodman's windows at 58th Street — the most extravagant of the lot.",
    tip: "Walk it north from 49th to 59th and you end at the Plaza and Central Park. Saks usually runs a light show on its façade every ten minutes after dark.",
    when: "Best from dusk; windows lit all evening", cost: "Free",
    lines: ["7"], go: "7 train to 5 Av, walk up Fifth Avenue. It gets better with every block.",
    url: "https://www.nyctourism.com/things-to-do/holidays/",
  },
  {
    id: "st-patricks", name: "St. Patrick's Cathedral", cat: "sights", lat: 40.7585, lng: -73.9760,
    area: "Midtown", free: true, indoor: true, festive: true,
    blurb: "A Gothic cathedral wedged between the skyscrapers, directly opposite Rockefeller Center. Candlelit, with a large nativity in December.",
    tip: "A calm five minutes out of the Fifth Avenue crowds. Bags are checked at the door.",
    when: "Daily, about 6:30 am – 8:45 pm", cost: "Free",
    lines: ["7"], go: "Across Fifth Avenue from the tree.",
    url: "https://saintpatrickscathedral.org/",
  },
  {
    id: "radio-city", name: "Radio City Christmas Spectacular", cat: "shows", lat: 40.7600, lng: -73.9800,
    area: "Midtown", indoor: true, festive: true,
    blurb: "The Rockettes: ninety minutes of high kicks, a living nativity with real camels, and one of the great Art Deco theatres.",
    tip: "Several shows a day, including late morning and early afternoon — a matinee is ideal on your own. Weekday daytime seats are the cheapest.",
    when: "Multiple shows daily through early January", cost: "From about $60",
    lines: ["7"], go: "7 train to 5 Av, walk up Sixth Avenue to 50th Street (10 min).",
    url: "https://www.rockettes.com/christmas/",
  },
  {
    id: "moma", name: "MoMA", cat: "museums", lat: 40.7614, lng: -73.9776,
    area: "Midtown", indoor: true,
    blurb: "The Starry Night, Monet's Water Lilies, Warhol's soup cans, Frida Kahlo — a century of famous pictures in one manageable building.",
    tip: "Start on the fifth floor (the famous things) and work down. Open late on Fridays. The design shop across the street is great for presents.",
    when: "Daily 10:30 am – 5:30 pm, Fridays later", cost: "About $30",
    lines: ["E"], go: "E train uptown from 34 St–Penn Station to 5 Av/53 St — you surface a few doors away.",
    url: "https://www.moma.org/",
  },
  {
    id: "times-square", name: "Times Square", cat: "sights", lat: 40.7580, lng: -73.9855,
    area: "Midtown", free: true, indoor: false,
    blurb: "The screens, the noise, the red steps. Worth ten minutes to have seen it, ideally after dark when the lights do their thing.",
    tip: "Look, photograph, leave. Take nothing that's handed to you and don't pose with the costumed characters unless you want to tip them. The TKTS booth under the red steps sells same-day discounted Broadway tickets.",
    when: "Always on", cost: "Free",
    lines: ["7"], go: "7 train from Hudson Yards, one stop. Go home the same way rather than walking west.",
    url: "https://www.timessquarenyc.org/",
  },
  {
    id: "broadway", name: "A Broadway matinee", cat: "shows", lat: 40.7590, lng: -73.9870,
    area: "Theater District", indoor: true,
    blurb: "Wednesday is matinee day: most shows play at 2 pm, you're out by 4:30 and home before the evening rush.",
    tip: "TodayTix app or the TKTS booth for same-day discounts; or just walk up to the theatre's own box office (no fees). Going alone often gets you a single great seat.",
    when: "Matinees Wed & Sat 2 pm (some Thu); evenings 7 or 8 pm", cost: "About $60–180",
    lines: ["7"], go: "7 train one stop to Times Sq–42 St. Nearly every theatre is within five minutes' walk.",
    url: "https://www.todaytix.com/nyc",
  },
  {
    id: "empire-state", name: "Empire State Building", cat: "views", lat: 40.7484, lng: -73.9857,
    area: "Midtown South", indoor: true,
    blurb: "The classic. Open-air deck on the 86th floor and an Art Deco lobby that's worth seeing even if you don't go up.",
    tip: "You can't see the Empire State Building from the Empire State Building — if you're only buying one ticket, Edge or Top of the Rock gives you the better photo.",
    when: "Daily until late", cost: "From about $48",
    lines: [], go: "Straight along 34th Street: 25 minutes on foot or hop on the M34 crosstown bus.",
    url: "https://www.esbnyc.com/",
  },
  {
    id: "macys", name: "Macy's Herald Square", cat: "shops", lat: 40.7508, lng: -73.9887,
    area: "Herald Square", free: true, indoor: true, festive: true,
    blurb: "The Miracle on 34th Street store: animated Christmas windows along Broadway, wooden escalators from 1902, and Santaland on the 8th floor.",
    tip: "The windows are the point — the store itself is a scrum in December. Ride the old wooden escalators up at least one floor.",
    when: "Daily, about 10 am – 10 pm", cost: "Free",
    lines: [], go: "18-minute walk along 34th Street, or the M34 bus.",
    url: "https://www.macys.com/",
  },
  {
    id: "morgan", name: "The Morgan Library", cat: "museums", lat: 40.7492, lng: -73.9814,
    area: "Murray Hill", indoor: true,
    blurb: "J.P. Morgan's private library: three storeys of walnut bookcases, a Gutenberg Bible, and at Christmas, Dickens' handwritten manuscript of A Christmas Carol.",
    tip: "Small, beautiful and never crowded — the opposite of the big museums. An hour is plenty. Closed Mondays.",
    when: "Tue–Sun from 10:30 am; Fridays until 8 pm", cost: "About $25",
    lines: ["7"], go: "7 train to Grand Central, then walk six blocks down Madison Avenue to 36th Street.",
    url: "https://www.themorgan.org/",
  },
  {
    id: "hells-kitchen", name: "9th Avenue & Restaurant Row", cat: "food", lat: 40.7605, lng: -73.9905,
    area: "Hell's Kitchen", indoor: true,
    blurb: "Block after block of Thai, ramen, Italian, tacos and wine bars — where the theatre crowd actually eats. 46th Street between 8th and 9th is 'Restaurant Row'.",
    tip: "Good for an early solo dinner at the bar. Go and come back via Times Square on the 7 — don't walk it from the hotel after dark.",
    when: "Lunch till late", cost: "$–$$",
    lines: ["7"], go: "7 train one stop to Times Sq–42 St, then walk west along 46th Street. Or a 5-minute cab, about $10.",
    url: "https://www.timeout.com/newyork/restaurants/best-restaurants-in-hells-kitchen",
  },

  /* ---- Uptown ---- */
  {
    id: "columbus-circle", name: "Columbus Circle Holiday Market", cat: "festive", lat: 40.7679, lng: -73.9822,
    area: "Central Park South", free: true, indoor: false, festive: true,
    blurb: "Striped stalls at the corner of Central Park selling gifts, jewellery and hot cider. Smaller and calmer than Bryant Park.",
    tip: "The natural starting gate for a walk into Central Park. The shopping centre opposite hangs giant colour-changing stars in its atrium — and has toilets.",
    when: "Daily until Dec 24, roughly 10 am – 8 pm", cost: "Free",
    lines: ["A", "C"], go: "A or C uptown from 34 St–Penn Station to 59 St–Columbus Circle. Not the E — it turns off before then.",
    url: "https://urbanspacenyc.com/pages/columbus-circle-holiday-market",
  },
  {
    id: "central-park", name: "Central Park — the classic loop", cat: "walks", lat: 40.7722, lng: -73.9718,
    area: "Central Park", free: true, indoor: false,
    blurb: "In at Columbus Circle, past Wollman Rink with the skyline behind it, up the elm-lined Mall to Bethesda Fountain and Bow Bridge. About 45 minutes at a stroll.",
    tip: "Daylight only — be heading out by 4 pm. Lamp posts have a four-digit code: the first two digits are the nearest street number, if you lose your bearings.",
    when: "Best 9 am – 4 pm in December", cost: "Free",
    lines: ["A", "C"], go: "A or C uptown to 59 St–Columbus Circle and walk in at the south-west corner.",
    url: "https://www.centralparknyc.org/",
  },
  {
    id: "met", name: "The Metropolitan Museum of Art", cat: "museums", lat: 40.7791, lng: -73.9622,
    area: "Upper East Side", indoor: true, festive: true,
    blurb: "An Egyptian temple in a glass hall, rooms of armour, Vermeers and Van Goghs — plus a Christmas tree hung with 18th-century Neapolitan angels.",
    tip: "Closed Wednesdays. Open until 9 pm Friday and Saturday. Pick three sections and ignore the rest; it is far too big to 'do'.",
    when: "Sun–Tue & Thu 10–5 · Fri & Sat 10–9 · closed Wed", cost: "About $30",
    lines: ["7", "4", "5", "6"], go: "7 train to Grand Central, change to the 4 or 5 uptown to 86 St, then walk 10 minutes west to Fifth Avenue. Or walk across from Bethesda Fountain in daylight.",
    url: "https://www.metmuseum.org/",
  },
  {
    id: "amnh", name: "American Museum of Natural History", cat: "museums", lat: 40.7813, lng: -73.9740,
    area: "Upper West Side", indoor: true, festive: true,
    blurb: "Dinosaurs, the blue whale, the Night at the Museum halls — and an Origami Holiday Tree every December.",
    tip: "The new Gilder Center wing looks like a canyon inside and is worth seeing on its own. Busy with school groups until about 2 pm.",
    when: "Daily 10 am – 5:30 pm", cost: "About $30",
    lines: ["C"], go: "C train uptown from 34 St–Penn Station to 81 St. The station exits into the museum.",
    url: "https://www.amnh.org/",
  },
  {
    id: "lincoln-center", name: "The Nutcracker at Lincoln Center", cat: "shows", lat: 40.7725, lng: -73.9835,
    area: "Upper West Side", indoor: true, festive: true,
    blurb: "New York City Ballet's Nutcracker — a Christmas tree that grows to 41 feet on stage, real snow, a full orchestra. The plaza fountain alone is worth the trip at night.",
    tip: "Matinees most days in December. Fourth-ring seats are cheap and the view is still good.",
    when: "Daily performances late Nov – early Jan", cost: "From about $50",
    lines: ["7", "1"], go: "7 train to Times Sq, change to the 1 uptown, three stops to 66 St–Lincoln Center.",
    url: "https://www.nycballet.com/",
  },

  /* ---- Downtown ---- */
  {
    id: "union-square", name: "Union Square Holiday Market", cat: "festive", lat: 40.7359, lng: -73.9911,
    area: "Union Square", free: true, indoor: false, festive: true,
    blurb: "The biggest of the markets and the best for presents that don't look like souvenirs — local makers, prints, ceramics, hot food.",
    tip: "The Strand bookshop (18 miles of books) is two blocks south on Broadway. Mondays, Wednesdays, Fridays and Saturdays there's a farmers' market on the square too.",
    when: "Daily until Dec 24, about 11 am – 8 pm", cost: "Free",
    lines: ["7", "N", "Q", "R", "W"], go: "7 train to Times Sq, change to a downtown N, Q, R or W to 14 St–Union Sq.",
    url: "https://urbanspacenyc.com/pages/union-square-holiday-market",
  },
  {
    id: "flatiron", name: "Flatiron Building & Eataly", cat: "food", lat: 40.7420, lng: -73.9897,
    area: "Flatiron", free: true, indoor: true,
    blurb: "The wedge-shaped skyscraper everyone photographs, Madison Square Park with the original Shake Shack, and Eataly — a vast Italian food hall — on the corner.",
    tip: "Eataly's counters are another easy solo lunch. The Harry Potter store is next door if that's your thing.",
    when: "Daily", cost: "Free to look",
    lines: ["7", "R", "W"], go: "7 train to Times Sq, change to a downtown R or W to 23 St.",
    url: "https://www.eataly.com/us_en/stores/nyc-flatiron/",
  },
  {
    id: "west-village", name: "West Village wander", cat: "walks", lat: 40.7335, lng: -74.0040,
    area: "West Village", free: true, indoor: false,
    blurb: "The prettiest streets in Manhattan: brownstones with wreaths on the doors, Bleecker Street's shops, the Friends apartment at Bedford & Grove, Carrie Bradshaw's stoop on Perry Street.",
    tip: "The grid breaks down here, so keep the map open. Good coffee everywhere; Magnolia Bakery for the banana pudding rather than the cupcakes.",
    when: "Any time — lovely at dusk", cost: "Free",
    lines: ["A", "C", "E"], go: "A, C or E downtown from 34 St–Penn Station to W 4 St–Washington Sq, then walk west.",
    url: "https://www.nyctourism.com/new-york/manhattan/west-village/",
  },
  {
    id: "washington-square", name: "Washington Square Park", cat: "sights", lat: 40.7308, lng: -73.9973,
    area: "Greenwich Village", free: true, indoor: false, festive: true,
    blurb: "The marble arch with a Christmas tree framed underneath it, chess hustlers, buskers, students.",
    tip: "A daytime stop — the park itself gets seedy after dark, though the streets around it stay busy.",
    when: "Daytime", cost: "Free",
    lines: ["A", "C", "E"], go: "A, C or E downtown to W 4 St–Washington Sq; the park is two blocks east.",
    url: "https://www.nycgovparks.org/parks/washington-square-park",
  },
  {
    id: "soho", name: "SoHo shopping", cat: "shops", lat: 40.7243, lng: -73.9995,
    area: "SoHo", free: true, indoor: true,
    blurb: "Cobbled streets and cast-iron fronts with every shop you've heard of, plus the smaller boutiques of Nolita a few blocks east.",
    tip: "Broadway is the chain-store strip; the nicer shops are on Prince, Spring, Greene and Mercer. Weekday mornings are blissfully empty.",
    when: "Shops about 11 am – 7 or 8 pm", cost: "Up to you",
    lines: ["C", "E"], go: "C or E downtown from 34 St–Penn Station to Spring St.",
    url: "https://www.nyctourism.com/new-york/manhattan/soho/",
  },
  {
    id: "911", name: "9/11 Memorial & the Oculus", cat: "sights", lat: 40.7115, lng: -74.0128,
    area: "Lower Manhattan", free: true, indoor: false,
    blurb: "Two vast waterfalls in the footprints of the towers, ringed with names. Next to it, the white-ribbed Oculus station hall.",
    tip: "The memorial plaza is free and takes 20 minutes. The museum underneath is superb and heavy — allow two hours and book ahead.",
    when: "Memorial daily 8 am – 8 pm · museum closed Tue", cost: "Memorial free · museum about $36",
    lines: ["E"], go: "E train downtown from 34 St–Penn Station to the last stop, World Trade Center.",
    url: "https://www.911memorial.org/",
  },
  {
    id: "brooklyn-bridge", name: "Brooklyn Bridge walk", cat: "walks", lat: 40.7127, lng: -74.0050,
    area: "Lower Manhattan → Brooklyn", free: true, indoor: false,
    blurb: "A mile across the East River on the wooden walkway, under the stone arches, with the skyline behind you the whole way.",
    tip: "Daylight, and wrap up — it's much windier than street level. Walk Manhattan → Brooklyn so you finish in DUMBO with food and the view. 30 minutes.",
    when: "Daylight", cost: "Free",
    lines: ["A", "C"], go: "A or C downtown from 34 St–Penn Station to Chambers St, then 8 minutes east to the walkway opposite City Hall.",
    url: "https://www.nyc.gov/html/dot/html/infrastructure/brooklyn-bridge.shtml",
  },
  {
    id: "dumbo", name: "DUMBO", cat: "sights", lat: 40.7033, lng: -73.9895,
    area: "Brooklyn", free: true, indoor: false,
    blurb: "The Manhattan Bridge framed between red-brick warehouses on Washington Street, the waterfront park, a vintage carousel in a glass box, and Time Out Market for lunch.",
    tip: "The photo spot is Washington St at Water St. Time Out Market's roof terrace has the skyline view for the price of a coffee.",
    when: "Daytime into early evening", cost: "Free",
    lines: ["A", "C"], go: "Walk over the Brooklyn Bridge. To come home: A or C from High St straight back to 34 St–Penn Station.",
    url: "https://dumbo.is/",
  },
  {
    id: "ferry", name: "Staten Island Ferry", cat: "views", lat: 40.7013, lng: -74.0132,
    area: "Lower Manhattan", free: true, indoor: true,
    blurb: "A free 25-minute boat ride past the Statue of Liberty, with the Lower Manhattan skyline behind you. Get off, walk round, get the next one back.",
    tip: "Stand on the right-hand side going out for the statue. Anyone selling you a 'ferry ticket' outside is a tout — it's free, just walk on.",
    when: "Every 30 minutes, all day", cost: "Free",
    lines: ["E", "1"], go: "E train to World Trade Center, then the 1 downtown from WTC Cortlandt two stops to South Ferry.",
    url: "https://www.nyc.gov/html/dot/html/ferrybus/staten-island-ferry.shtml",
  },
];

/* ---------- Day plans ---------- */
const DAYS = [
  {
    date: "2026-12-09", short: "Wed", letter: "W", color: "#b933ad", long: "Wednesday 9 December", solo: true,
    title: "Home turf", sub: "Hudson Yards, the High Line & Chelsea",
    intro: "Arrival-day pace. Everything is on foot from the hotel, there's no subway to figure out, and you finish with sunset from the 100th floor five minutes from your bed.",
    steps: [
      { time: "Late morning", place: "moynihan", text: "Coffee and something to eat at Moynihan Train Hall, or straight to Hudson Yards if you've eaten." },
      { time: "Midday", place: "vessel", text: "Cross into Hudson Yards. See the Vessel and the plaza, then pick up the High Line at 30th Street." },
      { time: "12:30", place: "highline", text: "Walk the High Line south, end to end. About 40 unhurried minutes." },
      { time: "1:15", place: "chelsea-market", text: "Late lunch at Chelsea Market. Little Island is across the road if you still have legs." },
      { time: "2:30", place: "whitney", text: "Optional: an hour in the Whitney. Otherwise wander back up 9th Avenue through Chelsea." },
      { time: "3:45", place: "edge", text: "Edge for sunset (book the slot ahead). Sun's down at 4:28 and the whole city switches on." },
      { time: "Evening", place: "mercado", text: "Dinner downstairs at Mercado Little Spain or anywhere in the Shops — then a 7-minute walk home." },
    ],
    home: "You never leave the neighbourhood. If the walk back up from Chelsea feels long, a yellow cab to the hotel is about $12.",
  },
  {
    date: "2026-12-10", short: "Thu", letter: "T", color: "#0039a6", long: "Thursday 10 December", solo: true,
    title: "The Christmas one", sub: "Bryant Park, Grand Central, Fifth Avenue & the tree",
    intro: "One subway line there and back — the 7, which starts at Hudson Yards so you can't get on the wrong train. The whole route is on bright, busy streets, and it's meant to run into the evening so you see the lights.",
    steps: [
      { time: "9:30", place: "bryant-park", text: "7 train two stops to 5 Av. Bryant Park Winter Village while it's quiet — browse, hot chocolate, watch the skaters." },
      { time: "10:45", place: "nypl", text: "Warm up inside the Public Library next door. Find the reading room and the Pooh toys." },
      { time: "11:30", place: "grand-central", text: "Five minutes along 42nd Street to Grand Central: the ceiling, the whispering gallery, the holiday fair." },
      { time: "12:30", place: "summit", text: "Lunch in the Grand Central food concourse. Optional: SUMMIT is right here if you want a second viewpoint." },
      { time: "2:00", place: "moma", text: "Walk up Fifth Avenue to MoMA (or Radio City for an afternoon Rockettes show instead)." },
      { time: "4:15", place: "fifth-windows", text: "Back out as it gets dark: Bergdorf's windows, Tiffany, Cartier's bow, St. Patrick's, Saks." },
      { time: "5:00", place: "rock-tree", text: "The tree, lit, from the Channel Gardens. It will be busy. That's part of it." },
    ],
    home: "Walk down Fifth or Sixth Avenue to 42nd Street and take the 7 from 5 Av back to Hudson Yards (last stop). Don't walk west through Times Square and Port Authority.",
  },
  {
    date: "2026-12-11", short: "Fri", letter: "F", color: "#00838f", long: "Friday 11 December", solo: true,
    title: "Park & masterpieces", sub: "Central Park by daylight, then the Met till late",
    intro: "The park wants daylight, and the Met is open until 9 pm on Fridays — so park first, museum when it gets dark.",
    steps: [
      { time: "9:30", place: "columbus-circle", text: "A or C uptown to 59 St–Columbus Circle. Coffee and a look round the holiday market." },
      { time: "10:15", place: "central-park", text: "Into the park: Wollman Rink, the Mall, Bethesda Fountain, Bow Bridge. Follow the crowds north-east." },
      { time: "12:00", place: "met", text: "Come out on Fifth Avenue around 79th Street and walk up to the Met. Lunch in the museum café, then pick three wings." },
      { time: "3:30", place: "met", text: "It's getting dark outside; stay in. Find the angel tree in the Medieval hall and the Temple of Dendur at dusk." },
      { time: "Evening", place: null, text: "Meet for dinner? Madison Avenue below the museum has plenty, or head home." },
    ],
    home: "From the Met, a cab to the hotel is the easy option (about $25–35, 20 minutes). By subway: walk east to Lexington, 4 or 5 downtown from 86 St to Grand Central, then the 7 to Hudson Yards. Don't cut back across the park.",
  },
  {
    date: "spare", short: "Spare", letter: "+", color: "#6e7480", long: "A spare day to swap in", solo: true,
    title: "Downtown & the bridge", sub: "9/11 Memorial, Brooklyn Bridge, DUMBO, West Village",
    intro: "A spare day to swap in if the weather's clear, or if you'd rather have skyline than museums. The bridge needs daylight and a hat.",
    steps: [
      { time: "9:30", place: "911", text: "E train downtown to the last stop, World Trade Center. The memorial pools and the Oculus." },
      { time: "11:00", place: "brooklyn-bridge", text: "Ten minutes' walk east past City Hall to the bridge. Walk across to Brooklyn." },
      { time: "12:00", place: "dumbo", text: "DUMBO: the Washington Street photo, lunch at Time Out Market, the waterfront." },
      { time: "2:00", place: "west-village", text: "A or C from High St back into Manhattan, off at W 4 St. Wander the West Village while it's still light." },
      { time: "4:00", place: "washington-square", text: "The arch and its tree at dusk, then hot chocolate somewhere on Bleecker Street." },
    ],
    home: "A, C or E uptown from W 4 St to 34 St–Penn Station, then 10 minutes along 34th Street — or the M34 bus if it's there.",
  },
  {
    date: "2026-12-12", short: "Sat", letter: "S", color: "#996633", long: "Saturday 12 December", solo: false,
    title: "Together", sub: "Save these for two",
    intro: "Things that are better — or simply easier — with company.",
    steps: [
      { time: "Idea", place: null, text: "Dyker Heights Christmas lights in Brooklyn: entire streets of houses competing to out-decorate each other. It's a long way out and best after dark, so go together, by cab or on a tour." },
      { time: "Idea", place: "union-square", text: "Union Square Holiday Market and the Strand for present shopping, then dinner in the East Village." },
      { time: "Idea", place: "lincoln-center", text: "An evening Nutcracker or a Broadway show." },
      { time: "Idea", place: "ferry", text: "The free Staten Island Ferry at dusk for the skyline." },
      { time: "Heads-up", place: null, text: "SantaCon — thousands of people in Santa suits on an all-day bar crawl — usually lands on the second Saturday of December. If it's on, Midtown and East Village bars will be rowdy from late morning; book restaurants and steer round it." },
    ],
    home: "",
  },
  {
    date: "2026-12-13", short: "Sun", letter: "S", color: "#ff6319", long: "Sunday 13 December", solo: false,
    title: "Last morning", sub: "One more look before the airport",
    intro: "Keep it close to the hotel so nobody's watching the clock.",
    steps: [
      { time: "Idea", place: "highline", text: "A last walk on the High Line with a coffee." },
      { time: "Idea", place: "hudson-yards", text: "Any shopping you didn't get to, five minutes from your bags." },
      { time: "Idea", place: "rock-tree", text: "The tree before 9 am, when you can actually get near it." },
    ],
    home: "",
  },
];

/* ---------- What's on right now (live listings) ---------- */
const LISTINGS = [
  { name: "Time Out — things to do today", note: "The most reliable day-by-day list", url: "https://www.timeout.com/newyork/things-to-do/things-to-do-in-nyc-today" },
  { name: "The Skint", note: "Free and cheap things, updated daily", url: "https://theskint.com/" },
  { name: "TodayTix", note: "Last-minute Broadway and theatre seats", url: "https://www.todaytix.com/nyc" },
  { name: "NYC Tourism — holiday guide", note: "Official: markets, lights, windows", url: "https://www.nyctourism.com/things-to-do/holidays/" },
];

/* ---------- Safety ---------- */
const SAFETY_RULES = [
  { h: "It's dark by 4:45", p: "Sunset is 4:28 pm. Put parks, bridges and quiet neighbourhoods in the daylight half of the day and keep the evening for busy, bright places — Fifth Avenue, Hudson Yards, restaurants, shows." },
  { h: "Busy is safe", p: "On the streets you'll be on, the realistic risks are pickpockets and pushy hustlers, not violence. Choose the street with people and shop windows over the shortcut without them, even if it adds five minutes." },
  { h: "Check your phone indoors", p: "Step into a shop doorway or lobby to read the map. Walking with purpose and looking lost on a corner are treated very differently. Hold your phone away from the kerb and from closing subway doors." },
  { h: "Take nothing that's handed to you", p: "CDs, bracelets, flowers, 'free' anything: once it's in your hand, they want paying. A flat 'no thanks' without stopping is normal and not rude here." },
  { h: "Late means a cab", p: "After about 10 pm, skip the subway and take a yellow cab or an Uber/Lyft to the hotel door. In Manhattan it's rarely more than $20–30 and it's what locals do." },
  { h: "Trust the feeling", p: "If a street, a subway car or a person feels off, you don't need a reason. Cross the road, change cars at the next stop, walk into the nearest shop or hotel lobby. Staff are used to it." },
];

const SAFETY_SUBWAY = [
  "The middle of the train is where the conductor rides — board there. On the platform, wait near other people and stand back from the edge, by a pillar or wall.",
  "An empty carriage on an otherwise busy train is empty for a reason. Use the next one.",
  "If someone is behaving erratically, don't engage and don't stare; move down the carriage and switch cars at the next stop.",
  "Check the sign over the stairs before you tap in. Some entrances only serve one direction ('Uptown only').",
  "Keep your bag closed and on your lap or in front of you. Phones get snatched through the doors as they close — sit or stand away from them.",
];

const SCAMS = [
  { h: "Times Square characters", p: "Elmo, Spider-Man, the Statue of Liberty: any photo costs a tip, and several will crowd in and each demand one. Don't make eye contact." },
  { h: "The mixtape", p: "'What's your name?' — and it's written on a CD that's now yours for $20. Keep your hands in your pockets and keep walking." },
  { h: "Ferry and Statue 'tickets'", p: "Around Battery Park, people in official-looking vests sell tickets for the wrong boat. The Staten Island Ferry is free; the only real Statue tickets are Statue City Cruises'." },
  { h: "Pedicabs", p: "The bicycle rickshaws around Central Park and Midtown often charge per minute, per person. A ten-minute ride can come to $100+. Just don't." },
  { h: "Unofficial taxis", p: "Only take a yellow cab you've hailed yourself, or a car you ordered in the Uber/Lyft app — and match the number plate before you get in. Ignore anyone who approaches you offering a ride." },
  { h: "'Can you help me?'", p: "Long stories about a missed bus or a lost wallet around Port Authority and Penn Station. You can say sorry and keep moving." },
];

const EMERGENCY = [
  { label: "Police, ambulance, fire", value: "911", tel: "911", note: "Free from any phone, including a foreign mobile." },
  { label: "Non-emergency city help", value: "311", tel: "311", note: "Lost property in a taxi, noise, anything not urgent." },
  { label: "Nearest emergency room", value: "Mount Sinai West", note: "1000 10th Avenue at 59th Street — straight up 10th Avenue from the hotel.", map: "Mount Sinai West Emergency Room, 1000 10th Ave, New York" },
  { label: "Minor illness or injury", value: "CityMD urgent care", note: "Walk-in clinics all over Manhattan; no appointment needed. Have your travel insurance details on your phone.", map: "CityMD urgent care near Hudson Yards New York" },
];

/* ---------- Getting around ---------- */
const TRANSIT = {
  stations: [
    {
      name: "34 St–Hudson Yards", lines: ["7"], walk: "5 min walk",
      text: "Your home station, on Hudson Boulevard between 33rd and 34th. It's the end of the line, so every train leaving goes the right way: Times Square (1 stop), 5 Av–Bryant Park (2), Grand Central (3). Coming home, take any 7 marked '34 St–Hudson Yards' and ride to the last stop.",
    },
    {
      name: "34 St–Penn Station", lines: ["A", "C", "E"], walk: "10 min walk",
      text: "At 8th Avenue. Walk east along 34th Street. Uptown for Columbus Circle and Central Park (A or C), MoMA (E), the Natural History Museum (C). Downtown for Chelsea Market and the West Village (any), SoHo (C or E), World Trade Center (E).",
    },
    {
      name: "M34 crosstown bus", lines: ["M34"], walk: "2 min walk",
      text: "Runs the length of 34th Street past Penn Station, Macy's and the Empire State Building. Same $3 tap as the subway, with a free transfer between the two within two hours. Slow in traffic, but warm.",
    },
  ],
  pay: [
    { h: "Just tap", p: "There are no tickets to buy. Tap your contactless bank card or your phone (Apple Pay / Google Pay) on the reader at the turnstile. It's $3 a ride, anywhere, any distance." },
    { h: "Always the same card", p: "After 12 paid rides in seven days, the rest are free — but only if you tap the same card or the same device every time. Phone and physical card count as different." },
    { h: "Foreign cards work", p: "Any contactless Visa, Mastercard or Amex is fine. Check whether yours charges a foreign-transaction fee on each tap; a travel card or a phone wallet linked to one avoids it." },
  ],
  subway: [
    { h: "Uptown is north", p: "Street numbers go up as you go uptown. Central Park is uptown from the hotel; Chelsea, the Village and Wall Street are downtown. Every platform is signed one or the other." },
    { h: "Local and express", p: "Express trains skip stops. From Penn Station the A is express and the C and E are local — check that your stop is one the train actually makes. Google Maps tells you exactly which letter to board." },
    { h: "Letters, not colours", p: "Nobody says 'the blue line'. It's 'the A' or 'the 7'. Several different trains share a colour and split apart further along." },
    { h: "Weekend changes", p: "Lines get re-routed at weekends for engineering work. Trust the live directions in Google Maps or Citymapper over the wall map." },
  ],
  walking: [
    { h: "The grid", p: "Avenues run north–south, streets run east–west. Twenty street blocks is a mile — about 20 minutes. Avenue blocks are three times longer: 10th Avenue to 8th is nearly ten minutes." },
    { h: "East and West", p: "Fifth Avenue splits every street into East and West. The hotel is on the far west side; 'W 35th' and 'E 35th' are a 30-minute walk apart." },
    { h: "Crossing", p: "New Yorkers cross on red when it's clear. You don't have to. Do watch for bikes and e-bikes — they come fast, silently and from both directions." },
  ],
  cabs: [
    { h: "Yellow cabs", p: "Roof number lit means free. Step to the kerb and raise an arm. All take cards. The meter starts around $3–4; most Manhattan trips are $12–30." },
    { h: "Uber and Lyft", p: "Both work as at home. Check the plate and ask 'Who are you here for?' rather than offering your own name." },
    { h: "Tell them the cross street", p: "Drivers navigate by corner, not house number. Say: '10th Avenue and 35th Street.' The button on the Today screen shows it in large type." },
  ],
  money: [
    { h: "Tipping", p: "Restaurants with table service: 18–20% on the pre-tax total. Bars: $1–2 a drink. Cabs: 15–20%. Counter service and coffee: optional, whatever the screen suggests." },
    { h: "Prices exclude tax", p: "Sales tax of nearly 9% is added at the till, so everything costs a little more than the label says. Clothes and shoes under $110 are exempt from most of it." },
    { h: "Toilets", p: "Hard to find. Reliable ones: Bryant Park, the Shops at Hudson Yards, Moynihan Train Hall, Grand Central's lower level, any department store, any hotel lobby if you walk in confidently." },
    { h: "Phone battery", p: "Cold drains it fast, and the phone is your map, your ticket and your payment. Carry a power bank. The tall LinkNYC kiosks on the pavements have free Wi-Fi and USB charging." },
    { h: "Dress for wind", p: "Typical early-December days are 3–8°C, but the wind between tall buildings and on anything high or near water makes it feel much colder. Hat, gloves, scarf, comfortable waterproof-ish shoes." },
  ],
};

/* ---------- Subway stations she will actually use ---------- */
const STATIONS = [
  { name: "34 St–Hudson Yards", lines: ["7"], lat: 40.7554, lng: -74.0008, home: true },
  { name: "34 St–Penn Station", lines: ["A", "C", "E"], lat: 40.7523, lng: -73.9932, home: true },
  { name: "Times Sq–42 St", lines: ["7"], lat: 40.7553, lng: -73.9870 },
  { name: "5 Av–Bryant Park", lines: ["7"], lat: 40.7537, lng: -73.9819 },
  { name: "Grand Central–42 St", lines: ["7", "4", "5"], lat: 40.7518, lng: -73.9768 },
  { name: "5 Av/53 St", lines: ["E"], lat: 40.7602, lng: -73.9752 },
  { name: "59 St–Columbus Circle", lines: ["A", "C"], lat: 40.7682, lng: -73.9819 },
  { name: "81 St–Museum of Natural History", lines: ["C"], lat: 40.7814, lng: -73.9722 },
  { name: "86 St", lines: ["4", "5"], lat: 40.7794, lng: -73.9556 },
  { name: "14 St (8th Avenue)", lines: ["A", "C", "E"], lat: 40.7404, lng: -74.0021 },
  { name: "14 St–Union Sq", lines: ["N", "Q", "R"], lat: 40.7347, lng: -73.9906 },
  { name: "W 4 St–Washington Sq", lines: ["A", "C", "E"], lat: 40.7323, lng: -74.0005 },
  { name: "Spring St", lines: ["C", "E"], lat: 40.7262, lng: -74.0037 },
  { name: "Chambers St", lines: ["A", "C"], lat: 40.7141, lng: -74.0087 },
  { name: "World Trade Center", lines: ["E"], lat: 40.7126, lng: -74.0099 },
  { name: "High St–Brooklyn Bridge", lines: ["A", "C"], lat: 40.6993, lng: -73.9905 },
];

/* ---------- Worth booking before the trip ---------- */
const BOOK_AHEAD = [
  { place: "edge", note: "The sunset slot on Wednesday, around 3:45 pm" },
  { place: "radio-city", note: "Weekday daytime seats are the cheapest" },
  { place: "lincoln-center", note: "The Nutcracker sells out close to Christmas" },
  { place: "summit", note: "Timed entry — pick a clear-weather day" },
  { place: "911", note: "Museum tickets are timed; the memorial is free" },
];
