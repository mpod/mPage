// Author: Matija Podravec, 2012.

if (!mpagespace.converter) mpagespace.converter = {};
else if (typeof mpagespace.converter != 'object')
  throw new Error('mpagespace.converter already exists and is not an object');

mpagespace.converter = {
  instance: null,

  getConverter: function() {
    if (!mpagespace.converter.instance) {
      let storage = mpagespace.storage.getStorage();
      if (mpagespace.storage.json.prototype.isPrototypeOf(storage)) {
        mpagespace.converter.instance = new mpagespace.converter.json();
      } else 
        throw new Error('Storage object instance is not of a valid type.');
    }
    return mpagespace.converter.instance;
  } 
}

mpagespace.converter.json = function() {
  this.storage = mpagespace.storage.getStorage();
  this.configFile = this.storage.file;
}

mpagespace.converter.json.prototype = {

  mPageBookmarkUri: 'http://mpage.firefox.extension/',

  importFromOpml: function(opmlFile) {
    var self = this;
    var channel = NetUtil.newChannel(opmlFile);  
    channel.contentType = "text/xml";  
    NetUtil.asyncFetch(opmlFile, function(inputStream, status) {  
      if (!Components.isSuccessCode(status)) {  
        mpagespace.dump('Error in model loading.');
        return;  
      }  
      var opmlText = NetUtil.readInputStreamToString(inputStream, inputStream.available());  
      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(opmlText, 'text/xml');
      var docEl = xmlDoc.documentElement;
      var data = {
        pages: {
          'page-1': {
            pageId: 1,
            title: 'Home',
            parentPageId: null,
            widgets: []
          }
        }
      };
      var body = xmlDoc.getElementsByTagName('body')[0];
      var widgetId=0, pageId=1;

      var processOutlines = function(parentOpmlEl, parentPageId, data) {
        for (var n = parentOpmlEl.firstChild, nWidgets = 0; n; n = n.nextSibling) {
          if (!n.tagName || n.tagName.toLowerCase() != 'outline') 
            continue;

          if (n.hasAttribute('xmlUrl')) {
            widgetId++;
            var widget = {
              widgetId: widgetId,
              panelId: (widgetId % 3) + 1,
              url: n.getAttribute('xmlUrl'),
              title: n.getAttribute('title'),
              entriesToShow: 5
            };
            if (data.pages['page-' + parentPageId] === undefined) 
              data.pages['page-1'].widgets.push(widget);
            else
              data.pages['page-' + parentPageId].widgets.push(widget);  
          } else {
            pageId++;
            data.pages['page-' + pageId] = {
              pageId: pageId,
              title: n.getAttribute('title'),
              parentPageId: parentPageId,
              widgets: []
            };
            processOutlines(n, pageId, data);
          }
        }
      } 

      processOutlines(body, null, data);

      if (data.pages['page-1'].widgets.length == 0) 
        delete data.pages['page-1'];

      self.storage.save(data, true);
      mpagespace.dump('converter.importFromOpml: Done');
    });  
  },

  exportToOpml: function(opmlFile) {
    var xmlDoc = (new DOMParser()).parseFromString(
        '<opml version="1.0"><head>mPage export</head><body></body></opml>', 
        'application/xml'
      );
    var serializer = new XMLSerializer();
    var docEl = xmlDoc.documentElement;
    var body = xmlDoc.getElementsByTagName('body')[0];

    var data = this.storage.getData().tree;

    var createOutlineElements = function(pages, parentEl) {
      var items = [];

      for (let i=0; i<pages.length; i++) {
        let p = pages[i];
        let item = xmlDoc.createElement('outline');
        item.setAttribute('title', p.title);
        item.setAttribute('text', p.title);
        if (p.childrenPages && p.childrenPages.length > 0) {
          createOutlineElements(p.childrenPages, item);
        } 
        for (let j=0; j<p.widgets.length; j++) {
          let subitem = xmlDoc.createElement('outline');
          subitem.setAttribute('title', p.widgets[j].title);
          subitem.setAttribute('text', p.widgets[j].title);
          subitem.setAttribute('type', 'rss');
          subitem.setAttribute('xmlUrl', p.widgets[j].url);
          item.appendChild(subitem);
        }
        parentEl.appendChild(item);
      }
    };

    var outlines = createOutlineElements(data, body);

    var ostream = FileUtils.openSafeFileOutputStream(opmlFile)  
    mpagespace.unicodeConverter.charset = "UTF-8";  
    var istream = mpagespace.unicodeConverter.convertToInputStream(
      '<?xml version="1.0" encoding="UTF-8"?>' + 
      serializer.serializeToString(docEl)
    );  
    NetUtil.asyncCopy(istream, ostream, function(status) {  
      if (!Components.isSuccessCode(status)) {  
        mpagespace.dump('converter.exportToOpml: Error while saving opml file.');
        return;  
      }  
      FileUtils.closeSafeFileOutputStream(ostream); 
      mpagespace.dump('converter.exportToOpml: Done');
    });    
  },

  exportToBookmars: function() {
    var bkmkserv = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                             .getService(Components.interfaces.nsINavBookmarksService);
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);

    var data = this.storage.getData().tree;

    if (data == null) {
      mpagespace.dump('converter.exportToBookmarks: storage is not loaded.');
      return;
    }

    var uri, bookmarks, folderId, bkmkId;

    // Search for mPage sync folder
    uri = ios.newURI(this.mPageBookmarkUri, null, null);
    bookmarks = bkmkserv.getBookmarkIdsForURI(uri, {});
    for (let i=0; i < bookmarks.length; i++) {
      folderId = bkmkserv.getFolderIdForItem(bookmarks[i]);
      bkmkserv.removeItem(folderId);
    }

    // Create new sync folder
    folderId = bkmkserv.createFolder(bkmkserv.bookmarksMenuFolder, 'mPage sync', bkmkserv.DEFAULT_INDEX);
    uri = ios.newURI(this.mPageBookmarkUri, null, null);
    bkmkId = bkmkserv.insertBookmark(folderId, uri, bookmarks.DEFAULT_INDEX, 'Do not delete this bookmark!');

    var batchCallback = {
      runBatched: function(params) {
        var createBookmarks = function(pages, parentFolderId) {
          for (let i=0; i<pages.length; i++) {
            let p = pages[i];
            folderId = bkmkserv.createFolder(parentFolderId, p.title, bkmkserv.DEFAULT_INDEX);
            if (p.childrenPages && p.childrenPages.length > 0) {
              createBookmarks(p.childrenPages, folderId);
            } 
            for (let j=0; j<p.widgets.length; j++) {
              uri = ios.newURI(p.widgets[j].url, null, null);
              bkmkId = bkmkserv.insertBookmark(folderId, uri, bookmarks.DEFAULT_INDEX, p.widgets[j].title);
              let options = p.widgets[j].panelId + '|' + p.widgets[j].entriesToShow;
              bkmkserv.setKeywordForBookmark(bkmkId, options);
            }
          }
        }

        createBookmarks(data, folderId);
        mpagespace.dump('converter.exportToBookmarks: Done');
      }
    }

    bkmkserv.runInBatchMode(batchCallback, null);
  },

  importFromBookmarks: function() {
    var bkmkserv = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                             .getService(Components.interfaces.nsINavBookmarksService);
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    
    var uri, mPageBkmks, folderId, bkmkId;
    uri = ios.newURI(this.mPageBookmarkUri, null, null);
    mPageBkmks = bkmkserv.getBookmarkIdsForURI(uri, {});
    if (mPageBkmks.length == 0) {
        mpagespace.dump('converter.importFromBookmarks: Bookmarks are not set.');
        mpagespace.observerService.notifyObservers(null, 'mpage-error', 'import-bookmarks-not-set'); 
        return;
    }
    folderId = bkmkserv.getFolderIdForItem(mPageBkmks[0]);

    var widgetId=0, pageId=0;

    var processBookmarks = function(folderId, parentPageId, data) {
      var i = 0;
      
      bkmkId = bkmkserv.getIdForItemAt(folderId, i);  
      while (bkmkId != -1) {
        if (bkmkId != mPageBkmks[0]) {
          if (bkmkserv.getItemType(bkmkId) == bkmkserv.TYPE_BOOKMARK) {
            widgetId++;
            var options = bkmkserv.getKeywordForBookmark(bkmkId).split('|');
            var widget = {
              widgetId: widgetId,
              panelId: isNaN(parseInt(options[0])) ? 1 : parseInt(options[0]),
              url: bkmkserv.getBookmarkURI(bkmkId).spec,
              title: bkmkserv.getItemTitle(bkmkId),
              entriesToShow: isNaN(parseInt(options[1])) ? 5 : parseInt(options[1])
            };
            data.pages['page-' + parentPageId].widgets.push(widget);  
          } else if (bkmkserv.getItemType(bkmkId) == bkmkserv.TYPE_FOLDER) {
            pageId++;
            var page = {
              pageId: pageId,
              title: bkmkserv.getItemTitle(bkmkId),
              parentPageId: parentPageId,
              widgets: []
            };
            data.pages['page-' + page.pageId] = page;
            processBookmarks(bkmkId, page.pageId, data);
          }
        }
        i++;
        bkmkId = bkmkserv.getIdForItemAt(folderId, i);  
      }
    }

    var data = {pages: {}};
    processBookmarks(folderId, null, data, null);

    this.storage.save(data, true);
    mpagespace.dump('converter.importFromBookmarks: Done');
  }
}


