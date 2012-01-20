if (!mpage.feed) mpage.feed = {};
else if (typeof mpage.feed != 'object')
  throw new Error('mpage.feed already exists and is not an object');

mpage.feed = function(id, url, panelId, entriesToShow) {
  this.url = url;
  this.title = url;
  this.id = id;
  this.panelId = panelId;
  this.entries = [];
  this.entriesToShow = entriesToShow ? entriesToShow : 5;
  this.initialized = false;
  this.inError = false;
  this.setup = false;
}

mpage.feed.prototype = {
  set: function(property, value) {
    this[property] = value;
    mpage.model.save(this);
    mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-changed-' + property + ':' + this.id);  
  },

  load: function() {
    var self = this;

    var errorHandler = function() {
        self.inError = true;
        self.initialized = true;
        mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-error:' + self.id);  
        mpage.dump('Error occured during feed loading.');
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
        if (self.url.indexOf('reddit.com') != -1) {
          self.siteUrl = self.url;         
          self.processReddit(request.responseText);
        } else {
          self.process(request.responseText);
        }
        mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-loaded:' + self.id);  
      } catch (e) {
        mpage.dump('error: ' + e.message);
        if (self.responseText || self.url.indexOf('reddit.com') != -1 || self.setup == false) {
          errorHandler();
        } else {
          self.responseText = request.responseText;
          mpage.observerService.notifyObservers(null, 'mpage-model-changed', 'widget-error:' + self.id);  
          mpage.dump('Trying to extract feed URLs from HTML.');
        }
      }
    }

    mpage.ajax.load(this.url, processHandler, {errorHandler: errorHandler});  
  },

  processReddit: function(htmlText) {
    var htmlDoc = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null);
    var bodyEl = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
    var node;

    htmlDoc.documentElement.appendChild(bodyEl);
    bodyEl.appendChild(mpage.htmlService.parseFragment(htmlText, false, null, bodyEl));

    this.title = 'reddit: ' + htmlDoc.getElementById('header-img-a').nextSibling.nextSibling.firstChild.firstChild.nodeValue; 
    
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

    this.initialized = true;
    this.inError = false;
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
    this.title = channelEl.getElementsByTagName('title')[0].firstChild.nodeValue;
    for (n = channelEl.firstChild; n; n = n.nextSibling){
      if (n.tagName && n.tagName.toLowerCase() == 'link') {
        this.siteUrl = n.firstChild.nodeValue;  
        break;
      }
    }
    var linkEl = channelEl.getElementsByTagName('link');
    if (linkEl)
      this.siteUrl = linkEl[0].firstChild.nodeValue;

    if (isRdf) { 
      nodes = xmlDoc.getElementsByTagName('item');
    } else if (isRSS) {
      nodes = channelEl.getElementsByTagName('item');
    } else {
      nodes = channelEl.getElementsByTagName('entry');
    }

    for (i=0, count = nodes.length; i<count; i++){
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
            if (isAtom) {
              entry.link = n.getAttribute('href');
            } else {
              entry.link = n.firstChild ? n.firstChild.nodeValue : '';
            }
            break;
          case 'updated':
            entry.date = n.firstChild ? new Date(n.firstChild.nodeValue).getTime() : null; 
            break;
          case 'modified':
          case 'pubDate':
          case 'dc:date':
            if (!entry.date) entry.date = n.firstChild ? new Date(n.firstChild.nodeValue).getTime() : null; 
            break;
        }
      } 
      this.entries.push(entry);
    } 
    this.initialized = true;
    this.inError = false;
  }
}
