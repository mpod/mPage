if (!mpage.view) mpage.view = {};
else if (typeof mpage.view != 'object')
  throw new Error('mpage.view already exists and is not an object');

mpage.view = {
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

  init: function() {
    var strbundle = document.getElementById('labels');
    var html = [
      '<html>',
      '  <head>',
      '  <link rel="stylesheet" type="text/css" href="chrome://mpage/skin/mpage.css"/>',
      '  </head>',
      '  <body class="kellys">',
      '    <table class="container">',
      '      <tr>',
      '        <td id="panel-1" class="column first"></td>',
      '        <td id="panel-2" class="column"></td>',
      '        <td id="panel-3" class="column">',
      '          <div class="toolbar">',
      '            <input id="subscribe-url" type="text" placeholder="' + strbundle.getString('placeholder.label') + '" name="subscribe" />',
      '            <div class="button" id="subscribe-button">' + strbundle.getString('subscribe.label') + '</div>',
      '            <a href="#" id="theme-link">' + strbundle.getString('theme.label') + '</a>',
      '            <a href="#" id="about-link">' + strbundle.getString('about.label') + '</a>',
      '            <div style="clear: both;"></div>',
      '          </div>',
      '        </td>',
      '      </tr>',
      '    </table>',
      '  </body>',
      '</html>'];

    var iframeEl = document.getElementById('container');
    var doc = iframeEl.contentWindow.document;
    doc.open();
    doc.write(html.join(''));
    doc.close();

    var el = doc.getElementById('panel-1');
    el.addEventListener('dragover', mpage.dd.dragOver, false);
    el = doc.getElementById('panel-2');
    el.addEventListener('dragover', mpage.dd.dragOver, false);
    el = doc.getElementById('panel-3');
    el.addEventListener('dragover', mpage.dd.dragOver, false);
    el = doc.getElementById('subscribe-button');
    el.addEventListener('click', mpage.controller.subscribe, false);
    el = doc.getElementById('theme-link');
    el.addEventListener('click', mpage.controller.changeTheme, false);
    el = doc.getElementById('about-link');
    el.addEventListener('click', mpage.controller.openAbout, false);
    el = doc.getElementById('subscribe-url');
    el.addEventListener('keydown', mpage.controller.handleReturnKey, false);
  },

  getDoc: function() {
    return document.getElementById('container').contentWindow.document;  
  },

  registerObserver: function() {
    mpage.observerService.addObserver(mpage.view.modelChangedObserver, 'mpage-model-changed', false); 
  },

  unregisterObserver: function() {
    mpage.observerService.removeObserver(mpage.view.modelChangedObserver, 'mpage-model-changed');
  },

  changeTheme: function(theme) {
    mpage.view.getDoc().body.className = theme; 
  },

  getTheme: function() {
    return mpage.view.getDoc().body.className;
  },

  removeWidget: function(widget) {
    var self = mpage.view;
    var widgetEl = self.getWidgetEl(widget.id);  
    widgetEl.parentNode.removeChild(widgetEl);
  },

  getWidgetEl: function(widgetId) {
    return mpage.view.getDoc().getElementById('widget-' + widgetId);
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
    var doc = mpage.view.getDoc();

    if (widget) {
      var widgetEl = doc.getElementById('widget-' + widget.id);
      panelEl = doc.getElementById('panel-' + widget.panelId);   
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
      var widgets = mpage.model.widgets;
      var layout = mpage.model.layout;
      
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
          if (widget) panelEl.appendChild(mpage.view.createWidgetEl(widget));
        }
      } 
    }
  },

  createWidgetEl: function(widget) {
    var self = mpage.view;
    var doc = self.getDoc();
    var widgetEl = doc.createElement('div');
    var headerEl = doc.createElement('div');
    var bodyEl = doc.createElement('div');
    var listEl = doc.createElement('ul');
    var titleEl = doc.createElement('a');

    widgetEl.setAttribute('class', 'widget');
    widgetEl.setAttribute('id', 'widget-' + widget.id);
    widgetEl.setAttribute('draggable', 'true');
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
    titleEl.appendChild(doc.createTextNode(widget.title));

    headerEl.appendChild(titleEl);

    var el;
    el = doc.createElement('div');
    el.setAttribute('class', 'action configure');
    el.addEventListener('click', mpage.controller.configure, false);
    headerEl.appendChild(el);
    el = doc.createElement('div');
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
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.setAttribute('class', 'loading');
    var strbundle = document.getElementById('labels');
    var titleTextEl = doc.createTextNode(strbundle.getString('loading.label'));
    divEl.appendChild(titleTextEl);
    return divEl;
  }, 

  createFeedBody: function(feed) {
    var self = mpage.view;
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
    var self = mpage.view;
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.className = 'error';
    var strbundle = doc.getElementById('labels');
    var titleTextEl = doc.createTextNode(strbundle.getString('widget.error.message'));
    divEl.appendChild(titleTextEl);
    return divEl;  
  }
}

