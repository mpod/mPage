// Author: Matija Podravec, 2012-2013

if (!mpagespace.converter) mpagespace.converter = {};
else if (typeof mpagespace.converter != 'object')
  throw new Error('mpagespace.converter already exists and is not an object');

mpagespace.converter = {
  importFromOpml: function(opmlFile, merge, statusCallback) {
    var channel = NetUtil.newChannel(opmlFile);  
    channel.contentType = "text/xml";  
    NetUtil.asyncFetch(opmlFile, function(inputStream, status) {  
      if (!Components.isSuccessCode(status)) {  
        mpagespace.dump('converter.importFromOpml: Error in model loading.');
        if (statusCallback)
          statusCallback(mpagespace.translate('converter.import.error'));
        return;  
      }  
      var opmlText = NetUtil.readInputStreamToString(inputStream, inputStream.available(), {charset: 'UTF-8'});  
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
            var widget = null;
            if (merge) {
              mpagespace.dump('converter.importFromOpml: Searching for widget with url ' + n.getAttribute('xmlUrl'));
              widget = widgets[n.getAttribute('xmlUrl')];
            }
            if (!merge || !widget) {
              mpagespace.dump('converter.importFromOpml: Creating widget with url ' + n.getAttribute('xmlUrl'));
              widget = page.createAndAddWidget(n.getAttribute('xmlUrl'), null, null);
            }
            mpagespace.dump('converter.importFromOpml: Update widget ' + widget.id);
            widget.title = n.getAttribute('title');
            if (n.hasAttribute('mpage')) {
              var options = n.getAttribute('mpage').split('|');
              if (options.length == 4) {
                page.removeFromPanel(widget);
                page.insertToPanel(widget, options[0], null);
                widget.entriesToShow = options[1];
                widget.hoursFilter = options[2];
                widget.minimized = options[3] == 'true';
                widget.visitedFilter = options[4] == 'true';
                widget.useGuid = options[5] == 'true';
              }
            }
          } else {
            var newPage = null;
            if (merge) {
              mpagespace.dump('converter.importFromOpml: Searching for page ' + n.getAttribute('title'));
              newPage = pages[n.getAttribute('title')];
            }
            if (!merge || !newPage) {
              try {
                mpagespace.dump('converter.importFromOpml: Creating page ' + n.getAttribute('title'));
                newPage = page.model.addPage(n.getAttribute('title'));
              } catch (e) {
                // Page with the same name already exists.
                var model = page.model;
                newPage = model.getPages(model.GET_PAGES_TITLE)[n.getAttribute('title')];
              }
            }
            processOutlines(n, newPage, merge, pages);
          }
        }
      } 

      var model = mpagespace.app.getModel();
      var page, pages, homePage;
      if (!merge) {
        model.empty();
        page = model.getPage();
      } else {
        pages = model.getPages(model.GET_PAGES_TITLE);
        if (pages['Home'])
          page = pages['Home'];
        else
          page = model.addPage('Home');
      }
      homePageId = page.id;

      try {
        processOutlines(body, page, merge, pages);
      } catch (e) {
        mpagespace.dump('converter.import: Error in processing OPML file - ' + e.message);
        if (homePageId != null) {
          page = model.getPage(homePageId);
          if (page.getWidgets(page.GET_WIDGETS_ARRAY).length == 0) {
            model.deletePage(page.id);
          }
        }
        if (statusCallback)
          statusCallback(mpagespace.translate('converter.import.error'));
        return;
      }

      if (homePageId != null) {
        page = model.getPage(homePageId);
        if (page.getWidgets(page.GET_WIDGETS_ARRAY).length == 0) {
          mpagespace.dump('converter.import: Deleting home page.');
          model.deletePage(page.id);
        }
      }

      var pref = model.getPreferences().deserialize(body.getAttribute('mpage'));
      model.setPreferences(pref);
      model.changeActivePage();

      if (statusCallback)
        statusCallback(mpagespace.translate('converter.import.success'));
      mpagespace.observerService.notifyObservers(null, 'mpage-model', 'model-loaded');  
      mpagespace.dump('converter.importFromOpml: Done');
    });  
  },

  exportToOpml: function(opmlFile, statusCallback) {
    var xmlDoc = (new DOMParser()).parseFromString(
        '<opml version="1.0"><head>mPage export</head><body></body></opml>', 
        'application/xml'
      );
    var serializer = new XMLSerializer();
    var docEl = xmlDoc.documentElement;
    var body = xmlDoc.getElementsByTagName('body')[0];
    var model = mpagespace.app.getModel();

    body.setAttribute('mpage', model.getPreferences().serialize());

    var createOutlineElements = function(model, parentEl) {
      var pageOrder = model.getPageOrder();
      for (let i=0; i<pageOrder.length; i++) {
        let p = model.getPage(pageOrder[i]);
        let item = xmlDoc.createElement('outline');
        item.setAttribute('title', p.title);
        item.setAttribute('text', p.title);
        var widgets = p.getWidgets(p.GET_WIDGETS_ARRAY);
        for (var j=0; j<widgets.length; j++) {
          var w = widgets[j];
          let subitem = xmlDoc.createElement('outline');
          subitem.setAttribute('title', w.title);
          subitem.setAttribute('text', w.title);
          subitem.setAttribute('type', 'rss');
          subitem.setAttribute('xmlUrl', w.url);
          var options = [w.panelId, w.entriesToShow, w.hoursFilter, w.minimized,
              w.visitedFilter, w.useGuid].join('|');
          subitem.setAttribute('mpage', options);
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
        if (statusCallback) 
          statusCallback(mpagespace.translate('converter.export.error'));
        mpagespace.dump('converter.exportToOpml: Error while saving opml file.');
        return;  
      }  
      FileUtils.closeSafeFileOutputStream(ostream); 
      if (statusCallback)
        statusCallback(mpagespace.translate('converter.import.success'));
      mpagespace.dump('converter.exportToOpml: Done');
    });    
  }
}


