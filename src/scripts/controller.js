'use strict';

let Controller = {
  processEvent: function(e) {  
    var self = View;
    let topic = e.type;
    let data = e.detail;

    if (topic == 'mpage-model') {
      data = data.split(':');
      switch (data[0]) {
        case 'page-loaded':
          mpagespace.dump('controller.observe: ' + topic + '/' + data.join(':'));
          mpagespace.app.getModel().getSync().synchronize(data[1]); 
          break;
      }
    }
  },

  registerObserver: function() {
    window.document.documentElement.addEventListener('mpage-model', Controller.processEvent, false);
    //mpagespace.observerService.addObserver(mpagespace.controller.observer, 'mpage-model', false);
  },

  unregisterObserver: function() {
    window.document.documentElement.addEventListener('mpage-model', Controller.processEvent, false);
    //mpagespace.observerService.removeObserver(mpagespace.controller.observer, 'mpage-model');
  },

  onLinkClick: function(event) {
    var widgetId = View.getWidgetId(this);
    var widget = mPage.getModel().getPage().getWidget(widgetId);
    if (widget) {
      widget.startVisitedFilterTimer(); 
    }
    this.blur();
  },

  configure: function(event) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var model = mpagespace.app.getModel();
    var widget = model.getPage().getWidget(widgetId);
    var pageOrder = model.getPageOrder();
    var activePageId = model.activePageId;
    var pages = model.getPages(model.GET_PAGES_ARRAY);
    var returnValue = {accepted: false};
    window.openDialog('chrome://mpagespace/content/feed-setup.xul','','chrome,modal,centerscreen', widget, pages, activePageId, returnValue);  

    if (returnValue.accepted) {
      widget.setBulk(returnValue.config);
    }
  },

  remove: function(event, self) {
    var widgetId = View.getWidgetId(this);
    var page = mPage.getModel().getPage();
    var widget = page.getWidget(widgetId);

    page.deleteWidget(widget);
  }
}

