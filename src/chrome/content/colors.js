// Author: Matija Podravec, 2012-2013

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
    result.unshift('default');
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
      misc: colors[12]
    }
  },

  getScheme: function(type, name) {
    if (name in this.schemes[type])
      return this.schemes[type][name];

    if (name in this.config[type])
      return this.config[type][name];

    if (name == 'default')
      return {}
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
      "menuText": "#3f8fff", 
      "visited": "#9590d5", 
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
      "misc": "#87af5f", 
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
      "misc": "#cd5555"
    }, 
    "Adrian": {
      "menuSel": "#a9a9a9", 
      "link": "#ffa500", 
      "menu": "#b3b3b3", 
      "background": "#000000", 
      "title": "#ffa0a0", 
      "menuText": "#ff4500", 
      "visited": "#d1ddff"
    }, 
    "Camo": {
      "menuSel": "#caff70", 
      "link": "#cd5c5c", 
      "background": "#262626", 
      "title": "#f0e68c", 
      "menuText": "#cdc673", 
      "visited": "#d2b48c", 
      "misc": "#ffe4b5", 
      "border": "#caff70"
    }, 
    "Tango": {
      "menuSel": "#4e9a06", 
      "link": "#75507b", 
      "menu": "#4e9a06", 
      "background": "#000000", 
      "title": "#c4a000", 
      "menuText": "#cc0000", 
      "visited": "#06989a", 
      "border": "#eeeeec"
    }, 
    "Synic": {
      "menuSel": "#a9a9a9", 
      "link": "#daa520", 
      "menu": "#ff00ff", 
      "background": "#000000", 
      "title": "#cdb7b5", 
      "visited": "#62c600", 
      "misc": "#9ac0cd", 
      "border": "#000000"
    }, 
    "Dusk": {
      "menuSel": "#bebebe", 
      "link": "#daa520", 
      "background": "#1f3048", 
      "title": "#cdb7b5", 
      "menuText": "#fffff0", 
      "visited": "#708090", 
      "misc": "#9ac0cd", 
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
      "misc": "#d9ff77", 
      "border": "#202020"
    }, 
    "DwOrange": {
      "menuSel": "#ff3200", 
      "link": "#ffa600", 
      "background": "#000000", 
      "title": "#ffff00", 
      "menuText": "#ff4400", 
      "visited": "#696969", 
      "misc": "#d13800", 
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
      "misc": "#cd5555"
    }, 
    "Gentooish": {
      "menuSel": "#000000", 
      "link": "#ffcd8b", 
      "menu": "#222222", 
      "background": "#191919", 
      "title": "#b8bb00", 
      "menuText": "#cccccc", 
      "visited": "#666666", 
      "misc": "#5dff9e", 
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
      "misc": "#63b8ff", 
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
      "misc": "#40c0c0", 
      "border": "#002000"
    }, 
    "DwBlue": {
      "menuSel": "#0000ff", 
      "link": "#ffffff", 
      "background": "#000000", 
      "title": "#0000ff", 
      "menuText": "#0000ff", 
      "visited": "#696969", 
      "misc": "#0000bb", 
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
      "misc": "#779b70", 
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
      "misc": "#95e454", 
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
      "misc": "#4c4cad", 
      "border": "#333366"
    }, 
    "Freya": {
      "menuSel": "#c0aa94", 
      "link": "#d4b064", 
      "menu": "#a78869", 
      "background": "#2a2a2a", 
      "title": "#afe091", 
      "menuText": "#c2aed0", 
      "visited": "#c2b680", 
      "border": "#564d43"
    }, 
    "DwGreen": {
      "menuSel": "#008800", 
      "link": "#ffffff", 
      "background": "#000000", 
      "title": "#00ff00", 
      "menuText": "#00ff00", 
      "visited": "#696969", 
      "misc": "#00bb00", 
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
      "misc": "#80a0ff", 
      "border": "#999999"
    }, 
    "DwCyan": {
      "menuSel": "#00ffff", 
      "link": "#ffffff", 
      "background": "#000000", 
      "title": "#00ffff", 
      "menuText": "#00ffff", 
      "visited": "#696969", 
      "misc": "#00bbbb", 
      "border": "#000000"
    }, 
    "DesertEx": {
      "menuSel": "#bebebe", 
      "link": "#76eec6", 
      "menu": "#445599", 
      "background": "#2b2b2b", 
      "title": "#fa8072", 
      "menuText": "#ee799f", 
      "visited": "#7ccd7c", 
      "border": "#666666"
    }, 
    "Mizore": {
      "menuSel": "#133293", 
      "link": "#ff40ff", 
      "menu": "#a6a190", 
      "background": "#000000", 
      "title": "#e080ff", 
      "menuText": "#8070ff", 
      "visited": "#b0b0b0", 
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
      "misc": "#d7af87", 
      "border": "#eeeeee"
    }, 
    "Candycode": {
      "menuSel": "#133293", 
      "link": "#9999aa", 
      "menu": "#a6a190", 
      "background": "#050505", 
      "title": "#ff6050", 
      "menuText": "#bb88dd", 
      "visited": "#ff9922", 
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
      "misc": "#a8ff60", 
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
      "border": "#a9a9a9"
    }, 
    "Fnaqevan": {
      "menuSel": "#1f1f1f", 
      "link": "#b899c8", 
      "background": "#000000", 
      "title": "#00b8e0", 
      "menuText": "#00b098", 
      "visited": "#006699", 
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
      "misc": "#a5c261"
    }, 
    "Earendel": {
      "menuSel": "#f3c201", 
      "link": "#d3a901", 
      "menu": "#3d5078", 
      "background": "#303030", 
      "title": "#dc8511", 
      "menuText": "#e09ea8", 
      "visited": "#77be21", 
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
      "misc": "#87ceeb", 
      "border": "#000000"
    }, 
    "Rdark": {
      "menuSel": "#ffffff", 
      "link": "#888a85", 
      "menu": "#2e3436", 
      "background": "#1e2426", 
      "title": "#8ae234", 
      "menuText": "#fcaf3e", 
      "visited": "#656763", 
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
      "misc": "#fce94f", 
      "border": "#3c3c3c"
    }, 
    "Manxome": {
      "menuSel": "#0000ff", 
      "link": "#ffffff", 
      "menu": "#00aaaa", 
      "background": "#000000", 
      "title": "#00ffff", 
      "menuText": "#ffffff", 
      "visited": "#00ff00"
    }, 
    "Vimhut": {
      "menuSel": "#999999", 
      "link": "#b898ee", 
      "menu": "#131313", 
      "background": "#333333", 
      "title": "#eb78eb", 
      "menuText": "#b0b0b0", 
      "visited": "#58a9de", 
      "misc": "#eb78eb", 
      "border": "#000000"
    }, 
    "Xoria256": {
      "menuSel": "#767676", 
      "link": "#df8787", 
      "menu": "#bcbcbc", 
      "background": "#1c1c1c", 
      "title": "#ffffaf", 
      "menuText": "#afdf87", 
      "visited": "#808080", 
      "border": "#3a3a3a"
    }, 
    "DwPurple": {
      "menuSel": "#ff00ff", 
      "link": "#ffffff", 
      "background": "#000000", 
      "title": "#ff00ff", 
      "menuText": "#ff00ff", 
      "visited": "#696969", 
      "misc": "#bb00bb", 
      "border": "#000000"
    }, 
    "Asu1dark": {
      "menuSel": "#336600", 
      "link": "#00ffff", 
      "menu": "#ffffff", 
      "background": "#110022", 
      "title": "#ff9900", 
      "menuText": "#33ff66", 
      "visited": "#99cc99", 
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
      "misc": "#d1c79e", 
      "border": "#e1e0e5"
    }, 
    "Candy": {
      "menuSel": "#c8c8d8", 
      "link": "#e0e080", 
      "background": "#000000", 
      "title": "#90d0ff", 
      "menuText": "#40f0a0", 
      "visited": "#c0c0d0", 
      "border": "#c8c8d8"
    }, 
    "Herald": {
      "menuSel": "#f17a00", 
      "link": "#ffee68", 
      "menu": "#140100", 
      "background": "#1f1f1f", 
      "title": "#6df584", 
      "menuText": "#660300", 
      "visited": "#696567", 
      "misc": "#ffb539", 
      "border": "#1f1f1f"
    }, 
    "Blackbeauty": {
      "link": "#ffa500", 
      "menu": "#0000ff", 
      "background": "#000000", 
      "title": "#ffa0a0", 
      "menuText": "#ffffff", 
      "visited": "#80a0ff", 
      "misc": "#a52a2a"
    }, 
    "Colorer": {
      "menuSel": "#bebebe", 
      "link": "#ff0000", 
      "background": "#000000", 
      "title": "#ffffff", 
      "menuText": "#008b8b", 
      "visited": "#b46918", 
      "misc": "#ffff00"
    }, 
    "Vibrantink": {
      "link": "#ff6600", 
      "background": "#000000", 
      "title": "#ffee98", 
      "visited": "#9933cc", 
      "misc": "#66ff00"
    }, 
    "Tango2": {
      "link": "#5eafe5", 
      "background": "#2e3436", 
      "title": "#8ae234", 
      "menuText": "#e9ba6e", 
      "visited": "#6d7e8a"
    }, 
    "DwYellow": {
      "menuSel": "#ffff00", 
      "link": "#ffffff", 
      "background": "#000000", 
      "title": "#ffff00", 
      "menuText": "#ffff00", 
      "visited": "#696969", 
      "misc": "#bbbb00", 
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
      "misc": "#95e454", 
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
      "misc": "#0086d2", 
      "border": "#a0b0c0"
    }, 
    "Moria": {
      "menuSel": "#ffff00", 
      "link": "#912f11", 
      "menu": "#708bc5", 
      "background": "#ffffff", 
      "title": "#077807", 
      "menuText": "#800090", 
      "visited": "#786000", 
      "border": "#a6b7db"
    }, 
    "Matrix": {
      "menuSel": "#339933", 
      "link": "#44cc44", 
      "background": "#000000", 
      "title": "#55ff55", 
      "menuText": "#339933", 
      "visited": "#226622", 
      "border": "#339933"
    }, 
    "Manuscript": {
      "menuSel": "#808080", 
      "link": "#cfbfaf", 
      "menu": "#494949", 
      "background": "#242424", 
      "title": "#cea3ce", 
      "menuText": "#bf7f6f", 
      "visited": "#7f9f7f", 
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
      "misc": "#ffa0a0", 
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
      "misc": "#cc9393", 
      "border": "#688060"
    }, 
    "Neon": {
      "menuSel": "#c4c4c4", 
      "link": "#ffc890", 
      "background": "#303030", 
      "title": "#92d4ff", 
      "menuText": "#ffa8ff", 
      "visited": "#c0c0c0", 
      "border": "#c4c4c4"
    }, 
    "Golden": {
      "link": "#ffa500", 
      "menu": "#ddbb00", 
      "background": "#000000", 
      "title": "#ff0000", 
      "menuText": "#ffddaa", 
      "visited": "#978345", 
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
      "misc": "#ffcd8b", 
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
      "misc": "#ffaf5f", 
      "border": "#303030"
    }, 
    "Wombat256": {
      "menuSel": "#cae682", 
      "link": "#e7f6da", 
      "menu": "#444444", 
      "background": "#242424", 
      "title": "#e5786d", 
      "menuText": "#f6f3e8", 
      "visited": "#99968b", 
      "misc": "#95e454", 
      "border": "#444444"
    }, 
    "LiquidCarbon": {
      "menuSel": "#0000ff", 
      "link": "#7f9f44", 
      "menu": "#c0c8cf", 
      "background": "#303030", 
      "title": "#cdad00", 
      "menuText": "#0000ff", 
      "visited": "#809090", 
      "misc": "#559b70", 
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
      "misc": "#e6db74", 
      "border": "#080808"
    }, 
    "Luinnar": {
      "menuSel": "#133293", 
      "link": "#ffff00", 
      "menu": "#a6a190", 
      "background": "#000000", 
      "title": "#00ff20", 
      "menuText": "#00b000", 
      "visited": "#b0b010", 
      "border": "#c2bfa5"
    }, 
    "Dejavu": {
      "menuSel": "#000025", 
      "link": "#3bc4ec", 
      "menu": "#23d1de", 
      "background": "#000025", 
      "title": "#68b8fd", 
      "menuText": "bg", 
      "visited": "#13c1d5", 
      "misc": "#55eea4", 
      "border": "#101060"
    }, 
    "DwRed": {
      "menuSel": "#ff0000", 
      "link": "#ffffff", 
      "background": "#000000", 
      "title": "#ff0000", 
      "menuText": "#ff0000", 
      "visited": "#696969", 
      "misc": "#bb0000", 
      "border": "#000000"
    }
  }, 
  "light": {
    "Silent": {
      "menuSel": "#f1ffc1", 
      "link": "#000000", 
      "menu": "#dddddd", 
      "background": "#ffffff", 
      "title": "#006e26", 
      "menuText": "#000000", 
      "visited": "#888786", 
      "misc": "#bf0303", 
      "border": "#f1ffc1"
    }, 
    "Simpleandfriendly": {
      "link": "#6a5acd", 
      "menu": "#cccccc", 
      "background": "#e3e3e3", 
      "title": "#8080a0", 
      "menuText": "#000000", 
      "visited": "#ffa500", 
      "misc": "#80a0ff"
    }, 
    "Autumnleaf": {
      "menuSel": "#ffeebb", 
      "link": "#000000", 
      "background": "#fffdfa", 
      "title": "#003399", 
      "menuText": "#003399", 
      "visited": "#002200", 
      "misc": "#003399", 
      "border": "#aa8866"
    }, 
    "Greyhouse": {
      "menuSel": "#cccccc", 
      "link": "#9c6911", 
      "menu": "#666666", 
      "background": "#d3d3d3", 
      "title": "#400080", 
      "menuText": "bg", 
      "visited": "#205e50", 
      "misc": "#0000a0", 
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
      "misc": "#803000", 
      "border": "#333333"
    }, 
    "TAqua": {
      "menuSel": "#0e8ed3", 
      "link": "#0e8ed3", 
      "menu": "#1679f9", 
      "background": "#ffffff", 
      "title": "#0384f6", 
      "menuText": "#0bbf20", 
      "visited": "#0e8ed3", 
      "border": "#0e8ed3"
    }, 
    "Fog": {
      "link": "#aa8822", 
      "menu": "fg", 
      "background": "#cccccc", 
      "title": "#7070a0", 
      "menuText": "#408040", 
      "visited": "#444499"
    }, 
    "Nuvola": {
      "link": "#ee0000", 
      "background": "#f9f5f9", 
      "title": "#b91f49", 
      "menuText": "#0070ff", 
      "visited": "#3f6b5b", 
      "misc": "#b91f49", 
      "border": "#56a0ee"
    }, 
    "Tolerable": {
      "menuSel": "#333333", 
      "link": "#ff0000", 
      "menu": "#00ff00", 
      "background": "#ffffff", 
      "title": "#8b0000", 
      "menuText": "#008b8b", 
      "visited": "#555555", 
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
      "misc": "#008080", 
      "border": "#909090"
    }, 
    "Autumn": {
      "menuSel": "#904838", 
      "link": "#8040f0", 
      "background": "#fff4e8", 
      "title": "#00884c", 
      "menuText": "#0090a0", 
      "visited": "#ff5050", 
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
      "misc": "#5d7a64", 
      "border": "#222222"
    }, 
    "Habilight": {
      "menuSel": "#ffa500", 
      "link": "#ee0000", 
      "menu": "#bddfff", 
      "background": "#f9f5f9", 
      "title": "#b91f49", 
      "menuText": "#000000", 
      "visited": "#008b8b", 
      "misc": "#b91f49", 
      "border": "#56a0ee"
    }, 
    "Pyte": {
      "menuSel": "#8090a0", 
      "link": "#70a0d0", 
      "menu": "#808080", 
      "background": "#f0f0f0", 
      "title": "#a07040", 
      "menuText": "#ffffff", 
      "visited": "#a0b0c0", 
      "misc": "#4070a0", 
      "border": "#a0b0c0"
    }, 
    "Fruit": {
      "menuSel": "#404040", 
      "link": "#4a9400", 
      "background": "#f8f8f8", 
      "title": "#8016ff", 
      "menuText": "#e06800", 
      "visited": "#ff4080", 
      "border": "#404040"
    }, 
    "Fine_blue": {
      "menuSel": "#404054", 
      "link": "#005858", 
      "background": "#f8f8f8", 
      "title": "#2020ff", 
      "menuText": "#0070e6", 
      "visited": "#ff00c0", 
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
      "misc": "#900000", 
      "border": "#d4d0c8"
    }, 
    "Ironman": {
      "menuSel": "#ffa500", 
      "link": "#0000ff", 
      "menu": "#bddfff", 
      "background": "#f0f0f0", 
      "menuText": "#000000", 
      "visited": "#a0b0c0", 
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
      "misc": "#458b74", 
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
      "misc": "#bc8f8f", 
      "border": "#bfbfbf"
    }, 
    "Chela_light": {
      "menuSel": "#2222ff", 
      "link": "#cc00cc", 
      "menu": "#cccccc", 
      "background": "#fafafa", 
      "title": "#cc2222", 
      "menuText": "#2222ff", 
      "visited": "#339900", 
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
      "misc": "#d81745", 
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
      "misc": "#008000", 
      "border": "#bbbbbb"
    }, 
    "Eclipse": {
      "menuSel": "#4570aa", 
      "link": "#8040f0", 
      "background": "#ffffff", 
      "title": "#00884c", 
      "menuText": "#d06000", 
      "visited": "#236e25", 
      "misc": "#8010a0", 
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
      "misc": "#66cdaa", 
      "border": "#999999"
    }, 
    "BClear": {
      "menuSel": "#1994d1", 
      "link": "#dc6816", 
      "menu": "#323232", 
      "background": "#ffffff", 
      "title": "#1094a0", 
      "menuText": "#294a8c", 
      "visited": "#969696", 
      "border": "#646464"
    }, 
    "VYLight": {
      "menuSel": "#3585ef", 
      "link": "#006633", 
      "menu": "#f0f5ff", 
      "background": "#ffffff", 
      "title": "#204070", 
      "menuText": "#006633", 
      "visited": "#777777", 
      "border": "#eeeeee"
    }, 
    "Print_bw": {
      "link": "#000000", 
      "background": "#ffffff", 
      "title": "#000000", 
      "visited": "#000000", 
      "misc": "#000000"
    }, 
    "Calmbreeze": {
      "menuSel": "#006699", 
      "link": "#dc6816", 
      "menu": "#ececec", 
      "background": "#fffce5", 
      "title": "#1094a0", 
      "menuText": "#294a8c", 
      "visited": "#969696", 
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
      "misc": "#cd853f", 
      "border": "#8b7355"
    }, 
    "Autumn2": {
      "menuSel": "#ddd9b8", 
      "link": "#008b8b", 
      "menu": "#aaccaa", 
      "background": "#f0f2f0", 
      "title": "#bb6666", 
      "menuText": "#a9a9a9", 
      "visited": "#ccaaaa", 
      "border": "#a9a9a9"
    }, 
    "Newspaper": {
      "menuSel": "#716d51", 
      "link": "#2c694a", 
      "menu": "#b7b7a7", 
      "background": "#dbdbd2", 
      "title": "#881a1a", 
      "menuText": "#866a45", 
      "visited": "#4e5968", 
      "misc": "#1e5432", 
      "border": "#99aabb"
    }, 
    "Vc": {
      "link": "#4682b4", 
      "title": "#004488", 
      "menuText": "#0000ff", 
      "visited": "#2e8b57"
    }, 
    "Baycomb": {
      "menuSel": "#4a85ba", 
      "link": "#652a7a", 
      "menu": "#3a6595", 
      "background": "#e8ebf0", 
      "title": "#3a40aa", 
      "menuText": "#9570b5", 
      "visited": "darkyellow", 
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
      "misc": "#d10000", 
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
      "misc": "#228b22", 
      "border": "#696969"
    }, 
    "Dawn": {
      "menuSel": "#b3b3b3", 
      "link": "#008b8b", 
      "background": "#e5e5e5", 
      "title": "#838b8b", 
      "menuText": "#000000", 
      "visited": "#4169e1", 
      "misc": "#6e8b3d", 
      "border": "#b3b3b3"
    }, 
    "Montz": {
      "link": "#ff0000", 
      "background": "#ffffff", 
      "title": "#ff0000", 
      "visited": "#00008b", 
      "misc": "#ff00ff"
    }
  }
}
}
