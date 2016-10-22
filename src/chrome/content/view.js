// Author: Matija Podravec, 2012-2013

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
            if (widget) {
              self.removeWidget(widget);
            }
            break;
          case 'widget-added-to-page':
          case 'widget-moved':
            widget = page.getWidget(data[1]);
            if (widget) {
              self.draw(widget, false);
            }
            break;
          case 'widget-loaded':
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
              self.setActivePageOnToolbar();
            }
            break;
          case 'model-reset':
          case 'preferences-changed':
            self.createPanels();
            self.createToolbar();
            self.setStyles();
            self.draw(null);
            break;
          case 'model-loaded':
            self.createPanels();
            self.createToolbar();
            self.setStyles();
            break;
          case 'page-deleted':
          case 'page-added':
          case 'page-renamed':
          case 'page-reordered':
            self.createToolbar();
            break;
          case 'alert':
            self.alert(data[1]);
            break;
          default:
            mpagespace.dump('view.observe: Event ignored!');
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
      '  <style id="styles"></style>',
      '  </head>',
      '  <body>',
      '    <img id="dd-feedback" src="chrome://mpagespace/skin/feedback.png" style="display:none;"/>',
      '    <div id="message">',
      '      <div class="dialog">',
      '        <p></p>',
      '        <div class="button">[' + mpagespace.translate('close.label') + ']</div>',
      '      </div>',
      '    </div>',
      '    <div id="toolbar">',     
      '      <div id="nav-container">',
      '        <div id="nav-action-left">\u25C0</div>',
      '        <div class="nav-width-clip">',
      '          <div id="nav-drop-indicator-bar"></div>',
      '          <ul id="nav-list"></ul>',
      '        </div>',
      '        <div id="nav-action-right">\u25B6</div>',
      '      </div>',
      '      <div id="mpage-menu">\u273F',
      '        <ul id="mpage-menu-list" class="menu-list"></ul>',
      '      </div>',
      '    </div>', 
      '    <table id="page-container">',
      '      <tr id="panel-container"></tr>',
      '    </table>',
      '  </body>',
      '</html>'];

    var doc = mpagespace.view.getDoc();
    doc.open();
    doc.write(html.join(''));
    doc.close();

    var menu = doc.getElementById('nav-list');
    menu.addEventListener('dragover', mpagespace.dd.pageHandler.dragOver, false);
    menu.addEventListener('drop', mpagespace.dd.pageHandler.drop, false);
    menu.addEventListener('dragenter', mpagespace.dd.pageHandler.dragEnter, false);
    menu.addEventListener('dragleave', mpagespace.dd.pageHandler.dragLeave, false);

    var prepareScrollFunc = function(scrollLeft){
      return function(e) {
        let mleft = menu.style.marginLeft;
        if (mleft != '')
          mleft = parseInt(mleft.substring(0, mleft.length - 2));
        else
          mleft = 0;

        mleft = mleft + (scrollLeft ? 1 : -1) * 48;
        if (scrollLeft && mleft >= 0) {
          mleft = 0;
        } else if (!scrollLeft && menu.offsetWidth <= menu.parentNode.offsetWidth) {
          mleft = 0;
        } else if (!scrollLeft && menu.offsetWidth + mleft <= menu.parentNode.offsetWidth) {
          mleft = menu.parentNode.offsetWidth - menu.offsetWidth;
        }
        menu.style.marginLeft = mleft + 'px';
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    }

    var btn = doc.getElementById('nav-action-left');
    btn.addEventListener('mousedown', prepareScrollFunc(true), false);
    btn = doc.getElementById('nav-action-right');
    btn.addEventListener('mousedown', prepareScrollFunc(false), false);

    btn = doc.getElementById('message').querySelector('div.button');
    btn.addEventListener('mousedown', function() {doc.getElementById('message').style.display = 'none';}, false);

    mpagespace.view.createToolbarMenu();
    mpagespace.view.createToolbar();
    mpagespace.view.createPanels();
    mpagespace.view.setStyles();
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

  alert: function(message) {
    var doc = mpagespace.view.getDoc();

    var msgEl = doc.getElementById('message');
    var pEl = msgEl.querySelector('p');
    
    while (pEl.hasChildNodes()) pEl.removeChild(pEl.firstChild)
    var messageParts = message.split('<br/>');
    for (var i=0; i<messageParts.length; i++) {
      pEl.appendChild(doc.createTextNode(messageParts[i]));
      if (i < messageParts.length) {
        pEl.appendChild(doc.createElement('br'));
      }
    }
    msgEl.style.display = 'block';
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
    var doc = mpagespace.view.getDoc();
    var model = mpagespace.app.getModel();
    var page = model.getPage();
    var panelEl;
    var widgets;

    document.getElementById('main').setAttribute('title', 'mPage - ' + page.title);

    if (widget) {
      var widgetEl = doc.getElementById('widget-' + widget.id);
      panelEl = doc.getElementById('panel-' + widget.panelId);   
      if (panelEl == null) 
        throw new Error('Invalid model - panel not found.');
      if (widgetEl && refresh) {
        widgetEl.parentNode.removeChild(widgetEl);
        widgetEl = null;
      }
      if (!widgetEl) {
        widgetEl = mpagespace.view.createWidgetEl(widget);
      }
      widgets = page.getWidgetsInPanel(widget.panelId);
      for (var i=0; i<widgets.length; i++) {
        if (widgets[i].id === widget.id) {
          var refWidgetEl = null;
          if (widgets[i+1]) {
            refWidgetEl = doc.getElementById('widget-' + widgets[i+1].id);
          }
          if (refWidgetEl) {
            panelEl.insertBefore(widgetEl, refWidgetEl);
          } else {
            panelEl.appendChild(widgetEl);
          }
          break;
        }
      }
    } else {
      var panelId, panelEl;
      var nPanels = model.getPreferences().layout.numberOfPanels;

      page.alignLayout();

      for (panelId=1; panelId<=nPanels; panelId++) {
        panelEl = doc.getElementById('panel-' + panelId);
        while (panelEl.hasChildNodes()) panelEl.removeChild(panelEl.firstChild);

        widgets = page.getWidgetsInPanel(panelId);
        mpagespace.map(widgets, function(w) {
          panelEl.appendChild(mpagespace.view.createWidgetEl(w));
        });
      }
    }

    if (mpagespace.app.isFirstRun(true)) {
      mpagespace.view.alert(mpagespace.translate('welcome.message'));
    }
  },

  createWidgetEl: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var widgetEl = doc.createElement('div');
    var headerEl = doc.createElement('div');
    var bodyEl = doc.createElement('div');
    var titleEl = doc.createElement('a');
    var el;

    widgetEl.setAttribute('class', 'widget');
    widgetEl.setAttribute('id', 'widget-' + widget.id);
    widgetEl.setAttribute('draggable', 'true');
    widgetEl.setAttribute('widget-id', widget.id);
    headerEl.setAttribute('class', 'header');
    titleEl.setAttribute('class', 'title');

    if (widget.model.getPreferences().favicon) {
      var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
      var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
                       .getService(Components.interfaces.nsIFaviconService);

      el = doc.createElement('img');
      el.setAttribute('src', faviconService.defaultFavicon.spec);
      el.setAttribute('class', 'favicon');
      headerEl.appendChild(el);

      if (widget.siteUrl) {
        var asyncFaviconService = faviconService.QueryInterface(Components.interfaces.mozIAsyncFavicons);
        asyncFaviconService.getFaviconURLForPage(ios.newURI(widget.siteUrl, null, null), {
          onComplete: function(favUri, dataLen, data, mimeType) {
            if (favUri != null) {
              el.setAttribute('src', favUri.spec);
            }
          }
        });
      }
    }

    if (widget.siteUrl) {
      titleEl.setAttribute('target', '_blank');
      titleEl.setAttribute('href', widget.siteUrl);
      titleEl.addEventListener('click', function(){this.blur();}, false); 
    }
    if (widget.title) {
      titleEl.appendChild(doc.createTextNode(widget.title));
    } else {
      var schemePos = {}, schemeLen = {}, authPos = {}, authLen = {}, pathPos = {}, pathLen = {};
      mpagespace.urlParser.parseURL(widget.url, widget.url.length, schemePos, schemeLen, authPos, authLen, pathPos, pathLen);
      titleEl.appendChild(doc.createTextNode(widget.url.substr(authPos.value, authLen.value)));
    }

    headerEl.appendChild(titleEl);

    if (!widget.model.getPreferences().lock) {
      widgetEl.addEventListener('dragstart', mpagespace.dd.widgetHandler.dragStart, false);
      widgetEl.addEventListener('dragend', mpagespace.dd.widgetHandler.dragEnd, false);
      headerEl.appendChild(self.createWidgetActionMenu(widget));
    }

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

  createWidgetActionMenu: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var el, listEl, itemEl, linkEl

    el = doc.createElement('div');
    el.setAttribute('class', 'action');
    el.appendChild(doc.createTextNode('\u2318'));
    listEl = doc.createElement('ul');
    listEl.setAttribute('id', 'widget-menu-list-' + widget.id);
    listEl.setAttribute('class', 'menu-list');
    listEl.style.left = 0;

    var preventHiding = false;
    var toggleMenu = function(e){
      if (listEl.style.display == 'block' && !preventHiding)
        listEl.style.display = 'none';
      else if (this == el) {
        var left = Math.min(0, this.parentNode.offsetWidth - (
              this.offsetLeft - this.parentNode.getBoundingClientRect().left + 150));
        listEl.style.left = left;
        listEl.style.display = 'block';
        preventHiding = true;
      } else
        preventHiding = false;
    };
    el.addEventListener('mousedown', toggleMenu, false);
    doc.getElementsByTagName('body')[0].addEventListener('mousedown', toggleMenu, false);

    var actions = [
      {label: 'widget.action.configure', 
        listener: function(event) {
          preventHiding = false;
          toggleMenu();
          mpagespace.controller.configure.call(this);
          event.stopPropagation();
        }
      },
      {label: 'widget.action.remove', listener: mpagespace.controller.remove},
      {label: 'widget.action.minimize', listener: mpagespace.controller.toggleWidget, condition: !widget.minimized},
      {label: 'widget.action.maximize', listener: mpagespace.controller.toggleWidget, condition: widget.minimized}
    ];

    for (let i=0; i<actions.length; i++) {
      if (actions[i].condition !== undefined && !actions[i].condition) 
        continue; 
      itemEl = doc.createElement('li');
      linkEl = doc.createElement('a');
      linkEl.addEventListener('mousedown', actions[i].listener, false);
      linkEl.appendChild(doc.createTextNode(mpagespace.translate(actions[i].label)));
      itemEl.appendChild(linkEl);
      listEl.appendChild(itemEl);
    }

    el.appendChild(listEl);
    return el;
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

  createListOfFeeds: function(entries) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var listEl = doc.createElement('ul');

    listEl.className = 'feeds';
    for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
      var entryEl = doc.createElement('li');
      var linkEl = doc.createElement('a');
      if (entry.link) {
        linkEl.setAttribute('href', entry.link.spec);
      } else {
        linkEl.setAttribute('href', 'javascript:void(0)');
      }
      linkEl.setAttribute('target', '_blank');
      linkEl.setAttribute('title', entry.title);
      linkEl.addEventListener('click', mpagespace.controller.onLinkClick, false); 
      linkEl.appendChild(doc.createTextNode(entry.title));
      entryEl.appendChild(linkEl);
      if (entry.reddit) {
          var link2El = doc.createElement('a');
          link2El.setAttribute('href', entry.reddit.spec);
          link2El.setAttribute('target', '_blank');
          link2El.appendChild(doc.createTextNode('[link]'));
          link2El.addEventListener('click', function(){this.blur();}, false); 
          entryEl.appendChild(doc.createTextNode(' '));
          entryEl.appendChild(link2El);
      }
      listEl.appendChild(entryEl);
    }

    return listEl;
  },

  createListOfDateGroups: function(groups) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var listEl = doc.createElement('ul');

    listEl.className = 'date-groups';
    for (var i=0; i<groups.length; i++) {
      var group = groups[i];
      var groupEl = doc.createElement('li');
      groupEl.appendChild(doc.createTextNode(group.dateLabel));
      groupEl.appendChild(self.createListOfFeeds(group.entries));
      listEl.appendChild(groupEl);
    }
    return listEl;
  },

  groupEntriesByDate: function(entries) {
    var now = new Date();
    var today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    var groupsDict = {};
    for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
      if (entry.date) { 
        if (entry.date === parseInt(entry.date, 10))
          entry.date = new Date(entry.date);
        entry.date = new Date(
          entry.date.getFullYear(),
          entry.date.getMonth(),
          entry.date.getDate()
        );
      } else
        entry.date = today;
      var key = entry.date.getTime();
      if (groupsDict[key] === undefined) groupsDict[key] = [];
      groupsDict[key].push(entry);
    }
    var groupsList = [];
    for (var key in groupsDict) {
      var groupDate = new Date(parseInt(key));
      var daysAgo = Math.round((today.getTime() - groupDate.getTime()) / (1000 * 60 * 60 * 24));
      var suffix = 'today';
      if (daysAgo == 0)
        suffix = 'today';
      else if (daysAgo == 1)
        suffix = '1 day ago';
      else if (daysAgo == -1)
        suffix = '1 day ahead';
      else if (daysAgo < -1)
        suffix = Math.abs(daysAgo) + ' days ahead';
      else
        suffix = daysAgo + ' days ago';
      groupsList.push({
        date: groupDate,
        dateLabel: groupDate.toDateString() + ' (' + suffix + ')',
        entries: groupsDict[key]
      });
    }
    groupsList.sort(function(a, b) { return b.date - a.date });
    return groupsList;
  },

  createFeedBody: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var listEl = doc.createElement('ul');

    if (widget.isInError()) return self.createErrorBody(widget);
    if (widget.isInFeedSelectingState()) return self.createFeedSelectingBody(widget);

    var entries = widget.getEntriesToShow();
    
    if (widget.groupByDate) {
      return self.createListOfDateGroups(self.groupEntriesByDate(entries));
    } else {
      return self.createListOfFeeds(entries);
    }
  },

  createErrorBody: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.className = 'error';
    var titleTextEl = doc.createTextNode(widget.getErrorMessage());
    divEl.appendChild(titleTextEl);
    return divEl;  
  },

  createFeedSelectingBody: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var wrapperEl = doc.createElement('div');
  
    wrapperEl.className = 'available-feeds';

    var pEl = doc.createElement('p');
    pEl.appendChild(doc.createTextNode(mpagespace.translate('subscribe.availableFeeds')));
    wrapperEl.appendChild(pEl);

    var selectEl = doc.createElement('select');
    selectEl.className = 'feeds';
    for (var i=0; i<widget.availableFeeds.length; i++) {
      var f = widget.availableFeeds[i];
      var optionEl = doc.createElement('option');
      optionEl.setAttribute('value', f.href);
      optionEl.appendChild(doc.createTextNode(f.title));
      selectEl.appendChild(optionEl);
    }
    wrapperEl.appendChild(selectEl);
    var aEl = doc.createElement('a');
    aEl.className = 'button';
    aEl.setAttribute('href', 'javascript:void(0)');
    aEl.appendChild(doc.createTextNode(mpagespace.translate('subscribe.availableFeeds.continue')));
    wrapperEl.appendChild(aEl);

    wrapperEl.querySelector('a.button').addEventListener('click', function() {
      var selEl = this.parentNode.querySelector('select');
      var opt = selEl.options[selEl.selectedIndex];

      widget.set('url', opt.value); 
      this.blur();
    }, false); 

    return wrapperEl;
  },

  createPanels: function() {
    var model = mpagespace.app.getModel();
    var doc = mpagespace.view.getDoc();
    var container = doc.getElementById('panel-container');
    var nPanels = model.getPreferences().layout.numberOfPanels;
    var el, width;

    while (container.hasChildNodes()) container.removeChild(container.firstChild);

    for (var i=1; i<=nPanels; i++) {
      el = doc.createElement('td');
      el.setAttribute('id', 'panel-' + i);
      el.style.width = 100 / nPanels + '%';
      el.className = i == 1 ? 'column first' : 'column';
      el.addEventListener('dragover', mpagespace.dd.widgetHandler.dragOver, false);
      el.addEventListener('drop', mpagespace.dd.widgetHandler.drop, false);
      el.addEventListener('dragenter', mpagespace.dd.widgetHandler.dragEnter, false);
      el.addEventListener('dragleave', mpagespace.dd.widgetHandler.dragLeave, false);
      container.appendChild(el);
    }
  },

  setStyles: function() {
    var pref = mpagespace.app.getModel().getPreferences();
    var colors = pref.colors;
    var font = pref.font;
    var doc = mpagespace.view.getDoc();
    var el, styles = [];

    styles.push('body { background-color: ' + colors.background + '; border-color: ' + colors.border + '; }');
    styles.push('#nav-list li a { color: ' + colors.link + '; border-color: ' + colors.border + '; }');
    styles.push('#nav-list li.first a { border-color: ' + colors.border + '; }');
    styles.push('#nav-list li.active a { color: ' + colors.misc + '; }');
    styles.push('#nav-action-left, #nav-action-right, #mpage-menu { color: ' + colors.misc + '; }');
    styles.push('#panel-container td.column { border-color: ' + colors.border + '; }');
    styles.push('div.widget { border-color: ' + colors.border + '; }');
    styles.push('div.header a, div.header .action { color: ' + colors.title + '; }');
    styles.push('div.body li { color: ' + colors.link + '; }');
    styles.push('div.body a:visited{ color: ' + colors.visited + '; }');
    styles.push('div.body .available-feeds .button { color: ' + colors.visited + '; }');
    styles.push('div.body .available-feeds p { color: ' + colors.link + '; }');
    styles.push('div.body div.loading{ color: ' + colors.link + '; }');
    styles.push('div.body div.error{ color: ' + colors.link + '; }');
    styles.push('ul.menu-list { background-color: ' + colors.menu + ';');
    styles.push('  box-shadow: 1px 1px ' + colors.border + '; }'); 
    styles.push('ul.menu-list a { color: ' + colors.menuText + '; }'); 
    styles.push('ul.menu-list a:hover { background-color: ' + colors.menuSel + '; }');
    styles.push('#dd-placeholder { background-color: ' + colors.misc + '; }');
    styles.push('#nav-drop-indicator-bar { background-color: ' + colors.misc + '; }');
    styles.push('#message .dialog { background-color: ' + colors.menu + ';');
    styles.push('  box-shadow: 1px 1px 1px ' + colors.border + ';'); 
    styles.push('  color: ' + colors.menuText + '; }');

    styles.push('body { font-size: ' + font.size + '; }');
    styles.push('body { font-family: ' + font.family + '; }');

    styles.push('div.body li {margin-top: ' + pref.spacing + '; margin-bottom: ' + pref.spacing + ';}');

    el = doc.getElementById('styles');

    while (el.hasChildNodes()) el.removeChild(el.firstChild);
    el.appendChild(doc.createTextNode(styles.join('\n')));

    if (pref.customCss) {
      el = doc.getElementById('customCss');
      if (el == null) {
        el = doc.createElement('link');
        el.setAttribute('id', 'customCss');
        el.setAttribute('type', 'text/css');
        el.setAttribute('rel', 'stylesheet');
        doc.getElementsByTagName('head')[0].appendChild(el);
      }
      el.setAttribute('href', 'file://' + pref.customCss);
    } else {
      el = doc.getElementById('customCss');
      if (el) el.parentNode.removeChild(el);
    }
  },

  createToolbar: function() {
    var prepareOpenPageFunc = function(pageId) {
      return function() { 
        mpagespace.app.openPage(pageId);
      };
    }

    var doc = mpagespace.view.getDoc();
    var model = mpagespace.app.getModel();
    if (model == null) {
      return;
    }
    var menu = doc.getElementById('nav-list');
    while (menu.hasChildNodes()) menu.removeChild(menu.firstChild);

    var activePage = model.getPage();
    for (var j=0, pageOrder=model.getPageOrder(); j<pageOrder.length; j++) {
      let p = model.getPage(pageOrder[j]); 
      let item = doc.createElement('li');
      let className = '';
      item.setAttribute('id', 'page-' + p.id);
      if (p.id == activePage.id) className = 'active'; 
      if (!model.getPreferences().lock) {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', mpagespace.dd.pageHandler.dragStart, false);
        item.addEventListener('dragend', mpagespace.dd.pageHandler.dragEnd, false);
      }
      if (j == 0) className = className + ' first';

      item.setAttribute('class', className);

      let link = doc.createElement('a');
      link.appendChild(doc.createTextNode(p.title));
      link.addEventListener('click', prepareOpenPageFunc(p.id), false); 

      item.appendChild(link);
      menu.appendChild(item);
    }

    if (model.getPreferences().toolbar) {
      doc.getElementById('toolbar').style.display = 'none';  
    } else {
      doc.getElementById('toolbar').style.display = 'block';
    }
  },

  setActivePageOnToolbar: function() {
    var model = mpagespace.app.getModel();
    if (model == null) return;

    var r = new RegExp('\\bactive\\b\\s*', 'g');
    var activePage = model.getPage();
    var menu = mpagespace.view.getDoc().getElementById('nav-list');
    for (var i=0; i<menu.childNodes.length; i++) {
      var el = menu.childNodes[i];
      if (el.nodeName.toLowerCase() == 'li') {
        el.className = el.className.replace(r, '');
        if (parseInt(el.getAttribute('id').substr('page-'.length)) == activePage.id)
          el.className += ' active';
      }  
    }
  },

  createToolbarMenu: function(widget) {
    var self = mpagespace.view;
    var doc = self.getDoc();
    var el, listEl, itemEl, linkEl

    el = doc.getElementById('mpage-menu');
    listEl = doc.getElementById('mpage-menu-list');

    var preventHiding = false;
    var toggleMenu = function(){
      if (listEl.style.display == 'block' && !preventHiding)
        listEl.style.display = 'none';
      else if (this == el) {
        listEl.style.right = 0;
        listEl.style.display = 'block';
        preventHiding = true;
      } else
        preventHiding = false;
    };

    el.addEventListener('mousedown', toggleMenu, false);
    doc.getElementsByTagName('body')[0].addEventListener('mousedown', toggleMenu, false);

    var actions = [
      {label: 'toolbar.action.addfeed', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mpagespace.app.addFeed();
        }
      },
      {label: 'toolbar.action.addpage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mpagespace.app.addPage();
        }
      },
      {label: 'toolbar.action.deletepage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mpagespace.app.deletePage();
        }
      },
      {label: 'toolbar.action.renamepage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mpagespace.app.renamePage();
        }
      },
      {label: 'toolbar.action.options', listener: mpagespace.app.openOptions}
    ];

    for (let i=0; i<actions.length; i++) {
      if (actions[i].condition !== undefined && !actions[i].condition) 
        continue; 
      itemEl = doc.createElement('li');
      linkEl = doc.createElement('a');
      linkEl.addEventListener('mousedown', actions[i].listener, false);
      linkEl.appendChild(doc.createTextNode(mpagespace.translate(actions[i].label)));
      itemEl.appendChild(linkEl);
      listEl.appendChild(itemEl);
    }
  }
}

