// Author: Matija Podravec, 2012-2013

if (!mpagespace.model.preferences) mpagespace.model.preferences = {};
else if (typeof mpagespace.model.preferences != 'object')
  throw new Error('mpagespace.model.preferences already exists and is not an object');

mpagespace.model.preferences = function(config) {
  config = config || {};
  var defaultConfig = {
    schemeType: 'light',
    schemeName: 'custom',
    colors: {
      light: {
        background: '#F5F5F5',
        border: '#7D8C93',
        link: '#585858',
        visited: '#AB2525',
        title: '#295F94',
        menu: '#BDD8F2',
        menuText: '#484848',
        menuSel: '#AFBFCF',  
        misc: '#AF0F91'
      },
      dark: {
        background: '#293134',
        border: '#616161',
        title: '#93C763',
        link: '#CFCFCF',
        visited: '#7D8C93',
        menu: '#E0E2E4',
        menuText: '#073642',
        menuSel: '#93A1A1',  
        misc: '#EC7600'
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
    favicon: true,
    spacing: '0.375em' 
  };
  this.schemeType = ['dark', 'light'].indexOf(config.schemeType) == -1 ? defaultConfig.schemeType : config.schemeType;
  this.schemeName = config.schemeName == null ? defaultConfig.schemeName : config.schemeName; 
  this.colors = mpagespace.extend({}, defaultConfig.colors[this.schemeType], config.colors);
  this.font = mpagespace.extend({}, defaultConfig.font, config.font);
  this.customCss = config.customCss || defaultConfig.customCss;
  this.lock = config.lock == null ? defaultConfig.lock : config.lock === true;
  this.toolbar = config.toolbar == null ? defaultConfig.toolbar : config.toolbar === true;
  this.favicon = config.favicon == null ? defaultConfig.favicon : config.favicon === true;
  this.spacing = config.spacing || defaultConfig.spacing; 

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
      favicon: this.favicon,
      spacing: this.spacing
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

  setSpacing: function(spacing) {
    var config = this.getConfig();
    config.spacing = spacing;

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
    str.push(this.colors.misc);
    str.push(this.font.size);
    str.push(this.layout.numberOfPanels);
    str.push(this.lock);
    str.push(this.toolbar);
    str.push(this.favicon);
    str.push(this.spacing);

    return str.join('|');
  },

  deserialize: function(str) {
    var config = this.getConfig();
    str = str.split('|');

    if (str.length == 17) {
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
      config.colors.misc = str[10];
      config.font.size = str[11];
      config.layout.numberOfPanels = str[12];
      config.lock = str[13] == 'true';
      config.toolbar = str[14] == 'true';
      config.favicon = str[15] == 'true';
      config.spacing = str[16];
    }

    return new mpagespace.model.preferences(config);
  }
}
