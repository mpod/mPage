// Author: Matija Podravec, 2012-2013

if (!mpagespace.model.sync) mpagespace.model.sync = {};
else if (typeof mpagespace.model.sync != 'object')
  throw new Error('mpagespace.model.sync already exists and is not an object');

mpagespace.model.sync = function(config, model) {
  config = config || {};
  this.model = model;
  this.relationsArray = config.relations || [];
  this.relationsMap = {};
  this.inSync = config.inSync || [];
  this.timer = null;
  this.dirty = false;

  for (var i=0; i<this.relationsArray.length; i++) {
    this.relationsMap[this.relationsArray[i].pageId] = this.relationsArray[i].bookmarkId;
  }
}

mpagespace.model.sync.prototype = {
  getConfig: function() {
    return {
      relations: this.relationsArray,
      inSync: this.inSync
    }
  },

  isDirty: function() {
    return this.dirty == true;
  },

  setDirty: function() {
    this.dirty = true;
    this.model.setDirty();
  },

  getSyncBookmarkFolderForPage: function(pageId) {
    if (pageId in this.relationsMap)
      return this.relationsMap[pageId];
    else
      return null;
  },

  setRelations: function(relations) {
    this.relationsArray = relations;
    this.relationsMap = {};
    for (var i=0; i<this.relationsArray.length; i++) {
      this.relationsMap[this.relationsArray[i].pageId] = this.relationsArray[i].bookmarkId;
    }
    this.setDirty();
  },

  areInSync: function(pageId, bookmarkId) {
    return this.inSync.indexOf(bookmarkId + ':' + pageId) != -1;
  },

  clearSyncHistory: function() {
    this.inSync = [];
  },

  synchronize: function(pageId) {
    var bkmkserv = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                             .getService(Components.interfaces.nsINavBookmarksService);
    var bkmkFolderId = this.getSyncBookmarkFolderForPage(pageId);
    var self = this;

    mpagespace.dump('sync.synchronize: Started');

    if (bkmkFolderId == null) return;

    var timerCallback = {
      notify: function() {
        var page = self.model.getPage();
        var bkmkId = bkmkserv.getIdForItemAt(bkmkFolderId, i);  
        var refWidget;
        var i = 0;
        var widget;

        if (page.id != pageId) return;

        while (bkmkId != -1) {
          if (bkmkserv.getItemType(bkmkId) == bkmkserv.TYPE_BOOKMARK &&
              !self.areInSync(pageId, bkmkId)) {
            widget = page.createAndAddWidget(bkmkserv.getBookmarkURI(bkmkId).spec, null, null);
            widget.load(true);
            self.inSync.push(bkmkId + ':' + pageId);
          }
          i++;
          bkmkId = bkmkserv.getIdForItemAt(bkmkFolderId, i);  
        }
      }
    };

    if (this.timer)
      this.timer.cancel();

    this.timer = Components.classes["@mozilla.org/timer;1"]
                          .createInstance(Components.interfaces.nsITimer);
    this.timer.initWithCallback(timerCallback, 500, this.timer.TYPE_ONE_SHOT);
  }
}
