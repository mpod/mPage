// Author: Matija Podravec, 2012-2013

var mpagespace;
if (!mpagespace) mpagespace = {};
else if (typeof mpagespace != 'object')
  throw new Error('mpagespace already exists and is not an object');

mpagespace = {
  version: '0.7',

  initPage: function() {
    var model = mpagespace.app.getModel();
    var page = model.getPage();
    if (page == null) {
      model.changeActivePage();
    } else {
      page.load();
    }
    mpagespace.view.init();
    mpagespace.view.registerObserver();
    mpagespace.controller.registerObserver();
    mpagespace.view.draw();
  },

  unloadPage: function() {
    mpagespace.view.unregisterObserver();
    mpagespace.controller.unregisterObserver();
  },

  dump: function() {
    var debug;
    try {
      debug = mpagespace.prefService.getBoolPref('debug');
    } catch (e) {
      debug = false;
    }
    if (debug) {
      var v = [];
      var objToString = function(obj) {
        var str = [];
        if (Array.isArray(obj)) {
          for (var i=0; i<obj.length; i++) {
            str.push(objToString(obj[i]));
          }
          return '[' + str.join(', ') + ']';
        } else if (obj === null) {
          return 'null';
        } else if (obj === undefined) {
          return 'undefined';
        } else if (typeof obj == 'object') {
          for (var n in obj) {
            str.push(n + ': ' + objToString(obj[n]));
          }
          return '{' + str.join(', ') + '}';
        } else 
          return obj;
      }

      for (var i=0; i<arguments.length; i++) {
        v.push(objToString(arguments[i]));
      }
      dump(v.join(', ') + '\n');
    }
  },

  extend: function() {
    var dest = arguments[0] || {};
    var src, name, oldval, newval;

    for (var i=1; i<arguments.length; i++) {
      src = arguments[i];
      if (src == null) continue; 

      for (var name in src) {
        oldval = dest[name];  
        newval = src[name];

        if (dest === newval) continue;

        if (Array.isArray(newval)) {
          oldval = Array.isArray(oldval) ? oldval : [];
          dest[name] = mpagespace.extend(oldval, newval);
        } else if (typeof newval === 'object') {
          oldval = oldval && typeof oldval === 'object' ? oldval : {};
          dest[name] = mpagespace.extend(oldval, newval);
        } else {
          dest[name] = newval;
        }
      }
    }
    return dest;
  },

  map: function(array, callback) {
    var result = [];
    var value;

    if (!Array.isArray(array))
      throw new Error('main.map: argument is not an array.');

    for (var i=0; i<array.length; i++) {
      value = callback(array[i]);
      if (value != null)
        result.push(value);
    }
    return result;
  },

  translate: function(message, params) {
    var strbundle = document.getElementById('mpagespace-labels');
    if (params)
      return strbundle.getFormattedString(message, params);
    else
      return strbundle.getString(message);
  },

  observerService: Components.classes["@mozilla.org/observer-service;1"]
    .getService(Components.interfaces.nsIObserverService), 

  promptsService: Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
    .getService(Components.interfaces.nsIPromptService),  

  prefService: Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.mpagespace."),

  fontPrefService: Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService).getBranch("font.language."),

  singletonService: Components.utils.import("chrome://mpagespace/content/singleton.jsm"),

  urlParser: Components.classes["@mozilla.org/network/url-parser;1?auth=maybe"]
    .createInstance(Components.interfaces.nsIURLParser),

  windowMediator: Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator),

  unicodeConverter: Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Components.interfaces.nsIScriptableUnicodeConverter)
}

