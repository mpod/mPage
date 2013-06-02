// Author: Matija Podravec, 2012.

if (!mpagespace.model.preferences) mpagespace.model.preferences = {};
else if (typeof mpagespace.model.preferences != 'object')
  throw new Error('mpagespace.model.preferences already exists and is not an object');

mpagespace.model.preferences = function(config) {
  config = config || {};
  var defaultConfig = {
    schemeType: 'dark',
    schemeName: 'custom',
    colors: {
      light: {
        background: '#ffffff',
        border: '#D3D3D3',
        link: '#d1c79e',
        visited: '#e6ac32',
        title: '#62acce',
        menu: '#E5E5E5',
        menuText: '#000000',
        menuSel: '#BEBEBE',  
        misc: '#e6ac32'
      },
      dark: {
        background: '#2a2b2f',
        border: '#67686b',
        link: '#d1c79e',
        visited: '#e6ac32',
        title: '#62acce',
        menu: '#9ab2c8',
        menuText: '#2a2b2f',
        menuSel: '#62acce',  
        misc: '#e6ac32'
      }
    },
    font: {
      size: '13',
      family: 'Verdana,sans-serif'
    },
    layout: {
      numberOfPanels: 3
    },
    customCss: null,
    lock: false,
    toolbar: false,
    favicon: true 
  };
  this.schemeType = ['dark', 'light'].indexOf(config.schemeType) == -1 ? defaultConfig.schemeType : config.schemeType;
  this.schemeName = config.schemeName == null ? defaultConfig.schemeName : config.schemeName; 
  this.colors = mpagespace.extend({}, defaultConfig.colors[this.schemeType], config.colors);
  this.font = mpagespace.extend({}, defaultConfig.font, config.font);
  this.customCss = config.customCss || defaultConfig.customCss;
  this.lock = config.lock == null ? defaultConfig.lock : config.lock === true;
  this.toolbar = config.toolbar == null ? defaultConfig.toolbar : config.toolbar === true;
  this.favicon = config.favicon == null ? defaultConfig.favicon : config.favicon === true;

  this.layout = {
    numberOfPanels: (!config.layout || isNaN(parseInt(config.layout.numberOfPanels))) ? 
      defaultConfig.layout.numberOfPanels : parseInt(config.layout.numberOfPanels)
  }
}

mpagespace.model.preferences.prototype = {
  getConfig: function() {
    return {
      schemeType: this.schemeType,
      schemeName: this.schemeName,
      colors: mpagespace.extend({}, this.colors),
      font: mpagespace.extend({}, this.font),
      layout: mpagespace.extend({}, this.layout),
      customCss: this.customCss,
      lock: this.lock,
      toolbar: this.toolbar,
      favicon: this.favicon
    }
  },

  setFont: function(family, size) {
    var config = this.getConfig();
    config.font.size = size;
    config.font.family = family;

    return new mpagespace.model.preferences(config);
  },

  setColorScheme: function(scheme) {
    var config = this.getConfig();
    config.schemeType = scheme.schemeType;
    config.schemeName = config.schemeName;
    config.colors = scheme.colors;

    return new mpagespace.model.preferences(config);
  },

  setCustomCss: function(customCss) {
    var config = this.getConfig();
    config.customCss = customCss

    return new mpagespace.model.preferences(config);
  },

  setLayout: function(layout) {
    var config = this.getConfig();
    config.layout.numberOfPanels = parseInt(layout.numberOfPanels);

    return new mpagespace.model.preferences(config);
  },

  setLock: function(lock) {
    var config = this.getConfig();
    config.lock = lock;

    return new mpagespace.model.preferences(config);
  },

  setToolbar: function(toolbar) {
    var config = this.getConfig();
    config.toolbar = toolbar;

    return new mpagespace.model.preferences(config);
  },

  setFavicon: function(favicon) {
    var config = this.getConfig();
    config.favicon = favicon;

    return new mpagespace.model.preferences(config);
  },

  serialize: function() {
    var str = [];

    str.push(this.schemeType);
    str.push(this.schemeName);
    str.push(this.colors.background);
    str.push(this.colors.border);
    str.push(this.colors.link);
    str.push(this.colors.visited);
    str.push(this.colors.title);
    str.push(this.colors.menu);
    str.push(this.colors.menuText);
    str.push(this.colors.menuSel);
    str.push(this.colors.reserved);
    str.push(this.font.size);
    str.push(this.layout.numberOfPanels);
    str.push(this.lock);
    str.push(this.toolbar);
    str.push(this.favicon);

    return str.join('|');
  },

  deserialize: function(str) {
    var config = this.getConfig();
    str = str.split('|');

    if (str.length == 15) {
      config.schemeType = str[0];
      config.schemeName = str[1];
      config.colors.background = str[2];
      config.colors.border = str[3];
      config.colors.link = str[4];
      config.colors.visited = str[5];
      config.colors.title = str[6];
      config.colors.menu = str[7];
      config.colors.menuText = str[8];
      config.colors.menuSel = str[9];
      config.colors.reserved = str[10];
      config.font.size = str[11];
      config.layout.numberOfPanels = str[12];
      config.lock = str[13];
      config.toolbar = str[14];
      config.favicon = str[15];
    }

    return new mpagespace.model.preferences(config);
  }
}
