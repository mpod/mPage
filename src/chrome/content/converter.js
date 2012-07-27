// Author: Matija Podravec, 2012.

if (!mpagespace.converter) mpagespace.converter = {};
else if (typeof mpagespace.converter != 'object')
  throw new Error('mpagespace.converter already exists and is not an object');

mpagespace.converter = {
  mPageBookmarkUri: 'http://mpage.firefox.extension/',

  importFromOpml: function(opmlFile, merge) {
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
      var body = xmlDoc.getElementsByTagName('body')[0];

      var processOutlines = function(parentOpmlEl, page, merge, pages) {
        var widgets;
        if (merge) {
          widgets = page.getWidgets(page.GET_WIDGETS_URL);
        }
        for (var n = parentOpmlEl.firstChild, nWidgets = 0; n; n = n.nextSibling) {
          if (!n.tagName || n.tagName.toLowerCase() != 'outline') 
            continue;

          if (n.hasAttribute('xmlUrl')) {
            var widget;
            if (merge) {
              widget = widgets[n.getAttribute('xmlUrl')];
            }
            if (!merge || !widget) {
              widget = page.createAndAddWidget(n.getAttribute('xmlUrl'), false, true);
            }
            widget.title = n.getAttribute('title');
          } else {
            var newPage;
            if (merge) {
              newPage = pages[n.getAttribute('title')];
            }
            if (!merge || !newPage) {
              newPage = page.model.addPage(n.getAttribute('title'));
            }
            processOutlines(n, newPage, merge, pages);
          }
        }
      } 

      var model = mpagespace.app.getModel();
      var page, pages, homePage;
      if (!merge) {
        model.empty();
        page = model.getPage(1);
      } else {
        pages = model.getPages(model.GET_PAGES_TITLE);
        if (pages['Home'])
          page = pages['Home'];
        else
          page = model.addPage('Home');
      }
      homePageId = page.id;

      processOutlines(body, page, merge, pages);

      if (homePageId != null) {
        page = model.getPage(homePageId);
        if (page.getWidgets(page.GET_WIDGETS_ARRAY).length == 0) {
          model.deletePage(page.id);
        }
      }

      model.changeActivePage();

      mpagespace.observerService.notifyObservers(null, 'mpage-model', 'model-loaded');  
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
    var model = mpagespace.app.getModel();

    var createOutlineElements = function(model, parentEl) {
      var pageOrder = model.getPageOrder();
      for (let i=0; i<pageOrder.length; i++) {
        let p = model.getPage(pageOrder[i]);
        let item = xmlDoc.createElement('outline');
        item.setAttribute('title', p.title);
        item.setAttribute('text', p.title);
        for (var widgetId in p.getWidgets()) {
          var w = p.getWidget(widgetId);
          let subitem = xmlDoc.createElement('outline');
          subitem.setAttribute('title', w.title);
          subitem.setAttribute('text', w.title);
          subitem.setAttribute('type', 'rss');
          subitem.setAttribute('xmlUrl', w.url);
          item.appendChild(subitem);
        }
        parentEl.appendChild(item);
      }
    };

    var outlines = createOutlineElements(model, body);

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

  exportToBookmarks: function() {
    var bkmkserv = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                             .getService(Components.interfaces.nsINavBookmarksService);
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);

    var model = mpagespace.app.getModel();
    if (!model.loaded) {
      mpagespace.dump('converter.exportToBookmarks: Model not loaded');
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
    folderId = bkmkserv.createFolder(bkmkserv.bookmarksMenuFolder, 'mPage sync folder', bkmkserv.DEFAULT_INDEX);
    uri = ios.newURI(this.mPageBookmarkUri, null, null);
    bkmkId = bkmkserv.insertBookmark(folderId, uri, bookmarks.DEFAULT_INDEX, 'Do not delete this bookmark!');

    var batchCallback = {
      runBatched: function(params) {
        var createBookmarks = function(model, parentFolderId) {
          var pageOrder = model.getPageOrder();
          for (let i=0; i<pageOrder.length; i++) {
            let p = model.getPage(pageOrder[i]);
            folderId = bkmkserv.createFolder(parentFolderId, p.title, bkmkserv.DEFAULT_INDEX);
            for (var widgetId in p.getWidgets()) {
              var w = p.getWidget(widgetId);
              uri = ios.newURI(w.url, null, null);
              bkmkId = bkmkserv.insertBookmark(folderId, uri, bookmarks.DEFAULT_INDEX, w.title);
              var options = [w.panelId, w.entriesToShow, w.hoursFilter, w.minimized].join('|');
              bkmkserv.setKeywordForBookmark(bkmkId, options);
            }
          }
        }

        createBookmarks(model, folderId);
        mpagespace.dump('converter.exportToBookmarks: Done');
      }
    }

    bkmkserv.runInBatchMode(batchCallback, null);
  },

  importFromBookmarks: function(merge) {
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

    var processBookmarks = function(folderId, page, merge, pages) {
      var i = 0;
      var widgets;
      if (merge) {
        widgets = page.getWidgets(page.GET_WIDGETS_URL);
      }
      
      bkmkId = bkmkserv.getIdForItemAt(folderId, i);  
      while (bkmkId != -1) {
        if (bkmkId != mPageBkmks[0]) {
          if (bkmkserv.getItemType(bkmkId) == bkmkserv.TYPE_BOOKMARK) {
            var widget;
            if (merge) {
              widget = widgets[bkmkserv.getBookmarkURI(bkmkId).spec];
            }
            if (!merge || !widget) {
              widget = page.createAndAddWidget(bkmkserv.getBookmarkURI(bkmkId).spec, false, true);
            }
            widget.title = bkmkserv.getItemTitle(bkmkId);
            var options = bkmkserv.getKeywordForBookmark(bkmkId).split('|');
            if (options.length == 4) {
              page.removeFromPanel(widget);
              page.insertToPanel(widget, options[0], null);
              widget.entriesToShow = options[1];
              widget.hoursFilter = options[2];
              widget.minimized = options[3] == 'true';
            }
          } else if (bkmkserv.getItemType(bkmkId) == bkmkserv.TYPE_FOLDER) {
            var newPage;
            if (merge) {
              newPage = pages[bkmkserv.getItemTitle(bkmkId)];
            }
            if (!merge || !newPage) {
              newPage = page.model.addPage(bkmkserv.getItemTitle(bkmkId));
            }
            processBookmarks(bkmkId, newPage, merge, pages);
          }
        }
        i++;
        bkmkId = bkmkserv.getIdForItemAt(folderId, i);  
      }
    }

    var model = mpagespace.app.getModel();
    var page, pages, homePageId = null;
    if (!merge) {
      model.empty();
      page = model.getPage(1);
    } else {
      pages = model.getPages(model.GET_PAGES_TITLE);
      if (pages['Home'])
        page = pages['Home'];
      else
        page = model.addPage('Home');
    }
    homePageId = page.id;

    processBookmarks(folderId, page, merge, pages);

    if (homePageId != null) {
      page = model.getPage(homePageId);
      if (page.getWidgets(page.GET_WIDGETS_ARRAY).length == 0) {
        model.deletePage(page.id);
      }
    }
    
    model.changeActivePage();

    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'model-loaded');  
    mpagespace.dump('converter.importFromBookmarks: Done');
  }
}


