// The "Anwar Horology" Apple Note, structured.
// Public dataset: personal stories, milestones and milestone decisions are layered on by
// personal.js, which is gitignored. Rule: specs are only filled when the note, the URL or the reference itself states them.
// Dial art is illustrative (style + colour), never a spec claim.

window.HOROLOGY = {
  stores: [
    { name: "Teddy Baldassarre", host: "teddybaldassarre.com" },
    { name: "Jomashop", host: "jomashop.com" },
    { name: "The 1916 Company", host: "the1916company.com" },
    { name: "Chrono24", host: "chrono24.com" },
  ],

  owned: [
    {
      id: "citizen-zenshin-80x", maker: "Citizen", line: "Zenshin", model: "Zenshin Automatic", variant: "Green textured dial",
      ref: "NJ0180-80X", dial: ["integrated", "#1f4a3c"],
      urls: ["https://www.jomashop.com/citizen-zenshin-automatic-green-dial-mens-watch-nj0180-80x.html"],
      specs: {
        "Movement": "Citizen/Miyota Cal. 8213 automatic", "Functions": "Hours, minutes, small seconds, date",
        "Power reserve": "≈40 hours", "Crystal": "Sapphire", "Diameter": "40.5 mm", "Thickness": "11.0 mm",
        "Lug to lug": "47.0 mm", "Case": "Super Titanium™", "Bracelet": "Super Titanium™ integrated",
        "Dial": "Green textured", "Water resistance": "100 m", "Accuracy": "−20 to +40 s/day", "Weight": "≈100 g",
        "Lume": "Hands and markers", "Crown": "Push/pull", "Lug width": "Integrated",
      },
    },
    {
      id: "seiko-srpk91", maker: "Seiko", line: "5 Sports", model: "SRPK91", ref: "SRPK91",
      dial: ["sport", "#2c3a35"],
      urls: ["https://seikousa.com/collections/all/products/srpk91"],
      specs: {
        "Movement": "Seiko 4R36 automatic, hand-winding, hacking", "Power reserve": "41 hours", "Crystal": "Curved Hardlex",
        "Diameter": "37.4 mm", "Lug to lug": "44.7 mm", "Thickness": "12.5 mm", "Case": "Stainless steel",
        "Water resistance": "100 m", "Lug width": "18 mm",
      },
    },
    {
      id: "orient-bambino-v2", maker: "Orient", line: "Bambino", model: "Bambino Version 2 Small Seconds", ref: "RA-AP0101B30B",
      dial: ["dress-ss", "#161616"],
      urls: ["https://www.orientwatchusa.com/collections/orient-bambino/ra-ap0101b30b"],
      specs: {
        "Movement": "Cal. F6222 automatic, hand-winding, hacking", "Power reserve": "40 hours", "Crystal": "Domed mineral",
        "Diameter": "38.4 mm", "Lug to lug": "44 mm", "Thickness": "12 mm", "Water resistance": "30 m", "Lug width": "20 mm",
      },
    },
    {
      id: "casio-mq24", maker: "Casio", line: "Standard", model: "MQ-24-9B", ref: "MQ-24-9B",
      dial: ["simple", "#c9a75a"],
      urls: ["https://www.casio.com/us/watches/casio/product.MQ-24-9BLL/"], specs: {},
    },
    {
      id: "seiko-snkl17", maker: "Seiko", line: "Seiko 5", model: "SNKL17", ref: "SNKL17", dial: ["dress", "#1d1d1f"],
      urls: ["https://www.jomashop.com/seiko-watch-snkl17.html"], specs: {},
    },
    {
      id: "movado-0606337", maker: "Movado", line: "Museum", model: "0606337", ref: "0606337", dial: ["museum", "#121212"],
      urls: ["https://www.jomashop.com/movado-watch-0606337.html"], specs: {},
    },
  ],

  straps: [
    {
      id: "delugs-cordovan", maker: "Delugs", name: "Black Shell Cordovan Slim", material: "Shell cordovan leather",
      colour: "#121010", lugWidth: 20, status: "want",
      urls: ["https://delugs.com/products/black-shell-cordovan-leather-slim-watch-strap"],
    },
  ],

  // Want list. saves = how many times it appears in the note; capture = how the import went.
  wants: [
    // Omega
    { id: "omega-speedy-mk2", maker: "Omega", line: "Speedmaster", model: "Speedmaster Mark II Co-Axial Chronometer Chronograph", dial: ["chrono", "#3a3c40"], urls: ["https://www.omegawatches.com/en-us/watch-omega-speedmaster-mark-ii-co-axial-chronometer-chronograph"] },
    { id: "omega-moonwatch", maker: "Omega", line: "Speedmaster", model: "Speedmaster Moonwatch Professional Co-Axial Master Chronometer", variant: null, saves: 3, variantLost: true, dial: ["chrono", "#121315"], urls: ["https://www.omegawatches.com/en-us/watch-omega-speedmaster-moonwatch-professional-co-axial-master-chronometer"] },
    { id: "omega-smp-007", maker: "Omega", line: "Seamaster", model: "Seamaster Diver 300M James Bond 007", variant: "Titanium", size: "42 mm", dial: ["diver", "#4a3a2b"], urls: ["https://teddybaldassarre.com/products/sea-300m-james-bond-007-titi-42mm"] },
    { id: "omega-deville-pr", maker: "Omega", line: "De Ville", model: "De Ville Prestige Co-Axial Master Chronometer Power Reserve", size: "41 mm", saves: 2, variantLost: true, dial: ["dress-pr", "#dcd5c6"], urls: ["https://www.omegawatches.com/en-us/watch-omega-de-ville-prestige-co-axial-master-chronometer-power-reserve-41"] },
    { id: "omega-deville-ss", maker: "Omega", line: "De Ville", model: "De Ville Prestige Co-Axial Master Chronometer Small Seconds", size: "41 mm", saves: 2, variantLost: true, dial: ["dress-ss", "#1d2a44"], urls: ["https://www.omegawatches.com/en-us/watch-omega-de-ville-prestige-co-axial-master-chronometer-small-seconds-41"] },
    { id: "omega-aqua-terra-41", maker: "Omega", line: "Seamaster", model: "Seamaster Aqua Terra 150M Co-Axial Master Chronometer", size: "41 mm", saves: 2, variantLost: true, dial: ["sport", "#24384f"], urls: ["https://www.omegawatches.com/en-us/watch-omega-seamaster-aqua-terra-150m-co-axial-master-chronometer-41"] },
    { id: "omega-aqua-terra-shades", maker: "Omega", line: "Seamaster", model: "Seamaster Aqua Terra Shades Co-Axial Master Chronometer", size: "38 mm", dial: ["sport", "#a9bcc4"], urls: ["https://www.omegawatches.com/en-us/watch-omega-seamaster-aqua-terra-shades-co-axial-master-chronometer-38"] },
    { id: "omega-railmaster", maker: "Omega", line: "Seamaster", model: "Seamaster Railmaster Co-Axial Master Chronometer", size: "38 mm", dial: ["field", "#26282a"], urls: ["https://www.omegawatches.com/en-us/watch-omega-seamaster-railmaster-co-axial-master-chronometer-38"] },
    { id: "swatch-mttm", maker: "Swatch", collab: "Omega", line: "MoonSwatch", model: "MoonSwatch Mission to the Moon", dial: ["chrono", "#43464d"], urls: ["https://www.swatch.com/en-us/mission-to-the-moon"] },
    { id: "swatch-earthphase-gold", maker: "Swatch", collab: "Omega", line: "MoonSwatch", model: "Mission to Earthphase Moonshine Gold", dial: ["chrono", "#1a2442"], urls: ["https://www.swatch.com/en-us/bioceramic-moonswatch-collection/mission-to-earthphase-moonshine-gold"] },
    { id: "omega-seamaster-preowned", maker: "Omega", line: "Seamaster", model: "Pre-owned Seamaster", variant: "Category page, no single watch", level: "model", capture: "partial", dial: ["diver", "#1d3150"], urls: ["https://www.the1916company.com/pre-owned/omega/seamaster"] },

    // Tudor
    { id: "tudor-bb58", maker: "Tudor", line: "Black Bay", model: "Black Bay 58", saves: 2, variantLost: true, dial: ["diver", "#141414"], urls: ["https://www.tudorwatch.com/en/watches/black-bay-58"] },

    // Longines
    { id: "longines-flagship-726", maker: "Longines", line: "Flagship", model: "Flagship Classic", ref: "L4.974.4.72.6", dial: ["dress", "#ebe6da"], urls: ["https://www.longines.com/en-us/p/watch-flagship-classic-l4-974-4-72-6"] },
    { id: "longines-heritage-730", maker: "Longines", line: "Heritage", model: "Heritage Classic", ref: "L2.828.4.73.0", dial: ["sector", "#ddd6c4"], urls: ["https://www.longines.com/en-us/p/watch-heritage-classic-l2-828-4-73-0"] },
    { id: "longines-zulu-636", maker: "Longines", line: "Spirit", model: "Spirit Zulu Time", ref: "L3.802.4.63.6", dial: ["gmt", "#1b2a48"], urls: ["https://www.longines.com/en-us/p/watch-longines-spirit-zulu-time-l3-802-4-63-6"] },
    { id: "longines-zulu-506", maker: "Longines", line: "Spirit", model: "Spirit Zulu Time", ref: "L3.802.4.50.6", dial: ["gmt", "#161616"], urls: ["https://www.longines.com/en-us/p/watch-longines-spirit-zulu-time-l3-802-4-50-6"] },
    { id: "longines-flagship-592", maker: "Longines", line: "Flagship", model: "Flagship Classic", ref: "L4.984.4.59.2", dial: ["dress", "#26324a"], urls: ["https://www.longines.com/en-us/p/watch-flagship-classic-l4-984-4-59-2"] },
    { id: "longines-flagship-722", maker: "Longines", line: "Flagship", model: "Flagship", ref: "L4.899.4.72.2", dial: ["dress", "#e7e2d6"], urls: ["https://www.jomashop.com/longines-flagship-watch-l4-899-4-72-2.html"] },
    { id: "longines-presence", maker: "Longines", line: "Presence", model: "Presence", ref: "L4.974.4.92.2", dial: ["dress", "#ece8df"], urls: ["https://www.jomashop.com/longines-presence-watch-l49744922.html"] },
    { id: "longines-zulu-hodinkee", maker: "Longines", collab: "Hodinkee", line: "Spirit", model: "Zulu Time Limited Edition for Hodinkee", dial: ["gmt", "#e6dfcc"], urls: ["https://shop.hodinkee.com/products/longines-zulu-time-limited-edition-for-hodinkee"] },
    { id: "longines-dolcevita", maker: "Longines", line: "DolceVita", model: "DolceVita Automatic", variant: "Silver dial", dial: ["tank", "#dededa"], urls: ["https://www.jomashop.com/longines-dolcevita-automatic-silver-dial"] },

    // NOMOS
    { id: "nomos-164", maker: "NOMOS Glashütte", line: "Tangente", model: "Tangente 38", ref: "164", size: "38 mm", dial: ["bauhaus", "#f2f0ea"], urls: ["https://nomos-glashuette.com/en-us/tangente/tangente-38-164"], raw: "Nomos Tamgente Reference 164 or 139 (Depending on size)" },
    { id: "nomos-139", maker: "NOMOS Glashütte", line: "Tangente", model: "Tangente", ref: "139", dial: ["bauhaus", "#f2f0ea"], urls: [], capture: "text", raw: "Nomos Tamgente Reference 164 or 139 (Depending on size)" },
    { id: "nomos-131", maker: "NOMOS Glashütte", line: "Tangente", model: "Tangente Date Power Reserve", ref: "131", dial: ["bauhaus-pr", "#f2f0ea"], urls: ["https://nomos-glashuette.com/en-us/tangente/tangente-date-power-reserve-131"] },

    // Hamilton
    { id: "hamilton-murph-38", maker: "Hamilton", line: "Khaki Field", model: "Khaki Field Murph", ref: "H70405730", size: "38 mm", dial: ["field", "#121212"], urls: ["https://www.hamiltonwatch.com/en-us/h70405730-khaki-field-murph-38mm.html"] },
    { id: "hamilton-murph-auto", maker: "Hamilton", line: "Khaki Field", model: "Khaki Field Murph Auto", ref: "H70405130", dial: ["field", "#121212"], urls: ["https://www.hamiltonwatch.com/en-us/h70405130-khaki-field-murph-auto.html"] },
    { id: "hamilton-field-pr", maker: "Hamilton", line: "Khaki Field", model: "Khaki Field Power Reserve Mechanical", ref: "H69509110", dial: ["field", "#1c1d1b"], urls: ["https://www.hamiltonwatch.com/en-us/h69509110-khaki-field-power-reserve-mechanical.html"] },
    { id: "hamilton-ventura", maker: "Hamilton", line: "Ventura", model: "Ventura Quartz", ref: "H24211732", dial: ["shield", "#141414"], urls: ["https://www.hamiltonwatch.com/en-us/h24211732-ventura-quartz.html"] },
    { id: "hamilton-ventura-chrono", maker: "Hamilton", line: "Ventura", model: "Ventura Chrono Quartz", ref: "H24412732", dial: ["shield", "#141414"], urls: ["https://www.hamiltonwatch.com/en-us/h24412732-ventura-chrono-quartz.html"] },
    { id: "hamilton-field-mech-black", maker: "Hamilton", line: "Khaki Field", model: "Khaki Field Mechanical", variant: "Black dial", dial: ["field", "#151515"], urls: ["https://teddybaldassarre.com/products/khaki-field-mechanical-black-dial"] },
    { id: "hamilton-field-auto", maker: "Hamilton", line: "Khaki Field", model: "Khaki Field Auto", dial: ["field", "#20231f"], urls: ["https://teddybaldassarre.com/products/khaki-field-auto"] },

    // Tissot
    { id: "tissot-t006-053", maker: "Tissot", line: "Unknown", model: null, ref: "T006.407.16.053.00", capture: "partial", dial: ["dress", "#ded8ca"], urls: ["https://www.tissotwatches.com/en-us/T0064071605300.html"] },
    { id: "tissot-t006-033", maker: "Tissot", line: "Unknown", model: null, ref: "T006.407.16.033.00", capture: "partial", dial: ["dress", "#1c1c1e"], urls: ["https://www.tissotwatches.com/en-us/T0064071603300.html"] },
    { id: "tissot-t156", maker: "Tissot", line: "Unknown", model: null, ref: "T156.208.11.353.00", capture: "partial", dial: ["sport", "#2a3f52"], urls: ["https://www.tissotwatches.com/en-us/T1562081135300.html"] },
    { id: "tissot-heritage-1938", maker: "Tissot", line: "Heritage", model: "Heritage Small Second 1938", saves: 2, dial: ["dress-ss", "#e4dac7"], urls: ["https://jpavilion.com/collections/tissot/products/tissot-heritage-small-second-1938", "https://teddybaldassarre.com/products/heritage-1938"] },
    { id: "tissot-t150-011", maker: "Tissot", line: "Unknown", model: null, ref: "T150.410.16.011.00", capture: "partial", dial: ["dress", "#e7e3d9"], urls: ["https://www.tissotwatches.com/en-us/T1504101601100.html"] },
    { id: "tissot-t150-051", maker: "Tissot", line: "Unknown", model: null, ref: "T150.410.16.051.00", capture: "partial", dial: ["dress", "#1b2b45"], urls: ["https://www.tissotwatches.com/en-us/T1504101605100.html"] },

    // Rolex
    { id: "rolex-1908", maker: "Rolex", line: "Perpetual", model: "1908", ref: "52506", size: "39 mm", capture: "text", dial: ["dress-ss", "#efebe1"], urls: [], raw: "Rolex 1908  39 mm Reference 52506" },

    // Cartier
    { id: "cartier-tank-0106", maker: "Cartier", line: "Tank", model: "Tank Must de Cartier", ref: "CRWSTA0106", dial: ["tank", "#f1ede4"], urls: ["https://www.cartier.com/en-us/watches/collections/tank/tank-must-de-cartier-watch-CRWSTA0106.html"] },
    { id: "cartier-tank-0136", maker: "Cartier", line: "Tank", model: "Tank Must de Cartier", ref: "CRWSTA0136", dial: ["tank", "#efe9dc"], urls: ["https://www.cartier.com/en-us/watches/collections/tank/tank-must-de-cartier-watch-CRWSTA0136.html"] },
    { id: "cartier-tank-0137", maker: "Cartier", line: "Tank", model: "Tank Must de Cartier", ref: "CRWSTA0137", dial: ["tank", "#ece6d8"], urls: ["https://www.cartier.com/en-us/watches/collections/tank/tank-must-de-cartier-watch-CRWSTA0137.html"] },

    // IWC
    { id: "iwc-portofino-01", maker: "IWC Schaffhausen", line: "Portofino", model: "Portofino", ref: "IW3565-01", dial: ["dress", "#e7e3da"], urls: ["https://www.the1916company.com/watches/iwc-schaffhausen/portofino/iw3565-01/"] },
    { id: "iwc-pilot-01", maker: "IWC Schaffhausen", line: "Pilot", model: "Pilot", ref: "IW3282-01", dial: ["pilot", "#131313"], urls: ["https://www.the1916company.com/watches/iwc-schaffhausen/pilot/iw3282-01/"] },
    { id: "iwc-pilot-02", maker: "IWC Schaffhausen", line: "Pilot", model: "Pilot", ref: "IW3282-02", dial: ["pilot", "#1c2a48"], urls: ["https://www.the1916company.com/watches/iwc-schaffhausen/pilot/iw3282-02/"] },
    { id: "iwc-portugieser", maker: "IWC Schaffhausen", line: "Portugieser", model: "Portugieser", ref: "IW3583-03", dial: ["dress-ss", "#e9e5dc"], urls: ["https://www.the1916company.com/watches/iwc-schaffhausen/portugieser/iw3583-03/"] },
    { id: "iwc-portofino-17", maker: "IWC Schaffhausen", line: "Portofino", model: "Portofino", ref: "IW3565-17", dial: ["dress", "#1c2b48"], urls: ["https://www.the1916company.com/watches/iwc-schaffhausen/portofino/iw3565-17/"] },

    // Oris
    { id: "oris-brand", maker: "Oris", line: "—", model: null, level: "brand", capture: "brand", dial: ["unknown", "#2a2a2a"], urls: ["https://www.oris.ch/en-US/"] },
    { id: "oris-bigcrown", maker: "Oris", line: "Big Crown", model: "Big Crown", ref: "01 754 7798 4064-07 8 20 06", dial: ["field", "#2b2f25"], urls: ["https://www.oris.ch/en-US/product/watch/big-crown/new-big-crown/01-754-7798-4064-07-8-20-06"] },

    // Bulova
    { id: "bulova-lunar", maker: "Bulova", line: "Lunar Pilot", model: "Lunar Pilot", ref: "96A225", dial: ["chrono", "#121212"], urls: ["https://www.jomashop.com/bulova-lunar-pilot-watch-96a225.html"] },

    // Orient
    { id: "orient-ac0q03s", maker: "Orient", line: "Sport", model: null, ref: "RA-AC0Q03S30B", saves: 2, capture: "partial", dial: ["diver", "#d4d4d0"], urls: ["https://www.orientwatchusa.com/collections/sport/ra-ac0q03s30b"] },
    { id: "orient-ac0q07v", maker: "Orient", line: "Sport", model: null, ref: "RA-AC0Q07V30B", capture: "partial", dial: ["diver", "#2d3a2a"], urls: ["https://www.orientwatchusa.com/collections/sport/ra-ac0q07v30b"] },
    { id: "orient-ak0311n", maker: "Orient", line: "Classic", model: null, ref: "RA-AK0311N30B", capture: "partial", dial: ["dress", "#2b2a28"], urls: ["https://www.orientwatchusa.com/collections/classic/ra-ak0311n30b"] },
    { id: "orient-ac0q01b", maker: "Orient", line: "Sport", model: null, ref: "RA-AC0Q01B30B", capture: "partial", dial: ["diver", "#141414"], urls: ["https://www.orientwatchusa.com/collections/sport/ra-ac0q01b30b"] },
    { id: "orient-aa0001b", maker: "Orient", line: "Sport", model: null, ref: "RA-AA0001B39B", capture: "partial", dial: ["diver", "#151515"], urls: ["https://www.orientwatchusa.com/collections/sport/ra-aa0001b39b"] },
    { id: "orient-aa0003r", maker: "Orient", line: "Sport", model: null, ref: "RA-AA0003R39B", capture: "partial", dial: ["diver", "#5a1d1d"], urls: ["https://www.orientwatchusa.com/collections/sport/ra-aa0003r39b"] },
    { id: "orient-ac0q12l", maker: "Orient", line: "Sport", model: null, ref: "RA-AC0Q12L30B", capture: "partial", dial: ["diver", "#1d3456"], urls: ["https://www.orientwatchusa.com/collections/sport/ra-ac0q12l30b"] },

    // Timex
    { id: "timex-reef-ti-rubber", maker: "Timex", line: "Deepwater", model: "Deepwater Reef 200 Titanium Automatic", variant: "Synthetic rubber strap", size: "41 mm", dial: ["diver", "#1f3346"], urls: ["https://timex.com/products/deepwater-reef-200-titanium-automatic-41mm-synthetic-rubber-strap"] },
    { id: "timex-reef-ti-bracelet", maker: "Timex", line: "Deepwater", model: "Deepwater Reef 200 Titanium", variant: "Titanium bracelet", size: "41 mm", dial: ["diver", "#1c1d20"], urls: ["https://timex.com/products/deepwater-reef-200-41mm-titanium-bracelet"] },
    { id: "timex-meridian", maker: "Timex", line: "Deepwater", model: "Deepwater Meridian 200", ref: "TW2Y40300", size: "38 mm", variant: "HNBR rubber strap", dial: ["diver", "#2a3a33"], urls: ["https://timex.com/products/deepwater-meridian-200-38mm-hnbr-rubber-strap-watch-tw2y40300"] },
    { id: "timex-reef-ss", maker: "Timex", line: "Deepwater", model: "Deepwater Reef 200", ref: "TW2W95200", size: "41 mm", variant: "Stainless steel bracelet", dial: ["diver", "#141518"], urls: ["https://timex.com/products/deepwater-reef-200-41mm-stainless-steel-bracelet-watch-tw2w95200"] },
    { id: "timex-eline-ss", maker: "Timex", line: "E-Line", model: "Automatic 1983 E-Line Reissue", size: "34 mm", variant: "Stainless steel", dial: ["simple", "#d8d5cc"], urls: ["https://timex.com/products/timex-automatic-1983-e-line-reissue-34mm-stainless-steel"] },
    { id: "timex-eline-leather", maker: "Timex", line: "E-Line", model: "Automatic 1983 E-Line", ref: "TW2Y07500", size: "34 mm", variant: "Leather strap", cleaned: true, dial: ["simple", "#d8d5cc"], urls: ["https://timex.com/products/timex-automatic-1983-e-line-34mm-leather-strap-watch-tw2y07500"] },
    { id: "timex-worldtime", maker: "Timex", line: "Reissue", model: "World Time Reissue", size: "39 mm", variant: "Leather strap", saves: 2, dial: ["worldtime", "#e6dfcc"], urls: ["https://timex.com/products/world-time-reissue-39mm-leather", "https://timex.com/products/world-time-reissue-39mm-leather-strap-watch"] },
    { id: "timex-q-worldtime", maker: "Timex", line: "Q Timex", model: "Q Timex 1972 World Time", ref: "TW2Y31400", size: "39 mm", variant: "Leather strap", dial: ["worldtime", "#2a2d33"], urls: ["https://timex.com/products/q-timex-1972-world-time-39mm-leather-strap-watch-tw2y31400"] },
    { id: "timex-peanuts", maker: "Timex", collab: "Peanuts", line: "Marlin", model: "Marlin Chronograph Joe Cool", size: "40 mm", capture: "repaired", dial: ["chrono", "#e8e2d2"], urls: ["https://timex.com/products/peanuts-x-timex-marlin-chronograph-joe-cool-40mm-"] },
    { id: "timex-draper", maker: "Timex", line: "Marlin", model: "Marlin Draper Automatic", size: "37 mm", variant: "Stainless steel bracelet", dial: ["dress", "#2a2b2e"], urls: ["https://timex.com/products/marlin-draper-automatic-37mm-stainless-steel-bracelet"] },
    { id: "timex-pioneer-gmt", maker: "Timex", line: "Expedition", model: "Expedition Pioneer Titanium Automatic GMT", size: "41 mm", dial: ["gmt", "#23271f"], urls: ["https://timex.com/products/expedition-pioneer-titanium-automatic-gmt-41mm"] },
    { id: "timex-todd-snyder", maker: "Timex", collab: "Todd Snyder", line: "—", model: null, level: "brand", capture: "partial", dial: ["unknown", "#2a2a2a"], urls: ["https://timex.com/products/todd-snyder"] },
    { id: "timex-weekender", maker: "Timex", line: "Weekender", model: "Weekender", size: "38 mm", variant: "Fabric strap", dial: ["field", "#ecebe5"], urls: ["https://timex.com/products/weekender-38mm-fabric-strap"] },
    { id: "timex-scout", maker: "Timex", line: "Expedition", model: "Expedition Scout", size: "40 mm", variant: "Fabric strap", dial: ["field", "#1b1d1a"], urls: ["https://timex.com/products/expedition-scout-40mm-fabric-strap-watch"] },
    { id: "timex-marlin-jet", maker: "Timex", line: "Marlin", model: "Marlin Jet Automatic", ref: "TW2V72300", size: "38 mm", variant: "Fabric strap", saves: 2, cleaned: true, dial: ["dress", "#1f2a3c"], urls: ["https://timex.com/products/marlin-jet-automatic-38mm-fabric-strap", "https://timex.com/products/marlin-jet-automatic-38mm-fabric-strap-watch-tw2v72300"] },
    { id: "timex-intrepid", maker: "Timex", line: "Reissue", model: "1995 Intrepid Reissue", size: "46 mm", variant: "Synthetic rubber strap", dial: ["digital", "#1a1c1e"], urls: ["https://timex.com/products/timex-1995-intrepid-reissue-46mm-synthetic-rubber-strap-watch"] },
    { id: "timex-marlin-hw", maker: "Timex", line: "Marlin", model: "Marlin Hand-Wound", size: "34 mm", variant: "Leather strap", dial: ["simple", "#e9e4d6"], urls: ["https://timex.com/products/marlin-hand-wound-34mm-leather-strap-watch"] },
    { id: "timex-lexington", maker: "Timex", line: "Reissue", model: "1976 Lexington Reissue", capture: "article", dial: ["simple", "#d9d2c0"], urls: ["https://www.gearpatrol.com/watches/timex-1976-lexington-reissue/"] },
    { id: "timex-falcon-eye", maker: "Timex", line: "Q Timex", model: "Q Timex Falcon Eye Chronograph", ref: "TW2Y34800", size: "40 mm", variant: "Stainless steel bracelet", cleaned: true, dial: ["chrono", "#151515"], urls: ["https://timex.com/products/q-timex-falcon-eye-chronograph-40mm-stainless-steel-bracelet-watch-tw2y34800"] },

    // Seiko
    { id: "seiko-ssk023", maker: "Seiko", line: "5 Sports", model: "5 Sports Field GMT", ref: "SSK023", cleaned: true, dial: ["gmt", "#e4dbc6"], urls: ["https://teddybaldassarre.com/products/5-sports-field-gmt-ssk023"] },
    { id: "seiko-spb463", maker: "Seiko", line: "Presage", model: "Presage", ref: "SPB463", size: "40.2 mm", variant: "Beige, on bracelet", cleaned: true, dial: ["dress", "#d8c7a6"], urls: ["https://teddybaldassarre.com/products/spb463-presage-40-2mm-beige-on-bracelet"] },
    { id: "seiko-skx007", maker: "Seiko", line: "SKX", model: "SKX007", ref: "SKX007", reason: "Must have in collection because of history", capture: "text", dial: ["diver", "#121212"], urls: [], raw: "Seiko SKX007 (Must have in collection because of history)" },
    { id: "seiko-tictac", maker: "Seiko", collab: "TiCTAC", line: "5 Sports", model: "TiCTAC 35th Anniversary", ref: "SZSB006", capture: "text", dial: ["diver", "#16181b"], urls: [], raw: "Seiko TiCTAC SZSB006 35th Anniversary" },
    { id: "seiko-ssb479", maker: "Seiko", line: "—", model: null, ref: "SSB479", capture: "text", dial: ["chrono", "#2a2c30"], urls: [], raw: "Seiko SSB479" },
    { id: "seiko-ssc813", maker: "Seiko", line: "Prospex", model: "Speedtimer Solar Chronograph", ref: "SSC813", capture: "text", dial: ["chrono", "#e8e4da"], urls: [], raw: "Seiko Speedtimer Solar Chronograph SSC813" },
    { id: "seiko-sfj001", maker: "Seiko", line: "—", model: null, ref: "SFJ001", capture: "text", dial: ["chrono", "#e6e2d7"], urls: [], raw: "Seiko SFJ001" },
    { id: "seiko-ssc961", maker: "Seiko", line: "—", model: null, ref: "SSC961", capture: "text", dial: ["chrono", "#1d2430"], urls: [], raw: "Seiko SSC961" },
    { id: "seiko-ssc963", maker: "Seiko", line: "—", model: null, ref: "SSC963", capture: "text", dial: ["chrono", "#2b3a2e"], urls: [], raw: "Seiko SSC963" },
    { id: "seiko-ssc965", maker: "Seiko", line: "—", model: null, ref: "SSC965", capture: "text", dial: ["chrono", "#e2ddd0"], urls: [], raw: "Seiko SSC965" },
    { id: "seiko-srpl53", maker: "Seiko", line: "Prospex", model: "Prospex", ref: "SRPL53", region: "Middle East site", dial: ["diver", "#1f3b3b"], urls: ["https://www.seikowatches.com/middleeast-en/products/prospex/srpl53"] },
    { id: "seiko-srpk99", maker: "Seiko", line: "—", model: null, ref: "SRPK99", capture: "partial", dial: ["sport", "#2e3036"], urls: ["https://seikousa.com/collections/all/products/srpk99"] },
    { id: "seiko-srpd61", maker: "Seiko", line: "5 Sports", model: "5 Sports", ref: "SRPD61", variant: "Green dial", dial: ["diver", "#2b4a2e"], urls: ["https://www.jomashop.com/seiko-seiko-5-sports-green-dial-mens-watch-srpd61.html"] },
    { id: "seiko-srpd57", maker: "Seiko", line: "5 Sports", model: "5 Sports", ref: "SRPD57K1", dial: ["diver", "#202020"], urls: ["https://www.jomashop.com/seiko-seiko-5-sports-watch-srpd57k1.html"] },
    { id: "seiko-srpb43", maker: "Seiko", line: "Presage", model: "Presage Cocktail Time", ref: "SRPB43", dial: ["dress", "#1f4a8a"], urls: ["https://teddybaldassarre.com/products/presage-cocktail-time-srpb43"] },
    { id: "seiko-spb117", maker: "Seiko", line: "Prospex", model: "Prospex", ref: "SPB117", size: "39.5 mm", variant: "Black, on bracelet", dial: ["diver", "#121212"], urls: ["https://teddybaldassarre.com/products/spb117-prospex-39-5mm-black-on-bracelet"] },
    { id: "seiko-srpe43", maker: "Seiko", line: "Presage", model: "Presage Cocktail Time Automatic", ref: "SRPE43", size: "38.5 mm", variant: "Blue, on strap", dial: ["dress", "#1f3f7a"], urls: ["https://teddybaldassarre.com/products/srpe43-presage-cocktail-time-automatic-38-5mm-blue-on-strap"] },

    // Grand Seiko
    { id: "gs-sbgw301", maker: "Grand Seiko", line: "Elegance", model: "Manual Wind", ref: "SBGW301", size: "37 mm", saves: 4, cleaned: true, dial: ["dress", "#e5dbc9"], urls: ["https://grandseikoboutique.us/products/watch-manual-wind-37mm-sbgw301", "https://www.grand-seiko.com/sg-en/collections/sbgw301g"] },
    { id: "gs-sbga413", maker: "Grand Seiko", line: "Heritage", model: "SBGA413", ref: "SBGA413", saves: 2, dial: ["dress", "#e6cfcf"], urls: ["https://teddybaldassarre.com/products/sbga413", "https://www.grand-seiko.com/sg-en/collections/sbga413g"] },
    { id: "gs-sbge285", maker: "Grand Seiko", line: "—", model: null, ref: "SBGE285", capture: "partial", dial: ["gmt", "#1a2a3a"], urls: ["https://teddybaldassarre.com/products/sbge285"] },
    { id: "gs-sbgr251", maker: "Grand Seiko", line: "—", model: null, ref: "SBGR251", region: "Singapore site", capture: "partial", dial: ["dress", "#dfe3e6"], urls: ["https://www.grand-seiko.com/sg-en/collections/sbgr251g"] },
    { id: "gs-sbge227", maker: "Grand Seiko", line: "—", model: null, ref: "SBGE227", region: "Singapore site", capture: "partial", dial: ["gmt", "#1b3b5a"], urls: ["https://www.grand-seiko.com/sg-en/collections/sbge227g"] },
    { id: "gs-sbgy007", maker: "Grand Seiko", line: "—", model: null, ref: "SBGY007", region: "Singapore site", capture: "partial", dial: ["dress", "#e8edf1"], urls: ["https://www.grand-seiko.com/sg-en/collections/sbgy007g"] },
    { id: "gs-sbgz003", maker: "Grand Seiko", line: "—", model: null, ref: "SBGZ003", region: "Singapore site", capture: "partial", dial: ["dress", "#e7ecef"], urls: ["https://www.grand-seiko.com/sg-en/collections/sbgz003j"] },
    { id: "gs-sbgd201", maker: "Grand Seiko", line: "—", model: null, ref: "SBGD201", region: "Singapore site", capture: "partial", dial: ["dress-pr", "#efefee"], urls: ["https://www.grand-seiko.com/sg-en/collections/sbgd201j"] },
    { id: "gs-slgb001", maker: "Grand Seiko", line: "—", model: null, ref: "SLGB001", region: "Singapore site", capture: "partial", dial: ["dress", "#dfe6ea"], urls: ["https://www.grand-seiko.com/sg-en/collections/slgb001j"] },
    { id: "gs-sbga211", maker: "Grand Seiko", line: "—", model: null, ref: "SBGA211", region: "Singapore site", capture: "partial", dial: ["dress-pr", "#f1f3f4"], urls: ["https://www.grand-seiko.com/sg-en/collections/sbga211g"] },

    // Citizen
    { id: "citizen-zenshin-80m", maker: "Citizen", line: "Zenshin", model: "Zenshin Mechanical Automatic", ref: "NJ0180-80M", siblingOf: "citizen-zenshin-80x", dial: ["integrated", "#2a2d31"], urls: ["https://www.jomashop.com/citizen-zenshin-mechanical-automatic-mens-watch-nj0180-80m.html"] },
    { id: "citizen-zenshin-aw", maker: "Citizen", line: "Zenshin", model: "Zenshin Three-Hand", ref: "AW0130-85X", variant: "Green dial", siblingOf: "citizen-zenshin-80x", dial: ["integrated", "#24503f"], urls: ["https://www.jomashop.com/citizen-zenshin-three-hand-green-dial-mens-watch-aw0130-85x.html"] },
    { id: "citizen-bj7150", maker: "Citizen", line: "—", model: null, ref: "BJ7150-09L", capture: "partial", dial: ["field", "#1f3459"], urls: ["https://www.citizenwatch.com/us/en/product/BJ7150-09L.html"] },
    { id: "citizen-series8", maker: "Citizen", line: "Series 8", model: "Series 8 831 Automatic", ref: "NB6051-59L", dial: ["sport", "#1d3a6a"], urls: ["https://www.jomashop.com/citizen-series8-831-automatic-mens-watch-nb6051-59l.html"] },

    // G-Shock
    { id: "gshock-dw5600e", maker: "Casio", line: "G-Shock", model: "G-Shock", ref: "DW5600E", dial: ["digital", "#121212"], urls: ["https://www.amazon.com/Casio-G-shock-DW5600E"] },
    { id: "gshock-gwm5610", maker: "Casio", line: "G-Shock", model: "G-Shock", ref: "GWM5610-1", dial: ["digital", "#121212"], urls: ["https://www.amazon.com/Casio-G-Shock-GWM5610-1-"] },
    { id: "gshock-gw6900", maker: "Casio", line: "G-Shock", model: "G-Shock Tough Solar", ref: "GW6900-1", capture: "repaired", dial: ["digital", "#151515"], urls: ["https://www.amazon.com/Casio-G-Shock-GW6900-1-Tough-Solar/dp/B0ref=sr_1_10?"] },
    { id: "gshock-unknown", maker: "Casio", line: "G-Shock", model: "G-Shock Quartz Resin", level: "model", capture: "broken", dial: ["digital", "#151515"], urls: ["https://www.amazon.com/Casio-G-Shock-Quartz-Resin-Watch/"] },

    // Frederique Constant
    { id: "fc-310", maker: "Frederique Constant", line: "—", model: null, ref: "FC-310MC5B6", capture: "partial", dial: ["dress", "#e8e3d7"], urls: ["https://us.frederiqueconstant.com/product/FC-310MC5B6.html"] },
    { id: "fc-335", maker: "Frederique Constant", line: "—", model: null, ref: "FC-335MC4P6", capture: "partial", dial: ["dress-ss", "#1f2c46"], urls: ["https://us.frederiqueconstant.com/product/FC-335MC4P6.html"] },
    { id: "fc-270", maker: "Frederique Constant", line: "—", model: null, ref: "FC-270SW4P26", capture: "partial", dial: ["dress", "#ece8df"], urls: ["https://us.frederiqueconstant.com/product/FC-270SW4P26.html"] },

    // Doxa
    { id: "doxa-searambler", maker: "Doxa", line: "Sub", model: "SUB 300 Searambler", dial: ["diver", "#d6d6d2"], urls: ["https://doxawatches.com/products/sub-300-searambler"] },

    // Blancpain × Swatch
    { id: "swatch-scuba-green", maker: "Swatch", collab: "Blancpain", line: "Scuba Fifty Fathoms", model: "Scuba Fifty Fathoms Green Abyss", dial: ["diver", "#1e4a3a"], urls: ["https://www.swatch.com/en-us/bioceramic-scuba-fifty-fathoms/green-abyss.html"] },
    { id: "swatch-scuba-antarctic", maker: "Swatch", collab: "Blancpain", line: "Scuba Fifty Fathoms", model: "Scuba Fifty Fathoms Antarctic Ocean", dial: ["diver", "#e6ebee"], urls: ["https://www.swatch.com/en-us/bioceramic-scuba-fifty-fathoms/antarctic-ocean.html"] },

    // Baltic
    { id: "baltic-aquascaphe", maker: "Baltic", line: "Aquascaphe", model: "Aquascaphe MK2", variant: "Warm silver", dial: ["diver", "#d9d2c3"], urls: ["https://baltic-watches.com/en/products/aquascaphe-mk2-warm-silver"] },
    { id: "baltic-mr-classic-salmon", maker: "Baltic", line: "MR", model: "MR Classic", variant: "Salmon", dial: ["sector", "#e2b39b"], urls: ["https://baltic-watches.com/en/products/mr-classic-salmon"] },
    { id: "baltic-mr-classic-silver", maker: "Baltic", line: "MR", model: "MR Classic", variant: "Silver", dial: ["sector", "#dcdcd6"], urls: ["https://baltic-watches.com/en/products/mr-classic-silver"] },
    { id: "baltic-mr-roulette-salmon", maker: "Baltic", line: "MR", model: "MR Roulette", variant: "Salmon", dial: ["roulette", "#e2b39b"], urls: ["https://baltic-watches.com/en/products/mr-roulette-salmon"] },
    { id: "baltic-mr-roulette-silver", maker: "Baltic", line: "MR", model: "MR Roulette", variant: "Silver", dial: ["roulette", "#dcdcd6"], urls: ["https://baltic-watches.com/en/products/mr-roulette-silver"] },
    { id: "baltic-hms002", maker: "Baltic", line: "HMS", model: "HMS 002", variant: "Black", store: "Clicky Bezel", dial: ["field", "#131313"], urls: ["https://clickybezel.square.site/product/baltic-hms-002-black"] },

    // Laco
    { id: "laco-aachen", maker: "Laco", line: "Pilot Basic", model: "Pilot Watch Basic Aachen", size: "39 mm", saves: 2, cleaned: true, dial: ["pilot", "#141414"], urls: ["https://teddybaldassarre.com/products/pilot-watch-basic-aachen", "https://www.chrono24.com/laco/laco-aachen-39--id40804788.htm"] },

    // Independents
    { id: "sanmartin-sn0150", maker: "San Martin", line: "—", model: null, ref: "SN0150-G1", capture: "partial", dial: ["diver", "#263a2c"], urls: ["https://sanmartinwatches.com/shop/new-arrivals/sn0150-g1/"] },
    { id: "xeric-halograph", maker: "Xeric", line: "Halograph", model: "Halograph III Chrono", ref: "HC3-1193-11L", variant: "Caution Yellow", dial: ["chrono", "#e2bd3a"], urls: ["https://www.xeric.com/products/halograph-iii-chrono-caution-yellow-hc3-1193-11l"] },
    { id: "avi8-cvrt", maker: "AVI-8", line: "—", model: null, level: "brand", capture: "broken", dial: ["unknown", "#2a2a2a"], urls: ["https://avi-8.com/products/cvrt-"] },
    { id: "kiwami-brand", maker: "Kiwame Tokyo", line: "—", model: null, level: "brand", capture: "brand", dial: ["unknown", "#2a2a2a"], urls: ["https://kiwametokyo.com/en/collections"], raw: "Kiwami Tokyo Asakusa" },
    { id: "nivada-antarctic", maker: "Nivada Grenchen", line: "Antarctic", model: "Super Antarctic", store: "Clicky Bezel", dial: ["field", "#151515"], urls: ["https://clickybezel.square.site/product/nivada-grenchen-super-antarctic"] },
    { id: "jackmason-gmt", maker: "Jack Mason", line: "Stratotimer", model: "Stratotimer GMT", dial: ["gmt", "#1d2a3a"], urls: ["https://jackmasonbrand.com/products/stratotimer-gmt-1"] },
    { id: "vaer-rs1", maker: "Vaer", line: "RS1", model: "RS1 Rally Chronograph", variant: "Panda", size: "40 mm", cleaned: true, dial: ["chrono-panda", "#ecebe6"], urls: ["https://www.vaerwatches.com/products/rs1-rally-chronograph-panda-40mm"] },
  ],

  // Milestones are personal; they live in personal.js (gitignored).
  milestones: [],

  // source: "note" = you wrote it that way; "suggested" = inferred from variants, awaiting your confirmation.
  decisions: [
    { id: "d-nomos", name: "Tangente: which size", source: "note", status: "open", candidates: ["nomos-164", "nomos-139"], note: "“Depending on size” — try both on the wrist." },
    { id: "d-speedmaster", name: "First Speedmaster", source: "suggested", status: "open", candidates: ["omega-moonwatch", "omega-speedy-mk2", "swatch-mttm"], note: "Moonwatch saved 3× with the same link. Which versions did you mean?" },
    { id: "d-deville", name: "De Ville Prestige: which complication", source: "suggested", status: "open", candidates: ["omega-deville-pr", "omega-deville-ss"] },
    { id: "d-zulu", name: "Zulu Time: which one", source: "suggested", status: "open", candidates: ["longines-zulu-636", "longines-zulu-506", "longines-zulu-hodinkee"] },
    { id: "d-tank", name: "Tank Must: which reference", source: "suggested", status: "open", candidates: ["cartier-tank-0106", "cartier-tank-0136", "cartier-tank-0137"] },
    { id: "d-baltic-mr", name: "Baltic MR: Classic or Roulette", source: "suggested", status: "open", candidates: ["baltic-mr-classic-salmon", "baltic-mr-classic-silver", "baltic-mr-roulette-salmon", "baltic-mr-roulette-silver"] },
    { id: "d-iwc-pilot", name: "IWC Pilot: which dial", source: "suggested", status: "open", candidates: ["iwc-pilot-01", "iwc-pilot-02"] },
    { id: "d-portofino", name: "Portofino: which dial", source: "suggested", status: "open", candidates: ["iwc-portofino-01", "iwc-portofino-17"] },
    { id: "d-khaki", name: "Khaki Field: which one", source: "suggested", status: "open", candidates: ["hamilton-murph-38", "hamilton-murph-auto", "hamilton-field-pr", "hamilton-field-mech-black", "hamilton-field-auto"] },
    { id: "d-zenshin2", name: "Another Zenshin?", source: "suggested", status: "open", candidates: ["citizen-zenshin-80m", "citizen-zenshin-aw"], note: "Siblings of a watch you already own." },
    { id: "d-eline", name: "1983 E-Line: bracelet or leather", source: "suggested", status: "open", candidates: ["timex-eline-ss", "timex-eline-leather"] },
    { id: "d-scuba", name: "Scuba Fifty Fathoms: which colour", source: "suggested", status: "open", candidates: ["swatch-scuba-green", "swatch-scuba-antarctic"] },
  ],

  // What the importer did with the raw note, line by line, where something needed handling.
  inbox: [
    { kind: "variant", title: "Variant lost: Speedmaster Moonwatch", detail: "Same URL saved 3 times. Omega URLs don't change when you pick crystal or strap, so the note can't tell which versions you meant.", target: "omega-moonwatch" },
    { kind: "variant", title: "Variant lost: De Ville Prestige ×4", detail: "Two URLs, each saved twice. Probably different dials or straps.", target: "omega-deville-pr" },
    { kind: "variant", title: "Variant lost: Aqua Terra 41", detail: "Same URL saved twice.", target: "omega-aqua-terra-41" },
    { kind: "variant", title: "Variant lost: Black Bay 58", detail: "Same URL saved twice.", target: "tudor-bb58" },
    { kind: "matched", title: "Matched to your collection: Orient Bambino", detail: "“…/orient-bambino/ra” was cut off, but it was ticked. Linked to the RA-AP0101B30B you own.", target: "orient-bambino-v2" },
    { kind: "matched", title: "Ticked items moved to Collection", detail: "SRPK91 and Zenshin NJ0180-80X were ticked in the want list. They now live in Collection.", target: "seiko-srpk91" },
    { kind: "duplicate", title: "Merged: Grand Seiko SBGW301", detail: "4 links across 3 sites (2 identical) became 1 watch with 2 listings.", target: "gs-sbgw301" },
    { kind: "duplicate", title: "Merged: Orient RA-AC0Q03S30B", detail: "Same link saved twice.", target: "orient-ac0q03s" },
    { kind: "duplicate", title: "Merged: Timex World Time Reissue", detail: "Two slugs for the same 39 mm leather watch.", target: "timex-worldtime" },
    { kind: "duplicate", title: "Merged: Marlin Jet Automatic", detail: "Plain link + tracking link → one watch, reference TW2V72300 recovered.", target: "timex-marlin-jet" },
    { kind: "duplicate", title: "Merged: SBGA413, Heritage 1938, Laco Aachen", detail: "Same watch from two stores each → one watch, two listings.", target: "gs-sbga413" },
    { kind: "cleaned", title: "Tracking removed from 8 links", detail: "Google Ads, Klaviyo, Meta, newsletter and session parameters stripped (one Vaer link carried ~600 characters of them).", target: "vaer-rs1" },
    { kind: "repaired", title: "Recovered from a cut-off link: Peanuts × Timex", detail: "The slug ends in a dash, but “Marlin Chronograph Joe Cool 40mm” is readable.", target: "timex-peanuts" },
    { kind: "repaired", title: "Recovered from a broken Amazon link: GW6900-1", detail: "“dp/B0ref=” is not a product ID, but the reference is in the slug.", target: "gshock-gw6900" },
    { kind: "broken", title: "Needs you: G-Shock “Quartz Resin Watch”", detail: "No reference, no product ID. Which G-Shock?", target: "gshock-unknown" },
    { kind: "broken", title: "Needs you: AVI-8 “cvrt-”", detail: "Link cut off mid-name. Saved as brand only.", target: "avi8-cvrt" },
    { kind: "broken", title: "Needs you: Timex Atelier", detail: "“timex-atelier-” is cut off. Nothing to recover.", raw: "https://timex.com/products/timex-atelier-" },
    { kind: "brand", title: "Brand only: Oris", detail: "Homepage link, no model. Kept as a brand-level candidate.", target: "oris-brand" },
    { kind: "brand", title: "Brand only: Kiwame Tokyo", detail: "Collection page, written “Kiwami Tokyo Asakusa” in the note.", target: "kiwami-brand" },
    { kind: "brand", title: "Brand only: Timex × Todd Snyder", detail: "Collab page, not a single watch.", target: "timex-todd-snyder" },
    { kind: "brand", title: "Brand only: Tissot homepage", detail: "“tissotwatches.com/en-us” — a bookmark, not a watch.", raw: "https://www.tissotwatches.com/en-us" },
    { kind: "article", title: "Article, not a product: Gear Patrol", detail: "Timex 1976 Lexington Reissue taken from the article's slug.", target: "timex-lexington" },
    { kind: "empty", title: "Empty line under Xeric", detail: "An unchecked box with nothing in it. Ignored." },
    { kind: "partial", title: "Reference found, model name not in URL: 27 watches", detail: "Tissot, Orient, Grand Seiko, Frederique Constant and others. Fields left blank, never guessed." },
  ],
};
