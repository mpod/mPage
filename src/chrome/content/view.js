// Author: Matija Podravec, 2012.

if (!mpagespace.view) mpagespace.view = {};
else if (typeof mpagespace.view != 'object')
  throw new Error('mpagespace.view already exists and is not an object');

mpagespace.view = {
  modelChangedObserver: {
    observe : function(subject, topic, data) {  
      if (topic == 'mpage-model-changed') {  
        var self = mpagespace.view;
        var widget;
        mpagespace.dump('event: ' + data);
        data = data.split(':');
        widget = mpagespace.model.getWidget(data[1]);
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

  init: function() {
    var html = [
      '<html>',
      '  <head>',
      '  <link rel="stylesheet" type="text/css" href="chrome://mpagespace/skin/mpage.css"/>',
      '  </head>',
      '  <body class="kellys">',
      '    <table class="container">',
      '      <tr>',
      '        <td id="panel-1" class="column first"></td>',
      '        <td id="panel-2" class="column"></td>',
      '        <td id="panel-3" class="column">',
      '          <div class="toolbar">',
      '            <input id="subscribe-url" type="text" placeholder="' + mpagespace.translate('placeholder.label') + '" name="subscribe" />',
      '            <div class="button" id="subscribe-button">' + mpagespace.translate('subscribe.label') + '</div>',
      '            <a href="#" id="theme-link">' + mpagespace.translate('theme.label') + '</a>',
      '            <a href="#" id="about-link">' + mpagespace.translate('about.label') + '</a>',
      '            <div style="clear: both;"></div>',
      '          </div>',
      '        </td>',
      '      </tr>',
      '    </table>',
      '  </body>',
      '</html>'];

    var doc = mpagespace.view.getDoc();
    doc.open();
    doc.write(html.join(''));
    doc.close();

    var el = doc.getElementById('panel-1');
    el.addEventListener('dragover', mpagespace.dd.dragOver, false);
    el = doc.getElementById('panel-2');
    el.addEventListener('dragover', mpagespace.dd.dragOver, false);
    el = doc.getElementById('panel-3');
    el.addEventListener('dragover', mpagespace.dd.dragOver, false);
    el = doc.getElementById('subscribe-button');
    el.addEventListener('click', mpagespace.controller.subscribe, false);
    el = doc.getElementById('theme-link');
    el.addEventListener('click', mpagespace.controller.changeTheme, false);
    el = doc.getElementById('about-link');
    el.addEventListener('click', mpagespace.controller.openAbout, false);
    el = doc.getElementById('subscribe-url');
    el.addEventListener('keydown', mpagespace.controller.handleReturnKey, false);
  },

  getDoc: function() {
    return document.getElementById('mpagespace-container').contentWindow.document;  
  },

  registerObserver: function() {
    mpagespace.observerService.addObserver(mpagespace.view.modelChangedObserver, 'mpage-model-changed', false); 
  },

  unregisterObserver: function() {
    mpagespace.observerService.removeObserver(mpagespace.view.modelChangedObserver, 'mpage-model-changed');
  },

  changeTheme: function(theme) {
    mpagespace.view.getDoc().body.className = theme; 
  },

  getTheme: function() {
    return mpagespace.view.getDoc().body.className;
  },

  removeWidget: function(widget) {
    var self = mpagespace.view;
    var widgetEl = self.getWidgetEl(widget.id);  
    widgetEl.parentNode.removeChild(widgetEl);
  },

  getWidgetEl: function(widgetId) {
    return mpagespace.view.getDoc().getElementById('widget-' + widgetId);
  },

  updateWidgetId: function(oldId, newId) {
    var widgetEl = mpagespace.view.getWidgetEl(oldId);
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
    var widgetEl = mpagespace.view.getWidgetEl(widget.id);
    widgetEl.parentNode.removeChild(widgetEl);
  },

  draw: function(widget, refresh) {
    var panelEl;
    var panel;
    var doc = mpagespace.view.getDoc();

    if (widget) {
      var widgetEl = doc.getElementById('widget-' + widget.id);
      panelEl = doc.getElementById('panel-' + widget.panelId);   
      panel = mpagespace.model.layout[widget.panelId];
      if (widgetEl && refresh) {
        widgetEl.parentNode.removeChild(widgetEl);
        widgetEl = null;
      }
      if (!widgetEl) {
        widgetEl = mpagespace.view.createWidgetEl(widget);
      }
      for (var i=0; i<panel.length; i++) {
        if (panel[i] == widget.id) {
          var refWidgetEl = doc.getElementById('widget-' + panel[i+1]);
          if (refWidgetEl) {
            panelEl.insertBefore(widgetEl, refWidgetEl);
          } else {
            panelEl.appendChild(widgetEl);
          }
          break;
        }
      }
    } else {
      var widgets = mpagespace.model.widgets;
      var layout = mpagespace.model.layout;
      
      for (var panelId in layout) {
        panelEl = doc.getElementById('panel-' + panelId);
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
          if (widget) panelEl.appendChild(mpagespace.view.createWidgetEl(widget));
        }
      } 
    }
  },

  createWidgetEl: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var widgetEl = doc.createElement('div');
    var headerEl = doc.createElement('div');
    var bodyEl = doc.createElement('div');
    var listEl = doc.createElement('ul');
    var titleEl = doc.createElement('a');

    widgetEl.setAttribute('class', 'widget');
    widgetEl.setAttribute('id', 'widget-' + widget.id);
    widgetEl.setAttribute('draggable', 'true');
    widgetEl.addEventListener('dragstart', mpagespace.dd.dragStart, false);
    widgetEl.addEventListener('dragend', mpagespace.dd.dragEnd, false);
    widgetEl.addEventListener('dragover', mpagespace.dd.dragOver, false);
    widgetEl.setAttribute('widget-id', widget.id);
    headerEl.setAttribute('class', 'header');
    titleEl.setAttribute('class', 'title');
    if (widget.siteUrl) {
      titleEl.setAttribute('target', '_blank');
      titleEl.setAttribute('href', widget.siteUrl);
      titleEl.addEventListener('click', function(){this.blur();}, false); 
    }
    titleEl.appendChild(doc.createTextNode(widget.title));

    headerEl.appendChild(titleEl);

    var el;
    el = doc.createElement('div');
    el.setAttribute('class', 'action configure');
    el.addEventListener('click', mpagespace.controller.configure, false);
    headerEl.appendChild(el);
    el = doc.createElement('div');
    el.setAttribute('class', 'action remove');
    el.addEventListener('click', mpagespace.controller.remove, false);
    headerEl.appendChild(el);

    widgetEl.appendChild(headerEl);
    bodyEl.setAttribute('class', 'body');

    if (widget.initialized == true) {
      bodyEl.appendChild(self.createFeedBody(widget));
    } else {
      bodyEl.appendChild(self.createLoadingBody());  
    }

    widgetEl.appendChild(bodyEl);
    return widgetEl;
  },

  createLoadingBody: function() {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.setAttribute('class', 'loading');
    var titleTextEl = doc.createTextNode(mpagespace.translate('loading.label'));
    divEl.appendChild(titleTextEl);
    return divEl;
  }, 

  createFeedBody: function(feed) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var listEl = doc.createElement('ul');

    if (feed.inError) return self.createErrorBody();

    for (var i=0; i<feed.entries.length && i<feed.entriesToShow; i++) {
      var entry = feed.entries[i];
      var entryEl = doc.createElement('li');
      var linkEl = doc.createElement('a');
      linkEl.setAttribute('href', entry.link);
      linkEl.setAttribute('target', '_blank');
      linkEl.addEventListener('click', function(){this.blur();}, false); 
      linkEl.appendChild(doc.createTextNode(entry.title));
      entryEl.appendChild(linkEl);
      if (entry.link2) {
          var link2El = doc.createElement('a');
          link2El.setAttribute('href', entry.link2);
          link2El.setAttribute('target', '_blank');
          link2El.appendChild(doc.createTextNode('#'));
          link2El.addEventListener('click', function(){this.blur();}, false); 
          entryEl.appendChild(doc.createTextNode(' '));
          entryEl.appendChild(link2El);
      }
      listEl.appendChild(entryEl);
    }

    return listEl;
  },

  createErrorBody: function() {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.className = 'error';
    var titleTextEl = doc.createTextNode(mpagespace.translate('widget.error.message'));
    divEl.appendChild(titleTextEl);
    return divEl;  
  }
}

