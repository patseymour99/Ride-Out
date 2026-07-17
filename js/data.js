/**
 * ============================================================
 *  THE GARAGE — bike ownership data (the real list)
 * ============================================================
 *  57 bikes owned since 2004, in the order they arrived.
 *
 *  Fields:
 *    make     – manufacturer (drives the brand colour)
 *    model    – model name shown on cards and charts
 *    year     – model year of the bike, or null if not recorded
 *    cc       – engine displacement (best identification — correct freely)
 *    category – Off-road | Trials | Road | Adventure | Scooter | Classic | Mini
 *    image    – path to a photo (e.g. "images/wr450.jpg"), or null for the
 *               built-in silhouette placeholder
 *    note     – optional one-liner shown on the card
 * ============================================================
 */

const SAMPLE_DATA = false;
const COLLECTING_SINCE = 2004;

const BIKES = [
  { make: "Yamaha",       model: "DT 125",                 year: null, cc: 125,  category: "Off-road" },
  { make: "KTM",          model: "625 SXC",                year: null, cc: 625,  category: "Off-road" },
  { make: "KTM",          model: "950 Adventure",          year: null, cc: 942,  category: "Adventure" },
  { make: "KTM",          model: "625 SXC",                year: null, cc: 625,  category: "Off-road", note: "Second time around." },
  { make: "KTM",          model: "400 EXC",                year: null, cc: 400,  category: "Off-road" },
  { make: "KTM",          model: "450 EXC",                year: null, cc: 450,  category: "Off-road" },
  { make: "Yamaha",       model: "WR 450",                 year: null, cc: 450,  category: "Off-road" },
  { make: "Yamaha",       model: "WR 250",                 year: null, cc: 250,  category: "Off-road" },
  { make: "Yamaha",       model: "WR 450",                 year: null, cc: 450,  category: "Off-road", note: "WR450 number two." },
  { make: "Yamaha",       model: "WR 450",                 year: null, cc: 450,  category: "Off-road", note: "WR450 number three." },
  { make: "Yamaha",       model: "WR 450",                 year: null, cc: 450,  category: "Off-road", note: "WR450 number four. A pattern emerges." },
  { make: "Aprilia",      model: "Mana 850",               year: null, cc: 839,  category: "Road" },
  { make: "Gas Gas",      model: "280",                    year: null, cc: 280,  category: "Trials" },
  { make: "Vespa",        model: "125",                    year: null, cc: 125,  category: "Scooter" },
  { make: "KTM",          model: "50",                     year: null, cc: 50,   category: "Mini" },
  { make: "KTM",          model: "75",                     year: null, cc: 75,   category: "Mini" },
  { make: "Suzuki",       model: "50 Quad",                year: null, cc: 50,   category: "Mini", note: "Four wheels snuck into the garage." },
  { make: "Yamaha",       model: "R6",                     year: null, cc: 600,  category: "Road" },
  { make: "Yamaha",       model: "R6",                     year: null, cc: 600,  category: "Road", note: "The second R6." },
  { make: "Yamaha",       model: "YZF 450",                year: null, cc: 450,  category: "Off-road" },
  { make: "Yamaha",       model: "YZ 250",                 year: 2008, cc: 250,  category: "Off-road" },
  { make: "Suzuki",       model: "VanVan 125",             year: 2012, cc: 125,  category: "Road" },
  { make: "Honda",        model: "ADV 750",                year: 2017, cc: 745,  category: "Scooter" },
  { make: "Honda",        model: "CB 750 K",               year: 1982, cc: 748,  category: "Classic" },
  { make: "Kawasaki",     model: "GT 550",                 year: null, cc: 553,  category: "Classic" },
  { make: "Kawasaki",     model: "W 800",                  year: 2011, cc: 773,  category: "Classic" },
  { make: "Vespa",        model: "GTS 300",                year: 2019, cc: 278,  category: "Scooter" },
  { make: "Yamaha",       model: "TMax 250",               year: 2011, cc: 250,  category: "Scooter" },
  { make: "Ossa",         model: "250 MAR",                year: 1977, cc: 244,  category: "Trials" },
  { make: "Royal Enfield",model: "Bullet 350",             year: 1953, cc: 346,  category: "Classic", note: "The elder statesman of the garage." },
  { make: "Sherco",       model: "300 SEF",                year: 2020, cc: 300,  category: "Off-road" },
  { make: "KTM",          model: "350 EXC",                year: 2014, cc: 350,  category: "Off-road" },
  { make: "Husqvarna",    model: "450 FE",                 year: 2019, cc: 450,  category: "Off-road" },
  { make: "KTM",          model: "250 EXC",                year: 2008, cc: 250,  category: "Off-road" },
  { make: "Yamaha",       model: "TY 80",                  year: 1977, cc: 80,   category: "Trials" },
  { make: "Yamaha",       model: "TW 200",                 year: 1992, cc: 196,  category: "Off-road" },
  { make: "Honda",        model: "CL 350",                 year: 1974, cc: 325,  category: "Classic" },
  { make: "Moto Guzzi",   model: "California 850",         year: 1973, cc: 844,  category: "Classic" },
  { make: "Honda",        model: "Forza 350",              year: 2021, cc: 330,  category: "Scooter" },
  { make: "Ducati",       model: "Scrambler Desert Sled 800", year: 2021, cc: 803, category: "Road" },
  { make: "MV Agusta",    model: "Turismo Veloce Lusso 800",  year: 2022, cc: 798, category: "Road" },
  { make: "Simson",       model: "125",                    year: 1964, cc: 125,  category: "Classic" },
  { make: "Indian",       model: "Chief Dark Horse",       year: 2022, cc: 1890, category: "Road", note: "The biggest engine ever to enter the garage." },
  { make: "Bultaco",      model: "Sherpa 350",             year: 1976, cc: 326,  category: "Trials" },
  { make: "Montesa",      model: "260 R",                  year: 2022, cc: 260,  category: "Trials" },
  { make: "Suzuki",       model: "VanVan 125",             year: 2006, cc: 125,  category: "Road", note: "VanVan, the sequel." },
  { make: "KTM",          model: "890 Adventure R",        year: 2024, cc: 889,  category: "Adventure" },
  { make: "KTM",          model: "350 EXC Six Days",       year: 2024, cc: 350,  category: "Off-road" },
  { make: "Honda",        model: "Monkey 125",             year: 2020, cc: 125,  category: "Mini" },
  { make: "Suzuki",       model: "DE 800",                 year: 2023, cc: 776,  category: "Adventure" },
  { make: "MV Agusta",    model: "F4 1000",                year: 2009, cc: 998,  category: "Road" },
  { make: "Husqvarna",    model: "701",                    year: 2016, cc: 693,  category: "Off-road" },
  { make: "Vespa",        model: "310",                    year: 2025, cc: 310,  category: "Scooter" },
  { make: "Husqvarna",    model: "701 Rally",              year: 2024, cc: 693,  category: "Off-road" },
  { make: "KTM",          model: "500 EXC (rally kit)",    year: 2025, cc: 511,  category: "Off-road" },
  { make: "Moto Guzzi",   model: "Ambassador V7 800",      year: 1969, cc: 757,  category: "Classic" },
  { make: "Honda",        model: "ADV 350",                year: 2026, cc: 330,  category: "Scooter", note: "The latest arrival." },
].map((b) => ({ image: null, ...b }));
