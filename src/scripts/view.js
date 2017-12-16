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
          console.log('view.observe: Event ignored!');
          break;
      }
    } 
  },

  init: function() {
    var doc = View.getDoc();
    console.log('init view');

    var menu = doc.getElementById('nav-list');
    menu.addEventListener('dragover', DragAndDrop.pageHandler.dragOver, false);
    menu.addEventListener('drop', DragAndDrop.pageHandler.drop, false);
    menu.addEventListener('dragenter', DragAndDrop.pageHandler.dragEnter, false);
    menu.addEventListener('dragleave', DragAndDrop.pageHandler.dragLeave, false);

    var btn = doc.getElementById('message').querySelector('div.button');
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

  draw: function(widget, refresh) {
    var doc = View.getDoc();
    var model = mPage.getModel();
    var page = model.getPage();
    var panelEl;
    var widgets;

    // document.getElementById('main').setAttribute('title', 'mPage - ' + page.title);

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
    } else {
      var panelId, panelEl;
      var nPanels = model.getPreferences().layout.numberOfPanels;

      page.alignLayout();

      for (panelId=1; panelId<=nPanels; panelId++) {
        panelEl = doc.getElementById('panel-' + panelId);
        while (panelEl.hasChildNodes()) panelEl.removeChild(panelEl.firstChild);

        widgets = page.getWidgetsInPanel(panelId);
        Utils.map(widgets, function(w) {
          panelEl.appendChild(View.createWidgetEl(w));
        });
      }
    }

    if (mPage.isFirstRun(true)) {
      View.alert(Utils.translate('welcome.message'));
    }
  },

  createWidgetEl: function(widget) {
    var self = View;
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

    if (!widget.model.getPreferences().lock) {
      widgetEl.addEventListener('dragstart', DragAndDrop.widgetHandler.dragStart, false);
      widgetEl.addEventListener('dragend', DragAndDrop.widgetHandler.dragEnd, false);
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

    widgetEl.appendChild(self.createConfigEl(widget));
    widgetEl.appendChild(bodyEl);
    return widgetEl;
  },

  createConfigEl: function(widget) {
    var doc = View.getDoc();

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
    row.appendChild(doc.createTextNode('URL: ' + widget.url)); 
    configEl.appendChild(row);

    row = doc.createElement('div');
    row.style.textAlign = 'center';
    el = doc.createElement('a');
    el.href = '#';
    el.appendChild(doc.createTextNode('[ Apply ]'));
    el.addEventListener('click', function(evt) {
      doc.querySelector('#widget-' + widget.id + ' .feedConfig').style.display = 'none';
      var config = {};
      var el = doc.querySelector('#widget-' + widget.id + ' .entriesToShow');
      var n = parseInt(el.value);
      if (isNaN(n) || n <= 0) n = 5;
      el.value = n;
      config.entriesToShow = n;

      el = doc.querySelector('#widget-' + widget.id + ' .hoursFilter');
      n = parseInt(el.value);
      if (isNaN(n) || n <= 0) n = 0;
      config.hoursFilter = n;
      el = doc.querySelector('#widget-' + widget.id + ' .daysOrHours');
      if (el.selectedIndex == 1) config.hoursFilter = config.hoursFilter * 24;

      el = doc.querySelector('#widget-' + widget.id + ' .groupByDate');
      config.groupByDate = el.checked;

      widget.setBulk(config);
      evt.preventDefault();
    });
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
          doc.querySelector('#widget-' + widget.id + ' .feedConfig').style.display = 'block';
          preventHiding = false;
          toggleMenu();
          event.stopPropagation();
        }
      },
      {label: 'widget.action.remove', listener: Controller.remove},
      {label: 'widget.action.minimize', listener: Controller.toggleWidget, condition: !widget.minimized},
      {label: 'widget.action.maximize', listener: Controller.toggleWidget, condition: widget.minimized}
    ];

    for (let i=0; i<actions.length; i++) {
      if (actions[i].condition !== undefined && !actions[i].condition) 
        continue; 
      itemEl = doc.createElement('li');
      linkEl = doc.createElement('a');
      linkEl.addEventListener('mousedown', actions[i].listener, false);
      linkEl.appendChild(doc.createTextNode(Utils.translate(actions[i].label)));
      itemEl.appendChild(linkEl);
      listEl.appendChild(itemEl);
    }

    el.appendChild(listEl);
    return el;
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

    listEl.className = 'feeds';
    for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
      var entryEl = doc.createElement('li');
      var linkEl = doc.createElement('a');
      if (entry.link) {
        linkEl.setAttribute('href', entry.link.href);
      } else {
        linkEl.setAttribute('href', 'javascript:void(0)');
      }
      linkEl.setAttribute('target', '_blank');
      linkEl.setAttribute('title', entry.title);
      linkEl.addEventListener('click', Controller.onLinkClick, false); 
      linkEl.appendChild(doc.createTextNode(entry.title));
      entryEl.appendChild(linkEl);
      if (entry.reddit) {
          var link2El = doc.createElement('a');
          link2El.setAttribute('href', entry.reddit.href);
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
    aEl.setAttribute('href', 'javascript:void(0)');
    aEl.appendChild(doc.createTextNode(Utils.translate('subscribe.availableFeeds.continue')));
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
    var model = mPage.getModel();
    var doc = View.getDoc();
    var container = doc.getElementById('panel-container');
    var nPanels = model.getPreferences().layout.numberOfPanels;
    var el, width;

    while (container.hasChildNodes()) container.removeChild(container.firstChild);

    for (var i=1; i<=nPanels; i++) {
      el = doc.createElement('td');
      el.setAttribute('id', 'panel-' + i);
      el.style.width = 100 / nPanels + '%';
      el.className = i == 1 ? 'column first' : 'column';
      el.addEventListener('dragover', DragAndDrop.widgetHandler.dragOver, false);
      el.addEventListener('drop', DragAndDrop.widgetHandler.drop, false);
      el.addEventListener('dragenter', DragAndDrop.widgetHandler.dragEnter, false);
      el.addEventListener('dragleave', DragAndDrop.widgetHandler.dragLeave, false);
      container.appendChild(el);
    }
  },

  setStyles: function() {
    var pref = mPage.getModel().getPreferences();
    var colors = pref.colors;
    var font = pref.font;
    var doc = View.getDoc();
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
    styles.push('#options-container { color: ' + colors.link + '; }');
    styles.push('#options-container div.group { border-color: ' + colors.border + '; }');
    styles.push('#options-container div.close-button a { color: ' + colors.misc + '; }');
    styles.push('div.feedConfig { color: ' + colors.link + '; border-color: ' + colors.border + '; }');
    styles.push('div.feedConfig a { color: ' + colors.misc + '; }');

    styles.push('body { font-size: ' + font.size + 'px; }');
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
        mPage.getModel().changeActivePage(pageId);
      };
    }

    var doc = View.getDoc();
    var model = mPage.getModel();
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
        item.addEventListener('dragstart', DragAndDrop.pageHandler.dragStart, false);
        item.addEventListener('dragend', DragAndDrop.pageHandler.dragEnd, false);
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
    var model = mPage.getModel();
    if (model == null) return;

    var r = new RegExp('\\bactive\\b\\s*', 'g');
    var activePage = model.getPage();
    var menu = View.getDoc().getElementById('nav-list');
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
    var self = View;
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
      {label: 'toolbar.action.options', listener: OptionsForm.show}
    ];

    for (let i=0; i<actions.length; i++) {
      if (actions[i].condition !== undefined && !actions[i].condition) 
        continue; 
      itemEl = doc.createElement('li');
      linkEl = doc.createElement('a');
      linkEl.addEventListener('mousedown', actions[i].listener, false);
      linkEl.appendChild(doc.createTextNode(Utils.translate(actions[i].label)));
      itemEl.appendChild(linkEl);
      listEl.appendChild(itemEl);
    }
  }
}

