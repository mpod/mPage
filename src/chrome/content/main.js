var mpagespace;
if (!mpagespace) mpagespace = {};
else if (typeof mpagespace != 'object')
  throw new Error('mpagespace already exists and is not an object');

mpagespace = {
  start: function() {
    mpagespace.view.init();
    mpagespace.model.init();
    mpagespace.view.registerObserver();
    mpagespace.controller.registerObserver();
    mpagespace.view.changeTheme(mpagespace.fuelApplication.prefs.getValue('extensions.mpagespace.theme', 'kellys'));
  },

  unload: function() {
    mpagespace.view.unregisterObserver();
    mpagespace.controller.unregisterObserver();
    mpagespace.model.close();
  },

  openPage: function() {
    openUILinkIn('chrome://mpagespace/content/main.xul', 'tab');
  },

  dump: function(v) {
    if (mpagespace.fuelApplication.prefs.getValue('extensions.mpagespace.debug', false)) {
      console.log(v);
    }
  },

  translate: function(message, params) {
    var strbundle = document.getElementById('mpagespace-labels');
    if (params)
      return strbundle.getFormattedString(message, params);
    else
      return strbundle.getString(message);
  },

  observerService: Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService), 

  promptsService: Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),  

  fuelApplication: Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication), 

  urlParser: Components.classes["@mozilla.org/network/url-parser;1?auth=maybe"].createInstance(Components.interfaces.nsIURLParser),

  htmlService: Components.classes["@mozilla.org/feed-unescapehtml;1"].getService(Components.interfaces.nsIScriptableUnescapeHTML),

  unicodeConverter: Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter)
}
