'use strict';

let Page = function(config, model) {
  this.model = model;
  this.widgets = {};
  this.title = config.title;
  this.id = config.pageId;
  this.layout = {};
  this.dirty = false;

  for (var i=0; i<config.widgets.length; i++) {
    var widget = new Feed(config.widgets[i], this);
    this.widgets[widget.id] = widget;
    if (widget.panelId in this.layout) 
      this.layout[widget.panelId].push(widget.id);
    else
      this.layout[widget.panelId] = [widget.id];
  }
}

Page.prototype = {
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
    this.alignLayout();
    window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'page-loaded:' + this.id}));
  },

  getWidget: function(widgetId) {
    if (widgetId in this.widgets)
      return this.widgets[widgetId];   
    else
      return null;
  },

  getFirstWidget: function() {
    if ('1' in this.layout)
      return this.getWidget(this.layout[1][0]);
    else
      return null;
  },

  hasWidget: function(widgetId) {
    return this.widgets[widgetId] != null;
  },

  getWidgets: function(mode) {
    var result;

    if (mode == this.GET_WIDGETS_ARRAY) 
      result = [];
    else if (mode == this.GET_WIDGETS_URL) 
      result = {};
    else 
      result = this.widgets;

    for (var panelId in this.layout) {
      var panel = this.layout[panelId];
      for (var i=0; i<panel.length; i++) {
        var w = this.getWidget(panel[i]);
        if (mode == this.GET_WIDGETS_ARRAY) {
          result.push(w);
        } else if (mode == this.GET_WIDGETS_URL) {
          result[w.url] = w;
        }
      }
    }
    return result;
  },

  getWidgetsInPanel: function(panelId) {
    var result = [];

    if (panelId in this.layout) {
      for (var i=0; i<this.layout[panelId].length; i++) {
        result.push(this.getWidget(this.layout[panelId][i]));
      }
    }
    return result;
  },

  alignLayout: function() {
    var nPanelsReq = this.model.getPreferences().layout.numberOfPanels;
    var nPanels = 1;
    var panel, widget;
    var self = this;

    for (var panelId in this.layout) {
      nPanels = Math.max(nPanels, parseInt(panelId));
    }

    var minFilledPanel = function() {
      var minPanelLen = Number.MAX_VALUE;
      var panelId = 1;
      for (var i=1; i<=nPanelsReq; i++) {
        if (i in self.layout) {
          if (minPanelLen > self.layout[i].length) {
            minPanelLen = self.layout[i].length;
            panelId = i;
          } 
        } else {
          return i;
        }
      }
      return panelId;
    }

    if (nPanelsReq < nPanels) {
      for (var i=nPanelsReq+1; i<=nPanels; i++) {
        if (i in this.layout) {
          panel = this.layout[i];
          while (panel.length > 0) {
            widget = this.getWidget(panel[0]);
            this.removeFromPanel(widget);
            this.insertToPanel(widget, minFilledPanel(), null);
          }
          delete this.layout[i];
        }
      }
    }
  },

  insertToPanel: function(widget, panelId, refWidget) {
    var panel, index;

    if (refWidget && refWidget.id == widget.id) return;

    if (!parseInt(panelId)) panelId = 1;

    if ((panelId in this.layout) == false) {
      this.layout[panelId] = [];
    }
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
    window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-deleted:' + widget.id}));
  },

  createAndAddWidget: function(url, panelId, refWidget) {
    try {
      new URL(url);
    } catch(e) {
      window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'alert:' + Utils.translate('invalidUrl.message')}));
      throw new Error(Utils.translate('invalidUrl.message'));
    }

    var config = {
      widgetId: this.model.getNextWidgetId(),
      url: url
    };
    var widget = new Feed(config, this);
    this.setDirty();
    this.addWidget(widget, panelId, refWidget);
    console.log('page.createAndAddWidget: Done');

    return widget;
  },

  addWidget: function(widget, panelId, refWidget) {
    widget.page = this;
    this.widgets[widget.id] = widget;

    if (refWidget) {
      this.insertToPanel(widget, refWidget.panelId, refWidget);
    } else {
      if (panelId == null) {
        var nPanels = this.model.getPreferences().layout.numberOfPanels;
        var minPanelLen = Number.MAX_VALUE;
        panelId = 1;
        for (var i=1; i<=nPanels; i++) {
          if (i in this.layout) {
            if (minPanelLen > this.layout[i].length) {
              minPanelLen = this.layout[i].length;
              panelId = i;
            } 
          } else {
            panelId = i;
            break;
          }
        }
      }
      this.insertToPanel(widget, panelId, null);
      window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-added-to-page:' + widget.id}));
    }
  },

  moveWidget: function(widget, panelId, refWidget) {
    if (this.getWidget(widget.id) == null) 
      return;
    this.removeFromPanel(widget);
    this.insertToPanel(widget, panelId, refWidget);
    window.document.documentElement.dispatchEvent(new CustomEvent('mpage-model', {detail: 'widget-moved:' + widget.id}));
  },

  releaseMemory: function() {
    for (var widgetId in this.widgets) {
      this.widgets[widgetId].releaseMemory();
    }
  }
}

