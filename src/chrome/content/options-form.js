// Author: Matija Podravec, 2012-2013

if (!mpagespace.options) mpagespace.optionsForm = {};
else if (typeof mpagespace.optionsForm != 'object')
  throw new Error('mpagespace.optionsForm already exists and is not an object');

Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");  

mpagespace.optionsForm = {
  init: function() {
    var addOnChangeListener = function(id) {
      var el = document.getElementById(id);
      el.addEventListener('change', function() {
        document.getElementById('colorScheme').selectedIndex = 0;
        mpagespace.optionsForm.setColorScheme();
        mpagespace.optionsForm.apply();
      }, false);
    }

    var selectItem = mpagespace.optionsForm.selectMenuItem;

    // Init colors
    mpagespace.map(['colorBackground', 'colorBorder', 'colorLink', 'colorVisited',
        'colorTitle', 'colorMenu', 'colorMenuText', 'colorMenuSel', 'colorError'], 
        addOnChangeListener); 

    var model = mpagespace.app.getModel();
    var pref = model.getPreferences();
    var el, idx, menu, item, i, popup, list;

    menu = document.getElementById('schemeType');
    selectItem(menu, pref.schemeType);
    mpagespace.optionsForm.setSchemeType();

    menu = document.getElementById('colorScheme');
    selectItem(menu, pref.schemeName);
    mpagespace.optionsForm.setColors(pref);
    mpagespace.optionsForm.toggleCustomSchemeSave();

    // Init fonts
    var languageGroup = mpagespace.fuelApplication.prefs.getValue('font.language.group', '');
    menu = document.getElementById('fontFamily');
    FontBuilder.buildFontList(languageGroup, null, menu);
    var fontFamilies = [
      '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
      '"Courier New", Courier, monospace',
      '"Arial Narrow", sans-serif',
      'Verdana, Geneva, sans-serif',
      'Georgia, serif',
      'Arial, Helvetica, sans-serif',
      '"Lucida Console", Monaco, monospace',
      '"Trebuchet MS", Helvetica, sans-serif',
      '"Copperplate / Copperplate", "Gothic Light", sans-serif', 
      'Impact, Charcoal, sans-serif',
      'Consolas, Monaco, "Andale Mono", monospace', 
      '"Lucida Sans", Helvetica, sans-serif',
      '"Proxima Nova Regular", "Helvetica Neue", Arial, Helvetica, sans-serif',
      'Helvetica, Arial, Verdana, sans-serif'
    ];
    popup = menu.querySelector('menupopup');
    el = document.createElement('menuseparator');
    popup.insertBefore(el, popup.firstChild);
    for (i=0; i<fontFamilies.length; i++) {
      item = document.createElement('menuitem');
      item.setAttribute('value', fontFamilies[i]);
      item.setAttribute('label', fontFamilies[i].replace(/"/g, ''));
      popup.insertBefore(item, popup.firstChild);
    }
    menu.selectedIndex = 0;
    idx = selectItem(menu, pref.font.family);
    if (idx == -1) {
      i = pref.font.family.length;
      selectItem(menu, pref.font.family.substr(1, i - 2));
    }

    menu = document.getElementById('fontSize');
    selectItem(menu, pref.font.size);

    // Init custom css file
    if (pref.customCss) {
      document.getElementById('customCssFileChk').checked = true;
      var file = Components.classes["@mozilla.org/file/local;1"]
                .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(pref.customCss);
      mpagespace.optionsForm.setCssFileControl(file);
      document.getElementById('customCssFileBtn').disabled = false;
      document.getElementById('customCssFile').disabled = false;
    } else {
      document.getElementById('customCssFileChk').checked = false;
      document.getElementById('customCssFileBtn').disabled = true;
      document.getElementById('customCssFile').disabled = true;
    }

    // Init layout
    menu = document.getElementById('numberOfPanels');
    selectItem(menu, pref.layout.numberOfPanels);

    // Init favicons
    document.getElementById('favicon').checked = pref.favicon;

    // Init sync
    var bkmkserv = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                             .getService(Components.interfaces.nsINavBookmarksService);
    list = model.getPages(model.GET_PAGES_ARRAY);
    menu = document.getElementById('pagesList');
    popup = menu.querySelector('menupopup'); 
    while (popup.hasChildNodes()) popup.removeChild(popup.firstChild);
    while (el = document.getElementById('syncList').querySelector('listitem')) el.parentNode.removeChild(el);
    for (i=0; i<list.length; i++) {
      var syncBookmarkFolder = model.getSync().getSyncBookmarkFolderForPage(list[i].id);
      if (syncBookmarkFolder) {
        item = document.createElement('listitem');
        item.value = list[i].id + ',' + syncBookmarkFolder;
        el = document.createElement('listcell');
        el.setAttribute('label', list[i].title);
        item.appendChild(el);
        el = document.createElement('listcell');
        el.setAttribute('label', bkmkserv.getItemTitle(syncBookmarkFolder));
        item.appendChild(el);
        document.getElementById('syncList').appendChild(item);
      } else {
        item = document.createElement('menuitem');
        item.setAttribute('value', list[i].id);
        item.setAttribute('label', list[i].title);
        popup.appendChild(item);
      }
    }
    menu.selectedIndex = 0;

    // Defere loading of bookmarks list
    window.setTimeout(function(){
      list = mpagespace.optionsForm.getBookmarksList();
      menu = document.getElementById('bookmarksList');
      popup = menu.querySelector('menupopup'); 
      while (popup.hasChildNodes()) popup.removeChild(popup.firstChild);
      for (i=0; i<list.length; i++) {
        item = document.createElement('menuitem');
        item.setAttribute('value', list[i].id);
        item.setAttribute('label', list[i].title);
        popup.appendChild(item);
      }
      menu.selectedIndex = 0;
    }, 10);

    // Init misc
    document.getElementById('lock').checked = pref.lock;
    document.getElementById('toolbar').checked = pref.toolbar;

    // Init about
    document.getElementById('version').setAttribute('value', ' ' + mpagespace.version);

    document.querySelector('tab').focus();
    mpagespace.dump('optionsForm.init: Done');
  },

  selectMenuItem: function(menu, value) {
    var item, idx;
    item = menu.querySelector("menuitem[value='" + value + "']");
    idx = menu.getIndexOfItem(item);
    if (idx != -1) menu.selectedIndex = idx;
    return idx;
  },

  setSchemeType: function() {
    var typeEl = document.getElementById('schemeType');
    var type = typeEl.value;
    var prevType;
    var schemesMenuEl = document.getElementById('colorScheme');
   
    while (schemesMenuEl.hasChildNodes()) schemesMenuEl.removeChild(schemesMenuEl.firstChild); 
    var popupEl = document.createElement('menupopup');
    schemesMenuEl.appendChild(popupEl);
    var schemes = mpagespace.app.getModel().getColorSchemes().getSchemeNames(type);
    for (var i=0; i<schemes.length; i++) {
      var el;
      if (schemes[i] == '-') {
        el = document.createElement('menuseparator');
      } else {
        el = document.createElement('menuitem');
        el.setAttribute('value', schemes[i]);
        if (schemes[i] == 'custom') {
          el.setAttribute('label', mpagespace.translate('options.schemes.custom'));
        } else if (schemes[i] == 'default') {
          el.setAttribute('label', mpagespace.translate('options.schemes.default'));
        } else {
          el.setAttribute('label', schemes[i]);
        }
      }
      popupEl.appendChild(el);
    }
    schemesMenuEl.selectedIndex = 0;
  },

  setColorScheme: function() {
    var type = document.getElementById('schemeType').value;
    var name = document.getElementById('colorScheme').value;

    mpagespace.optionsForm.toggleCustomSchemeSave();

    var colors = mpagespace.app.getModel().getColorSchemes().getScheme(type, name);
    if (colors) {
      var pref = new mpagespace.model.preferences({schemeType: type, colors: colors});
      mpagespace.optionsForm.setColors(pref);
      mpagespace.optionsForm.apply();
    }
  },

  setColors: function(pref) {
    var el;

    el = document.getElementById('colorBackground');
    el.color = pref.colors.background;
    el = document.getElementById('colorBorder');
    el.color = pref.colors.border;
    el = document.getElementById('colorLink');
    el.color = pref.colors.link;
    el = document.getElementById('colorVisited');
    el.color = pref.colors.visited;
    el = document.getElementById('colorTitle');
    el.color = pref.colors.title;
    el = document.getElementById('colorMenu');
    el.color = pref.colors.menu;
    el = document.getElementById('colorMenuText');
    el.color = pref.colors.menuText;
    el = document.getElementById('colorMenuSel');
    el.color = pref.colors.menuSel;
    el = document.getElementById('colorError');
    el.color = pref.colors.misc;
  },

  shuffleColors: function() {
    var schemes = mpagespace.app.getModel().getColorSchemes();

    var pref = new mpagespace.model.preferences({colors: schemes.getShuffledScheme()});
    mpagespace.optionsForm.setColors(pref);
    document.getElementById('colorScheme').selectedIndex = 0;
    mpagespace.optionsForm.toggleCustomSchemeSave();
    mpagespace.optionsForm.apply();
  },

  saveCustomScheme: function() {
    var textboxEl = document.getElementById('customSchemeSaveBox').querySelector('textbox');
    var name = textboxEl.value;
    var model = mpagespace.app.getModel();
    var schemes = model.getColorSchemes();
    var pref = model.getPreferences();
    var schemeType = document.getElementById('schemeType').value;

    textboxEl.value = '';
    schemes.addScheme(schemeType, name, pref.colors);
    mpagespace.optionsForm.setSchemeType();
    mpagespace.optionsForm.selectMenuItem(document.getElementById('colorScheme'), name);
    mpagespace.optionsForm.apply();
  },

  toggleCustomCss: function() {
    var checked = document.getElementById('customCssFileChk').checked;

    if (checked) {
      document.getElementById('customCssFileBtn').disabled = false;
      document.getElementById('customCssFile').disabled = false;
    } else {
      document.getElementById('customCssFileBtn').disabled = true;
      document.getElementById('customCssFile').disabled = true;
    }
    mpagespace.optionsForm.apply();
  },

  toggleCustomSchemeSave: function() {
    var name = document.getElementById('colorScheme').value;
    var el = document.getElementById('customSchemeSaveBox').firstChild;

    while (el) {
      if (el.nodeType == Node.ELEMENT_NODE)
        el.disabled = name != 'custom';
      el = el.nextSibling;
    }
  },

  browseCssFile: function() {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes['@mozilla.org/filepicker;1']
                       .createInstance(nsIFilePicker);
    fp.init(window, mpagespace.translate('options.customcss.dialog.title'), 
        nsIFilePicker.modeOpen);
    fp.appendFilter(mpagespace.translate('options.customcss.dialog.filetype'), '*.css');

    var cssFile = document.getElementById('customCssFile');
    if (cssFile) {
      fp.displayDirectory = cssFile.parent;
    }

    if (fp.show() == nsIFilePicker.returnOK) {
      mpagespace.optionsForm.setCssFileControl(fp.file);
      mpagespace.optionsForm.apply();
    }
  },

  setCssFileControl: function(file) {
    var cssFileControl = document.getElementById('customCssFile');
    cssFileControl.label = file.leafName;

    var ios = Components.classes['@mozilla.org/network/io-service;1']
      .getService(Components.interfaces.nsIIOService);
    var fph = ios.getProtocolHandler("file")
      .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
    var icon = fph.getURLSpecFromFile(file);
    cssFileControl.image = 'moz-icon://' + icon + '?size=16';
    cssFileControl.file = file;
  },

  apply: function() {
    var f = null;
    if (document.getElementById('customCssFileChk').checked) {
      f = document.getElementById('customCssFile').file;
      if (f) f = f.path;
    }
    var config = {
      schemeType: document.getElementById('schemeType').value,
      schemeName: document.getElementById('colorScheme').value,
      colors: {
        background: document.getElementById('colorBackground').color,
        border: document.getElementById('colorBorder').color,
        link: document.getElementById('colorLink').color,
        visited: document.getElementById('colorVisited').color,
        title: document.getElementById('colorTitle').color,
        menu: document.getElementById('colorMenu').color,
        menuText: document.getElementById('colorMenuText').color,
        menuSel: document.getElementById('colorMenuSel').color,  
        misc: document.getElementById('colorError').color
      },
      font: {
        family: document.getElementById('fontFamily').value,
        size: document.getElementById('fontSize').value
      },
      layout: {
        numberOfPanels: parseInt(document.getElementById('numberOfPanels').value)
      },
      customCss: f,
      favicon: document.getElementById('favicon').checked,
      toolbar: document.getElementById('toolbar').checked,
      lock: document.getElementById('lock').checked
    };

    if (config.font.family.indexOf(' ') != -1 && config.font.family.indexOf(',') == -1)
      config.font.family = '"' + config.font.family + '"';

    var pref = new mpagespace.model.preferences(config);
    mpagespace.app.getModel().setPreferences(pref, true);
  },

  getBookmarksList: function() {
    var bkmkserv = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                             .getService(Components.interfaces.nsINavBookmarksService);
    var result = [];

    var traverseBookmarks = function(folderId, space) {
      var i = 0;
      var bkmkId;
      
      bkmkId = bkmkserv.getIdForItemAt(folderId, i);  
      while (bkmkId != -1) {
        if (bkmkserv.getItemType(bkmkId) == bkmkserv.TYPE_FOLDER) {
          result.push({
            id: bkmkId,
            title: space + bkmkserv.getItemTitle(bkmkId)
          });
          traverseBookmarks(bkmkId, space + '  ');
        }
        i++;
        bkmkId = bkmkserv.getIdForItemAt(folderId, i);  
      }
    } 

    traverseBookmarks(bkmkserv.bookmarksMenuFolder, '');
    return result;
  },

  addSyncRelation: function() {
    var item, el;
    var pagesListEl = document.getElementById('pagesList');
    var bookmarksListEl = document.getElementById('bookmarksList');

    item = document.createElement('listitem');
    item.value = pagesListEl.value + ',' + bookmarksListEl.value;
    el = document.createElement('listcell');
    el.setAttribute('label', pagesListEl.selectedItem.label);
    item.appendChild(el);
    el = document.createElement('listcell');
    el.setAttribute('label', bookmarksListEl.selectedItem.label.trim());
    item.appendChild(el);
    document.getElementById('syncList').appendChild(item);

    pagesListEl.removeItemAt(pagesListEl.selectedIndex);
    if (pagesListEl.itemCount > 0)
      pagesListEl.selectedIndex = 0;
    else
      pagesListEl.selectedIndex = -1;
  },

  removeSyncRelation: function() {
    var syncListEl = document.getElementById('syncList');
    var btnEl = document.getElementById('removeSyncRelationBtn');
    var itemEl = syncListEl.selectedItem;
    var pagesListEl = document.getElementById('pagesList');

    pagesListEl.appendItem(
      itemEl.querySelector('listcell').getAttribute('label'),
      itemEl.value.split(',')[0]
    );
    if (pagesListEl.selectedIndex == -1){
      pagesListEl.selectedIndex = 0;
    }

    syncListEl.removeItemAt(syncListEl.selectedIndex);

    syncListEl.clearSelection();
    btnEl.disabled = true;
    btnEl.blur();
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

  importFromOpml: function() {
    var file = mpagespace.optionsForm.pickFile('open');
    var resultEl = document.getElementById('importResult');
    if (file) { 
      mpagespace.converter.importFromOpml(file, true, function(message){
        resultEl.setAttribute('value', message);
      });
      resultEl.setAttribute('value', mpagespace.translate('options.import.processing'));
    } else {
      resultEl.setAttribute('value', mpagespace.translate('options.import.error.nofile'));
    }
    mpagespace.optionsForm.init();
  },

  exportToOpml: function() {
    var file = mpagespace.optionsForm.pickFile('save');
    var resultEl = document.getElementById('exportResult');
    if (file) { 
      mpagespace.converter.exportToOpml(file, function(message){
        resultEl.setAttribute('value', message);
      });
      resultEl.setAttribute('value', mpagespace.translate('options.export.processing'));
    } else {
      resultEl.setAttribute('value', mpagespace.translate('options.export.error.nofile'));
    }
  },

  reset: function(what) {
    var model = mpagespace.app.getModel();

    switch (what) {
      case 'complete':
        model.reset();
        break;
      case 'sync':
        model.getSync().clearSyncHistory();
        break;
      case 'schemes':
        model.getColorSchemes().removeSchemes();
        break;
      default:
       break; 
    }

    mpagespace.optionsForm.init();
  },

  acceptDialog: function() {
    var model = mpagespace.app.getModel();
    // colors
    model.acceptTempPreferences();

    // sync settings
    var syncRelations = [];
    var syncListEl = document.getElementById('syncList');
    for (var i=0; i<syncListEl.itemCount; i++) {
      var values = syncListEl.getItemAtIndex(i).value.split(',');
      syncRelations.push({
        pageId: values[0],
        bookmarkId: values[1]
      });
    }
    model.getSync().setRelations(syncRelations);

    return true;
  },

  cancelDialog: function() {
    mpagespace.app.getModel().setPreferences(null, true);
    return true;
  }
}
