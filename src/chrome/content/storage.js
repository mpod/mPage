if (!mpagespace.storage) mpagespace.storage = {};
else if (typeof mpagespace.storage != 'object')
  throw new Error('mpagespace.storage already exists and is not an object');

Components.utils.import("resource://gre/modules/Services.jsm");  
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

mpagespace.storage.sqlite = function() {
  let file = FileUtils.getFile('ProfD', ['mpage.extension.sqlite']);  
  this.conn = Services.storage.openDatabase(file); 
  if (!this.conn.tableExists('feeds')) {
    this.conn.executeSimpleSQL([
        "create table feeds (",
        "id integer primary key, ",
        "url text not null, ",
        "title text, ",
        "entries_to_show integer, ",
        "panel_id integer not null, ",
        "order_number integer not null)"
      ].join(''));
    this.reset();
  }
  return this;
}


mpagespace.storage.sqlite.prototype = {
  save: function(widget) {
    var statements = [];

    if (widget.deleted) { 
      stmt = this.conn.createStatement("delete from feeds where id = :id");
      stmt.params.id = widget.id;  
      statements.push(stmt);
    } else {
      var panel = mpagespace.model.layout[widget.panelId]; 
      for (var i=0; i<panel.length; i++) {
        let stmt = null;
        if (panel[i] == widget.id) {
          if ((widget.id + '').indexOf('temp') != -1) {
            stmt = this.conn.createStatement("insert into feeds values (null, :url, :title, :entries_to_show, :panel_id, :order_number)");
          } else {
            stmt = this.conn.createStatement([
                "update feeds set ",
                "url = :url, ",
                "title = :title, ",
                "entries_to_show = :entries_to_show, ",
                "panel_id = :panel_id, ",
                "order_number = :order_number ",
                "where id = :id"
              ].join(''));
            stmt.params.id = widget.id;
          }
          stmt.params.url = widget.url;
          stmt.params.title = widget.title;
          stmt.params.entries_to_show = widget.entriesToShow;
          stmt.params.panel_id = widget.panelId;
          stmt.params.order_number = i;
        } else {
          stmt = this.conn.createStatement("update feeds set order_number = :order_number where id = :id");
          stmt.params.order_number = i;
          stmt.params.id = panel[i];
        }

        if ((widget.id + '').indexOf('temp') != -1) {
          stmt.execute();  
          stmt.finalize();
        } else {
          statements.push(stmt);
        }

        if (panel[i] == widget.id && (widget.id + '').indexOf('temp') != -1) { 
          if (mpagespace.model.widgets[widget.id]) delete mpagespace.model.widgets[widget.id];
          widget.id = this.conn.lastInsertRowID;
          mpagespace.model.widgets[widget.id] = widget;
          panel[i] = widget.id;
          mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-changed-id:' + this.conn.lastInsertRowID + ':' + widget.id);  
        }
      }
    }
    this.conn.executeAsync(statements, statements.length, {
      handleResult: function(result) { },
      handleError: function(error) { },
      handleCompletion: function(reason) { 
        if (reason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
          mpagespace.dump('Async execution ended.');
        } 
      }
    });
    mpagespace.dump('Model has been saved.');
  },

  load: function() {
    mpagespace.model.widgets = {};
    mpagespace.model.layout = {};
    var stmt = this.conn.createStatement("select * from feeds order by panel_id, order_number");  
    stmt.executeAsync({
      handleResult: function(result) {
        for (let row = result.getNextRow(); row; row = result.getNextRow()) {
          var panelId = row.getResultByName('panel_id');
          var feed = new mpagespace.feed(row.getResultByName('id'), row.getResultByName('url'), panelId, row.getResultByName('entries_to_show'));
          mpagespace.model.widgets[feed.id] = feed;
          if (mpagespace.model.layout[panelId]) {
            mpagespace.model.layout[panelId].push(feed.id);
          } else {
            mpagespace.model.layout[panelId] = [feed.id];
          }    
          feed.load();
        }
      },
      handleError: function(error) {
      },
      handleCompletion: function(reason) {
        if (reason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
          mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'model-loaded');  
        } 
      }
    });
  },

  reset: function() {
    this.conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml','NYT > Home Page',5,3,0);");
    this.conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://feeds.wired.com/wired/index','Wired Top Stories',5,2,1);");
    this.conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://www.reddit.com/r/worldnews/','http://www.reddit.com/r/worldnews/',5,1,2);");
    this.conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://feeds.guardian.co.uk/theguardian/rss','The Guardian World News',5,3,1);");
    this.conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://rss.slashdot.org/Slashdot/slashdot','Slashdot',5,2,0);");
    this.conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://blog.mozilla.com/feed/','http://blog.mozilla.com/feed/',5,1,1);");
  },

  close: function() {
    this.conn.asyncClose();
  }
}

mpagespace.storage.json = function() {
  this.file = FileUtils.getFile('ProfD', ['mpage.extension.json']);  
  if (!this.file.exists()) {
    this.reset();
  }
}

mpagespace.storage.json.prototype = {
  save: function() {
    var model = {}, i, widget;
    var maxId = -1;

    for (var widgetId in mpagespace.model.widgets) {
      if ((widgetId + '').indexOf('temp') == -1 && parseInt(widgetId) > maxId) maxId = widgetId;
    }

    for(var panelId in mpagespace.model.layout) {
      var panel = mpagespace.model.layout[panelId];  
      model[panelId] = [];
      for (i=0; i<panel.length; i++) {
        widget = mpagespace.model.widgets[panel[i]];
        if ((widget.id + '').indexOf('temp') != -1) {
          if (mpagespace.model.widgets[widget.id]) delete mpagespace.model.widgets[widget.id];
          maxId++;
          widget.id = maxId;
          mpagespace.model.widgets[widget.id] = widget;
          panel[i] = widget.id;
          mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-changed-id:' + widget.id + ':' + widget.id);  
        }
        model[panelId].push({
          id: widget.id,
          url: widget.url,
          title: widget.title,
          entriesToShow: widget.entriesToShow
        });
      }
    }

    this.writeToFile(model);
  },

  load: function() {
    mpagespace.model.widgets = {};
    mpagespace.model.layout = {};

    var channel = NetUtil.newChannel(this.file);  
    channel.contentType = "application/json";  
    NetUtil.asyncFetch(this.file, function(inputStream, status) {  
      if (!Components.isSuccessCode(status)) {  
        mpagespace.dump('Error in model loading.');
        return;  
      }  
  
      var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());  
      var model = JSON.parse(data);
      for (var panelId in model) {      
        for (var i=0; i<model[panelId].length; i++) {
          var w = model[panelId][i];
          var widget = new mpagespace.feed(w.id, w.url, panelId, w.entriesToShow);
          mpagespace.model.widgets[widget.id] = widget;
          if (mpagespace.model.layout[panelId]) {
            mpagespace.model.layout[panelId].push(widget.id);
          } else {
            mpagespace.model.layout[panelId] = [widget.id];
          }    
          widget.load();
        }
      }
      mpagespace.observerService.notifyObservers(null, 'mpage-model-changed', 'model-loaded');  
    });  
  },

  close: function() {
    // nop
  },

  reset: function() {
    var model = {
      '1': [
        { id: 1,
          url: 'http://blog.mozilla.com/feed/',
          title: 'http://blog.mozilla.com/feed/',
          entriesToShow: 5 },
        { id: 2,
          url: 'http://www.reddit.com/r/worldnews/',
          title: 'http://www.reddit.com/r/worldnews/',
          entriesToShow: 5 } ],
      '2': [
        { id: 3,
          url: 'http://rss.slashdot.org/Slashdot/slashdot',
          title: 'Slashdot',
          entriesToShow: 5 },
        { id: 4,
          url: 'http://feeds.wired.com/wired/index',
          title: 'Wired Top Stories',
          entriesToShow: 5 } ],
      '3': [
        { id: 5,
          url: 'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml',
          title: 'NYT > Home Page',
          entriesToShow: 5 },
        { id: 6,
          url: 'http://feeds.guardian.co.uk/theguardian/rss',
          title: 'The Guardian World News',
          entriesToShow: 5 } ]
    };
    this.writeToFile(model, true);
  },

  writeToFile: function(model, synchronous) {
    var ostream = FileUtils.openSafeFileOutputStream(this.file)  
    var data = JSON.stringify(model);  
    
    if (synchronous) {
      ostream.write(data, data.length)
    } else {
      mpagespace.unicodeConverter.charset = "UTF-8";  
      var istream = mpagespace.unicodeConverter.convertToInputStream(data);  
      NetUtil.asyncCopy(istream, ostream, function(status) {  
        if (!Components.isSuccessCode(status)) {  
          mpagespace.dump('Error in model saving.');
          return;  
        }  
        mpagespace.dump('Model has been saved.');
        FileUtils.closeSafeFileOutputStream(ostream); 
      });    
    }
  }
}


