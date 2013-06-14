// Author: Matija Podravec, 2012-2013

if (!mpagespace.app) mpagespace.app = {};
else if (typeof mpagespace.app != 'object')
  throw new Error('mpagespace.app already exists and is not an object');

mpagespace.app = {
  observer: {
    observe: function(subject, topic, data) {  
      var self = mpagespace.app;
      if (topic == 'mpage-model') {
        mpagespace.dump('app.observe: ' + topic + '/' + data);
        data = data.split(':');
        switch (data[0]) {
          case 'model-reset':
          case 'model-loaded':
            if (self.isFirstRun()) {
              window.setTimeout(function(){
                self.openPage();
              }, 300);
            }
          case 'page-deleted':
          case 'page-added':
          case 'page-renamed':
          case 'page-reordered':
            self.populatePageTreeMenu();
            break;
          case 'page-loaded':
            self.setActivePageInTreeMenu(data[1]);
            break;
          default:
            mpagespace.dump('app.observe: Event ignored!');
            break;
        }
      }  
    }
  },

  init: function() {
    var self = mpagespace.app;
    mpagespace.observerService.addObserver(self.observer, 'mpage-model', false); 
    var model = mpagespace.app.getModel();
    if (!model) {
      model = new mpagespace.model();
    }
    mpagespace.app.firstRun();
    mpagespace.fuelApplication.storage.set('mpage-model', model); 
  },

  close: function() {
    mpagespace.observerService.removeObserver(mpagespace.app.observer, 'mpage-model');
    var model = mpagespace.app.getModel();
    if (model.isDirty()) {
      model.commit();
    }
  },

  mpageUrl: 'chrome://mpagespace/content/main.xul',

  openPage: function(pageId) {
    var wm = mpagespace.windowMediator;
    var browserEnumerator = wm.getEnumerator("navigator:browser");  
    var found = false;

    while (!found && browserEnumerator.hasMoreElements()) {  
      var browserWin = browserEnumerator.getNext();  
      var tabbrowser = browserWin.gBrowser;  
      var numTabs = tabbrowser.browsers.length;  
      for (var index = 0; index < numTabs; index++) {  
        var currentBrowser = tabbrowser.getBrowserAtIndex(index);  
        if (currentBrowser.currentURI.spec == mpagespace.app.mpageUrl) {  
          tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];  
          browserWin.focus();  
          found = true;
          break;  
        }  
      }  
    }  
    if (!found) {
      openUILinkIn(mpagespace.app.mpageUrl, 'tab');
    }

    mpagespace.app.getModel().changeActivePage(pageId);
  },

  getModel: function() {
    return mpagespace.fuelApplication.storage.get('mpage-model', null);
  },

  openAbout: function() {
    window.open('chrome://mpagespace/content/about.xul','','chrome,centerscreen,dialog');  
    return false;
  },

  addPage: function() {
    var check = {value: false};
    var input = {value: ''};
    var result = mpagespace.promptsService.prompt(null, mpagespace.translate('addPage.title'), 
        mpagespace.translate('addPage.message'), input, null, check);   
    if (result) {
      var model = mpagespace.app.getModel();
      var page = model.addPage(input.value, model.getPage());
      model.changeActivePage(page.id);
    }
  },

  deletePage: function() {
    if (mpagespace.promptsService.confirm(null, mpagespace.translate('deletePage.title'), 
        mpagespace.translate('deletePage.message'))) {  
      mpagespace.app.getModel().deletePage(); 
    } 
  },

  renamePage: function() {
    var page = mpagespace.app.getModel().getPage();
    var check = {value: false};
    var input = {value: page.title};
    var result = mpagespace.promptsService.prompt(null, mpagespace.translate('renamePage.title'), 
        mpagespace.translate('renamePage.message'), input, null, check);   
    if (result) {
      mpagespace.app.getModel().renamePage(page.id, input.value); 
    }
  },

  addFeed: function() {
    var check = {value: false};
    var input = {value: ''};
    var result = mpagespace.promptsService.prompt(null, mpagespace.translate('addFeed.title'), 
        mpagespace.translate('addFeed.message'), input, null, check);   
    if (result) {
      var page = mpagespace.app.getModel().getPage();
      widget = page.createAndAddWidget(input.value, null, page.getFirstWidget());
      widget.load(true);
    }
  },

  openOptions: function() {
    window.open('chrome://mpagespace/content/options-form.xul','','chrome,centerscreen');  
    return false;
  },

  checkValidItemsInTreeMenu: function(menupopup) {
    var recentWindow = mpagespace.windowMediator.getMostRecentWindow('navigator:browser');
    var url = recentWindow ? recentWindow.content.document.location.href : null;

    var disabled = url !== mpagespace.app.mpageUrl;
    menupopup.querySelector('menuitem[oncommand="mpagespace.app.addFeed();"]').disabled = disabled;
    menupopup.querySelector('menuitem[oncommand="mpagespace.app.addPage();"]').disabled = disabled;
    menupopup.querySelector('menuitem[oncommand="mpagespace.app.deletePage();"]').disabled = disabled;
    menupopup.querySelector('menuitem[oncommand="mpagespace.app.renamePage();"]').disabled = disabled;
  },

  setActivePageInTreeMenu: function(pageId) {
    mpagespace.map(['mpagespace-toolbar-button', 'mpagespace-button-1', 'mpagespace-button-2'],
      function(menuid) {
        var menu = document.getElementById(menuid);
        var page = mpagespace.app.getModel().getPage();

        if (!menu || pageId == null || page == null || page.id != pageId) {
          return;
        }

        var items = menu.querySelectorAll('menuitem[checked="true"]');
        for (var i=0; i<items.length; i++) {
          items[i].setAttribute('checked', 'false');
        }
        var suffix = menuid.substr(menuid.lastIndexOf('-'));
        var item = menu.querySelector('#mpagespace-page-menuitem-' + pageId + suffix);
        if (item)
          item.setAttribute('checked', 'true');
      }
    );
  },

  populatePageTreeMenu: function() {
    var prepareOpenPageFunc = function(pageId) {
      return function() { 
        mpagespace.app.openPage(pageId);
      };
    }
    var i, j, menu, item, items, suffix, el, ids, p;

    var model = mpagespace.app.getModel();
    if (model == null) {
      return;
    }
    var indicatorBarEl = document.getElementById('mpagespace-drop-indicator-bar'); 
    var menuIds = ['mpagespace-toolbar-button', 'mpagespace-button-1', 'mpagespace-button-2'];
    for (i=0; i<menuIds.length; i++) {
      menu = document.getElementById(menuIds[i]);
      
      if (!menu) 
        continue;

      ids = [];
      items = menu.querySelectorAll('menuitem[checked="true"]');
      for (j=0; j<items.length; j++) {
        ids.push(items[j].getAttribute('id'));
      }

      menu = menu.firstChild;
      menu.removeChild(menu.lastChild);
      for (el=menu.lastChild; 
          el && el.nodeName.toLowerCase() != 'menuseparator';
          el = el.previousSibling, el.parentNode.removeChild(el.nextSibling));
      menu.appendChild(indicatorBarEl);

      for (j=0, pageOrder=model.getPageOrder(); j<pageOrder.length; j++) {
        p = model.getPage(pageOrder[j]); 
        item = document.createElement('menuitem');
        item.setAttribute('label', p.title);
        suffix = menuIds[i].substr(menuIds[i].lastIndexOf('-'));
        item.setAttribute('id', 'mpagespace-page-menuitem-' + p.id + suffix);
        item.addEventListener('command', prepareOpenPageFunc(p.id), false);
        item.addEventListener('dragstart', mpagespace.dd.menuHandler.dragStart, false);
        item.addEventListener('dragend', mpagespace.dd.menuHandler.dragEnd, false);
        menu.appendChild(item);
      }
      menu.appendChild(document.createElement('menuseparator'));

      for (j=0; j<ids.length; j++) {
        item = document.getElementById(ids[j]);
        if (item)
          item.setAttribute('checked', 'true');
      }
    }
  },

  checkToolbarButtonMenu: function(menu) {
    var pageOrder = [];
    for (var el = menu.firstChild; el; el = el.nextSibling) {
      if (el.getAttribute('id').indexOf('mpagespace-page-menuitem-') != -1) {
        pageOrder.push(parseInt(el.getAttribute('id').substr('mpagespace-page-menuitem-'.length)));
      }
    }
    var modelPageOrder = mpagespace.app.getModel().getPageOrder();
    if (pageOrder.length != modelPageOrder.length) {
      mpagespace.app.populatePageTreeMenu();
      mpagespace.dump('app.checkToolbarButtonMenu: Toolbar menu updated.');
    } else {
      for (var i=0; i<pageOrder.length; i++) {
        if (pageOrder[i] != modelPageOrder[i]) {
          mpagespace.app.populatePageTreeMenu();
          mpagespace.dump('app.checkToolbarButtonMenu: Toolbar menu updated.');
          break;
        } 
      }
    }
  },

  firstRun: function() {
    if (mpagespace.fuelApplication.prefs.getValue('extensions.mpagespace.version', '0') != mpagespace.version) {

      mpagespace.fuelApplication.prefs.setValue('extensions.mpagespace.version', mpagespace.version);
      mpagespace.fuelApplication.storage.set('mpage-first-run', true); 

      mpagespace.dump('app.firstRun: Addon is set up.');
    }
  },

  isFirstRun: function(reset) {
    var result = mpagespace.fuelApplication.storage.get('mpage-first-run', false);

    if (result && reset) {
      mpagespace.fuelApplication.storage.set('mpage-first-run', false); 
    }

    return result;
  }
}
