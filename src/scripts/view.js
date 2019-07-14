'use strict';

let View = {
  processEvent: function(e) {  
    var self = View;
    let topic = e.type;
    let data = e.detail;

    if (topic == 'mpage-model') {  
      var widget;
      console.log('view.observe: ' + topic + '/' + data);
      data = data.split(':');
      var page = mPage.getModel().getPage();
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
            self.drawWidget(widget, false);
          }
          break;
        case 'widget-loaded':
        case 'widget-error':
        case 'widget-changed':
          widget = page.getWidget(data[1]);
          if (widget) {
            self.drawWidget(widget, true);
          }
          break;
        case 'page-loaded':
          if (page.id == data[1]) {
            self.drawDashboard();
            self.createToolbar();
          }
          break;
        case 'model-reset':
        case 'preferences-changed':
          self.createPanels();
          self.createToolbar();
          self.setStyles();
          self.drawDashboard();
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
          console.log('view.observe: Event ignored!');
          break;
      }
    } 
  },

  isNarrowScreen: function() {
    return window.screen.width <= 600;
  },

  init: function() {
    var doc = View.getDoc();
    console.log('init view');

    var menu = doc.getElementById('nav-list');
    menu.addEventListener('dragover', DragAndDrop.pageHandler.dragOver, false);
    menu.addEventListener('drop', DragAndDrop.pageHandler.drop, false);
    menu.addEventListener('dragenter', DragAndDrop.pageHandler.dragEnter, false);
    menu.addEventListener('dragleave', DragAndDrop.pageHandler.dragLeave, false);

    var btn = doc.querySelector('#message div .button');
    btn.addEventListener('mousedown', function() {doc.getElementById('message').style.display = 'none';}, false);

    View.createToolbarMenu();
    View.createToolbar();
    View.createPanels();
    View.setStyles();
  },

  getDoc: function() {
    return document;  
  },

  registerObserver: function() {
    window.document.documentElement.addEventListener('mpage-model', View.processEvent, false);
    window.document.documentElement.addEventListener('mpage-app', View.processEvent, false);
  },

  unregisterObserver: function() {
    window.document.documentElement.removeEventListener('mpage-model', View.processEvent, false);
    window.document.documentElement.removeEventListener('mpage-app', View.processEvent, false);
  },

  alert: function(message) {
    var doc = View.getDoc();

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
    return View.getDoc().getElementById('widget-' + widgetId);
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
    var widgetEl = View.getWidgetEl(widget.id);
    widgetEl.parentNode.removeChild(widgetEl);
  },

  drawWidget: function(widget, refresh) {
    var doc = View.getDoc();
    var model = mPage.getModel();
    var page = model.getPage();
    var panelEl;
    var widgets;

    var widgetEl = doc.getElementById('widget-' + widget.id);
    panelEl = View.findPanelEl(widget);   
    if (widgetEl && refresh) {
      widgetEl.parentNode.removeChild(widgetEl);
      widgetEl = null;
    }
    if (!widgetEl) {
      widgetEl = View.createWidgetEl(widget);
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
  },

  drawDashboard: function() {
    var self = View;
    var doc = View.getDoc();
    var model = mPage.getModel();
    var page = model.getPage();
    var widgets;
    var panelId, panelEl;

    var nPanels = self.getNumberOfPanels();
    page.alignLayout(nPanels);
    for (panelId=1; panelId<=nPanels; panelId++) {
      panelEl = doc.getElementById('panel-' + panelId);
      while (panelEl.hasChildNodes()) panelEl.removeChild(panelEl.firstChild);
      widgets = page.getWidgetsInPanel(panelId);
      Utils.map(widgets, function(w) {
        panelEl.appendChild(View.createWidgetEl(w));
      });
    }
  },

  findPanelEl: function(widget) {
    var self = View;
    var doc = self.getDoc();
    var panelEl;
    if (self.isNarrowScreen()) {
      panelEl = doc.getElementById('panel-1');
    } else {
      panelEl = doc.getElementById('panel-' + widget.panelId);
    }
    if (!panelEl) {
      throw new Error('Invalid model - panel not found.');
    } else {
      return panelEl;
    }
  },

  getNumberOfPanels: function() {
    var self = View;
    if (self.isNarrowScreen())
      return 1;
    else 
      return mPage.getModel().getPreferences().layout.numberOfPanels;
  },

  createWidgetEl: function(widget) {
    var self = View;
    var doc = self.getDoc();
    var widgetEl = doc.createElement('div');
    var bodyEl = doc.createElement('div');

    widgetEl.setAttribute('class', 'widget');
    widgetEl.setAttribute('id', 'widget-' + widget.id);
    widgetEl.setAttribute('widget-id', widget.id);

    self.enableDragAndDrop(widgetEl);

    widgetEl.appendChild(self.createWidgetHeaderEl(widget));
    bodyEl.setAttribute('class', 'body');
    bodyEl.hidden = widget.minimized;

    if (widget.isInitialized() == true) {
      bodyEl.appendChild(self.createFeedBody(widget));
    } else {
      bodyEl.appendChild(self.createLoadingBody());  
    }

    widgetEl.appendChild(self.createConfigEl(widget));
    widgetEl.appendChild(bodyEl);
    return widgetEl;
  },

  createWidgetHeaderEl: function(widget) {
    var self = View;
    var doc = View.getDoc();
    var headerEl = doc.createElement('div');
    var titleEl = doc.createElement('a');
    titleEl.setAttribute('class', 'title');
    headerEl.setAttribute('class', 'header');
    if (widget.model.getPreferences().favicon) {
      headerEl.appendChild(self.createFaviconEl(widget));
    }
    if (widget.siteUrl) {
      titleEl.setAttribute('target', '_blank');
      titleEl.setAttribute('href', widget.siteUrl);
      titleEl.addEventListener('click', function(){this.blur();}, false); 
    }
    if (widget.title) {
      titleEl.appendChild(doc.createTextNode(widget.title));
    } else {
      var url = new URL(widget.url);
      titleEl.appendChild(doc.createTextNode(url.hostname));
    }
    headerEl.appendChild(titleEl);
    headerEl.appendChild(self.createWidgetActionMenu(widget));
    return headerEl;
  },

  createFaviconEl: function(widget) {
    var self = View;
    var doc = View.getDoc();
    var faviconEl = doc.createElement('img');
    faviconEl.setAttribute('class', 'favicon');
    if (widget.siteUrl) {
      var url = new URL(widget.siteUrl);
      faviconEl.addEventListener('error', function(event){
        this.src = 'icons/icon.png';
      }, false);
      faviconEl.setAttribute('src', url.origin + '/favicon.ico');
    } else {
      faviconEl.setAttribute('src', 'icons/icon.png');
    }
    return faviconEl;
  },

  createConfigEl: function(widget) {
    var self = View;
    var doc = self.getDoc();

    var configEl = doc.createElement('div');
    configEl.className = 'feedConfig';
    configEl.style.display = 'none';

    var row, el;
    row = doc.createElement('div');
    row.appendChild(doc.createTextNode('Show within'));
    el = doc.createElement('input');
    el.placeholder = 'infinite';
    el.type = 'text';
    el.className = 'hoursFilter';
    if (widget.hoursFilter > 0) 
      if (widget.hoursFilter % 24 == 0)
        el.value = widget.hoursFilter / 24;
      else
        el.value = widget.hoursFilter;
    row.appendChild(el);
    el = doc.createElement('select');
    el.className = 'daysOrHours';
    var optEl = doc.createElement('option');
    optEl.value = 'hours';
    optEl.appendChild(doc.createTextNode('hours'));
    el.appendChild(optEl);
    optEl = doc.createElement('option');
    optEl.value = 'days';
    optEl.appendChild(doc.createTextNode('days'));
    el.appendChild(optEl);
    if (widget.hoursFilter % 24 == 0) {
      el.selectIndex = 1;
    }
    row.appendChild(el);
    configEl.appendChild(row);

    row = doc.createElement('div');
    row.appendChild(doc.createTextNode('Show'));
    var el = doc.createElement('input');
    el.className = 'entriesToShow';
    el.placeholder = '5';
    el.type = 'text';
    el.value = widget.entriesToShow;
    row.appendChild(el);
    row.appendChild(doc.createTextNode('entries'));
    configEl.appendChild(row);

    row = doc.createElement('div');
    el = doc.createElement('input');
    el.type = 'checkbox';
    el.className = 'groupByDate';
    el.checked = widget.groupByDate;
    row.append(el);
    row.appendChild(doc.createTextNode('Group by date'));
    configEl.appendChild(row);
    
    row = doc.createElement('div');
    el = doc.createElement('input');
    el.type = 'checkbox';
    el.className = 'minimized';
    el.checked = widget.minimized;
    row.append(el);
    row.appendChild(doc.createTextNode('Minimized'));
    configEl.appendChild(row);

    row = doc.createElement('div');
    row.appendChild(doc.createTextNode('URL: ' + widget.url)); 
    configEl.appendChild(row);

    row = doc.createElement('div');
    row.style.textAlign = 'center';

    var createButtonEl = function(label) {
      var el = doc.createElement('a');
      el.className = 'button';
      el.href = '#';
      el.appendChild(doc.createTextNode(label));
      return el
    }

    el = createButtonEl('Up');
    el.className = 'for-mobile-only button';
    el.addEventListener('click', Controller.moveUp);
    row.appendChild(el);

    el = createButtonEl('Apply');
    el.addEventListener('click', function(evt) {
      var widgetEl = self.findWidgetEl(widget);
      widgetEl.querySelector('.feedConfig').style.display = 'none';
      var config = {};
      var el = widgetEl.querySelector('.entriesToShow');
      var n = parseInt(el.value);
      if (isNaN(n) || n <= 0) n = 5;
      el.value = n;
      config.entriesToShow = n;

      el = widgetEl.querySelector('.hoursFilter');
      n = parseInt(el.value);
      if (isNaN(n) || n <= 0) n = 0;
      config.hoursFilter = n;
      el = widgetEl.querySelector('.daysOrHours');
      if (el.selectedIndex == 1) config.hoursFilter = config.hoursFilter * 24;

      el = widgetEl.querySelector('.groupByDate');
      config.groupByDate = el.checked;

      el = widgetEl.querySelector('.minimized');
      config.minimized = el.checked;

      widget.setBulk(config);
      self.enableDragAndDrop(self.findWidgetEl(widget));
      evt.preventDefault();
    });
    row.appendChild(el);

    el = createButtonEl('Remove');
    el.addEventListener('click', Controller.remove);
    row.appendChild(el);

    el = createButtonEl('Down');
    el.className = 'for-mobile-only button';
    el.addEventListener('click', Controller.moveDown);
    row.appendChild(el);

    configEl.appendChild(row);

    return configEl;
  },

  createWidgetActionMenu: function(widget) {
    var self = View;
    var doc = self.getDoc();
    var el, listEl, itemEl, linkEl

    el = doc.createElement('div');
    el.setAttribute('class', 'action');
    var el2 = doc.createElement('i');
    el2.className = 'fas fa-cog';
    el.appendChild(el2);
    el.addEventListener('mousedown', function(event) {
      var widgetEl = self.findWidgetEl(widget);
      var feedConfigEl = widgetEl.querySelector('.feedConfig');
      if (feedConfigEl.style.display == 'block') {
        feedConfigEl.style.display = 'none';
        self.enableDragAndDrop(widgetEl);
      } else {
        feedConfigEl.style.display = 'block';
        self.disableDragAndDrop(widgetEl);
      }
      event.stopPropagation();
    });
    return el;
  },

  findWidgetEl: function(widget) {
    var self = View;
    var doc = self.getDoc();
    return doc.querySelector('#widget-' + widget.id);
  },

  disableDragAndDrop: function(widgetEl) {
    var self = View;
    var doc = self.getDoc();
    widgetEl.setAttribute('draggable', 'false');
    widgetEl.removeEventListener('dragstart', DragAndDrop.widgetHandler.dragStart, false);
    widgetEl.removeEventListener('dragend', DragAndDrop.widgetHandler.dragEnd, false);
  },

  enableDragAndDrop: function(widgetEl) {
    var self = View;
    var doc = self.getDoc();

    if (!self.isNarrowScreen() && !mPage.getModel().getPreferences().lock) {
      widgetEl.setAttribute('draggable', 'true');
      widgetEl.removeEventListener('dragstart', DragAndDrop.widgetHandler.dragStart, false);
      widgetEl.addEventListener('dragstart', DragAndDrop.widgetHandler.dragStart, false);
      widgetEl.removeEventListener('dragend', DragAndDrop.widgetHandler.dragEnd, false);
      widgetEl.addEventListener('dragend', DragAndDrop.widgetHandler.dragEnd, false);
    }
  },

  createLoadingBody: function() {
    var self = View;
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.setAttribute('class', 'loading');
    var titleTextEl = doc.createTextNode(Utils.translate('loading.label'));
    divEl.appendChild(titleTextEl);
    return divEl;
  }, 

  createListOfFeeds: function(entries) {
    var self = View;
    var doc = self.getDoc();
    var listEl = doc.createElement('ul');
    var model = mPage.getModel();

    listEl.className = 'feeds';
    for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
      var entryEl = doc.createElement('li');
      var linkEl = doc.createElement('a');
      if (entry.link) {
        var url = entry.link.href;
        var openInReaderMode = model.getPreferences().reader;
        linkEl.setAttribute('href', url);
        linkEl.addEventListener('click', View.openLinkFunction(url, openInReaderMode), false); 
      }
      linkEl.setAttribute('target', '_blank');
      linkEl.setAttribute('title', entry.title);
      linkEl.appendChild(doc.createTextNode(entry.title));
      entryEl.appendChild(linkEl);
      if (entry.reddit && model.getPreferences().comments) {
          var link2El = doc.createElement('a');
          link2El.setAttribute('href', entry.reddit.href);
          link2El.setAttribute('target', '_blank');
          link2El.appendChild(doc.createTextNode('[link]'));
          link2El.addEventListener('click', function(){this.blur();}, false); 
          entryEl.appendChild(doc.createTextNode(' '));
          entryEl.appendChild(link2El);
      }
      if (entry.comments && model.getPreferences().comments) {
          var link2El = doc.createElement('a');
          link2El.setAttribute('href', entry.comments);
          link2El.setAttribute('target', '_blank');
          link2El.appendChild(doc.createTextNode('[comments]'));
          link2El.addEventListener('click', function(){this.blur();}, false); 
          entryEl.appendChild(doc.createTextNode(' '));
          entryEl.appendChild(link2El);
      }
      listEl.appendChild(entryEl);
    }

    return listEl;
  },

  openLinkFunction: function(url, openInReaderMode) {
    return function(event) {
      if (openInReaderMode) {
        browser.history.addUrl({url: url});
      }
      var creating = browser.tabs.create({
        url: url,
        openInReaderMode: openInReaderMode
      });
      event.preventDefault();
    }
  },

  createListOfDateGroups: function(groups) {
    var self = View;
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
    var self = View;
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
    var self = View;
    var doc = self.getDoc();
    var divEl = doc.createElement('div');  
    divEl.className = 'error';
    var titleTextEl = doc.createTextNode(widget.getErrorMessage());
    divEl.appendChild(titleTextEl);
    return divEl;  
  },

  createFeedSelectingBody: function(widget) {
    var self = View;
    var doc = self.getDoc();
    var wrapperEl = doc.createElement('div');
  
    wrapperEl.className = 'available-feeds';

    var pEl = doc.createElement('p');
    pEl.appendChild(doc.createTextNode(Utils.translate('subscribe.availableFeeds')));
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
    aEl.appendChild(doc.createTextNode(Utils.translate('subscribe.availableFeeds.continue')));
    var divEl = doc.createElement('div');
    divEl.appendChild(aEl);
    wrapperEl.appendChild(divEl);

    wrapperEl.querySelector('a.button').addEventListener('click', function() {
      var opt = selectEl.options[selectEl.selectedIndex];
      widget.set('url', opt.value); 
      this.blur();
    }, false); 

    return wrapperEl;
  },

  createPanels: function() {
    var self = View;
    var model = mPage.getModel();
    var doc = self.getDoc();
    var container = doc.getElementById('panel-container');
    var nPanels = self.getNumberOfPanels();

    while (container.hasChildNodes()) container.removeChild(container.firstChild);

    for (var i=1; i<=nPanels; i++) {
      View.createPanel(i, true, 100 / nPanels, i == nPanels);
    }
  },

  createPanel: function(i, enableDd, percentageWidth, isLast) {
    var model = mPage.getModel();
    var doc = View.getDoc();
    var container = doc.getElementById('panel-container');
    var el;

    el = doc.createElement('td');
    el.setAttribute('id', 'panel-' + i);
    el.style.width = percentageWidth + '%';
    el.className = isLast && !OptionsForm.isOpen() ? 'column last' : 'column';
    if (enableDd) {
      el.addEventListener('dragover', DragAndDrop.widgetHandler.dragOver, false);
      el.addEventListener('drop', DragAndDrop.widgetHandler.drop, false);
      el.addEventListener('dragenter', DragAndDrop.widgetHandler.dragEnter, false);
      el.addEventListener('dragleave', DragAndDrop.widgetHandler.dragLeave, false);
    }
    container.appendChild(el);
  },

  setStyles: function() {
    var self = View;
    var pref = mPage.getModel().getPreferences();
    var colors = pref.colors;
    var font = pref.font;
    var doc = self.getDoc();
    var el, styles = [];
    if (self.isNarrowScreen()) {
      var showNotForMobile = 'none'; 
      var showForMobileOnly = 'initial';
    } else {
      var showNotForMobile = 'table-row'; 
      var showForMobileOnly = 'none';
    }

    styles.push('body { background-color: ' + colors.background + '; border-color: ' + colors.border + '; }');
    styles.push('#nav-list li a { color: ' + colors.link + '; border-color: ' + colors.border + '; }');
    styles.push('#nav-list li.first a { border-color: ' + colors.border + '; }');
    styles.push('#nav-list li.active a { color: ' + colors.misc + '; }');
    styles.push('#nav-action-left, #nav-action-right, #mpage-menu { color: ' + colors.misc + '; }');
    styles.push('#panel-container td.column { border-color: ' + colors.border + '; }');
    styles.push('#toolbar-mobile .nav-container div { color: ' + colors.misc + '; }');
    styles.push('#toolbar-mobile .active-page, #toolbar-mobile .mpage-menu-mobile { color: ' + colors.misc + '; }');
    styles.push('div.widget { border-color: ' + colors.border + '; }');
    styles.push('div.header a, div.header .action { color: ' + colors.title + '; }');
    styles.push('div.body li { color: ' + colors.link + '; }');
    styles.push('div.body a:visited{ color: ' + colors.visited + '; }');
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
    styles.push('#options-container { color: ' + colors.link + '; }');
    styles.push('#options-container div.group { border-color: ' + colors.border + '; }');
    styles.push('div a.button { color: ' + colors.misc + '; }');
    styles.push('div.feedConfig { color: ' + colors.link + '; border-color: ' + colors.border + '; }');
    styles.push('body { font-size: ' + font.size + 'px; }');
    styles.push('body { font-family: ' + font.family + '; }');
    styles.push('body tr.not-for-mobile { display: ' + showNotForMobile + '; }');
    styles.push('body a.for-mobile-only { display: ' + showForMobileOnly  + '; }');
    styles.push('button, select, input { font-size: ' + font.size + 'px; }');
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

  prepareOpenPageFunc: function(pageId) {
    return function() { 
      mPage.getModel().changeActivePage(pageId);
    };
  },

  createToolbar: function() {
    var self = View;
    var doc = self.getDoc();
    if (self.isNarrowScreen()) {
      doc.getElementById('toolbar-mobile').style.display = 'block';
      self.createToolbarMobile();
    } else {
      doc.getElementById('toolbar').style.display = 'block';
      self.createToolbarStandard();
    }
  },

  createToolbarStandard: function() {
    var self = View;
    var doc = self.getDoc();
    var model = mPage.getModel();
    if (model == null) {
      return;
    }
    var menu = doc.getElementById('nav-list');
    self.removeChildren(menu);

    var activePage = model.getPage();
    for (var j=0, pageOrder=model.getPageOrder(); j<pageOrder.length; j++) {
      let p = model.getPage(pageOrder[j]); 
      let item = doc.createElement('li');
      let className = '';
      item.setAttribute('id', 'page-' + p.id);
      if (p.id == activePage.id) className = 'active'; 
      if (!model.getPreferences().lock) {
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', DragAndDrop.pageHandler.dragStart, false);
        item.addEventListener('dragend', DragAndDrop.pageHandler.dragEnd, false);
      }
      if (j == 0) className = className + ' first';
      item.setAttribute('class', className);
      let link = doc.createElement('a');
      link.appendChild(doc.createTextNode(p.title));
      link.addEventListener('click', self.prepareOpenPageFunc(p.id), false); 
      item.appendChild(link);
      menu.appendChild(item);
    }
  },

  createToolbarMobile: function() {
    var self = View;
    var doc = self.getDoc();
    var model = mPage.getModel();
    var el;
    if (model == null) {
      return;
    }
    var toolbarEl = doc.getElementById('toolbar-mobile');

    var createPageLink = function(page) {
      var el = doc.createElement('a');
      el.appendChild(doc.createTextNode(page.title));
      return el;
    }

    var activePage = model.getPage();
    var activePageEl = toolbarEl.querySelector('.active-page');
    self.removeChildren(activePageEl);
    activePageEl = self.removeAllEventHandlers(activePageEl);
    activePageEl.addEventListener('mousedown', function(event) {
      var el = toolbarEl.querySelector('.pages')
      if (el.style.display == 'none') {
        toolbarEl.querySelector('.menu').style.display = 'none';
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    }, false);
    activePageEl.appendChild(doc.createTextNode(activePage.title));
    var menu = toolbarEl.querySelector('.pages');
    self.removeChildren(menu);
    menu.style.display = 'none';
    for (var j=0, pageOrder=model.getPageOrder(); j<pageOrder.length; j++) {
      let p = model.getPage(pageOrder[j]);
      if (p == activePage) continue;
      el = doc.createElement('div');
      el.appendChild(createPageLink(p));
      el.addEventListener('click',self. prepareOpenPageFunc(p.id), false); 
      menu.appendChild(el);
    }
  },

  createToolbarMenu: function(widget) {
    var self = View;
    var doc = self.getDoc();
    if (self.isNarrowScreen()) {
      doc.getElementById('toolbar-mobile').style.display = 'block';
      self.createToolbarMenuMobile();
    } else {
      doc.getElementById('mpage-menu').style.display = 'block';
      self.createToolbarMenuStandard();
    }
  },

  createToolbarMenuStandard: function(widget) {
    var self = View;
    var doc = self.getDoc();
    var el, listEl, itemEl, linkEl

    el = doc.getElementById('mpage-menu');
    el = self.removeAllEventHandlers(el);
    listEl = doc.getElementById('mpage-menu-list');
    self.removeChildren(listEl);

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
    self.createToolbarMenuItems(listEl, 'li', toggleMenu);
  },

  createToolbarMenuMobile: function(widget) {
    var self = View;
    var doc = self.getDoc();
    var toolbarEl = doc.getElementById('toolbar-mobile');
    var buttonEl = toolbarEl.querySelector('.mpage-menu-mobile');
    buttonEl = self.removeAllEventHandlers(buttonEl);
    var menuEl = toolbarEl.querySelector('.menu')
    self.removeChildren(menuEl);
    var toggleMenu = function(event) {
      if (menuEl.style.display == 'none') {
        toolbarEl.querySelector('.pages').style.display = 'none';
        menuEl.style.display = 'block';
      } else {
        menuEl.style.display = 'none';
      }
    };
    buttonEl.addEventListener('mousedown', toggleMenu, false);
    self.createToolbarMenuItems(menuEl, 'div', toggleMenu);
  },

  createToolbarMenuItems: function(containerEl, itemTag, toggleMenu) {
    var self = View;
    var doc = self.getDoc();
    var el1, el2;
    var actions = [
      {label: 'toolbar.action.addfeed', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mPage.addFeed();
        }
      },
      {label: 'toolbar.action.addpage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mPage.addPage();
        }
      },
      {label: 'toolbar.action.deletepage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mPage.deletePage();
        }
      },
      {label: 'toolbar.action.renamepage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mPage.renamePage();
        }
      },
      {label: 'toolbar.action.setstartpage', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          mPage.setAsStartPage();
        }, condition: self.isNarrowScreen
      },
      {label: 'toolbar.action.options', 
        listener: function(event) {
          toggleMenu();
          event.stopPropagation();
          OptionsForm.show();
        }
      }
    ];

    for (let i=0; i<actions.length; i++) {
      if (actions[i].condition !== undefined && !actions[i].condition()) 
        continue; 
      el1 = doc.createElement(itemTag);
      el2 = doc.createElement('a');
      el2.addEventListener('mousedown', actions[i].listener, false);
      el2.appendChild(doc.createTextNode(Utils.translate(actions[i].label)));
      el1.appendChild(el2);
      containerEl.appendChild(el1);
    }
  },

  removeChildren: function(el) {
    while (el.hasChildNodes()) el.removeChild(el.firstChild);
  },

  removeAllEventHandlers: function(el) {
    var cloneEl = el.cloneNode(true);
    el.replaceWith(cloneEl);
    return cloneEl;
  },

  toggleLastPanelBorder: function() {
    var self = View;
    var doc = self.getDoc();
    var panels = doc.querySelectorAll('#panel-container .column');
    var lastPanel = panels[panels.length - 1];

    var classes = lastPanel.className.split(' ');
    if (classes.indexOf('last') != -1) {
      classes = classes.filter(c => c != 'last');
      if (self.isNarrowScreen()) {
        // Hide widget panels
        lastPanel.parentNode.parentNode.parentNode.style.display = 'none';
      }
    } else {
      classes.push('last');
      if (self.isNarrowScreen()) {
        // Show widget panels
        lastPanel.parentNode.parentNode.parentNode.style.display = 'initial';
      }
    }
    lastPanel.className = classes.join(' ');
  }
}

