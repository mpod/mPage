if (!mpage.view) mpage.view = {};
else if (typeof mpage.view != 'object')
  throw new Error('mpage.view already exists and is not an object');

mpage.view = {
  htmlNS: 'http://www.w3.org/1999/xhtml',

  modelChangedObserver: {
    observe : function(subject, topic, data) {  
      if (topic == 'mpage-model-changed') {  
        var self = mpage.view;
        var widget;
        mpage.dump('event: ' + data);
        data = data.split(':');
        widget = mpage.model.getWidget(data[1]);
        switch (data[0]) {
          case 'widget-changed-id': 
            self.updateWidgetId(data[1], data[2]);
            break;
          case 'widget-removed':
            self.removeWidget(widget);
            break;
          case 'widget-inserted-to-panel':
            self.draw(widget, false);
            break;
          default:
            self.draw(widget, true);
        }
      }  
    }
  },

  registerObserver: function() {
    mpage.observerService.addObserver(mpage.view.modelChangedObserver, 'mpage-model-changed', false); 
  },

  unregisterObserver: function() {
    mpage.observerService.removeObserver(mpage.view.modelChangedObserver, 'mpage-model-changed');
  },

  removeWidget: function(widget) {
    var self = mpage.view;
    var widgetEl = self.getWidgetEl(widget.id);  
    widgetEl.parentNode.removeChild(widgetEl);
  },

  getWidgetEl: function(widgetId) {
    return document.getElementById('widget-' + widgetId);
  },

  updateWidgetId: function(oldId, newId) {
    var widgetEl = mpage.view.getWidgetEl(oldId);
    if (widgetEl) {
      widgetEl.setAttribute('id', 'widget-' + newId);
      widgetEl.setAttribute('widget-id', newId);
    }
  },

  getWidgetId: function(el) {
    for (var n=el; n; n=n.parentNode) {
      if (n.className && n.className.indexOf('widget') != -1) {
        return n.getAttribute('widget-id');
      }  
    } 
    return null;
  },

  removeWidget: function(widget) {
    var widgetEl = mpage.view.getWidgetEl(widget.id);
    widgetEl.parentNode.removeChild(widgetEl);
  },

  draw: function(widget, refresh) {
    var panelEl;
    var panel;

    if (widget) {
      var widgetEl = document.getElementById('widget-' + widget.id);
      panelEl = document.getElementById('panel-' + widget.panelId);   
      panel = mpage.model.layout[widget.panelId];
      if (widgetEl && refresh) {
        widgetEl.parentNode.removeChild(widgetEl);
        widgetEl = null;
      }
      if (!widgetEl) {
        widgetEl = mpage.view.createWidgetEl(widget);
      }
      for (var i=0; i<panel.length; i++) {
        if (panel[i] == widget.id) {
          var refWidgetEl = document.getElementById('widget-' + panel[i+1]);
          if (refWidgetEl) {
            panelEl.insertBefore(widgetEl, refWidgetEl);
          } else {
            panelEl.appendChild(widgetEl);
          }
          break;
        }
      }
    } else {
      var widgets = mpage.model.widgets;
      var layout = mpage.model.layout;
      
      for (var panelId in layout) {
        panelEl = document.getElementById('panel-' + panelId);
        var n1, n2;
        n1 = panelEl.firstChild;
        while (n1) {
          n2 = n1.nextSibling;
          if (n1.className == 'widget') panelEl.removeChild(n1);
          n1 = n2;
        }
        var widgetIds = layout[panelId];
        for (var i=0; i<widgetIds.length; i++) {
          var widget = widgets[widgetIds[i]];
          if (widget) panelEl.appendChild(mpage.view.createWidgetEl(widget));
        }
      } 
    }
  },

  createWidgetEl: function(widget) {
    var self = mpage.view;
    var widgetEl = document.createElementNS(self.htmlNS, 'html:div');
    var headerEl = document.createElementNS(self.htmlNS, 'html:div');
    var bodyEl = document.createElementNS(self.htmlNS, 'html:div');
    var listEl = document.createElementNS(self.htmlNS, 'html:ul');
    var titleEl = document.createElementNS(self.htmlNS, 'html:a');

    widgetEl.setAttribute('class', 'widget');
    widgetEl.setAttribute('id', 'widget-' + widget.id);
    widgetEl.addEventListener('dragstart', mpage.dd.dragStart, false);
    widgetEl.addEventListener('dragend', mpage.dd.dragEnd, false);
    widgetEl.addEventListener('dragover', mpage.dd.dragOver, false);
    widgetEl.setAttribute('widget-id', widget.id);
    headerEl.setAttribute('class', 'header');
    titleEl.setAttribute('class', 'title');
    if (widget.siteUrl) {
        titleEl.setAttribute('target', '_blank');
        titleEl.setAttribute('href', widget.siteUrl);
        titleEl.addEventListener('click', function(){this.blur();}, false); 
    }
    titleEl.appendChild(document.createTextNode(widget.title));

    headerEl.appendChild(titleEl);

    var el;
    el = document.createElementNS(self.htmlNS, 'html:div');
    el.setAttribute('class', 'action configure');
    el.addEventListener('click', mpage.controller.configure, false);
    headerEl.appendChild(el);
    el = document.createElementNS(self.htmlNS, 'html:div');
    el.setAttribute('class', 'action remove');
    el.addEventListener('click', mpage.controller.remove, false);
    headerEl.appendChild(el);

    widgetEl.appendChild(headerEl);
    bodyEl.setAttribute('class', 'body');

    if (widget.initialized == true) {
      bodyEl.appendChild(self.createFeedBody(widget));
    } else {
      bodyEl.appendChild(self.createLoadingBody());  
      /*widget.load(function(){
        bodyEl.replaceChild(mpage.view.createFeedBody(widget), bodyEl.firstChild);  
        titleEl.replaceChild(document.createTextNode(widget.title), titleEl.firstChild); 
        //titleEl.setAttribute('href', widget.link);
      });*/
    }

    widgetEl.appendChild(bodyEl);
    return widgetEl;
  },

  createLoadingBody: function() {
    var self = mpage.view;
    var divEl = document.createElementNS(self.htmlNS, 'html:div');  
    divEl.setAttribute('class', 'loading');
    var strbundle = document.getElementById('labels');
    var titleTextEl = document.createTextNode(strbundle.getString('loading.label'));
    divEl.appendChild(titleTextEl);
    return divEl;
  }, 

  createFeedBody: function(feed) {
    var self = mpage.view;
    var listEl = document.createElementNS(self.htmlNS, 'html:ul');

    if (feed.inError) return self.createErrorBody();

    for (var i=0; i<feed.entries.length && i<feed.entriesToShow; i++) {
      var entry = feed.entries[i];
      var entryEl = document.createElementNS(self.htmlNS, 'html:li');
      var linkEl = document.createElementNS(self.htmlNS, 'html:a');
      linkEl.setAttribute('href', entry.link);
      linkEl.setAttribute('target', '_blank');
      linkEl.addEventListener('click', function(){this.blur();}, false); 
      linkEl.appendChild(document.createTextNode(entry.title));
      entryEl.appendChild(linkEl);
      if (entry.link2) {
          var link2El = document.createElementNS(self.htmlNS, 'html:a');
          link2El.setAttribute('href', entry.link2);
          link2El.setAttribute('target', '_blank');
          link2El.appendChild(document.createTextNode('#'));
          link2El.addEventListener('click', function(){this.blur();}, false); 
          entryEl.appendChild(document.createTextNode(' '));
          entryEl.appendChild(link2El);
      }
      listEl.appendChild(entryEl);
    }

    return listEl;
  },

  createErrorBody: function() {
    var self = mpage.view;
    var divEl = document.createElementNS(self.htmlNS, 'html:div');  
    divEl.className = 'error';
    var strbundle = document.getElementById('labels');
    var titleTextEl = document.createTextNode(strbundle.getString('widget.error.message'));
    divEl.appendChild(titleTextEl);
    return divEl;  
  }
}

