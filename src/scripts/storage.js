'use strict';

let Storage = {
  model: null,

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

  save: function(data) {
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


