if (!mpage.model) mpage.model = {};
else if (typeof mpage.model != 'object')
  throw new Error('mpage.model already exists and is not an object');

mpage.model = {
  widgets: {},

  layout: {},

  tempIdSeq: 0,

  init: function() {
    mpage.storage.getStorage().load();
  },

  close: function() {
    mpage.storage.getStorage().close();
  },

  getNextTempId: function() {
    mpage.model.tempIdSeq++;
    return 'temp-' + mpage.model.tempIdSeq;
  },

  getWidget: function(id) {
    var widget = mpage.model.widgets[id];   
    return widget;
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
    mpage.storage.getStorage().save(widget);
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
    mpage.storage.getStorage().save(widget);
    mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-removed:' + widget.id);  
  },

  reset: function() {
    mpage.storage.getStorage().clear();
    mpage.model.fillTestData(mpage.model.conn);
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



