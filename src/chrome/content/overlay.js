// Author: Matija Podravec, 2012.

if (!mpagespace.overlay) mpagespace.overlay = {};
else if (typeof mpagespace.overlay != 'object')
  throw new Error('mpagespace.overlay already exists and is not an object');

mpagespace.overlay = {
  exportToOpml: function() {
    var self = mpagespace.overlay;
    var file = self.pickFile('save');

    if (file) {
      mpagespace.converter.getConverter().exportToOpml(file);
    }
  },

  importFromOpml: function() {
    var self = mpagespace.overlay;
    var file = self.pickFile('open');

    if (file) {
      mpagespace.converter.getConverter().importFromOpml(file);
    }
  },

  exportToBookmarks: function() {
    mpagespace.converter.getConverter().exportToBookmarks();
  },

  importFromBookmarks: function() {
    mpagespace.converter.getConverter().importFromBookmarks();
  },
  
  pickFile: function(mode) {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    if (mode == 'save') {
      fp.init(window, 'Export to opml file', nsIFilePicker.modeSave);
    } else {
      fp.init(window, 'Import from opml file', nsIFilePicker.modeOpen);
    }

    fp.defaultString = 'mpage-subscription.xml';
    fp.defaultExtension = '.xml';
    fp.appendFilter('XML files', '*.xml');
    fp.appendFilters(nsIFilePicker.filterAll);
    var rv = fp.show();
    if (rv != nsIFilePicker.returnOK && rv != nsIFilePicker.returnReplace)
      return null;

    return fp.file;
  }
}

window.addEventListener("load", function() { 
  mpagespace.initApp();
}, false);

