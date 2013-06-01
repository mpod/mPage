// Author: Matija Podravec, 2012.

if (!mpagespace.controller) mpagespace.controller = {};
else if (typeof mpagespace.controller != 'object')
  throw new Error('mpagespace.controller already exists and is not an object');

mpagespace.controller = {
  observer: {
    observe : function(subject, topic, data) {
      if (topic == 'mpage-model') {
        data = data.split(':');
        switch (data[0]) {
          case 'page-loaded':
            mpagespace.dump('controller.observe: ' + topic + '/' + data.join(':'));
            mpagespace.app.getModel().getSync().synchronize(data[1]); 
            break;
        }
      }
    }
  },

  registerObserver: function() {
    mpagespace.observerService.addObserver(mpagespace.controller.observer, 'mpage-model', false);
  },

  unregisterObserver: function() {
    mpagespace.observerService.removeObserver(mpagespace.controller.observer, 'mpage-model');
  },

  onLinkClick: function(event) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var widget = mpagespace.app.getModel().getPage().getWidget(widgetId);
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
    var widgetId = mpagespace.view.getWidgetId(this);
    var page = mpagespace.app.getModel().getPage();
    var widget = page.getWidget(widgetId);

    page.deleteWidget(widget);
  },

  toggleWidget: function(event, self) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var widget = mpagespace.app.getModel().getPage().getWidget(widgetId);
    var hide = !widget.minimized;

    widget.set('minimized', hide);
  }
}

