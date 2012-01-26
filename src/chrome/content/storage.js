if (!mpage.storage) mpage.storage = {};
else if (typeof mpage.storage != 'object')
  throw new Error('mpage.storage already exists and is not an object');

Components.utils.import("resource://gre/modules/Services.jsm");  
Components.utils.import("resource://gre/modules/FileUtils.jsm");  
Components.utils.import("resource://gre/modules/NetUtil.jsm");

mpage.storage = {
  instance: null,

  getStorage: function(flag) {
    return new mpage.storage.json();

    if (flag) {
      if (!mpage.storage.instance) {
        mpage.storage.instance = new mpage.storage.sqlite();
      }
      return mpage.storage.instance;
    } else {
      return new mpage.storage.json();
    }
  } 
}

mpage.storage.sqlite = function() {
  let file = FileUtils.getFile('ProfD', ['mpage.sqlite']);  
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
  }
  return this;
}


mpage.storage.sqlite.prototype = {
  save: function(widget) {
    var statements = [];

    if (widget.deleted) { 
      stmt = this.conn.createStatement("delete from feeds where id = :id");
      stmt.params.id = widget.id;  
      statements.push(stmt);
    } else {
      var panel = mpage.model.layout[widget.panelId]; 
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
          if (mpage.model.widgets[widget.id]) delete mpage.model.widgets[widget.id];
          widget.id = this.conn.lastInsertRowID;
          mpage.model.widgets[widget.id] = widget;
          panel[i] = widget.id;
          mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-changed-id:' + this.conn.lastInsertRowID + ':' + widget.id);  
        }
      }
    }
    this.conn.executeAsync(statements, statements.length, {
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

  load: function() {
    mpage.model.widgets = {};
    mpage.model.layout = {};
    var stmt = this.conn.createStatement("select * from feeds order by panel_id, order_number");  
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

  clear: function() {
    this.conn.executeSimpleSQL("delete from feeds");                
  },

  close: function() {
    this.conn.asyncClose();
  }
}

mpage.storage.json = function() {
}

mpage.storage.json.prototype = {
  save: function(widget) {
    var model = {}, i;
    
    var maxId = -1;
    for (var widgetId in mpage.model.widgets) {
      if ((widgetId + '').indexOf('temp') == -1 && parseInt(widgetId) > maxId) maxId = widgetId;
    }

    for(var panelId in mpage.model.layout) {
      var panel = mpage.model.layout[panelId];  
      model[panelId] = [];
      for (i=0; i<panel.length; i++) {
        widget = mpage.model.widgets[panel[i]];
        if ((widget.id + '').indexOf('temp') != -1) {
          if (mpage.model.widgets[widget.id]) delete mpage.model.widgets[widget.id];
          maxId++;
          widget.id = maxId;
          mpage.model.widgets[widget.id] = widget;
          panel[i] = widget.id;
          mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-changed-id:' + widget.id + ':' + widget.id);  
        }
        model[panelId].push({
          id: widget.id,
          url: widget.url,
          title: widget.title,
          entriesToShow: widget.entriesToShow
        });
      }
    }

    var file = FileUtils.getFile('ProfD', ['mpage.json']);  
    var ostream = FileUtils.openSafeFileOutputStream(file)  
    mpage.unicodeConverter.charset = "UTF-8";  
    var istream = mpage.unicodeConverter.convertToInputStream(JSON.stringify(model));  
      
    NetUtil.asyncCopy(istream, ostream, function(status) {  
      if (!Components.isSuccessCode(status)) {  
        mpage.dump('Error in model saving.');
        return;  
      }  
      mpage.dump('Model has been saved.');
      FileUtils.closeSafeFileOutputStream(ostream); 
    });  
  },

  load: function() {
    mpage.model.widgets = {};
    mpage.model.layout = {};

    var file = FileUtils.getFile('ProfD', ['mpage.json']);  
    var channel = NetUtil.newChannel(file);  
    channel.contentType = "application/json";  
    NetUtil.asyncFetch(file, function(inputStream, status) {  
      if (!Components.isSuccessCode(status)) {  
        mpage.dump('Error in model loading.');
        return;  
      }  
  
      var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());  
      var model = JSON.parse(data);
      for (var panelId in model) {      
        for (var i=0; i<model[panelId].length; i++) {
          var w = model[panelId][i];
          var widget = new mpage.feed(w.id, w.url, panelId, w.entriesToShow);
          mpage.model.widgets[widget.id] = widget;
          if (mpage.model.layout[panelId]) {
            mpage.model.layout[panelId].push(widget.id);
          } else {
            mpage.model.layout[panelId] = [widget.id];
          }    
          widget.load();
        }
      }
      mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'model-loaded');  
    });  
  },

  close: function() {
    // nop
  }
}


