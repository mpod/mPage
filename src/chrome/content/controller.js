// Author: Matija Podravec, 2012.

if (!mpagespace.controller) mpagespace.controller = {};
else if (typeof mpagespace.controller != 'object')
  throw new Error('mpagespace.controller already exists and is not an object');

mpagespace.controller = {

  modelChangedObserver: {
    observe : function(subject, topic, data) {  
      if (topic == 'mpage-model-changed') {  
        var widget;
        data = data.split(':');
        widget = mpagespace.model.getWidget(data[1]);
        switch (data[0]) {
          case 'widget-error': 
            mpagespace.controller.handleWidgetLoadingError(widget);     
            break;
        }
      }  
    }
  },

  registerObserver: function() {
    mpagespace.observerService.addObserver(mpagespace.controller.modelChangedObserver, 'mpage-model-changed', false); 
  },

  unregisterObserver: function() {
    mpagespace.observerService.removeObserver(mpagespace.controller.modelChangedObserver, 'mpage-model-changed');
  },
  
  subscribe: function() {
    var subscribeUrlEl = mpagespace.view.getDoc().getElementById('subscribe-url');  
    var url = subscribeUrlEl.value;
    //subscribeUrlEl.className = 'loading';
   
    var parser = mpagespace.urlParser;
    var schemePos = {}, schemeLen = {}, authPos = {}, authLen = {}, pathPos = {}, pathLen = {};
    parser.parseURL(url, url.length, schemePos, schemeLen, authPos, authLen, pathPos, pathLen);
    if (authLen.value == -1 || authLen.value == 0) {
      mpagespace.promptsService.alert(null, mpagespace.translate('invalidUrl.title'), mpagespace.translate('invalidUrl.message'));
      subscribeUrlEl.value = '';
      subscribeUrlEl.blur();
      return;
    }
    if (schemeLen.value == -1) url = 'http://' + url;
    if (pathLen.value == -1) url = url + '/'; 

    var widget = new mpagespace.feed(mpagespace.model.getNextTempId(), url);
    widget.setup = true;
    mpagespace.model.widgets[widget.id] = widget;
    var panel = mpagespace.model.layout[1];
    var refWidget;
    if (panel.length > 0) {
      refWidget = mpagespace.model.widgets[panel[0]];
    }
    mpagespace.model.insertToPanel(widget, 1, refWidget);
    widget.load();
    subscribeUrlEl.value = '';
    subscribeUrlEl.blur();
  },

  handleWidgetLoadingError: function(widget) {
    var index = 0;
    var text = widget.responseText;
    var titles = [];
    var urls = [];

    if (text == null || widget.setup == false) return;

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
      mpagespace.promptsService.alert(null, mpagespace.translate('availableFeedsError.title'), mpagespace.translate('availableFeedsError.message')); 
      mpagespace.model.remove(widget);  
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
      mpagespace.model.save(widget);
    } else {
      mpagespace.model.remove(widget);  
    }
  },

  configure: function(event) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var widget = mpagespace.model.getWidget(widgetId);
    var value = {value: widget.entriesToShow};
    var result = mpagespace.promptsService.prompt(null, mpagespace.translate('configuration.title'), mpagespace.translate('configuration.message'), value, null, {value: false});  
    if (result) {
      if (!isNaN(parseInt(value.value))) {
        widget.set('entriesToShow', parseInt(value.value));  
      }
    }
  },

  remove: function(event, self) {
    var widgetId = mpagespace.view.getWidgetId(this);
    var widget = mpagespace.model.getWidget(widgetId);

    mpagespace.model.remove(widget);
  },

  changeTheme: function(event) {
    event.preventDefault();
    event.stopPropagation();
    var items = ['light', 'kellys']; 
    var selected = {};  
    var active = mpagespace.view.getTheme();

    var result = mpagespace.promptsService.select(null, mpagespace.translate('theme.title'), 
        mpagespace.translate('theme.message', [active]), items.length,  items, selected);  
    if (result) {
      mpagespace.view.changeTheme(items[selected.value]);
      mpagespace.fuelApplication.prefs.setValue('extensions.mpagespace.theme', items[selected.value]);
    }
    return false;
  },

  openAbout: function(event) {
    event.preventDefault();
    event.stopPropagation();
    window.open('chrome://mpagespace/content/about.xul','','chrome,centerscreen,dialog');  
    return false;
  },

  handleReturnKey: function(event) {
    if (event.keyCode == 13) {
      mpagespace.controller.subscribe();
    }
  }
}

