let Converter = {
  importFromOpml: function(opmlText, merge) {
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
            console.log('converter.importFromOpml: Searching for widget with url ' + n.getAttribute('xmlUrl'));
            widget = widgets[n.getAttribute('xmlUrl')];
          }
          if (!merge || !widget) {
            console.log('converter.importFromOpml: Creating widget with url ' + n.getAttribute('xmlUrl'));
            widget = page.createAndAddWidget(n.getAttribute('xmlUrl'), null, null);
          }
          console.log('converter.importFromOpml: Update widget ' + widget.id);
          widget.title = n.getAttribute('title');
          if (n.hasAttribute('mpage')) {
            var options = n.getAttribute('mpage').split('|');
            page.removeFromPanel(widget);
            page.insertToPanel(widget, options[0], null);
            widget.entriesToShow = parseInt(options[1]);
            widget.hoursFilter = parseInt(options[2]);
            widget.minimized = options[3] == 'true';
            widget.visitedFilter = options[4] == 'true';
            widget.useGuid = options[5] == 'true';
            widget.groupByDate = options[6] == 'true';
          }
        } else {
          var newPage = null;
          if (merge) {
            console.log('converter.importFromOpml: Searching for page ' + n.getAttribute('title'));
            newPage = pages[n.getAttribute('title')];
          }
          if (!merge || !newPage) {
            try {
              console.log('converter.importFromOpml: Creating page ' + n.getAttribute('title'));
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

    var model = mPage.getModel();
    var page, pages, importPageId;
    if (!merge) {
      model.empty();
      page = model.getPage();
    } else {
      pages = model.getPages(model.GET_PAGES_TITLE);
      if (pages['Imported'])
        page = pages['Imported'];
      else {
        page = model.addPage('Imported');
        pages = model.getPages(model.GET_PAGES_TITLE);
      }
    }
    importPageId = page.id;

    try {
      processOutlines(body, page, merge, pages);
    } catch (e) {
      console.log('converter.import: Error in processing OPML file - ' + e.message);
      if (importPageId != null) {
        page = model.getPage(importPageId);
        if (page.getWidgets(page.GET_WIDGETS_ARRAY).length == 0) {
          model.deletePage(page.id);
        }
      }
      if (statusCallback)
        statusCallback(Utils.translate('converter.import.error'));
      return;
    }

    if (importPageId != null) {
      page = model.getPage(importPageId);
      if (page.getWidgets(page.GET_WIDGETS_ARRAY).length == 0) {
        console.log('converter.import: Deleting home page.');
        model.deletePage(page.id);
      }
    }

    var pref = model.getPreferences().deserialize(body.getAttribute('mpage'));
    model.setPreferences(pref);
    model.changeActivePage(importPageId);

    console.log('converter.importFromOpml: Done');
  },

  exportToOpml: function(model) {
    var xmlDoc = (new DOMParser()).parseFromString(
        '<opml version="1.0"><head>mPage export</head><body></body></opml>', 
        'application/xml'
      );
    var serializer = new XMLSerializer();
    var docEl = xmlDoc.documentElement;
    var body = xmlDoc.getElementsByTagName('body')[0];

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
              w.visitedFilter, w.useGuid, w.groupByDate].join('|');
          subitem.setAttribute('mpage', options);
          item.appendChild(subitem);
        }
        parentEl.appendChild(item);
      }
    };

    var outlines = createOutlineElements(model, body);
    
    return '<?xml version="1.0" encoding="UTF-8"?>' + serializer.serializeToString(docEl);
  }
}


