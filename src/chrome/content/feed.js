// Author: Matija Podravec, 2012.

if (!mpagespace.model.feed) mpagespace.model.feed = {};
else if (typeof mpagespace.model.feed != 'object')
  throw new Error('mpagespace.feed already exists and is not an object');

mpagespace.model.feed = function(data, page) {
  this.url = data.url;
  this.title = data.title;
  this.id = data.widgetId;
  this.panelId = data.panelId;
  this.entriesToShow = data.entriesToShow ? data.entriesToShow : 5;
  this.hoursFilter = data.hoursFilter ? data.hoursFilter : 0;
  this.minimized = data.minimized ? true : false;
  this.entries = [];
  this.page = page;
  this.model = page.model;
  this.state = 'BLANK';  // possible values: BLANK, INITIALIZED, LOADING, ERROR, EXCEPTION, SUBSCRIBING
  this.dirty = false;
}

mpagespace.model.feed.prototype = {
  getConfig: function() {
    return {
      widgetId: this.id,
      panelId: this.panelId,
      title: this.title,
      url: this.url,
      hoursFilter: this.hoursFilter,
      entriesToShow: this.entriesToShow,
      minimized: this.minimized
    };      
  },

  isDirty: function() {
    return this.dirty == true;
  },

  isInitialized: function() {
    return ['INITIALIZED', 'ERROR'].indexOf(this.state) != -1;
  },

  isInError: function() {
    return this.state == 'ERROR';
  },

  set: function(property, value) {
    this[property] = value;
    this.setDirty();
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-changed:' + this.id + ':' + property);  
  },

  setBulk: function(config) {
    for (property in config){
      this[property] = config[property];
    }
    this.setDirty();
    mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-changed:' + this.id);  
  },

  setDirty: function() {
    this.dirty = true;
    this.page.setDirty();
  },

  getEntriesToShow: function() {
    if (this.hoursFilter > 0) {
      var filter = (new Date()).getTime() - this.hoursFilter * 60 * 60 * 1000;
      var result = [];
      for (var i=0; i<this.entries.length; i++) {
        var e = this.entries[i];
        if (e.date.getTime() > filter)
          result.push(e);
        if (result.length >= this.entriesToShow)
          break;
      }    
      return result;
    } else {
      return this.entries.slice(0, this.entriesToShow);
    }
  },

  releaseMemory: function() {
    this.entries = [];
    this.state = 'BLANK';
  },

  load: function(subscribing) {
    var self = this;

    var errorHandler = function() {
        self.state = 'ERROR';
        mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-error:' + self.id);  
        mpagespace.dump('Error occured on loading feed ' + self.id + '.');
    }

    var processHandler = function(request) {
      /* XPCOM implementation seems too slow...  
      var ioService = Components.classes['@mozilla.org/network/io-service;1']
                        .getService(Components.interfaces.nsIIOService);
      var uri = mpage.ioService.newURI(self.url, null, null);
      var feedResultListener = {
        handleResult: function(result) {
          var feed = result.doc;
          feed.QueryInterface(Components.interfaces.nsIFeed);
          console.log(feed);
		    }
      }
      try {
        var feedProcessor = Components.classes["@mozilla.org/feed-processor;1"]
                              .createInstance(Components.interfaces.nsIFeedProcessor);
        feedProcessor.listener = {
          handleResult: function(result) {
            var feed = result.doc;
            feed.QueryInterface(Components.interfaces.nsIFeed);
            console.log(feed);
          }
        } 
        feedProcessor.parseFromString(request.responseText, uri);
      }
      catch(e) {
        console.log('Error parsing feed.', e);
      }*/

      try {
        if (self.url.indexOf('reddit.com') != -1 && self.url.indexOf('.rss') == -1) {
          self.siteUrl = self.url;         
          self.processReddit(request.responseText);
        } else {
          self.process(request.responseText);
        }
        mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-loaded:' + self.id);  
      } catch (e) {
        mpagespace.dump('feed.load: Error - ' + e.message);
        if (self.responseText || ['LOADING', 'EXCEPTION'].indexOf(self.state) != -1) {
          errorHandler();
        } else {
          self.state = 'EXCEPTION';
          self.responseText = request.responseText;
          mpagespace.observerService.notifyObservers(null, 'mpage-model', 'widget-loading-exception:' + self.id);  
          mpagespace.dump('Trying to extract feed URLs from HTML.');
        }
      }
    }

    this.entries = [];
    if (subscribing)
      this.state = 'SUBSCRIBING';
    else if (this.state != 'EXCEPTION')
      this.state = 'LOADING';
    mpagespace.ajax.load(this.url, processHandler, {errorHandler: errorHandler});  
  },

  processReddit: function(htmlText) {
    var htmlDoc = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null);
    var bodyEl = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
    var node;

    htmlDoc.documentElement.appendChild(bodyEl);
    bodyEl.appendChild(mpagespace.htmlService.parseFragment(htmlText, false, null, bodyEl));

    if (this.title == null) {
      this.title = 'reddit: ' + htmlDoc.getElementById('header-img-a').nextSibling.nextSibling.firstChild.firstChild.nodeValue; 
    }
    
    var contentEl = htmlDoc.getElementById('siteTable');
    if (contentEl.childNodes.length < 3) {
      contentEl = contentEl.parentNode.nextSibling.firstChild;
    }
    for (node = contentEl.firstChild; node; node = node.nextSibling) {
      if (node.tagName == 'div' && node.className != 'clearleft') {
        var entryEl = node.childNodes[3];
        if (entryEl.className.indexOf('entry') == -1) entryEl = node.childNodes[4];
        var titleEl = entryEl.firstChild.firstChild;
        var dateEl = entryEl.childNodes[1];
        if (dateEl.className != 'tagline') dateEl = dateEl.nextSibling;
        dateEl = dateEl.childNodes[1];
        var commentsEl = dateEl.parentNode.nextSibling.firstChild.firstChild;
        this.entries.push({
          title: titleEl.firstChild.nodeValue,
          link: commentsEl.getAttribute('href'),  
          link2: titleEl.getAttribute('href'),
          date: new Date(dateEl.getAttribute('datetime')).getTime(),
          content: ''
        });
      }
    }

    this.state = 'INITIALIZED';
  },

  process: function(feedText) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(feedText, 'text/xml');
    var docEl = xmlDoc.documentElement;
    var nodes, node, entry, n;

    var isAtom = docEl.tagName == 'feed';
    var isRSS = docEl.tagName == 'rss';
    var isRdf = docEl.tagName == 'rdf:RDF';

    if (!isAtom && !isRSS && !isRdf) {
			throw new Error('Unsupported feed format.');
  	}

    var channelEl = xmlDoc.getElementsByTagName('channel')[0];
    if (!channelEl) channelEl = xmlDoc;
    if (this.title == null) {
      this.title = channelEl.getElementsByTagName('title')[0].firstChild.nodeValue;
    }
    for (n = channelEl.firstChild; n; n = n.nextSibling){
      if (n.tagName && n.tagName.toLowerCase() == 'link') {
        this.siteUrl = n.firstChild.nodeValue;  
        break;
      }
    }
    var linkEl = channelEl.getElementsByTagName('link');
    if (linkEl) {
      if (linkEl[0] && linkEl[0].getAttribute('href'))
        this.siteUrl = linkEl[0].getAttribute('href');
      else if (linkEl[0]) 
        this.siteUrl = linkEl[0].firstChild.nodeValue;
    }

    if (isRdf) { 
      nodes = xmlDoc.getElementsByTagName('item');
    } else if (isRSS) {
      nodes = channelEl.getElementsByTagName('item');
    } else {
      nodes = channelEl.getElementsByTagName('entry');
    }

    for (var i=0, count = nodes.length; i<count; i++){
      node = nodes[i];
      entry = {};
			entry.readed = false;

      for (var n = node.firstChild; n; n = n.nextSibling) {
        switch (n.tagName) {
          case 'title':
            entry.title = n.firstChild ? n.firstChild.nodeValue : '';
            break;
          case 'summary':
          case 'content:encoded':
            entry.content = n.firstChild ? n.firstChild.nodeValue : '';
            break;
          case 'content':
          case 'description':
            if (!entry.content) entry.content = n.firstChild ? n.firstChild.nodeValue : '';
            break;
          case 'enclosure':
            if (n.getAttribute('type').indexOf('image') == 0) entry.image = n.getAttribute('url');
            break;
          case 'link':
            if (n.getAttribute('rel') == 'enclosure') {
              entry.image = n.getAttribute('href');
            } else {
              if (isAtom) {
                entry.link = n.getAttribute('href');
              } else {
                entry.link = n.firstChild ? n.firstChild.nodeValue : '';
              }
            }
            break;
          case 'updated':
            entry.date = n.firstChild ? new Date(n.firstChild.nodeValue) : null; 
            break;
          case 'modified':
          case 'pubDate':
          case 'dc:date':
            if (!entry.date) entry.date = n.firstChild ? new Date(n.firstChild.nodeValue) : null; 
            break;
        }
      } 
      this.entries.push(entry);
    } 
    this.state = 'INITIALIZED';
  }
}
