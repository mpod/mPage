// Author: Matija Podravec, 2012.

if (!mpagespace.view) mpagespace.view = {};
else if (typeof mpagespace.view != 'object')
  throw new Error('mpagespace.view already exists and is not an object');

mpagespace.view = {
  observer: {
    observe : function(subject, topic, data) {  
      var self = mpagespace.view;

      if (topic == 'mpage-model') {  
        var widget;
        mpagespace.dump('view.observe: ' + topic + '/' + data);
        data = data.split(':');
        var page = mpagespace.app.getModel().getPage();
        switch (data[0]) {
          case 'widget-deleted':
            widget = page.getWidget(data[1]);
            self.removeWidget(widget);
            break;
          case 'widget-inserted-to-panel':
            widget = page.getWidget(data[1]);
            if (widget) {
              self.draw(widget, false);
            }
            break;
          case 'widget-loaded':
          case 'widget-loading-exception':
          case 'widget-error':
          case 'widget-changed':
            widget = page.getWidget(data[1]);
            if (widget) {
              self.draw(widget, true);
            }
            break;
          case 'page-loaded':
            if (page.id == data[1]) {
              self.draw(null);
            }
            break;
          case 'active-page-changed':
          case 'model-reset':
            self.draw(null);
            break;
          default:
            mpagespace.dump('view.observe: Event ignored!');
            break;
        }
      } else if (topic == 'mpage-app') {
        mpagespace.dump('view.observe: ' + topic + '/' + data);
        switch (data) {
          case 'faviconflag-changed':
            self.faviconFlag = mpagespace.app.getFaviconFlag();
            self.draw(null);
            break;
          case 'theme-changed':
            var theme = mpagespace.app.getTheme();
            var customCssFile = mpagespace.app.getCustomCssFile();
            self.setTheme(theme, customCssFile);
            break;  
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
      '    <img id="dd-feedback" src="chrome://mpagespace/skin/feedback.png" style="display:none;"/>',
      '    <table class="container">',
      '      <tr>',
      '        <td id="panel-1" class="column first"></td>',
      '        <td id="panel-2" class="column"></td>',
      '        <td id="panel-3" class="column">',
      '          <div class="toolbar">',
      '            <form id="subscribe-form" name="subscribe-form" onsubmit="return false;">',
      '            <input id="subscribe-url" type="text" placeholder="' + mpagespace.translate('placeholder.label') + '" name="subscribe" />',
      '            <input id="subscribe-button" type="submit" value="' + mpagespace.translate('subscribe.label') + '"/>',
      '            </form>',
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
    el.addEventListener('drop', mpagespace.dd.drop, false);
    el.addEventListener('dragenter', mpagespace.dd.dragEnter, false);
    el.addEventListener('dragleave', mpagespace.dd.dragLeave, false);
    el = doc.getElementById('panel-2');
    el.addEventListener('dragover', mpagespace.dd.dragOver, false);
    el.addEventListener('drop', mpagespace.dd.drop, false);
    el.addEventListener('dragenter', mpagespace.dd.dragEnter, false);
    el.addEventListener('dragleave', mpagespace.dd.dragLeave, false);
    el = doc.getElementById('panel-3');
    el.addEventListener('dragover', mpagespace.dd.dragOver, false);
    el.addEventListener('drop', mpagespace.dd.drop, false);
    el.addEventListener('dragenter', mpagespace.dd.dragEnter, false);
    el.addEventListener('dragleave', mpagespace.dd.dragLeave, false);
    el = doc.getElementById('subscribe-form');
    el.addEventListener('submit', mpagespace.controller.subscribe, false);

    mpagespace.view.faviconFlag = mpagespace.app.getFaviconFlag();
    var theme = mpagespace.app.getTheme();
    var customCssFile = mpagespace.app.getCustomCssFile();
    mpagespace.view.setTheme(theme, customCssFile);
  },

  getDoc: function() {
    return document.getElementById('mpagespace-container').contentWindow.document;  
  },

  registerObserver: function() {
    mpagespace.observerService.addObserver(mpagespace.view.observer, 'mpage-model', false); 
    mpagespace.observerService.addObserver(mpagespace.view.observer, 'mpage-app', false); 
  },

  unregisterObserver: function() {
    mpagespace.observerService.removeObserver(mpagespace.view.observer, 'mpage-model');
    mpagespace.observerService.removeObserver(mpagespace.view.observer, 'mpage-app');
  },

  setTheme: function(theme, customCssFile) {
    var doc = mpagespace.view.getDoc();
    doc.body.className = theme; 
    if (theme == 'custom') {
      var head = doc.getElementsByTagName('head')[0];
      while (head.getElementsByTagName('link').length > 1) {
        head.removeChild(head.lastChild);
      }

      var el = doc.createElement('link');
      el.setAttribute('rel', 'stylesheet');
      el.setAttribute('type', 'text/css');
      el.setAttribute('href', 'file://' + customCssFile);
      
      head.appendChild(el);
    }
  },

  getTheme: function() {
    return mpagespace.view.getDoc().body.className;
  },

  getWidgetEl: function(widgetId) {
    return mpagespace.view.getDoc().getElementById('widget-' + widgetId);
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
    var page = mpagespace.app.getModel().getPage();

    document.getElementById('main').setAttribute('title', 'mPage - ' + page.title);

    if (widget) {
      var widgetEl = doc.getElementById('widget-' + widget.id);
      panelEl = doc.getElementById('panel-' + widget.panelId);   
      panel = page.layout[widget.panelId];
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
      var widgets = page.widgets;
      var layout = page.layout;
      
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
          widget = widgets[widgetIds[i]];
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
    var el;

    widgetEl.setAttribute('class', 'widget');
    widgetEl.setAttribute('id', 'widget-' + widget.id);
    widgetEl.setAttribute('draggable', 'true');
    widgetEl.addEventListener('dragstart', mpagespace.dd.dragStart, false);
    widgetEl.addEventListener('dragend', mpagespace.dd.dragEnd, false);
    widgetEl.setAttribute('widget-id', widget.id);
    headerEl.setAttribute('class', 'header');
    titleEl.setAttribute('class', 'title');

    if (self.faviconFlag) {
      var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
      var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
                       .getService(Components.interfaces.nsIFaviconService);
      var uri;
      if (widget.siteUrl) {
        uri = faviconService.getFaviconImageForPage(ios.newURI(widget.siteUrl, null, null));
      } else {
        uri = faviconService.defaultFavicon;
      }
      el = doc.createElement('img');
      el.setAttribute('src', uri.spec);
      el.setAttribute('class', 'favicon');
      headerEl.appendChild(el);
    }

    if (widget.siteUrl) {
      titleEl.setAttribute('target', '_blank');
      titleEl.setAttribute('href', widget.siteUrl);
      titleEl.addEventListener('click', function(){this.blur();}, false); 
    }
    titleEl.appendChild(doc.createTextNode(widget.title));

    headerEl.appendChild(titleEl);

    el = doc.createElement('div');
    el.setAttribute('class', 'action configure');
    el.addEventListener('click', mpagespace.controller.configure, false);
    headerEl.appendChild(el);
    el = doc.createElement('div');
    el.setAttribute('class', 'action remove');
    el.addEventListener('click', mpagespace.controller.remove, false);
    headerEl.appendChild(el);
    el = doc.createElement('div');
    el.setAttribute('class', widget.minimized ? 'action maximize' : 'action minimize');
    el.addEventListener('click', mpagespace.controller.toggleWidget, false);
    headerEl.appendChild(el);

    widgetEl.appendChild(headerEl);
    bodyEl.setAttribute('class', 'body');
    bodyEl.hidden = widget.minimized;

    if (widget.isInitialized() == true) {
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

    if (feed.isInError()) return self.createErrorBody();

    var entries = feed.getEntriesToShow();
    for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
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

