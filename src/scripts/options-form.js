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
    document.getElementById('favicon').checked = pref.getConfig().favicon;
    document.getElementById('reader').checked = pref.getConfig().reader;
    document.getElementById('comments').checked = pref.getConfig().comments;
    document.getElementById('notifications').checked = pref.getConfig().notifications;
  },

  addListeners: function() {
    document.getElementById("shuffleColors").addEventListener('click', OptionsForm.shuffleColors);
    document.getElementById("schemeType").addEventListener('change', OptionsForm.changeSchemeType);
    document.getElementById("fontSize").addEventListener('change',  OptionsForm.apply);
    document.getElementById("entrySpacing").addEventListener('change', OptionsForm.apply);
    document.getElementById("lock").addEventListener('change', OptionsForm.apply);
    document.getElementById("favicon").addEventListener('change', OptionsForm.apply);
    document.getElementById("reader").addEventListener('change', OptionsForm.apply);
    document.getElementById("notifications").addEventListener('change', OptionsForm.apply);
    document.getElementById('numberOfPanels').addEventListener('change', OptionsForm.apply);
    document.getElementById('comments').addEventListener('change', OptionsForm.apply);
    document.getElementById('reset-button').addEventListener('click', OptionsForm.reset);
    document.querySelector('#options-container div.last a.button').addEventListener('click', OptionsForm.hide);
    document.getElementById('export-button').addEventListener('click', OptionsForm.exportToOpml);
    document.getElementById('import-button').addEventListener('click', function() { document.getElementById("import-file").click(); });
    document.getElementById('import-file').addEventListener('change', OptionsForm.importFromOpml);
    document.getElementById('export-json-button').addEventListener('click', OptionsForm.exportToJson);
    document.getElementById('import-json-button').addEventListener('click', function() { document.getElementById("import-json-file").click(); });
    document.getElementById('import-json-file').addEventListener('change', OptionsForm.importFromJson);
  },

  isOpen: function() {
    var containerEl = document.getElementById('options-container');
    return containerEl.style.display != 'none';
  },

  show: function() {
    var panelEl = document.getElementById('options-container');
    panelEl.style.display = 'table-cell';
    View.toggleLastPanelBorder();
  },

  hide: function(e) {
    var panelEl = document.getElementById('options-container');
    panelEl.style.display = 'none';
    View.toggleLastPanelBorder();
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
    config.favicon = document.getElementById('favicon').checked;
    config.reader = document.getElementById('reader').checked;
    config.notifications = document.getElementById('notifications').checked;
    config.comments = document.getElementById('comments').checked;
    config.layout.numberOfPanels = OptionsForm.getSelectElValue('numberOfPanels');

    var pref = new Preferences(config);
    mPage.getModel().setPreferences(pref, false);
  },

  importFromOpml: function(evt) {
    var reader = new FileReader();
    reader.onloadend = function(e) {
      Converter.importFromOpml(reader.result, true);
    };
    reader.readAsText(evt.target.files[0]);
  },

  importFromJson: function(evt) {
    if (!evt.target.files[0].name.endsWith('.json')) {
      alert(Utils.translate('Only file with extension .json file can be imported here!'));
      return;
    }
    var reader = new FileReader();
    reader.onloadend = function(e) {
      Storage.save(JSON.parse(reader.result)).then(function() { Storage.load(); }, null);  
    };
    reader.readAsText(evt.target.files[0]);
  },

  now: function() {
    var padStr = function(i) {
      return (i < 10) ? "0" + i : "" + i;
    }
    var d = new Date();
    return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()].map(padStr).join('');
  },

  exportToJson: function() {
    browser.downloads.download({
      url: window.URL.createObjectURL(new Blob([JSON.stringify(Storage.getData())], {type: 'application/json'})),
      filename: 'mpage-extension-' + OptionsForm.now() + '.json',
      saveAs: true
    });
  },

  exportToOpml: function() {
    browser.downloads.download({
      url: window.URL.createObjectURL(new Blob([Converter.exportToOpml(mPage.getModel())], {type: 'application/xml'})),
      filename: 'mpage-export-' + OptionsForm.now() + '.opml',
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
