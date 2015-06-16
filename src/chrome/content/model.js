// Author: Matija Podravec, 2012-2013

if (!mpagespace.model) mpagespace.model = {};
else if (typeof mpagespace.model != 'object')
  throw new Error('mpagespace.model already exists and is not an object');

mpagespace.model = function(){
  this.storage = mpagespace.storage.storageFactory();
  this.activePageId = null;
  this.pages = {};
  this.preferences = null;
  this.preferencesTmp = null;
  this.colorSchemes = null;
  this.sync = null;
  this.config = null;
  this.maxWidgetId = 0;
  this.maxPageId = 0;
  this.dirty = false;
  this.loaded = false;

  var self = this;
  var observer = {
    observe: function(subject, topic, data) {  
      if (topic == 'mpage-storage') {
        mpagespace.dump('model.observe: ' + topic + '/' + data);
        data = data.split(':');

        switch(data[0]) {
          case 'data-loaded':
            self.init();
            break;
          default:
            break;
        }
      }
    }
  };
  mpagespace.observerService.addObserver(observer, 'mpage-storage', false); 

  self.timer = Components.classes["@mozilla.org/timer;1"]
      .createInstance(Components.interfaces.nsITimer);
  var timerCallback = {
    notify: function() {
      mpagespace.dump('Commit timer fired.');
      if (self.isDirty()) {
        self.commit();
      }
    }
  };

  self.timer.initWithCallback(timerCallback, 5*60*1000, self.timer.TYPE_REPEATING_SLACK);

  try {
    this.storage.load();
  } catch (e) {
    this.reset();
    this.commit();
    window.setTimeout(function(){
      self.storage.load();
    }, 200);
  }
}

mpagespace.model.prototype = {
  GET_PAGES_ARRAY: 1,

  GET_PAGES_TITLE: 2,

  GET_PAGES_ID: 3,

  init: function() {
    this.config = this.storage.getData();
    var confAdapted = false;

    if (this.config == null) {
      this.loaded = false;
      return;
    }

    if (this.config.version != mpagespace.version) {
      this.adaptConfiguration();
      confAdapted = true;
    }

    this.preferences = new mpagespace.model.preferences(this.config.preferences);
    this.colorSchemes = new mpagespace.model.colors(this.config.colorSchemes, this);
    this.sync = new mpagespace.model.sync(this.config.sync, this);

    this.maxPageId = 0;
    this.maxWidgetId = 0;

    for (var pKey in this.config.pages) {
      var page = new mpagespace.model.page(this.config.pages[pKey], this);
      this.pages[page.id] = page;
      
      if (page.id > this.maxPageId) 
        this.maxPageId = page.id;
      for (var i=0, widgets = page.getWidgets(page.GET_WIDGETS_ARRAY); i<widgets.length; i++) 
        if (widgets[i].id > this.maxWidgetId)
          this.maxWidgetId = widgets[i].id;
    }

    if (confAdapted && this.maxWidgetId == 0 && !this.restoreInProgress) {
      mpagespace.dump('model.init: Possible configuration error, trying to restore.');
      this.storage.restore();
      this.restoreInProgress = true;
      this.dirty = true;
      this.activePageId = null;
      this.storage.load();
      return;
    }

    delete this.restoreInProgress;
    this.loaded = true;

    mpagespace.dump('model.init: Done');
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'model-loaded');  
  },

  close: function() {
    mpagespace.observerService.removeObserver(this.observer, 'mpage-storage');
  },

  getConfig: function() {
    if (this.isDirty()) {
      for (var pageId in this.pages) {
        this.config.pages['page-' + pageId] = this.pages[pageId].getConfig();
      }
      this.config.preferences = this.preferences.getConfig();
      this.config.colorSchemes = this.colorSchemes.getConfig();
      this.config.sync = this.sync.getConfig();
    }
    return this.config; 
  },

  isDirty: function() {
    return this.dirty == true;
  },

  setDirty: function() {
    this.dirty = true;
  },

  commit: function() {
    if (this.isDirty()) {
      this.storage.save(this.getConfig());
      this.dirty = false;
    }
    mpagespace.dump('model.commit: Done');
  },

  changeActivePage: function(pageId) {
    var page;
    page = this.getPage();
    if (page != null) {
      page.releaseMemory();
    }
    this.activePageId = null;
    if (pageId == null) {
      pageId = this.config.pageOrder[0];
    } 
    page = this.getPage(pageId);
    this.activePageId = page.id;
    page.load();
    
    mpagespace.dump('model.changeActivePage: Active page is ' + pageId);
  },

  moveWidgetToPage: function(widget, pageId) {
    this.getPage(widget.page.id).deleteWidget(widget);
    this.getPage(pageId).addWidget(widget);
    this.dirty = true;
  },

  getPage: function(pageId) {
    if (pageId == null) { 
      if (this.activePageId)
        return this.pages[this.activePageId];
      else
        return null;
    } else {
      if (this.pages[pageId] == null) {
        mpagespace.dump('model.getPage: Page ' + pageId + ' does not exists.');
        throw new Error('Page ' + pageId + ' does not exists.');
      }
      return this.pages[pageId];
    }
  },

  getPages: function(mode) {
    var result;
    if (mode == this.GET_PAGES_ARRAY) {
      result = [];
      var pageOrder = this.getPageOrder();
      for (var i=0; i<pageOrder.length; i++) {
        result.push(this.pages[pageOrder[i]]);
      }
      return result;
    } else if (mode == this.GET_PAGES_TITLE) {
      result = {};
      var pageOrder = this.getPageOrder();
      for (var i=0; i<pageOrder.length; i++) {
        var p = this.pages[pageOrder[i]];
        result[p.title] = p;
      }
      return result;
    } else {
      return this.pages;
    }
  },

  getPageOrder: function() {
    return this.config.pageOrder;
  },

  setPageOrder: function(order) {
    this.config.pageOrder = order;
    this.dirty = true;
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-reordered');  
  },

  getNextPageId: function() {
    this.maxPageId++;
    return this.maxPageId;
  },

  getNextWidgetId: function() {
    this.maxWidgetId++;
    return this.maxWidgetId;
  },

  deletePage: function(pageId) {
    if (this.config.pageOrder.length == 1) {
      mpagespace.dump('model.deletePage: The last page.');
      mpagespace.observerService.notifyObservers(null, 'mpage-model', 'alert:' + mpagespace.translate('deletePage.error.message'));  
      throw new Error(mpagespace.translate('deletePage.error.message'));
    }

    if (pageId == null) 
      pageId = this.activePageId;

    var page = this.getPage(pageId);
    var idx = this.config.pageOrder.indexOf(pageId);
    this.config.pageOrder.splice(idx, 1);
    delete this.pages[pageId];
    delete this.config['page-' + pageId];  
    mpagespace.dump('model.deletePage: Page ' + pageId + ' is deleted.');
    if (this.activePageId == pageId) {
      this.changeActivePage();
    }
    this.dirty = true;
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-deleted');  
  },

  addPage: function(pageTitle, refPage) {
    if (pageTitle == '') {
      mpagespace.dump('model.addPage: Page title cannot be an empty string.');
      mpagespace.observerService.notifyObservers(null, 'mpage-model', 'alert:' + mpagespace.translate('error.emptyName.message'));  
      throw new Error(mpagespace.translate('error.emptyName.message'));
    }
    var pageOrder = this.getPageOrder();
    var refPageIdx = null;
    for (var i=0; i<pageOrder.length; i++) {
      if (this.getPage(pageOrder[i]).title == pageTitle) {
        mpagespace.dump('model.addPage: Page with the same name already exists.');
        mpagespace.observerService.notifyObservers(null, 'mpage-model', 'alert:' + mpagespace.translate('addPage.error.message'));  
        throw new Error(mpagespace.translate('addPage.error.message'));
      }
      if (refPage && pageOrder[i] == refPage.id) {
        refPageIdx = i;
      }
    }

    var pageConfig = {
      pageId: this.getNextPageId(),
      title: pageTitle,
      widgets: []
    };
    var page = new mpagespace.model.page(pageConfig, this);
    this.config.pages['page-' + page.id] = page.getConfig();
    this.pages[page.id] = page;
    if (refPageIdx != null) {
      this.config.pageOrder.splice(refPageIdx + 1, 0, page.id);
    } else {
      this.config.pageOrder.push(page.id);
    }
    this.dirty = true;
    mpagespace.dump('model.addPage: Done');
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-added');  
    return page;
  },

  renamePage: function(pageId, newTitle) {
    var page = this.getPage(pageId);
    var pageOrder = this.getPageOrder();
    for (var i=0; i<pageOrder.length; i++) {
      if (pageOrder[i] != pageId && this.getPage(pageOrder[i]).title == newTitle) {
        mpagespace.dump('model.renamePage: Page with the same name already exists.');
        mpagespace.observerService.notifyObservers(null, 'mpage-model', 'alert:' + mpagespace.translate('renamePage.error.message'));  
        throw new Error(mpagespace.translate('renamePage.error.message'));
      }
    }
    page.title = newTitle;
    this.dirty = true;
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-renamed');  
  },

  findWidget: function(widgetId) {
    var pageOrder = this.getPageOrder();
    for (var i=0; i<pageOrder.length; i++) {
      var p = this.pages[pageOrder[i]];
      var w = p.getWidget(widgetId);
      if (w != null)
        return w;
    }
    return null;
  },

  setPreferences: function(preferences, temp) {
    if (temp) {
      this.preferencesTmp = preferences;
    } else {
      this.preferences = preferences;
      this.preferencesTmp = null;
      this.setDirty();
    }
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'preferences-changed');  
  },

  acceptTempPreferences: function() {
    if (this.preferencesTmp) {
      this.preferences = this.preferencesTmp;
      this.preferencesTmp = null;
      this.setDirty();
    }
  },

  getPreferences: function() {
    return this.preferencesTmp || this.preferences;
  },

  getColorSchemes: function() {
    return this.colorSchemes;
  },

  getSync: function() {
    return this.sync;
  },

  adaptConfiguration: function() {
    var oldConfig = this.config;
    var panelId;

    for (panelId in oldConfig) {
      if (['1', '2', '3'].indexOf(panelId) == -1) {
        mpagespace.dump('model.adaptConfiguration: Invalid old configuration. Exiting...');
        return; 
      }
    }

    this.empty();
    this.loaded = false;
    
    try {
      for (panelId in oldConfig) {
        var panel = oldConfig[panelId];
        if (['1', '2', '3'].indexOf(panelId) == -1)
          throw new Error('Invalid old configuration.');
        for (var i=0; i<panel.length; i++) {
          var widget = panel[i];

          widget.widgetId = widget.id;
          delete widget.id;
          widget.panelId = panelId;
          this.config.pages['page-' + this.activePageId].widgets.push(widget);
        }
      }
      mpagespace.dump('model.adaptConfiguration: Done');
    } catch (e) {
      mpagespace.dump('model.adaptConfiguration: Failed');
    }
  },

  empty: function() {
    this.config = {
      version: mpagespace.version, 
      sync: null,
      pageOrder: [], 
      pages: {}
    };
    this.preferences = new mpagespace.model.preferences({});
    this.preferencesTmp = null;
    this.colorSchemes = new mpagespace.model.colors({}, this);
    this.sync = new mpagespace.model.sync({}, this);
    this.pages = {};
    this.maxWidgetId = 0;
    this.maxPageId = 0;
    this.activePageId = this.addPage('News').id;
    this.loaded = true;
    mpagespace.dump('model.empty: Done');
  },

  reset: function() {
    this.empty();
    var page = this.getPage();

    page.createAndAddWidget('http://blog.mozilla.com/feed/', null, null);
    page.createAndAddWidget('http://www.reddit.com/r/worldnews/.rss', null, null);
    page.createAndAddWidget('http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml', null, null);
    page.createAndAddWidget('http://feeds.guardian.co.uk/theguardian/rss', null, null);
    page.load();

    page = this.addPage('Technology');
    page.createAndAddWidget('http://feeds.arstechnica.com/arstechnica/everything', null, null);
    page.createAndAddWidget('http://rss.slashdot.org/Slashdot/slashdot', null, null);
    page.createAndAddWidget('http://feeds.wired.com/wired/index', null, null);
    page.createAndAddWidget('http://www.reddit.com/r/technology/.rss', null, null);
    page.createAndAddWidget('http://www.reddit.com/r/programming/.rss', null, null);
    page.load();

    page = this.addPage('Music');
    page.createAndAddWidget('http://www.mtv.com/rss/news/news_full.jhtml', null, null);
    page.createAndAddWidget('http://www.spin.com/news/rss/', null, null);
    page.createAndAddWidget('http://www.rollingstone.com/siteServices/rss/allNews', null, null);
    page.createAndAddWidget('http://pitchfork.com/rss/news/', null, null);
    page.createAndAddWidget('http://feeds.feedburner.com/stereogum/cBYa?format=xml', null, null);
    page.createAndAddWidget('http://www.reddit.com/r/Music/.rss', null, null);
    page.load();

    page = this.addPage('Science');
    page.createAndAddWidget('http://www.sciencenews.org/view/feed/name/allrss', null, null);
    page.createAndAddWidget('http://feeds.sciencedaily.com/sciencedaily?format=xml', null, null);
    page.createAndAddWidget('http://feeds.guardian.co.uk/theguardian/science/rss', null, null);
    page.createAndAddWidget('http://www.nasa.gov/rss/breaking_news.rss', null, null);
    page.createAndAddWidget('http://www.reddit.com/r/science/.rss', null, null);
    page.load();

    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'model-reset');  
  }
}



