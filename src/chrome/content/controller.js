// Author: Matija Podravec, 2012.

if (!mpagespace.controller) mpagespace.controller = {};
else if (typeof mpagespace.controller != 'object')
  throw new Error('mpagespace.controller already exists and is not an object');

mpagespace.controller = {

  observer: {
    observe : function(subject, topic, data) {  
      if (topic == 'mpage-model') {  
        var widget;
        data = data.split(':');
        widget = mpagespace.app.getModel().getPage().getWidget(data[1]);
        switch (data[0]) {
          case 'widget-loading-exception': 
            mpagespace.dump('controller.observe: ' + topic + '/' + data);
            mpagespace.controller.handleWidgetLoadingError(widget);     
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
  
  subscribe: function() {
    var subscribeUrlEl = mpagespace.view.getDoc().getElementById('subscribe-url');  
    var url = subscribeUrlEl.value;
    //subscribeUrlEl.className = 'loading';
   
    var parser = mpagespace.urlParser;
    var schemePos = {}, schemeLen = {}, authPos = {}, authLen = {}, pathPos = {}, pathLen = {};
    parser.parseURL(url, url.length, schemePos, schemeLen, authPos, authLen, pathPos, pathLen);
    if (authLen.value == -1 || authLen.value == 0) {
      mpagespace.promptsService.alert(null, mpagespace.translate('invalidUrl.title'), 
          mpagespace.translate('invalidUrl.message'));
      subscribeUrlEl.value = '';
      subscribeUrlEl.blur();
      return false;
    }
    if (schemeLen.value == -1) url = 'http://' + url;
    if (pathLen.value == -1) url = url + '/'; 

    mpagespace.app.getModel().getPage().createAndAddWidget(url, true, false);

    subscribeUrlEl.value = '';
    subscribeUrlEl.blur();
    return false;
  },

  handleWidgetLoadingError: function(widget) {
    var index = 0;
    var text = widget.responseText.toLowerCase();
    var titles = [];
    var urls = [];

    widget.setup = false;

    while ((index = text.indexOf('<link', index)) != -1) {
      var endIndex = text.indexOf('/>', index);
      if (endIndex == -1) endIndex = text.indexOf('</link>', index);
      if (endIndex != -1) {
        var attributes = text.substr(index, endIndex - index).match(/\w+\s*=\s*("[^"]*")|('[^']*')/ig);
        var title, href, type;
        for (var i=0; i<attributes.length; i++) {
          var attribute = attributes[i].split('=');
          if (attribute.length != 2) continue;
          attribute[1] = attribute[1].substr(1, attribute[1].length - 2).trim();
          if (attribute[0].trim() == 'type') type = attribute[1];
          if (attribute[0].trim() == 'href') href = attribute[1];
          if (attribute[0].trim() == 'title') title = attribute[1];
        }
        if (type == 'application/rss+xml' || type == 'application/atom+xml') {
          titles.push(title);
          urls.push(href);
        }
      }
      index++;
    }
    if (titles.length == 0) {
      mpagespace.promptsService.alert(null, mpagespace.translate('availableFeedsError.title'), 
          mpagespace.translate('availableFeedsError.message')); 
      widget.page.deleteWidget(widget);  
      return;
    }
    
    var selected = {};
    var result;
    if (titles.length == 1) {
      result = true;
      selected.value = 0;
    } else {
      result = mpagespace.promptsService.select(null, mpagespace.translate('availableFeeds.title'), 
        mpagespace.translate('availableFeeds.message'), titles.length, titles, selected); 
    }
    if (result) {
      var url1 = widget.url;
      var parser = mpagespace.urlParser;
      var schemePos1 = {}, schemeLen1 = {}, authPos1 = {}, authLen1 = {}, pathPos1 = {}, pathLen1 = {};
      parser.parseURL(url1, url1.length, schemePos1, schemeLen1, authPos1, authLen1, pathPos1, pathLen1);

      var url2 = urls[selected.value];
      var schemePos2 = {}, schemeLen2 = {}, authPos2 = {}, authLen2 = {}, pathPos2 = {}, pathLen2 = {};
      parser.parseURL(url2, url2.length, schemePos2, schemeLen2, authPos2, authLen2, pathPos2, pathLen2);

      self.url = url2;
      if (schemeLen2.value == -1) 
        widget.url = 'http://' + url1.substr(authPos1.value, authLen1.value) + url2.substr(pathPos2.value, pathLen2.value); 
      else
        widget.url = url2;
      
      widget.load();
    } else {
      widget.page.deleteWidget(widget);  
    }
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
      if (activePageId != returnValue.pageId) {
        model.moveWidgetToPage(widget, returnValue.pageId);
      }
    }
  },

  remove: function(event, self) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var page = mpagespace.app.getModel().getPage();
    var widget = page.getWidget(widgetId);

    //if (mpagespace.promptsService.confirm(null, mpagespace.translate('deleteWidget.title'), 
    //      mpagespace.translate('deleteWidget.message'))) {  
      page.deleteWidget(widget);
    //}
  },

  toggleWidget: function(event, self) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var widget = mpagespace.app.getModel().getPage().getWidget(widgetId);
    var hide = !widget.minimized;

    widget.set('minimized', hide);
  }
}

