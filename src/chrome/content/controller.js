if (!mpage.controller) mpage.controller = {};
else if (typeof mpage.controller != 'object')
  throw new Error('mpage.controller already exists and is not an object');

mpage.controller = {

  modelChangedObserver: {
    observe : function(subject, topic, data) {  
      if (topic == 'mpage-model-changed') {  
        var widget;
        data = data.split(':');
        widget = mpage.model.getWidget(data[1]);
        switch (data[0]) {
          case 'widget-error': 
            mpage.controller.handleWidgetLoadingError(widget);     
            break;
        }
      }  
    }
  },

  registerObserver: function() {
    mpage.observerService.addObserver(mpage.controller.modelChangedObserver, 'mpage-model-changed', false); 
  },

  unregisterObserver: function() {
    mpage.observerService.removeObserver(mpage.controller.modelChangedObserver, 'mpage-model-changed');
  },
  
  subscribe: function() {
    var subscribeUrlEl = mpage.view.getDoc().getElementById('subscribe-url');  
    var url = subscribeUrlEl.value;
    //subscribeUrlEl.className = 'loading';
   
    var parser = mpage.urlParser;
    var schemePos = {}, schemeLen = {}, authPos = {}, authLen = {}, pathPos = {}, pathLen = {};
    parser.parseURL(url, url.length, schemePos, schemeLen, authPos, authLen, pathPos, pathLen);
    if (authLen.value == -1 || authLen.value == 0) {
      mpage.promptsService.alert(null, mpage.translate('invalidUrl.title'), mpage.translate('invalidUrl.message'));
      subscribeUrlEl.value = '';
      subscribeUrlEl.blur();
      return;
    }
    if (schemeLen.value == -1) url = 'http://' + url;
    if (pathLen.value == -1) url = url + '/'; 

    var widget = new mpage.feed(mpage.model.getNextTempId(), url);
    widget.setup = true;
    mpage.model.widgets[widget.id] = widget;
    var panel = mpage.model.layout[1];
    var refWidget;
    if (panel.length > 0) {
      refWidget = mpage.model.widgets[panel[0]];
    }
    mpage.model.insertToPanel(widget, 1, refWidget);
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
      mpage.promptsService.alert(null, mpage.translate('availableFeedsError.title'), mpage.translate('availableFeedsError.message')); 
      mpage.model.remove(widget);  
      return;
    }
    
    var selected = {};
    var result;
    if (titles.length == 1) {
      result = true;
      selected.value = 0;
    } else {
      result = mpage.promptsService.select(null, mpage.translate('availableFeeds.title'), 
        mpage.translate('availableFeeds.message'), titles.length, titles, selected); 
    }
    if (result) {
      var url1 = widget.url;
      var parser = mpage.urlParser;
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
      mpage.model.save(widget);
    } else {
      mpage.model.remove(widget);  
    }
  },

  configure: function(event) {
    var widgetId = mpage.view.getWidgetId(this);
    var widget = mpage.model.getWidget(widgetId);
    var value = {value: widget.entriesToShow};
    var strbundle = document.getElementById('labels');
    var result = mpage.promptsService.prompt(null, strbundle.getString('configuration.title'), strbundle.getString('configuration.message'), value, null, {value: false});  
    if (result) {
      if (!isNaN(parseInt(value.value))) {
        widget.set('entriesToShow', parseInt(value.value));  
      }
    }
  },

  remove: function(event, self) {
    var widgetId = mpage.view.getWidgetId(this);
    var widget = mpage.model.getWidget(widgetId);

    mpage.model.remove(widget);
  },

  changeTheme: function(event) {
    event.preventDefault();
    event.stopPropagation();
    var items = ['light', 'kellys']; 
    var selected = {};  
    var strbundle = document.getElementById('labels');
    var active = mpage.view.getTheme();

    var result = mpage.promptsService.select(null, strbundle.getString('theme.title'), 
        strbundle.getFormattedString('theme.message', [active]), items.length,  items, selected);  
    if (result) {
      mpage.view.changeTheme(items[selected.value]);
      mpage.fuelApplication.prefs.setValue('extensions.mpage.theme', items[selected.value]);
    }
    return false;
  },

  openAbout: function(event) {
    event.preventDefault();
    event.stopPropagation();
    window.open('chrome://mpage/content/about.xul','','chrome,centerscreen,dialog');  
    return false;
  },

  handleReturnKey: function(event) {
    if (event.keyCode == 13) {
      mpage.controller.subscribe();
    }
  }
}

