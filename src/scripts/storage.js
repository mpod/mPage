'use strict';

let Storage = {
  model: null,

  processEvent: function(e) {  
    var self = View;
    let topic = e.type;
    let data = e.detail;

    if (topic == 'mpage-model') {  
      var widget;
      console.log('storage.observe: ' + topic + '/' + data);
      data = data.split(':');
      var page = mPage.getModel().getPage();
      if (data[0].indexOf("loaded") == -1 && data[0].indexOf("error") == -1 && data[0].indexOf("alert") == -1) {
        Storage.save(mPage.getModel().getConfig());
      }
    }
  },

  load: function() {
    var self = this;

    function onLoad(item) {
      Storage.model = item.configuration;
      console.log('storage.load: Done');
      var evt = new CustomEvent('mpage-storage', {detail: 'data-loaded'});
      window.document.documentElement.dispatchEvent(evt);
    }

    browser.storage.local.get('configuration').then(
      onLoad,
      (error) => { console.log(error); }
    );
  },

  registerObserver: function() {
    window.document.documentElement.addEventListener('mpage-model', Storage.processEvent, false);
  },

  save: function(data) {
    console.log('storage.save: In progress...');
    return browser.storage.local.set({configuration: data});
  },

  close: function() {
    // nop
  },

  getData: function() {
    return Storage.model;
  },

  backup: function() {
  },

  restore: function() {
  }

}


