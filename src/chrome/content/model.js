// Author: Matija Podravec, 2012.

if (!mpagespace.model) mpagespace.model = {};
else if (typeof mpagespace.model != 'object')
  throw new Error('mpagespace.model already exists and is not an object');

mpagespace.model = {
  observer: {
    observe: function(subject, topic, data) {  
      if (topic == 'mpage-storage-changed') {  
        var self = mpagespace.model;
        mpagespace.dump('event: ' + topic + '/' + data);
        switch (data) {
          case 'data-loaded': 
            self.load();
            break;
          default:
            break;
        }
      }  
    }
  },

  widgets: {},

  layout: {},

  pageId: null,

  init: function(pageId) {
    if (pageId) {
      mpagespace.model.pageId = pageId;
    } else {
      // find Home page
      mpagespace.model.pageId = 1;
    }
    mpagespace.observerService.addObserver(mpagespace.model.observer, 'mpage-storage-changed', false); 
    mpagespace.model.load();
  },

  close: function() {
    mpagespace.storage.getStorage().close();
    mpagespace.observerService.removeObserver(mpagespace.model.observer, 'mpage-storage-changed');
  },

  commit: function(widget) {
    var storage = mpagespace.storage.getStorage();
    var data = storage.getData();
    var self = mpagespace.model;

    var page = data.pages['page-' + mpagespace.model.pageId];
    var i, widget;
    page.widgets = [];
    for(var panelId in self.layout) {
      var panel = self.layout[panelId];  
      for (var i=0; i<panel.length; i++) {
        var widget = self.widgets[panel[i]];
        page.widgets.push(widget.getConfig());
      }
    }

    mpagespace.storage.getStorage().save(data);
  },

  load: function() {
    var data = mpagespace.storage.getStorage().getData();
    var self = mpagespace.model;

    if (data == null) {
      mpagespace.dump('model.load: storage not loaded.');
      mpagespace.storage.getStorage().load();
      return;
    }

    self.widgets = {};
    self.layout = {'1': [], '2': [], '3': []};
    var widgetsConf = data.pages['page-' + self.pageId].widgets;
    for (var i=0; i<widgetsConf.length; i++) {
      var wConf = widgetsConf[i];
      var widget = new mpagespace.feed(wConf.widgetId, wConf.url, wConf.panelId, wConf.entriesToShow);
      self.widgets[widget.id] = widget;
      self.layout[widget.panelId].push(widget.id);
      widget.load();
    }
    mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'model-loaded'); 
  },

  getWidget: function(id) {
    var widget = mpagespace.model.widgets[id];   
    return widget;
  },

  getNextWidgetId: function() {
    return mpagespace.storage.getStorage().getNextWidgetId();
  },
  
  insertToPanel: function(widget, panelId, refWidget) {
    var self = mpagespace.model;
    var panel, index;

    if (refWidget && refWidget.id == widget.id) return;

    self.removeFromPanel(widget);

    panel = self.layout[panelId];
    widget.panelId = panelId;
    index = refWidget ? null : panel.length;
    for (var i=0; i<panel.length && refWidget; i++) {
      if (panel[i] == refWidget.id) {
        index = i;
      }  
    } 
    if (index == null) throw new Error('Invalid model - reference widget not in panel.');
    panel.splice(index, 0, widget.id);
    self.commit();
    mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-inserted-to-panel:' + widget.id);  
  },

  removeFromPanel: function(widget) {
    var self = mpagespace.model;
    var panel, index;

    if (widget.panelId != null) {
      panel = self.layout[widget.panelId];
      index = null;
      for (var i=0; i<panel.length; i++) {
        if (panel[i] == widget.id) {
          index = i;
          break;
        }  
      } 
      if (index == null) throw new Error('Invalid model - widget not in panel.');
      panel.splice(index, 1);
    }   
  },

  remove: function(widget) {
    var self = mpagespace.model;
    var panel, index;

    self.removeFromPanel(widget);
    widget.deleted = true;
    self.commit();
    mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-removed:' + widget.id);  
  },

  reset: function() {
    mpagespace.storage.getStorage().reset();
  }
}



