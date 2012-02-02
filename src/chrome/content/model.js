// Author: Matija Podravec, 2012.

if (!mpagespace.model) mpagespace.model = {};
else if (typeof mpagespace.model != 'object')
  throw new Error('mpagespace.model already exists and is not an object');

mpagespace.model = {
  widgets: {},

  layout: {},

  tempIdSeq: 0,

  init: function() {
    mpagespace.storage.getStorage().load();
  },

  close: function() {
    mpagespace.storage.getStorage().close();
  },

  save: function(widget) {
    mpagespace.storage.getStorage().save(widget);
  },

  getNextTempId: function() {
    mpagespace.model.tempIdSeq++;
    return 'temp-' + mpagespace.model.tempIdSeq;
  },

  getWidget: function(id) {
    var widget = mpagespace.model.widgets[id];   
    return widget;
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
    mpagespace.storage.getStorage().save(widget);
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
    mpagespace.storage.getStorage().save(widget);
    mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-removed:' + widget.id);  
  },

  reset: function() {
    mpagespace.storage.getStorage().reset();
  }
}



