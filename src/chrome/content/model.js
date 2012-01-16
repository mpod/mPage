if (!mpage.model) mpage.model = {};
else if (typeof mpage.model != 'object')
  throw new Error('mpage.model already exists and is not an object');

Components.utils.import("resource://gre/modules/Services.jsm");  
Components.utils.import("resource://gre/modules/FileUtils.jsm");  
      
mpage.model = {
  widgets: {},

  layout: {},

  tempIdSeq: 0,

  conn: null,

  getNextTempId: function() {
    mpage.model.tempIdSeq++;
    return 'temp-' + mpage.model.tempIdSeq;
  },

  getWidget: function(id) {
    var widget = mpage.model.widgets[id];   
    return widget;
  },
  
  save: function(widget) {
    var self = mpage.model;
    var statements = [];

    if (widget.deleted) { 
      stmt = self.conn.createStatement("delete from feeds where id = :id");
      stmt.params.id = widget.id;  
      statements.push(stmt);
    } else {
      var panel = self.layout[widget.panelId]; 
      for (var i=0; i<panel.length; i++) {
        let stmt = null;
        if (panel[i] == widget.id) {
          if ((widget.id + '').indexOf('temp') != -1) {
            stmt = self.conn.createStatement("insert into feeds values (null, :url, :title, :entries_to_show, :panel_id, :order_number)");
          } else {
            stmt = self.conn.createStatement([
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
          stmt = self.conn.createStatement("update feeds set order_number = :order_number where id = :id");
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
          if (self.widgets[widget.id]) delete self.widgets[widget.id];
          widget.id = self.conn.lastInsertRowID;
          self.widgets[widget.id] = widget;
          panel[i] = widget.id;
          mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-changed-id:' + self.conn.lastInsertRowID + ':' + widget.id);  
        }
      }
    }
    self.conn.executeAsync(statements, statements.length, {
      handleResult: function(result) { },
      handleError: function(error) { },
      handleCompletion: function(reason) { 
        if (reason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
          mpage.dump('Async execution ended.');
        } 
      }
    });
    mpage.dump('Model has been saved.');
  },

  insertToPanel: function(widget, panelId, refWidget) {
    var self = mpage.model;
    var panel, index;

    if (refWidget && refWidget.id == widget.id) return;

    self.removeFromPanel(widget);

    panel = self.layout[panelId];
    widget.panelId = panelId;
    index = refWidget ? null : panel.length;
    for (var i=0; i<panel.length && refWidget; i++) {
      if (panel[i] == refWidget.id) {
        index = i;
      }  
    } 
    if (index == null) throw new Error('Invalid model - reference widget not in panel.');
    panel.splice(index, 0, widget.id);
    self.save(widget);
    mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-inserted-to-panel:' + widget.id);  
  },

  removeFromPanel: function(widget) {
    var self = mpage.model;
    var panel, index;

    if (widget.panelId != null) {
      panel = self.layout[widget.panelId];
      index = null;
      for (var i=0; i<panel.length; i++) {
        if (panel[i] == widget.id) {
          index = i;
          break;
        }  
      } 
      if (index == null) throw new Error('Invalid model - widget not in panel.');
      panel.splice(index, 1);
    }   
  },
  
  remove: function(widget) {
    var self = mpage.model;
    var panel, index;

    self.removeFromPanel(widget);
    widget.deleted = true;
    self.save(widget);
    mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-removed:' + widget.id);  
  },

  load: function() {
    var self = mpage.model;
    let file = FileUtils.getFile('ProfD', ['mpage.sqlite']);  
    self.conn = Services.storage.openDatabase(file); 

    if (!self.conn.tableExists('feeds')) {
      self.createSchema(self.conn);
      self.fillTestData(self.conn);
    } else {
      //self.conn.executeSimpleSQL("delete from feeds");                
      //self.fillTestData(self.conn);
    }

    var stmt = self.conn.createStatement("select * from feeds order by panel_id, order_number");  
    stmt.executeAsync({
      handleResult: function(result) {
        for (let row = result.getNextRow(); row; row = result.getNextRow()) {
          var panelId = row.getResultByName('panel_id');
          var feed = new mpage.feed(row.getResultByName('id'), row.getResultByName('url'), panelId, row.getResultByName('entries_to_show'));
          mpage.model.widgets[feed.id] = feed;
          if (mpage.model.layout[panelId]) {
            mpage.model.layout[panelId].push(feed.id);
          } else {
            mpage.model.layout[panelId] = [feed.id];
          }    
          feed.load();
        }
      },
      handleError: function(error) {
      },
      handleCompletion: function(reason) {
        if (reason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
          mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'model-loaded');  
        } 
      }
    });
  },

  reset: function() {
    mpage.model.conn.executeSimpleSQL("delete from feeds");                
    mpage.model.fillTestData(mpage.model.conn);
  },

  close: function() {
    mpage.model.conn.asyncClose();
  },

  createSchema: function(conn) {
    conn.executeSimpleSQL([
        "create table feeds (",
        "id integer primary key, ",
        "url text not null, ",
        "title text, ",
        "entries_to_show integer, ",
        "panel_id integer not null, ",
        "order_number integer not null)"
      ].join(''));                
  },

  fillTestData: function(conn) {
    conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml','NYT > Home Page',5,3,0);");
    conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://feeds.wired.com/wired/index','Wired Top Stories',5,2,1);");
    conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://www.reddit.com/r/worldnews/','http://www.reddit.com/r/worldnews/',5,1,2);");
    conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://feeds.guardian.co.uk/theguardian/rss','The Guardian World News',5,3,1);");
    conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://rss.slashdot.org/Slashdot/slashdot','Slashdot',5,2,0);");
    conn.executeSimpleSQL("INSERT INTO feeds VALUES(null,'http://blog.mozilla.com/feed/','http://blog.mozilla.com/feed/',5,1,1);");
  },
}



