// Author: Matija Podravec, 2012.

if (!mpagespace.model.colors) mpagespace.model.colors = {};
else if (typeof mpagespace.model.colors != 'object')
  throw new Error('mpagespace.model.colors already exists and is not an object'); 

mpagespace.model.colors = function(config, model) {
  this.model = model;
  this.config = mpagespace.extend({dark: {}, light: {}}, config);
  this.dirty = false;
}

mpagespace.model.colors.prototype = {
  getConfig: function() {
    return mpagespace.extend({}, this.config);  
  },

  getSchemeNames: function(type) {
    var result = [];
    var name, f = true;

    for (name in this.schemes[type]) {
      result.push(name);
    }
    result.sort();
      
    for (name in this.config[type]) {
      if (f) {
        result.unshift('-');
        f = false;
      }
      result.unshift(name);
    }
    result.unshift('-');
    result.unshift('custom');

    return result;
  },

  getShuffledScheme: function() {
    var h, H, backS, darkL, rangeL, i, minS, maxS, minL, maxL, s, l;
    var colors = [];

    var random = function(start, end) {
      return Math.floor(Math.random() * (end - start)) + start;
    }

    h = random(0, 360);
    H = [];
    for (i=0; i<6; i++) {
      H.push((h + i * 60) % 360);
    }

    backS = random(5, 40);
    darkL = random(0, 10);
    rangeL = 90 - darkL;
    for (i=0; i<8; i++) {
      colors.push(mpagespace.husl.toHex(H[0], backS, darkL + rangeL * Math.pow(i/7, 1.5)));
    }

    minS = random(30, 70);
    maxS = minS + 30;
    minL = random(50, 70);
    maxL = minL + 20;
    for (i=0; i<8; i++) {
      h = H[random(0, 5)];
      s = random(minS, maxS);
      l = random(minL, maxL);
      colors.push(mpagespace.husl.toHex(h, s, l));
    }
    
    return {
      background: colors[1],
      border: colors[4],
      link: colors[8],
      visited: colors[11],
      title: colors[9],
      menu: colors[7],
      menuText: colors[1],
      menuSel: colors[6],
      error: colors[12]
    }
  },

  getScheme: function(type, name) {
    var scheme = this.schemes[type][name];

    if (scheme == null)
      scheme = this.config[type][name];

    for (var n in scheme) {
      if (scheme[n] == 'none')
        delete scheme[n];
    }

    return scheme;  
  },

  addScheme: function(type, name, scheme) {
    this.config[type][name] = scheme;
    this.dirty = true;
    this.model.setDirty();
  },

  removeSchemes: function() {
    this.config = {dark: {}, light: {}};
    this.dirty = true;
    this.model.setDirty();
  },

  schemes: {
  "dark": {
    "Ekvoli": {
      "menuSel": "#3070c0", 
      "link": "#50a0e0", 
      "menu": "#005090", 
      "background": "#001535", 
      "title": "#87c6f0", 
      "menuText": "#ffffff", 
      "visited": "#9590d5", 
      "misc": "none", 
      "border": "#305885"
    }, 
    "FU": {
      "menuSel": "#5fafd7", 
      "link": "#ffd700", 
      "menu": "#303030", 
      "background": "#1c1c1c", 
      "title": "#ffd700", 
      "menuText": "#eeeeee", 
      "visited": "#808080", 
      "misc": "none", 
      "border": "#3a3a3a"
    }, 
    "Midnight": {
      "menuSel": "fg", 
      "link": "#ffa500", 
      "menu": "#4f94cd", 
      "background": "#000029", 
      "title": "#cd96cd", 
      "menuText": "bg", 
      "visited": "#66cd00", 
      "misc": "none", 
      "border": "none"
    }, 
    "Desert256": {
      "menuSel": "none", 
      "link": "none", 
      "menu": "none", 
      "background": "none", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Camo": {
      "menuSel": "#caff70", 
      "link": "#cd5c5c", 
      "menu": "none", 
      "background": "#262626", 
      "title": "#f0e68c", 
      "menuText": "#cdc673", 
      "visited": "#d2b48c", 
      "misc": "none", 
      "border": "#caff70"
    }, 
    "Tango": {
      "menuSel": "#4e9a06", 
      "link": "#75507b", 
      "menu": "#4e9a06", 
      "background": "#000000", 
      "title": "#c4a000", 
      "menuText": "#d3d7cf", 
      "visited": "#06989a", 
      "misc": "none", 
      "border": "#eeeeec"
    }, 
    "Synic": {
      "menuSel": "#a9a9a9", 
      "link": "#daa520", 
      "menu": "#ff00ff", 
      "background": "#000000", 
      "title": "#cdb7b5", 
      "menuText": "none", 
      "visited": "#62c600", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Wombat256": {
      "menuSel": "#cae682", 
      "link": "#e7f6da", 
      "menu": "#444444", 
      "background": "#242424", 
      "title": "#e5786d", 
      "menuText": "#f6f3e8", 
      "visited": "#99968b", 
      "misc": "none", 
      "border": "#444444"
    }, 
    "Dusk": {
      "menuSel": "#bebebe", 
      "link": "#daa520", 
      "menu": "none", 
      "background": "#1f3048", 
      "title": "#cdb7b5", 
      "menuText": "#fffff0", 
      "visited": "#708090", 
      "misc": "none", 
      "border": "#bebebe"
    }, 
    "Zmrok": {
      "menuSel": "#9b703f", 
      "link": "#ffa500", 
      "menu": "#cda869", 
      "background": "#141414", 
      "title": "#cf593c", 
      "menuText": "#141414", 
      "visited": "#888888", 
      "misc": "none", 
      "border": "#202020"
    }, 
    "DwOrange": {
      "menuSel": "#ff3200", 
      "link": "#ffa600", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#ffff00", 
      "menuText": "#ff4400", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Midnight2": {
      "menuSel": "fg", 
      "link": "#ffa500", 
      "menu": "#4f94cd", 
      "background": "#000029", 
      "title": "#cd96cd", 
      "menuText": "bg", 
      "visited": "#66cd00", 
      "misc": "none", 
      "border": "none"
    }, 
    "Gentooish": {
      "menuSel": "#000000", 
      "link": "#ffcd8b", 
      "menu": "#222222", 
      "background": "#191919", 
      "title": "#b8bb00", 
      "menuText": "#cccccc", 
      "visited": "#666666", 
      "misc": "none", 
      "border": "#333333"
    }, 
    "Wuye": {
      "menuSel": "#27408b", 
      "link": "#deb887", 
      "menu": "#00688b", 
      "background": "#141414", 
      "title": "#6495ed", 
      "menuText": "#7cfc00", 
      "visited": "#778899", 
      "misc": "none", 
      "border": "#696969"
    }, 
    "Zendnb": {
      "menuSel": "#002000", 
      "link": "#c0c070", 
      "menu": "#50c050", 
      "background": "#000000", 
      "title": "#d08040", 
      "menuText": "#002000", 
      "visited": "#909040", 
      "misc": "none", 
      "border": "#002000"
    }, 
    "DwBlue": {
      "menuSel": "#0000ff", 
      "link": "#ffffff", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#0000ff", 
      "menuText": "#0000ff", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Sorcerer": {
      "menuSel": "#b1d631", 
      "link": "#719611", 
      "menu": "#444444", 
      "background": "#222222", 
      "title": "#ff9800", 
      "menuText": "#ffffff", 
      "visited": "#707670", 
      "misc": "none", 
      "border": "#404c4c"
    }, 
    "Wombat": {
      "menuSel": "#cae682", 
      "link": "#e7f6da", 
      "menu": "#444444", 
      "background": "#242424", 
      "title": "#e5786d", 
      "menuText": "#f6f3e8", 
      "visited": "#99968b", 
      "misc": "none", 
      "border": "#444444"
    }, 
    "Maroloccio": {
      "menuSel": "#333366", 
      "link": "#3741ad", 
      "menu": "#3741ad", 
      "background": "#1a202a", 
      "title": "#82ade0", 
      "menuText": "#8b9aaa", 
      "visited": "#006666", 
      "misc": "none", 
      "border": "#333366"
    }, 
    "Jellybeans": {
      "menuSel": "none", 
      "link": "none", 
      "menu": "none", 
      "background": "none", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Calmar256-dark": {
      "menuSel": "none", 
      "link": "none", 
      "menu": "none", 
      "background": "none", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "DwGreen": {
      "menuSel": "#008800", 
      "link": "#ffffff", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#00ff00", 
      "menuText": "#00ff00", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Oceanblack": {
      "menuSel": "#e0e0e0", 
      "link": "#999999", 
      "menu": "#006400", 
      "background": "#000000", 
      "title": "#00cdcd", 
      "menuText": "#90ee90", 
      "visited": "#7c7268", 
      "misc": "none", 
      "border": "#999999"
    }, 
    "DwCyan": {
      "menuSel": "#00ffff", 
      "link": "#ffffff", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#00ffff", 
      "menuText": "#00ffff", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "DesertEx": {
      "menuSel": "#bebebe", 
      "link": "#76eec6", 
      "menu": "#445599", 
      "background": "#2b2b2b", 
      "title": "#fa8072", 
      "menuText": "#ffffff", 
      "visited": "#7ccd7c", 
      "misc": "none", 
      "border": "#666666"
    }, 
    "Mizore": {
      "menuSel": "#133293", 
      "link": "#ff40ff", 
      "menu": "#a6a190", 
      "background": "#000000", 
      "title": "#e080ff", 
      "menuText": "#000000", 
      "visited": "#b0b0b0", 
      "misc": "none", 
      "border": "#c2bfa5"
    }, 
    "Leo": {
      "menuSel": "#0000ff", 
      "link": "#ff5fd7", 
      "menu": "#262626", 
      "background": "#121212", 
      "title": "#ffff00", 
      "menuText": "#ffffff", 
      "visited": "#a8a8a8", 
      "misc": "none", 
      "border": "#eeeeee"
    }, 
    "Candycode": {
      "menuSel": "#133293", 
      "link": "#9999aa", 
      "menu": "#a6a190", 
      "background": "#050505", 
      "title": "#ff6050", 
      "menuText": "#000000", 
      "visited": "#ff9922", 
      "misc": "none", 
      "border": "#c2bfa5"
    }, 
    "TIRBlack": {
      "menuSel": "#cae682", 
      "link": "#e18964", 
      "menu": "#444444", 
      "background": "#000000", 
      "title": "#99cc99", 
      "menuText": "#f6f3e8", 
      "visited": "#7c7c7c", 
      "misc": "none", 
      "border": "#202020"
    }, 
    "Northland": {
      "menuSel": "#000000", 
      "link": "#0f8200", 
      "menu": "#8b0000", 
      "background": "#001020", 
      "title": "#035587", 
      "menuText": "#000000", 
      "visited": "#a9a9a9", 
      "misc": "none", 
      "border": "#a9a9a9"
    }, 
    "Fnaqevan": {
      "menuSel": "#1f1f1f", 
      "link": "#b899c8", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#00b8e0", 
      "menuText": "#e8e8e8", 
      "visited": "#006699", 
      "misc": "none", 
      "border": "#1f1f1f"
    }, 
    "Railscasts2": {
      "menuSel": "#a5c261", 
      "link": "#cc7833", 
      "menu": "#444444", 
      "background": "#2b2b2b", 
      "title": "#6d9cbe", 
      "menuText": "#f6f3e8", 
      "visited": "#bc9458", 
      "misc": "none", 
      "border": "none"
    }, 
    "Twilight": {
      "menuSel": "#404040", 
      "link": "none", 
      "menu": "#303030", 
      "background": "none", 
      "title": "none", 
      "menuText": "#605958", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Earendel": {
      "menuSel": "#f3c201", 
      "link": "#d3a901", 
      "menu": "#3d5078", 
      "background": "#303030", 
      "title": "#dc8511", 
      "menuText": "#dadada", 
      "visited": "#77be21", 
      "misc": "none", 
      "border": "#35466a"
    }, 
    "Neverness": {
      "menuSel": "#87ceeb", 
      "link": "#00eeee", 
      "menu": "#4682b4", 
      "background": "#000000", 
      "title": "#87ceeb", 
      "menuText": "#000000", 
      "visited": "#848484", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Rdark": {
      "menuSel": "#ffffff", 
      "link": "#888a85", 
      "menu": "#2e3436", 
      "background": "#1e2426", 
      "title": "#8ae234", 
      "menuText": "#eeeeec", 
      "visited": "#656763", 
      "misc": "none", 
      "border": "#888a85"
    }, 
    "Darkspectrum": {
      "menuSel": "#3465a4", 
      "link": "#e9b96e", 
      "menu": "#000000", 
      "background": "#2a2a2a", 
      "title": "#ef5939", 
      "menuText": "#c0c0c0", 
      "visited": "#8a8a8a", 
      "misc": "none", 
      "border": "#3c3c3c"
    }, 
    "Manxome": {
      "menuSel": "#0000ff", 
      "link": "#ffffff", 
      "menu": "#00aaaa", 
      "background": "#000000", 
      "title": "#00ffff", 
      "menuText": "#ffffff", 
      "visited": "#00ff00", 
      "misc": "none", 
      "border": "none"
    }, 
    "Vimhut": {
      "menuSel": "#999999", 
      "link": "#b898ee", 
      "menu": "#131313", 
      "background": "#333333", 
      "title": "#eb78eb", 
      "menuText": "#b0b0b0", 
      "visited": "#58a9de", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Xoria256": {
      "menuSel": "#767676", 
      "link": "#df8787", 
      "menu": "#bcbcbc", 
      "background": "#1c1c1c", 
      "title": "#ffffaf", 
      "menuText": "#000000", 
      "visited": "#808080", 
      "misc": "none", 
      "border": "#3a3a3a"
    }, 
    "DwPurple": {
      "menuSel": "#ff00ff", 
      "link": "#ffffff", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#ff00ff", 
      "menuText": "#ff00ff", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Asu1dark": {
      "menuSel": "#336600", 
      "link": "#00ffff", 
      "menu": "#ffffff", 
      "background": "#110022", 
      "title": "#ff9900", 
      "menuText": "#0000ff", 
      "visited": "#99cc99", 
      "misc": "none", 
      "border": "#666666"
    }, 
    "Kellys": {
      "menuSel": "#62acce", 
      "link": "#9ab2c8", 
      "menu": "#9ab2c8", 
      "background": "#2a2b2f", 
      "title": "#d1c79e", 
      "menuText": "#2a2b2f", 
      "visited": "#67686b", 
      "misc": "none", 
      "border": "#e1e0e5"
    }, 
    "Freya": {
      "menuSel": "#c0aa94", 
      "link": "#d4b064", 
      "menu": "#a78869", 
      "background": "#2a2a2a", 
      "title": "#afe091", 
      "menuText": "#000000", 
      "visited": "#c2b680", 
      "misc": "none", 
      "border": "#564d43"
    }, 
    "Herald": {
      "menuSel": "#f17a00", 
      "link": "#ffee68", 
      "menu": "#140100", 
      "background": "#1f1f1f", 
      "title": "#6df584", 
      "menuText": "#660300", 
      "visited": "#696567", 
      "misc": "none", 
      "border": "#1f1f1f"
    }, 
    "Blackbeauty": {
      "menuSel": "none", 
      "link": "#ffa500", 
      "menu": "#0000ff", 
      "background": "#000000", 
      "title": "#ffa0a0", 
      "menuText": "#ffffff", 
      "visited": "#80a0ff", 
      "misc": "none", 
      "border": "none"
    }, 
    "Colorer": {
      "menuSel": "#bebebe", 
      "link": "#ff0000", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#ffffff", 
      "menuText": "#008b8b", 
      "visited": "#b46918", 
      "misc": "none", 
      "border": "none"
    }, 
    "Vibrantink": {
      "menuSel": "none", 
      "link": "#ff6600", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#ffee98", 
      "menuText": "none", 
      "visited": "#9933cc", 
      "misc": "none", 
      "border": "none"
    }, 
    "Candy": {
      "menuSel": "#c8c8d8", 
      "link": "#e0e080", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#90d0ff", 
      "menuText": "#40f0d0", 
      "visited": "#c0c0d0", 
      "misc": "none", 
      "border": "#c8c8d8"
    }, 
    "DwYellow": {
      "menuSel": "#ffff00", 
      "link": "#ffffff", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#ffff00", 
      "menuText": "#ffff00", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Wombat256mod": {
      "menuSel": "#cae982", 
      "link": "#eadead", 
      "menu": "#444444", 
      "background": "#242424", 
      "title": "#e5786d", 
      "menuText": "#ffffd7", 
      "visited": "#9c998e", 
      "misc": "none", 
      "border": "#444444"
    }, 
    "Fruity": {
      "menuSel": "#8090a0", 
      "link": "#fd8900", 
      "menu": "#cb2f27", 
      "background": "#111111", 
      "title": "#0086d2", 
      "menuText": "#ffffff", 
      "visited": "#00d2ff", 
      "misc": "none", 
      "border": "#a0b0c0"
    }, 
    "Moria": {
      "menuSel": "#ffff00", 
      "link": "#912f11", 
      "menu": "#708bc5", 
      "background": "#ffffff", 
      "title": "#077807", 
      "menuText": "#000000", 
      "visited": "#786000", 
      "misc": "none", 
      "border": "#a6b7db"
    }, 
    "Matrix": {
      "menuSel": "#339933", 
      "link": "#44cc44", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#55ff55", 
      "menuText": "#44cc44", 
      "visited": "#226622", 
      "misc": "none", 
      "border": "#339933"
    }, 
    "Manuscript": {
      "menuSel": "#808080", 
      "link": "#cfbfaf", 
      "menu": "#494949", 
      "background": "#242424", 
      "title": "#cea3ce", 
      "menuText": "#e0e0e0", 
      "visited": "#7f9f7f", 
      "misc": "none", 
      "border": "#c2bfa5"
    }, 
    "Metacosm": {
      "menuSel": "#00ff00", 
      "link": "#ffa500", 
      "menu": "#333333", 
      "background": "#000000", 
      "title": "#ffa0a0", 
      "menuText": "#ffffff", 
      "visited": "#80a0ff", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Zenburn": {
      "menuSel": "#242424", 
      "link": "#cfbfaf", 
      "menu": "#2c2e2e", 
      "background": "#3f3f3f", 
      "title": "#dca3a3", 
      "menuText": "#9f9f9f", 
      "visited": "#7f9f7f", 
      "misc": "none", 
      "border": "#688060"
    }, 
    "Neon": {
      "menuSel": "#c4c4c4", 
      "link": "#ffc890", 
      "menu": "none", 
      "background": "#303030", 
      "title": "#92d4ff", 
      "menuText": "#a0d0ff", 
      "visited": "#c0c0c0", 
      "misc": "none", 
      "border": "#c4c4c4"
    }, 
    "Golden": {
      "menuSel": "none", 
      "link": "#ffa500", 
      "menu": "#ddbb00", 
      "background": "#000000", 
      "title": "#ff0000", 
      "menuText": "#000000", 
      "visited": "#978345", 
      "misc": "none", 
      "border": "#978345"
    }, 
    "Inkpot": {
      "menuSel": "#2e2e3f", 
      "link": "#c080d0", 
      "menu": "#4e4e8f", 
      "background": "#000000", 
      "title": "#ffcd8b", 
      "menuText": "#eeeeee", 
      "visited": "#cd8b00", 
      "misc": "none", 
      "border": "#3e3e5e"
    }, 
    "Lettuce": {
      "menuSel": "#005f87", 
      "link": "#5fffff", 
      "menu": "#00005f", 
      "background": "#080808", 
      "title": "#ffaf5f", 
      "menuText": "#87ffaf", 
      "visited": "#af8787", 
      "misc": "none", 
      "border": "#303030"
    }, 
    "Adrian": {
      "menuSel": "#a9a9a9", 
      "link": "#ffa500", 
      "menu": "#b3b3b3", 
      "background": "#000000", 
      "title": "#ffa0a0", 
      "menuText": "#000000", 
      "visited": "#d1ddff", 
      "misc": "none", 
      "border": "none"
    }, 
    "LiquidCarbon": {
      "menuSel": "#0000ff", 
      "link": "#7f9f44", 
      "menu": "#c0c8cf", 
      "background": "#303030", 
      "title": "#cdad00", 
      "menuText": "#0000ff", 
      "visited": "#809090", 
      "misc": "none", 
      "border": "#445566"
    }, 
    "Molokai": {
      "menuSel": "#808080", 
      "link": "#66d9ef", 
      "menu": "#000000", 
      "background": "#1b1d1e", 
      "title": "#ae81ff", 
      "menuText": "#66d9ef", 
      "visited": "#465457", 
      "misc": "none", 
      "border": "#080808"
    }, 
    "Luinnar": {
      "menuSel": "#133293", 
      "link": "#ffff00", 
      "menu": "#a6a190", 
      "background": "#000000", 
      "title": "#00ff20", 
      "menuText": "#000000", 
      "visited": "#b0b010", 
      "misc": "none", 
      "border": "#c2bfa5"
    }, 
    "Two2Tango": {
      "menuSel": "none", 
      "link": "#d3d7cf", 
      "menu": "none", 
      "background": "#2e3436", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Dejavu": {
      "menuSel": "#000025", 
      "link": "#3bc4ec", 
      "menu": "#23d1de", 
      "background": "#000025", 
      "title": "#68b8fd", 
      "menuText": "bg", 
      "visited": "#13c1d5", 
      "misc": "none", 
      "border": "#101060"
    }, 
    "DwRed": {
      "menuSel": "#ff0000", 
      "link": "#ffffff", 
      "menu": "none", 
      "background": "#000000", 
      "title": "#ff0000", 
      "menuText": "#ff0000", 
      "visited": "#696969", 
      "misc": "none", 
      "border": "#000000"
    }, 
    "Tango2": {
      "menuSel": "none", 
      "link": "#5eafe5", 
      "menu": "none", 
      "background": "#2e3436", 
      "title": "#8ae234", 
      "menuText": "none", 
      "visited": "#6d7e8a", 
      "misc": "none", 
      "border": "none"
    }
  }, 
  "light": {
    "Impact": {
      "menuSel": "none", 
      "link": "none", 
      "menu": "none", 
      "background": "none", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Silent": {
      "menuSel": "#f1ffc1", 
      "link": "#000000", 
      "menu": "#dddddd", 
      "background": "#ffffff", 
      "title": "#006e26", 
      "menuText": "#000000", 
      "visited": "#888786", 
      "misc": "none", 
      "border": "#f1ffc1"
    }, 
    "Habilight": {
      "menuSel": "#ffa500", 
      "link": "#ee0000", 
      "menu": "#bddfff", 
      "background": "#f9f5f9", 
      "title": "#b91f49", 
      "menuText": "#000000", 
      "visited": "#008b8b", 
      "misc": "none", 
      "border": "#56a0ee"
    }, 
    "Autumnleaf": {
      "menuSel": "#ffeebb", 
      "link": "#000000", 
      "menu": "none", 
      "background": "#fffdfa", 
      "title": "#003399", 
      "menuText": "#003399", 
      "visited": "#002200", 
      "misc": "none", 
      "border": "#aa8866"
    }, 
    "Autumn2": {
      "menuSel": "#ddd9b8", 
      "link": "#008b8b", 
      "menu": "#aaccaa", 
      "background": "#f0f2f0", 
      "title": "#bb6666", 
      "menuText": "#007700", 
      "visited": "#ccaaaa", 
      "misc": "none", 
      "border": "#a9a9a9"
    }, 
    "Greyhouse": {
      "menuSel": "#cccccc", 
      "link": "#9c6911", 
      "menu": "#666666", 
      "background": "#d3d3d3", 
      "title": "#400080", 
      "menuText": "bg", 
      "visited": "#205e50", 
      "misc": "none", 
      "border": "#999999"
    }, 
    "Imperial": {
      "menuSel": "#004080", 
      "link": "#800080", 
      "menu": "#acacac", 
      "background": "#cccccc", 
      "title": "#007000", 
      "menuText": "#002060", 
      "visited": "#606000", 
      "misc": "none", 
      "border": "#333333"
    }, 
    "TAqua": {
      "menuSel": "#0e8ed3", 
      "link": "#0e8ed3", 
      "menu": "#1679f9", 
      "background": "#ffffff", 
      "title": "#0384f6", 
      "menuText": "#ffffff", 
      "visited": "#0e8ed3", 
      "misc": "none", 
      "border": "#0e8ed3"
    }, 
    "Fog": {
      "menuSel": "none", 
      "link": "#aa8822", 
      "menu": "fg", 
      "background": "#cccccc", 
      "title": "#7070a0", 
      "menuText": "#a9a9a9", 
      "visited": "#444499", 
      "misc": "none", 
      "border": "none"
    }, 
    "Nuvola": {
      "menuSel": "none", 
      "link": "#ee0000", 
      "menu": "none", 
      "background": "#f9f5f9", 
      "title": "#b91f49", 
      "menuText": "#0070ff", 
      "visited": "#3f6b5b", 
      "misc": "none", 
      "border": "#56a0ee"
    }, 
    "Tolerable": {
      "menuSel": "#333333", 
      "link": "#ff0000", 
      "menu": "#00ff00", 
      "background": "#ffffff", 
      "title": "#8b0000", 
      "menuText": "#000000", 
      "visited": "#555555", 
      "misc": "none", 
      "border": "#333333"
    }, 
    "Winter": {
      "menuSel": "#707070", 
      "link": "#a000a0", 
      "menu": "#000080", 
      "background": "#d4d0c8", 
      "title": "#a000a0", 
      "menuText": "#ffffff", 
      "visited": "#008000", 
      "misc": "none", 
      "border": "#909090"
    }, 
    "Autumn": {
      "menuSel": "#904838", 
      "link": "#8040f0", 
      "menu": "none", 
      "background": "#fff4e8", 
      "title": "#00884c", 
      "menuText": "#d06000", 
      "visited": "#ff5050", 
      "misc": "none", 
      "border": "#904838"
    }, 
    "Zenesque": {
      "menuSel": "#9b601a", 
      "link": "#a7a863", 
      "menu": "#3f3f3f", 
      "background": "#0f1216", 
      "title": "#8d5c57", 
      "menuText": "#656565", 
      "visited": "#777777", 
      "misc": "none", 
      "border": "#222222"
    }, 
    "Pyte": {
      "menuSel": "#8090a0", 
      "link": "#70a0d0", 
      "menu": "#808080", 
      "background": "#f0f0f0", 
      "title": "#a07040", 
      "menuText": "#ffffff", 
      "visited": "#a0b0c0", 
      "misc": "none", 
      "border": "#a0b0c0"
    }, 
    "Fruit": {
      "menuSel": "#404040", 
      "link": "#4a9400", 
      "menu": "none", 
      "background": "#f8f8f8", 
      "title": "#8016ff", 
      "menuText": "#ff4080", 
      "visited": "#ff4080", 
      "misc": "none", 
      "border": "#404040"
    }, 
    "Fine_blue": {
      "menuSel": "#404054", 
      "link": "#005858", 
      "menu": "none", 
      "background": "#f8f8f8", 
      "title": "#2020ff", 
      "menuText": "#0070ff", 
      "visited": "#ff00c0", 
      "misc": "none", 
      "border": "#404054"
    }, 
    "MickeySoft": {
      "menuSel": "#316ac5", 
      "link": "#000080", 
      "menu": "#ece9d8", 
      "background": "#ffffff", 
      "title": "#008080", 
      "menuText": "#000000", 
      "visited": "#007000", 
      "misc": "none", 
      "border": "#d4d0c8"
    }, 
    "Ironman": {
      "menuSel": "#ffa500", 
      "link": "#0000ff", 
      "menu": "#bddfff", 
      "background": "#f0f0f0", 
      "title": "none", 
      "menuText": "#000000", 
      "visited": "#a0b0c0", 
      "misc": "none", 
      "border": "#a0b0c0"
    }, 
    "MayanSmoke": {
      "menuSel": "#8b795e", 
      "link": "#6e8b3d", 
      "menu": "#cdcdb4", 
      "background": "#f4f4e8", 
      "title": "#ff8c00", 
      "menuText": "#8b5a00", 
      "visited": "#96aac2", 
      "misc": "none", 
      "border": "#99aabb"
    }, 
    "Scame": {
      "menuSel": "#b4eeb4", 
      "link": "#228b22", 
      "menu": "#bfbfbf", 
      "background": "#ffffff", 
      "title": "#5f9ea0", 
      "menuText": "#000000", 
      "visited": "#b22222", 
      "misc": "none", 
      "border": "#bfbfbf"
    }, 
    "Chela_light": {
      "menuSel": "#2222ff", 
      "link": "#cc00cc", 
      "menu": "#cccccc", 
      "background": "#fafafa", 
      "title": "#cc2222", 
      "menuText": "#222222", 
      "visited": "#339900", 
      "misc": "none", 
      "border": "#2222ff"
    }, 
    "Github": {
      "menuSel": "#cdcdfd", 
      "link": "#159828", 
      "menu": "#808080", 
      "background": "#f8f8ff", 
      "title": "#177f80", 
      "menuText": "#ffffff", 
      "visited": "#999988", 
      "misc": "none", 
      "border": "#bbbbbb"
    }, 
    "IntelliJ": {
      "menuSel": "#333333", 
      "link": "#000080", 
      "menu": "#cccccc", 
      "background": "#ffffff", 
      "title": "#0000ff", 
      "menuText": "#000000", 
      "visited": "#808080", 
      "misc": "none", 
      "border": "#bbbbbb"
    }, 
    "Simpleandfriendly": {
      "menuSel": "none", 
      "link": "#6a5acd", 
      "menu": "#cccccc", 
      "background": "#e3e3e3", 
      "title": "#8080a0", 
      "menuText": "#000000", 
      "visited": "#ffa500", 
      "misc": "none", 
      "border": "none"
    }, 
    "Eclipse": {
      "menuSel": "#4570aa", 
      "link": "#8040f0", 
      "menu": "none", 
      "background": "#ffffff", 
      "title": "#00884c", 
      "menuText": "#d06000", 
      "visited": "#236e25", 
      "misc": "none", 
      "border": "#904838"
    }, 
    "Oceanlight": {
      "menuSel": "#708090", 
      "link": "#66cdaa", 
      "menu": "#5f9ea0", 
      "background": "#f5f5f5", 
      "title": "#483d8b", 
      "menuText": "#d3d3d3", 
      "visited": "#b0c4de", 
      "misc": "none", 
      "border": "#999999"
    }, 
    "BClear": {
      "menuSel": "#1994d1", 
      "link": "#dc6816", 
      "menu": "#323232", 
      "background": "#ffffff", 
      "title": "#1094a0", 
      "menuText": "#ffffff", 
      "visited": "#969696", 
      "misc": "none", 
      "border": "#646464"
    }, 
    "VYLight": {
      "menuSel": "#3585ef", 
      "link": "#006633", 
      "menu": "#f0f5ff", 
      "background": "#ffffff", 
      "title": "#204070", 
      "menuText": "#60656f", 
      "visited": "#777777", 
      "misc": "none", 
      "border": "#eeeeee"
    }, 
    "Print_bw": {
      "menuSel": "none", 
      "link": "#000000", 
      "menu": "none", 
      "background": "#ffffff", 
      "title": "#000000", 
      "menuText": "none", 
      "visited": "#000000", 
      "misc": "none", 
      "border": "none"
    }, 
    "Calmbreeze": {
      "menuSel": "#006699", 
      "link": "#dc6816", 
      "menu": "#ececec", 
      "background": "#fffce5", 
      "title": "#1094a0", 
      "menuText": "#000000", 
      "visited": "#969696", 
      "misc": "none", 
      "border": "#646464"
    }, 
    "Gaea": {
      "menuSel": "#008b00", 
      "link": "#00688b", 
      "menu": "#b4eeb4", 
      "background": "#ffffff", 
      "title": "#ee7600", 
      "menuText": "#000000", 
      "visited": "#a0522d", 
      "misc": "none", 
      "border": "#8b7355"
    }, 
    "Calmar256-light": {
      "menuSel": "none", 
      "link": "none", 
      "menu": "none", 
      "background": "none", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Newspaper": {
      "menuSel": "#716d51", 
      "link": "#2c694a", 
      "menu": "#b7b7a7", 
      "background": "#dbdbd2", 
      "title": "#881a1a", 
      "menuText": "#866a45", 
      "visited": "#4e5968", 
      "misc": "none", 
      "border": "#99aabb"
    }, 
    "Vc": {
      "menuSel": "none", 
      "link": "#4682b4", 
      "menu": "none", 
      "background": "none", 
      "title": "#004488", 
      "menuText": "none", 
      "visited": "#2e8b57", 
      "misc": "none", 
      "border": "none"
    }, 
    "Baycomb": {
      "menuSel": "#4a85ba", 
      "link": "#652a7a", 
      "menu": "#3a6595", 
      "background": "#e8ebf0", 
      "title": "#3a40aa", 
      "menuText": "#9aadd5", 
      "visited": "darkyellow", 
      "misc": "none", 
      "border": "#525f95"
    }, 
    "Biogoo": {
      "menuSel": "#993333", 
      "link": "#007f00", 
      "menu": "#cc9999", 
      "background": "#d6d6d6", 
      "title": "#0000ff", 
      "menuText": "#000000", 
      "visited": "#0000c3", 
      "misc": "none", 
      "border": "#ffffff"
    }, 
    "Sienna": {
      "menuSel": "#ffff00", 
      "link": "#27408b", 
      "menu": "#a6a6a6", 
      "background": "#ffffff", 
      "title": "#228b22", 
      "menuText": "#000000", 
      "visited": "#3a5fcd", 
      "misc": "none", 
      "border": "#696969"
    }, 
    "Dawn": {
      "menuSel": "#b3b3b3", 
      "link": "#008b8b", 
      "menu": "none", 
      "background": "#e5e5e5", 
      "title": "#838b8b", 
      "menuText": "#000000", 
      "visited": "#4169e1", 
      "misc": "none", 
      "border": "#b3b3b3"
    }, 
    "SummerFruit256": {
      "menuSel": "none", 
      "link": "none", 
      "menu": "none", 
      "background": "none", 
      "title": "none", 
      "menuText": "none", 
      "visited": "none", 
      "misc": "none", 
      "border": "none"
    }, 
    "Montz": {
      "menuSel": "none", 
      "link": "#ff0000", 
      "menu": "none", 
      "background": "#ffffff", 
      "title": "#ff0000", 
      "menuText": "none", 
      "visited": "#00008b", 
      "misc": "none", 
      "border": "none"
    }
  }
}
}