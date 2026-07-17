/**
 * ============================================================
 *  THE GARAGE — bike ownership data
 * ============================================================
 *  ⚠️  SAMPLE DATA — placeholder bikes only.
 *  Replace every entry below with Dad's real list.
 *
 *  Fields:
 *    make   – manufacturer (drives the brand colour, keep spelling consistent)
 *    model  – model name shown on cards and the timeline
 *    year   – model year of the bike itself
 *    cc     – engine displacement
 *    type   – Standard | Sport | Tourer | Adventure | Classic | Naked | ...
 *    from   – year he bought it
 *    to     – year he sold it, or null if he still owns it
 *    image  – path to a photo (e.g. "images/cb200.jpg"), or null for the
 *             built-in silhouette placeholder
 *    story  – one line about the bike (optional, shows on the card)
 * ============================================================
 */

const SAMPLE_DATA = true; // flips the "sample data" banner on

const BIKES = [
  { make: "Honda",    model: "CB200",             year: 1974, cc: 198,  type: "Standard",  from: 1976, to: 1979, image: null,
    story: "The first one. Bought for £120 and ridden everywhere, in all weather." },
  { make: "Suzuki",   model: "GT250",             year: 1978, cc: 247,  type: "Sport",     from: 1979, to: 1982, image: null,
    story: "Two-stroke scream. Blue haze followed it down every road." },
  { make: "Honda",    model: "CB750F",            year: 1981, cc: 748,  type: "Standard",  from: 1982, to: 1986, image: null,
    story: "The first big four. Suddenly motorways stopped being scary." },
  { make: "Kawasaki", model: "GPZ900R",           year: 1985, cc: 908,  type: "Sport",     from: 1986, to: 1990, image: null,
    story: "The Top Gun bike. Fastest thing he'd ever owned at the time." },
  { make: "BMW",      model: "R80RT",             year: 1988, cc: 798,  type: "Tourer",    from: 1990, to: 1995, image: null,
    story: "First tourer — two-up across France every summer." },
  { make: "Ducati",   model: "916",               year: 1995, cc: 916,  type: "Sport",     from: 1995, to: 1998, image: null,
    story: "The poster bike, made real. Gorgeous, temperamental, unforgettable." },
  { make: "Triumph",  model: "Bonneville T100",   year: 1999, cc: 790,  type: "Classic",   from: 1999, to: 2005, image: null,
    story: "A nod to the bikes of his youth — Sunday-morning café runs." },
  { make: "Honda",    model: "Africa Twin XRV750",year: 2000, cc: 742,  type: "Adventure", from: 2001, to: 2007, image: null,
    story: "Ran alongside the Bonnie. Green lanes, gravel and one trip to Morocco." },
  { make: "Suzuki",   model: "SV650",             year: 2006, cc: 645,  type: "Naked",     from: 2007, to: 2010, image: null,
    story: "The sensible one that turned out to be enormous fun." },
  { make: "BMW",      model: "R1200GS",           year: 2010, cc: 1170, type: "Adventure", from: 2010, to: 2016, image: null,
    story: "The do-everything bike. 40,000 miles and it never missed a beat." },
  { make: "Triumph",  model: "Street Triple RS",  year: 2016, cc: 765,  type: "Naked",     from: 2016, to: 2021, image: null,
    story: "Proof you don't slow down with age — you just get sharper." },
  { make: "BMW",      model: "R1250RT",           year: 2021, cc: 1254, type: "Tourer",    from: 2021, to: null, image: null,
    story: "The current steed. Comfort, torque, and still plenty of miles to go." },
];
