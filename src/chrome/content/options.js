// Author: Matija Podravec, 2012.

if (!mpagespace.options) mpagespace.options = {};
else if (typeof mpagespace.options != 'object')
  throw new Error('mpagespace.options already exists and is not an object');

Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");  

mpagespace.options = {
  init: function() {
    var theme = mpagespace.app.getTheme();
    var menulist = document.getElementById('themes');
    var item = menulist.querySelector('menuitem[value="' + theme + '"]');
    if (item != null) {
      var idx = menulist.getIndexOfItem(item);
      menulist.selectedIndex = idx;
    }
    mpagespace.options.themeSelected();
    if (theme == 'custom') {
      var file = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
      var customCssFile = mpagespace.app.getCustomCssFile();
      file.initWithPath(customCssFile);
      mpagespace.options.setCssFileControl(file);
    }

    document.getElementById('favicon-flag').checked = mpagespace.app.getFaviconFlag();
    document.getElementById('version').setAttribute('value', ' ' + mpagespace.version);

    mpagespace.options.refreshPages();
  },

  themeSelected: function() {
    var menulist = document.getElementById('themes');
    if (menulist.selectedItem.value == 'custom') {
      document.getElementById('custom-css-label').disabled = false;    
      document.getElementById('custom-css-file').disabled = false;    
      document.getElementById('custom-css-button').disabled = false;    
    } else {
      document.getElementById('custom-css-label').disabled = true;    
      document.getElementById('custom-css-file').disabled = true;    
      document.getElementById('custom-css-button').disabled = true;    
    }
  },

  chooseCssFile: function() {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"]
                       .createInstance(nsIFilePicker);
    fp.init(window, 'Choose CSS File', nsIFilePicker.modeOpen);
    fp.appendFilter('CSS files', '*.css');

    var css = mpagespace.app.getCustomCssFile();
    if (css) {
      var cssFile = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
      cssFile.initWithPath(css);
      fp.displayDirectory = cssFile.parent;
    }

    if (fp.show() == nsIFilePicker.returnOK) {
      mpagespace.options.setCssFileControl(fp.file);
    }
  },

  setCssFileControl: function(file) {
    var cssFileControl = document.getElementById('custom-css-file');
    cssFileControl.label = file.leafName;

    var ios = Components.classes["@mozilla.org/network/io-service;1"]
      .getService(Components.interfaces.nsIIOService);
    var fph = ios.getProtocolHandler("file")
      .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var icon = fph.getURLSpecFromFile(file);
    cssFileControl.image = "moz-icon://" + icon + "?size=16";
    cssFileControl.file = file;
  },

  deletePage: function() {
    var menu = document.getElementById('pages');
    var pageId = parseInt(menu.value);
    var model = mpagespace.app.getModel();

    if (mpagespace.promptsService.confirm(null, mpagespace.translate('deletePage.title'), 
          mpagespace.translate('deletePage.message'))) {  
      try {
          model.deletePage(pageId); 
          mpagespace.options.refreshPages();
      } catch (e) {
        alert(e.message);
      }
    } 
  },

  renamePage: function() {
    var menu = document.getElementById('pages');
    var pageId = parseInt(menu.value);
    var model = mpagespace.app.getModel();
    var title = document.getElementById('new-page-title').value;

    model.renamePage(pageId, title); 
    mpagespace.options.refreshPages(true);
  },

  refreshPages: function(keepSelectedIndex) {
    var model = mpagespace.app.getModel();
    var pages = model.getPages(model.GET_PAGES_ARRAY);
    var pagesMenu = document.getElementById('pages');
    var idx = keepSelectedIndex ? pagesMenu.selectedIndex : 0;
    pagesMenu.selectedIndex = -1;
    
    while (pagesMenu.firstChild != null)
      pagesMenu.removeChild(pagesMenu.firstChild);

    pagesMenu.appendChild(document.createElement('menupopup'));
    for (var i=0; i<pages.length; i++) {
      var el = document.createElement('menuitem');
      el.setAttribute('label', pages[i].title);
      el.setAttribute('value', pages[i].id);
      pagesMenu.firstChild.appendChild(el);
    }
    pagesMenu.selectedIndex = idx;
  },

  reset: function() {
    if (mpagespace.promptsService.confirm(null, mpagespace.translate('reset.title'), 
         mpagespace.translate('reset.message'))) {  
      mpagespace.app.getModel().reset();
      mpagespace.options.refreshPages();
    }
  },

  sendEmail: function(address) {
    var extProtocolSvc = Components.classes['@mozilla.org/uriloader/external-protocol-service;1']
      .getService(Components.interfaces.nsIExternalProtocolService);
    var ios = Components.classes['@mozilla.org/network/io-service;1']
      .getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI('mailto:' + address, null, null);
    if (extProtocolSvc)
      extProtocolSvc.loadUrl(uri);
  },

  export: function() {
    if (document.getElementById('export-to').selectedIndex == 0) {
      var file = mpagespace.options.pickFile('save');
      if (file) { 
        mpagespace.converter.exportToOpml(file);
      } else {
        document.getElementById('export-results').setAttribute('value', mpagespace.translate('export.failed.label'));
        return;
      }
    } else {
      mpagespace.converter.exportToBookmarks();
    }
    document.getElementById('export-results').setAttribute('value', mpagespace.translate('export.success.label'));
  },

  pickFile: function(mode) {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    if (mode == 'save') {
      fp.init(window, mpagespace.translate('filePicker.export.title'), nsIFilePicker.modeSave);
    } else {
      fp.init(window, mpagespace.translate('filePicker.import.title'), nsIFilePicker.modeOpen);
    }

    fp.defaultString = 'mpage-subscription.xml';
    fp.defaultExtension = '.xml';
    fp.appendFilter('XML files', '*.xml');
    fp.appendFilters(nsIFilePicker.filterAll);
    var rv = fp.show();
    if (rv != nsIFilePicker.returnOK && rv != nsIFilePicker.returnReplace)
      return null;

    return fp.file;
  },

  import: function() {
    var merge = document.getElementById('import-mode').selectedIndex == 0 ? true : false;

    if (document.getElementById('import-from').selectedIndex == 0) {
      var file = mpagespace.options.pickFile('open');
      if (file) {
        mpagespace.converter.importFromOpml(file, merge);
      } else {
        document.getElementById('import-results').setAttribute('value', mpagespace.translate('import.error.label'));
        return;
      }
    } else {
      mpagespace.converter.importFromBookmarks(merge);
    }
    document.getElementById('import-results').setAttribute('value', mpagespace.translate('import.success.label'));
    mpagespace.options.refreshPages();
  },

  acceptDialog: function() {
    var faviconFlag = document.getElementById('favicon-flag').checked;
    mpagespace.app.setFaviconFlag(faviconFlag);

    var theme = document.getElementById('themes').value;
    var cssFileControl = document.getElementById('custom-css-file');
    if (theme == 'custom' && cssFileControl.file == null) {
      alert(mpagespace.translate('cssfile.error.message'));
      return false;
    }
    mpagespace.app.setTheme(theme, cssFileControl.file ? cssFileControl.file.path : null);
    return true;
  },

  cancelDialog: function() {
    return true;
  }

}


