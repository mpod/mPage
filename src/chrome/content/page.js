// Author: Matija Podravec, 2012.

if (!mpagespace.model.page) mpagespace.model.page = {};
else if (typeof mpagespace.model.page != 'object')
  throw new Error('mpagespace.model.page already exists and is not an object');

mpagespace.model.page = function(config, model) {
  this.model = model;
  this.widgets = {};
  this.title = config.title;
  this.id = config.pageId;
  this.layout = {'1': [], '2': [], '3': []};
  this.dirty = false;

  for (var i=0; i<config.widgets.length; i++) {
    var widget = new mpagespace.model.feed(config.widgets[i], this);
    this.widgets[widget.id] = widget;
    this.layout[widget.panelId].push(widget.id);
  }
  mpagespace.observerService.notifyObservers(null, 'mpage-model', 'page-loaded:' + this.id); 
}

mpagespace.model.page.prototype = {
  GET_WIDGETS_ARRAY: 1,

  GET_WIDGETS_URL: 2,

  GET_WIDGETS_ID: 3,

  getConfig: function() {
    var config = {
      pageId: this.id,
      title: this.title,
      widgets: []
    }

    for (var panelId in this.layout) {
      var panel = this.layout[panelId];
      for (var i=0; i<panel.length; i++) {
        var w = this.getWidget(panel[i]);
        config.widgets.push(w.getConfig());
      }
    }

    return config;
  },

  isDirty: function() {
    return this.dirty == true;
  },

  setDirty: function() {
    this.dirty = true;
    this.model.setDirty();
  },

  load: function() {
    for (var widgetId in this.widgets) {
      this.widgets[widgetId].load();
    }
  },

  getWidget: function(widgetId) {
    return this.widgets[widgetId];   
  },

  getWidgets: function(mode) {
    var result;

    if (mode == this.GET_WIDGETS_ARRAY) {
      result = [];
      for (var panelId in this.layout) {
        var panel = this.layout[panelId];
        for (var i=0; i<panel.length; i++) {
          var w = this.getWidget(panel[i]);
          result.push(w);
        }
      }
      /*for (var widgetId in this.widgets) {
        result.push(this.widgets[widgetId]);
      }*/
      return result;
    } else if (mode == this.GET_WIDGETS_URL) {
      result = {};
      for (var widgetId in this.widgets) {
        var w = this.widgets[widgetId];
        result[w.url] = w;
      }
      return result;
    } else {
      return this.widgets;
    }
  },

  insertToPanel: function(widget, panelId, refWidget) {
    var panel, index;

    if (refWidget && refWidget.id == widget.id) return;

    panel = this.layout[panelId];
    widget.panelId = panelId;
    index = refWidget ? null : panel.length;
    for (var i=0; i<panel.length && refWidget; i++) {
      if (panel[i] == refWidget.id) {
        index = i;
      }  
    } 
    if (index == null) throw new Error('Invalid model - reference widget not in panel.');
    panel.splice(index, 0, widget.id);
    this.setDirty();
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-inserted-to-panel:' + widget.id);  
  },

  removeFromPanel: function(widget) {
    var panel, index;

    if (widget.panelId != null) {
      panel = this.layout[widget.panelId];
      index = null;
      for (var i=0; i<panel.length; i++) {
        if (panel[i] == widget.id) {
          index = i;
          break;
        }  
      } 
      if (index == null) throw new Error('Invalid model - widget not in panel.');
      panel.splice(index, 1);
      this.setDirty();
    }   
  },

  deleteWidget: function(widget) {
    widget.releaseMemory();
    this.removeFromPanel(widget);
    this.setDirty();
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-deleted:' + widget.id);  
  },

  createAndAddWidget: function(url, atBeginning, skipLoadWidget) {
    var config = {
      widgetId: this.model.getNextWidgetId(),
      url: url
    };
    var widget = new mpagespace.model.feed(config, this);
    this.setDirty();
    this.addWidget(widget, atBeginning);

    if (!skipLoadWidget)
      widget.load(true);

    return widget;
  },

  addWidget: function(widget, atBeginning) {
    this.widgets[widget.id] = widget;
    var panel = this.layout[1];
    var refWidget = null;
    if (atBeginning) {
      if (panel.length > 0) {
        refWidget = this.getWidget(panel[0]);
      }
      this.insertToPanel(widget, 1, refWidget);
    } else {
      var panelId;
      for (panelId in this.layout) {
        panelId = parseInt(panelId);
        panel = this.layout[panelId];
        if (panel.length <= this.layout[panelId % 3 + 1].length &&
            panel.length <= this.layout[(panelId + 1) % 3 + 1].length) {
          break;
        }
      }
      this.insertToPanel(widget, panelId, null);
    }
  },

  releaseMemory: function() {
    for (var widgetId in this.widgets) {
      this.widgets[widgetId].releaseMemory();
    }
  }
}

