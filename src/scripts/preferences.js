'use strict';

let Preferences = function(config) {
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
      numberOfPanels: 3,
      menu: 'sticky-header'
    },
    customCss: null,
    lock: false,
    toolbar: false,
    globalVisitedFilter: false,
    favicon: true,
    reader: false,
    comments: true,
    notifications: true,
    spacing: '0.375em' 
  };
  this.schemeType = ['dark', 'light'].indexOf(config.schemeType) == -1 ? defaultConfig.schemeType : config.schemeType;
  this.schemeName = config.schemeName == null ? defaultConfig.schemeName : config.schemeName; 
  this.colors = Utils.extend({}, defaultConfig.colors[this.schemeType], config.colors);
  this.font = Utils.extend({}, defaultConfig.font, config.font);
  this.customCss = config.customCss || defaultConfig.customCss;
  this.lock = config.lock == null ? defaultConfig.lock : config.lock === true;
  this.toolbar = config.toolbar == null ? defaultConfig.toolbar : config.toolbar === true;
  this.favicon = config.favicon == null ? defaultConfig.favicon : config.favicon === true;
  this.reader = config.reader == null ? defaultConfig.reader : config.reader === true;
  this.comments = config.comments == null ? defaultConfig.comments : config.comments === true;
  this.spacing = config.spacing || defaultConfig.spacing; 
  this.globalVisitedFilter = config.globalVisitedFilter || defaultConfig.globalVisitedFilter;
  this.notifications = config.notifications == null ? defaultConfig.notifications : config.notifications === true;

  this.layout = {
    numberOfPanels: (!config.layout || isNaN(parseInt(config.layout.numberOfPanels))) ?  defaultConfig.layout.numberOfPanels : parseInt(config.layout.numberOfPanels),
    menu: (!config.layout || ['sticky-header', 'sidebar'].indexOf(config.layout.menu) == -1) ? defaultConfig.layout.menu : config.layout.menu
  }
}

Preferences.prototype = {
  getConfig: function() {
    return {
      schemeType: this.schemeType,
      schemeName: this.schemeName,
      colors: Utils.extend({}, this.colors),
      font: Utils.extend({}, this.font),
      layout: Utils.extend({}, this.layout),
      customCss: this.customCss,
      lock: this.lock,
      toolbar: this.toolbar,
      favicon: this.favicon,
      reader: this.reader,
      spacing: this.spacing,
      comments: this.comments,
      globalVisitedFilter: this.globalVisitedFilter,
      notifications: this.notifications,
    }
  },

  setFont: function(family, size) {
    var config = this.getConfig();
    config.font.size = size;
    config.font.family = family;

    return new Preferences(config);
  },

  setColorScheme: function(scheme) {
    var config = this.getConfig();
    config.schemeType = scheme.schemeType;
    config.schemeName = config.schemeName;
    config.colors = scheme.colors;

    return new Preferences(config);
  },

  setCustomCss: function(customCss) {
    var config = this.getConfig();
    config.customCss = customCss

    return new Preferences(config);
  },

  setLayout: function(layout) {
    var config = this.getConfig();
    config.layout.numberOfPanels = parseInt(layout.numberOfPanels);
    config.layout.menu = layout.menu;

    return new Preferences(config);
  },

  setLock: function(lock) {
    var config = this.getConfig();
    config.lock = lock;

    return new Preferences(config);
  },

  setToolbar: function(toolbar) {
    var config = this.getConfig();
    config.toolbar = toolbar;

    return new Peferences(config);
  },

  setFavicon: function(favicon) {
    var config = this.getConfig();
    config.favicon = favicon;

    return new Preferences(config);
  },

  setComments: function(comments) {
    var config = this.getConfig();
    config.comments = comments;

    return new Preferences(config);
  },

  setReader: function(reader) {
    var config = this.getConfig();
    config.reader = reader;

    return new Preferences(config);
  },

  setSpacing: function(spacing) {
    var config = this.getConfig();
    config.spacing = spacing;

    return new Preferences(config);
  },

  setGlobalVisitedFilter: function(globalVisitedFilter) {
    var config = this.getConfig();
    config.globalVisitedFilter = globalVisitedFilter;

    return new Preferences(config);
  },

  setFeedsDiscoveryNotification: function(notifications) {
    var config = this.getConfig();
    config.notifications = notifications;

    return new Preferences(config);
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
    str.push(this.globalVisitedFilter);
    str.push(this.reader);
    str.push(this.notifications);
    str.push(this.layout.menu);

    return str.join('|');
  },

  deserialize: function(str) {
    var config = this.getConfig();
    str = str || '';
    str = str.split('|');

    if (str.length >= 1) 
      config.schemeType = str[0];
    if (str.length >= 2) 
      config.schemeName = str[1];
    if (str.length >= 3) 
      config.colors.background = str[2];
    if (str.length >= 4) 
      config.colors.border = str[3];
    if (str.length >= 5) 
      config.colors.li6k = str[4];
    if (str.length >= 6) 
      config.colors.visited = str[5];
    if (str.length >= 7) 
      config.colors.title = str[6];
    if (str.length >= 8) 
      config.colors.menu = str[7];
    if (str.length >= 9) 
      config.colors.menuText = str[8];
    if (str.length >= 10) 
      config.colors.menuSel = str[9];
    if (str.length >= 11) 
      config.colors.misc = str[10];
    if (str.length >= 12) 
      config.font.size = str[11];
    if (str.length >= 13) 
      config.layout.numberOfPanels = str[12];
    if (str.length >= 14) 
      config.lock = str[13] === 'true';
    if (str.length >= 15) 
      config.toolbar = str[14] === 'true';
    if (str.length >= 16) 
      config.favicon = str[15] === 'true';
    if (str.length >= 17) 
      config.spacing = str[16];
    if (str.length >= 18) 
      config.globalVisitedFilter = str[17] === 'true';
    if (str.length >= 19) 
      config.reader = str[18] === 'true';
    if (str.length >= 20) 
      config.notifications = str[19] === 'true';
    if (str.length >= 21) 
      config.layout.menu = ['sticky-header', 'sidebar'].find(str[20]) == -1 ? config.layout.menu : str[20];

    return new Preferences(config);
  }
}
