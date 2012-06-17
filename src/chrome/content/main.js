// Author: Matija Podravec, 2012.

var mpagespace;
if (!mpagespace) mpagespace = {};
else if (typeof mpagespace != 'object')
  throw new Error('mpagespace already exists and is not an object');

mpagespace = {
  version: '0.3',

  initApp: function() {
    mpagespace.app.init();
  },

  initPage: function() {
    var pageId = window.location.hash.substr(1);
    mpagespace.view.init();
    mpagespace.view.registerObserver();
    mpagespace.controller.registerObserver();
    mpagespace.view.setTheme(mpagespace.fuelApplication.prefs.getValue('extensions.mpagespace.theme', 'kellys'));
    mpagespace.model.init(pageId);
  },

  unloadPage: function() {
    mpagespace.view.unregisterObserver();
    mpagespace.controller.unregisterObserver();
    mpagespace.model.close();
  },

  openPage: function(pageId) {
    var baseUrl = 'chrome://mpagespace/content/main.xul';
    var url = baseUrl;
    if (pageId) 
      url += '#' + pageId;

    var wm = mpagespace.windowMediator;
    var browserEnumerator = wm.getEnumerator("navigator:browser");  
    var found = false;
    while (!found && browserEnumerator.hasMoreElements()) {  
      var browserWin = browserEnumerator.getNext();  
      var tabbrowser = browserWin.gBrowser;  
      var numTabs = tabbrowser.browsers.length;  
      for (var index = 0; index < numTabs; index++) {  
        var currentBrowser = tabbrowser.getBrowserAtIndex(index);  
        if (currentBrowser.currentURI.spec.indexOf(baseUrl) != -1) {  
          tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];  
          browserWin.focus();  
          currentBrowser.loadURI(url);
          if (pageId)
            currentBrowser.reload();
          found = true;
          break;  
        }  
      }  
    }  
    if (!found) {
      openUILinkIn(url, 'tab');
    }
  },

  dump: function(v) {
    if (mpagespace.fuelApplication.prefs.getValue('extensions.mpagespace.debug', false)) {
      dump(v + '\n');
    }
  },

  translate: function(message, params) {
    var strbundle = document.getElementById('mpagespace-labels');
    if (params)
      return strbundle.getFormattedString(message, params);
    else
      return strbundle.getString(message);
  },

  test: function(option) {
    var conv = mpagespace.converter.getConverter();
    var file = FileUtils.getFile('ProfD', ['opml.xml']);  

    switch (option) {
      case 1:
        conv.exportToOpml(file);
        break;
      case 2:
        conv.importFromOpml(file);
        break;
      case 3:
        conv.exportToBookmars();
        break;
      case 4:
        conv.importFromBookmarks();
        break;
    }
  },

  observerService: Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService), 

  promptsService: Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),  

  fuelApplication: Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication), 

  urlParser: Components.classes["@mozilla.org/network/url-parser;1?auth=maybe"].createInstance(Components.interfaces.nsIURLParser),

  htmlService: Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML),

  windowMediator: Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator),

  unicodeConverter: Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter)
}

