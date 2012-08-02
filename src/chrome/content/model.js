// Author: Matija Podravec, 2012.

if (!mpagespace.model) mpagespace.model = {};
else if (typeof mpagespace.model != 'object')
  throw new Error('mpagespace.model already exists and is not an object');

mpagespace.model = function(){
  this.storage = mpagespace.storage.storageFactory();
  this.activePageId = null;
  this.pages = {};
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

    if (this.config == null) {
      this.loaded = false;
      return;
    }

    if (this.config.version != mpagespace.version) {
      this.adaptConfiguration();
    }

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
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'active-page-changed');  
  },

  moveWidgetToPage: function(widget, pageId) {
    this.getPage().deleteWidget(widget);
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
      throw new Error(mpagespace.translate('deletePage.error.message'));
    }

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

  addPage: function(pageTitle) {
    var pageOrder = this.getPageOrder();
    for (var i=0; i<pageOrder.length; i++) {
      if (this.pages[pageOrder[i]].title == pageTitle) {
        mpagespace.dump('model.addPage: Page with the same name already exists.');
        throw new Error(mpagespace.translate('addPage.error.message'));
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
    this.config.pageOrder.push(page.id);
    this.dirty = true;
    mpagespace.dump('model.addPage: Done');
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-added');  
    return page;
  },

  renamePage: function(pageId, pageTitle) {
    var page = this.getPage(pageId);
    page.title = pageTitle;
    this.dirty = true;
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-renamed');  
  },

  empty: function() {
    this.config = {
      version: mpagespace.version, 
      pageOrder: [], 
      pages: {}
    };
    this.pages = {};
    this.maxWidgetId = 0;
    this.maxPageId = 0;
    this.activePageId = this.addPage('Home').id;
    this.loaded = true;
    mpagespace.dump('model.empty: Done');
  },

  adaptConfiguration: function() {
    var oldConfig = this.config;
    
    this.empty();
    this.loaded = false;
    
    for (var panelId in oldConfig) {
      var panel = oldConfig[panelId];
      for (var i=0; i<panel.length; i++) {
        var widget = panel[i];

        widget.widgetId = widget.id;
        delete widget.id;
        widget.panelId = panelId;
        this.config.pages['page-' + this.activePageId].widgets.push(widget);
      }
    }
  },

  reset: function() {
    this.empty();
    var page = this.getPage();
    page.createAndAddWidget('http://blog.mozilla.com/feed/', false, false);
    page.createAndAddWidget('http://www.reddit.com/r/worldnews/', false, false);
    page.createAndAddWidget('http://rss.slashdot.org/Slashdot/slashdot', false, false);
    page.createAndAddWidget('http://feeds.wired.com/wired/index', false, false);
    page.createAndAddWidget('http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml', false, false);
    page.createAndAddWidget('http://feeds.guardian.co.uk/theguardian/rss', false, false);
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'model-reset');  
  }
}



