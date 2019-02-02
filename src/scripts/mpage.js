'use strict';

let mPage = {
  init: function() {
    mPage.model = new Model();

    function processEvent(e) {
      let topic = e.type;
      let data = e.detail;
      console.log('model.observe: ' + topic + '/' + data);
      data = data.split(':');

      switch(data[0]) {
        case 'model-loaded':
          View.init();
          View.registerObserver();
          Storage.registerObserver();
          OptionsForm.init();
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
  isFirstRun: function() {
    return false;
  },
  addPage: function() {
    var pageName = prompt(Utils.translate('addPage.message'));
    if (pageName != null) {
      var model = mPage.getModel();
      var page = model.addPage(pageName, model.getPage());
      model.changeActivePage(page.id);
    }
  },

  deletePage: function() {
    if (confirm(Utils.translate('deletePage.message'))) {  
      mPage.getModel().deletePage(); 
    } 
  },

  renamePage: function() {
    var page = mPage.getModel().getPage();
    var result = prompt(Utils.translate('renamePage.message'));   
    if (result != null) {
      mPage.getModel().renamePage(page.id, result); 
    }
  },

  addFeed: function() {
    var result = prompt(Utils.translate('addFeed.message'));   
    if (result != null) {
      var page = mPage.getModel().getPage();
      var widget = page.createAndAddWidget(result, null, page.getFirstWidget());
      widget.load(true);
    }
  },
}

window.addEventListener('load', () => mPage.init(), {once: true, passive: true});
