// Author: Matija Podravec, 2012.

if (!mpagespace.storage) mpagespace.storage = {};
else if (typeof mpagespace.storage != 'object')
  throw new Error('mpagespace.storage already exists and is not an object');

Components.utils.import("resource://gre/modules/FileUtils.jsm");  
Components.utils.import("resource://gre/modules/NetUtil.jsm");

mpagespace.storage = {
  instance: null,

  getStorage: function(flag) {
    if (!mpagespace.storage.instance) {
      mpagespace.storage.instance = new mpagespace.storage.json();
    }
    return mpagespace.storage.instance;
  } 
}

mpagespace.storage.json = function() {
  this.file = FileUtils.getFile('ProfD', ['mpage.extension.json']);  
  if (!this.file.exists()) {
    this.reset();
  }
}

mpagespace.storage.json.prototype = {
  load: function() {
    var self = this;
    var channel = NetUtil.newChannel(this.file);  
    channel.contentType = "application/json";  
    NetUtil.asyncFetch(this.file, function(inputStream, status) {  
      if (!Components.isSuccessCode(status)) {  
        mpagespace.dump('Error in storage loading.');
        return;  
      }  
  
      var text = NetUtil.readInputStreamToString(inputStream, inputStream.available());  
      var data = JSON.parse(text);
      
      self.initAppData(data);

      mpagespace.observerService.notifyObservers(null, 'mpage-storage-changed', 'data-loaded');  
    });  
  },

  initAppData: function(data) {
    var tree = [];
    var maxPageId = 0;
    var maxWidgetId = 0;
    for (var pKey in data.pages) {
      var page = data.pages[pKey];
      
      if (page.pageId > maxPageId) 
        var maxPageId = page.pageId;
      for (var i=0; i<page.widgets.length; i++)
        if (page.widgets[i].widgetId > maxWidgetId)
          var maxWidgetId = page.widgets[i].widgetId;

      if (page.parentPageId) {
        var parentPage = data.pages['page-' + page.parentPageId];
        if (parentPage.childrenPages === undefined) {
          parentPage.childrenPages = [];
        }
        parentPage.childrenPages.push(page);
      } else {
        tree.push(page);
      }
    }
    
    mpagespace.fuelApplication.storage.set('mpage-storage-data', {
      pages: data.pages, 
      tree: tree,
      maxPageId: maxPageId,
      maxWidgetId: maxWidgetId
    });
  },

  save: function(data, refresh) {
    var self = this;
    var sanitizedData = {pages: {}};

    for (pKey in data.pages) {
      var page = data.pages[pKey];
      var p = {
        pageId: page.pageId,
        title: page.title,
        parentPageId: page.parentPageId,
        widgets: []
      };

      for (var i=0; i<page.widgets.length; i++) {
        var w = page.widgets[i];
        p.widgets.push({
          widgetId: w.widgetId,
          panelId: w.panelId,
          url: w.url,
          title: w.title,
          entriesToShow: w.entriesToShow 
        });          
      }

      sanitizedData.pages['page-' + p.pageId] = p;
    }

    if (refresh) {
      this.initAppData(sanitizedData);
    }
    this.writeToFile(sanitizedData);
  },

  getData: function() {
    return mpagespace.fuelApplication.storage.get('mpage-storage-data', null);
  },

  getNextPageId: function() {
    var data = this.getData();
    if (data) {
      data.maxPageId++;
      return data.maxPageId;
    } else {
      return 1;
    }
  },

  getNextWidgetId: function() {
    var data = this.getData();
    if (data) {
      data.maxWidgetId++;
      return data.maxWidgetId;
    } else {
      return 1;
    }
  },

  close: function() {
    // nop
  },

  reset: function() {
    var model = {
      pages: {
        'page-2': {
          pageId: 2,
          title: 'Operating systems',
          parentPageId: null
        },
        'page-3': {
          pageId: 3,
          title: 'Linux',
          parentPageId: 2
        },
        'page-4': {
          pageId: 4,
          title: 'Windows',
          parentPageId: 2
        },
        'page-1': {
          pageId: 1,
          parentPageId: null,
          title: 'Home',
          widgets: [
              { widgetId: 1,
                panelId: 1,
                url: 'http://blog.mozilla.com/feed/',
                title: 'http://blog.mozilla.com/feed/',
                entriesToShow: 5 },
              { widgetId: 2,
                panelId: 1,
                url: 'http://www.reddit.com/r/worldnews/',
                title: 'http://www.reddit.com/r/worldnews/',
                entriesToShow: 5 },
              { widgetId: 3,
                panelId: 2,
                url: 'http://rss.slashdot.org/Slashdot/slashdot',
                title: 'Slashdot',
                entriesToShow: 5 },
              { widgetId: 4,
                panelId: 2,
                url: 'http://feeds.wired.com/wired/index',
                title: 'Wired Top Stories',
                entriesToShow: 5 },
              { widgetId: 5,
                panelId: 3,
                url: 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml',
                title: 'NYT > Home Page',
                entriesToShow: 5 },
              { widgetId: 6,
                panelId: 3,
                url: 'http://feeds.guardian.co.uk/theguardian/rss',
                title: 'The Guardian World News',
                entriesToShow: 5 } 
          ]
        }
      }           
    };
    this.writeToFile(model, true);
  },

  writeToFile: function(model, synchronous) {
    var ostream = FileUtils.openSafeFileOutputStream(this.file)  
    var data = JSON.stringify(model);  
    
    if (synchronous) {
      ostream.write(data, data.length)
      FileUtils.closeSafeFileOutputStream(ostream); 
    } else {
      mpagespace.unicodeConverter.charset = "UTF-8";  
      var istream = mpagespace.unicodeConverter.convertToInputStream(data);  
      NetUtil.asyncCopy(istream, ostream, function(status) {  
        if (!Components.isSuccessCode(status)) {  
          mpagespace.dump('Error in model saving.');
          return;  
        }  
        FileUtils.closeSafeFileOutputStream(ostream); 
        mpagespace.dump('Storage has saved the data.');
        mpagespace.observerService.notifyObservers(null, 'mpage-storage-changed', 'data-saved');  
      });    
    }
  }
}


