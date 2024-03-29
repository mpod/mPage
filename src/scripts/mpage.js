'use strict';

let mPage = {
  init: function() {
    mPage.model = new Model();

    function processEvent(e) {
      let topic = e.type;
      let data = e.detail;
      console.log('mpage.observe: ' + topic + '/' + data);
      data = data.split(':');

      switch(data[0]) {
        case 'model-loaded':
          View.init();
          View.registerObserver();
          Storage.registerObserver();
          OptionsForm.init();
          break;
        case 'preferences-changed':
          var notifications = mPage.getModel().getPreferences().notifications;
          browser.runtime.sendMessage({cmd: 'notifications', value: notifications});
          break;
        default:
          break;
      }
    }
    window.document.documentElement.addEventListener('mpage-model', processEvent, false);
  
  },

  getModel: function() {
    return mPage.model;
  },

  addPage: function() {
    var pageName = prompt(browser.i18n.getMessage('addPage.message'));
    if (pageName != null) {
      var model = mPage.getModel();
      var page = model.addPage(pageName, model.getPage());
      model.changeActivePage(page.id);
    }
  },

  deletePage: function() {
    if (confirm(browser.i18n.getMessage('deletePage.message'))) {  
      mPage.getModel().deletePage(); 
    } 
  },

  renamePage: function() {
    var page = mPage.getModel().getPage();
    var result = prompt(browser.i18n.getMessage('renamePage.message'));   
    if (result != null) {
      mPage.getModel().renamePage(page.id, result); 
    }
  },

  addFeed: function() {
    var result = prompt(browser.i18n.getMessage('addFeed.message'));   
    if (result != null) {
      var page = mPage.getModel().getPage();
      var widget = page.createAndAddWidget(result, null, page.getFirstWidget());
      widget.load(true);
    }
  },

  setAsStartPage: function() {
    var order = [];
    var model = mPage.getModel();
    var activePage = model.getPage();
    order.push(activePage.id);
    for (var j=0, pageOrder=model.getPageOrder(); j<pageOrder.length; j++) {
      let p = model.getPage(pageOrder[j]);
      if (p == activePage) continue;
      order.push(p.id);
    }
    mPage.getModel().setPageOrder(order);
  },
}

window.addEventListener('load', () => mPage.init(), {once: true, passive: true});

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request && request.cmd === 'add' && request.url) {
    var page = mPage.getModel().getPage();
    var widget = page.createAndAddWidget(request.url, null, page.getFirstWidget());
    widget.load(true);
  }
});
