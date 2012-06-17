// Author: Matija Podravec, 2012.

if (!mpagespace.model) mpagespace.model = {};
else if (typeof mpagespace.model != 'object')
  throw new Error('mpagespace.model already exists and is not an object');

mpagespace.app = {
  observer: {
    observe: function(subject, topic, data) {  
      if (topic == 'mpage-storage-changed') {  
        var self = mpagespace.app;
        mpagespace.dump('event: ' + topic + '/' + data);
        switch (data) {
          case 'data-loaded': 
          case 'data-imported': 
            self.populatePageTreeMenu();
            break;
          default:
            break;
        }
      }  
    }
  },

  init: function() {
    var self = mpagespace.app;
    mpagespace.observerService.addObserver(self.observer, 'mpage-storage-changed', false); 
    self.firstRun(); 
    self.populatePageTreeMenu();
  },

  close: function() {
    mpagespace.storage.getStorage().close();
    mpagespace.observerService.removeObserver(mpagespace.app.observer, 'mpage-storage-changed');
  },

  populatePageTreeMenu: function() {
    var createMenuElements = function(pages, parentEl) {
      var items = [];
      var prepareOpenPageFunc = function(pageId) {
        return function() { 
          mpagespace.openPage(pageId);
        };
      } 

      for (let i=0; i<pages.length; i++) {
        let p = pages[i];
        let hasChildrenPages = p.childrenPages && p.childrenPages.length > 0;
        let item = document.createElement(hasChildrenPages ? 'menu' : 'menuitem');
        item.setAttribute('label', p.title);
        if (hasChildrenPages) {
          createMenuElements(p.childrenPages, item);
        } else {
          item.addEventListener('command', prepareOpenPageFunc(p.pageId), false);
        }
        items.push(item);
      }
      if (parentEl) {
        let menuEl = document.createElement('menupopup');
        for (let i=0; i<items.length; i++) {
          menuEl.appendChild(items[i]);
        }
        parentEl.appendChild(menuEl);
      }
      return items;
    };

    var storage = mpagespace.storage.getStorage();
    var data = storage.getData();
    if (data == null) {
      mpagespace.dump('Storage is not loaded.');
      mpagespace.storage.getStorage().load();
      return;
    }
    var items = createMenuElements(data.tree, null);
    var menu = document.getElementById('mpagespace-menu-1');
    for (let el=menu.lastChild; 
        el && el.tagName.toLowerCase() != 'menuseparator'; 
        el = el.previousSibling, el.parentNode.removeChild(el.nextSibling));
    for (let i=0; i<items.length; i++) {
      menu.appendChild(items[i]);
    }
  },

  firstRun: function() {
    if (mpagespace.fuelApplication.prefs.getValue('extensions.mpagespace.version', '0') != mpagespace.version) {
      mpagespace.fuelApplication.prefs.setValue('extensions.mpagespace.version', mpagespace.version);

      var toolbar = document.getElementById('addon-bar') || document.getElementById('nav-bar');
      var before = document.getElementById('addonbar-closebutton');
      
      toolbar.insertItem('mpagespace-button-3', before);
      toolbar.setAttribute('currentset', toolbar.currentSet);  
      document.persist(toolbar.id, 'currentset');  
      
      if (toolbar.getAttribute('id') == 'addon-bar')
        toolbar.collapsed = false;
      
      mpagespace.dump('Addon is set up.');
    }
  }
}
