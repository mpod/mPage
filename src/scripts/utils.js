'use strict';

let Utils = {

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
          dest[name] = Utils.extend(oldval, newval);
        } else if (typeof newval === 'object') {
          oldval = oldval && typeof oldval === 'object' ? oldval : {};
          dest[name] = Utils.extend(oldval, newval);
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
  }

}


// Localization
var localization = () => {
    document.querySelectorAll('[data-i18n]')
    .forEach((node) => {
        node.textContent = browser.i18n.getMessage(node.dataset.i18n);
    });
}

window.onload = () => {
  localization();
}

