let OptionsForm = {
  init: function() {
    OptionsForm.mapValues();
    OptionsForm.addListeners();
    console.log('optionsForm.init: Done');
  },

  mapValues: function() {
    var model = mPage.getModel();
    var pref = model.getPreferences();
    OptionsForm.setColors(pref);
    OptionsForm.setSelectElValue('schemeType', pref.getConfig().schemeType);
    OptionsForm.setSelectElValue('fontSize', pref.getConfig().font.size);
    OptionsForm.setSelectElValue('entrySpacing', pref.getConfig().spacing);
    OptionsForm.setSelectElValue('numberOfPanels', pref.getConfig().layout.numberOfPanels);
    document.getElementById('lock').checked = pref.getConfig().lock;
  },

  addListeners: function() {
    document.getElementById("shuffleColors").addEventListener('click', OptionsForm.shuffleColors);
    document.getElementById("schemeType").addEventListener('change', OptionsForm.changeSchemeType);
    document.getElementById("fontSize").addEventListener('change',  OptionsForm.apply);
    document.getElementById("entrySpacing").addEventListener('change', OptionsForm.apply);
    document.getElementById("lock").addEventListener('change', OptionsForm.apply);
    document.getElementById('numberOfPanels').addEventListener('change', OptionsForm.apply);
    document.getElementById('reset-button').addEventListener('click', OptionsForm.reset);
    document.querySelector('#options-container div.close-button a').addEventListener('click', OptionsForm.hide);
    document.getElementById('export-button').addEventListener('click', OptionsForm.exportToOpml);
    document.getElementById('import-button').addEventListener('click', function() { document.getElementById("import-file").click(); });
    document.getElementById('import-file').addEventListener('change', OptionsForm.importFromOpml);
    document.getElementById('import-old-button').addEventListener('click', function() { document.getElementById("import-old-file").click(); });
    document.getElementById('import-old-file').addEventListener('change', OptionsForm.importOld);

  },

  show: function() {
    var panelEl = document.getElementById('options-container');
    panelEl.style.display = 'table-cell';
  },

  hide: function(e) {
    var panelEl = document.getElementById('options-container');
    panelEl.style.display = 'none';
    e.preventDefault();
  },

  changeSchemeType: function() {
    var type = OptionsForm.getSelectElValue('schemeType');
    var pref = new Preferences({schemeType: type});
    OptionsForm.setColors(pref);
    OptionsForm.apply();
  },

  setColors: function(pref) {
    var el;

    el = document.getElementById('colorBackground');
    el.style.backgroundColor = pref.colors.background;
    el = document.getElementById('colorBorder');
    el.style.backgroundColor = pref.colors.border;
    el = document.getElementById('colorLink');
    el.style.backgroundColor = pref.colors.link;
    el = document.getElementById('colorVisited');
    el.style.backgroundColor = pref.colors.visited;
    el = document.getElementById('colorTitle');
    el.style.backgroundColor = pref.colors.title;
    el = document.getElementById('colorMenu');
    el.style.backgroundColor = pref.colors.menu;
    el = document.getElementById('colorMenuText');
    el.style.backgroundColor = pref.colors.menuText;
    el = document.getElementById('colorMenuSel');
    el.style.backgroundColor = pref.colors.menuSel;
    el = document.getElementById('colorError');
    el.style.backgroundColor = pref.colors.misc;
  },

  shuffleColors: function() {
    var type = OptionsForm.getSelectElValue('schemeType');
    var schemes = mPage.getModel().getColorSchemes();

    var pref = new Preferences({colors: schemes.getShuffledScheme(type)});
    OptionsForm.setColors(pref);
    OptionsForm.apply();
  },

  getSelectElValue: function(id) {
    var el = document.getElementById(id);
    return el[el.selectedIndex].value;
  },

  setSelectElValue: function(id, v) {
    var el = document.getElementById(id);
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].value == v) {
        el.selectedIndex = i;
      }
    }
  },

  apply: function() {
    var config = mPage.getModel().getPreferences().getConfig();
    config.schemeType = OptionsForm.getSelectElValue('schemeType');
    config.colors = {
      background: document.getElementById('colorBackground').style.backgroundColor,
      border: document.getElementById('colorBorder').style.backgroundColor,
      link: document.getElementById('colorLink').style.backgroundColor,
      visited: document.getElementById('colorVisited').style.backgroundColor,
      title: document.getElementById('colorTitle').style.backgroundColor,
      menu: document.getElementById('colorMenu').style.backgroundColor,
      menuText: document.getElementById('colorMenuText').style.backgroundColor,
      menuSel: document.getElementById('colorMenuSel').style.backgroundColor,  
      misc: document.getElementById('colorError').style.backgroundColor
    };
    config.font.size = OptionsForm.getSelectElValue('fontSize');
    config.spacing = OptionsForm.getSelectElValue('entrySpacing');
    config.lock = document.getElementById('lock').checked;

    var pref = new Preferences(config);
    mPage.getModel().setPreferences(pref, false);
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

  importFromOpml: function(evt) {
    var reader = new FileReader();
    reader.onloadend = function(e) {
      Converter.importFromOpml(reader.result, true);
    };
    reader.readAsText(evt.target.files[0]);
  },

  importOld: function(evt) {
    console.log(evt.target.files[0].name);
    if (evt.target.files[0].name != 'mpage.extension.json') {
      alert(Utils.translate('Only mpage.extension.json file can be imported here!'));
      return;
    }
    var reader = new FileReader();
    reader.onloadend = function(e) {
      Storage.save(JSON.parse(reader.result)).then(function() { Storage.load(); }, null);  
      //Storage.load();
    };
    reader.readAsText(evt.target.files[0]);
  },

  exportToOpml: function() {
    browser.downloads.download({
      url: window.URL.createObjectURL(new Blob([Converter.exportToOpml(mPage.getModel())], {type: 'application/xml'})),
      filename: 'mpage-export.xml',
      saveAs: true
    })
  },

  reset: function(what) {
    var model = mPage.getModel();

    if (confirm('Are you sure you want to completely reset configuration?')) {
      model.reset();
      OptionsForm.mapValues();
    }
  }

}
