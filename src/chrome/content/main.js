var mpage;
if (!mpage) mpage = {};
else if (typeof mpage != 'object')
  throw new Error('mpage already exists and is not an object');

mpage = {
  start: function() {
    var windowEl = document.getElementById('main');
    windowEl.className = mpage.fuelApplication.prefs.getValue('extensions.mpage.theme', 'kellys');
    var panelEl = document.getElementById('panel-1');
    panelEl.addEventListener('dragover', mpage.dd.dragOver, false);
    panelEl = document.getElementById('panel-2');
    panelEl.addEventListener('dragover', mpage.dd.dragOver, false);
    panelEl = document.getElementById('panel-3');
    panelEl.addEventListener('dragover', mpage.dd.dragOver, false);
    
    mpage.view.registerObserver();
    mpage.controller.registerObserver();
    mpage.model.load();
  },

  unload: function() {
    mpage.view.unregisterObserver();
    mpage.controller.unregisterObserver();
    mpage.model.close();
  },

  openPage: function() {
    openUILinkIn('chrome://mpage/content/main.xul', 'tab');
  },

  dump: function(v) {
    if (mpage.fuelApplication.prefs.getValue('extensions.mpage.debug', false)) {
      console.log(v);
    }
  },

  translate: function(message, params) {
    var strbundle = document.getElementById('labels');
    if (params)
      return strbundle.getFormattedString(message, params);
    else
      return strbundle.getString(message);
  },

  observerService: Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService), 

  promptsService: Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),  

  fuelApplication: Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication), 

  urlParser: Components.classes["@mozilla.org/network/url-parser;1?auth=maybe"].createInstance(Components.interfaces.nsIURLParser),

  htmlService: Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML)
}
