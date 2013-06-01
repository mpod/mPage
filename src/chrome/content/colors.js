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
      "Dusk": {
        "visited": "#ffdead", 
        "link": "#cdb7b5", 
        "menu": "lightskyblue4", 
        "title": "#f0e68c"
      }, 
      "Ekvoli": {
        "visited": "#90bfd0", 
        "menu-sel": "#3070c0", 
        "link": "#87c6f0", 
        "menu": "#005090", 
        "title": "#ffffff"
      }, 
      "FU": {
        "visited": "#87afff", 
        "menu-sel": "#5fafd7", 
        "link": "#ffd700", 
        "menu": "#303030", 
        "title": "#8787af"
      }, 
      "Midnight": {
        "visited": "#cdad", 
        "menu-sel": "fg", 
        "link": "#cd96cd", 
        "menu": "steelblue3", 
        "title": "#cdc673"
      }, 
      "Desert256": {}, 
      "Camo": {
        "visited": "#cdc673", 
        "link": "#f0e68c", 
        "menu": "#ffe4c4", 
        "title": "#f0e68c"
      }, 
      "Tango": {
        "visited": "#d3d7cf", 
        "link": "#c4a000", 
        "menu": "#4e9a06", 
        "title": "#4e9a06"
      }, 
      "Synic": {
        "visited": "#ffdead", 
        "menu-sel": "#a9a9a9", 
        "link": "#cdb7b5", 
        "menu": "#ffff", 
        "title": "#f0e68c"
      }, 
      "Wombat256": {
        "visited": "#cae682", 
        "menu-sel": "#cae682", 
        "link": "#e5786d", 
        "menu": "#444444", 
        "title": "#8ac6f2"
      }, 
      "Adaryn": {
        "visited": "#add8e6", 
        "link": "green", 
        "menu": "fg", 
        "title": "#a9a900"
      }, 
      "Earendel": {
        "visited": "#95a4ea", 
        "menu-sel": "#f3c201", 
        "link": "#dc8511", 
        "menu": "#3d5078", 
        "title": "#a7b4ed"
      }, 
      "Zmrok": {
        "visited": "#c7ca87", 
        "menu-sel": "#9b703f", 
        "link": "#cf593c", 
        "menu": "#cda869", 
        "title": "#a56a30"
      }, 
      "DwOrange": {
        "visited": "#ffffff", 
        "link": "#ffff00", 
        "menu": "#d13800", 
        "title": "#ff4400"
      }, 
      "Midnight2": {
        "visited": "#cdad", 
        "menu-sel": "fg", 
        "link": "#cd96cd", 
        "menu": "steelblue3", 
        "title": "#cdc673"
      }, 
      "Gentooish": {
        "visited": "#c476f1", 
        "menu-sel": "#000000", 
        "link": "#b8bb00", 
        "menu": "#222222", 
        "title": "#4cd169"
      }, 
      "Wuye": {
        "visited": "royalblue", 
        "link": "#6495ed", 
        "menu": "#ffff", 
        "title": "springgreen"
      }, 
      "Zendnb": {
        "visited": "#50a0d0", 
        "menu-sel": "#002000", 
        "link": "#d08040", 
        "menu": "#50c050", 
        "title": "#60c060"
      }, 
      "DwBlue": {
        "visited": "#ffffff", 
        "link": "#0000ff", 
        "menu": "#0000dd", 
        "title": "#0000ff"
      }, 
      "Darkbone": {
        "visited": "#e0e0ff", 
        "menu-sel": "#404080", 
        "link": "#f0a0b0", 
        "menu": "#202040", 
        "title": "#8090f0"
      }, 
      "Sorcerer": {
        "visited": "#7e8aa2", 
        "menu-sel": "#b1d631", 
        "link": "#ff9800", 
        "menu": "#444444", 
        "title": "#90b0d1"
      }, 
      "Kellys": {
        "visited": "#e6ac32", 
        "menu-sel": "#62acce", 
        "link": "#d1c79e", 
        "menu": "#9ab2c8", 
        "title": "#62acce"
      }, 
      "Maroloccio": {
        "visited": "#ffcc00", 
        "menu-sel": "#333366", 
        "link": "#82ade0", 
        "menu": "#3741ad", 
        "title": "#9966cc"
      }, 
      "Jellybeans": {}, 
      "BlackSea": {
        "title": "#cd3333"
      }, 
      "DwGreen": {
        "visited": "#ffffff", 
        "link": "#00ff00", 
        "menu": "#00dd00", 
        "title": "#00ff00"
      }, 
      "Oceanblack": {
        "visited": "#add8e6", 
        "link": "cyan3", 
        "menu": "#ffffff", 
        "title": "#90ee90"
      }, 
      "Jammy": {
        "visited": "#bdb76b", 
        "link": "#cd5c5c", 
        "menu": "grey30", 
        "title": "#e6db74"
      }, 
      "DwCyan": {
        "visited": "#ffffff", 
        "link": "#00ffff", 
        "menu": "#00dddd", 
        "title": "#00ffff"
      }, 
      "DesertEx": {
        "visited": "#ffa54f", 
        "menu-sel": "#bebebe", 
        "link": "#fa8072", 
        "menu": "#445599", 
        "title": "#eedc82"
      }, 
      "Mizore": {
        "visited": "#ffffff", 
        "menu-sel": "#133293", 
        "link": "#e080ff", 
        "menu": "#a6a190", 
        "title": "#ffffff"
      }, 
      "Candycode": {
        "visited": "#4093cc", 
        "menu-sel": "#133293", 
        "link": "#ff6050", 
        "menu": "#a6a190", 
        "title": "#66d077"
      }, 
      "TIRBlack": {
        "visited": "#ffffb6", 
        "menu-sel": "#cae682", 
        "link": "#99cc99", 
        "menu": "#444444", 
        "title": "#6699cc"
      }, 
      "Northland": {
        "visited": "#0f8200", 
        "menu-sel": "black", 
        "link": "#035587", 
        "menu": "#8b", 
        "title": "#bf6f00"
      }, 
      "Fnaqevan": {
        "visited": "#40d040", 
        "link": "#00b8e0", 
        "menu": "#005900", 
        "title": "#eee840"
      }, 
      "Railscasts2": {
        "visited": "#da4939", 
        "menu-sel": "#a5c261", 
        "link": "#6d9cbe", 
        "menu": "#444444", 
        "title": "#cc7833"
      }, 
      "Twilight": {
        "menu": "#303030", 
        "menu-sel": "#404040"
      }, 
      "Leo": {
        "visited": "#5fafff", 
        "menu-sel": "#0000ff", 
        "link": "#ffff00", 
        "menu": "#262626", 
        "title": "#d75fff"
      }, 
      "Neverness": {
        "visited": "#ee7ae9", 
        "menu-sel": "#87ceeb", 
        "link": "#87ceeb", 
        "menu": "#4682b4", 
        "title": "#4682b4"
      }, 
      "Rdark": {
        "visited": "#e3e7df", 
        "menu-sel": "#ffffff", 
        "link": "#8ae234", 
        "menu": "#2e3436", 
        "title": "#729fcf"
      }, 
      "Darkspectrum": {
        "visited": "#8ae234", 
        "menu-sel": "#3465a4", 
        "link": "#ef5939", 
        "menu": "#000000", 
        "title": "#ffffff"
      }, 
      "Manxome": {
        "visited": "#00aaaa", 
        "link": "#00ffff", 
        "menu": "#00aaaa", 
        "title": "#00aaaa"
      }, 
      "Vimhut": {
        "visited": "#78d898", 
        "menu-sel": "#999999", 
        "link": "#eb78eb", 
        "menu": "#131313", 
        "title": "#de9898"
      }, 
      "Xoria256": {
        "visited": "#afafdf", 
        "menu-sel": "#767676", 
        "link": "#ffffaf", 
        "menu": "#bcbcbc", 
        "title": "#87afdf"
      }, 
      "DwPurple": {
        "visited": "#ffffff", 
        "link": "#ff00ff", 
        "menu": "#dd00dd", 
        "title": "#ff00ff"
      }, 
      "Asu1dark": {
        "visited": "#ff5577", 
        "link": "#ff9900", 
        "menu": "#00aa33", 
        "title": "#ffff"
      }, 
      "Railscasts": {
        "visited": "#da4939", 
        "link": "#6d9cbe", 
        "menu": "#5a647e", 
        "title": "#cc7833"
      }, 
      "Wombat": {
        "visited": "#cae682", 
        "menu-sel": "#cae682", 
        "link": "#e5786d", 
        "menu": "#444444", 
        "title": "#8ac6f2"
      }, 
      "Freya": {
        "visited": "#dabfa5", 
        "menu-sel": "#c0aa94", 
        "link": "#afe091", 
        "menu": "#a78869", 
        "title": "#e0af91"
      }, 
      "Dante": {
        "visited": "#66cd", 
        "link": "#cd2626", 
        "title": "#cdad"
      }, 
      "Herald": {
        "visited": "#ffee68", 
        "menu-sel": "#f17a00", 
        "link": "#6df584", 
        "menu": "#140100", 
        "title": "#e783e9"
      }, 
      "Blackbeauty": {
        "visited": "#60ff60", 
        "link": "#ffa0a0", 
        "title": "#ffff60"
      }, 
      "Colorer": {
        "visited": "green", 
        "link": "#ffffff", 
        "menu": "black", 
        "title": "#ffffff"
      }, 
      "Vibrantink": {
        "visited": "#ffffff", 
        "link": "#ffee98", 
        "title": "#ff6600"
      }, 
      "Candy": {
        "visited": "#ffc864", 
        "link": "#90d0ff", 
        "menu": "#707080", 
        "title": "#ffa0ff"
      }, 
      "DwYellow": {
        "visited": "#ffffff", 
        "link": "#ffff00", 
        "menu": "#dddd00", 
        "title": "#ffff00"
      }, 
      "Wombat256mod": {
        "visited": "#d4d987", 
        "menu-sel": "#cae982", 
        "link": "#e5786d", 
        "menu": "#444444", 
        "title": "#88b8f6"
      }, 
      "Brookstream": {
        "visited": "#ffffff", 
        "link": "#00aaaa", 
        "menu": "#bbbbbb", 
        "title": "#00ffff"
      }, 
      "Lucius": {
        "visited": "#87d7d7", 
        "menu-sel": "#005f87", 
        "link": "#d7d7af", 
        "menu": "#b2b2b2", 
        "title": "#87d7ff"
      }, 
      "Fruity": {
        "visited": "#cdcaa9", 
        "link": "#0086d2", 
        "menu": "#cb2f27", 
        "title": "#fb660a"
      }, 
      "Anotherdark": {
        "visited": "#bdb76b", 
        "link": "#ffa0a0", 
        "menu": "#6b8e23", 
        "title": "#f0e68c"
      }, 
      "Moria": {
        "visited": "#912f11", 
        "menu-sel": "#ffff00", 
        "link": "#077807", 
        "menu": "#708bc5", 
        "title": "#1f3f81"
      }, 
      "Matrix": {
        "visited": "#55ff55", 
        "link": "#55ff55", 
        "menu": "#339933", 
        "title": "#55ff55"
      }, 
      "Calmar256-dark": {}, 
      "Manuscript": {
        "visited": "#87ceeb", 
        "menu-sel": "#808080", 
        "link": "#cea3ce", 
        "menu": "#494949", 
        "title": "#779fcf"
      }, 
      "Metacosm": {
        "visited": "#60ff60", 
        "menu-sel": "green", 
        "link": "#ffa0a0", 
        "menu": "grey20", 
        "title": "#ffff60"
      }, 
      "Zenburn": {
        "visited": "#dfdfbf", 
        "menu-sel": "#242424", 
        "link": "#dca3a3", 
        "menu": "#2c2e2e", 
        "title": "#e3ceab"
      }, 
      "Neon": {
        "visited": "#60f0a8", 
        "link": "#92d4ff", 
        "menu": "#008000", 
        "title": "#dcdc78"
      }, 
      "Golden": {
        "visited": "#ffe13f", 
        "link": "#ff", 
        "title": "#ffff60"
      }, 
      "Inkpot": {
        "visited": "#ff8bff", 
        "menu-sel": "#2e2e3f", 
        "link": "#ffcd8b", 
        "menu": "#4e4e8f", 
        "title": "#808bed"
      }, 
      "Lettuce": {
        "visited": "#5faf5f", 
        "menu-sel": "#005f87", 
        "link": "#ffaf5f", 
        "menu": "#00005f", 
        "title": "#5f5fff"
      }, 
      "Adrian": {
        "visited": "#7d96ff", 
        "link": "#ffa0a0", 
        "menu": "#b3b3b3", 
        "title": "#ffff60"
      }, 
      "LiquidCarbon": {
        "visited": "#4169e1", 
        "menu-sel": "#0000ff", 
        "link": "#cdad00", 
        "menu": "#c0c8cf", 
        "title": "#009acd"
      }, 
      "Rootwater": {
        "visited": "#ffffff", 
        "menu-sel": "black", 
        "link": "#88ee99", 
        "menu": "#202530", 
        "title": "#8fffff"
      }, 
      "Relaxedgreen": {
        "visited": "#559955", 
        "menu-sel": "#999999", 
        "link": "#0099dd", 
        "menu": "#337733", 
        "title": "#ac0000"
      }, 
      "Molokai": {
        "visited": "#66d9ef", 
        "menu-sel": "#808080", 
        "link": "#ae81ff", 
        "menu": "#000000", 
        "title": "#f92672"
      }, 
      "Luinnar": {
        "visited": "#ffffff", 
        "menu-sel": "#133293", 
        "link": "#00ff20", 
        "menu": "#a6a190", 
        "title": "#ffffff"
      }, 
      "Two2Tango": {}, 
      "Dejavu": {
        "visited": "#f284b8", 
        "menu-sel": "bg", 
        "link": "#68b8fd", 
        "menu": "#23d1de", 
        "title": "#f2b884"
      }, 
      "DwRed": {
        "visited": "#ffffff", 
        "link": "#ff0000", 
        "menu": "#dd0000", 
        "title": "#ff0000"
      }, 
      "Tango2": {
        "visited": "#8ae234", 
        "link": "#8ae234", 
        "title": "#729fcf"
      }
    }, 
    "light": {
      "Impact": {}, 
      "Silent": {
        "visited": "black", 
        "menu-sel": "#f1ffc1", 
        "link": "#006e26", 
        "menu": "#dddddd", 
        "title": "#b07e00"
      }, 
      "Satori": {
        "visited": "#ffff", 
        "link": "#ff", 
        "title": "none"
      }, 
      "Habilight": {
        "visited": "blue", 
        "menu-sel": "#ffa5", 
        "link": "#b91f49", 
        "menu": "#bddfff", 
        "title": "#f06f00"
      }, 
      "Autumnleaf": {
        "visited": "#007700", 
        "link": "#003399", 
        "menu": "#fff8cc", 
        "title": "#003399"
      }, 
      "Autumn2": {
        "visited": "#bb9900", 
        "link": "#bb6666", 
        "menu": "#90ee90", 
        "title": "#44aa44"
      }, 
      "Greyhouse": {
        "visited": "#800080", 
        "menu-sel": "#cccccc", 
        "link": "#400080", 
        "menu": "#666666", 
        "title": "#004080"
      }, 
      "Imperial": {
        "visited": "#002080", 
        "menu-sel": "#004080", 
        "link": "#007000", 
        "menu": "#acacac", 
        "title": "#002080"
      }, 
      "Newspaper": {
        "visited": "#4d69a7", 
        "menu-sel": "#716d51", 
        "link": "#881a1a", 
        "menu": "#b7b7a7", 
        "title": "#0f58af"
      }, 
      "Fog": {
        "visited": "#8b", 
        "link": "#7070a0", 
        "menu": "fg", 
        "title": "darkgreen"
      }, 
      "Nuvola": {
        "visited": "blue", 
        "link": "#b91f49", 
        "menu": "#bddfff", 
        "title": "#f06f00"
      }, 
      "Tolerable": {
        "visited": "#8b8b", 
        "link": "#8b", 
        "menu": "green", 
        "title": "blue"
      }, 
      "Winter": {
        "visited": "#0000ff", 
        "link": "#a000a0", 
        "menu": "#000080", 
        "title": "#0000ff"
      }, 
      "Autumn": {
        "visited": "#b06c58", 
        "link": "#00884c", 
        "menu": "#ffc0a0", 
        "title": "#80a030"
      }, 
      "Zenesque": {
        "visited": "#518991", 
        "menu-sel": "#9b601a", 
        "link": "#8d5c57", 
        "menu": "#3f3f3f", 
        "title": "#5a89a4"
      }, 
      "TCSoft": {
        "visited": "#ff9900", 
        "link": "#666666", 
        "menu": "#808080", 
        "title": "#ff9900"
      }, 
      "Pyte": {
        "visited": "#e5a00d", 
        "link": "#a07040", 
        "menu": "#808080", 
        "title": "#007020"
      }, 
      "Fruit": {
        "visited": "#0070e6", 
        "link": "#8016ff", 
        "menu": "#e0e0e0", 
        "title": "#f030d0"
      }, 
      "Fine_blue": {
        "visited": "#7040ff", 
        "link": "#2020ff", 
        "menu": "#dddde8", 
        "title": "#008858"
      }, 
      "MickeySoft": {
        "visited": "#000080", 
        "menu-sel": "#316ac5", 
        "link": "#008080", 
        "menu": "#ece9d8", 
        "title": "#000080"
      }, 
      "Ironman": {
        "visited": "#eb7950", 
        "menu-sel": "#ffa5", 
        "link": "none", 
        "menu": "#bddfff", 
        "title": "#005ec4"
      }, 
      "MayanSmoke": {
        "visited": "#8470ff", 
        "menu-sel": "#8b795e", 
        "link": "#ff8c", 
        "menu": "#cdcdb4", 
        "title": "blue1"
      }, 
      "Scame": {
        "visited": "forestgreen", 
        "menu-sel": "#b4eeb4", 
        "link": "cadetblue", 
        "menu": "#bfbfbf", 
        "title": "#a020f0"
      }, 
      "Chela_light": {
        "visited": "#2222ff", 
        "menu-sel": "#2222ff", 
        "link": "#cc2222", 
        "menu": "#cccccc", 
        "title": "#2222ff"
      }, 
      "Github": {
        "visited": "#445588", 
        "menu-sel": "#cdcdfd", 
        "link": "#177f80", 
        "menu": "#808080", 
        "title": "#000000"
      }, 
      "IntelliJ": {
        "visited": "#000080", 
        "menu-sel": "#333333", 
        "link": "#0000ff", 
        "menu": "#cccccc", 
        "title": "#000080"
      }, 
      "Simpleandfriendly": {
        "visited": "#008080", 
        "link": "#8080a0", 
        "menu": "#cccccc", 
        "title": "#4a2b99"
      }, 
      "Eclipse": {
        "visited": "#7f0055", 
        "link": "#00884c", 
        "menu": "#ffc0a0", 
        "title": "#b64f90"
      }, 
      "Oceanlight": {
        "visited": "steelblue", 
        "link": "#483d8b", 
        "menu": "#6c7b8b", 
        "title": "seagreen"
      }, 
      "BClear": {
        "visited": "#a00050", 
        "menu-sel": "#1994d1", 
        "link": "#1094a0", 
        "menu": "#323232", 
        "title": "#3b6ac8"
      }, 
      "VYLight": {
        "visited": "#0050b0", 
        "menu-sel": "#3585ef", 
        "link": "#204070", 
        "menu": "#f0f5ff", 
        "title": "#1a1a1a"
      }, 
      "Print_bw": {
        "visited": "black", 
        "link": "black", 
        "title": "black"
      }, 
      "Calmbreeze": {
        "visited": "#a00050", 
        "menu-sel": "#006699", 
        "link": "#1094a0", 
        "menu": "#ececec", 
        "title": "#3b6ac8"
      }, 
      "Gaea": {
        "visited": "#698b22", 
        "menu-sel": "green4", 
        "link": "#ee76", 
        "menu": "#b4eeb4", 
        "title": "green4"
      }, 
      "Calmar256-light": {}, 
      "SoSo": {
        "visited": "#338855", 
        "menu-sel": "#ddddaa", 
        "link": "#c033ff", 
        "menu": "#ffffcc", 
        "title": "black"
      }, 
      "Vc": {
        "visited": "blue", 
        "link": "#004488", 
        "title": "blue"
      }, 
      "TAqua": {
        "visited": "#0971f9", 
        "link": "#0384f6", 
        "menu": "#1679f9", 
        "title": "#f36ce5"
      }, 
      "Martin_krischik": {
        "visited": "seagreen4", 
        "menu-sel": "#b22222", 
        "link": "#b452cd", 
        "menu": "#bebebe", 
        "title": "royalblue4"
      }, 
      "Baycomb": {
        "visited": "#307aca", 
        "menu-sel": "#4a85ba", 
        "link": "#3a40aa", 
        "menu": "#3a6595", 
        "title": "#da302a"
      }, 
      "Biogoo": {
        "visited": "#540054", 
        "menu-sel": "#993333", 
        "link": "#0000ff", 
        "menu": "#cc9999", 
        "title": "#00007f"
      }, 
      "Sienna": {
        "visited": "royalblue4", 
        "menu-sel": "#ffff", 
        "link": "forestgreen", 
        "menu": "#a6a6a6", 
        "title": "#8b4726"
      }, 
      "Spring": {
        "visited": "#009933", 
        "link": "#a07040", 
        "menu": "#ccffff", 
        "title": "#fc548f"
      }, 
      "Dawn": {
        "visited": "#a52a2a", 
        "link": "#838b8b", 
        "menu": "fg", 
        "title": "slateblue4"
      }, 
      "SummerFruit256": {}, 
      "Montz": {
        "visited": "black", 
        "link": "#ff", 
        "title": "#a9a9a9"
      }
    }
  }
}
